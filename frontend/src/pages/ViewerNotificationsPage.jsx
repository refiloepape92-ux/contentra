import { Bell, CheckCheck, FileText, Heart, MessageCircle, ShieldCheck, ShieldX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import { useViewer } from '../context/ViewerContext.jsx';
import { formatDate } from '../lib/api.js';

const eventIcons = {
  post_like: Heart,
  post_comment: MessageCircle,
  post_comment_approved: MessageCircle,
  viewer_post_approved: ShieldCheck,
  viewer_post_rejected: ShieldX,
};

function targetFor(item) {
  if (item.type === 'viewer_post_rejected' || !item.contentId) return '/viewer/profile';
  return `/content/${item.contentId}`;
}

export default function ViewerNotificationsPage() {
  const { viewer, ready, getNotifications, markNotificationRead, markAllNotificationsRead } = useViewer();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [busyAll, setBusyAll] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!viewer) { setLoading(false); return undefined; }
    let active = true;
    getNotifications()
      .then((result) => { if (active) { setItems(result.notifications || []); setUnread(result.unread || 0); } })
      .catch((requestError) => { if (active) setError(requestError.message || 'Your activity could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [viewer, getNotifications]);

  if (!ready) return <div className="viewer-workspace-loading">Opening your activity…</div>;
  if (!viewer) return <section className="viewer-guest-state"><div className="viewer-guest-card"><span className="viewer-avatar viewer-avatar-large"><Bell size={25} /></span><p className="eyebrow"><span className="eyebrow-rule" /> YOUR COMMUNITY ACTIVITY</p><h1>Sign in to see<br /><em>your updates.</em></h1><p>Likes, comments and post decisions are private to the creator who shared the story.</p><Link className="button button-dark" to="/viewer/login">Viewer sign in</Link></div></section>;

  async function readOne(item) {
    if (item.read || busyId) return;
    setBusyId(item._id);
    setError('');
    try {
      await markNotificationRead(item._id);
      setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, read: true } : entry));
      setUnread((count) => Math.max(0, count - 1));
    } catch (requestError) {
      setError(requestError.message || 'This update could not be marked as read.');
    } finally { setBusyId(''); }
  }

  async function readAll() {
    if (!unread || busyAll) return;
    setBusyAll(true);
    setError('');
    try {
      await markAllNotificationsRead();
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      setUnread(0);
    } catch (requestError) {
      setError(requestError.message || 'Your updates could not be marked as read.');
    } finally { setBusyAll(false); }
  }

  return (
    <section className="viewer-activity-page public-page">
      <div className="viewer-activity-header">
        <div><p className="eyebrow"><span className="eyebrow-rule" /> YOUR COMMUNITY ACTIVITY</p><h1>Good things are<br /><em>happening.</em></h1><p>Likes, comments and decisions about the stories you share.</p></div>
        <div className="viewer-activity-header-actions"><Link className="button button-light" to="/viewer/profile"><FileText size={15} /> Your posts</Link><button className="button button-dark" type="button" onClick={readAll} disabled={!unread || busyAll}><CheckCheck size={15} /> {busyAll ? 'Updating…' : `Mark all read${unread ? ` (${unread})` : ''}`}</button></div>
      </div>
      <div className="viewer-activity-body">
        <div className="viewer-activity-intro"><span className="viewer-activity-avatar">{viewer.name.slice(0, 1).toUpperCase()}</span><div><strong>{viewer.name}</strong><span>Your private creator activity</span></div><span className="viewer-activity-total">{unread} unread</span></div>
        {error && <div className="form-error viewer-inline-message" role="alert">{error}</div>}
        {loading ? <div className="viewer-posts-loading">Gathering your updates…</div> : items.length ? (
          <div className="viewer-activity-list" aria-live="polite">
            {items.map((item) => {
              const Icon = eventIcons[item.type] || Bell;
              return <article className={`viewer-activity-item ${item.read ? '' : 'is-unread'}`} key={item._id}>
                <span className={`viewer-activity-icon event-${item.type}`}><Icon size={18} /></span>
                <div className="viewer-activity-copy"><p>{item.message}</p><span>{item.actorName ? `${item.actorName} · ` : ''}{formatDate(item.createdAt, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span></div>
                <div className="viewer-activity-actions">
                  {!item.read && <button type="button" onClick={() => readOne(item)} disabled={Boolean(busyId)}>{busyId === item._id ? 'Saving…' : 'Mark read'}</button>}
                  <Link to={targetFor(item)} onClick={() => readOne(item)}>{item.type === 'viewer_post_rejected' ? 'View my posts' : 'View story'}</Link>
                </div>
              </article>;
            })}
          </div>
        ) : <EmptyState title="Your story is just getting started" message="When someone likes or comments on your published posts—or the creator reviews a submission—you’ll see the update here." action={<Link className="button button-dark" to="/viewer/post">Share a post</Link>} />}
      </div>
    </section>
  );
}
