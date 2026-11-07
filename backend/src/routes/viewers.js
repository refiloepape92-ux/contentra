import { Router } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Viewer from '../models/Viewer.js';
import Content from '../models/Content.js';
import Like from '../models/Like.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import { requireViewer } from '../middleware/viewerAuth.js';
import { requireCreator } from '../middleware/auth.js';
import HttpError from '../utils/HttpError.js';
import { notifyCreator } from '../utils/notify.js';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });
const viewerRecipient = (viewerId) => ({ recipientType: 'viewer', recipientViewerId: viewerId });

function publicViewer(viewer) {
  return { id: viewer._id.toString(), name: viewer.name, email: viewer.email, bio: viewer.bio || '', createdAt: viewer.createdAt };
}

function issueToken(viewer) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new HttpError(503, 'Viewer sign-in is not configured.');
  return jwt.sign({ role: 'viewer' }, process.env.JWT_SECRET, { subject: viewer.id, expiresIn: '7d', algorithm: 'HS256' });
}

function serializeNotification(item) {
  return {
    _id: item._id,
    type: item.type,
    message: item.message,
    actorName: item.actorName || '',
    contentId: item.contentId || null,
    read: Boolean(item.read),
    createdAt: item.createdAt,
  };
}

router.post('/register', limiter, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (name.length < 2 || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || password.length > 128) {
      throw new HttpError(400, 'Enter a name, valid email, and password between 10 and 128 characters.');
    }
    if (await Viewer.exists({ email })) throw new HttpError(409, 'An account with this email already exists.');
    const viewer = await Viewer.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    await notifyCreator({ type: 'viewer_registered', actorName: viewer.name, message: `${viewer.name} registered as a viewer.` });
    res.status(201).json({ token: issueToken(viewer), viewer: publicViewer(viewer), message: 'Your viewer account has been created.' });
  } catch (error) {
    if (error?.code === 11000) return next(new HttpError(409, 'An account with this email already exists.'));
    next(error);
  }
});

router.post('/login', limiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const viewer = await Viewer.findOne({ email }).select('+passwordHash');
    if (!viewer || !(await bcrypt.compare(password, viewer.passwordHash))) throw new HttpError(401, 'Email or password is incorrect.');
    res.json({ token: issueToken(viewer), viewer: publicViewer(viewer) });
  } catch (error) { next(error); }
});

router.get('/me', requireViewer, async (req, res, next) => {
  try {
    const viewer = await Viewer.findById(req.viewerId);
    if (!viewer) throw new HttpError(401, 'Viewer account not found.');
    res.json({ viewer: publicViewer(viewer) });
  } catch (error) { next(error); }
});

router.patch('/me', requireViewer, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const bio = String(req.body?.bio || '').trim();
    if (name.length < 2 || name.length > 80 || bio.length > 500) throw new HttpError(400, 'Name must be 2–80 characters and bio no more than 500 characters.');
    const viewer = await Viewer.findByIdAndUpdate(req.viewerId, { name, bio }, { new: true, runValidators: true });
    res.json({ viewer: publicViewer(viewer), message: 'Profile updated.' });
  } catch (error) { next(error); }
});

router.get('/my-posts', requireViewer, async (req, res, next) => {
  try {
    const posts = await Content.find({ authorType: 'viewer', viewerId: req.viewerId })
      .select('title description category contentType thumbnailUrl status publishedAt views createdAt updatedAt')
      .sort({ updatedAt: -1 }).lean();
    const ids = posts.map((post) => post._id);
    const [likeCounts, commentCounts] = await Promise.all([
      Like.aggregate([
        { $match: { contentId: { $in: ids } } },
        { $group: { _id: '$contentId', count: { $sum: 1 } } },
      ]),
      Comment.aggregate([
        { $match: { contentId: { $in: ids } } },
        { $group: {
          _id: '$contentId',
          approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
        } },
      ]),
    ]);
    const likesById = new Map(likeCounts.map((row) => [String(row._id), row.count]));
    const commentsById = new Map(commentCounts.map((row) => [String(row._id), row]));
    res.json({
      posts: posts.map((post) => {
        const counts = commentsById.get(String(post._id));
        return {
          ...post,
          likes: likesById.get(String(post._id)) || 0,
          comments: counts?.approved || 0,
          pendingComments: counts?.pending || 0,
        };
      }),
    });
  } catch (error) { next(error); }
});

router.get('/notifications/unread-count', requireViewer, async (req, res, next) => {
  try {
    const unread = await Notification.countDocuments({ ...viewerRecipient(req.viewerId), read: false });
    res.json({ unread });
  } catch (error) { next(error); }
});

router.get('/notifications', requireViewer, async (req, res, next) => {
  try {
    const filter = viewerRecipient(req.viewerId);
    const [items, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(100).lean(),
      Notification.countDocuments({ ...filter, read: false }),
    ]);
    res.json({ notifications: items.map(serializeNotification), unread });
  } catch (error) { next(error); }
});

router.patch('/notifications/read-all', requireViewer, async (req, res, next) => {
  try {
    await Notification.updateMany({ ...viewerRecipient(req.viewerId), read: false }, { $set: { read: true } });
    res.json({ unread: 0, message: 'All notifications marked as read.' });
  } catch (error) { next(error); }
});

router.patch('/notifications/:id/read', requireViewer, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid notification.');
    const item = await Notification.findOneAndUpdate(
      { _id: req.params.id, ...viewerRecipient(req.viewerId) },
      { $set: { read: true } },
      { new: true },
    ).lean();
    if (!item) throw new HttpError(404, 'Notification not found.');
    res.json({ notification: serializeNotification(item) });
  } catch (error) { next(error); }
});

router.get('/manage', requireCreator, async (_req, res, next) => {
  try {
    const viewers = await Viewer.find().select('name email bio createdAt').sort({ createdAt: -1 }).lean();
    res.json({ viewers });
  } catch (error) { next(error); }
});

export default router;
