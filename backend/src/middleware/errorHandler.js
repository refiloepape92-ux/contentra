import HttpError from '../utils/HttpError.js';

export function notFound(_req, _res, next) {
  next(new HttpError(404, 'That page or API route was not found.'));
}

export function errorHandler(error, _req, res, _next) {
  if (error?.code === 11000) {
    return res.status(409).json({ error: 'That record already exists.' });
  }
  if (error?.name === 'CastError' || error?.name === 'BSONError') {
    return res.status(400).json({ error: 'The requested identifier is invalid.' });
  }
  const status = Number.isInteger(error?.status) ? error.status : 500;
  const message = status >= 500 ? 'The server could not complete that request.' : error.message;
  const payload = { error: message };
  if (error instanceof HttpError && error.details) payload.details = error.details;
  if (status >= 500) console.error('API request failed:', error?.name || 'Error');
  res.status(status).json(payload);
}
