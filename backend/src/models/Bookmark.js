import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Viewer', required: true, index: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true, index: true },
}, { timestamps: true, collection: 'bookmarks' });
schema.index({ viewerId: 1, contentId: 1 }, { unique: true });
export default mongoose.models.Bookmark || mongoose.model('Bookmark', schema);
