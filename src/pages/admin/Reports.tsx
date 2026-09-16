import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '../../components/Toast';
import { Badge, Card, Empty, Field, Loading, Modal, Pagination } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import type { Paginated } from '../../lib/types';

interface AdminReport {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: string;
  resolution: string | null;
  createdAt: string;
  reporter: { id: string; email: string; role: string };
  resolvedBy: { id: string; email: string } | null;
}

export default function AdminReports() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState('OPEN');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AdminReport | null>(null);
  const [decision, setDecision] = useState<'RESOLVED' | 'DISMISSED' | 'IN_REVIEW'>('RESOLVED');
  const [resolution, setResolution] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (status) params.set('status', status);
      return (await api.get<Paginated<AdminReport>>(`/admin/reports?${params}`)).data;
    },
  });

  const resolve = useMutation({
    mutationFn: async () => (await api.patch(`/admin/reports/${target?.id}`, { status: decision, resolution })).data,
    onSuccess: () => {
      toast.success('Report updated');
      setTarget(null);
      setResolution('');
      void queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update the report')),
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Reports & moderation</h1>
          <p className="muted mb-0">
            An open report against a candidate fails the moderation verification check until it is resolved.
          </p>
        </div>
      </div>

      <Card>
        <div className="chip-row">
          {['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED', ''].map((value) => (
            <button
              key={value || 'ALL'}
              className={status === value ? '' : 'secondary'}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
            >
              {value ? value.toLowerCase().replace('_', ' ') : 'all'}
            </button>
          ))}
        </div>
      </Card>

      {isLoading || !data ? (
        <Loading />
      ) : data.items.length === 0 ? (
        <Card>
          <Empty title="Nothing to moderate" hint="No reports with this status." />
        </Card>
      ) : (
        <Card>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Reporter</th>
                  <th>Filed</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <Badge tone="info">{report.targetType.toLowerCase()}</Badge>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {report.targetId}
                      </div>
                    </td>
                    <td>
                      <strong>{report.reason}</strong>
                      {report.details && <div className="muted">{report.details}</div>}
                      {report.resolution && (
                        <div className="muted" style={{ fontSize: 12.5 }}>
                          Resolution: {report.resolution}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge
                        tone={
                          report.status === 'OPEN' ? 'danger' : report.status === 'RESOLVED' ? 'success' : 'warning'
                        }
                      >
                        {report.status.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="muted">{report.reporter.email}</td>
                    <td className="muted">{formatDate(report.createdAt, true)}</td>
                    <td>
                      <button className="ghost btn-sm" onClick={() => setTarget(report)}>
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </Card>
      )}

      {target && (
        <Modal
          title="Resolve report"
          onClose={() => setTarget(null)}
          footer={
            <>
              <button className="secondary" onClick={() => setTarget(null)}>
                Cancel
              </button>
              <button disabled={resolution.trim().length < 3 || resolve.isPending} onClick={() => resolve.mutate()}>
                Save
              </button>
            </>
          }
        >
          <p className="muted">
            {target.targetType} · {target.targetId}
          </p>
          <Field label="Outcome">
            <select value={decision} onChange={(event) => setDecision(event.target.value as typeof decision)}>
              <option value="RESOLVED">Resolved — action taken</option>
              <option value="DISMISSED">Dismissed — no action needed</option>
              <option value="IN_REVIEW">Keep in review</option>
            </select>
          </Field>
          <Field label="Resolution note" required>
            <textarea rows={3} value={resolution} onChange={(event) => setResolution(event.target.value)} />
          </Field>
        </Modal>
      )}
    </>
  );
}
