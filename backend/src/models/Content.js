import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema(
  {
    authorType: { type: String, enum: ['creator', 'viewer'], default: 'creator', index: true },
    viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Viewer', default: null, index: true },
    authorName: { type: String, trim: true, maxlength: 80, default: '' },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 6000, default: '' },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    contentType: { type: String, required: true, enum: ['Video', 'Article', 'Image', 'Podcast', 'Other'] },
    thumbnailUrl: { type: String, trim: true, default: '' },
    mediaUrl: { type: String, trim: true, default: '' },
    body: { type: String, trim: true, maxlength: 50000, default: '' },
    status: { type: String, required: true, enum: ['Draft', 'Published', 'Scheduled', 'Pending', 'Rejected'], default: 'Draft', index: true },
    publishedAt: { type: Date, default: null, index: true },
    isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: 'contents' },
);

contentSchema.index({ status: 1, publishedAt: -1, createdAt: -1 });
contentSchema.index({ viewerId: 1, authorType: 1, updatedAt: -1 });
contentSchema.index({ title: 'text', description: 'text', category: 'text' });

export default mongoose.models.Content || mongoose.model('Content', contentSchema);
