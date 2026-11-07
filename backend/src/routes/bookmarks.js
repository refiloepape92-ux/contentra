import { Router } from 'express';
import mongoose from 'mongoose';
import Bookmark from '../models/Bookmark.js';
import Content from '../models/Content.js';
import HttpError from '../utils/HttpError.js';
import { requireViewer } from '../middleware/viewerAuth.js';
const router = Router();
router.use(requireViewer);
router.get('/', async (req, res, next) => {
  try {
    const rows = await Bookmark.find({ viewerId: req.viewerId }).sort({ createdAt: -1 }).populate({
      path: 'contentId', match: { status: 'Published', publishedAt: { $lte: new Date() } },
      select: 'title description category contentType thumbnailUrl publishedAt views'
    }).lean();
    res.json({ bookmarks: rows.filter((row) => row.contentId) });
  } catch (error) { next(error); }
});
router.post('/:contentId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.contentId)) throw new HttpError(400, 'Invalid content identifier.');
    const content = await Content.findOne({ _id: req.params.contentId, status: 'Published', publishedAt: { $lte: new Date() } }).select('_id');
    if (!content) throw new HttpError(404, 'Only published content can be saved.');
    await Bookmark.updateOne({ viewerId: req.viewerId, contentId: content._id }, { $setOnInsert: { viewerId: req.viewerId, contentId: content._id } }, { upsert: true });
    res.status(201).json({ saved: true });
  } catch (error) { next(error); }
});
router.delete('/:contentId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.contentId)) throw new HttpError(400, 'Invalid content identifier.');
    await Bookmark.deleteOne({ viewerId: req.viewerId, contentId: req.params.contentId });
    res.json({ saved: false });
  } catch (error) { next(error); }
});
export default router;
