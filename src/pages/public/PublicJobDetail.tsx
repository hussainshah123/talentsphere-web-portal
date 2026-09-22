import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { AppIcon } from '../../components/AppIcon';
import { PublicFooter, PublicNav, ScrollProgress } from '../../components/PublicNav';
import { Badge, Empty, Loading } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { formatDate, formatSalary, relativeTime } from '../../lib/format';
import GuestApplyGate from './GuestApplyGate';
import type { BoardJob } from './PublicJobs';

const label = (value: string) => value.replace(/_/g, ' ').toLowerCase();

/** Descriptions arrive as plain text; keep the author's paragraph breaks. */
function Prose({ text }: { text: string }) {
  return (
    <div className="job-prose">
      {text
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block, index) => (
          <p key={index}>
            {block.split('\n').map((line, lineIndex) => (
              <span key={lineIndex}>
                {line}
                <br />
              </span>
            ))}
          </p>
        ))}
    </div>
  );
}

function Fact({ icon, term, value }: { icon: 'location' | 'clock' | 'salary' | 'experience'; term: string; value: string }) {
  return (
    <div className="job-fact">
      <AppIcon name={icon} size={15} />
      <div>
        <dt>{term}</dt>
        <dd>{value}</dd>
      </div>
    </div>
  );
}

export default function PublicJobDetail() {
  const { id = '' } = useParams();
  const { user } = useAuth();

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['public-job', id],
    queryFn: async () => (await api.get<BoardJob>(`/jobs/${id}`)).data,
    enabled: Boolean(id),
    retry: false,
  });

  return (
    <div className="landing">
      <ScrollProgress />
      <PublicNav />

      {isLoading ? (
        <div className="landing-section">
          <Loading label="Loading this role…" />
        </div>
      ) : error || !job ? (
        <div className="landing-section">
          <div className="card">
            <Empty
              icon="warning"
              title="This job is not available"
              hint={
                error
                  ? errorMessage(error, 'It may have been closed or withdrawn by the company.')
                  : 'It may have been closed or withdrawn by the company.'
              }
              action={
                <Link to="/browse-jobs" className="btn">
                  Back to all jobs
                </Link>
              }
            />
          </div>
        </div>
      ) : (
        <>
          <section className="job-hero">
            <div className="job-hero-inner">
              <Link to="/browse-jobs" className="job-back">
                <AppIcon name="back" size={14} /> All jobs
              </Link>

              <div className="job-hero-head">
                <span className="job-logo lg" aria-hidden="true">
                  {job.company?.logoUrl ? (
                    <img src={job.company.logoUrl} alt="" />
                  ) : (
                    (job.company?.name ?? '?').slice(0, 1).toUpperCase()
                  )}
                </span>
                <div>
                  <h1>{job.title}</h1>
                  <p className="muted mb-0">
                    {job.company?.name}
                    {' · '}
                    {[job.location, job.state, job.country].filter(Boolean).join(', ') ||
                      'Location flexible'}
                    {' · posted '}
                    {relativeTime(job.publishedAt ?? job.createdAt)}
                  </p>
                </div>
              </div>

              <div className="chip-row mt-2">
                <Badge tone="success" icon="check">
                  verified company
                </Badge>
                <span className="chip">{label(job.workMode)}</span>
                <span className="chip">{label(job.employmentType)}</span>
                {job.experienceLevel && <span className="chip">{label(job.experienceLevel)}</span>}
                {job.industry && <span className="chip">{job.industry}</span>}
                {job.visaSponsorship && <Badge tone="success">visa sponsorship</Badge>}
                {job.status !== 'PUBLISHED' && <Badge tone="warning">closed to applications</Badge>}
              </div>
            </div>
          </section>

          <div className="job-layout">
            <article className="job-main">
              <dl className="job-facts">
                <Fact
                  icon="salary"
                  term="Salary"
                  value={formatSalary({
                    min: job.salaryMin,
                    max: job.salaryMax,
                    currency: job.salaryCurrency,
                  })}
                />
                <Fact
                  icon="location"
                  term="Location"
                  value={
                    [job.location, job.state, job.country].filter(Boolean).join(', ') ||
                    'Flexible'
                  }
                />
                <Fact
                  icon="experience"
                  term="Experience"
                  value={
                    job.experienceMin !== null && job.experienceMin !== undefined
                      ? `${job.experienceMin}+ years`
                      : 'Not specified'
                  }
                />
                <Fact
                  icon="clock"
                  term="Posted"
                  value={formatDate(job.publishedAt ?? job.createdAt)}
                />
              </dl>

              <section className="job-block">
                <h2>About this role</h2>
                <Prose text={job.description} />
              </section>

              {job.requirements && (
                <section className="job-block">
                  <h2>What they are asking for</h2>
                  <Prose text={job.requirements} />
                </section>
              )}

              {job.skills?.length > 0 && (
                <section className="job-block">
                  <h2>Skills</h2>
                  <div className="chip-row">
                    {job.skills.map((skill) => (
                      <span key={skill} className="chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {job.remoteEligibility && (
                <section className="job-block">
                  <h2>Remote rules</h2>
                  <p className="muted mb-0">
                    {job.remoteEligibility === 'WORLDWIDE'
                      ? 'Open to remote candidates worldwide.'
                      : job.remoteEligibility === 'SPECIFIC_COUNTRIES'
                        ? `Remote, but only from: ${(job.remoteCountries ?? []).join(', ') || 'selected countries'}.`
                        : job.remoteEligibility === 'SPECIFIC_TIMEZONES'
                          ? `Remote within these time zones: ${(job.remoteTimezones ?? []).join(', ')}.`
                          : 'See the description for the remote arrangement.'}
                  </p>
                </section>
              )}
            </article>

            <aside className="job-side">
              <div className="job-apply-card">
                <p className="overline mb-0">
                  {user ? 'Ready when you are' : 'Viewing as a guest'}
                </p>
                <h3>
                  {user ? 'Apply to this role' : 'Reading is open. Applying needs an account.'}
                </h3>
                <p className="muted" style={{ fontSize: 13.5 }}>
                  {user
                    ? 'Your profile and primary CV go with the application, and you can withdraw it at any time.'
                    : 'Anyone can read this posting in full. To send your profile and CV to this company, sign in or create a free candidate account — you come straight back here.'}
                </p>

                <div className="job-apply-actions">
                  <GuestApplyGate
                    jobId={job.id}
                    jobTitle={job.title}
                    companyName={job.company?.name}
                    jobOpen={job.status === 'PUBLISHED'}
                    size="lg"
                  />
                </div>

                <ul className="ticks tight mt-2">
                  {[
                    'Free for candidates',
                    'Your contact details stay private',
                    'Track the status end to end',
                  ].map((line) => (
                    <li key={line}>
                      <AppIcon name="check" size={13} />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card job-company-card">
                <p className="overline mb-0">The company</p>
                <h3 style={{ fontSize: 18 }}>{job.company?.name}</h3>
                <p className="muted mb-0" style={{ fontSize: 13.5 }}>
                  Every company on TalentSphere is checked by a person before it can post a job or
                  contact a candidate.
                </p>
                <Link to="/browse-jobs" className="btn btn-secondary btn-sm mt-2">
                  See other roles <AppIcon name="forward" size={14} />
                </Link>
              </div>
            </aside>
          </div>
        </>
      )}

      <PublicFooter />
    </div>
  );
}
