import { Router } from 'express';
import mongoose from 'mongoose';
import Content from '../models/Content.js';
import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import HttpError from '../utils/HttpError.js';
import { requireCreator } from '../middleware/auth.js';
import { contentSchema, parseBody } from '../utils/validation.js';
import { publishDueContent } from '../utils/scheduled.js';
import { requireViewer } from '../middleware/viewerAuth.js';
import Viewer from '../models/Viewer.js';
import { notifyCreator, notifyViewer } from '../utils/notify.js';

const router = Router();
const idIsValid = (id) => mongoose.isValidObjectId(id);

function publicContent(item) {
  return {
    _id: item._id,
    title: item.title,
    description: item.description,
    category: item.category,
    contentType: item.contentType,
    thumbnailUrl: item.thumbnailUrl,
    mediaUrl: item.mediaUrl,
    body: item.body,
    authorType: item.authorType || 'creator',
    authorName: item.authorType === 'viewer' ? item.authorName : '',
    status: item.status,
    publishedAt: item.publishedAt,
    isFeatured: Boolean(item.isFeatured && item.authorType !== 'viewer'),
    views: item.views || 0,
    createdAt: item.createdAt,
    ...(item.likes !== undefined ? { likes: item.likes } : {}),
    ...(item.comments !== undefined ? { comments: item.comments } : {}),
  };
}

function normalizeContent(data) {
  const result = { ...data };
  result.publishedAt = result.publishedAt ? new Date(result.publishedAt) : null;
  if (result.status === 'Published' && !result.publishedAt) result.publishedAt = new Date();
  if (result.status === 'Draft') result.isFeatured = false;
  return result;
}

router.get('/manage', requireCreator, async (req, res, next) => {
  try {
    const items = await Content.find().sort({ updatedAt: -1 }).lean();
    const commentCounts = await Comment.aggregate([
      { $group: { _id: '$contentId', count: { $sum: 1 } } },
    ]);
    const counts = new Map(commentCounts.map((item) => [String(item._id), item.count]));
    res.json({ contents: items.map((item) => ({ ...item, commentCount: counts.get(String(item._id)) || 0 })) });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireCreator, async (req, res, next) => {
  try {
    const data = normalizeContent(parseBody(contentSchema, req.body));
    const content = await Content.create(data);
    res.status(201).json({ content });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    await publishDueContent();
    const filter = { authorType: { $ne: 'viewer' }, status: 'Published', publishedAt: { $lte: new Date() } };
    if (typeof req.query.category === 'string' && req.query.category.trim()) {
      filter.category = req.query.category.trim().slice(0, 60);
    }
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const search = req.query.search.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(search, 'i');
      filter.$or = [{ title: regex }, { description: regex }, { category: regex }];
    }
    const contents = await Content.find(filter).sort({ isFeatured: -1, publishedAt: -1, createdAt: -1 }).lean();
    const ids = contents.map((item) => item._id);
    const [likes, comments] = await Promise.all([
      Like.aggregate([{ $match: { contentId: { $in: ids } } }, { $group: { _id: '$contentId', count: { $sum: 1 } } }]),
      Comment.aggregate([{ $match: { contentId: { $in: ids }, status: 'Approved' } }, { $group: { _id: '$contentId', count: { $sum: 1 } } }]),
    ]);
    const likesById = new Map(likes.map((row) => [String(row._id), row.count]));
    const commentsById = new Map(comments.map((row) => [String(row._id), row.count]));
    res.json({ contents: contents.map((item) => publicContent({ ...item, likes: likesById.get(String(item._id)) || 0, comments: commentsById.get(String(item._id)) || 0 })) });
  } catch (error) {
    next(error);
  }
});

// Approved viewer submissions are shown separately from the creator's own home feed.
router.get('/community', async (req, res, next) => {
  try {
    await publishDueContent();
    const filter = { authorType: 'viewer', status: 'Published', publishedAt: { $lte: new Date() } };
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const search = req.query.search.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ title: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }, { authorName: new RegExp(search, 'i') }];
    }
    const items = await Content.find(filter).sort({ publishedAt: -1 }).lean();
    res.json({ contents: items.map(publicContent) });
  } catch (error) { next(error); }
});

