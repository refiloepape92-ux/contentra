import { databaseReady } from '../config/database.js';
import HttpError from '../utils/HttpError.js';

export default function requireDatabase(_req, _res, next) {
  if (!databaseReady()) return next(new HttpError(503, 'The database is not connected yet. Check the Atlas connection settings.'));
  next();
}
