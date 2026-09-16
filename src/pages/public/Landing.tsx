import { Link } from 'react-router-dom';
import { AppIcon, type IconName } from '../../components/AppIcon';
import { Badge, Progress } from '../../components/ui';
import { useTheme } from '../../lib/theme';
import { useCountUp, useReveal, useScrollY } from '../../lib/reveal';

/*
 * Photography is bundled from Unsplash (free for commercial use) rather than hotlinked,
 * so the page works offline and no visitor IP reaches a third party. Credits in the footer.
 */
import engineers from '../../assets/landing/engineers.jpg';
import engineers2x from '../../assets/landing/engineers@2x.jpg';
import officeTalk from '../../assets/landing/office-talk.jpg';
import officeTalk2x from '../../assets/landing/office-talk@2x.jpg';
import reviewing from '../../assets/landing/reviewing.jpg';
import reviewing2x from '../../assets/landing/reviewing@2x.jpg';
import teamBuild from '../../assets/landing/team-build.jpg';
import teamBuild2x from '../../assets/landing/team-build@2x.jpg';
import workshop from '../../assets/landing/workshop.jpg';
import workshop2x from '../../assets/landing/workshop@2x.jpg';
import infra from '../../assets/landing/infra.jpg';
import infra2x from '../../assets/landing/infra@2x.jpg';

interface Capability {
  overline: string;
  title: string;
  body: string;
  points: string[];
  image: { src: string; src2x: string; alt: string };
}

const CAPABILITIES: Capability[] = [
  {
    overline: 'For candidates',
    title: 'A profile that survives the parser.',
    body: 'Structured experience, education and skills — not a PDF that an ATS turns into mush. Upload a CV and see the eight factors a real parser scores, what it could not read, and the rewrite that fixes it.',
    points: [
      'Eight scored ATS factors, each with its own arithmetic shown',
      'Optional AI rewrites bullets and tailors you to one specific job',
      'A verification checklist you can see, pass and keep',
      'Apply, then watch the status move through the company pipeline',
    ],
    image: {
      src: engineers,
      src2x: engineers2x,
      alt: 'Two engineers reviewing code together at a shared workstation',
    },
  },
  {
    overline: 'For companies',
    title: 'Search people, not keywords.',
    body: 'Full-text and fuzzy search across skills, experience, location, salary and availability — filtered to candidates who are real, verified and open to being contacted. Every match score breaks down into the reasons behind it.',
    points: [
      'Applicants land on the job with their submitted CV and scores',
      'Move them through review, shortlist, interview, offer, hired',
      'Ranked sourcing sits beside applications, never mixed up with it',
      'Your company is verified by a human before you can contact anyone',
    ],
    image: {
      src: officeTalk,
      src2x: officeTalk2x,
      alt: 'A small team talking at desks in an open-plan technology office',
    },
  },
  {
    overline: 'For both sides',
    title: 'Contact on the candidate’s terms.',
    body: 'Phone numbers, email addresses and CV downloads stay private until the candidate opens them. A company gets one outreach message and then waits for a reply — no sequences, no scraping, no bought lists.',
    points: [
      'One message per conversation until the candidate answers',
      'Block a company, hide the profile, or switch contact off entirely',
      'Every profile view and every decision lands in an audit log',
      'Report and moderation flows on both sides',
    ],
    image: {
      src: reviewing,
      src2x: reviewing2x,
      alt: 'Two people reviewing printed notes beside open laptops',
    },
  },
];

const PILLARS: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: 'verification',
    title: 'The badge means something',
    body: 'Uploading a CV never earns it. Ten checks — email, completeness, CV parsing, duplicate signals, moderation flags — each visible to the candidate, each revocable, each decision written to an audit log.',
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

