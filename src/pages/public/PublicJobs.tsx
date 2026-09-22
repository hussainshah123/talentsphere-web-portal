import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppIcon } from '../../components/AppIcon';
import { PublicFooter, PublicNav, ScrollProgress } from '../../components/PublicNav';
import { Badge, Empty, Pagination, SkeletonCard } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { formatSalary, relativeTime } from '../../lib/format';
import { useCountUp } from '../../lib/reveal';
import GuestApplyGate from './GuestApplyGate';
import type { Job } from '../../lib/types';

interface Filters {
  q: string;
  country: string;
  workMode: string[];
  employmentType: string[];
  experienceLevel: string[];
  postedWithinDays: string;
  sort: string;
}

const EMPTY: Filters = {
  q: '',
  country: '',
  workMode: [],
  employmentType: [],
  experienceLevel: [],
  postedWithinDays: '',
  sort: 'recent',
};

const WORK_MODES = ['REMOTE', 'HYBRID', 'ONSITE', 'FLEXIBLE'];
const EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'TEMPORARY',
  'INTERNSHIP',
  'FREELANCE',
];
const EXPERIENCE_LEVELS = ['INTERNSHIP', 'ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'];
const POSTED_OPTIONS: Array<[string, string]> = [
  ['', 'Any time'],
  ['1', 'Last 24 hours'],
  ['7', 'Last 7 days'],
  ['30', 'Last 30 days'],
];

const label = (value: string) => value.replace(/_/g, ' ').toLowerCase();

interface Facets {
  workMode: Array<{ value: string; count: number }>;
  employmentType: Array<{ value: string; count: number }>;
  experienceLevel: Array<{ value: string; count: number }>;
  country: Array<{ value: string; count: number }>;
  industry: Array<{ value: string; count: number }>;
  total: number;
}

export type BoardJob = Job & {
  state?: string | null;
  industry?: string | null;
  experienceLevel?: string | null;
  remoteEligibility?: string | null;
  remoteCountries?: string[];
  remoteTimezones?: string[];
  visaSponsorship?: boolean;
  _count?: { applications?: number; matches?: number };
};

/** The live count in the board header, counted up once it is on screen. */
function LiveCount({ total }: { total: number }) {
  const { ref, value } = useCountUp(total, 1100);
  return (
    <span className="board-count" ref={ref}>
      <i className="pulse-dot" />
      <strong className="num">{value}</strong> {value === 1 ? 'role' : 'roles'} live right now
    </span>
  );
}

function JobCard({ job, index }: { job: BoardJob; index: number }) {
  const place =
    [job.location, job.state, job.country].filter(Boolean).join(', ') || 'Location flexible';

  return (
    <article className="job-card" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
      <div className="job-card-head">
        <span className="job-logo" aria-hidden="true">
          {job.company?.logoUrl ? (
            <img src={job.company.logoUrl} alt="" />
          ) : (
            (job.company?.name ?? '?').slice(0, 1).toUpperCase()
          )}
        </span>
        <div className="job-card-title">
          <h3>
            <Link to={`/browse-jobs/${job.id}`}>{job.title}</Link>
          </h3>
          <p className="muted mb-0">
            {job.company?.name} · {place} · {label(job.workMode)}
          </p>
        </div>
        <div className="job-card-pay">
          <div className="num">
            {formatSalary({
              min: job.salaryMin,
              max: job.salaryMax,
              currency: job.salaryCurrency,
            })}
          </div>
          <div className="muted" style={{ fontSize: 12.5 }}>
            {relativeTime(job.publishedAt ?? job.createdAt)}
          </div>
        </div>
      </div>

      <div className="chip-row mt-1">
        <span className="chip">{label(job.employmentType)}</span>
        {job.experienceLevel && <span className="chip">{label(job.experienceLevel)}</span>}
        {job.industry && <span className="chip">{job.industry}</span>}
        {job.visaSponsorship && <Badge tone="success">visa sponsorship</Badge>}
        {job.remoteEligibility === 'WORLDWIDE' && <Badge tone="success">remote worldwide</Badge>}
        {job.remoteEligibility === 'SPECIFIC_COUNTRIES' && (
          <Badge tone="warning">
            remote: {(job.remoteCountries ?? []).slice(0, 2).join(', ') || 'restricted'}
          </Badge>
        )}
      </div>

      {job.skills?.length > 0 && (
        <div className="chip-row mt-1">
          {job.skills.slice(0, 6).map((skill) => (
            <span key={skill} className="chip chip-quiet">
              {skill}
            </span>
          ))}
          {job.skills.length > 6 && (
            <span className="chip chip-quiet">+{job.skills.length - 6}</span>
          )}
        </div>
      )}

      <div className="job-card-foot">
        <Link to={`/browse-jobs/${job.id}`} className="btn btn-secondary btn-sm">
          View details <AppIcon name="forward" size={14} />
        </Link>
        <GuestApplyGate
          jobId={job.id}
          jobTitle={job.title}
          companyName={job.company?.name}
          jobOpen={job.status === 'PUBLISHED'}
        />
      </div>
    </article>
  );
}

