import mongoose from 'mongoose';

const viewerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  bio: { type: String, trim: true, maxlength: 500, default: '' },
}, { timestamps: true, collection: 'viewers' });

export default mongoose.models.Viewer || mongoose.model('Viewer', viewerSchema);
