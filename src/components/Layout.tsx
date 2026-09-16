import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { AppIcon, type IconName } from './AppIcon';
import { Avatar, VerificationBadge } from './ui';
import type { UserRole } from '../lib/types';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

const NAV: Record<UserRole, Array<{ group: string; items: NavItem[] }>> = {
  CANDIDATE: [
    {
      group: 'Workspace',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: 'home' },
        { to: '/profile', label: 'My profile', icon: 'profile' },
        { to: '/cv', label: 'CV & ATS report', icon: 'ats' },
        { to: '/verification', label: 'Verification', icon: 'verification' },
        { to: '/preview', label: 'Recruiter view', icon: 'eye' },
      ],
    },
    {
      group: 'Opportunities',
      items: [
        { to: '/jobs', label: 'Recommended jobs', icon: 'discover' },
        { to: '/applications', label: 'My applications', icon: 'applications' },
        { to: '/messages', label: 'Messages', icon: 'messages' },
      ],
    },
    {
      group: 'Account',
      items: [
        { to: '/privacy', label: 'Privacy control', icon: 'lock' },
        { to: '/notifications', label: 'Notifications', icon: 'notification' },
        { to: '/settings', label: 'Settings', icon: 'settings' },
      ],
    },
  ],
  RECRUITER: [
    {
      group: 'Hiring',
      items: [
        { to: '/recruiter', label: 'Dashboard', icon: 'dashboard' },
        { to: '/recruiter/search', label: 'Candidate search', icon: 'search' },
        { to: '/recruiter/saved', label: 'Talent pools', icon: 'bookmark' },
        { to: '/recruiter/jobs', label: 'Jobs', icon: 'jobs' },
        { to: '/recruiter/messages', label: 'Messages', icon: 'messages' },
      ],
    },
    {
      group: 'Company',
      items: [
        { to: '/recruiter/company', label: 'Company profile', icon: 'company' },
        { to: '/recruiter/team', label: 'Recruiters', icon: 'users' },
        { to: '/notifications', label: 'Notifications', icon: 'notification' },
        { to: '/settings', label: 'Settings', icon: 'settings' },
      ],
    },
  ],
  ADMIN: [
    {
      group: 'Overview',
      items: [
        { to: '/admin', label: 'Dashboard', icon: 'dashboard' },
        { to: '/admin/analytics', label: 'Analytics', icon: 'chart' },
      ],
    },
    {
      group: 'Moderation',
      items: [
        { to: '/admin/verification', label: 'Verification queue', icon: 'verification' },
        { to: '/admin/reports', label: 'Reports', icon: 'flag' },
        { to: '/admin/cvs', label: 'CV / ATS monitoring', icon: 'cv' },
      ],
    },
    {
      group: 'Platform',
      items: [
        { to: '/admin/users', label: 'Users', icon: 'users' },
        { to: '/admin/companies', label: 'Companies', icon: 'building' },
        { to: '/admin/rules', label: 'Verification rules', icon: 'rules' },
        { to: '/admin/audit', label: 'Audit logs', icon: 'audit' },
        { to: '/settings', label: 'Settings', icon: 'settings' },
      ],
    },
  ],
  VERIFICATION_OFFICER: [
    {
      group: 'Review',
      items: [
        { to: '/admin', label: 'Dashboard', icon: 'dashboard' },
        { to: '/admin/verification', label: 'Verification queue', icon: 'verification' },
        { to: '/admin/reports', label: 'Reports', icon: 'flag' },
        { to: '/admin/cvs', label: 'CV / ATS monitoring', icon: 'cv' },
        { to: '/settings', label: 'Settings', icon: 'settings' },
      ],
    },
  ],
};

