import { ArrowLeft, ArrowUpRight, BookOpen, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useViewer } from '../context/ViewerContext.jsx';

export default function ViewerAuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const { login, register } = useViewer();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { if (isRegister) await register(name, email, password); else await login(email, password); navigate(location.state?.from || '/viewer/profile', { replace: true }); }
    catch (e) { setError(e.message || 'Could not complete your request.'); }
    finally { setBusy(false); }
  }
  return <section className="auth-page"><aside className="auth-aside"><p className="auth-issue"><i /> THE READING COMMUNITY</p><div><span className="auth-aside-number">02</span><p className="eyebrow">YOUR PLACE IN THE STORY</p><h1>Read. Reflect.<br/><em>Belong.</em></h1><p>Create a free reader account to join conversations and keep your Creator Hub experience close.</p></div><p className="auth-aside-bottom"><i /> STORIES ARE BETTER SHARED</p></aside><div className="auth-main"><Link className="back-link" to="/"><ArrowLeft size={15}/> Back to stories</Link><div className="auth-card"><div className="auth-icon"><UserRound size={20}/></div><p className="eyebrow">VIEWER ACCOUNT</p><h2>{isRegister ? 'Join the room.' : 'Welcome back.'}</h2><p className="auth-help">{isRegister ? 'Create an account to take part in the Creator Hub community.' : 'Sign in to return to your reader profile.'}</p><form className="stack-form" onSubmit={submit}>{isRegister && <label>Your name<input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={80} autoComplete="name" required placeholder="Your display name"/></label>}<label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required placeholder="you@example.com"/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={isRegister?10:1} autoComplete={isRegister?'new-password':'current-password'} required placeholder={isRegister?'At least 10 characters':'Your password'}/></label><button className="button button-dark auth-submit" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create viewer account' : 'Sign in'} <ArrowUpRight size={16}/></button>{error && <p className="form-error" role="alert">{error}</p>}</form><p className="setup-prompt">{isRegister ? 'Already have an account?' : 'New to Creator Hub?'} <Link to={isRegister?'/viewer/login':'/viewer/register'}>{isRegister?'Sign in':'Create a viewer account'} <ArrowUpRight size={12}/></Link></p><p className="setup-prompt"><Link to="/creator/login">Creator? Sign in to your studio</Link></p></div><p className="auth-footnote"><BookOpen size={12}/> CREATOR HUB · READER COMMUNITY</p></div></section>;
}
