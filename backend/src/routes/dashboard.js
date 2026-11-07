import { Router } from 'express';
import Content from '../models/Content.js';
import Comment from '../models/Comment.js';
import Viewer from '../models/Viewer.js';
import { requireCreator } from '../middleware/auth.js';
import { publishDueContent } from '../utils/scheduled.js';

const router = Router();

router.get('/stats', requireCreator, async (_req, res, next) => {
  try {
    await publishDueContent();
    const [total, published, drafts, scheduled, comments, viewers, views, popular] = await Promise.all([
      Content.countDocuments(),
      Content.countDocuments({ status: 'Published', publishedAt: { $lte: new Date() } }),
      Content.countDocuments({ status: 'Draft' }),
      Content.countDocuments({ status: 'Scheduled' }),
      Comment.countDocuments(),
      Viewer.countDocuments(),
      Content.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      Content.find({ status: 'Published' }).sort({ views: -1 }).limit(1).select('title views').lean(),
    ]);
    res.json({ stats: { total, published, drafts, scheduled, comments, viewers, views: views[0]?.total || 0, popularContent: popular[0] || null } });
  } catch (error) {
    next(error);
  }
});

export default router;