// Viewer submissions always enter moderation as Pending; viewers cannot publish directly.
router.post('/viewer', requireViewer, async (req, res, next) => {
  try {
    const data = parseBody(contentSchema, { ...req.body, status: 'Draft', isFeatured: false, publishedAt: null });
    const viewer = await Viewer.findById(req.viewerId).select('name');
    if (!viewer) throw new HttpError(401, 'Viewer account not found.');
    const content = await Content.create({ ...data, status: 'Pending', authorType: 'viewer', viewerId: viewer._id, authorName: viewer.name, publishedAt: null, isFeatured: false });
    await notifyCreator({ type: 'viewer_posted', actorName: viewer.name, contentId: content._id, message: `${viewer.name} submitted “${content.title}” for approval.` });
    res.status(201).json({ content, message: 'Your post was submitted and is waiting for creator approval.' });
  } catch (error) { next(error); }
});

router.patch('/:id/moderate', requireCreator, async (req, res, next) => {
  try {
    if (!idIsValid(req.params.id)) throw new HttpError(400, 'The content identifier is invalid.');
    const { decision } = req.body || {};
    if (!['approve', 'reject'].includes(decision)) throw new HttpError(400, 'Choose approve or reject.');
    const nextStatus = decision === 'approve' ? 'Published' : 'Rejected';
    const content = await Content.findOneAndUpdate(
      { _id: req.params.id, authorType: 'viewer', status: { $ne: nextStatus } },
      { $set: { status: nextStatus, publishedAt: decision === 'approve' ? new Date() : null } },
      { new: true, runValidators: true },
    );
    if (!content) {
      const current = await Content.findOne({ _id: req.params.id, authorType: 'viewer' }).lean();
      if (!current) throw new HttpError(404, 'Viewer submission not found.');
      if (current.status === nextStatus) {
        return res.json({ content: current, message: `This viewer post is already ${nextStatus === 'Published' ? 'published' : 'rejected'}.` });
      }
      throw new HttpError(409, 'This viewer post changed while it was being reviewed. Refresh and try again.');
    }
    if (decision === 'approve') {
      await notifyCreator({ type: 'viewer_post_approved', actorName: content.authorName, contentId: content._id, message: `You approved “${content.title}” by ${content.authorName}.` });
      await notifyViewer(content.viewerId, { type: 'viewer_post_approved', actorName: 'Creator Hub', contentId: content._id, message: `Your post “${content.title}” was approved and is now published.` });
    } else {
      await notifyViewer(content.viewerId, { type: 'viewer_post_rejected', actorName: 'Creator Hub', contentId: content._id, message: `Your post “${content.title}” was not approved for publication.` });
    }
    res.json({ content, message: decision === 'approve' ? 'Viewer post approved and published.' : 'Viewer post rejected.' });
  } catch (error) { next(error); }
});

router.post('/:id/view', async (req, res, next) => {
  try {
    if (!idIsValid(req.params.id)) throw new HttpError(400, 'The content identifier is invalid.');
    await publishDueContent();
    const content = await Content.findOneAndUpdate(
      { _id: req.params.id, status: 'Published', publishedAt: { $lte: new Date() } },
      { $inc: { views: 1 } },
      { new: true, projection: { views: 1 } },
    ).lean();
    if (!content) throw new HttpError(404, 'This published content could not be found.');
    res.json({ views: content.views });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!idIsValid(req.params.id)) throw new HttpError(400, 'The content identifier is invalid.');
    await publishDueContent();
    const filter = { _id: req.params.id, status: 'Published', publishedAt: { $lte: new Date() } };
    const content = await Content.findOne(filter).lean();
    if (!content) throw new HttpError(404, 'This published content could not be found.');
    const [likes, comments] = await Promise.all([
      Like.countDocuments({ contentId: content._id }),
      Comment.countDocuments({ contentId: content._id, status: 'Approved' }),
    ]);
    res.json({ content: publicContent({ ...content, likes, comments }) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireCreator, async (req, res, next) => {
  try {
    if (!idIsValid(req.params.id)) throw new HttpError(400, 'The content identifier is invalid.');
    const data = normalizeContent(parseBody(contentSchema, req.body));
    const content = await Content.findOneAndUpdate({ _id: req.params.id, authorType: { $ne: 'viewer' } }, data, { new: true, runValidators: true });
    if (!content) throw new HttpError(404, 'Content item not found.');
    res.json({ content });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireCreator, async (req, res, next) => {
  try {
    if (!idIsValid(req.params.id)) throw new HttpError(400, 'The content identifier is invalid.');
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) throw new HttpError(404, 'Content item not found.');
    await Promise.all([
      Comment.deleteMany({ contentId: content._id }),
      Like.deleteMany({ contentId: content._id }),
    ]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
