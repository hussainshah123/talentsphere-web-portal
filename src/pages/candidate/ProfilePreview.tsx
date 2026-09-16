import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Loading, VerificationBadge } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDate, formatMonth, formatSalary } from '../../lib/format';
import type { PublicCandidate } from '../../lib/types';

export default function ProfilePreview() {
  const { data, isLoading } = useQuery({
    queryKey: ['profile-preview'],
    queryFn: async () => (await api.get<PublicCandidate>('/candidates/me/preview')).data,
  });

  if (isLoading || !data) return <Loading />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Profile preview</h1>
          <p className="muted mb-0">This is exactly what a recruiter sees, with your privacy settings applied.</p>
        </div>
        <VerificationBadge status={data.verificationStatus} />
      </div>

      <Alert tone="info">
        Hidden fields show as “—”. Change what is shared in <a href="/privacy">privacy settings</a>.
      </Alert>

      <Card>
        <h2>{data.fullName}</h2>
        <p className="muted">
          {data.headline ?? 'No headline'} · {[data.city, data.country].filter(Boolean).join(', ') || 'Location not set'}
        </p>
        <div className="chip-row">
          <span className="chip">{data.experienceYears} years experience</span>
          <span className="chip">{data.workMode}</span>
          {data.openToRelocation && <span className="chip">Open to relocation</span>}
          <span className="chip">Salary: {formatSalary(data.salary)}</span>
          <span className="chip">
            Available: {data.availabilityDate ? formatDate(data.availabilityDate) : 'Immediately'}
          </span>
        </div>
        {data.bio && <p className="mt-2">{data.bio}</p>}
      </Card>

      <div className="grid cols-2 mt-2">
        <Card title="Contact visibility">
          <table>
            <tbody>
              <tr>
                <td className="muted">Email</td>
                <td>{data.contact.email ?? '— (hidden)'}</td>
              </tr>
              <tr>
                <td className="muted">Phone</td>
                <td>{data.contact.phone ?? '— (hidden)'}</td>
              </tr>
              <tr>
                <td className="muted">Recruiter contact</td>
                <td>{data.allowRecruiterContact ? 'Allowed through the platform' : 'Disabled'}</td>
              </tr>
              <tr>
                <td className="muted">CV download</td>
                <td>{data.allowCvDownload ? 'Verified recruiters may download' : 'Not allowed'}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        <Card title="Skills">
          <div className="chip-row">
            {data.skills.length === 0 && <span className="muted">No skills listed.</span>}
            {data.skills.map((skill) => (
              <span key={skill.id} className="chip">
                {skill.name} · {skill.proficiency.toLowerCase()}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Experience">
        {data.workExperiences.length === 0 && <p className="muted mb-0">No experience listed.</p>}
        {data.workExperiences.map((entry) => (
          <div key={entry.id} style={{ marginBottom: 12 }}>
            <strong>{entry.title}</strong> · {entry.company}
            <div className="muted" style={{ fontSize: 13 }}>
              {formatMonth(entry.startDate)} – {entry.isCurrent ? 'Present' : formatMonth(entry.endDate)}
            </div>
            {entry.description && <p className="muted mb-0">{entry.description}</p>}
          </div>
        ))}
      </Card>

      <Card title="Education">
        {data.educations.length === 0 && <p className="muted mb-0">No education listed.</p>}
        {data.educations.map((entry) => (
          <div key={entry.id} style={{ marginBottom: 10 }}>
            <strong>{entry.degree}</strong> · {entry.institute}
            <div className="muted" style={{ fontSize: 13 }}>
              {formatMonth(entry.startDate)} – {formatMonth(entry.endDate)}
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
