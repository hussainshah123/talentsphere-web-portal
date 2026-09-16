import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AppIcon } from '../../components/AppIcon';
import { useTheme } from '../../lib/theme';

const FACTS = [
  ['01', 'Ten verification checks', 'Each one visible to the candidate, each one revocable.'],
  ['02', 'Eight ATS factors', 'Scored deterministically, with the arithmetic shown.'],
  ['03', 'Zero contact details', 'Nothing private leaves the profile without consent.'],
  ['04', 'Every view logged', 'Profile views, CV downloads and decisions are audited.'],
];

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { isDark, toggle } = useTheme();

  return (
    <div className="auth-layout">
      <aside className="auth-aside">
        <div>
          <Link to="/" className="brand" style={{ padding: 0, textDecoration: 'none' }}>
            <span className="brand-mark">
              <AppIcon name="shield" size={17} strokeWidth={1.9} />
            </span>
            <span style={{ color: '#fff' }}>
              TalentSphere
              <small>Verified talent</small>
            </span>
          </Link>

          <h2 style={{ marginTop: 40 }}>Proof, not promises.</h2>
          <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 14.5, maxWidth: '42ch' }}>
            A recruitment platform where the badge is earned against a published checklist, and the ATS score
            shows its working.
          </p>
        </div>

        <div>
          {FACTS.map(([marker, title2, body]) => (
            <div key={marker} className="auth-feature">
              <span className="marker">{marker}</span>
              <div>
                <div style={{ color: '#fff', fontWeight: 500, fontSize: 14 }}>{title2}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>{body}</div>
              </div>
            </div>
          ))}
        </div>

        <blockquote className="auth-quote mb-0">
          “Scores rank and explain. They never decide.”
          <cite>Platform principle, ATS &amp; matching</cite>
        </blockquote>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <div className="row between" style={{ marginBottom: 26 }}>
            <Link to="/" className="row" style={{ gap: 9, textDecoration: 'none', color: 'var(--text)' }}>
              <span className="brand-mark" style={{ width: 28, height: 28, borderRadius: 8 }}>
                <AppIcon name="shield" size={15} strokeWidth={1.9} />
              </span>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>TalentSphere</strong>
            </Link>
            <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
              <AppIcon name={isDark ? 'sun' : 'moon'} size={16} />
            </button>
          </div>

          <h1 style={{ fontSize: 28 }}>{title}</h1>
          {subtitle && (
            <p className="muted" style={{ fontSize: 14 }}>
              {subtitle}
            </p>
          )}
          <div className="mt-2">{children}</div>
          {footer && (
            <div className="mt-2" style={{ paddingTop: 18, borderTop: '1px solid var(--hairline)' }}>
              {footer}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
