import jwt from 'jsonwebtoken';
import HttpError from '../utils/HttpError.js';

export function requireCreator(req, _res, next) {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const secret = process.env.JWT_SECRET;

  if (!secret || !token) return next(new HttpError(401, 'Please sign in to continue.'));
  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (payload.role !== 'creator' || !payload.sub) throw new Error('Invalid creator session.');
    req.creatorId = payload.sub;
    next();
  } catch {
    next(new HttpError(401, 'Your session has expired. Please sign in again.'));
  }
}
