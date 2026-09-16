import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { AiCvReviewPanel, AiJobFitPanel } from '../../components/AiPanels';
import { useToast } from '../../components/Toast';
import { Alert, Card, Empty, Field, Loading, Progress, ScoreRing } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatDate, formatFileSize } from '../../lib/format';
import type { AtsReport, AtsReportResponse } from '../../lib/types';

export default function CvAts() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobReport, setJobReport] = useState<AtsReport | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ats-report'],
    queryFn: async () => {
      try {
        return (await api.get<AtsReportResponse>('/candidates/me/ats-report')).data;
      } catch {
        return null;
      }
    },
    refetchInterval: (query) => {
      const current = query.state.data as AtsReportResponse | null;
      return current && ['PENDING', 'PROCESSING'].includes(current.parserStatus) ? 2000 : false;
    },
  });

  const { data: cvs } = useQuery({
    queryKey: ['cvs'],
    queryFn: async () => (await api.get<Array<{ id: string; atsScore: number | null; parserStatus: string; createdAt: string; file: { originalName: string; size: number } }>>('/candidates/me/cvs')).data,
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return (await api.post('/candidates/me/cv', form)).data;
    },
    onSuccess: () => {
      toast.success('CV uploaded — analysis is running');
      void queryClient.invalidateQueries({ queryKey: ['ats-report'] });
      void queryClient.invalidateQueries({ queryKey: ['cvs'] });
      void queryClient.invalidateQueries({ queryKey: ['verification'] });
      void refetch();
    },
    onError: (error) => toast.error(errorMessage(error, 'Upload failed')),
  });

  const prefill = useMutation({
    mutationFn: async () => (await api.post('/candidates/me/cv/prefill', { fields: [] })).data,
    onSuccess: () => {
      toast.success('Profile fields filled from your CV');
      void queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
      void queryClient.invalidateQueries({ queryKey: ['candidate-dashboard'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not apply CV data')),
  });

  const scoreJob = useMutation({
    mutationFn: async () =>
      (await api.post<AtsReport>('/candidates/me/ats-report/job-score', { jobDescription })).data,
    onSuccess: (report) => setJobReport(report),
    onError: (error) => toast.error(errorMessage(error, 'Could not score against that job description')),
  });

  if (isLoading) return <Loading />;

  const report = data?.report ?? null;
  const processing = data && ['PENDING', 'PROCESSING'].includes(data.parserStatus);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>CV & ATS report</h1>
          <p className="muted mb-0">Upload a CV, see how an applicant tracking system reads it, and fix what matters.</p>
        </div>
        <div className="row">
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload.mutate(file);
              event.target.value = '';
            }}
          />
          <button onClick={() => fileInput.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? 'Uploading…' : 'Upload CV'}
          </button>
        </div>
      </div>

      {!data && (
        <Card>
          <Empty
            title="No CV uploaded yet"
            hint="PDF, DOC or DOCX up to 10MB. Text-based PDFs parse best — avoid scans and screenshots."
            action={<button onClick={() => fileInput.current?.click()}>Upload your CV</button>}
          />
        </Card>
      )}

      {processing && <Alert tone="info">Analysing your CV — this usually takes a few seconds.</Alert>}

      {data?.parserStatus === 'FAILED' && (
        <Alert tone="danger">
          We could not read this file: {data.parserMessage ?? 'unknown parsing error'}. Try exporting a text-based
          PDF and uploading again.
        </Alert>
      )}

      {report && (
        <>
          <Card>
            <div className="row" style={{ alignItems: 'flex-start', gap: 24 }}>
              <ScoreRing score={report.score} />
              <div className="grow">
                <h3>{data?.fileName}</h3>
                <p className="muted">
                  Parsed {formatDate(data?.analyzedAt, true)} · {report.wordCount} words · {report.pageCount} page(s)
                </p>
                <div className="chip-row">
                  {report.detectedSections.map((section) => (
                    <span key={section} className="chip">
                      ✓ {section}
                    </span>
                  ))}
                  {report.missingSections.map((section) => (
                    <span key={section} className="chip" style={{ color: 'var(--danger)' }}>
                      ✕ {section} missing
                    </span>
                  ))}
                </div>
                <div className="row mt-2">
                  <button className="secondary btn-sm" onClick={() => prefill.mutate()} disabled={prefill.isPending}>
                    Fill my profile from this CV
                  </button>
                </div>
              </div>
            </div>
            <Alert tone="warning">{report.disclaimer}</Alert>
          </Card>

          <div className="grid cols-2 mt-2">
            <Card title="Score breakdown">
              {report.factors.map((factor) => (
                <div key={factor.key} style={{ marginBottom: 12 }}>
                  <div className="row between" style={{ fontSize: 14 }}>
                    <strong>{factor.label}</strong>
                    <span className="muted">
                      {factor.earned}/{factor.weight}
                    </span>
                  </div>
                  <Progress value={(factor.earned / factor.weight) * 100} />
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                    {factor.detail}
                  </div>
                </div>
              ))}
            </Card>

            <div>
              <Card title="Suggested improvements">
                {report.suggestions.length === 0 ? (
                  <p className="muted mb-0">No blocking issues found. Nice work.</p>
                ) : (
                  <ul style={{ paddingLeft: 18, margin: 0 }}>
                    {report.suggestions.map((suggestion, index) => (
                      <li key={index} style={{ marginBottom: 8 }}>
                        <span
                          className={`badge ${
                            suggestion.severity === 'critical'
                              ? 'danger'
                              : suggestion.severity === 'important'
                                ? 'warning'
                                : 'info'
                          }`}
                        >
                          {suggestion.severity}
                        </span>{' '}
                        {suggestion.message}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card title="Formatting warnings">
                {report.formattingWarnings.length === 0 ? (
                  <p className="muted mb-0">No formatting risks detected.</p>
                ) : (
                  <ul style={{ paddingLeft: 18, margin: 0 }}>
                    {report.formattingWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card title="Extracted data">
                <table>
                  <tbody>
                    <tr>
                      <td className="muted">Name</td>
                      <td>{report.extracted.fullName ?? '—'}</td>
                    </tr>
                    <tr>
                      <td className="muted">Emails</td>
                      <td>{report.extracted.emails.join(', ') || '—'}</td>
                    </tr>
                    <tr>
                      <td className="muted">Phones</td>
                      <td>{report.extracted.phones.join(', ') || '—'}</td>
                    </tr>
                    <tr>
                      <td className="muted">Links</td>
                      <td>{Object.values(report.extracted.links).filter(Boolean).join(', ') || '—'}</td>
                    </tr>
                    <tr>
                      <td className="muted">Skills found</td>
                      <td>{report.extracted.skills.slice(0, 18).join(', ') || '—'}</td>
                    </tr>
                    <tr>
                      <td className="muted">Experience detected</td>
                      <td>
                        {report.extracted.totalYears ? `${report.extracted.totalYears} years` : '—'}
                        {report.extracted.experiences.length > 0 &&
                          ` · ${report.extracted.experiences.length} role(s)`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Card>
            </div>
          </div>

          <AiCvReviewPanel />

          <AiJobFitPanel />

          <Card title="Keyword check against a job description">
            <Field label="Paste the job description" hint="We compare your CV against the job's key terms.">
              <textarea
                rows={5}
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the full job ad here…"
              />
            </Field>
            <button
              onClick={() => scoreJob.mutate()}
              disabled={jobDescription.trim().length < 30 || scoreJob.isPending}
            >
              {scoreJob.isPending ? 'Scoring…' : 'Score my CV against this job'}
            </button>

            {jobReport && (
              <div className="mt-2">
                <div className="row" style={{ gap: 24, alignItems: 'flex-start' }}>
                  <ScoreRing score={jobReport.keywordMatchPercent ?? 0} label="keyword match" />
                  <div className="grow">
                    <p>
                      <strong>Matched:</strong> {jobReport.matchedKeywords.join(', ') || '—'}
                    </p>
                    <p className="mb-0">
                      <strong>Missing:</strong>{' '}
                      <span style={{ color: 'var(--danger)' }}>{jobReport.missingKeywords.join(', ') || '—'}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {cvs && cvs.length > 0 && (
        <Card title="Upload history">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                  <th>ATS score</th>
                  <th>Size</th>
                </tr>
              </thead>
              <tbody>
                {cvs.map((cv) => (
                  <tr key={cv.id}>
                    <td>{cv.file.originalName}</td>
                    <td>{formatDate(cv.createdAt, true)}</td>
                    <td>{cv.parserStatus}</td>
                    <td>{cv.atsScore ?? '—'}</td>
                    <td>{formatFileSize(cv.file.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
