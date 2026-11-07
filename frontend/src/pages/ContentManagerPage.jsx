import { ArrowUpRight, Check, FilePlus2, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import ProtectedMediaImage from '../components/ProtectedMediaImage.jsx';
import { api, formatDate } from '../lib/api.js';

export default function ContentManagerPage() {
  const [contents, setContents] = useState([]);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState('');

  async function load() {
    try {
      const result = await api('/api/contents/manage');
      setContents(result.contents || []);
      setError('');
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function moderate(item, decision) {
    try { const r = await api(`/api/contents/${item._id}/moderate`, { method: 'PATCH', body: JSON.stringify({ decision }) }); setContents(old => old.map(x => x._id === item._id ? r.content : x)); } catch (e) { setError(e.message); }
  }

  async function removeContent(item) {
    if (!window.confirm(`Delete “${item.title}”? This also deletes its comments and likes.`)) return;
    setRemoving(item._id);
    try {
      await api(`/api/contents/${item._id}`, { method: 'DELETE' });
      setContents((items) => items.filter((content) => content._id !== item._id));
    } catch (requestError) { setError(requestError.message); }
    finally { setRemoving(''); }
  }

  const visible = filter === 'All' ? contents : contents.filter((item) => item.status === filter);
  return (
    <div className="manager-page">
      <div className="page-title-row"><div><p className="eyebrow"><span className="eyebrow-rule" /> THE ARCHIVE</p><h1>Your <em>content.</em></h1><p className="page-deck">Every idea, draft, and published piece in one place.</p></div><Link className="button button-dark" to="/creator/content/new"><Plus size={17} /> Add content</Link></div>
      <div className="manager-toolbar"><div className="filter-tabs" aria-label="Filter content status">{['All', 'Pending', 'Published', 'Draft', 'Scheduled', 'Rejected'].map((status) => <button key={status} type="button" className={filter === status ? 'active' : ''} onClick={() => setFilter(status)}>{status}<span>{status === 'All' ? contents.length : contents.filter((item) => item.status === status).length}</span></button>)}</div><span className="archive-count">{visible.length} {visible.length === 1 ? 'ITEM' : 'ITEMS'}</span></div>
      {error && <div className="form-error manager-error" role="alert">{error}</div>}
      {loading ? <div className="studio-loading">Loading your content…</div> : visible.length === 0 ? <EmptyState title={filter === 'All' ? 'A clean slate' : `No ${filter.toLowerCase()} content`} message={filter === 'All' ? 'Start with a draft, or publish something for your viewers.' : 'Try another filter or create a new piece.'} action={filter === 'All'} /> : (
        <div className="manager-table-wrap"><table className="manager-table"><thead><tr><th>CONTENT</th><th>STATUS</th><th>UPDATED</th><th>VIEWS</th><th aria-label="Actions" /></tr></thead><tbody>{visible.map((item) => <tr key={item._id}><td><div className="table-content"><div className="table-thumb">{item.thumbnailUrl ? <ProtectedMediaImage src={item.thumbnailUrl} authToken={window.sessionStorage.getItem('creatorhub_token')} alt="" /> : <FilePlus2 size={17} />}</div><div><strong>{item.title}</strong><span>{item.authorType === 'viewer' ? `By ${item.authorName || 'Viewer'} · Viewer submission` : `${item.category} · ${item.contentType}`}</span></div></div></td><td><span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span></td><td className="table-date">{formatDate(item.updatedAt, { month: 'short', day: 'numeric', year: 'numeric' })}</td><td className="table-views">{(item.views || 0).toLocaleString()}</td><td><div className="table-actions">{item.authorType === 'viewer' ? <><button type="button" className="moderate-approve" disabled={item.status !== 'Pending'} onClick={() => moderate(item, 'approve')}><Check size={15}/> Approve</button><button type="button" className="icon-button" disabled={item.status !== 'Pending'} title="Reject viewer post" onClick={() => moderate(item, 'reject')}><X size={16}/></button></> : <Link className="icon-button" to={`/creator/content/${item._id}/edit`} title="Edit content" aria-label={`Edit ${item.title}`}><ArrowUpRight size={17} /></Link>}<button className="icon-button delete-action" type="button" title="Delete content" aria-label={`Delete ${item.title}`} disabled={removing === item._id} onClick={() => removeContent(item)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}
