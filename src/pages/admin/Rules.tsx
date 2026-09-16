import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../components/Toast';
import { Alert, Card, Loading } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';

interface Rule {
  key: string;
  label: string;
  description: string | null;
  required: boolean;
  weight: number;
  autoCheck: boolean;
  enabled: boolean;
}

export default function AdminRules() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['verification-rules'],
    queryFn: async () => (await api.get<Rule[]>('/admin/verification-rules')).data,
  });

  const update = useMutation({
    mutationFn: async ({ key, patch }: { key: string; patch: Partial<Rule> }) =>
      (await api.patch(`/admin/verification-rules/${key}`, patch)).data,
    onSuccess: () => {
      toast.success('Rule updated');
      void queryClient.invalidateQueries({ queryKey: ['verification-rules'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update the rule')),
  });

  if (isLoading || !data) return <Loading />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Verification rules</h1>
          <p className="muted mb-0">
            Configure which checks are required, how they are weighted and which need a human reviewer.
          </p>
        </div>
      </div>

      <Alert tone="info">
        Changes apply the next time a candidate's checklist is evaluated. Disabling a required rule removes it from
        every candidate's blocking list.
      </Alert>

      <Card>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rule</th>
                <th>Enabled</th>
                <th>Required</th>
                <th>Automatic</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              {data.map((rule) => (
                <tr key={rule.key}>
                  <td>
                    <strong>{rule.label}</strong>
                    <div className="muted" style={{ fontSize: 12.5 }}>
                      {rule.description}
                    </div>
                    <code style={{ fontSize: 11.5 }} className="muted">
                      {rule.key}
                    </code>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(event) => update.mutate({ key: rule.key, patch: { enabled: event.target.checked } })}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={rule.required}
                      onChange={(event) => update.mutate({ key: rule.key, patch: { required: event.target.checked } })}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={rule.autoCheck}
                      onChange={(event) => update.mutate({ key: rule.key, patch: { autoCheck: event.target.checked } })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      style={{ maxWidth: 90 }}
                      defaultValue={rule.weight}
                      onBlur={(event) =>
                        Number(event.target.value) !== rule.weight &&
                        update.mutate({ key: rule.key, patch: { weight: Number(event.target.value) } })
                      }
                    />
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
