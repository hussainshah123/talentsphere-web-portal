import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useToast } from '../../components/Toast';
import { Alert, Card, Loading } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import type { CandidatePrivacy } from '../../lib/types';

const VISIBILITY_OPTIONS: Array<{ value: NonNullable<CandidatePrivacy['visibility']>; label: string; hint: string }> = [
  {
    value: 'SEARCHABLE',
    label: 'Searchable — verified companies can discover me',
    hint: 'You appear in candidate search with your name and qualifications.',
  },
  {
    value: 'ANONYMOUS',
    label: 'Anonymous — show my qualifications, not who I am',
    hint: 'Companies see your experience, skills and scores under a reference, not your name. Applying to their job reveals it.',
  },
  {
    value: 'PRIVATE',
    label: 'Private — only companies I apply to',
    hint: 'You are removed from candidate search entirely. Nobody finds you; you go to them.',
  },
];
const TOGGLES: Array<{ key: keyof CandidatePrivacy; label: string; hint: string }> = [
  { key: 'allowRecruiterContact', label: 'Allow recruiters to message me', hint: 'Recruiters can never see your email or phone, only send platform messages.' },
  { key: 'allowCvDownload', label: 'Allow verified recruiters to download my CV', hint: 'Off by default. Downloads are always logged.' },
  { key: 'showEmail', label: 'Show my email address', hint: 'Off by default.' },
  { key: 'showPhone', label: 'Show my phone number', hint: 'Off by default.' },
  { key: 'showSalary', label: 'Show my expected salary range', hint: 'Helps filter out mismatched roles.' },
  { key: 'showCurrentEmployer', label: 'Show my current employer', hint: 'Turn off for a confidential job search.' },
  { key: 'showDateOfBirth', label: 'Show my date of birth', hint: 'Rarely needed — off by default.' },
  { key: 'showGender', label: 'Show my gender', hint: 'Optional and off by default.' },
];

export default function PrivacySettings() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [values, setValues] = useState<CandidatePrivacy | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['privacy'],
    queryFn: async () => (await api.get<CandidatePrivacy>('/candidates/me/privacy')).data,
  });

  const { data: blocks } = useQuery({
    queryKey: ['company-blocks'],
    queryFn: async () =>
      (await api.get<Array<{ id: string; reason: string | null; company: { id: string; name: string } }>>('/candidates/me/blocks')).data,
  });

  useEffect(() => {
    if (data) setValues(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async (patch: Partial<CandidatePrivacy>) => (await api.put('/candidates/me/privacy', patch)).data,
    onSuccess: () => {
      toast.success('Privacy settings updated');
      void queryClient.invalidateQueries({ queryKey: ['privacy'] });
      void queryClient.invalidateQueries({ queryKey: ['profile-preview'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save privacy settings')),
  });

  const unblock = useMutation({
    mutationFn: async (companyId: string) => (await api.delete(`/candidates/me/blocks/${companyId}`)).data,
    onSuccess: () => {
      toast.success('Company unblocked');
      void queryClient.invalidateQueries({ queryKey: ['company-blocks'] });
    },
  });

  const exportData = async () => {
    const response = await api.get('/candidates/me/export');
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'talentgate-data-export.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !values) return <Loading />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Privacy settings</h1>
          <p className="muted mb-0">You decide what companies see and whether they can reach you at all.</p>
        </div>
      </div>

      <Card title="Who can find you" icon="eye">
        <p className="muted" style={{ fontSize: 13 }}>
          This is the setting that decides discoverability. The toggles below control what a
          company sees once it can see you at all.
        </p>
        {VISIBILITY_OPTIONS.map((option) => (
          <label key={option.value} className="checkbox">
            <input
              type="radio"
              name="visibility"
              checked={(values.visibility ?? 'SEARCHABLE') === option.value}
              onChange={() => {
                setValues({ ...values, visibility: option.value });
                save.mutate({ visibility: option.value });
              }}
            />
            <span>
              {option.label}
              <div className="muted" style={{ fontSize: 12.5 }}>
                {option.hint}
              </div>
            </span>
          </label>
        ))}
      </Card>
      <Card title="Visibility & contact">
        {TOGGLES.map((toggle) => (
          <label key={toggle.key} className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(values[toggle.key])}
              onChange={(event) => {
                const next = { ...values, [toggle.key]: event.target.checked };
                setValues(next);
                save.mutate({ [toggle.key]: event.target.checked });
              }}
            />
            <span>
              {toggle.label}
              <div className="muted" style={{ fontSize: 12.5 }}>
                {toggle.hint}
              </div>
            </span>
          </label>
        ))}
      </Card>

      <Card title="Blocked companies">
        {!blocks || blocks.length === 0 ? (
          <p className="muted mb-0">You have not blocked any company. You can block one from any conversation.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <tbody>
                {blocks.map((block) => (
                  <tr key={block.id}>
                    <td>
                      <strong>{block.company.name}</strong>
                      {block.reason && <div className="muted">{block.reason}</div>}
                    </td>
                    <td className="text-right">
                      <button className="ghost btn-sm" onClick={() => unblock.mutate(block.company.id)}>
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Your data">
        <Alert tone="info">
          Downloads of your CV by recruiters, profile views and verification decisions are all recorded in the audit
          log.
        </Alert>
        <button className="secondary" onClick={exportData}>
          Export my data (JSON)
        </button>
      </Card>
    </>
  );
}
