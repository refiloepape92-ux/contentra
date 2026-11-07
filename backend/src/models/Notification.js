import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'viewer_registered',
      'viewer_posted',
      'viewer_post_approved',
      'viewer_post_rejected',
      'like',
      'comment',
      'comment_approved',
      'post_like',
      'post_comment',
      'post_comment_approved',
    ],
    index: true,
  },
  recipientType: { type: String, enum: ['creator', 'viewer'], default: 'creator', index: true },
  recipientViewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Viewer', default: null, index: true },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  actorName: { type: String, trim: true, maxlength: 100, default: '' },
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', default: null },
  read: { type: Boolean, default: false, index: true },
}, { timestamps: true, collection: 'notifications' });

notificationSchema.index({ recipientType: 1, recipientViewerId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
