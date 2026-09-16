import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { Badge, Card, Empty, Modal, SkeletonCard } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatDate, relativeTime } from '../../lib/format';
import { RECRUITER_STATUSES, isClosed, statusLabel, statusTone } from '../../lib/applications';
import type { Application, ApplicationStatus } from '../../lib/types';

interface ApplicantsResponse {
  items: Application[];
  total: number;
  job: { id: string; title: string };
}

const FILTERS: Array<ApplicationStatus | 'ALL'> = [
  'ALL',
  'SUBMITTED',
  'IN_REVIEW',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
];

/**
 * The people who actually applied to a job, as opposed to the speculative matches
 * the matcher ranks. Lives on the job page so a recruiter never has to hunt for it.
 */
export default function JobApplicants({ jobId }: { jobId: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [filter, setFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [moving, setMoving] = useState<Application | null>(null);
  const [note, setNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['job-applicants', jobId, filter],
    queryFn: async () =>
      (
        await api.get<ApplicantsResponse>(`/applications/job/${jobId}`, {
          params: { pageSize: 50, ...(filter === 'ALL' ? {} : { status: filter }) },
        })
      ).data,
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) =>
      (await api.patch(`/applications/${id}/status`, { status, note: note.trim() || undefined })).data,
    onSuccess: (_result, variables) => {
      toast.success(`Moved to ${statusLabel(variables.status)}`);
      setMoving(null);
      setNote('');
      void queryClient.invalidateQueries({ queryKey: ['job-applicants', jobId] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not move this application')),
  });

  const items = data?.items ?? [];

  return (
    <Card title={`Applicants (${data?.total ?? 0})`} icon="applications">
      <p className="muted" style={{ fontSize: 13 }}>
        Candidates who applied to this job. ATS and match are snapshots from the day they applied, so a
        later CV edit does not rewrite what you received.
      </p>

      <div className="chip-row mb-2">
        {FILTERS.map((status) => (
          <button
            key={status}
            className={filter === status ? '' : 'secondary'}
            onClick={() => setFilter(status)}
            aria-pressed={filter === status}
          >
            {status === 'ALL' ? 'All' : statusLabel(status)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonCard lines={4} />
      ) : items.length === 0 ? (
        <Empty
          title={filter === 'ALL' ? 'Nobody has applied yet' : 'Nothing at this stage'}
          hint={
            filter === 'ALL'
              ? 'Applications arrive here as soon as a candidate applies. The job must be published and your company verified for it to be visible.'
              : 'Try another stage, or clear the filter.'
          }
        />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>ATS</th>
                <th>Match</th>
                <th>Applied</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((application) => (
                <tr key={application.id}>
                  <td>
                    <Link to={`/recruiter/candidates/${application.candidate?.id}`}>
                      <strong>{application.candidate?.fullName}</strong>
                    </Link>
                    {application.candidate?.verificationStatus === 'VERIFIED' && (
                      <Badge tone="success">verified</Badge>
                    )}
                    <div className="muted" style={{ fontSize: 13 }}>
                      {application.candidate?.headline ?? application.candidate?.currentTitle ?? '—'} ·{' '}
                      {application.candidate?.experienceYears ?? 0} yrs ·{' '}
                      {[application.candidate?.city, application.candidate?.country]
                        .filter(Boolean)
                        .join(', ') || 'Location hidden'}
                    </div>
                    {application.coverNote && (
                      <details className="mt-1">
                        <summary className="muted" style={{ fontSize: 13, cursor: 'pointer' }}>
                          Cover note
                        </summary>
                        <p style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{application.coverNote}</p>
                      </details>
                    )}
                  </td>
                  <td>{application.atsScore ?? '—'}</td>
                  <td>
                    {application.matchScore !== null ? (
                      <span
                        className={`badge ${
                          application.matchScore >= 75 ? 'success' : application.matchScore >= 50 ? 'warning' : ''
                        }`}
                      >
                        {application.matchScore}%
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td title={formatDate(application.createdAt)}>{relativeTime(application.createdAt)}</td>
                  <td>
                    <Badge tone={statusTone(application.status)}>{statusLabel(application.status)}</Badge>
                  </td>
                  <td>
                    {isClosed(application.status) ? (
                      <span className="muted" style={{ fontSize: 13 }}>
                        closed
                      </span>
                    ) : (
                      <button className="ghost btn-sm" onClick={() => setMoving(application)}>
                        Move
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {moving && (
        <Modal title={`Move ${moving.candidate?.fullName ?? 'applicant'}`} onClose={() => setMoving(null)}>
          <label>
            Note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Strong overlap with the stack"
              maxLength={2000}
              rows={3}
            />
            <span className="hint">Shown to the candidate on their application timeline.</span>
          </label>

          <div className="chip-row mt-2">
            {RECRUITER_STATUSES.filter((status) => status !== moving.status).map((status) => (
              <button
                key={status}
                className={status === 'REJECTED' ? 'danger' : 'secondary'}
                disabled={setStatus.isPending}
                onClick={() => setStatus.mutate({ id: moving.id, status })}
              >
                {statusLabel(status)}
              </button>
            ))}
          </div>

          <p className="muted mt-2 mb-0" style={{ fontSize: 13 }}>
            Hired and rejected are final — the application cannot be moved afterwards. Match scores are
            advisory and must not be the sole basis for rejecting a candidate.
          </p>
        </Modal>
      )}
    </Card>
  );
}
