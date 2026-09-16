import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, Loading, Stat } from '../../components/ui';
import { api } from '../../lib/api';
import type { AdminDashboard } from '../../lib/types';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get<AdminDashboard>('/admin/dashboard')).data,
  });

  if (isLoading || !data) return <Loading />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Platform overview</h1>
          <p className="muted mb-0">Verification, moderation and CV processing at a glance.</p>
        </div>
      </div>

      <div className="grid cols-4 stagger">
        <Stat
          label="Candidates"
          value={data.candidates.total}
          icon="users"
          hint={`${data.candidates.newLast30Days} new in 30 days`}
        />
        <Stat
          label="Verified candidates"
          value={data.candidates.verified}
          icon="verification"
          hint={`${data.candidates.verificationRate}% of all profiles`}
        />
        <Stat label="Live profiles" value={data.candidates.live} icon="eye" />
        <Stat label="Conversations" value={data.messaging.conversations} icon="messages" />
      </div>

      <div className="grid cols-3 mt-2">
        <Card title="Verification queue" icon="verification" interactive>
          <p className="value" style={{ fontSize: 28, fontWeight: 680 }}>
            {data.verification.pendingReview}
          </p>
          <p className="muted">cases waiting for manual review</p>
          <Link to="/admin/verification" className="btn btn-secondary btn-sm">
            Open queue
          </Link>
        </Card>

        <Card title="Companies" icon="building" interactive>
          <p style={{ fontSize: 28, fontWeight: 680, margin: 0 }}>{data.companies.pendingVerification}</p>
          <p className="muted">awaiting company verification ({data.companies.total} total)</p>
          <Link to="/admin/companies" className="btn btn-secondary btn-sm">
            Review companies
          </Link>
        </Card>

        <Card title="Moderation" icon="flag" interactive>
          <p style={{ fontSize: 28, fontWeight: 680, margin: 0 }}>{data.moderation.openReports}</p>
          <p className="muted">open reports</p>
          <Link to="/admin/reports" className="btn btn-secondary btn-sm">
            Open reports
          </Link>
        </Card>
      </div>

      <Card title="CV & ATS processing" icon="ats" className="mt-2">
        <div className="grid cols-3">
          <Stat label="CVs analysed" value={data.ats.cvsAnalysed} icon="cv" />
          <Stat label="Average ATS score" value={data.ats.averageScore} icon="chart" />
          <Stat label="Parser failures" value={data.ats.parserFailures} icon="warning" hint="Re-run from CV monitoring" />
        </div>
      </Card>
    </>
  );
}
