import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'node:crypto';
import User from '../models/User.js';
import HttpError from '../utils/HttpError.js';
import { loginSchema, parseBody, setupSchema } from '../utils/validation.js';
import { requireCreator } from '../middleware/auth.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many attempts. Please try again later.' } });

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function issueToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new HttpError(503, 'Creator sign-in is not configured yet.');
  return jwt.sign({ role: 'creator' }, secret, { subject: user.id, expiresIn: '8h', algorithm: 'HS256' });
}

router.post('/setup', authLimiter, async (req, res, next) => {
  try {
    const data = parseBody(setupSchema, req.body);
    const setupKey = process.env.OWNER_SETUP_KEY;
    if (!setupKey) throw new HttpError(404, 'First-account setup is disabled.');
    if (!safeEqual(data.setupKey, setupKey)) throw new HttpError(403, 'The setup key is not valid.');
    if (await User.exists({})) throw new HttpError(409, 'A creator account has already been created.');
    const user = await User.create({
      email: data.email.toLowerCase(),
      passwordHash: await bcrypt.hash(data.password, 12),
      displayName: data.displayName,
    });
    const token = issueToken(user);
    res.status(201).json({ token, user: { id: user.id, email: user.email, displayName: user.displayName, bio: user.bio, avatarUrl: user.avatarUrl } });
  } catch (error) {
    next(error);
  }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const data = parseBody(loginSchema, req.body);
    const user = await User.findOne({ email: data.email.toLowerCase() }).select('+passwordHash');
    const valid = user ? await bcrypt.compare(data.password, user.passwordHash) : false;
    if (!valid) throw new HttpError(401, 'Email or password is incorrect.');
    const token = issueToken(user);
    res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName, bio: user.bio, avatarUrl: user.avatarUrl } });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireCreator, async (req, res, next) => {
  try {
    const user = await User.findById(req.creatorId).lean();
    if (!user) throw new HttpError(401, 'Creator account not found. Please sign in again.');
    res.json({ user: { id: user._id, email: user.email, displayName: user.displayName, bio: user.bio, avatarUrl: user.avatarUrl } });
  } catch (error) {
    next(error);
  }
});

export default router;
