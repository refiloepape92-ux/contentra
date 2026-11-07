import { Check, MessageSquareText, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import { api, formatDate } from '../lib/api.js';

export default function CommentsPage() {
  const [comments, setComments] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    api('/api/comments/manage').then((result) => setComments(result.comments || [])).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, []);
  const visible = filter === 'All' ? comments : comments.filter((comment) => comment.status === filter);

  async function setStatus(comment, status) {
    setBusy(comment._id);
    setError('');
    try {
      const result = await api(`/api/comments/${comment._id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setComments((items) => items.map((item) => item._id === comment._id ? result.comment : item));
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(''); }
  }
  async function remove(comment) {
    if (!window.confirm('Delete this comment permanently?')) return;
    setBusy(comment._id);
    try {
      await api(`/api/comments/${comment._id}`, { method: 'DELETE' });
      setComments((items) => items.filter((item) => item._id !== comment._id));
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(''); }
  }

  return (
    <div className="comments-manager-page">
      <div className="page-title-row"><div><p className="eyebrow"><span className="eyebrow-rule" /> VIEWER VOICES</p><h1>The <em>conversation.</em></h1><p className="page-deck">Review comments before they join the public conversation.</p></div><div className="comment-total"><MessageSquareText size={17} /> {comments.length} total</div></div>
      <div className="manager-toolbar"><div className="filter-tabs">{['All', 'Pending', 'Approved', 'Hidden'].map((status) => <button key={status} type="button" className={filter === status ? 'active' : ''} onClick={() => setFilter(status)}>{status}<span>{status === 'All' ? comments.length : comments.filter((item) => item.status === status).length}</span></button>)}</div></div>
      {error && <div className="form-error manager-error" role="alert">{error}</div>}
      {loading ? <div className="studio-loading">Loading the conversation…</div> : visible.length === 0 ? <EmptyState title="A little quiet for now" message="Approved viewer comments will appear on their stories, and all comments will be gathered here." /> : <div className="moderation-list">{visible.map((comment) => {
        const content = comment.contentId;
        return <article className="moderation-card" key={comment._id}><div className="comment-avatar">{comment.displayName.slice(0, 1).toUpperCase()}</div><div className="moderation-copy"><div className="moderation-topline"><strong>{comment.displayName}</strong><span className={`status-pill status-${comment.status.toLowerCase()}`}>{comment.status}</span><time>{formatDate(comment.createdAt)}</time></div><p>{comment.text}</p><span className="comment-on-content">On <b>{content?.title || 'Deleted content'}</b></span></div><div className="moderation-actions">{comment.status !== 'Approved' && <button type="button" className="moderate-approve" title="Approve comment" disabled={busy === comment._id} onClick={() => setStatus(comment, 'Approved')}><Check size={17} /> Approve</button>}{comment.status !== 'Hidden' && <button type="button" className="icon-button" title="Hide comment" aria-label="Hide comment" disabled={busy === comment._id} onClick={() => setStatus(comment, 'Hidden')}><X size={17} /></button>}<button type="button" className="icon-button delete-action" title="Delete comment" aria-label="Delete comment" disabled={busy === comment._id} onClick={() => remove(comment)}><Trash2 size={16} /></button></div></article>;
      })}</div>}
    </div>
  );
}