export default function PublicJobs() {
  const { user } = useAuth();
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);

  const params = useMemo(() => {
    const out: Record<string, string | number> = { page, pageSize: 12 };
    for (const [key, value] of Object.entries(applied)) {
      if (Array.isArray(value)) {
        if (value.length > 0) out[key] = value.join(',');
        continue;
      }
      if (value !== '') out[key] = value;
    }
    return out;
  }, [applied, page]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['public-job-board', params],
    queryFn: async () =>
      (
        await api.get<{ items: BoardJob[]; total: number; totalPages: number }>('/jobs', {
          params,
        })
      ).data,
  });

  const { data: facets } = useQuery({
    queryKey: ['public-job-facets'],
    queryFn: async () => (await api.get<Facets>('/jobs/facets')).data,
  });

  /* Chips apply the moment they are picked — a filter that needs a second click to
     take effect reads as broken. Only the text boxes wait for Enter or the button. */
  const commit = (next: Filters) => {
    setDraft(next);
    setApplied(next);
    setPage(1);
  };

  const toggle = (key: 'workMode' | 'employmentType' | 'experienceLevel', value: string) =>
    commit({
      ...draft,
      [key]: draft[key].includes(value)
        ? draft[key].filter((entry) => entry !== value)
        : [...draft[key], value],
    });

  const search = () => {
    setApplied(draft);
    setPage(1);
  };

  const activeCount = Object.entries(applied).filter(([key, value]) => {
    if (key === 'sort') return false;
    return Array.isArray(value) ? value.length > 0 : value !== '';
  }).length;

  return (
    <div className="landing">
      <ScrollProgress />
      <PublicNav />

      <section className="board-hero">
        <div className="board-hero-inner">
          <p className="overline">Open to everyone — no account needed to look</p>
          <h1>
            Every live role, from <em>verified</em> companies.
          </h1>
          <p className="lede mb-0">
            Read the whole posting, the salary band, the skills and the remote rules before you give
            anyone your name. Applying is the only part that needs an account.
          </p>

          <div className="board-search">
            <AppIcon name="search" size={17} />
            <input
              value={draft.q}
              onChange={(event) => setDraft({ ...draft, q: event.target.value })}
              onKeyDown={(event) => event.key === 'Enter' && search()}
              placeholder="Job title, skill or company"
              aria-label="Search jobs"
            />
            <input
              className="board-search-where"
              value={draft.country}
              onChange={(event) => setDraft({ ...draft, country: event.target.value })}
              onKeyDown={(event) => event.key === 'Enter' && search()}
              placeholder="Country"
              aria-label="Country"
              list="board-countries"
            />
            <datalist id="board-countries">
              {(facets?.country ?? []).map((row) => (
                <option key={row.value} value={row.value} />
              ))}
            </datalist>
            <button className="btn btn-shine" onClick={search} disabled={isFetching}>
              {isFetching ? 'Searching…' : 'Search'}
            </button>
          </div>

          <div className="board-hero-meta">
            <LiveCount total={facets?.total ?? 0} />
            {!user && (
              <span className="board-guest">
                <AppIcon name="eye" size={14} /> You are browsing as a guest — viewing only
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="board-layout">
        <aside className="board-filters">
          <div className="board-filters-inner">
            <div className="row between">
              <h2 className="mb-0" style={{ fontSize: 17 }}>
                Filters
              </h2>
              {activeCount > 0 && (
                <button className="ghost btn-sm" onClick={() => commit(EMPTY)}>
                  Clear {activeCount}
                </button>
              )}
            </div>

            <div className="filter-group">
              <span className="hint">Work arrangement</span>
              <div className="chip-row">
                {WORK_MODES.map((mode) => (
                  <button
                    key={mode}
                    className={`filter-chip ${draft.workMode.includes(mode) ? 'on' : ''}`}
                    aria-pressed={draft.workMode.includes(mode)}
                    onClick={() => toggle('workMode', mode)}
                  >
                    {label(mode)}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <span className="hint">Employment type</span>
              <div className="chip-row">
                {EMPLOYMENT_TYPES.map((type) => (
                  <button
                    key={type}
                    className={`filter-chip ${draft.employmentType.includes(type) ? 'on' : ''}`}
                    aria-pressed={draft.employmentType.includes(type)}
                    onClick={() => toggle('employmentType', type)}
                  >
                    {label(type)}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <span className="hint">Experience level</span>
              <div className="chip-row">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level}
                    className={`filter-chip ${draft.experienceLevel.includes(level) ? 'on' : ''}`}
                    aria-pressed={draft.experienceLevel.includes(level)}
                    onClick={() => toggle('experienceLevel', level)}
                  >
                    {label(level)}
                  </button>
                ))}
              </div>
            </div>

            <label className="filter-group">
              Posted
              <select
                value={draft.postedWithinDays}
                onChange={(event) => commit({ ...draft, postedWithinDays: event.target.value })}
              >
                {POSTED_OPTIONS.map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </label>

            <label className="filter-group">
              Sort by
              <select
                value={draft.sort}
                onChange={(event) => commit({ ...draft, sort: event.target.value })}
              >
                <option value="recent">Most recent</option>
                <option value="salary">Highest salary</option>
                <option value="experience">Least experience required</option>
              </select>
            </label>

            {!user && (
              <div className="filter-cta">
                <AppIcon name="sparkle" size={18} />
                <p className="mb-0">
                  A free candidate account is what turns browsing into applying — plus saved jobs and
                  an ATS score against every role.
                </p>
                <Link to="/register?role=CANDIDATE" className="btn btn-sm btn-shine">
                  Create free account
                </Link>
              </div>
            )}
          </div>
        </aside>

        <div className="board-results">
          <div className="row between wrap board-results-head">
            <p className="muted mb-0" style={{ fontSize: 13 }}>
              {isLoading ? 'Loading roles…' : `${data?.total ?? 0} job(s) found`}
              {activeCount > 0 && !isLoading ? ` · ${activeCount} filter(s) active` : ''}
            </p>
            {isFetching && !isLoading && <span className="spinner" aria-label="Updating" />}
          </div>

          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : !data || data.items.length === 0 ? (
            <div className="card">
              <Empty
                icon="search"
                title="No jobs match those filters"
                hint="Filters combine with AND. Try clearing the location or the experience level."
                action={
                  <button className="secondary" onClick={() => commit(EMPTY)}>
                    Clear all filters
                  </button>
                }
              />
            </div>
          ) : (
            <>
              {data.items.map((job, index) => (
                <JobCard key={job.id} job={job} index={index} />
              ))}
              <Pagination
                page={page}
                totalPages={data.totalPages ?? 1}
                onChange={(next) => {
                  setPage(next);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </>
          )}
        </div>
      </div>

      {!user && (
        <section className="landing-section" style={{ paddingTop: 0 }}>
          <div className="landing-cta">
            <p className="overline" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Ready to apply
            </p>
            <h2>Looking is free. So is applying.</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              An account gets you a CV that parsers can read, a verification badge you can actually
              earn, and one place to watch every application move.
            </p>
            <div className="row wrap mt-2">
              <Link to="/register?role=CANDIDATE" className="btn btn-lg btn-shine">
                Create a free account
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      )}

      <PublicFooter />
    </div>
  );
}
