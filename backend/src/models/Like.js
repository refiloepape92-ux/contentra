import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
  {
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true, index: true },
    viewerKey: { type: String, required: true, trim: true, maxlength: 120 },
  },
  { timestamps: true, collection: 'likes' },
);

likeSchema.index({ contentId: 1, viewerKey: 1 }, { unique: true });

export default mongoose.models.Like || mongoose.model('Like', likeSchema);
