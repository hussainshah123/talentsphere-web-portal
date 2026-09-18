import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../components/Toast';
import { AppIcon } from '../../components/AppIcon';
import { Alert, Badge, Card, Empty, Pagination, SkeletonCard } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatDate, formatSalary } from '../../lib/format';
import ApplyButton from './ApplyButton';
import type { Job } from '../../lib/types';

/** Every filter the board supports, kept in one object so a reset is one line. */
interface Filters {
  q: string;
  country: string;
  state: string;
  city: string;
  workMode: string[];
  employmentType: string[];
  experienceLevel: string[];
  educationLevel: string;
  minExperience: string;
  maxExperience: string;
  salaryMin: string;
  salaryMax: string;
  industry: string;
  skills: string;
  postedWithinDays: string;
  company: string;
  workAuthorization: string;
  visaSponsorship: boolean;
  remoteFor: string;
  timezone: string;
  sort: string;
}

const EMPTY: Filters = {
  q: '',
  country: '',
  state: '',
  city: '',
  workMode: [],
  employmentType: [],
  experienceLevel: [],
  educationLevel: '',
  minExperience: '',
  maxExperience: '',
  salaryMin: '',
  salaryMax: '',
  industry: '',
  skills: '',
  postedWithinDays: '',
  company: '',
  workAuthorization: '',
  visaSponsorship: false,
  remoteFor: '',
  timezone: '',
  sort: 'recent',
};

