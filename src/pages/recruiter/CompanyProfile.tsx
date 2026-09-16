import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '../../components/Toast';
import { Alert, Card, Field, Loading, VerificationBadge } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import type { VerificationStatus } from '../../lib/types';

interface CompanyResponse {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  size: string | null;
  description: string | null;
  country: string | null;
  city: string | null;
  registrationNumber: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  rejectionReason: string | null;
  myRole: string;
  stats: { jobs: number; savedCandidates: number; conversations: number };
}

export default function CompanyProfile() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [registrationNumber, setRegistrationNumber] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-company'],
    queryFn: async () => (await api.get<CompanyResponse>('/companies/me')).data,
  });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (!data) return;
    reset({
      name: data.name,
      website: data.website ?? '',
      industry: data.industry ?? '',
      size: data.size ?? '',
      country: data.country ?? '',
      city: data.city ?? '',
      description: data.description ?? '',
    });
    setRegistrationNumber(data.registrationNumber ?? '');
  }, [data, reset]);

  const save = useMutation({
    mutationFn: async (values: Record<string, string>) => (await api.patch('/companies/me', values)).data,
    onSuccess: () => {
      toast.success('Company profile saved');
      void queryClient.invalidateQueries({ queryKey: ['my-company'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save the company profile')),
  });

  const submitVerification = useMutation({
    mutationFn: async () => (await api.post('/companies/me/verification', { registrationNumber })).data,
    onSuccess: () => {
      toast.success('Verification submitted for review');
      void queryClient.invalidateQueries({ queryKey: ['my-company'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not submit verification')),
  });

  if (isLoading || !data) return <Loading />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Company profile</h1>
          <p className="muted mb-0">
            {data.stats.jobs} job(s) · {data.stats.savedCandidates} saved candidate(s) · {data.stats.conversations}{' '}
            conversation(s)
          </p>
        </div>
        <VerificationBadge status={data.verificationStatus} />
      </div>

      {data.verificationStatus === 'VERIFIED' && (
        <Alert tone="success">Verified on {formatDate(data.verifiedAt)}. Your recruiters can search and message candidates.</Alert>
      )}
      {data.verificationStatus === 'PENDING_REVIEW' && (
        <Alert tone="warning">Verification submitted. An administrator is reviewing your company.</Alert>
      )}
      {data.verificationStatus === 'REJECTED' && (
        <Alert tone="danger">
          <strong>Verification rejected.</strong> {data.rejectionReason ?? 'Contact support for details.'}
        </Alert>
      )}

      <Card title="Company details">
        <form onSubmit={handleSubmit((values) => save.mutate(values as Record<string, string>))}>
          <div className="grid cols-2">
            <Field label="Company name" required>
              <input {...register('name', { required: true })} />
            </Field>
            <Field label="Website">
              <input {...register('website')} />
            </Field>
            <Field label="Industry">
              <input {...register('industry')} />
            </Field>
            <Field label="Company size">
              <select {...register('size')}>
                <option value="">Select…</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-1000">201-1000</option>
                <option value="1000+">1000+</option>
              </select>
            </Field>
            <Field label="Country">
              <input {...register('country')} />
            </Field>
            <Field label="City">
              <input {...register('city')} />
            </Field>
          </div>
          <Field label="About the company">
            <textarea rows={4} {...register('description')} />
          </Field>
          <button type="submit" disabled={save.isPending}>
            Save company
          </button>
        </form>
      </Card>

      <Card title="Company verification">
        <p className="muted">
          Verification confirms the company is a real, registered employer. Candidates see the verification status
          before replying to any message.
        </p>
        <Field label="Registration number" hint="Chamber of commerce, trade register or tax number">
          <input value={registrationNumber} onChange={(event) => setRegistrationNumber(event.target.value)} />
        </Field>
        <button
          onClick={() => submitVerification.mutate()}
          disabled={
            registrationNumber.trim().length < 2 ||
            submitVerification.isPending ||
            data.verificationStatus === 'VERIFIED'
          }
        >
          {data.verificationStatus === 'VERIFIED' ? 'Already verified' : 'Submit for verification'}
        </button>
      </Card>
    </>
  );
}
