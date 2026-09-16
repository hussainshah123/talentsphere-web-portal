import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { Alert, Card, Field, Loading, VerificationBadge } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import type { VerificationCaseDetail } from '../../lib/types';

const DECISIONS = [
  { value: 'VERIFIED', label: 'Approve and grant badge' },
  { value: 'REJECTED', label: 'Reject with reason' },
  { value: 'SUSPENDED', label: 'Suspend profile' },
  { value: 'PENDING_REVIEW', label: 'Keep in review' },
];

export default function VerificationCaseDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState('VERIFIED');
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['verification-case', id],
    queryFn: async () => (await api.get<VerificationCaseDetail>(`/admin/verification-cases/${id}`)).data,
  });

  const decide = useMutation({
    mutationFn: async () => (await api.patch(`/admin/verification-cases/${id}`, { decision, reason })).data,
    onSuccess: () => {
      toast.success('Decision recorded');
      void queryClient.invalidateQueries({ queryKey: ['verification-cases'] });
      void queryClient.invalidateQueries({ queryKey: ['verification-case', id] });
      navigate('/admin/verification');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not record the decision')),
  });

  if (isLoading || !data) return <Loading />;

  const checklist = data.checklistJson ?? [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{data.candidate.fullName}</h1>
          <p className="muted mb-0">
            {data.candidate.user.email} · completeness {data.candidate.completeness}% · score {data.score}%
          </p>
        </div>
        <VerificationBadge status={data.status} />
      </div>

      {data.decisionReason && <Alert tone="info">Last decision: {data.decisionReason}</Alert>}

      <div className="grid cols-3">
        <div style={{ gridColumn: 'span 2' }}>
          <Card title="Checklist snapshot">
            {checklist.length === 0 ? (
              <p className="muted mb-0">No checklist captured yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Check</th>
                      <th>Result</th>
                      <th>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checklist.map((item) => (
                      <tr key={item.key}>
                        <td>
                          <strong>{item.label}</strong>
                          <div className="muted" style={{ fontSize: 12.5 }}>
                            {item.required ? 'required' : 'optional'} · {item.autoCheck ? 'automatic' : 'manual'}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${item.passed ? 'success' : item.required ? 'danger' : 'warning'}`}>
                            {item.passed ? 'passed' : 'not passed'}
                          </span>
                        </td>
                        <td className="muted">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Case history">
            {data.events.length === 0 ? (
              <p className="muted mb-0">No events recorded.</p>
            ) : (
              data.events.map((event) => (
                <div key={event.id} style={{ borderBottom: '1px solid var(--border)', padding: '10px 0' }}>
                  <div className="row between">
                    <strong>{event.eventType.replace(/_/g, ' ')}</strong>
                    <span className="muted">{formatDate(event.createdAt, true)}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {event.actor?.email ?? 'system'}
                    {event.metadataJson && Object.keys(event.metadataJson).length > 0
                      ? ` · ${JSON.stringify(event.metadataJson)}`
                      : ''}
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

        <div>
          <Card title="Decision">
            <Field label="Decision">
              <select value={decision} onChange={(event) => setDecision(event.target.value)}>
                {DECISIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Reason" hint="Shown to the candidate and stored in the audit trail." required>
              <textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} />
            </Field>
            <button onClick={() => decide.mutate()} disabled={reason.trim().length < 3 || decide.isPending}>
              Record decision
            </button>
          </Card>

          <Card title="Candidate">
            <table>
              <tbody>
                <tr>
                  <td className="muted">Email</td>
                  <td>{data.candidate.user.email}</td>
                </tr>
                <tr>
                  <td className="muted">Email verified</td>
                  <td>{data.candidate.user.emailVerifiedAt ? formatDate(data.candidate.user.emailVerifiedAt) : 'No'}</td>
                </tr>
                <tr>
                  <td className="muted">Phone</td>
                  <td>{data.candidate.user.phone ?? '—'}</td>
                </tr>
                <tr>
                  <td className="muted">Profile status</td>
                  <td>{data.candidate.profileStatus}</td>
                </tr>
                <tr>
                  <td className="muted">Submitted</td>
                  <td>{formatDate(data.submittedAt, true)}</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </>
  );
}
