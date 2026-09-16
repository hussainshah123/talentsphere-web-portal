import { useQuery } from '@tanstack/react-query';
import { Card, Loading, Progress, Stat } from '../../components/ui';
import { api } from '../../lib/api';

interface AnalyticsResponse {
  funnel: Array<{ step: string; count: number; conversion: number; dropFromPrevious: number }>;
  recruiters: { active: number };
  messaging: { messages: number };
}

export default function AdminAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => (await api.get<AnalyticsResponse>('/admin/analytics')).data,
  });

  if (isLoading || !data) return <Loading />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p className="muted mb-0">Onboarding conversion and platform activity.</p>
        </div>
      </div>

      <Card title="Candidate onboarding funnel">
        {data.funnel.map((step) => (
          <div key={step.step} style={{ marginBottom: 14 }}>
            <div className="row between">
              <strong>{step.step}</strong>
              <span className="muted">
                {step.count} · {step.conversion}%
                {step.dropFromPrevious > 0 ? ` · −${step.dropFromPrevious} from previous step` : ''}
              </span>
            </div>
            <Progress value={step.conversion} />
          </div>
        ))}
      </Card>

      <div className="grid cols-2 mt-2">
        <Stat label="Active recruiters" value={data.recruiters.active} />
        <Stat label="Messages exchanged" value={data.messaging.messages} />
      </div>
    </>
  );
}
