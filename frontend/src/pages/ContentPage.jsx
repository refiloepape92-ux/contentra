import { ArrowLeft, ArrowUpRight, Check, Copy, Heart, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, assetUrl, formatDate, getViewerKey } from '../lib/api.js';
import { useViewer } from '../context/ViewerContext.jsx';
import { Bookmark } from 'lucide-react';

export default function ContentPage() {
  const { id } = useParams();
  const { viewer, saveBookmark, removeBookmark, ready } = useViewer();
  const [saved, setSaved] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [content, setContent] = useState(null);
  const [comments, setComments] = useState([]);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentNote, setCommentNote] = useState('');
  const [commentError, setCommentError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let active = true;
    const viewerKey = getViewerKey();
    setLoading(true);
    Promise.all([
      api(`/api/contents/${id}`),
      api(`/api/comments/${id}`),
      api(`/api/likes?contentId=${encodeURIComponent(id)}&viewerKey=${encodeURIComponent(viewerKey)}`),
    ]).then(([contentResult, commentsResult, likeResult]) => {
      if (!active) return;
      setContent(contentResult.content);
      setComments(commentsResult.comments || []);
      setLiked(likeResult.liked);
      setLikesCount(likeResult.likesCount);
      setError('');
      const viewKey = `creatorhub_viewed_${id}`;
      if (!window.sessionStorage.getItem(viewKey)) {
        window.sessionStorage.setItem(viewKey, '1');
        api(`/api/contents/${id}/view`, { method: 'POST' }).then((result) => {
          if (active) setContent((previous) => previous ? { ...previous, views: result.views } : previous);
        }).catch(() => {});
      }
    }).catch((requestError) => {
      if (active) setError(requestError.status === 503 ? 'This story will be available when the Atlas database is connected.' : requestError.message || 'We could not open this story.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!ready || !viewer) { setSaved(false); return; }
    let active = true;
    api('/api/bookmarks', { authToken: window.localStorage.getItem('creatorhub_viewer_token') })
      .then((result) => { if (active) setSaved((result.bookmarks || []).some((item) => item.contentId?._id === id)); })
      .catch(() => {});
    return () => { active = false; };
  }, [id, viewer, ready]);

  async function toggleBookmark() {
    if (!viewer) { window.location.href = '/viewer/login'; return; }
    setBookmarkBusy(true);
    try {
      if (saved) await removeBookmark(id); else await saveBookmark(id);
      setSaved(!saved);
    } catch (e) { setCommentError(e.message); }
    finally { setBookmarkBusy(false); }
  }

  async function toggleLike() {
    setLikeBusy(true);
    try {
      const result = await api('/api/likes', { method: 'POST', body: JSON.stringify({ contentId: id, viewerKey: getViewerKey() }) });
      setLiked(result.liked);
      setLikesCount(result.likesCount);
    } catch (requestError) {
      setCommentError(requestError.message);
    } finally {
      setLikeBusy(false);
    }
  }

  async function shareContent() {
    const shareData = { title: content.title, text: content.description, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
      }
    } catch (shareError) {
      if (shareError?.name !== 'AbortError') setCommentError('Could not share this link. Copy the page address from your browser.');
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    setSubmitting(true);
    setCommentNote('');
    setCommentError('');
    try {
      const result = await api('/api/comments', { method: 'POST', body: JSON.stringify({ contentId: id, displayName, text: commentText, viewerKey: getViewerKey() }) });
      setCommentText('');
      setCommentNote(result.message || 'Your comment was sent for review.');
    } catch (requestError) {
      setCommentError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="detail-state">Opening the story<span>···</span></div>;
  if (error || !content) return <div className="detail-state"><Link className="back-link" to="/"><ArrowLeft size={16} /> Back to the reading room</Link><h1>Story not available</h1><p>{error || 'This published content could not be found.'}</p></div>;

  return (
    <article className="content-detail">
      <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to the reading room</Link>
      <div className="detail-meta"><span>{content.category}</span><i />{content.contentType}<i />{formatDate(content.publishedAt)}<span className="detail-views">{(content.views || 0).toLocaleString()} views</span></div>
      <h1>{content.title}</h1>
      {content.authorType === 'viewer' && content.authorName && <p className="detail-author-byline">By <strong>{content.authorName}</strong></p>}
      {content.description && <p className="detail-deck">{content.description}</p>}
      {content.thumbnailUrl && <img className="detail-image" src={assetUrl(content.thumbnailUrl)} alt={`${content.title} cover`} />}
      {content.contentType === 'Video' && content.mediaUrl?.startsWith('/uploads/') && <video className="detail-video" src={assetUrl(content.mediaUrl)} controls playsInline preload="metadata" aria-label={`${content.title} video`} />}
      {content.contentType === 'Image' && content.mediaUrl?.startsWith('/uploads/') && content.mediaUrl !== content.thumbnailUrl && <img className="detail-image" src={assetUrl(content.mediaUrl)} alt={`${content.title} media`} />}
      <div className="detail-actions">
        <button type="button" className="engagement-button" onClick={toggleBookmark} disabled={bookmarkBusy}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save story'}</button>
        <button type="button" className={`engagement-button ${liked ? 'is-liked' : ''}`} onClick={toggleLike} disabled={likeBusy}><Heart size={18} fill={liked ? 'currentColor' : 'none'} /> {liked ? 'Liked' : 'Like'} <span>{likesCount}</span></button>
        <button type="button" className="engagement-button" onClick={shareContent}>{shared ? <Check size={17} /> : navigator.share ? <Share2 size={17} /> : <Copy size={17} />} {shared ? 'Link copied' : navigator.share ? 'Share story' : 'Copy link'}</button>
        {content.mediaUrl && <a className="engagement-button" href={assetUrl(content.mediaUrl)} target="_blank" rel="noreferrer">Open media <ArrowUpRight size={17} /></a>}
      </div>
      {content.body && <div className="article-body">{content.body}</div>}
      <section className="comments-section">
        <div className="comments-heading"><div><p className="eyebrow"><span className="eyebrow-rule" /> THE CONVERSATION</p><h2>Leave a little <em>thought.</em></h2></div><span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span></div>
        <form className="comment-form" onSubmit={submitComment}>
          <label>Your name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={60} required placeholder="How should we know you?" /></label>
          <label>Your comment<textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} minLength={2} maxLength={1500} required rows={4} placeholder="Add something thoughtful to the conversation…" /></label>
          <div className="comment-submit-row"><p>Comments may appear after creator review.</p><button className="button button-dark" disabled={submitting}>{submitting ? 'Sending…' : 'Post comment'} <ArrowUpRight size={16} /></button></div>
          {commentNote && <p className="form-success" role="status">{commentNote}</p>}
          {commentError && <p className="form-error" role="alert">{commentError}</p>}
        </form>
        <div className="comment-list">{comments.length ? comments.map((comment) => <article className="comment-card" key={comment._id}><div className="comment-avatar">{comment.displayName.slice(0, 1).toUpperCase()}</div><div><div className="comment-byline"><strong>{comment.displayName}</strong><time>{formatDate(comment.createdAt)}</time></div><p>{comment.text}</p></div></article>) : <p className="no-comments">No public comments yet. Be the first to start a kind conversation.</p>}</div>
      </section>
    </article>
  );
}
