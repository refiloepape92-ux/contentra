import jwt from 'jsonwebtoken';
import HttpError from '../utils/HttpError.js';

export function requireViewer(req, _res, next) {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const secret = process.env.JWT_SECRET;
  if (!secret || !token) return next(new HttpError(401, 'Please sign in with a viewer account.'));
  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (payload.role !== 'viewer' || !payload.sub) throw new Error('Invalid viewer session.');
    req.viewerId = payload.sub;
    next();
  } catch {
    next(new HttpError(401, 'Your viewer session has expired. Please sign in again.'));
  }
}
