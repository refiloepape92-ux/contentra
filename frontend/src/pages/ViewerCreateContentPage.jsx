import { ArrowLeft, Send } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DeviceMediaUpload from '../components/DeviceMediaUpload.jsx';
import { useViewer } from '../context/ViewerContext.jsx';
import { api } from '../lib/api.js';

const initial = { title: '', description: '', category: '', contentType: 'Article', thumbnailUrl: '', mediaUrl: '', body: '' };

export default function ViewerCreateContentPage() {
  const { viewer, ready } = useViewer();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  function change(event) {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  }

  function changeMedia(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (mediaUploading) { setError('Wait for the media upload to finish before submitting.'); return; }
    setBusy(true);
    setError('');
    try {
      await api('/api/contents/viewer', {
        method: 'POST',
        authToken: window.localStorage.getItem('creatorhub_viewer_token'),
        body: JSON.stringify({ ...form, status: 'Draft', isFeatured: false, publishedAt: null }),
      });
      setSent(true);
      window.setTimeout(() => navigate('/viewer/profile'), 900);
    } catch (requestError) {
      setError(requestError.message || 'Your post could not be submitted.');
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <div className="detail-state">Loading your account…</div>;
  if (!viewer) return <section className="public-page"><div className="profile-card viewer-profile-card"><h1>Sign in to share.</h1><Link className="button button-dark" to="/viewer/login">Viewer sign in</Link></div></section>;

  return (
    <section className="public-page viewer-submit-page">
      <Link className="back-link" to="/viewer/profile"><ArrowLeft size={15} /> Back to your profile</Link>
      <div className="profile-card viewer-profile-card viewer-submit-card">
        <p className="eyebrow">COMMUNITY CONTRIBUTION</p>
        <h1>Share your <em>story.</em></h1>
        <p className="auth-help">Your post will be reviewed by the Creator Hub owner before it appears in Other Content Creators. It will not appear in the creator's main home feed.</p>
        {sent ? <div className="form-success">Your post has been submitted for approval. Thank you for contributing!</div> : (
          <form className="stack-form" onSubmit={submit}>
            <label>Title<input name="title" value={form.title} onChange={change} minLength={3} maxLength={140} required placeholder="Give your post a title" /></label>
            <label>Short description<textarea name="description" value={form.description} onChange={change} maxLength={6000} rows={3} placeholder="What is your post about?" /></label>
            <div className="form-columns">
              <label>Category<input name="category" value={form.category} onChange={change} minLength={2} maxLength={60} required placeholder="e.g. Education" /></label>
              <label>Content type<select name="contentType" value={form.contentType} onChange={change}><option>Article</option><option>Video</option><option>Image</option><option>Podcast</option><option>Other</option></select></label>
            </div>
            <DeviceMediaUpload role="viewer" mediaUrl={form.mediaUrl} thumbnailUrl={form.thumbnailUrl} contentType={form.contentType} onChange={changeMedia} onUploadStateChange={setMediaUploading} />
            <label>Thumbnail image URL<input type="text" inputMode="url" name="thumbnailUrl" value={form.thumbnailUrl} onChange={change} maxLength={2048} placeholder="https://… or /uploads/…" /></label>
            <label>Media link (optional)<input type="text" inputMode="url" name="mediaUrl" value={form.mediaUrl} onChange={change} maxLength={2048} placeholder="https://… or /uploads/…" /></label>
            <label>Your content<textarea name="body" value={form.body} onChange={change} rows={8} maxLength={50000} placeholder="Write your article or add details about your media…" /></label>
            <div className="submission-notice"><strong>Approval required</strong><span>Only you and the creator can see this submission until it is approved.</span></div>
            <button className="button button-dark" disabled={busy || mediaUploading}>{mediaUploading ? 'Uploading media…' : busy ? 'Submitting…' : 'Submit for approval'} <Send size={15} /></button>
            {error && <p className="form-error" role="alert">{error}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
