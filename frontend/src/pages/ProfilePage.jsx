import { ArrowUpRight, CircleUserRound, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

const initial = { displayName: '', bio: '', avatarUrl: '' };
export default function ProfilePage() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { setUser } = useAuth();
  useEffect(() => {
    api('/api/creator/profile').then((result) => setForm({ ...initial, ...result.profile })).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, []);
  function change(event) { setForm((previous) => ({ ...previous, [event.target.name]: event.target.value })); setSuccess(''); }
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError(''); setSuccess('');
    try {
      const result = await api('/api/creator/profile', { method: 'PUT', body: JSON.stringify(form) });
      setForm(result.profile);
      setUser((user) => user ? { ...user, ...result.profile } : user);
      setSuccess('Your public profile has been updated.');
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }
  if (loading) return <div className="studio-loading">Opening profile settings…</div>;
  return (
    <div className="profile-page"><div className="page-title-row"><div><p className="eyebrow"><span className="eyebrow-rule" /> THE BYLINE</p><h1>Your <em>profile.</em></h1><p className="page-deck">This is how your name and story appear to viewers.</p></div><a className="panel-link" href="/" target="_blank" rel="noreferrer">View public page <ArrowUpRight size={15} /></a></div>
      <form className="profile-card" onSubmit={submit}><div className="profile-preview">{form.avatarUrl ? <img src={form.avatarUrl} alt="Creator profile preview" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <div className="profile-preview-monogram">{form.displayName.slice(0, 1).toUpperCase() || <CircleUserRound size={29} />}</div>}<div><span>PUBLIC CREATOR PROFILE</span><strong>{form.displayName || 'Your creator name'}</strong><p>{form.bio || 'A little introduction about you and your work.'}</p></div></div>
        <label>Creator name<input name="displayName" value={form.displayName} onChange={change} required minLength={2} maxLength={80} placeholder="Your name or channel name" /></label>
        <label>Introduction<textarea name="bio" value={form.bio} onChange={change} rows={5} maxLength={1200} placeholder="Tell viewers what you make and why you make it…" /></label>
        <label>Profile picture URL<input name="avatarUrl" type="url" value={form.avatarUrl} onChange={change} maxLength={2048} placeholder="https://…" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}{success && <p className="form-success" role="status">{success}</p>}
        <div className="profile-save-row"><p>Your profile is public and appears on the viewer home page.</p><button className="button button-dark" disabled={busy}>{busy ? 'Saving…' : <><Save size={16} /> Save profile</>}</button></div>
      </form>
    </div>
  );
}
