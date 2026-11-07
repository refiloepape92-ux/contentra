import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true, index: true },
    displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    text: { type: String, required: true, trim: true, minlength: 2, maxlength: 1500 },
    viewerKey: { type: String, required: true, maxlength: 120 },
    status: { type: String, enum: ['Pending', 'Approved', 'Hidden'], default: 'Pending', index: true },
  },
  { timestamps: true, collection: 'comments' },
);

commentSchema.index({ contentId: 1, status: 1, createdAt: -1 });

export default mongoose.models.Comment || mongoose.model('Comment', commentSchema);
