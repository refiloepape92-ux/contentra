import { ArrowUpRight, Bell, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useViewer } from '../context/ViewerContext.jsx';

export default function SiteChrome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { viewer, notificationUnread } = useViewer();
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="wordmark" to="/" aria-label="Creator Hub home" onClick={() => setMenuOpen(false)}>
          <span className="wordmark-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>creator<span className="wordmark-accent">hub</span></span>
        </Link>
        <button className="mobile-menu-toggle" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={`public-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <Link to="/#stories" onClick={() => setMenuOpen(false)}>The stories</Link>
          <Link to="/#other-creators" onClick={() => setMenuOpen(false)}>Other Content Creators</Link>
          <Link to={viewer ? "/viewer/profile" : "/viewer/login"} onClick={() => setMenuOpen(false)}>{viewer ? "My creator space" : "Reader sign in"}</Link>
          {viewer ? <Link className="viewer-nav-activity" to="/viewer/notifications" onClick={() => setMenuOpen(false)}><Bell size={15} /> Activity{notificationUnread > 0 && <span className="viewer-nav-unread" aria-label={`${notificationUnread} unread notifications`}>{notificationUnread > 99 ? '99+' : notificationUnread}</span>}</Link> : <Link to="/viewer/register" onClick={() => setMenuOpen(false)}>Join</Link>}
          <Link className="nav-login" to="/creator/login" onClick={() => setMenuOpen(false)}>Creator sign in <ArrowUpRight size={15} /></Link>
        </nav>
      </header>
      <main><Outlet /></main>
      <footer className="site-footer">
        <span>Creator Hub <span className="footer-dot">·</span> stories, thoughtfully shared</span>
        <Link to="/creator/login">Creator studio <ArrowUpRight size={14} /></Link>
      </footer>
    </div>
  );
}
