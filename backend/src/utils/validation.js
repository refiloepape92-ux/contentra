import { z } from 'zod';
import HttpError from './HttpError.js';

export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    throw new HttpError(400, 'Please check the submitted information.', details);
  }
  return result.data;
}

const optionalUrl = z.string().trim().max(2048).refine((value) => {
  if (!value) return true;
  if (/^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|gif|mp4|webm)$/i.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}, 'Enter a valid http or https URL.').optional().default('');

export const setupSchema = z.object({
  setupKey: z.string().min(1).max(200),
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(128),
  displayName: z.string().trim().min(2).max(80),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export const contentSchema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(6000).optional().default(''),
  category: z.string().trim().min(2).max(60),
  contentType: z.enum(['Video', 'Article', 'Image', 'Podcast', 'Other']),
  thumbnailUrl: optionalUrl,
  mediaUrl: optionalUrl,
  body: z.string().trim().max(50000).optional().default(''),
  status: z.enum(['Draft', 'Published', 'Scheduled']),
  publishedAt: z.union([z.string().datetime({ offset: true }), z.string().datetime(), z.null()]).optional(),
  isFeatured: z.boolean().optional().default(false),
}).superRefine((value, ctx) => {
  if (value.status === 'Scheduled') {
    if (!value.publishedAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['publishedAt'], message: 'Choose a publication date and time for scheduled content.' });
    } else if (new Date(value.publishedAt).getTime() <= Date.now()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['publishedAt'], message: 'Scheduled publication must be in the future.' });
    }
  }
  if (value.status === 'Published' && value.publishedAt && new Date(value.publishedAt).getTime() > Date.now()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['publishedAt'], message: 'Choose Scheduled for a future publication date.' });
  }
});

export const commentSchema = z.object({
  contentId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid content item.'),
  displayName: z.string().trim().min(2).max(60),
  text: z.string().trim().min(2).max(1500),
  viewerKey: z.string().trim().min(12).max(120),
});

export const likeSchema = z.object({
  contentId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid content item.'),
  viewerKey: z.string().trim().min(12).max(120),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(1200).optional().default(''),
  avatarUrl: optionalUrl,
});
