import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '../../components/Toast';
import { Badge, Card } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import type { CandidateLanguage, Certification, LanguageProficiency } from '../../lib/types';

const PROFICIENCIES: LanguageProficiency[] = [
  'BASIC',
  'CONVERSATIONAL',
  'PROFESSIONAL',
  'FLUENT',
  'NATIVE',
];

const label = (value: string) => value.replace(/_/g, ' ').toLowerCase();

export function CertificationsSection() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<{
    name: string;
    issuer: string;
    credentialId: string;
    credentialUrl: string;
    issuedAt: string;
    expiresAt: string;
  }>();

  const key = ['certifications'];
  const { data } = useQuery({
    queryKey: key,
    queryFn: async () => (await api.get<Certification[]>('/candidates/me/certifications')).data,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  const add = useMutation({
    mutationFn: async (values: Record<string, unknown>) =>
      (await api.post('/candidates/me/certifications', values)).data,
    onSuccess: () => {
      reset();
      setOpen(false);
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not add that certification')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/candidates/me/certifications/${id}`)).data,
    onSuccess: invalidate,
  });

  const items = data ?? [];
  const expired = (entry: Certification) =>
    entry.expiresAt !== null && new Date(entry.expiresAt) < new Date();

  return (
    <Card
      title="Certifications"
      icon="verification"
      action={
        <button type="button" className="secondary btn-sm" onClick={() => setOpen((value) => !value)}>
          {open ? 'Cancel' : 'Add certification'}
        </button>
      }
    >
      {open && (
        <form
          className="grid cols-2"
          onSubmit={handleSubmit((values) =>
            add.mutate({
              ...values,
              issuer: values.issuer || undefined,
              credentialId: values.credentialId || undefined,
              credentialUrl: values.credentialUrl || undefined,
              issuedAt: values.issuedAt || undefined,
              expiresAt: values.expiresAt || undefined,
            }),
          )}
        >
          <label>
            Name
            <input {...register('name', { required: true })} placeholder="ACCA Member" />
          </label>
          <label>
            Issuer
            <input {...register('issuer')} placeholder="Association of Chartered Certified Accountants" />
          </label>
          <label>
            Credential ID
            <input {...register('credentialId')} />
          </label>
          <label>
            Credential URL
            <input {...register('credentialUrl')} placeholder="https://" />
          </label>
          <label>
            Issued
            <input type="date" {...register('issuedAt')} />
          </label>
          <label>
            Expires
            <input type="date" {...register('expiresAt')} />
            <span className="hint">Leave empty if it does not expire.</span>
          </label>
          <div style={{ gridColumn: 'span 2' }}>
            <button type="submit" disabled={add.isPending}>
              {add.isPending ? 'Saving…' : 'Save certification'}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 && !open && (
        <p className="muted mb-0">
          No certifications yet. Uploading a CV fills these in automatically where it can.
        </p>
      )}

      {items.map((entry) => (
        <div key={entry.id} className="row between wrap list-row">
          <div>
            <strong>{entry.name}</strong>
            {expired(entry) && <Badge tone="warning">expired</Badge>}
            <div className="muted" style={{ fontSize: 13 }}>
              {entry.issuer ?? 'Issuer not given'}
              {entry.issuedAt ? ` · issued ${formatDate(entry.issuedAt)}` : ''}
              {entry.expiresAt ? ` · expires ${formatDate(entry.expiresAt)}` : ''}
            </div>
            {entry.credentialUrl && (
              <a href={entry.credentialUrl} target="_blank" rel="noreferrer noopener" style={{ fontSize: 13 }}>
                Verify credential
              </a>
            )}
          </div>
          <button className="ghost btn-sm" onClick={() => remove.mutate(entry.id)}>
            Remove
          </button>
        </div>
      ))}
    </Card>
  );
}

export function LanguagesSection() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [proficiency, setProficiency] = useState<LanguageProficiency>('PROFESSIONAL');

  const key = ['languages'];
  const { data } = useQuery({
    queryKey: key,
    queryFn: async () => (await api.get<CandidateLanguage[]>('/candidates/me/languages')).data,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  const add = useMutation({
    mutationFn: async () =>
      (await api.post('/candidates/me/languages', { name: name.trim(), proficiency })).data,
    onSuccess: () => {
      setName('');
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not add that language')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/candidates/me/languages/${id}`)).data,
    onSuccess: invalidate,
  });

  const items = data ?? [];

  return (
    <Card title="Languages" icon="profile">
      <div className="row wrap" style={{ gap: 8, alignItems: 'flex-end' }}>
        <label style={{ flex: '1 1 200px' }}>
          Language
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && name.trim() && add.mutate()}
            placeholder="Urdu"
          />
        </label>
        <label style={{ flex: '0 1 200px' }}>
          Level
          <select
            value={proficiency}
            onChange={(event) => setProficiency(event.target.value as LanguageProficiency)}
          >
            {PROFICIENCIES.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </select>
        </label>
        <button disabled={!name.trim() || add.isPending} onClick={() => add.mutate()}>
          Add
        </button>
      </div>
      <span className="hint">Adding a language you already listed updates its level.</span>

      {items.length === 0 ? (
        <p className="muted mb-0 mt-1">No languages yet.</p>
      ) : (
        <div className="chip-row mt-2">
          {items.map((entry) => (
            <span key={entry.id} className="chip">
              {entry.name} · {label(entry.proficiency)}
              <button onClick={() => remove.mutate(entry.id)} aria-label={`Remove ${entry.name}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
