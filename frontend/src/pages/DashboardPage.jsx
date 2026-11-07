import { ArrowUpRight, Eye, FileText, MessageSquareText, Plus, Timer, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import { api, formatDate } from '../lib/api.js';

const metricItems = [
  { key: 'total', label: 'All content', icon: FileText },
  { key: 'published', label: 'Published', icon: TrendingUp },
  { key: 'drafts', label: 'Drafts', icon: FileText },
  { key: 'comments', label: 'Comments', icon: MessageSquareText },
  { key: 'viewers', label: 'Registered viewers', icon: Users },
];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [contents, setContents] = useState([]);
  const [viewers, setViewers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api('/api/dashboard/stats'), api('/api/contents/manage'), api('/api/viewers/manage')])
      .then(([statsResult, contentResult, viewersResult]) => {
        setStats(statsResult.stats);
        setContents(contentResult.contents || []);
        setViewers(viewersResult.viewers || []);
      })
      .catch((requestError) => setError(requestError.message || 'Could not load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="studio-loading">Opening your studio…</div>;
  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome"><div><p className="eyebrow"><span className="eyebrow-rule" /> YOUR CREATOR DESK</p><h1>A little room<br />to <em>make things.</em></h1><p className="dashboard-subtitle">The work, the conversations, and what comes next.</p></div><Link className="button button-dark" to="/creator/content/new"><Plus size={17} /> Create new content</Link></div>
      {error && <div className="connection-note" role="alert">{error}</div>}
      <div className="metrics-grid">{metricItems.map(({ key, label, icon: Icon }) => <article className="metric-card" key={key}><div className="metric-top"><span>{label}</span><Icon size={17} /></div><strong>{stats?.[key] ?? '—'}</strong><span className="metric-foot">LIVE FROM YOUR CONTENT LIBRARY</span></article>)}</div>
      <div className="dashboard-lower">
        <section className="dashboard-panel recent-panel"><div className="panel-heading"><div><span className="panel-kicker">LATEST WORK</span><h2>Your content</h2></div><Link className="panel-link" to="/creator/content">View all <ArrowUpRight size={15} /></Link></div>
          {contents.length ? <div className="recent-list">{contents.slice(0, 5).map((item) => <div className="recent-item" key={item._id}><div className="recent-art">{item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" /> : <FileText size={18} />}</div><div className="recent-copy"><strong>{item.title}</strong><span>{item.category} <i /> Updated {formatDate(item.updatedAt, { month: 'short', day: 'numeric' })}</span></div><span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span><Link className="recent-edit" to={`/creator/content/${item._id}/edit`} aria-label={`Edit ${item.title}`}><ArrowUpRight size={17} /></Link></div>)}</div> : <EmptyState title="Your first piece starts here" message="Add a story, video, or podcast and it will appear in this workspace." action />}
        </section>
        <section className="dashboard-panel recent-panel">
          <div className="panel-heading"><div><span className="panel-kicker">YOUR COMMUNITY</span><h2>Registered viewers</h2></div><span className="comment-total">{viewers.length} members</span></div>
          {viewers.length ? <div className="recent-list">{viewers.slice(0, 8).map((viewer) => <div className="recent-item" key={viewer._id}><div className="comment-avatar">{(viewer.name || 'V').slice(0,1).toUpperCase()}</div><div className="recent-copy"><strong>{viewer.name}</strong><span>{viewer.email} · Joined {formatDate(viewer.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div></div>)}</div> : <p className="no-comments">No viewer accounts have registered yet.</p>}
        </section>
        <aside className="dashboard-side-stack">
          <section className="dashboard-panel insight-panel"><div className="insight-icon"><Eye size={19} /></div><span className="panel-kicker">AUDIENCE ACTIVITY</span><strong>{(stats?.views || 0).toLocaleString()}</strong><p>Total content views, gathered over time.</p>{stats?.popularContent && <div className="popular-content"><span>MOST VIEWED</span><b>{stats.popularContent.title}</b><small>{(stats.popularContent.views || 0).toLocaleString()} views</small></div>}</section>
          <section className="schedule-callout"><div className="schedule-icon"><Timer size={19} /></div><div><span>PLANNING AHEAD?</span><p>{stats?.scheduled || 0} scheduled {stats?.scheduled === 1 ? 'piece' : 'pieces'} in your queue.</p><Link to="/creator/content">See your calendar <ArrowUpRight size={15} /></Link></div></section>
        </aside>
      </div>
    </div>
  );
}
