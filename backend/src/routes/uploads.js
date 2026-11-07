import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { lstat, rename, unlink } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileTypeFromFile } from 'file-type';
import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import Content from '../models/Content.js';
import HttpError from '../utils/HttpError.js';
import { requireCreator } from '../middleware/auth.js';
import { requireViewer } from '../middleware/viewerAuth.js';

const router = express.Router();
export const uploadDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../uploads');
mkdirSync(uploadDirectory, { recursive: true });

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const acceptedTypes = new Map([
  ['image/jpeg', { mediaType: 'image', extension: 'jpg', maxBytes: MAX_IMAGE_BYTES }],
  ['image/png', { mediaType: 'image', extension: 'png', maxBytes: MAX_IMAGE_BYTES }],
  ['image/webp', { mediaType: 'image', extension: 'webp', maxBytes: MAX_IMAGE_BYTES }],
  ['image/gif', { mediaType: 'image', extension: 'gif', maxBytes: MAX_IMAGE_BYTES }],
  ['video/mp4', { mediaType: 'video', extension: 'mp4', maxBytes: MAX_VIDEO_BYTES }],
  ['video/webm', { mediaType: 'video', extension: 'webm', maxBytes: MAX_VIDEO_BYTES }],
]);
const safeFilename = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|gif|mp4|webm)$/i;

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, _file, callback) => callback(null, `upload-${randomUUID()}.tmp`),
});
const multipart = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_BYTES, files: 1, fields: 4, parts: 5 },
  fileFilter: (_req, file, callback) => {
    if (!acceptedTypes.has(file.mimetype)) {
      return callback(new HttpError(415, 'Choose a JPEG, PNG, WebP or GIF image, or an MP4 or WebM video.'));
    }
    callback(null, true);
  },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Upload limit reached. Please try again later.' },
});

function receiveSingleFile(req, res, next) {
  multipart.single('file')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') return next(new HttpError(413, 'Videos must be no larger than 100 MiB. Images must be no larger than 8 MiB.'));
      return next(new HttpError(400, 'Choose one file and try again.'));
    }
    next(error);
  });
}

async function storeValidatedUpload(req, res, next) {
  const file = req.file;
  if (!file) return next(new HttpError(400, 'Choose an image or video file to upload.'));
  const requestedType = acceptedTypes.get(file.mimetype);
  if (!requestedType || file.size > requestedType.maxBytes) {
    await unlink(file.path).catch(() => {});
    return next(new HttpError(413, requestedType?.mediaType === 'image' ? 'Images must be no larger than 8 MiB.' : 'Videos must be no larger than 100 MiB.'));
  }

  try {
    const detected = await fileTypeFromFile(file.path);
    if (!detected || detected.mime !== file.mimetype || !acceptedTypes.has(detected.mime)) {
      await unlink(file.path).catch(() => {});
      return next(new HttpError(415, 'The file contents do not match a supported image or video format.'));
    }
    const detectedType = acceptedTypes.get(detected.mime);
    if (file.size > detectedType.maxBytes) {
      await unlink(file.path).catch(() => {});
      return next(new HttpError(413, detectedType.mediaType === 'image' ? 'Images must be no larger than 8 MiB.' : 'Videos must be no larger than 100 MiB.'));
    }

    const filename = `${randomUUID()}.${detectedType.extension}`;
    const finalPath = resolve(uploadDirectory, filename);
    if (dirname(finalPath) !== uploadDirectory || extname(finalPath) !== `.${detectedType.extension}`) {
      await unlink(file.path).catch(() => {});
      return next(new HttpError(400, 'This file could not be stored safely.'));
    }
    await rename(file.path, finalPath);
    return res.status(201).json({
      url: `/uploads/${filename}`,
      mediaType: detectedType.mediaType,
      mimeType: detected.mime,
      bytes: file.size,
    });
  } catch {
    await unlink(file.path).catch(() => {});
    return next(new HttpError(400, 'This file could not be read as a supported image or video.'));
  }
}

function sessionPayload(req) {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
}

export async function serveUploadedFile(req, res, next) {
  try {
    const filename = String(req.params.filename || '');
    if (!safeFilename.test(filename)) throw new HttpError(404, 'Media file not found.');
    const filePath = resolve(uploadDirectory, filename);
    if (dirname(filePath) !== uploadDirectory || extname(filename).slice(1) !== filename.split('.').at(-1).toLowerCase()) {
      throw new HttpError(404, 'Media file not found.');
    }

    const mediaPath = `/uploads/${filename}`;
    const reference = { $or: [{ mediaUrl: mediaPath }, { thumbnailUrl: mediaPath }] };
    const publicContent = await Content.findOne({
      ...reference,
      status: 'Published',
      publishedAt: { $lte: new Date() },
    }).select('_id').lean();
    let isPublic = Boolean(publicContent);

    if (!isPublic) {
      const session = sessionPayload(req);
      let canRead = false;
      if (session?.role === 'creator' && session.sub) {
        canRead = Boolean(await Content.exists(reference));
      } else if (session?.role === 'viewer' && session.sub) {
        canRead = Boolean(await Content.exists({
          ...reference,
          authorType: 'viewer',
          viewerId: session.sub,
        }));
      }
      if (!canRead) throw new HttpError(404, 'Media file not found.');
    }

    const fileInfo = await lstat(filePath).catch(() => null);
    if (!fileInfo?.isFile() || fileInfo.isSymbolicLink()) throw new HttpError(404, 'Media file not found.');

    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', isPublic ? 'public, max-age=31536000, immutable' : 'private, no-store');
    return res.sendFile(filePath, { dotfiles: 'deny', headers: { 'Cross-Origin-Resource-Policy': 'cross-origin', 'X-Content-Type-Options': 'nosniff' } }, (error) => {
      if (error && !res.headersSent) next(new HttpError(404, 'Media file not found.'));
      else if (error) next(error);
    });
  } catch (error) {
    next(error);
  }
}

router.get('/:filename', serveUploadedFile);
router.post('/creator', requireCreator, uploadLimiter, receiveSingleFile, storeValidatedUpload);
router.post('/viewer', requireViewer, uploadLimiter, receiveSingleFile, storeValidatedUpload);

export default router;
