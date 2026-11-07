import { Bell, CheckCheck, FileText, Heart, MessageSquare, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import { api, formatDate } from '../lib/api.js';

const icons = {
  viewer_registered: UserPlus,
  viewer_posted: FileText,
  viewer_post_approved: CheckCheck,
  like: Heart,
  comment: MessageSquare,
  comment_approved: MessageSquare,
};

function publishUnreadCount(unread) {
  window.dispatchEvent(new CustomEvent('creatorhub:notifications-unread', { detail: { unread } }));
}

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [busyAll, setBusyAll] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api('/api/notifications')
      .then((result) => {
        if (!active) return;
        setItems(result.notifications || []);
        setUnread(result.unread || 0);
        publishUnreadCount(result.unread || 0);
      })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load notifications.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function markOne(item) {
    if (item.read || busyId) return;
    setBusyId(item._id);
    setError('');
    try {
      await api(`/api/notifications/${item._id}/read`, { method: 'PATCH' });
      setItems((old) => old.map((entry) => entry._id === item._id ? { ...entry, read: true } : entry));
      const nextUnread = Math.max(0, unread - 1);
      setUnread(nextUnread);
      publishUnreadCount(nextUnread);
    } catch (requestError) {
      setError(requestError.message || 'Could not mark this notification as read.');
    } finally {
      setBusyId('');
    }
  }

  async function markAll() {
    if (!unread || busyAll) return;
    setBusyAll(true);
    setError('');
    try {
      await api('/api/notifications/read-all', { method: 'PATCH' });
      setItems((old) => old.map((item) => ({ ...item, read: true })));
      setUnread(0);
      publishUnreadCount(0);
    } catch (requestError) {
      setError(requestError.message || 'Could not mark notifications as read.');
    } finally {
      setBusyAll(false);
    }
  }

  return (
    <div className="notifications-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" /> STUDIO ACTIVITY</p>
          <h1>Your <em>notifications.</em></h1>
          <p className="page-deck">New viewer registrations, post submissions, likes and comments appear here.</p>
        </div>
        <button className="button button-light" type="button" onClick={markAll} disabled={!unread || busyAll}>
          <CheckCheck size={16} /> {busyAll ? 'Updating…' : `Mark all read (${unread})`}
        </button>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {loading ? <div className="studio-loading">Loading notifications…</div> : items.length ? (
        <div className="notification-list" aria-live="polite">
          {items.map((item) => {
            const Icon = icons[item.type] || Bell;
            return (
              <article key={item._id} className={`notification-item ${item.read ? '' : 'unread'}`}>
                <div className="notification-icon" aria-hidden="true"><Icon size={18} /></div>
                <div className="notification-copy">
                  <p>{item.message}</p>
                  <span>{item.actorName ? `${item.actorName} · ` : ''}{formatDate(item.createdAt, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
                {!item.read && <button className="notification-mark" type="button" disabled={Boolean(busyId)} aria-label={`Mark notification from ${item.actorName || 'activity'} as read`} onClick={() => markOne(item)}>{busyId === item._id ? 'Updating…' : 'Mark read'}</button>}
              </article>
            );
          })}
        </div>
      ) : <EmptyState title="All quiet for now" message="New registrations, viewer posts, likes and comments will appear here." />}
    </div>
  );
}
