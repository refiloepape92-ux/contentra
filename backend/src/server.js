import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../');
dotenv.config({ path: process.env.ENV_FILE || resolve(projectRoot, '.env') });

const [{ default: app }, { connectDatabase, databaseReady, closeDatabase }, { publishDueContent }] = await Promise.all([
  import('./app.js'),
  import('./config/database.js'),
  import('./utils/scheduled.js'),
]);

const port = Number(process.env.PORT || 4000);

try {
  await connectDatabase();
  console.info('Connected to MongoDB Atlas.');
  await publishDueContent();
} catch (error) {
  console.error('MongoDB Atlas is not ready; checking the connection again shortly.', error?.name || 'Error');
}

const scheduleTimer = setInterval(async () => {
  try {
    if (!databaseReady()) {
      await connectDatabase();
      console.info('Reconnected to MongoDB Atlas.');
    }
    await publishDueContent();
  } catch (error) {
    console.error('Atlas connection or scheduled-content refresh failed:', error?.name || 'Error');
  }
}, 60_000);
scheduleTimer.unref();

const server = app.listen(port, '0.0.0.0', () => {
  console.info(`Creator Hub API listening on port ${port}.`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => {
    clearInterval(scheduleTimer);
    server.close(async () => {
      await closeDatabase().catch(() => {});
      process.exit(0);
    });
  });
}