const WORK_MODES = ['REMOTE', 'HYBRID', 'ONSITE', 'FLEXIBLE'];
const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP', 'FREELANCE'];
const EXPERIENCE_LEVELS = ['INTERNSHIP', 'ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'];
const EDUCATION_LEVELS = ['NONE', 'HIGH_SCHOOL', 'DIPLOMA', 'BACHELORS', 'MASTERS', 'DOCTORATE'];
const POSTED_OPTIONS = [
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

type BoardJob = Job & {
  state?: string | null;
  industry?: string | null;
  experienceLevel?: string | null;
  remoteEligibility?: string | null;
  remoteCountries?: string[];
  remoteTimezones?: string[];
  workAuthorization?: string;
  visaSponsorship?: boolean;
  timezone?: string | null;
  _count?: { applications?: number; matches?: number };
};

export default function FindJobs() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);

  /* Only non-empty values go on the wire, so the URL stays readable in devtools. */
  const params = useMemo(() => {
    const out: Record<string, string | number | boolean> = { page, pageSize: 20 };
    for (const [key, value] of Object.entries(applied)) {
      if (value === '' || value === false) continue;
      if (Array.isArray(value)) {
        if (value.length === 0) continue;
        out[key] = value.join(',');
        continue;
      }
      out[key] = value as string;
    }
    return out;
  }, [applied, page]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['job-board', params],
    queryFn: async () =>
      (await api.get<{ items: BoardJob[]; total: number; totalPages: number }>('/jobs', { params }))
        .data,
  });

  const { data: facets } = useQuery({
    queryKey: ['job-facets'],
    queryFn: async () => (await api.get<Facets>('/jobs/facets')).data,
  });

  const { data: saved } = useQuery({
    queryKey: ['saved-jobs'],
    queryFn: async () =>
      (await api.get<Array<{ jobId: string }>>('/candidates/me/saved-jobs')).data,
  });
  const savedIds = new Set((saved ?? []).map((entry) => entry.jobId));

  const toggleSaved = useMutation({
    mutationFn: async (job: BoardJob) =>
      savedIds.has(job.id)
        ? (await api.delete(`/candidates/me/saved-jobs/${job.id}`)).data
        : (await api.post('/candidates/me/saved-jobs', { jobId: job.id })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-jobs'] }),
    onError: (error) => toast.error(errorMessage(error, 'Could not update your saved jobs')),
  });

  const search = () => {
    setApplied(draft);
    setPage(1);
  };

  const reset = () => {
    setDraft(EMPTY);
    setApplied(EMPTY);
    setPage(1);
  };

  const toggle = (key: 'workMode' | 'employmentType' | 'experienceLevel', value: string) =>
    setDraft((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((entry) => entry !== value)
        : [...current[key], value],
    }));

  const activeCount = Object.entries(applied).filter(([key, value]) => {
    if (key === 'sort') return false;
    return Array.isArray(value) ? value.length > 0 : value !== '' && value !== false;
  }).length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Find jobs</h1>
          <p className="muted mb-0">
            Published roles from verified companies, worldwide. {facets?.total ?? 0} live right now.
          </p>
        </div>
      </div>

      <Card title="Search jobs" icon="search">
        <div className="grid cols-3">
          <label style={{ gridColumn: 'span 2' }}>
            Job title or keywords
            <input
              value={draft.q}
              onChange={(event) => setDraft({ ...draft, q: event.target.value })}
              onKeyDown={(event) => event.key === 'Enter' && search()}
              placeholder="Senior Accountant"
            />
          </label>
          <label>
            Sort
            <select
              value={draft.sort}
              onChange={(event) => setDraft({ ...draft, sort: event.target.value })}
            >
              <option value="recent">Most recent</option>
              <option value="salary">Highest salary</option>
              <option value="experience">Least experience required</option>
            </select>
          </label>
        </div>

        <div className="mt-1">
          <span className="hint">Work arrangement</span>
          <div className="chip-row mt-1">
            {WORK_MODES.map((mode) => (
              <button
                key={mode}
                className={draft.workMode.includes(mode) ? 'btn-sm' : 'secondary btn-sm'}
                aria-pressed={draft.workMode.includes(mode)}
                onClick={() => toggle('workMode', mode)}
              >
                {label(mode)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-1">
          <span className="hint">Employment type</span>
          <div className="chip-row mt-1">
            {EMPLOYMENT_TYPES.map((type) => (
              <button
                key={type}
                className={draft.employmentType.includes(type) ? 'btn-sm' : 'secondary btn-sm'}
                aria-pressed={draft.employmentType.includes(type)}
                onClick={() => toggle('employmentType', type)}
              >
                {label(type)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-1">
          <span className="hint">Experience level</span>
          <div className="chip-row mt-1">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level}
                className={draft.experienceLevel.includes(level) ? 'btn-sm' : 'secondary btn-sm'}
                aria-pressed={draft.experienceLevel.includes(level)}
                onClick={() => toggle('experienceLevel', level)}
              >
                {label(level)}
              </button>
            ))}
          </div>
        </div>

        <details className="mt-2">
          <summary style={{ cursor: 'pointer' }}>
            More filters {activeCount > 0 ? `(${activeCount} active)` : ''}
          </summary>

          <div className="grid cols-3 mt-2">
            <label>
              Country
              <input
                value={draft.country}
                onChange={(event) => setDraft({ ...draft, country: event.target.value })}
                list="job-countries"
              />
              <datalist id="job-countries">
                {(facets?.country ?? []).map((row) => (
                  <option key={row.value} value={row.value} />
                ))}
              </datalist>
            </label>
            <label>
              State / province
              <input
                value={draft.state}
                onChange={(event) => setDraft({ ...draft, state: event.target.value })}
              />
            </label>
            <label>
              City
              <input
                value={draft.city}
                onChange={(event) => setDraft({ ...draft, city: event.target.value })}
              />
            </label>

            <label>
              Industry
              <input
                value={draft.industry}
                onChange={(event) => setDraft({ ...draft, industry: event.target.value })}
                list="job-industries"
              />
              <datalist id="job-industries">
                {(facets?.industry ?? []).map((row) => (
                  <option key={row.value} value={row.value} />
                ))}
              </datalist>
            </label>
            <label>
              Skills
              <input
                value={draft.skills}
                onChange={(event) => setDraft({ ...draft, skills: event.target.value })}
                placeholder="excel, quickbooks"
              />
              <span className="hint">Comma separated — a job matching any of them counts.</span>
            </label>
            <label>
              Company
              <input
                value={draft.company}
                onChange={(event) => setDraft({ ...draft, company: event.target.value })}
              />
            </label>

            <label>
              Experience from (years)
              <input
                type="number"
                min={0}
                value={draft.minExperience}
                onChange={(event) => setDraft({ ...draft, minExperience: event.target.value })}
              />
            </label>
            <label>
              Experience to (years)
              <input
                type="number"
                min={0}
                value={draft.maxExperience}
                onChange={(event) => setDraft({ ...draft, maxExperience: event.target.value })}
              />
            </label>
            <label>
              Education
              <select
                value={draft.educationLevel}
                onChange={(event) => setDraft({ ...draft, educationLevel: event.target.value })}
              >
                <option value="">Any</option>
                {EDUCATION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {label(level)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Salary from
              <input
                type="number"
                min={0}
                value={draft.salaryMin}
                onChange={(event) => setDraft({ ...draft, salaryMin: event.target.value })}
                placeholder="40000"
              />
            </label>
            <label>
              Salary to
              <input
                type="number"
                min={0}
                value={draft.salaryMax}
                onChange={(event) => setDraft({ ...draft, salaryMax: event.target.value })}
                placeholder="70000"
              />
            </label>
            <label>
              Posted
              <select
                value={draft.postedWithinDays}
                onChange={(event) => setDraft({ ...draft, postedWithinDays: event.target.value })}
              >
                {POSTED_OPTIONS.map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </label>

            <label>
              I can work from
              <input
                value={draft.remoteFor}
                onChange={(event) => setDraft({ ...draft, remoteFor: event.target.value })}
                placeholder="Pakistan"
              />
              <span className="hint">
                Hides remote jobs restricted to other countries.
              </span>
            </label>
            <label>
              My time zone
              <input
                value={draft.timezone}
                onChange={(event) => setDraft({ ...draft, timezone: event.target.value })}
                placeholder="PKT"
              />
            </label>
            <label>
              Work authorisation
              <select
                value={draft.workAuthorization}
                onChange={(event) => setDraft({ ...draft, workAuthorization: event.target.value })}
              >
                <option value="">Any</option>
                <option value="NOT_REQUIRED">Not required</option>
                <option value="REQUIRED">Required</option>
                <option value="EMPLOYER_SPECIFIED">Employer specified</option>
              </select>
            </label>
          </div>

          <label className="row mt-1" style={{ gap: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={draft.visaSponsorship}
              onChange={(event) => setDraft({ ...draft, visaSponsorship: event.target.checked })}
              style={{ width: 'auto' }}
            />
            Only jobs offering visa sponsorship
          </label>
        </details>

        <div className="row mt-2">
          <button onClick={search} disabled={isFetching}>
            {isFetching ? 'Searching…' : 'Search jobs'}
          </button>
          <button className="secondary" onClick={reset}>
            Reset
          </button>
        </div>
      </Card>

      <Alert tone="info">
        Remote eligibility is a real field, not a line in the description — if a job says remote but
        is limited to certain countries or time zones, the filters above respect that.
      </Alert>

      {isLoading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : !data || data.items.length === 0 ? (
        <Card>
          <Empty
            title="No jobs match those filters"
            hint="Filters combine with AND. Try removing the location, salary or experience filter."
          />
        </Card>
      ) : (
        <>
          <p className="muted" style={{ fontSize: 13 }}>
            {data.total} job(s) found
          </p>

          {data.items.map((job) => (
            <Card key={job.id}>
              <div className="row between wrap">
                <div>
                  <h3 className="mb-0">{job.title}</h3>
                  <p className="muted mb-0">
                    {job.company?.name}
                    {' · '}
                    {[job.location, job.state, job.country].filter(Boolean).join(', ') ||
                      'Location flexible'}
                    {' · '}
                    {label(job.workMode)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="muted" style={{ fontSize: 13 }}>
                    {formatSalary({
                      min: job.salaryMin,
                      max: job.salaryMax,
                      currency: job.salaryCurrency,
                    })}
                  </div>
                  <div className="muted" style={{ fontSize: 12.5 }}>
                    posted {formatDate(job.publishedAt ?? job.createdAt)}
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
                    remote: {(job.remoteCountries ?? []).slice(0, 3).join(', ') || 'restricted'}
                  </Badge>
                )}
                {job.remoteEligibility === 'SPECIFIC_TIMEZONES' && (
                  <Badge tone="warning">
                    time zone: {(job.remoteTimezones ?? []).slice(0, 3).join(', ')}
                  </Badge>
                )}
                {job.workAuthorization === 'REQUIRED' && (
                  <Badge tone="warning">work authorisation required</Badge>
                )}
              </div>

              <div className="row mt-2" style={{ gap: 10 }}>
                <ApplyButton jobId={job.id} jobOpen={job.status === 'PUBLISHED'} />
                <button
                  className="secondary btn-sm"
                  onClick={() => toggleSaved.mutate(job)}
                  aria-pressed={savedIds.has(job.id)}
                >
                  <AppIcon name="bookmark" size={14} />
                  {savedIds.has(job.id) ? 'Saved' : 'Save'}
                </button>
              </div>
            </Card>
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
    </>
  );
}