const WORKSPACES: Array<{ icon: IconName; role: string; title: string; items: string[] }> = [
  {
    icon: 'profile',
    role: 'Candidate',
    title: 'Your workspace',
    items: [
      'Dashboard with profile strength and CV health',
      'CV & ATS report, AI review and job-fit tailoring',
      'Verification center and Talent Passport',
      'Recommended jobs, applications and their timelines',
      'Privacy control, blocks and messages',
    ],
  },
  {
    icon: 'building',
    role: 'Recruiter',
    title: 'Your hiring workspace',
    items: [
      'Company profile, verification and team seats',
      'Candidate search with filters and fuzzy matching',
      'Jobs, applicants and the full pipeline',
      'Talent pools and explainable match scoring',
      'Conversations with intent labels',
    ],
  },
  {
    icon: 'shield',
    role: 'Platform staff',
    title: 'Admin console',
    items: [
      'Verification queue and case review',
      'Company approvals and user management',
      'Configurable verification rules',
      'CV and ATS monitoring',
      'Reports, moderation and audit logs',
    ],
  },
];

/** A phone-shaped slice of the real mobile UI, drawn rather than screenshotted. */
function PhoneMock({ variant }: { variant: 'home' | 'applications' }) {
  return (
    <div className={`phone phone-${variant}`}>
      <div className="phone-notch" />
      <div className="phone-screen">
        {variant === 'home' ? (
          <>
            <div className="phone-head">
              <span className="mono">GOOD MORNING</span>
              <strong>Ada</strong>
            </div>
            <div className="phone-card">
              <div className="row between">
                <span className="mono">ATS</span>
                <span className="phone-pill ok">verified</span>
              </div>
              <div className="phone-ring">
                <svg viewBox="0 0 68 68" width="68" height="68" aria-hidden="true">
                  <circle cx="34" cy="34" r="29" className="ring-track" />
                  <circle cx="34" cy="34" r="29" className="ring-value" />
                </svg>
                <span className="phone-ring-num">82</span>
              </div>
            </div>
            <div className="phone-card">
              <span className="mono">PROFILE STRENGTH</span>
              <div className="phone-bar">
                <i style={{ width: '90%' }} />
              </div>
            </div>
            <div className="phone-card slim">
              <span>Senior Full-Stack Engineer</span>
              <em>91% match</em>
            </div>
          </>
        ) : (
          <>
            <div className="phone-head">
              <strong>Applications</strong>
            </div>
            {[
              ['Senior Full-Stack Engineer', 'shortlisted', 72],
              ['Platform Engineer', 'in review', 34],
              ['Backend Engineer', 'submitted', 17],
            ].map(([title, status, progress]) => (
              <div key={title as string} className="phone-card">
                <div className="row between">
                  <span>{title}</span>
                  <span className="phone-pill">{status}</span>
                </div>
                <div className="phone-bar">
                  <i style={{ width: `${progress}%` }} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="phone-tabs">
        {(['home', 'discover', 'ats', 'messages', 'profile'] as IconName[]).map((icon, index) => (
          <span key={icon} className={index === (variant === 'home' ? 0 : 2) ? 'on' : ''}>
            <AppIcon name={icon} size={15} />
          </span>
        ))}
      </div>
    </div>
  );
}

function Metric({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  const { ref, value: shown } = useCountUp(value);
  return (
    <div className="hero-metric" ref={ref}>
      <div className="value">
        {shown}
        {suffix}
      </div>
      <div className="label">{label}</div>
    </div>
  );
}

function CapabilityRow({ capability, index }: { capability: Capability; index: number }) {
  const { ref, className } = useReveal<HTMLElement>();
  return (
    <section
      ref={ref}
      className={`capability ${index % 2 === 1 ? 'flip' : ''} ${className}`}
    >
      <figure className="capability-media">
        <img
          src={capability.image.src}
          srcSet={`${capability.image.src} 900w, ${capability.image.src2x} 1600w`}
          sizes="(max-width: 900px) 92vw, 46vw"
          alt={capability.image.alt}
          loading="lazy"
          decoding="async"
          width={900}
          height={600}
        />
      </figure>
      <div className="capability-copy">
        <p className="overline">{capability.overline}</p>
        <h3>{capability.title}</h3>
        <p className="muted">{capability.body}</p>
        <ul className="ticks">
          {capability.points.map((point) => (
            <li key={point}>
              <AppIcon name="check" size={14} />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function Landing() {
  const { isDark, toggle } = useTheme();
  const scrollY = useScrollY();
  const mobile = useReveal<HTMLElement>();
  const workspaces = useReveal<HTMLElement>();
  const pillars = useReveal<HTMLElement>();
  const closing = useReveal<HTMLElement>();

  return (
    <div className="landing">
      <header className={`landing-nav ${scrollY > 8 ? 'condensed' : ''}`}>
        <div className="brand">
          <span className="brand-mark">
            <AppIcon name="shield" size={17} strokeWidth={1.9} />
          </span>
          <span>
            TalentSphere
            <small>Verified talent</small>
          </span>
        </div>
        <nav className="landing-links">
          <a href="#capabilities">Product</a>
          <a href="#mobile">Mobile app</a>
          <a href="#workspaces">Dashboards</a>
        </nav>
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
              Candidates clear a checklist they can see and get an ATS score they can act on.
              Companies search people who are real, verified and open to being contacted — and never
              see a private number they were not given.
            </p>
            <div className="row hero-actions wrap">
              <Link to="/register?role=CANDIDATE" className="btn btn-lg">
                Build my profile
              </Link>
              <Link to="/register?role=RECRUITER" className="btn btn-secondary btn-lg">
                Hire on TalentSphere
              </Link>
            </div>
            <p className="hero-note">
              Free for candidates · companies verified before contact · web and mobile
            </p>
          </div>

          <div className="hero-visual">
            {/* A real photograph behind a slice of the real product. */}
            <figure
              className="hero-photo"
              style={{ transform: `translate3d(0, ${Math.min(scrollY, 400) * -0.035}px, 0)` }}
            >
              <img
                src={teamBuild}
                srcSet={`${teamBuild} 900w, ${teamBuild2x} 1600w`}
                sizes="(max-width: 980px) 92vw, 44vw"
                alt="A product team working together on laptops around one table"
                width={900}
                height={600}
                decoding="async"
              />
            </figure>

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
                    <div
                      className="serif"
                      style={{ fontSize: 30, letterSpacing: '-0.03em', lineHeight: 1 }}
                    >
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
                ].map(([label, state]) => (
                  <div key={label} className="hero-row" style={{ paddingBottom: 10 }}>
                    <span style={{ fontSize: 13.5 }}>{label}</span>
                    <Badge tone="success">{state}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hero-metrics">
          <Metric value={8} label="ATS factors scored, each with its own explanation" />
          <Metric value={10} label="Verification checks, configurable by the platform admin" />
          <Metric value={0} label="Contact details exposed without the candidate’s consent" />
          <Metric value={3} label="Ways in: web, Android and iOS — one account across all of them" />
        </div>
      </section>

      <div className="landing-section" id="capabilities">
        <div className="section-head">
          <p className="overline">What you can do here</p>
          <h2>Everything the hiring loop needs, and nothing that games it.</h2>
        </div>
        <div className="capabilities">
          {CAPABILITIES.map((capability, index) => (
            <CapabilityRow key={capability.title} capability={capability} index={index} />
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- mobile */}

      <section
        className={`mobile-band ${mobile.className}`}
        id="mobile"
        ref={mobile.ref}
      >
        <div className="mobile-inner">
          <div className="mobile-copy">
            <p className="overline">TalentSphere for Android &amp; iOS</p>
            <h2>The same account, in your pocket.</h2>
            <p className="muted">
              The mobile app is not a cut-down viewer. Upload a CV from your phone, read the full ATS
              breakdown, clear verification checks, apply to a job and answer a recruiter — then pick
              it up on the web exactly where you left it.
            </p>
            <ul className="ticks">
              <li>
                <AppIcon name="check" size={14} />
                <span>CV upload, ATS report and AI review on the phone</span>
              </li>
              <li>
                <AppIcon name="check" size={14} />
                <span>Apply, track status and withdraw from anywhere</span>
              </li>
              <li>
                <AppIcon name="check" size={14} />
                <span>Recruiter search and pipeline for hiring teams</span>
              </li>
              <li>
                <AppIcon name="check" size={14} />
                <span>Light and dark themes, and tokens kept in the device keychain</span>
              </li>
            </ul>
            <div className="row wrap mt-2">
              <Link to="/register" className="btn">
                Create an account
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Sign in on the web
              </Link>
            </div>
            <p className="hero-note">
              Sign in once — the web dashboard and the app show the same profile, CV and applications.
            </p>
          </div>

          <div className="mobile-mocks" aria-hidden="true">
            <PhoneMock variant="applications" />
            <PhoneMock variant="home" />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- dashboards */}

      <section
        className={`landing-section ${workspaces.className}`}
        id="workspaces"
        ref={workspaces.ref}
      >
        <div className="section-head">
          <p className="overline">After you sign in</p>
          <h2>Your role decides your dashboard.</h2>
          <p className="muted mb-0">
            One sign-in, three workspaces. The account you create picks the one you land on, and the
            server enforces it — a recruiter never reaches a candidate&rsquo;s private settings, and
            staff tools stay with staff.
          </p>
        </div>

        <div className="workspace-grid">
          {WORKSPACES.map((workspace) => (
            <article key={workspace.role} className="card workspace-card">
              <div className="feature-icon">
                <AppIcon name={workspace.icon} size={17} />
              </div>
              <p className="overline mb-0">{workspace.role}</p>
              <h3 style={{ fontSize: 19 }}>{workspace.title}</h3>
              <ul className="ticks tight">
                {workspace.items.map((item) => (
                  <li key={item}>
                    <AppIcon name="forward" size={13} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="workspace-strip">
          <figure>
            <img
              src={workshop}
              srcSet={`${workshop} 900w, ${workshop2x} 1600w`}
              sizes="(max-width: 900px) 92vw, 30vw"
              alt="A hiring team planning against a wall of notes"
              loading="lazy"
              decoding="async"
              width={900}
              height={600}
            />
          </figure>
          <figure>
            <img
              src={infra}
              srcSet={`${infra} 900w, ${infra2x} 1600w`}
              sizes="(max-width: 900px) 92vw, 30vw"
              alt="An engineer working beside racked server hardware"
              loading="lazy"
              decoding="async"
              width={900}
              height={600}
            />
          </figure>
          <div className="workspace-note">
            <p className="overline">Under it all</p>
            <p className="muted mb-0">
              Postgres full-text search with fuzzy fallback, signed URLs for every file, refresh-token
              rotation with family revocation, rate limiting on the routes that matter, and an audit
              log behind every decision that changes someone&rsquo;s standing.
            </p>
          </div>
        </div>
      </section>

      <section className={`landing-section ${pillars.className}`} style={{ paddingTop: 0 }} ref={pillars.ref}>
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

      <section className={`landing-section ${closing.className}`} style={{ paddingTop: 0 }} ref={closing.ref}>
        <div className="landing-cta">
          <p className="overline" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Get started
          </p>
          <h2>Put something verifiable behind your name.</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>
            Candidates join free. Companies are checked before they can contact anyone — so every
            recruiter who reaches you has already proved who they are.
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
        <p style={{ maxWidth: '80ch' }}>
          ATS scores and match scores are automated, advisory assessments and may contain errors; they
          must not be the sole basis for a hiring decision. A verification badge indicates completion
          of defined platform checks — not a guarantee of skill, honesty, employment history or hiring
          suitability.
        </p>
        <p className="mb-0" style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
          Photography from Unsplash, bundled with the site. The people pictured are not TalentSphere
          users and appear for illustration only.
        </p>
      </footer>
    </div>
  );
}
