import { Bookmark, ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useViewer } from '../context/ViewerContext.jsx';
import { formatDate } from '../lib/api.js';
export default function ViewerBookmarksPage() {
  const { viewer, ready, getBookmarks, removeBookmark } = useViewer();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!ready || !viewer) { setLoading(false); return; }
    getBookmarks().then(setItems).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [ready, viewer]);
  async function remove(id) {
    try { await removeBookmark(id); setItems((old) => old.filter((item) => item.contentId?._id !== id)); }
    catch (e) { setError(e.message); }
  }
  if (!ready || loading) return <div className="detail-state">Loading your saved stories…</div>;
  if (!viewer) return <div className="detail-state"><h1>Sign in to see your saved stories.</h1><Link className="text-cta" to="/viewer/login">Viewer sign in</Link></div>;
  return <section className="public-page viewer-profile-page"><div className="profile-card viewer-profile-card">
    <p className="eyebrow">YOUR READER SPACE</p><h1>Saved <em>stories.</em></h1>
    <p className="auth-help">Keep the stories you want to return to in one place.</p>
    {error && <p className="form-error">{error}</p>}
    {!items.length ? <p className="no-comments">You have not saved any stories yet. Explore the reading room and save a story.</p> :
      <div className="recent-list">{items.map((item) => { const c=item.contentId; return c && <article className="recent-item" key={item._id}>
        <div className="recent-art">{c.thumbnailUrl ? <img src={c.thumbnailUrl} alt="" /> : <Bookmark size={18}/>}</div>
        <div className="recent-copy"><strong>{c.title}</strong><span>{c.category} · {formatDate(c.publishedAt)}</span></div>
        <Link className="recent-edit" to={`/content/${c._id}`} aria-label={`Read ${c.title}`}><ArrowUpRight size={17}/></Link>
        <button className="icon-button" type="button" onClick={() => remove(c._id)} aria-label={`Remove ${c.title}`}>×</button>
      </article>; })}</div>}
    <p className="setup-prompt"><Link to="/viewer/profile">Back to profile</Link> · <Link to="/">Explore stories</Link></p>
  </div></section>;
}
