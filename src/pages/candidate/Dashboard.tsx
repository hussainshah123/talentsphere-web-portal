import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AppIcon } from '../../components/AppIcon';
import { Alert, Card, Loading, Progress, ScoreRing, Stat, VerificationBadge } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import type { VerificationStatus } from '../../lib/types';

interface DashboardResponse {
  profile: {
    id: string;
    fullName: string;
    headline: string | null;
    profileStatus: string;
    verificationStatus: VerificationStatus;
    verifiedAt: string | null;
    completeness: number;
  };
  completeness: {
    score: number;
    missing: string[];
    sections: Array<{ key: string; label: string; complete: boolean; hint: string; weight: number }>;
  };
  verification: {
    status: VerificationStatus;
    score: number;
    blocking: Array<{ key: string; label: string; action: string | null }>;
    canSubmit: boolean;
  };
  cv: { id: string; atsScore: number | null; parserStatus: string; analyzedAt: string | null } | null;
  stats: { conversations: number; unreadMessages: number; savedByCompanies: number };
}

export default function CandidateDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['candidate-dashboard'],
    queryFn: async () => (await api.get<DashboardResponse>('/candidates/me/dashboard')).data,
  });

  if (isLoading || !data) return <Loading />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Welcome back, {data.profile.fullName.split(' ')[0]}</h1>
          <p className="muted mb-0">
            {data.profile.headline ?? 'Add a headline so recruiters know what you do.'}
          </p>
        </div>
        <div className="row">
          <VerificationBadge status={data.profile.verificationStatus} />
          <Link to="/preview" className="btn btn-secondary btn-sm">
            Preview as recruiter
          </Link>
        </div>
      </div>

      {data.profile.verificationStatus !== 'VERIFIED' && (
        <Alert tone={data.verification.canSubmit ? 'success' : 'info'}>
          {data.verification.canSubmit ? (
            <>
              All required checks pass. <Link to="/verification">Submit for verification</Link> to get your badge and
              go live.
            </>
          ) : (
            <>
              {data.verification.blocking.length} verification check
              {data.verification.blocking.length === 1 ? '' : 's'} still need your attention.{' '}
              <Link to="/verification">Open the verification center</Link>.
            </>
          )}
        </Alert>
      )}

      <div className="grid cols-4 stagger">
        <Stat label="Profile completeness" value={data.completeness.score} suffix="%" icon="profile" />
        <Stat label="Verification score" value={data.verification.score} suffix="%" icon="verification" />
        <Stat
          label="ATS score"
          value={data.cv?.atsScore ?? '—'}
          icon="ats"
          hint={data.cv ? `Analysed ${formatDate(data.cv.analyzedAt)}` : 'Upload a CV to get a score'}
        />
        <Stat
          label="Unread messages"
          value={data.stats.unreadMessages}
          icon="messages"
          hint={`${data.stats.conversations} conversation(s)`}
        />
      </div>

      <div className="grid cols-2 mt-2">
        <Card
          icon="profile"
          title="Complete your profile"
          action={
            <Link to="/profile" className="btn btn-secondary btn-sm">
              Edit profile
            </Link>
          }
        >
          <Progress value={data.completeness.score} />
          <ul className="checklist">
            {data.completeness.sections.map((section) => (
              <li key={section.key} className={section.complete ? 'done' : 'todo'}>
                <AppIcon name={section.complete ? 'check' : 'clock'} size={14} strokeWidth={2.2} />
                <span>
                  {section.label}
                  {!section.complete && <span className="todo-hint"> — {section.hint}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          icon="ats"
          title="CV & ATS report"
          action={
            <Link to="/cv" className="btn btn-secondary btn-sm">
              Open report
            </Link>
          }
        >
          {data.cv ? (
            <div className="row" style={{ alignItems: 'flex-start', gap: 20 }}>
              <ScoreRing score={data.cv.atsScore ?? 0} />
              <div>
                <p>
                  Parser status: <strong>{data.cv.parserStatus}</strong>
                </p>
                <p className="muted mb-0">
                  The ATS score is advisory. Open the report for the exact formatting, keyword and structure fixes.
                </p>
              </div>
            </div>
          ) : (
            <p className="muted mb-0">
              No CV uploaded yet. <Link to="/cv">Upload a PDF, DOC or DOCX</Link> to get your ATS report and unlock
              verification.
            </p>
          )}
        </Card>
      </div>

      <div className="grid cols-2 mt-2">
        <Card title="Verification checklist" icon="verification">
          {data.verification.blocking.length === 0 ? (
            <p className="muted mb-0">No blocking checks. You are ready for verification.</p>
          ) : (
            <ul className="checklist">
              {data.verification.blocking.map((item) => (
                <li key={item.key} className="todo">
                  <AppIcon name="warning" size={14} strokeWidth={2.2} />
                  <span>
                    <strong>{item.label}</strong>
                    {item.action && <span className="todo-hint"> — {item.action}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Recruiter interest" icon="users">
          <p>
            <strong>{data.stats.savedByCompanies}</strong> company/companies saved your profile.
          </p>
          <p className="muted mb-0">
            Contact details stay private. Recruiters can only reach you through in-platform messages, and you can
            block or report any company.
          </p>
        </Card>
      </div>
    </>
  );
}
