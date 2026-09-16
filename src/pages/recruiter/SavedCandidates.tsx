import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { Badge, Card, Empty, Loading, Pagination } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import type { Paginated, SavedCandidate } from '../../lib/types';

const STAGES = ['SAVED', 'SHORTLISTED', 'CONTACTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

export default function SavedCandidates() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [pool, setPool] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['saved-candidates', pool, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (pool) params.set('poolName', pool);
      return (
        await api.get<Paginated<SavedCandidate> & { pools: Array<{ name: string; count: number }> }>(
          `/companies/me/saved-candidates?${params.toString()}`,
        )
      ).data;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      (await api.patch(`/companies/me/saved-candidates/${id}`, patch)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-candidates'] }),
    onError: (error) => toast.error(errorMessage(error, 'Could not update')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/companies/me/saved-candidates/${id}`)).data,
    onSuccess: () => {
      toast.success('Removed from the pool');
      void queryClient.invalidateQueries({ queryKey: ['saved-candidates'] });
    },
  });

  if (isLoading || !data) return <Loading />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Saved candidates & talent pools</h1>
          <p className="muted mb-0">Shared with your whole company. Notes are private to your team.</p>
        </div>
      </div>

      <Card title="Pools">
        <div className="chip-row">
          <button className={pool === '' ? '' : 'secondary'} onClick={() => setPool('')}>
            All ({data.total})
          </button>
          {data.pools.map((entry) => (
            <button
              key={entry.name}
              className={pool === entry.name ? '' : 'secondary'}
              onClick={() => {
                setPool(entry.name);
                setPage(1);
              }}
            >
              {entry.name} ({entry.count})
            </button>
          ))}
        </div>
      </Card>

      {data.items.length === 0 ? (
        <Card>
          <Empty title="No saved candidates" hint="Save promising candidates from search to build a pool." />
        </Card>
      ) : (
        <Card>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Pool</th>
                  <th>Stage</th>
                  <th>Notes</th>
                  <th>Saved</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <Link to={`/recruiter/candidates/${entry.candidate.id}`}>
                        <strong>{entry.candidate.fullName}</strong>
                      </Link>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {entry.candidate.headline}
                      </div>
                      <div className="row mt-1">
                        {entry.candidate.verificationStatus === 'VERIFIED' && <Badge tone="success">Verified</Badge>}
                        <span className="muted" style={{ fontSize: 12 }}>
                          {entry.candidate.experienceYears} yrs ·{' '}
                          {[entry.candidate.city, entry.candidate.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    </td>
                    <td>{entry.poolName}</td>
                    <td>
                      <select
                        value={entry.stage}
                        onChange={(event) => update.mutate({ id: entry.id, patch: { stage: event.target.value } })}
                      >
                        {STAGES.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage.toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ maxWidth: 240 }}>
                      <textarea
                        rows={2}
                        defaultValue={entry.notes ?? ''}
                        onBlur={(event) =>
                          event.target.value !== (entry.notes ?? '') &&
                          update.mutate({ id: entry.id, patch: { notes: event.target.value } })
                        }
                      />
                    </td>
                    <td className="muted">{formatDate(entry.createdAt)}</td>
                    <td>
                      <button className="ghost btn-sm" onClick={() => remove.mutate(entry.id)}>
                        Remove
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
    </>
  );
}
