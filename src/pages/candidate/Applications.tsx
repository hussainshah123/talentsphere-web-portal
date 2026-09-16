import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '../../components/Toast';
import { AppIcon } from '../../components/AppIcon';
import { Alert, Badge, Card, Empty, Loading, Modal, Progress } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import {
  isClosed,
  pipelineProgress,
  statusExplainer,
  statusLabel,
  statusTone,
} from '../../lib/applications';
import type { Application } from '../../lib/types';

type Filter = 'active' | 'closed' | 'all';

export default function CandidateApplications() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('active');
  const [withdrawing, setWithdrawing] = useState<Application | null>(null);
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: async () =>
      (await api.get<{ items: Application[]; total: number }>('/applications/me', { params: { pageSize: 50 } })).data,
  });

  const withdraw = useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/applications/${id}/withdraw`, { reason: reason.trim() || undefined })).data,
    onSuccess: () => {
      toast.success('Application withdrawn');
      setWithdrawing(null);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not withdraw this application')),
  });

  if (isLoading) return <Loading />;

  const all = data?.items ?? [];
  const items =
    filter === 'all' ? all : all.filter((item) => isClosed(item.status) === (filter === 'closed'));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My applications</h1>
          <p className="muted mb-0">
            Every job you applied to, and exactly where each one stands.
          </p>
        </div>
        <div className="chip-row">
          {(['active', 'closed', 'all'] as Filter[]).map((value) => (
            <button
              key={value}
              className={filter === value ? '' : 'secondary'}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <Alert tone="info">
        The ATS and match scores stored with an application are snapshots from the day you applied.
        Improving your CV later does not change what the company already received.
      </Alert>

      {items.length === 0 ? (
        <Card>
          <Empty
            title={filter === 'active' ? 'No live applications' : 'Nothing here yet'}
            hint={
              filter === 'active'
                ? 'Applications you send appear here with their status. Open Recommended jobs to find a role.'
                : 'Closed applications — hired, rejected or withdrawn — collect here.'
            }
          />
        </Card>
      ) : (
        items.map((application) => (
          <Card key={application.id}>
            <div className="row between wrap">
              <div>
                <h3 className="mb-0">{application.job?.title}</h3>
                <p className="muted mb-0">
                  {application.job?.company.name}
                  {application.job?.location ? ` · ${application.job.location}` : ''} · applied{' '}
                  {formatDate(application.createdAt)}
                </p>
              </div>
              <Badge tone={statusTone(application.status)}>{statusLabel(application.status)}</Badge>
            </div>

            {!isClosed(application.status) && (
              <div className="mt-1">
                <Progress value={pipelineProgress(application.status)} tone="accent" />
              </div>
            )}
            <p className="muted mt-1">{statusExplainer(application.status)}</p>

            <div className="row wrap" style={{ gap: 18 }}>
              <span className="muted" style={{ fontSize: 13 }}>
                <AppIcon name="ats" size={14} /> ATS at submit: {application.atsScore ?? '—'}
              </span>
              <span className="muted" style={{ fontSize: 13 }}>
                <AppIcon name="sparkle" size={14} /> Advisory match:{' '}
                {application.matchScore !== null ? `${application.matchScore}%` : '—'}
              </span>
            </div>

            {application.coverNote && (
              <details className="mt-1">
                <summary className="muted" style={{ fontSize: 13, cursor: 'pointer' }}>
                  Your cover note
                </summary>
                <p style={{ whiteSpace: 'pre-wrap' }}>{application.coverNote}</p>
              </details>
            )}

            {application.events && application.events.length > 0 && (
              <details className="mt-1">
                <summary className="muted" style={{ fontSize: 13, cursor: 'pointer' }}>
                  Timeline ({application.events.length})
                </summary>
                <ul className="mt-1">
                  {application.events.map((event) => (
                    <li key={event.id}>
                      <strong>{statusLabel(event.status)}</strong>{' '}
                      <span className="muted">{formatDate(event.createdAt, true)}</span>
                      {event.note && <div className="muted">{event.note}</div>}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {!isClosed(application.status) && (
              <div className="row mt-2">
                <button className="secondary btn-sm" onClick={() => setWithdrawing(application)}>
                  Withdraw
                </button>
              </div>
            )}
          </Card>
        ))
      )}

      {withdrawing && (
        <Modal
          title={`Withdraw from ${withdrawing.job?.title ?? 'this job'}`}
          onClose={() => setWithdrawing(null)}
          footer={
            <>
              <button className="secondary" onClick={() => setWithdrawing(null)}>
                Cancel
              </button>
              <button
                className="danger"
                disabled={withdraw.isPending}
                onClick={() => withdraw.mutate(withdrawing.id)}
              >
                {withdraw.isPending ? 'Withdrawing…' : 'Withdraw'}
              </button>
            </>
          }
        >
          <p className="muted">
            The company is told you withdrew. You can apply again while the job is still open.
          </p>
          <label>
            Reason
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Accepted another offer"
              maxLength={500}
            />
            <span className="hint">Optional, and shown to the company.</span>
          </label>
        </Modal>
      )}
    </>
  );
}
