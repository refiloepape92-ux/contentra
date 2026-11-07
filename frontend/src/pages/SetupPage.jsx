import { ArrowLeft, ArrowUpRight, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

export default function SetupPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', email: '', password: '', setupKey: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/creator" replace />;

  function change(event) { setForm((value) => ({ ...value, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api('/api/auth/setup', { method: 'POST', body: JSON.stringify(form) });
      window.sessionStorage.setItem('creatorhub_token', result.token);
      setUser(result.user);
      navigate('/creator', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Could not create the creator account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-aside setup-aside"><span className="auth-issue">FIRST EDITION <i /> CREATOR SETUP</span><span className="auth-aside-number">00</span><div><p className="eyebrow"><span className="eyebrow-rule" /> A PRIVATE BEGINNING</p><h1>Set your<br />studio in <em>motion.</em></h1><p>Create the first owner account<br />to start publishing.</p></div><span className="auth-aside-bottom">ONE CREATOR <i /> ONE PRIVATE STUDIO</span></div>
      <div className="auth-main"><Link className="back-link" to="/creator/login"><ArrowLeft size={16} /> Back to sign in</Link><div className="auth-card"><div className="auth-icon"><KeyRound size={21} /></div><p className="eyebrow">ONE-TIME OWNER SETUP</p><h2>Create your<br /><em>creator account.</em></h2><p className="auth-help">Use the one-time setup key configured in the backend environment. This form is disabled after the first account is created.</p>
        <form className="stack-form" onSubmit={submit}>
          <label>Your display name<input name="displayName" value={form.displayName} onChange={change} required minLength={2} maxLength={80} autoComplete="name" placeholder="How viewers will know you" /></label>
          <label>Email address<input name="email" type="email" value={form.email} onChange={change} required maxLength={254} autoComplete="email" placeholder="you@example.com" /></label>
          <label>Password<input name="password" type="password" value={form.password} onChange={change} required minLength={10} maxLength={128} autoComplete="new-password" placeholder="At least 10 characters" /></label>
          <label>One-time setup key<input name="setupKey" type="password" value={form.setupKey} onChange={change} required minLength={1} maxLength={200} autoComplete="off" placeholder="Enter the private setup key" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-dark auth-submit" disabled={busy}>{busy ? 'Creating account…' : 'Create creator account'} <ArrowUpRight size={17} /></button>
        </form>
        <p className="setup-prompt">Already have an account? <Link to="/creator/login">Sign in <ArrowUpRight size={14} /></Link></p>
      </div><p className="auth-footnote">Your password is hashed before it reaches MongoDB.</p></div>
    </div>
  );
}
