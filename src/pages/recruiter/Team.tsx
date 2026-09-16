import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '../../components/Toast';
import { Alert, Badge, Card, Field, Loading } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';

interface Member {
  id: string;
  role: string;
  title: string | null;
  status: string;
  createdAt: string;
  user: { id: string; email: string; lastLoginAt: string | null; status: string };
}

export default function Team() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('RECRUITER');
  const [title, setTitle] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['company-members'],
    queryFn: async () => (await api.get<Member[]>('/companies/me/members')).data,
  });

  const invite = useMutation({
    mutationFn: async () => (await api.post('/companies/me/members', { email, role, title: title || undefined })).data,
    onSuccess: () => {
      toast.success('Recruiter added to your company');
      setEmail('');
      setTitle('');
      void queryClient.invalidateQueries({ queryKey: ['company-members'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not add that recruiter')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/companies/me/members/${id}`)).data,
    onSuccess: () => {
      toast.success('Member removed');
      void queryClient.invalidateQueries({ queryKey: ['company-members'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not remove that member')),
  });

  if (isLoading || !data) return <Loading />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Recruiters</h1>
          <p className="muted mb-0">Owners and admins manage the team. Viewers can browse but not contact candidates.</p>
        </div>
      </div>

      <Card title="Add a recruiter">
        <Alert tone="info">
          The person must already have a recruiter account. Ask them to register first, then add their email here.
        </Alert>
        <div className="grid cols-3">
          <Field label="Email" required>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field label="Role">
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="RECRUITER">Recruiter</option>
              <option value="ADMIN">Company admin</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </Field>
          <Field label="Job title (optional)">
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
        </div>
        <button onClick={() => invite.mutate()} disabled={!email.includes('@') || invite.isPending}>
          Add to company
        </button>
      </Card>

      <Card title="Team">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Title</th>
                <th>Last login</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((member) => (
                <tr key={member.id}>
                  <td>{member.user.email}</td>
                  <td>
                    <Badge tone={member.role === 'OWNER' ? 'info' : 'default'}>{member.role.toLowerCase()}</Badge>
                  </td>
                  <td>{member.title ?? '—'}</td>
                  <td className="muted">{formatDate(member.user.lastLoginAt, true)}</td>
                  <td>
                    {member.role !== 'OWNER' && (
                      <button className="ghost btn-sm" onClick={() => remove.mutate(member.id)}>
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
