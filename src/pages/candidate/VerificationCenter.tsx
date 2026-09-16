import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { Alert, Card, Loading, Progress, VerificationBadge } from '../../components/ui';
import { api, blockingItems, errorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import type { VerificationSnapshot } from '../../lib/types';

export default function VerificationCenter() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['verification'],
    queryFn: async () => (await api.get<VerificationSnapshot>('/candidates/me/verification')).data,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['verification'] });
    void queryClient.invalidateQueries({ queryKey: ['candidate-dashboard'] });
  };

  const confirmAccuracy = useMutation({
    mutationFn: async () => (await api.post('/candidates/me/verification/confirm-accuracy')).data,
    onSuccess: () => {
      toast.success('Accuracy declaration recorded');
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not record your declaration')),
  });

  const submit = useMutation({
    mutationFn: async () => (await api.post('/candidates/me/verification/submit')).data,
    onSuccess: (result: VerificationSnapshot) => {
      toast.success(
        result.status === 'VERIFIED'
          ? 'You are verified — your profile is now live'
          : 'Submitted. A reviewer will look at your profile shortly.',
      );
      invalidate();
    },
    onError: (error) => {
      const blocking = blockingItems(error);
      toast.error(
        blocking.length > 0
          ? `Still blocked by: ${blocking.map((item) => item.label).join(', ')}`
          : errorMessage(error, 'Could not submit for verification'),
      );
      invalidate();
    },
  });

  if (isLoading || !data) return <Loading />;

  const accuracyItem = data.checklist.find((item) => item.key === 'accuracy_confirmed');

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Verification center</h1>
          <p className="muted mb-0">
            The verified badge is rule-based: every check below is visible, revocable and recorded in your history.
          </p>
        </div>
        <VerificationBadge status={data.status} />
      </div>

      {data.status === 'VERIFIED' && (
        <Alert tone="success">
          Your profile is verified and live. If a required check stops passing — for example an unresolved report —
          the badge returns to review automatically.
        </Alert>
      )}
      {data.status === 'PENDING_REVIEW' && (
        <Alert tone="warning">
          {data.submittedAt ? `Submitted ${formatDate(data.submittedAt, true)}. ` : ''}A verification officer is
          reviewing your profile.
        </Alert>
      )}
      {data.status === 'REJECTED' && (
        <Alert tone="danger">
          <strong>Verification rejected.</strong> {data.decisionReason ?? 'See the checklist below.'} Fix the items and
          submit again.
        </Alert>
      )}

      <Card
        title={`Verification score — ${data.score}%`}
        action={
          <div className="row">
            {accuracyItem && !accuracyItem.passed && (
              <button className="secondary btn-sm" onClick={() => confirmAccuracy.mutate()}>
                Confirm my information is accurate
              </button>
            )}
            <button
              className="btn-sm"
              disabled={!data.canSubmit || submit.isPending || data.status === 'VERIFIED'}
              onClick={() => submit.mutate()}
            >
              {data.status === 'VERIFIED' ? 'Verified' : submit.isPending ? 'Submitting…' : 'Submit for verification'}
            </button>
          </div>
        }
      >
        <Progress value={data.score} />
        <p className="muted mt-1 mb-0">
          Profile completeness {data.completeness}% · {data.blockingItems.length} blocking check
          {data.blockingItems.length === 1 ? '' : 's'}
        </p>
      </Card>

      <Card title="Checklist">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Check</th>
                <th>Status</th>
                <th>Why</th>
                <th>What to do</th>
              </tr>
            </thead>
            <tbody>
              {data.checklist.map((item) => (
                <tr key={item.key}>
                  <td>
                    <strong>{item.label}</strong>
                    <div className="muted" style={{ fontSize: 12.5 }}>
                      {item.description}
                      {!item.required && ' · optional'}
                      {!item.autoCheck && ' · manual review'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${item.passed ? 'success' : item.required ? 'danger' : 'warning'}`}>
                      {item.passed ? 'Passed' : item.required ? 'Blocking' : 'Optional'}
                    </span>
                  </td>
                  <td className="muted">{item.reason}</td>
                  <td>
                    {item.passed ? (
                      '—'
                    ) : item.key === 'profile_complete' ? (
                      <Link to="/profile">{item.action}</Link>
                    ) : item.key.startsWith('cv') ? (
                      <Link to="/cv">{item.action}</Link>
                    ) : item.key === 'email_verified' ? (
                      <Link to="/verify-email">{item.action}</Link>
                    ) : item.key === 'accuracy_confirmed' ? (
                      <button className="ghost btn-sm" onClick={() => confirmAccuracy.mutate()}>
                        {item.action}
                      </button>
                    ) : (
                      item.action ?? '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="What the badge means">
        <p className="muted mb-0">
          A verified badge confirms that the platform checks above were completed. It is not a guarantee of skill,
          honesty, employment history or hiring suitability, and it can be suspended if a report, expired document or
          policy violation appears.
        </p>
      </Card>
    </>
  );
}
