import { Router } from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { requireCreator } from '../middleware/auth.js';
import HttpError from '../utils/HttpError.js';

const router = Router();
router.use(requireCreator);
const creatorRecipient = { $or: [{ recipientType: 'creator' }, { recipientType: { $exists: false } }] };

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

router.get('/unread-count', async (_req, res, next) => {
  try {
    const unread = await Notification.countDocuments({ ...creatorRecipient, read: false });
    res.json({ unread });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (_req, res, next) => {
  try {
    const [items, unread] = await Promise.all([
      Notification.find(creatorRecipient).sort({ createdAt: -1 }).limit(150).lean(),
      Notification.countDocuments({ ...creatorRecipient, read: false }),
    ]);
    res.json({ notifications: items.map(serializeNotification), unread });
  } catch (error) {
    next(error);
  }
});

router.patch('/read-all', async (_req, res, next) => {
  try {
    await Notification.updateMany({ ...creatorRecipient, read: false }, { $set: { read: true } });
    res.json({ unread: 0, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid notification.');
    const item = await Notification.findOneAndUpdate({ _id: req.params.id, ...creatorRecipient }, { $set: { read: true } }, { new: true }).lean();
    if (!item) throw new HttpError(404, 'Notification not found.');
    res.json({ notification: serializeNotification(item) });
  } catch (error) {
    next(error);
  }
});

export default router;
