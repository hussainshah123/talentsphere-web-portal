import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { Badge, Modal } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { statusLabel, statusTone } from '../../lib/applications';
import type { ApplicationEligibility } from '../../lib/types';

/**
 * Owns all four states a job can be in for this candidate — already applied, no CV
 * yet, job closed, and ready to apply — so the jobs list never has to reason about
 * them. The server refuses an application without a CV, so we ask before offering.
 */
export default function ApplyButton({ jobId, jobOpen = true }: { jobId: string; jobOpen?: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [coverNote, setCoverNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['application-eligibility', jobId],
    queryFn: async () =>
      (await api.get<ApplicationEligibility>(`/applications/job/${jobId}/status`)).data,
  });

  const apply = useMutation({
    mutationFn: async () =>
      (await api.post('/applications', { jobId, coverNote: coverNote.trim() || undefined })).data,
    onSuccess: () => {
      toast.success('Application sent');
      setOpen(false);
      setCoverNote('');
      void queryClient.invalidateQueries({ queryKey: ['application-eligibility', jobId] });
      void queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not send your application')),
  });

  if (isLoading) return null;

  const existing = data?.application;
  const active = existing && existing.status !== 'WITHDRAWN';

  if (active) {
    return (
      <Link to="/applications" className="row" style={{ gap: 8, textDecoration: 'none' }}>
        <Badge tone={statusTone(existing.status)}>{statusLabel(existing.status)}</Badge>
        <span className="muted" style={{ fontSize: 13 }}>
          View application
        </span>
      </Link>
    );
  }

  if (!jobOpen) {
    return (
      <span className="muted" style={{ fontSize: 13 }}>
        Not accepting applications
      </span>
    );
  }

  if (data && !data.hasCv) {
    return (
      <Link to="/cv" className="btn btn-secondary btn-sm">
        Upload a CV to apply
      </Link>
    );
  }

  return (
    <>
      <button className="btn-sm" onClick={() => setOpen(true)}>
        Apply
      </button>

      {open && (
        <Modal
          title="Apply to this job"
          onClose={() => setOpen(false)}
          footer={
            <>
              <button className="secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button disabled={apply.isPending} onClick={() => apply.mutate()}>
                {apply.isPending ? 'Sending…' : 'Send application'}
              </button>
            </>
          }
        >
          <p className="muted">
            Your profile and primary CV go with this application. You can withdraw it at any time.
          </p>
          <label>
            Cover note
            <textarea
              value={coverNote}
              onChange={(event) => setCoverNote(event.target.value)}
              placeholder="I have shipped this exact stack for four years…"
              maxLength={4000}
              rows={5}
            />
            <span className="hint">Optional — why you, for this role, in a few lines.</span>
          </label>
        </Modal>
      )}
    </>
  );
}
