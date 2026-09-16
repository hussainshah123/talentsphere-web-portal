import { Link } from 'react-router-dom';
import { AppIcon, type IconName } from '../../components/AppIcon';
import { Badge, Progress } from '../../components/ui';
import { useTheme } from '../../lib/theme';

const CANDIDATE_STEPS = [
  { title: 'Build the profile once', body: 'Experience, education, skills and preferences — structured, not a PDF nobody can parse.' },
  { title: 'Learn what an ATS sees', body: 'Eight scored factors, the exact formatting risks, and rewrites you can paste straight in.' },
  { title: 'Clear the checklist', body: 'Ten visible checks. Pass them and the badge is yours; fail one later and it comes back for review.' },
  { title: 'Decide who reaches you', body: 'Verified companies only, one outreach message, and your phone and email stay yours.' },
];

const COMPANY_STEPS = [
  { title: 'Get the company verified', body: 'Registration details reviewed by a human before anyone on your team can contact a candidate.' },
  { title: 'Search people, not keywords', body: 'Skills, experience, location, salary, availability and verification status — with fuzzy matching.' },
  { title: 'See why someone matched', body: 'Every score breaks down into skills, experience, location, work mode and salary fit.' },
  { title: 'Reach out like a person', body: 'State your intent, send one message, and wait for a reply. No sequences, no scraping.' },
];

const PILLARS: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: 'verification',
    title: 'The badge means something',
    body: 'Uploading a CV never earns it. Ten checks — email, completeness, CV parsing, duplicate signals, moderation flags — each one visible to the candidate, each one revocable, each decision written to an audit log.',
  },
  {
    icon: 'ats',
    title: 'Scores that explain themselves',
    body: 'A deterministic engine scores eight factors and shows the arithmetic. Optional AI turns that into rewritten bullets and job-specific tailoring — labelled as drafts, never as verdicts.',
  },
  {
    icon: 'lock',
    title: 'Privacy is the default, not a setting',
    body: 'Phone, email and CV downloads stay private until the candidate says otherwise. They can hide the profile, block a company, or switch recruiter contact off entirely — and see every view in the log.',
  },
];

export default function Landing() {
  const { isDark, toggle } = useTheme();

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand">
          <span className="brand-mark">
            <AppIcon name="shield" size={17} strokeWidth={1.9} />
          </span>
          <span>
            TalentSphere
            <small>Verified talent</small>
          </span>
        </div>
        <div className="row">
          <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
            <AppIcon name={isDark ? 'sun' : 'moon'} size={16} />
          </button>
          <Link to="/login" className="btn btn-secondary btn-sm">
            Sign in
          </Link>
          <Link to="/register" className="btn btn-sm">
            Create account
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="overline">Recruitment, without the guesswork</p>
            <h1>
              A profile worth <em>trusting.</em> A CV the machine can actually read.
            </h1>
            <p className="lede">
              Candidates clear a checklist they can see, and get an ATS score they can act on. Companies search
              people who are real, verified and open to being contacted — and never see a private number they were
              not given.
            </p>
            <div className="row hero-actions wrap">
              <Link to="/register?role=CANDIDATE" className="btn btn-lg">
                Build my profile
              </Link>
              <Link to="/register?role=RECRUITER" className="btn btn-secondary btn-lg">
                Hire on TalentSphere
              </Link>
            </div>
            <p className="hero-note">Free for candidates · companies verified before contact</p>
          </div>

          {/* A composed slice of the real product, built from the same components. */}
          <div className="hero-panel" aria-hidden="true">
            <div className="hero-panel-bar">
              <span />
              <span />
              <span />
              <span className="label">verification center</span>
            </div>
            <div className="hero-panel-body">
              <div className="hero-row">
                <div>
                  <div className="overline" style={{ marginBottom: 2 }}>
                    Verification score
                  </div>
                  <div className="serif" style={{ fontSize: 30, letterSpacing: '-0.03em', lineHeight: 1 }}>
                    92<span style={{ color: 'var(--text-3)', fontSize: 17 }}>/100</span>
                  </div>
                </div>
                <Badge tone="success" icon="check">
                  Verified
                </Badge>
              </div>

              <div>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <span className="muted" style={{ fontSize: 12.5 }}>
                    Profile completeness
                  </span>
                  <span className="num" style={{ fontSize: 12.5 }}>
                    90%
                  </span>
                </div>
                <Progress value={90} />
              </div>

              {[
                ['Email verified', 'passed'],
                ['CV parsed · 1 042 words', 'passed'],
                ['Duplicate account check', 'passed'],
                ['Identity document', 'optional'],
              ].map(([label, state]) => (
                <div key={label} className="hero-row" style={{ paddingBottom: 10 }}>
                  <span style={{ fontSize: 13.5 }}>{label}</span>
                  <Badge tone={state === 'passed' ? 'success' : 'default'}>{state}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-metrics">
          <div className="hero-metric">
            <div className="value">8</div>
            <div className="label">ATS factors scored, each with its own explanation</div>
          </div>
          <div className="hero-metric">
            <div className="value">10</div>
            <div className="label">Verification checks, configurable by the platform admin</div>
          </div>
          <div className="hero-metric">
            <div className="value">0</div>
            <div className="label">Contact details exposed without the candidate&rsquo;s consent</div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="section-head">
          <p className="overline">How it works</p>
          <h2>Two sides, one standard of proof.</h2>
        </div>

        <div className="grid cols-2">
          <div>
            <div className="row" style={{ marginBottom: 6 }}>
              <AppIcon name="profile" size={16} />
              <h4 className="mb-0">For candidates</h4>
            </div>
            <div className="steps">
              {CANDIDATE_STEPS.map((step) => (
                <article key={step.title} className="step-item">
                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div>
            <div className="row" style={{ marginBottom: 6 }}>
              <AppIcon name="building" size={16} />
              <h4 className="mb-0">For companies</h4>
            </div>
            <div className="steps">
              {COMPANY_STEPS.map((step) => (
                <article key={step.title} className="step-item">
                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <p className="overline">Why it is built this way</p>
          <h2>Three decisions we will not trade away.</h2>
        </div>

        <div className="grid cols-3 stagger">
          {PILLARS.map((pillar) => (
            <article key={pillar.title} className="card">
              <div className="feature-icon">
                <AppIcon name={pillar.icon} size={17} />
              </div>
              <h3 style={{ fontSize: 19 }}>{pillar.title}</h3>
              <p className="muted mb-0" style={{ fontSize: 13.5 }}>
                {pillar.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-cta">
          <p className="overline" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Get started
          </p>
          <h2>Put something verifiable behind your name.</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>
            Candidates join free. Companies are checked before they can contact anyone — so every recruiter who
            reaches you has already proved who they are.
          </p>
          <div className="row wrap mt-2">
            <Link to="/register" className="btn btn-lg">
              Create an account
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p className="mb-0" style={{ maxWidth: '80ch' }}>
          ATS scores and match scores are automated, advisory assessments and may contain errors; they must not be
          the sole basis for a hiring decision. A verification badge indicates completion of defined platform
          checks — not a guarantee of skill, honesty, employment history or hiring suitability.
        </p>
      </footer>
    </div>
  );
}
