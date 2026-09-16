import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { Alert, Card, Loading, Modal, VerificationBadge } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatDate, formatMonth, formatSalary } from '../../lib/format';
import type { Job, Paginated, PublicCandidate } from '../../lib/types';

export default function CandidateDetail() {
  const { id = '' } = useParams();
  const toast = useToast();
  const [contactOpen, setContactOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [jobId, setJobId] = useState('');
  const [poolName, setPoolName] = useState('General');
  const [notes, setNotes] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => (await api.get<PublicCandidate>(`/candidates/${id}`)).data,
    retry: false,
  });

  const { data: jobs } = useQuery({
    queryKey: ['my-jobs-min'],
    queryFn: async () => (await api.get<Paginated<Job>>('/jobs/mine?pageSize=50')).data,
  });

  const save = useMutation({
    mutationFn: async () =>
      (await api.post('/companies/me/saved-candidates', { candidateId: id, poolName, notes })).data,
    onSuccess: () => toast.success('Candidate saved to your talent pool'),
    onError: (caught) => toast.error(errorMessage(caught, 'Could not save the candidate')),
  });

  const contact = useMutation({
    mutationFn: async () =>
      (await api.post('/conversations', { candidateId: id, message, jobId: jobId || undefined })).data,
    onSuccess: () => {
      setContactOpen(false);
      setMessage('');
      toast.success('Message sent. The candidate decides whether to reply.');
    },
    onError: (caught) => toast.error(errorMessage(caught, 'Could not start the conversation')),
  });

  const report = useMutation({
    mutationFn: async () =>
      (await api.post('/reports', { targetType: 'CANDIDATE', targetId: id, reason: reportReason })).data,
    onSuccess: () => {
      setReportOpen(false);
      setReportReason('');
      toast.success('Report submitted');
    },
    onError: (caught) => toast.error(errorMessage(caught, 'Could not submit the report')),
  });

  const downloadCv = async () => {
    if (!data?.cv) return;
    try {
      const { data: signed } = await api.get<{ url: string }>(`/files/${data.cv.fileId}/signed-url`);
      window.open(signed.url.startsWith('http') ? signed.url : `/api${signed.url}`, '_blank');
    } catch (caught) {
      toast.error(errorMessage(caught, 'This candidate has not allowed CV downloads'));
    }
  };

  if (isLoading) return <Loading />;
  if (error || !data) return <Alert tone="danger">{errorMessage(error, 'Candidate not found or not visible to you')}</Alert>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{data.fullName}</h1>
          <p className="muted mb-0">
            {data.headline ?? data.currentTitle ?? '—'} · {[data.city, data.country].filter(Boolean).join(', ') || 'Location hidden'}
          </p>
        </div>
        <div className="row">
          <VerificationBadge status={data.verificationStatus} />
          <button className="secondary btn-sm" onClick={() => setReportOpen(true)}>
            Report
          </button>
          <button
            className="btn-sm"
            disabled={!data.allowRecruiterContact}
            onClick={() => setContactOpen(true)}
            title={data.allowRecruiterContact ? undefined : 'This candidate has disabled recruiter contact'}
          >
            Contact candidate
          </button>
        </div>
      </div>

      <div className="grid cols-3">
        <div style={{ gridColumn: 'span 2' }}>
          <Card title="Overview">
            {data.bio && <p>{data.bio}</p>}
            <div className="chip-row">
              <span className="chip">{data.experienceYears} years experience</span>
              <span className="chip">{data.workMode}</span>
              {data.openToRelocation && <span className="chip">Open to relocation</span>}
              <span className="chip">
                Available {data.availabilityDate ? formatDate(data.availabilityDate) : 'immediately'}
              </span>
              {data.noticePeriodDays !== null && <span className="chip">{data.noticePeriodDays} days notice</span>}
              <span className="chip">Salary: {formatSalary(data.salary)}</span>
            </div>
          </Card>

          <Card title="Skills">
            <div className="chip-row">
              {data.skills.length === 0 && <span className="muted">No skills listed.</span>}
              {data.skills.map((skill) => (
                <span key={skill.id} className="chip">
                  {skill.name} · {skill.proficiency.toLowerCase()} · {skill.yearsExperience}y
                </span>
              ))}
            </div>
          </Card>

          <Card title="Experience">
            {data.workExperiences.length === 0 && <p className="muted mb-0">No experience listed.</p>}
            {data.workExperiences.map((entry) => (
              <div key={entry.id} style={{ marginBottom: 14 }}>
                <strong>{entry.title}</strong> · {entry.company}
                <div className="muted" style={{ fontSize: 13 }}>
                  {formatMonth(entry.startDate)} – {entry.isCurrent ? 'Present' : formatMonth(entry.endDate)}
                  {entry.location ? ` · ${entry.location}` : ''}
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
                  {entry.field ? ` · ${entry.field}` : ''}
                </div>
              </div>
            ))}
          </Card>
        </div>

        <div>
          <Card title="Contact & privacy">
            <table>
              <tbody>
                <tr>
                  <td className="muted">Email</td>
                  <td>{data.contact.email ?? 'Private'}</td>
                </tr>
                <tr>
                  <td className="muted">Phone</td>
                  <td>{data.contact.phone ?? 'Private'}</td>
                </tr>
                <tr>
                  <td className="muted">Messaging</td>
                  <td>{data.allowRecruiterContact ? 'Open' : 'Disabled by candidate'}</td>
                </tr>
                <tr>
                  <td className="muted">CV download</td>
                  <td>{data.allowCvDownload ? 'Allowed' : 'Not allowed'}</td>
                </tr>
              </tbody>
            </table>
            {data.cv && data.allowCvDownload && (
              <button className="secondary btn-sm mt-1" onClick={downloadCv}>
                Download CV{data.cv.atsScore !== null ? ` (ATS ${data.cv.atsScore})` : ''}
              </button>
            )}
          </Card>

          <Card title="Links">
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {data.linkedinUrl && (
                <li>
                  <a href={data.linkedinUrl} target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                </li>
              )}
              {data.githubUrl && (
                <li>
                  <a href={data.githubUrl} target="_blank" rel="noreferrer">
                    GitHub
                  </a>
                </li>
              )}
              {data.portfolioUrl && (
                <li>
                  <a href={data.portfolioUrl} target="_blank" rel="noreferrer">
                    Portfolio
                  </a>
                </li>
              )}
              {data.websiteUrl && (
                <li>
                  <a href={data.websiteUrl} target="_blank" rel="noreferrer">
                    Website
                  </a>
                </li>
              )}
              {!data.linkedinUrl && !data.githubUrl && !data.portfolioUrl && !data.websiteUrl && (
                <span className="muted">No links shared.</span>
              )}
            </ul>
          </Card>

          <Card title="Save to talent pool">
            <input
              placeholder="Pool name"
              value={poolName}
              onChange={(event) => setPoolName(event.target.value)}
            />
            <textarea
              className="mt-1"
              rows={3}
              placeholder="Private notes for your team"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
            <button className="mt-1" onClick={() => save.mutate()} disabled={save.isPending}>
              Save candidate
            </button>
          </Card>
        </div>
      </div>

      {contactOpen && (
        <Modal
          title={`Message ${data.fullName}`}
          onClose={() => setContactOpen(false)}
          footer={
            <>
              <button className="secondary" onClick={() => setContactOpen(false)}>
                Cancel
              </button>
              <button disabled={message.trim().length < 10 || contact.isPending} onClick={() => contact.mutate()}>
                Send message
              </button>
            </>
          }
        >
          <Alert tone="info">
            You can send one outreach message. The candidate must reply before you can send more.
          </Alert>
          <label>Related job (optional)</label>
          <select value={jobId} onChange={(event) => setJobId(event.target.value)}>
            <option value="">No specific job</option>
            {jobs?.items.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
          <textarea
            className="mt-1"
            rows={5}
            placeholder="Say who you are, the role and why it fits this candidate."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </Modal>
      )}

      {reportOpen && (
        <Modal
          title="Report this profile"
          onClose={() => setReportOpen(false)}
          footer={
            <>
              <button className="secondary" onClick={() => setReportOpen(false)}>
                Cancel
              </button>
              <button className="danger" disabled={reportReason.trim().length < 3} onClick={() => report.mutate()}>
                Submit report
              </button>
            </>
          }
        >
          <p className="muted">
            Reports go to moderation. An open report pauses this candidate's verification badge until it is resolved.
          </p>
          <textarea
            rows={4}
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
            placeholder="Describe the issue"
          />
        </Modal>
      )}
    </>
  );
}
