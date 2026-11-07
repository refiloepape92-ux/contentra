import { Bell, Bookmark, CalendarDays, CheckCircle2, Clock3, Heart, LogOut, MessageCircle, PenLine, Plus, UserRound, Eye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import ProtectedMediaImage from '../components/ProtectedMediaImage.jsx';
import { useViewer } from '../context/ViewerContext.jsx';
import { formatDate } from '../lib/api.js';

const statusStyles = {
  Published: ['status-published', 'Published'],
  Pending: ['status-pending', 'In review'],
  Rejected: ['status-hidden', 'Not approved'],
  Draft: ['status-draft', 'Draft'],
};

export default function ViewerProfilePage() {
  const {
    viewer, ready, logout, updateProfile, getMyPosts, notificationUnread,
  } = useViewer();
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [notice, setNotice] = useState('');
  const [profileError, setProfileError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!viewer) return;
    setName(viewer.name || '');
    setBio(viewer.bio || '');
  }, [viewer]);

  useEffect(() => {
    if (!viewer) { setPostsLoading(false); return undefined; }
    let active = true;
    getMyPosts()
      .then((items) => { if (active) { setPosts(items); setPostsError(''); } })
      .catch((error) => { if (active) setPostsError(error.message || 'Your posts could not be loaded.'); })
      .finally(() => { if (active) setPostsLoading(false); });
    return () => { active = false; };
  }, [viewer, getMyPosts]);

  const totals = useMemo(() => posts.reduce((result, post) => ({
    likes: result.likes + (post.likes || 0),
    comments: result.comments + (post.comments || 0),
    pending: result.pending + (post.pendingComments || 0),
  }), { likes: 0, comments: 0, pending: 0 }), [posts]);
  const publishedCount = posts.filter((post) => post.status === 'Published').length;

  if (!ready) return <div className="viewer-workspace-loading">Opening your creator space…</div>;
  if (!viewer) return (
    <section className="viewer-guest-state">
      <div className="viewer-guest-card"><span className="viewer-avatar viewer-avatar-large"><UserRound size={26} /></span><p className="eyebrow"><span className="eyebrow-rule" /> YOUR CREATOR SPACE</p><h1>Sign in to see<br /><em>your work.</em></h1><p>Your posts, engagement and notifications live together in your reader space.</p><div className="viewer-guest-actions"><Link className="button button-dark" to="/viewer/login">Sign in</Link><Link className="button button-light" to="/viewer/register">Create an account</Link></div></div>
    </section>
  );

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setProfileError('');
    setNotice('');
    try {
      await updateProfile(name, bio);
      setNotice('Profile saved. Your creator card is up to date.');
    } catch (error) {
      setProfileError(error.message || 'Your profile could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  function signOut() {
    logout();
    navigate('/');
  }

  return (
    <section className="viewer-workspace public-page">
      <div className="viewer-workspace-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" /> YOUR CREATOR SPACE</p>
          <h1>Make room for<br /><em>your next story.</em></h1>
          <p>One place for your posts, the response they’re getting, and updates from the community.</p>
        </div>
        <Link className="button button-dark viewer-new-post" to="/viewer/post"><Plus size={17} /> Share a post</Link>
      </div>

      <div className="viewer-workspace-grid">
        <aside className="viewer-profile-rail">
          <div className="viewer-identity-card">
            <div className="viewer-identity-top"><span className="viewer-avatar">{viewer.name.slice(0, 1).toUpperCase()}</span><span className="viewer-account-label"><i /> COMMUNITY CREATOR</span></div>
            <h2>{viewer.name}</h2>
            <p className="viewer-email">{viewer.email}</p>
            <p className="viewer-bio">{viewer.bio || 'Your creator introduction can be added below.'}</p>
            <div className="viewer-member-since"><CalendarDays size={14} /> Member since {formatDate(viewer.createdAt, { month: 'long', year: 'numeric' })}</div>
          </div>
          <nav className="viewer-space-nav" aria-label="Your creator space">
            <Link className="is-current" to="/viewer/profile"><PenLine size={16} /> My posts <span>{posts.length}</span></Link>
            <Link to="/viewer/notifications"><Bell size={16} /> Activity <span className={`viewer-nav-count ${notificationUnread ? 'has-unread' : ''}`}>{notificationUnread > 99 ? '99+' : notificationUnread || '—'}</span></Link>
            <Link to="/viewer/saved"><Bookmark size={16} /> Saved stories</Link>
            <Link to="/viewer/post"><Plus size={16} /> Share a post</Link>
          </nav>
          <button type="button" className="viewer-signout" onClick={signOut}><LogOut size={15} /> Sign out</button>
        </aside>

        <div className="viewer-workspace-main">
          <div className="viewer-metrics" aria-label="Your content engagement">
            <article className="viewer-metric"><span><PenLine size={15} /> YOUR POSTS</span><strong>{posts.length}</strong><small>{publishedCount} published to the community</small></article>
            <article className="viewer-metric"><span><Heart size={15} /> LIKES</span><strong>{totals.likes}</strong><small>Across your published posts</small></article>
            <article className="viewer-metric"><span><MessageCircle size={15} /> COMMENTS</span><strong>{totals.comments + totals.pending}</strong><small>{totals.pending ? `${totals.pending} awaiting creator review` : 'Approved on your posts'}</small></article>
          </div>

          <div className="viewer-posts-panel">
            <div className="viewer-panel-heading"><div><p className="eyebrow"><span className="eyebrow-rule" /> YOUR PUBLISHING DESK</p><h2>My posts <span>{posts.length}</span></h2></div><Link className="viewer-inline-action" to="/viewer/post"><Plus size={15} /> New post</Link></div>
            {postsError && <div className="form-error viewer-inline-message" role="alert">{postsError}</div>}
            {postsLoading ? <div className="viewer-posts-loading">Loading your posts…</div> : posts.length ? (
              <div className="viewer-post-list">
                {posts.map((post) => {
                  const [statusClass, statusLabel] = statusStyles[post.status] || ['status-draft', post.status];
                  const canOpen = post.status === 'Published';
                  return (
                    <article className="viewer-post-row" key={post._id}>
                      <div className="viewer-post-cover">{post.thumbnailUrl ? <ProtectedMediaImage src={post.thumbnailUrl} authToken={window.localStorage.getItem('creatorhub_viewer_token')} alt="" /> : <span>{post.category?.slice(0, 1)?.toUpperCase() || 'C'}</span>}</div>
                      <div className="viewer-post-copy">
                        <div className="viewer-post-meta"><span>{post.category}</span><i />{post.contentType}<time>{formatDate(post.updatedAt || post.createdAt, { month: 'short', day: 'numeric' })}</time></div>
                        <h3>{canOpen ? <Link to={`/content/${post._id}`}>{post.title}</Link> : post.title}</h3>
                        <p>{post.description || (post.status === 'Pending' ? 'Your story is in the review queue.' : 'Your community story.')}</p>
                        <div className="viewer-post-engagement">
                          <span><Heart size={14} /> {post.likes || 0} likes</span>
                          <span><MessageCircle size={14} /> {post.comments || 0} comments</span>
                          {post.pendingComments > 0 && <span className="pending-comment-count"><Clock3 size={14} /> {post.pendingComments} awaiting review</span>}
                          {post.status === 'Published' && <span><Eye size={14} /> {post.views || 0} views</span>}
                        </div>
                      </div>
                      <div className="viewer-post-state"><span className={`status-pill ${statusClass}`}>{statusLabel}</span>{canOpen && <Link to={`/content/${post._id}`} aria-label={`View ${post.title}`}>View story</Link>}</div>
                    </article>
                  );
                })}
              </div>
            ) : <EmptyState title="Your first post starts here" message="Share a story, idea or lesson with the community. The creator reviews every submission before it goes public." action={<Link className="button button-dark" to="/viewer/post"><Plus size={15} /> Share your first post</Link>} />}
          </div>

          <details className="viewer-profile-settings">
            <summary><span><UserRound size={16} /> Profile details</span><span>Edit profile</span></summary>
            <form className="viewer-profile-form" onSubmit={saveProfile}>
              <label>Display name<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required /></label>
              <label>Email address<input value={viewer.email} readOnly disabled /></label>
              <label>Creator introduction<textarea rows={3} maxLength={500} value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Tell the community what you create." /></label>
              <div className="viewer-profile-form-footer"><span>{notice || profileError}</span><button className="button button-dark" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button></div>
            </form>
          </details>
        </div>
      </div>
    </section>
  );
}
