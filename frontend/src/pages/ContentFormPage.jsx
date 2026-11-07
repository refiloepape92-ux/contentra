import { ArrowLeft, ArrowUpRight, Eye, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DeviceMediaUpload from '../components/DeviceMediaUpload.jsx';
import ProtectedMediaImage from '../components/ProtectedMediaImage.jsx';
import { api } from '../lib/api.js';

const blank = { title: '', description: '', category: '', contentType: 'Article', thumbnailUrl: '', mediaUrl: '', body: '', status: 'Draft', publishedAt: '', isFeatured: false };
function toLocalDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function ContentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api('/api/contents/manage').then(({ contents }) => {
      const found = contents.find((item) => item._id === id);
      if (!found) throw new Error('This content item could not be found.');
      setForm({
        title: found.title || '', description: found.description || '', category: found.category || '', contentType: found.contentType || 'Article',
        thumbnailUrl: found.thumbnailUrl || '', mediaUrl: found.mediaUrl || '', body: found.body || '', status: found.status || 'Draft',
        publishedAt: toLocalDateTime(found.publishedAt), isFeatured: Boolean(found.isFeatured),
      });
    }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, [editing, id]);

  function change(event) {
    const { name, value, checked, type } = event.target;
    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
    setSaved(false);
  }

  function changeMedia(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
    setSaved(false);
  }

  async function submit(event) {
    event.preventDefault();
    if (mediaUploading) { setError('Wait for the media upload to finish before saving.'); return; }
    setBusy(true);
    setError('');
    setSaved(false);
    const payload = {
      ...form,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
      isFeatured: form.status === 'Draft' ? false : form.isFeatured,
    };
    try {
      if (editing) await api(`/api/contents/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await api('/api/contents', { method: 'POST', body: JSON.stringify(payload) });
      setSaved(true);
      window.setTimeout(() => navigate('/creator/content'), 550);
    } catch (requestError) { setError(requestError.message || 'Could not save this content.'); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="studio-loading">Loading the editor…</div>;
  return (
    <div className="content-form-page">
      <Link className="back-link" to="/creator/content"><ArrowLeft size={16} /> Back to content</Link>
      <div className="page-title-row editor-heading"><div><p className="eyebrow"><span className="eyebrow-rule" /> {editing ? 'REFINE A PIECE' : 'MAKE SOMETHING NEW'}</p><h1>{editing ? 'Edit your' : 'A new'} <em>{editing ? 'story.' : 'story.'}</em></h1><p className="page-deck">Add enough detail for viewers to know why this one matters.</p></div><span className={`status-pill status-${form.status.toLowerCase()}`}>{form.status}</span></div>
      {error && <div className="form-error manager-error" role="alert">{error}</div>}
      {saved && <div className="form-success" role="status">Saved. Taking you back to your content…</div>}
      <form className="editor-layout" onSubmit={submit}>
        <div className="editor-main-fields">
          <section className="editor-card"><div className="editor-card-heading"><span>01</span><div><h2>The essentials</h2><p>Give your piece a clear title and a little context.</p></div></div>
            <label>Title <span className="required-mark">*</span><input name="title" value={form.title} onChange={change} required minLength={3} maxLength={140} placeholder="A title that makes someone pause" /></label>
            <label>Description<textarea name="description" value={form.description} onChange={change} rows={4} maxLength={6000} placeholder="A short introduction to what viewers will find…" /></label>
            <div className="form-columns"><label>Category <span className="required-mark">*</span><input name="category" list="category-suggestions" value={form.category} onChange={change} required minLength={2} maxLength={60} placeholder="e.g. Education" /><datalist id="category-suggestions"><option value="Education" /><option value="Technology" /><option value="Entertainment" /><option value="Lifestyle" /></datalist></label><label>Content type <span className="required-mark">*</span><select name="contentType" value={form.contentType} onChange={change}><option>Article</option><option>Video</option><option>Image</option><option>Podcast</option><option>Other</option></select></label></div>
          </section>
          <section className="editor-card"><div className="editor-card-heading"><span>02</span><div><h2>Where to find it</h2><p>Link to your media or write an article right here.</p></div></div>
            <DeviceMediaUpload role="creator" mediaUrl={form.mediaUrl} thumbnailUrl={form.thumbnailUrl} contentType={form.contentType} onChange={changeMedia} onUploadStateChange={setMediaUploading} />
            <label>Thumbnail image URL<input name="thumbnailUrl" type="text" inputMode="url" value={form.thumbnailUrl} onChange={change} maxLength={2048} placeholder="https://… or /uploads/…" /></label>
            {form.thumbnailUrl && <ProtectedMediaImage className="thumbnail-preview" src={form.thumbnailUrl} authToken={window.sessionStorage.getItem('creatorhub_token')} alt="Thumbnail preview" />}
            <label>Media or article link<input name="mediaUrl" type="text" inputMode="url" value={form.mediaUrl} onChange={change} maxLength={2048} placeholder="https://… or /uploads/…" /></label>
            <label>Article content<textarea name="body" value={form.body} onChange={change} rows={9} maxLength={50000} placeholder="Write the article body here. This appears on the public detail page." /></label>
          </section>
        </div>
        <aside className="editor-side-fields">
          <section className="editor-card editor-publish-card"><div className="editor-card-heading"><span>03</span><div><h2>Publishing</h2><p>Choose what happens next.</p></div></div>
            <label>Status<select name="status" value={form.status} onChange={change}><option value="Draft">Save as draft</option><option value="Published">Publish now</option><option value="Scheduled">Schedule for later</option></select></label>
            <label>Publication date &amp; time<input name="publishedAt" type="datetime-local" value={form.publishedAt} onChange={change} /></label>
            <p className="field-hint">Scheduled content goes live at its chosen time. Leave the date empty to publish now.</p>
            <label className="checkbox-row"><input type="checkbox" name="isFeatured" checked={form.isFeatured} disabled={form.status === 'Draft'} onChange={change} /><span><strong>Feature this piece</strong><small>Show it at the top of your public portal.</small></span></label>
          </section>
          <div className="editor-save-note"><Eye size={17} /><p>Drafts stay private. Only published work appears in the public reading room.</p></div>
          <div className="editor-actions"><button className="button button-dark" disabled={busy || mediaUploading}>{mediaUploading ? 'Uploading media…' : busy ? 'Saving…' : <>{form.status === 'Draft' ? <Save size={16} /> : <ArrowUpRight size={17} />}{editing ? 'Save changes' : form.status === 'Draft' ? 'Save draft' : form.status === 'Scheduled' ? 'Schedule piece' : 'Publish piece'}</>}</button><Link className="button button-light" to="/creator/content">Cancel</Link></div>
        </aside>
      </form>
    </div>
  );
}
