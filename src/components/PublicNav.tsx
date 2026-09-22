import { Link, useLocation } from 'react-router-dom';
import { AppIcon } from './AppIcon';
import { useAuth } from '../lib/auth';
import { useScrollY } from '../lib/reveal';
import { useTheme } from '../lib/theme';
import { homeFor } from './ProtectedRoute';

/**
 * The bar every signed-out page wears. The landing page points at its own sections,
 * so the links are passed in rather than hard-coded here.
 */
export function PublicNav({
  links = [
    { href: '/browse-jobs', label: 'Browse jobs' },
    { href: '/#capabilities', label: 'Product' },
    { href: '/#mobile', label: 'Mobile app' },
    { href: '/#workspaces', label: 'Dashboards' },
  ],
}: {
  links?: Array<{ href: string; label: string }>;
}) {
  const { isDark, toggle } = useTheme();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const scrollY = useScrollY();

  return (
    <header className={`landing-nav ${scrollY > 8 ? 'condensed' : ''}`}>
      <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
        <span className="brand-mark">
          <AppIcon name="shield" size={17} strokeWidth={1.9} />
        </span>
        <span>
          TalentSphere
          <small>Verified talent</small>
        </span>
      </Link>

      <nav className="landing-links">
        {links.map((link) =>
          link.href.startsWith('/#') ? (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ) : (
            <Link
              key={link.href}
              to={link.href}
              className={pathname.startsWith(link.href) ? 'here' : ''}
            >
              {link.label}
            </Link>
          ),
        )}
      </nav>

      <div className="row">
        <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
          <AppIcon name={isDark ? 'sun' : 'moon'} size={16} />
        </button>
        {user ? (
          <Link to={homeFor(user.role)} className="btn btn-sm btn-shine">
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary btn-sm">
              Sign in
            </Link>
            <Link to="/register" className="btn btn-sm btn-shine">
              Create account
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

/** A hairline that fills across the top as the page scrolls. */
export function ScrollProgress() {
  const scrollY = useScrollY();
  const height =
    typeof document === 'undefined'
      ? 1
      : Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.min(100, (scrollY / height) * 100);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <i style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  );
}

export function PublicFooter() {
  return (
    <footer className="landing-footer">
      <div className="row between wrap" style={{ marginBottom: 18, gap: 18 }}>
        <div className="brand" style={{ padding: 0 }}>
          <span className="brand-mark">
            <AppIcon name="shield" size={16} strokeWidth={1.9} />
          </span>
          <span>TalentSphere</span>
        </div>
        <nav className="landing-links">
          <Link to="/browse-jobs">Browse jobs</Link>
          <Link to="/register?role=CANDIDATE">For candidates</Link>
          <Link to="/register?role=RECRUITER">For companies</Link>
          <Link to="/login">Sign in</Link>
        </nav>
      </div>
      <p style={{ maxWidth: '80ch' }}>
        ATS scores and match scores are automated, advisory assessments and may contain errors; they
        must not be the sole basis for a hiring decision. A verification badge indicates completion of
        defined platform checks — not a guarantee of skill, honesty, employment history or hiring
        suitability.
      </p>
      <p className="mb-0" style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
        Photography from Unsplash, bundled with the site. The people pictured are not TalentSphere
        users and appear for illustration only.
      </p>
    </footer>
  );
}
