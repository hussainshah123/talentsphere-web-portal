import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AppIcon } from '../../components/AppIcon';
import { Alert, Card, Empty, Loading, Stat, VerificationBadge } from '../../components/ui';
import { api } from '../../lib/api';
import type { VerificationStatus } from '../../lib/types';

interface RecruiterDashboardResponse {
  company: { id: string; name: string; verificationStatus: VerificationStatus; myRole: string };
  stats: {
    jobs: number;
    publishedJobs: number;
    saved: number;
    conversations: number;
    pendingConversations: number;
  };
  topMatches: Array<{
    id: string;
    score: number;
    candidate: { id: string; fullName: string; headline: string | null };
    job: { id: string; title: string };
  }>;
}

export default function RecruiterDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['recruiter-dashboard'],
    queryFn: async () => (await api.get<RecruiterDashboardResponse>('/companies/me/dashboard')).data,
    retry: false,
  });

  if (isLoading) return <Loading />;

  if (error || !data) {
    return (
      <Card>
        <Empty
          title="No company yet"
          hint="Create your company profile to start hiring."
          action={
            <Link to="/recruiter/onboarding" className="btn">
              Set up company
            </Link>
          }
        />
      </Card>
    );
  }

  const verified = data.company.verificationStatus === 'VERIFIED';

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{data.company.name}</h1>
          <p className="muted mb-0">Signed in as {data.company.myRole.toLowerCase()}</p>
        </div>
        <VerificationBadge status={data.company.verificationStatus} />
      </div>

      {!verified && (
        <Alert tone="warning">
          Your company is not verified yet, so candidate search and messaging are disabled.{' '}
          <Link to="/recruiter/company">Complete company verification</Link>.
        </Alert>
      )}

      <div className="grid cols-4 stagger">
        <Stat label="Jobs" value={data.stats.jobs} icon="jobs" hint={`${data.stats.publishedJobs} published`} />
        <Stat label="Saved candidates" value={data.stats.saved} icon="bookmark" />
        <Stat label="Conversations" value={data.stats.conversations} icon="messages" />
        <Stat label="Awaiting reply" value={data.stats.pendingConversations} icon="clock" />
      </div>

      <div className="grid cols-2 mt-2">
        <Card
          icon="talent"
          title="Top job matches"
          action={
            <Link to="/recruiter/jobs" className="btn btn-secondary btn-sm">
              Manage jobs
            </Link>
          }
        >
          {data.topMatches.length === 0 ? (
            <Empty title="No matches yet" hint="Publish a job and run matching to rank candidates." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Job</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topMatches.map((match) => (
                    <tr key={match.id}>
                      <td>
                        <Link to={`/recruiter/candidates/${match.candidate.id}`}>{match.candidate.fullName}</Link>
                        <div className="muted" style={{ fontSize: 13 }}>
                          {match.candidate.headline}
                        </div>
                      </td>
                      <td>{match.job.title}</td>
                      <td>
                        <span className="badge success">{match.score}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Working responsibly" icon="shield">
          <ul className="checklist">
            {[
              'Match and ATS scores are advisory — never reject on a score alone.',
              'Phone numbers and emails stay private unless the candidate opts in.',
              'Every profile view, CV download and message is written to the audit log.',
              'Candidates can block your company or report a conversation at any time.',
            ].map((line) => (
              <li key={line} className="done">
                <AppIcon name="check" size={14} strokeWidth={2.2} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
