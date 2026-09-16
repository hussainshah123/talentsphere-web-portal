import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '../../components/Toast';
import { Card, Field, Loading, Modal, Pagination, VerificationBadge } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import type { Paginated, VerificationStatus } from '../../lib/types';

interface AdminCompany {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  country: string | null;
  city: string | null;
  registrationNumber: string | null;
  verificationStatus: VerificationStatus;
  createdAt: string;
  owner: { email: string };
  _count: { jobs: number; members: number };
}

export default function AdminCompanies() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState('PENDING_REVIEW');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AdminCompany | null>(null);
  const [decision, setDecision] = useState<'VERIFIED' | 'REJECTED' | 'SUSPENDED'>('VERIFIED');
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-companies', status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (status) params.set('status', status);
      return (await api.get<Paginated<AdminCompany>>(`/admin/companies?${params}`)).data;
    },
  });

  const decide = useMutation({
    mutationFn: async () =>
      (await api.patch(`/admin/companies/${target?.id}/verification`, { decision, reason })).data,
    onSuccess: () => {
      toast.success('Company verification updated');
      setTarget(null);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update the company')),
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Companies</h1>
          <p className="muted mb-0">Only verified companies can search candidates or send messages.</p>
        </div>
      </div>

      <Card>
        <div className="chip-row">
          {['PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'NOT_STARTED', ''].map((value) => (
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
      ) : (
        <Card>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Registration</th>
                  <th>Owner</th>
                  <th>Jobs / team</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <strong>{company.name}</strong>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {[company.industry, company.city, company.country].filter(Boolean).join(' · ')}
                        {company.website ? ` · ${company.website}` : ''}
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        Created {formatDate(company.createdAt)}
                      </div>
                    </td>
                    <td>
                      <VerificationBadge status={company.verificationStatus} />
                    </td>
                    <td>{company.registrationNumber ?? '—'}</td>
                    <td className="muted">{company.owner.email}</td>
                    <td>
                      {company._count.jobs} / {company._count.members}
                    </td>
                    <td>
                      <button
                        className="ghost btn-sm"
                        onClick={() => {
                          setTarget(company);
                          setDecision(company.verificationStatus === 'VERIFIED' ? 'SUSPENDED' : 'VERIFIED');
                        }}
                      >
                        Decide
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
          title={`Verification decision — ${target.name}`}
          onClose={() => setTarget(null)}
          footer={
            <>
              <button className="secondary" onClick={() => setTarget(null)}>
                Cancel
              </button>
              <button disabled={reason.trim().length < 3 || decide.isPending} onClick={() => decide.mutate()}>
                Record decision
              </button>
            </>
          }
        >
          <Field label="Decision">
            <select value={decision} onChange={(event) => setDecision(event.target.value as typeof decision)}>
              <option value="VERIFIED">Verify company</option>
              <option value="REJECTED">Reject</option>
              <option value="SUSPENDED">Suspend</option>
            </select>
          </Field>
          <Field label="Reason" hint="Emailed to the company owner and written to the audit log." required>
            <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />
          </Field>
        </Modal>
      )}
    </>
  );
}
