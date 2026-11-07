import mongoose from 'mongoose';

mongoose.set('bufferCommands', false);

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured.');

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    appName: 'CreatorHub',
  });
  return mongoose.connection;
}

export function databaseReady() {
  return mongoose.connection.readyState === 1;
}

export async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
