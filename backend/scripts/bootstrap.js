import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../');
dotenv.config({ path: process.env.ENV_FILE || resolve(projectRoot, '.env') });

const { default: mongoose } = await import('mongoose');
const { default: bcrypt } = await import('bcryptjs');
const { default: User } = await import('../src/models/User.js');

const { MONGODB_URI, CREATOR_EMAIL, CREATOR_PASSWORD, CREATOR_NAME = 'Creator Studio' } = process.env;
if (!MONGODB_URI || !CREATOR_EMAIL || !CREATOR_PASSWORD) {
  console.error('Set MONGODB_URI, CREATOR_EMAIL, and CREATOR_PASSWORD in a private environment before bootstrapping.');
  process.exit(1);
}
if (CREATOR_PASSWORD.length < 10) {
  console.error('CREATOR_PASSWORD must be at least 10 characters.');
  process.exit(1);
}

try {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000, appName: 'CreatorHubBootstrap' });
  if (await User.exists({})) {
    console.error('A creator account already exists; bootstrap stopped without changing it.');
    process.exitCode = 1;
  } else {
    const passwordHash = await bcrypt.hash(CREATOR_PASSWORD, 12);
    const user = await User.create({ email: CREATOR_EMAIL.toLowerCase(), passwordHash, displayName: CREATOR_NAME });
    console.info(`Created creator account for ${user.email}. Remove bootstrap credentials from the runtime environment.`);
  }
} catch (error) {
  console.error('Creator bootstrap failed:', error?.name || 'Error');
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
