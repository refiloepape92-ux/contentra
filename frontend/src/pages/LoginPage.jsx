import { ArrowLeft, ArrowUpRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/creator" replace />;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate(location.state?.from || '/creator', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Could not sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-aside"><span className="auth-issue">PRIVATE STUDIO <i /> 01</span><span className="auth-aside-number">01</span><div><p className="eyebrow"><span className="eyebrow-rule" /> YOUR WORKSPACE</p><h1>Make the<br />next thing <em>matter.</em></h1><p>Everything you publish,<br />all in one considered place.</p></div><span className="auth-aside-bottom">CREATOR HUB <i /> CONTENT & COMMUNITY</span></div>
      <div className="auth-main"><Link className="back-link" to="/"><ArrowLeft size={16} /> Back to the public portal</Link><div className="auth-card"><div className="auth-icon"><LockKeyhole size={21} /></div><p className="eyebrow">CREATOR ACCESS</p><h2>Sign in to your<br /><em>studio.</em></h2><p className="auth-help">Your private space for the work you share with the world.</p>
        <form className="stack-form" onSubmit={submit}>
          <label>Email address<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} placeholder="you@example.com" /></label>
          <label>Password<span className="password-wrap"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={128} placeholder="Your password" /><button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-dark auth-submit" disabled={busy}>{busy ? 'Signing in…' : 'Enter your studio'} <ArrowUpRight size={17} /></button>
        </form>
        <p className="setup-prompt">Setting this up for the first time? <Link to="/creator/setup">Create the owner account <ArrowUpRight size={14} /></Link></p>
      </div><p className="auth-footnote">Only the creator can access this space.</p></div>
    </div>
  );
}
