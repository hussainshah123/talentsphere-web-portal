import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, Empty, Loading, Pagination } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import type { Paginated } from '../../lib/types';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadataJson: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  actor: { id: string; email: string; role: string } | null;
}

export default function AuditLogs() {
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [applied, setApplied] = useState({ action: '', entityType: '' });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', applied, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '25' });
      if (applied.action) params.set('action', applied.action);
      if (applied.entityType) params.set('entityType', applied.entityType);
      return (await api.get<Paginated<AuditEntry>>(`/admin/audit-logs?${params}`)).data;
    },
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Audit logs</h1>
          <p className="muted mb-0">
            Verification decisions, profile views, CV downloads, messages and admin actions.
          </p>
        </div>
      </div>

      <Card>
        <form
          className="row wrap"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setApplied({ action, entityType });
          }}
        >
          <input
            style={{ maxWidth: 240 }}
            placeholder="Action contains… (e.g. verification)"
            value={action}
            onChange={(event) => setAction(event.target.value)}
          />
          <select style={{ maxWidth: 220 }} value={entityType} onChange={(event) => setEntityType(event.target.value)}>
            <option value="">All entities</option>
            <option value="User">User</option>
            <option value="CandidateProfile">Candidate profile</option>
            <option value="Company">Company</option>
            <option value="File">File</option>
            <option value="Conversation">Conversation</option>
          </select>
          <button type="submit">Filter</button>
        </form>
      </Card>

      {isLoading || !data ? (
        <Loading />
      ) : data.items.length === 0 ? (
        <Card>
          <Empty title="No audit entries" hint="Try a different filter." />
        </Card>
      ) : (
        <Card>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((entry) => (
                  <tr key={entry.id}>
                    <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                      {formatDate(entry.createdAt, true)}
                    </td>
                    <td>
                      {entry.actor?.email ?? 'system'}
                      <div className="muted" style={{ fontSize: 12 }}>
                        {entry.actor?.role.toLowerCase()} {entry.ipAddress ? `· ${entry.ipAddress}` : ''}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: 12.5 }}>{entry.action}</code>
                    </td>
                    <td>
                      {entry.entityType}
                      <div className="muted" style={{ fontSize: 11.5 }}>
                        {entry.entityId}
                      </div>
                    </td>
                    <td className="muted" style={{ fontSize: 12.5, maxWidth: 320, wordBreak: 'break-word' }}>
                      {entry.metadataJson && Object.keys(entry.metadataJson).length > 0
                        ? JSON.stringify(entry.metadataJson)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </Card>
      )}
    </>
  );
}
