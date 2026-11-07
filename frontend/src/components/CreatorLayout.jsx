import { BarChart3, Bell, CircleUserRound, FileText, LogOut, MessageSquareText, Plus, Sparkles } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/creator', label: 'Overview', icon: BarChart3, end: true },
  { to: '/creator/content', label: 'Your content', icon: FileText },
  { to: '/creator/comments', label: 'Conversations', icon: MessageSquareText },
  { to: '/creator/notifications', label: 'Notifications', icon: Bell },
  { to: '/creator/profile', label: 'Creator profile', icon: CircleUserRound },
];

export default function CreatorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let active = true;
    const refreshUnread = () => api('/api/notifications/unread-count').then((result) => {
      if (active) setUnread(result.unread || 0);
    }).catch(() => {});
    const handleUnreadUpdate = (event) => setUnread(event.detail?.unread || 0);
    refreshUnread();
    const timer = window.setInterval(refreshUnread, 30_000);
    window.addEventListener('focus', refreshUnread);
    window.addEventListener('creatorhub:notifications-unread', handleUnreadUpdate);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshUnread);
      window.removeEventListener('creatorhub:notifications-unread', handleUnreadUpdate);
    };
  }, []);
  function handleLogout() {
    logout();
    navigate('/');
  }
  return (
    <div className="studio-shell">
      <aside className="studio-sidebar">
        <NavLink className="studio-brand" to="/creator"><span className="wordmark-mark"><i /><i /><i /></span><span>CONTE<span className="wordmark-accent">NTRA</span></span></NavLink>
        <p className="sidebar-label">YOUR STUDIO</p>
        <nav className="studio-nav" aria-label="Creator dashboard">
          {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `studio-nav-link ${isActive ? 'active' : ''}`}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{to === '/creator/notifications' && unread > 0 && <small className="nav-unread-count">{unread > 99 ? '99+' : unread}</small>}</NavLink>)}
        </nav>
        <NavLink className="studio-new-button" to="/creator/content/new"><Plus size={17} /> New content</NavLink>
        <div className="sidebar-bottom">
          <div className="creator-mini-avatar">{(user?.displayName || 'C').slice(0, 1).toUpperCase()}</div>
          <div className="creator-mini-copy"><strong>{user?.displayName || 'Creator'}</strong><span>Creator account</span></div>
          <button type="button" className="icon-button signout-button" aria-label="Sign out" title="Sign out" onClick={handleLogout}><LogOut size={17} /></button>
        </div>
      </aside>
      <div className="studio-main">
        <header className="studio-topbar">
          <div className="studio-breadcrumb"><Sparkles size={15} /> <span>Your creator studio</span></div>
          <span className="topbar-status"><span /> PRIVATE WORKSPACE</span>
        </header>
        <main className="studio-content"><Outlet /></main>
      </div>
    </div>
  );
}
