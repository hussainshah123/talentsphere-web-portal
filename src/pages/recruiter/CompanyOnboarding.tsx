import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { Alert, Card, Field, Loading } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export default function CompanyOnboarding() {
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [registrationNumber, setRegistrationNumber] = useState('');

  const { data: company, isLoading, refetch } = useQuery({
    queryKey: ['my-company'],
    queryFn: async () => {
      try {
        return (await api.get('/companies/me')).data;
      } catch {
        return null;
      }
    },
  });

  const { register, handleSubmit } = useForm({
    defaultValues: { name: '', website: '', industry: '', size: '', country: '', city: '', description: '' },
  });

  const create = useMutation({
    mutationFn: async (values: Record<string, string>) =>
      (await api.post('/companies', {
        name: values.name,
        website: values.website || undefined,
        industry: values.industry || undefined,
        size: values.size || undefined,
        country: values.country || undefined,
        city: values.city || undefined,
        description: values.description || undefined,
      })).data,
    onSuccess: async () => {
      toast.success('Company profile created');
      await refreshUser();
      await refetch();
      setStep(1);
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not create the company')),
  });

  const submitVerification = useMutation({
    mutationFn: async () => (await api.post('/companies/me/verification', { registrationNumber })).data,
    onSuccess: async () => {
      toast.success('Verification submitted for review');
      await refreshUser();
      navigate('/recruiter');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not submit verification')),
  });

  if (isLoading) return <Loading />;

  const hasCompany = Boolean(company) || step > 0;

  return (
    <div className="page" style={{ margin: '0 auto' }}>
      <h1>Set up your company</h1>
      <p className="muted">
        Companies must be verified before they can search candidates or send messages. This protects candidates from
        fake recruiters.
      </p>

      <div className="stepper">
        <span className={`step ${!hasCompany ? 'active' : 'done'}`}>1. Company profile</span>
        <span className={`step ${hasCompany ? 'active' : ''}`}>2. Company verification</span>
      </div>

      {!hasCompany ? (
        <Card title="Company profile">
          <form onSubmit={handleSubmit((values) => create.mutate(values as Record<string, string>))}>
            <div className="grid cols-2">
              <Field label="Company name" required>
                <input {...register('name', { required: true })} />
              </Field>
              <Field label="Website">
                <input placeholder="https://" {...register('website')} />
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
            <button type="submit" disabled={create.isPending}>
              Create company
            </button>
          </form>
        </Card>
      ) : (
        <Card title="Company verification">
          <Alert tone="info">
            An administrator reviews the registration details before your company can contact candidates.
          </Alert>
          <Field label="Company registration number" required hint="Chamber of commerce, trade register or tax number.">
            <input value={registrationNumber} onChange={(event) => setRegistrationNumber(event.target.value)} />
          </Field>
          <div className="row">
            <button
              onClick={() => submitVerification.mutate()}
              disabled={registrationNumber.trim().length < 2 || submitVerification.isPending}
            >
              Submit for verification
            </button>
            <button className="secondary" onClick={() => navigate('/recruiter')}>
              Do this later
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
