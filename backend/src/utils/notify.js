import Notification from '../models/Notification.js';

function safeNotification(data, recipient) {
  return {
    ...recipient,
    type: data.type,
    message: String(data.message || '').slice(0, 500),
    actorName: String(data.actorName || '').slice(0, 100),
    contentId: data.contentId || null,
    read: false,
  };
}

export async function notifyCreator(data) {
  try {
    await Notification.create(safeNotification(data, { recipientType: 'creator', recipientViewerId: null }));
  } catch {
    console.error('Could not save creator notification.');
  }
}

export async function notifyViewer(viewerId, data) {
  if (!viewerId) return;
  try {
    await Notification.create(safeNotification(data, { recipientType: 'viewer', recipientViewerId: viewerId }));
  } catch {
    console.error('Could not save viewer notification.');
  }
}
