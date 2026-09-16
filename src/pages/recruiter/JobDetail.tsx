import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { Alert, Badge, Card, Empty, Loading } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatSalary } from '../../lib/format';
import type { Job, JobMatchResult } from '../../lib/types';
import JobApplicants from './JobApplicants';

const STAGES = ['SAVED', 'SHORTLISTED', 'CONTACTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

interface StoredMatch {
  id: string;
  score: number;
  stage: string;
  explanationJson: JobMatchResult['items'][number]['explanation'] | null;
  candidate: {
    id: string;
    fullName: string;
    headline: string | null;
    city: string | null;
    country: string | null;
    experienceYears: number;
    verificationStatus: string;
  };
}

export default function JobDetail() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => (await api.get<Job>(`/jobs/${id}`)).data,
  });

  const { data: matches } = useQuery({
    queryKey: ['job-matches', id],
    queryFn: async () => (await api.get<StoredMatch[]>(`/jobs/${id}/matches`)).data,
  });

  const runMatch = useMutation({
    mutationFn: async () => (await api.post<JobMatchResult>(`/jobs/${id}/match?limit=25`)).data,
    onSuccess: () => {
      toast.success('Matching finished');
      void queryClient.invalidateQueries({ queryKey: ['job-matches', id] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not run matching')),
  });

  const setStage = useMutation({
    mutationFn: async ({ matchId, stage }: { matchId: string; stage: string }) =>
      (await api.patch(`/jobs/matches/${matchId}/stage`, { stage })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-matches', id] }),
  });

  if (isLoading || !job) return <Loading />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{job.title}</h1>
          <p className="muted mb-0">
            {[job.location, job.workMode, job.employmentType.replace('_', ' ')].filter(Boolean).join(' · ')} ·{' '}
            {formatSalary({ min: job.salaryMin, max: job.salaryMax, currency: job.salaryCurrency })}
          </p>
        </div>
        <div className="row">
          <Badge tone={job.status === 'PUBLISHED' ? 'success' : 'warning'}>{job.status.toLowerCase()}</Badge>
          <button onClick={() => runMatch.mutate()} disabled={runMatch.isPending}>
            {runMatch.isPending ? 'Matching…' : 'Run candidate matching'}
          </button>
        </div>
      </div>

      <Alert tone="warning">
        Match scores are advisory and may contain errors. They must not be the sole basis for rejecting a candidate.
      </Alert>

      <JobApplicants jobId={id} />

      <div className="grid cols-3">
        <div style={{ gridColumn: 'span 2' }}>
          <Card title={`Ranked candidates (${matches?.length ?? 0})`} icon="talent">
            <p className="muted" style={{ fontSize: 13 }}>
              Sourcing, not applications — these people have <strong>not</strong> applied. The matcher
              ranks live, visible candidates against this job so you can reach out.
            </p>
            {!matches || matches.length === 0 ? (
              <Empty title="No matches yet" hint="Run candidate matching to rank live, visible candidates." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Score</th>
                      <th>Stage</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((match) => (
                      <tr key={match.id}>
                        <td>
                          <Link to={`/recruiter/candidates/${match.candidate.id}`}>
                            <strong>{match.candidate.fullName}</strong>
                          </Link>
                          <div className="muted" style={{ fontSize: 13 }}>
                            {match.candidate.headline} · {match.candidate.experienceYears} yrs ·{' '}
                            {[match.candidate.city, match.candidate.country].filter(Boolean).join(', ')}
                          </div>
                          {expanded === match.id && match.explanationJson && (
                            <div className="mt-1" style={{ fontSize: 13 }}>
                              <div>
                                <strong>Skills ({match.explanationJson.skills.score}):</strong>{' '}
                                {match.explanationJson.skills.matched.join(', ') || 'none matched'}
                              </div>
                              <div className="muted">
                                Missing: {match.explanationJson.skills.missing.slice(0, 8).join(', ') || '—'}
                              </div>
                              <div>
                                Experience {match.explanationJson.experience.candidateYears} yrs vs required{' '}
                                {match.explanationJson.experience.requiredYears ?? 'n/a'} (
                                {match.explanationJson.experience.score})
                              </div>
                              <div>
                                Location {match.explanationJson.location.candidate ?? '—'} (
                                {match.explanationJson.location.score}) · Work mode{' '}
                                {match.explanationJson.workMode.candidate} ({match.explanationJson.workMode.score})
                              </div>
                              <div>
                                Salary fit {match.explanationJson.salary.score} · ATS{' '}
                                {match.explanationJson.atsScore ?? '—'}
                              </div>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${match.score >= 75 ? 'success' : match.score >= 50 ? 'warning' : ''}`}>
                            {match.score}%
                          </span>
                        </td>
                        <td>
                          <select
                            value={match.stage}
                            onChange={(event) => setStage.mutate({ matchId: match.id, stage: event.target.value })}
                          >
                            {STAGES.map((stage) => (
                              <option key={stage} value={stage}>
                                {stage.toLowerCase()}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            className="ghost btn-sm"
                            onClick={() => setExpanded(expanded === match.id ? null : match.id)}
                          >
                            {expanded === match.id ? 'Hide' : 'Why?'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card title="Job description">
            <p style={{ whiteSpace: 'pre-wrap' }}>{job.description}</p>
            {job.requirements && (
              <>
                <h4>Requirements</h4>
                <p style={{ whiteSpace: 'pre-wrap' }} className="muted">
                  {job.requirements}
                </p>
              </>
            )}
            <div className="chip-row mt-1">
              {job.skills.map((skill) => (
                <span key={skill} className="chip">
                  {skill}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
