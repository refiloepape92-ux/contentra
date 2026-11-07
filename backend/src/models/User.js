import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, enum: ['creator'], default: 'creator', unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    displayName: { type: String, required: true, trim: true, maxlength: 80, default: 'Creator Studio' },
    bio: { type: String, trim: true, maxlength: 1200, default: 'A home for new stories, ideas, and conversations.' },
    avatarUrl: { type: String, trim: true, default: '' },
  },
  { timestamps: true, collection: 'users' },
);

export default mongoose.models.User || mongoose.model('User', userSchema);
