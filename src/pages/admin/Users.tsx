import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '../../components/Toast';
import { Badge, Card, Field, Loading, Modal, Pagination } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import type { Paginated } from '../../lib/types';

interface AdminUser {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  candidateProfile: { id: string; fullName: string; verificationStatus: string; completeness: number } | null;
  companyMembers: Array<{ role: string; company: { id: string; name: string } }>;
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [reason, setReason] = useState('');
  const [nextStatus, setNextStatus] = useState('SUSPENDED');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, role, status, query],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (role) params.set('role', role);
      if (status) params.set('status', status);
      if (query) params.set('q', query);
      return (await api.get<Paginated<AdminUser>>(`/admin/users?${params}`)).data;
    },
  });

  const setUserStatus = useMutation({
    mutationFn: async () => (await api.patch(`/admin/users/${target?.id}/status`, { status: nextStatus, reason })).data,
    onSuccess: () => {
      toast.success('User status updated');
      setTarget(null);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update the user')),
  });

  const setUserRole = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) =>
      (await api.patch(`/admin/users/${id}/role`, { role: value })).data,
    onSuccess: () => {
      toast.success('Role updated');
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not change the role')),
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="muted mb-0">Suspend accounts, change roles and inspect verification state.</p>
        </div>
      </div>

      <Card>
        <form
          className="row wrap"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setQuery(search);
          }}
        >
          <input
            style={{ maxWidth: 260 }}
            placeholder="Search by email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select style={{ maxWidth: 200 }} value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="">All roles</option>
            <option value="CANDIDATE">Candidates</option>
            <option value="RECRUITER">Recruiters</option>
            <option value="VERIFICATION_OFFICER">Verification officers</option>
            <option value="ADMIN">Admins</option>
          </select>
          <select style={{ maxWidth: 180 }} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DELETED">Deleted</option>
          </select>
          <button type="submit">Filter</button>
        </form>
      </Card>

      {isLoading || !data ? (
        <Loading />
      ) : (
        <Card>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Context</th>
                  <th>Last login</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.email}</strong>
                      <div className="muted" style={{ fontSize: 12.5 }}>
                        Joined {formatDate(user.createdAt)} ·{' '}
                        {user.emailVerifiedAt ? 'email verified' : 'email unverified'}
                      </div>
                    </td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(event) => setUserRole.mutate({ id: user.id, value: event.target.value })}
                      >
                        <option value="CANDIDATE">Candidate</option>
                        <option value="RECRUITER">Recruiter</option>
                        <option value="VERIFICATION_OFFICER">Verification officer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td>
                      <Badge
                        tone={user.status === 'ACTIVE' ? 'success' : user.status === 'SUSPENDED' ? 'danger' : 'warning'}
                      >
                        {user.status.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="muted" style={{ fontSize: 13 }}>
                      {user.candidateProfile
                        ? `${user.candidateProfile.fullName} · ${user.candidateProfile.verificationStatus.toLowerCase()}`
                        : user.companyMembers[0]
                          ? `${user.companyMembers[0].company.name} · ${user.companyMembers[0].role.toLowerCase()}`
                          : '—'}
                    </td>
                    <td className="muted">{formatDate(user.lastLoginAt, true)}</td>
                    <td>
                      <button
                        className="ghost btn-sm"
                        onClick={() => {
                          setTarget(user);
                          setNextStatus(user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED');
                        }}
                      >
                        {user.status === 'SUSPENDED' ? 'Reinstate' : 'Suspend'}
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
          title={`Change status for ${target.email}`}
          onClose={() => setTarget(null)}
          footer={
            <>
              <button className="secondary" onClick={() => setTarget(null)}>
                Cancel
              </button>
              <button
                className={nextStatus === 'SUSPENDED' ? 'danger' : ''}
                disabled={reason.trim().length < 3 || setUserStatus.isPending}
                onClick={() => setUserStatus.mutate()}
              >
                Apply
              </button>
            </>
          }
        >
          <Field label="New status">
            <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING">Pending</option>
            </select>
          </Field>
          <Field label="Reason" hint="Sent to the user and stored in the audit log." required>
            <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />
          </Field>
          {nextStatus === 'SUSPENDED' && (
            <p className="muted mb-0">
              Suspension revokes active sessions and hides any candidate profile from search immediately.
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
