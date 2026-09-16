import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Badge, Card, Empty, Field, Loading, Pagination } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatDate, formatSalary, relativeTime } from '../../lib/format';
import type { Paginated, SearchResultItem } from '../../lib/types';

interface Filters {
  q: string;
  skills: string;
  country: string;
  city: string;
  industry: string;
  education: string;
  minExperience: string;
  maxExperience: string;
  maxSalary: string;
  workMode: string;
  availableBy: string;
  verifiedOnly: boolean;
  contactableOnly: boolean;
  sort: string;
}

const EMPTY: Filters = {
  q: '',
  skills: '',
  country: '',
  city: '',
  industry: '',
  education: '',
  minExperience: '',
  maxExperience: '',
  maxSalary: '',
  workMode: '',
  availableBy: '',
  verifiedOnly: true,
  contactableOnly: false,
  sort: 'relevance',
};

export default function CandidateSearch() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['candidate-search', applied, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '10');
      if (applied.q) params.set('q', applied.q);
      if (applied.skills) params.set('skills', applied.skills);
      if (applied.country) params.set('country', applied.country);
      if (applied.city) params.set('city', applied.city);
      if (applied.industry) params.set('industry', applied.industry);
      if (applied.education) params.set('education', applied.education);
      if (applied.minExperience) params.set('minExperience', applied.minExperience);
      if (applied.maxExperience) params.set('maxExperience', applied.maxExperience);
      if (applied.maxSalary) params.set('maxSalary', applied.maxSalary);
      if (applied.workMode) params.set('workMode', applied.workMode);
      if (applied.availableBy) params.set('availableBy', applied.availableBy);
      if (applied.verifiedOnly) params.set('verifiedOnly', 'true');
      if (applied.contactableOnly) params.set('contactableOnly', 'true');
      params.set('sort', applied.sort);
      return (await api.get<Paginated<SearchResultItem>>(`/candidates/search?${params.toString()}`)).data;
    },
    retry: false,
  });

  const update = (patch: Partial<Filters>) => setFilters((current) => ({ ...current, ...patch }));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Candidate search</h1>
          <p className="muted mb-0">
            Full-text and fuzzy search across verified, live profiles. Private contact details are never returned.
          </p>
        </div>
      </div>

      {error && <Alert tone="danger">{errorMessage(error, 'Search is unavailable')}</Alert>}

      <Card title="Filters">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setApplied(filters);
          }}
        >
          <div className="grid cols-3">
            <Field label="Keyword" hint="Job title, skill or free text">
              <input value={filters.q} onChange={(event) => update({ q: event.target.value })} />
            </Field>
            <Field label="Skills" hint="Comma separated — partial matches work">
              <input value={filters.skills} onChange={(event) => update({ skills: event.target.value })} />
            </Field>
            <Field label="Industry">
              <input value={filters.industry} onChange={(event) => update({ industry: event.target.value })} />
            </Field>
            <Field label="Country">
              <input value={filters.country} onChange={(event) => update({ country: event.target.value })} />
            </Field>
            <Field label="City">
              <input value={filters.city} onChange={(event) => update({ city: event.target.value })} />
            </Field>
            <Field label="Education contains">
              <input value={filters.education} onChange={(event) => update({ education: event.target.value })} />
            </Field>
            <Field label="Min experience (years)">
              <input
                type="number"
                min={0}
                value={filters.minExperience}
                onChange={(event) => update({ minExperience: event.target.value })}
              />
            </Field>
            <Field label="Max experience (years)">
              <input
                type="number"
                min={0}
                value={filters.maxExperience}
                onChange={(event) => update({ maxExperience: event.target.value })}
              />
            </Field>
            <Field label="Max expected salary">
              <input
                type="number"
                min={0}
                value={filters.maxSalary}
                onChange={(event) => update({ maxSalary: event.target.value })}
              />
            </Field>
            <Field label="Work mode">
              <select value={filters.workMode} onChange={(event) => update({ workMode: event.target.value })}>
                <option value="">Any</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">On-site</option>
              </select>
            </Field>
            <Field label="Available by">
              <input
                type="date"
                value={filters.availableBy}
                onChange={(event) => update({ availableBy: event.target.value })}
              />
            </Field>
            <Field label="Sort by">
              <select value={filters.sort} onChange={(event) => update({ sort: event.target.value })}>
                <option value="relevance">Relevance</option>
                <option value="experience">Experience</option>
                <option value="completeness">Profile completeness</option>
                <option value="recent">Recent activity</option>
                <option value="availability">Availability</option>
              </select>
            </Field>
          </div>

          <div className="row wrap">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(event) => update({ verifiedOnly: event.target.checked })}
              />
              <span>Verified candidates only</span>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={filters.contactableOnly}
                onChange={(event) => update({ contactableOnly: event.target.checked })}
              />
              <span>Open to recruiter contact</span>
            </label>
          </div>

          <div className="row">
            <button type="submit">Search</button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setFilters(EMPTY);
                setApplied(EMPTY);
                setPage(1);
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </Card>

      {isLoading ? (
        <Loading />
      ) : !data || data.items.length === 0 ? (
        <Card>
          <Empty
            title="No candidates match those filters"
            hint={
              applied.verifiedOnly
                ? 'Only verified candidates are shown. Uncheck "Verified candidates only", or remove the skill, location and industry filters — they are combined with AND.'
                : 'Filters are combined with AND. Try removing the skill, location or industry filter, or widening the experience range.'
            }
            action={
              <button
                className="secondary"
                onClick={() => {
                  setFilters(EMPTY);
                  setApplied({ ...EMPTY, verifiedOnly: false });
                  setPage(1);
                }}
              >
                Show all visible candidates
              </button>
            }
          />
        </Card>
      ) : (
        <>
          <p className="muted">{data.total} candidate(s) found</p>
          {data.items.map((candidate) => (
            <Card key={candidate.id}>
              <div className="row between wrap" style={{ alignItems: 'flex-start' }}>
                <div className="grow">
                  <div className="row">
                    <Link to={`/recruiter/candidates/${candidate.id}`}>
                      <strong>{candidate.fullName}</strong>
                    </Link>
                    {candidate.verified && <Badge tone="success">✓ Verified</Badge>}
                    {!candidate.contactable && <Badge tone="warning">Contact disabled</Badge>}
                  </div>
                  <div className="muted">
                    {candidate.headline ?? candidate.currentTitle ?? 'No headline'} · {candidate.location ?? 'Location hidden'}
                  </div>
                  <div className="chip-row mt-1">
                    {candidate.skills.map((skill) => (
                      <span key={skill} className="chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right" style={{ minWidth: 180 }}>
                  <div>{candidate.experienceYears} years experience</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {formatSalary(candidate.salary)}
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    Available {candidate.availabilityDate ? formatDate(candidate.availabilityDate) : 'now'}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Active {relativeTime(candidate.lastActiveAt)}
                  </div>
                  <Link to={`/recruiter/candidates/${candidate.id}`} className="btn btn-sm mt-1">
                    View profile
                  </Link>
                </div>
              </div>
            </Card>
          ))}
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
