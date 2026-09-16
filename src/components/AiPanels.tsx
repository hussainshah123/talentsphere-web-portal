import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from './Toast';
import { Alert, Card, Field, ScoreRing } from './ui';
import { api, errorMessage } from '../lib/api';
import type { AiCvReviewResponse, AiJobFitResponse } from '../lib/types';

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      className="ghost btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          toast.success('Copied to clipboard');
        } catch {
          toast.error('Could not copy — select the text manually');
        }
      }}
    >
      {label}
    </button>
  );
}

function Rewrite({ before, after, why }: { before: string; after: string; why: string }) {
  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
      <div className="muted" style={{ fontSize: 13, textDecoration: 'line-through' }}>
        {before}
      </div>
      <div className="row between" style={{ alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontWeight: 520 }}>{after}</div>
        <CopyButton text={after} />
      </div>
      <div className="muted" style={{ fontSize: 12.5 }}>
        {why}
      </div>
    </div>
  );
}

const AI_NOTE =
  'AI suggestions are drafts, not facts. Check every rewritten line before using it — never add experience, numbers or skills you do not have.';

/** AI review of the candidate's own CV (Gemini, optional feature). */
export function AiCvReviewPanel() {
  const toast = useToast();
  const [data, setData] = useState<AiCvReviewResponse | null>(null);

  const run = useMutation({
    mutationFn: async (force: boolean) =>
      (await api.post<AiCvReviewResponse>('/candidates/me/ats-report/ai-review', { force })).data,
    onSuccess: (result) => {
      setData(result);
      if (!result.review && result.message) toast.error(result.message);
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not get AI suggestions')),
  });

  const review = data?.review ?? null;

  return (
    <Card
      title="AI suggestions"
      action={
        <div className="row">
          {review && (
            <button className="secondary btn-sm" onClick={() => run.mutate(true)} disabled={run.isPending}>
              Regenerate
            </button>
          )}
          <button className="btn-sm" onClick={() => run.mutate(false)} disabled={run.isPending}>
            {run.isPending ? 'Analysing…' : review ? 'Refresh' : 'Get AI suggestions'}
          </button>
        </div>
      }
    >
      {!review && !run.isPending && (
        <p className="muted mb-0">
          An AI reviewer reads your CV alongside the ATS report and returns prioritised fixes, a rewritten summary
          and stronger bullet points. Your CV text is sent to the AI provider only when you press this button.
        </p>
      )}

      {run.isPending && (
        <div className="row" style={{ color: 'var(--text-3)' }}>
          <span className="spinner" /> Reading your CV — this usually takes 10–30 seconds.
        </div>
      )}

      {data && !data.enabled && <Alert tone="info">{data.message}</Alert>}

      {review && (
        <>
          <Alert tone="info">{review.headline}</Alert>
          {data?.cached && (
            <p className="muted" style={{ fontSize: 12.5 }}>
              Showing the saved review. Press Regenerate for a fresh one.
            </p>
          )}

          <h4>Priority fixes</h4>
          {review.priorityFixes.map((fix, index) => (
            <div key={index} style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
              <div className="row">
                <span
                  className={`badge ${
                    fix.severity === 'critical' ? 'danger' : fix.severity === 'important' ? 'warning' : 'info'
                  }`}
                >
                  {fix.severity}
                </span>
                <strong>{fix.issue}</strong>
              </div>
              <div>{fix.fix}</div>
              {fix.example && (
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  Example: {fix.example}
                </div>
              )}
            </div>
          ))}

          <h4 className="mt-2">Rewritten summary</h4>
          <div className="row between" style={{ alignItems: 'flex-start', gap: 8 }}>
            <p className="mb-0">{review.rewrittenSummary}</p>
            <CopyButton text={review.rewrittenSummary} />
          </div>

          {review.bulletRewrites.length > 0 && (
            <>
              <h4 className="mt-2">Stronger bullet points</h4>
              {review.bulletRewrites.map((rewrite, index) => (
                <Rewrite key={index} {...rewrite} />
              ))}
            </>
          )}

          {review.keywordsToAdd.length > 0 && (
            <>
              <h4 className="mt-2">Keywords worth adding</h4>
              <div className="chip-row">
                {review.keywordsToAdd.map((keyword) => (
                  <span key={keyword} className="chip">
                    {keyword}
                  </span>
                ))}
              </div>
            </>
          )}

          {review.atsRisks.length > 0 && (
            <>
              <h4 className="mt-2">ATS parsing risks</h4>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {review.atsRisks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </>
          )}

          <Alert tone="warning">{AI_NOTE}</Alert>
        </>
      )}
    </Card>
  );
}

/** AI tailoring advice for one job description. */
export function AiJobFitPanel() {
  const toast = useToast();
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [data, setData] = useState<AiJobFitResponse | null>(null);

  const run = useMutation({
    mutationFn: async () =>
      (
        await api.post<AiJobFitResponse>('/candidates/me/ats-report/job-fit', {
          jobTitle: jobTitle || undefined,
          jobDescription,
        })
      ).data,
    onSuccess: (result) => {
      setData(result);
      if (!result.fit && result.message) toast.error(result.message);
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not analyse this job')),
  });

  const fit = data?.fit ?? null;

  return (
    <Card title="Tailor my CV to a job (AI)">
      <p className="muted">
        Paste a job ad. You get a fit score, the exact gaps, a tailored summary, rewritten bullets and the profile
        fields worth updating.
      </p>
      <div className="grid cols-2">
        <Field label="Job title (optional)">
          <input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
        </Field>
      </div>
      <Field label="Job description" hint="At least 30 characters — the full ad works best.">
        <textarea rows={6} value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} />
      </Field>
      <button onClick={() => run.mutate()} disabled={jobDescription.trim().length < 30 || run.isPending}>
        {run.isPending ? 'Analysing…' : 'Analyse fit'}
      </button>

      {run.isPending && (
        <div className="row mt-2" style={{ color: 'var(--text-3)' }}>
          <span className="spinner" /> Comparing your CV and profile against this job — 15–40 seconds.
        </div>
      )}

      {data && !data.enabled && <Alert tone="info">{data.message}</Alert>}

      {data && (
        <p className="muted mt-2 mb-0">
          Deterministic keyword match: <strong>{data.keywordMatchPercent ?? '—'}%</strong>
          {data.missingKeywords.length > 0 && ` · missing: ${data.missingKeywords.slice(0, 10).join(', ')}`}
        </p>
      )}

      {fit && (
        <div className="mt-2">
          <div className="row" style={{ alignItems: 'flex-start', gap: 20 }}>
            <ScoreRing score={fit.fitScore} label="job fit" />
            <p className="grow">{fit.verdict}</p>
          </div>

          <h4>What matches</h4>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {fit.strengths.map((strength) => (
              <li key={strength}>{strength}</li>
            ))}
          </ul>

          <h4 className="mt-2">Gaps to close</h4>
          {fit.gaps.map((gap, index) => (
            <div key={index} style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
              <div className="row">
                <span className={`badge ${gap.status === 'missing' ? 'danger' : 'warning'}`}>{gap.status}</span>
                <strong>{gap.requirement}</strong>
              </div>
              <div className="muted">{gap.howToAddress}</div>
            </div>
          ))}

          <h4 className="mt-2">Tailored summary for this job</h4>
          <div className="row between" style={{ alignItems: 'flex-start', gap: 8 }}>
            <p className="mb-0">{fit.tailoredSummary}</p>
            <CopyButton text={fit.tailoredSummary} />
          </div>

          {fit.bulletRewrites.length > 0 && (
            <>
              <h4 className="mt-2">Rewritten bullets</h4>
              {fit.bulletRewrites.map((rewrite, index) => (
                <Rewrite key={index} {...rewrite} />
              ))}
            </>
          )}

          {fit.profileUpdates.length > 0 && (
            <>
              <h4 className="mt-2">Suggested profile updates</h4>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Suggested value</th>
                      <th>Why</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {fit.profileUpdates.map((update, index) => (
                      <tr key={index}>
                        <td>
                          <code>{update.field}</code>
                        </td>
                        <td>{update.suggestedValue}</td>
                        <td className="muted">{update.why}</td>
                        <td>
                          <CopyButton text={update.suggestedValue} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="muted" style={{ fontSize: 12.5 }}>
                Apply these on the <a href="/profile">My profile</a> page — nothing is changed automatically.
              </p>
            </>
          )}

          {fit.keywordsToAdd.length > 0 && (
            <>
              <h4 className="mt-2">Keywords to add</h4>
              <div className="chip-row">
                {fit.keywordsToAdd.map((keyword) => (
                  <span key={keyword} className="chip">
                    {keyword}
                  </span>
                ))}
              </div>
            </>
          )}

          <h4 className="mt-2">Message to the recruiter</h4>
          <div className="row between" style={{ alignItems: 'flex-start', gap: 8 }}>
            <p className="mb-0">{fit.applicationPitch}</p>
            <CopyButton text={fit.applicationPitch} />
          </div>

          <Alert tone="warning">{AI_NOTE}</Alert>
        </div>
      )}
    </Card>
  );
}
