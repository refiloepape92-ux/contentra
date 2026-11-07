import { Router } from 'express';
import User from '../models/User.js';
import HttpError from '../utils/HttpError.js';
import { requireCreator } from '../middleware/auth.js';
import { parseBody, profileSchema } from '../utils/validation.js';

const router = Router();

router.get('/profile', async (_req, res, next) => {
  try {
    const user = await User.findOne({}).select('displayName bio avatarUrl').lean();
    res.json({ profile: user ? { displayName: user.displayName, bio: user.bio, avatarUrl: user.avatarUrl } : { displayName: 'Creator Studio', bio: 'A home for new stories, ideas, and conversations.', avatarUrl: '' } });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', requireCreator, async (req, res, next) => {
  try {
    const data = parseBody(profileSchema, req.body);
    const user = await User.findByIdAndUpdate(req.creatorId, data, { new: true, runValidators: true }).select('displayName bio avatarUrl');
    if (!user) throw new HttpError(404, 'Creator account not found.');
    res.json({ profile: { displayName: user.displayName, bio: user.bio, avatarUrl: user.avatarUrl } });
  } catch (error) {
    next(error);
  }
});

export default router;
