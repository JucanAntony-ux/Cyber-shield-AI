import { Link, NavLink, Outlet } from 'react-router-dom';
import GuidanceNotice from './GuidanceNotice';

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="site-header no-print">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true" />
            CyberShield AI
          </Link>
          <nav className="site-nav" aria-label="Main">
            <NavLink to="/" end>
              Dashboard
            </NavLink>
            <NavLink to="/passwords">Passwords</NavLink>
            <NavLink to="/phishing">Phishing</NavLink>
            <NavLink to="/files">Files</NavLink>
            <NavLink to="/reports">Reports</NavLink>
            <NavLink to="/library">Learn</NavLink>
            <NavLink to="/problems/new">Get help</NavLink>
            <NavLink to="/resources">Resources</NavLink>
          </nav>
        </div>
      </header>
      <main className="container main">
        <Outlet />
      </main>
      <footer className="site-footer no-print">
        <div className="container">
          <GuidanceNotice />
        </div>
      </footer>
    </div>
  );
}
