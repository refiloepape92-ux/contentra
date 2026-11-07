import { Router } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import Comment from '../models/Comment.js';
import Content from '../models/Content.js';
import HttpError from '../utils/HttpError.js';
import { requireCreator } from '../middleware/auth.js';
import { commentSchema, parseBody } from '../utils/validation.js';
import { notifyCreator, notifyViewer } from '../utils/notify.js';

const router = Router();
const moderationSchema = (status) => ['Pending', 'Approved', 'Hidden'].includes(status);
const commentLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many comments. Please try again later.' } });

router.get('/manage', requireCreator, async (_req, res, next) => {
  try {
    const comments = await Comment.find().select('-viewerKey').populate('contentId', 'title').sort({ createdAt: -1 }).lean();
    res.json({ comments });
  } catch (error) {
    next(error);
  }
});

router.post('/', commentLimiter, async (req, res, next) => {
  try {
    const data = parseBody(commentSchema, req.body);
    const content = await Content.findOne({ _id: data.contentId, status: 'Published', publishedAt: { $lte: new Date() } }).select('_id title authorType viewerId');
    if (!content) throw new HttpError(404, 'Comments are available only on published content.');
    const comment = await Comment.create({ ...data, contentId: content._id, status: 'Pending' });
    await notifyCreator({ type: 'comment', actorName: data.displayName, contentId: content._id, message: `${data.displayName} commented on “${content.title}”. Review the comment.` });
    if (content.authorType === 'viewer' && content.viewerId) {
      await notifyViewer(content.viewerId, {
        type: 'post_comment',
        actorName: data.displayName,
        contentId: content._id,
        message: `${data.displayName} commented on your post “${content.title}”. The comment is waiting for Creator review.`,
      });
    }
    res.status(201).json({ comment: { id: comment.id, displayName: comment.displayName, text: comment.text, status: comment.status, createdAt: comment.createdAt }, message: 'Your comment was sent for creator review.' });
  } catch (error) {
    next(error);
  }
});

router.get('/:contentId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.contentId)) throw new HttpError(400, 'The content identifier is invalid.');
    const isPublic = await Content.exists({ _id: req.params.contentId, status: 'Published', publishedAt: { $lte: new Date() } });
    if (!isPublic) throw new HttpError(404, 'This published content could not be found.');
    const comments = await Comment.find({ contentId: req.params.contentId, status: 'Approved' }).select('-viewerKey').sort({ createdAt: -1 }).lean();
    res.json({ comments });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', requireCreator, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'The comment identifier is invalid.');
    const { status } = req.body || {};
    if (!moderationSchema(status)) throw new HttpError(400, 'Choose Pending, Approved, or Hidden.');
    const existing = await Comment.findById(req.params.id).select('contentId status');
    if (!existing) throw new HttpError(404, 'Comment not found.');
    const previousStatus = existing.status;
    const comment = await Comment.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!comment) throw new HttpError(404, 'Comment not found.');
    if (status === 'Approved' && previousStatus !== 'Approved') {
      const content = await Content.findOne({ _id: existing.contentId, authorType: 'viewer' }).select('title viewerId');
      if (content?.viewerId) {
        await notifyViewer(content.viewerId, {
          type: 'post_comment_approved',
          actorName: 'Creator Hub',
          contentId: content._id,
          message: `A comment on your post “${content.title}” was approved and is now visible.`,
        });
      }
    }
    res.json({ comment });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireCreator, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'The comment identifier is invalid.');
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) throw new HttpError(404, 'Comment not found.');
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
