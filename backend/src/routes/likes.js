import { Router } from 'express';
import mongoose from 'mongoose';
import Like from '../models/Like.js';
import Content from '../models/Content.js';
import HttpError from '../utils/HttpError.js';
import { likeSchema, parseBody } from '../utils/validation.js';
import { notifyCreator, notifyViewer } from '../utils/notify.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { contentId, viewerKey } = req.query;
    if (typeof contentId !== 'string' || !mongoose.isValidObjectId(contentId) || typeof viewerKey !== 'string' || viewerKey.length < 12 || viewerKey.length > 120) {
      throw new HttpError(400, 'A valid content item and viewer are required.');
    }
    const isPublic = await Content.exists({ _id: contentId, status: 'Published', publishedAt: { $lte: new Date() } });
    if (!isPublic) throw new HttpError(404, 'This published content could not be found.');
    const [liked, likesCount] = await Promise.all([
      Like.exists({ contentId, viewerKey }),
      Like.countDocuments({ contentId }),
    ]);
    res.json({ liked: Boolean(liked), likesCount });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = parseBody(likeSchema, req.body);
    const content = await Content.findOne({ _id: data.contentId, status: 'Published', publishedAt: { $lte: new Date() } }).select('_id title authorType viewerId');
    if (!content) throw new HttpError(404, 'This published content could not be found.');
    const existing = await Like.findOneAndDelete({ contentId: data.contentId, viewerKey: data.viewerKey });
    let liked = false;
    if (!existing) {
      await Like.create({ contentId: data.contentId, viewerKey: data.viewerKey });
      liked = true;
      await notifyCreator({ type: 'like', actorName: 'A viewer', contentId: data.contentId, message: `Someone liked “${content.title}”.` });
      if (content.authorType === 'viewer' && content.viewerId) {
        await notifyViewer(content.viewerId, {
          type: 'post_like',
          actorName: 'A reader',
          contentId: content._id,
          message: `Someone liked your post “${content.title}”.`,
        });
      }
    }
    const likesCount = await Like.countDocuments({ contentId: data.contentId });
    res.json({ liked, likesCount });
  } catch (error) {
    next(error);
  }
});

export default router;