const COLLAPSE_KEY = 'hr.sidebarCollapsed';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggle } = useTheme();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');

  // Navigating on a phone should close the drawer, never leave it hanging open.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Escape closes the drawer; while it is open the page behind must not scroll.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      localStorage.setItem(COLLAPSE_KEY, current ? '0' : '1');
      return !current;
    });
  };

  const { data: unread } = useQuery({
    queryKey: ['unread-messages'],
    queryFn: async () => (await api.get<{ unread: number }>('/conversations/unread-count')).data,
    enabled: Boolean(user),
    refetchInterval: 60_000,
  });

  if (!user) return null;
  const groups = NAV[user.role] ?? [];
  const messagesPath = user.role === 'RECRUITER' ? '/recruiter/messages' : '/messages';
  const displayName = user.candidateProfile?.fullName ?? user.company?.name ?? user.email;
  const workspace =
    user.role === 'CANDIDATE'
      ? 'Candidate workspace'
      : user.role === 'RECRUITER'
        ? 'Hiring workspace'
        : 'Administration';

  return (
    <div className={`app-shell ${collapsed ? 'rail' : ''}`}>
      <div
        className={`sidebar-scrim ${drawerOpen ? 'open' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`sidebar ${drawerOpen ? 'open' : ''}`}
        id="app-sidebar"
        aria-label="Main navigation"
      >
        <div className="brand">
          <span className="brand-mark">
            <AppIcon name="shield" size={17} strokeWidth={1.9} />
          </span>
          <span className="brand-text">
            TalentSphere
            <small>{workspace}</small>
          </span>
          <button
            className="sidebar-close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
          >
            <AppIcon name="close" size={18} />
          </button>
        </div>

        <nav className="nav-scroll">
          {groups.map((group, groupIndex) => (
            <div key={group.group} className="nav-group">
              <div className="nav-group-label">{group.group}</div>
              {group.items.map((item, itemIndex) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin' || item.to === '/recruiter'}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  style={{ animationDelay: `${(groupIndex * 4 + itemIndex) * 22}ms` }}
                >
                  <AppIcon name={item.icon} size={18} />
                  <span className="nav-label">{item.label}</span>
                  {item.to === messagesPath && unread?.unread ? (
                    <span className="nav-count">{unread.unread}</span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <button
          className="sidebar-collapse"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <AppIcon name={collapsed ? 'forward' : 'back'} size={16} />
          <span className="nav-label">Collapse</span>
        </button>

        <div className="sidebar-footer">
          Advisory scores
          <br />
          Privacy by default
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="row">
            <button
              className="icon-btn menu-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              aria-controls="app-sidebar"
            >
              <AppIcon name="list" size={18} />
            </button>

            <Avatar name={displayName} size={36} />
            <div className="topbar-identity">
              <div style={{ fontWeight: 600, lineHeight: 1.25 }}>{displayName}</div>
              <div className="row" style={{ gap: 6 }}>
                {user.role === 'CANDIDATE' && user.candidateProfile && (
                  <VerificationBadge status={user.candidateProfile.verificationStatus} />
                )}
                {user.role === 'RECRUITER' && user.company && (
                  <VerificationBadge status={user.company.verificationStatus} />
                )}
                {(user.role === 'ADMIN' || user.role === 'VERIFICATION_OFFICER') && (
                  <span className="muted" style={{ fontSize: 12.5 }}>
                    {user.role === 'ADMIN' ? 'Administrator' : 'Verification officer'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="row">
            {!user.emailVerified && (
              <NavLink to="/verify-email" className="badge warning hide-sm" style={{ textDecoration: 'none' }}>
                <AppIcon name="warning" size={12} strokeWidth={2.3} /> Verify email
              </NavLink>
            )}
            <button
              className="theme-toggle"
              onClick={toggle}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              <AppIcon name={isDark ? 'sun' : 'moon'} size={17} />
            </button>
            <NavLink to="/notifications" className="icon-btn" aria-label="Notifications">
              <AppIcon name="notification" size={17} />
              {user.unreadNotifications ? <span className="dot" /> : null}
            </NavLink>
            <button
              className="secondary btn-sm hide-sm"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
            >
              <AppIcon name="logout" size={15} /> Sign out
            </button>
            <button
              className="icon-btn show-sm"
              aria-label="Sign out"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
            >
              <AppIcon name="logout" size={17} />
            </button>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
