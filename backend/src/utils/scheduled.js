import Content from '../models/Content.js';

export async function publishDueContent() {
  return Content.updateMany(
    { status: 'Scheduled', publishedAt: { $lte: new Date() } },
    { $set: { status: 'Published' } },
  );
}
