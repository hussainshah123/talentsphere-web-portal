import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Empty, Loading, Pagination, VerificationBadge } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import type { Paginated, VerificationCaseSummary } from '../../lib/types';

const STATUSES = ['PENDING_REVIEW', 'IN_PROGRESS', 'VERIFIED', 'REJECTED', 'SUSPENDED', ''];

export default function VerificationQueue() {
  const [status, setStatus] = useState('PENDING_REVIEW');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['verification-cases', status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (status) params.set('status', status);
      return (await api.get<Paginated<VerificationCaseSummary>>(`/admin/verification-cases?${params}`)).data;
    },
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Verification queue</h1>
          <p className="muted mb-0">Cases that passed the automated checks and need a human decision.</p>
        </div>
      </div>

      <Card>
        <div className="chip-row">
          {STATUSES.map((value) => (
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
          <Empty title="Queue is empty" hint="No cases with this status." />
        </Card>
      ) : (
        <Card>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Completeness</th>
                  <th>Submitted</th>
                  <th>Reviewer</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((verificationCase) => (
                  <tr key={verificationCase.id}>
                    <td>
                      <strong>{verificationCase.candidate.fullName}</strong>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {verificationCase.candidate.headline}
                      </div>
                    </td>
                    <td>
                      <VerificationBadge status={verificationCase.status} />
                    </td>
                    <td>{verificationCase.score}%</td>
                    <td>{verificationCase.candidate.completeness}%</td>
                    <td className="muted">{formatDate(verificationCase.submittedAt, true)}</td>
                    <td className="muted">{verificationCase.reviewer?.email ?? '—'}</td>
                    <td>
                      <Link to={`/admin/verification/${verificationCase.id}`} className="btn btn-secondary btn-sm">
                        Review
                      </Link>
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
