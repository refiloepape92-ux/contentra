import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import HttpError from './utils/HttpError.js';
import { databaseReady } from './config/database.js';
import requireDatabase from './middleware/requireDatabase.js';
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/contents.js';
import commentRoutes from './routes/comments.js';
import likeRoutes from './routes/likes.js';
import dashboardRoutes from './routes/dashboard.js';
import creatorRoutes from './routes/creator.js';
import viewerRoutes from './routes/viewers.js';
import bookmarkRoutes from './routes/bookmarks.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes, { serveUploadedFile } from './routes/uploads.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN || '')
  .split(',').map((origin) => origin.trim()).filter(Boolean));

app.disable('x-powered-by');
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new HttpError(403, 'This website origin is not allowed.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}));
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => {
  const ready = databaseReady();
  res.status(ready ? 200 : 503).json({ ok: ready, service: 'creatorhub-api', database: ready ? 'connected' : 'unavailable' });
});

app.get('/uploads/:filename', requireDatabase, serveUploadedFile);

app.use('/api', requireDatabase);
app.use('/api/auth', authRoutes);
app.use('/api/contents', contentRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/creator', creatorRoutes);
app.use('/api/viewers', viewerRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/uploads', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
