import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '../../components/Toast';
import { api, errorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';

interface Note {
  id: string;
  body: string;
  authorId: string;
  authorEmail: string | null;
  createdAt: string;
}

/**
 * Private notes on one application. The candidate never sees these — their side of
 * the story is the status timeline, which carries only what a recruiter chose to send.
 */
export default function ApplicantNotes({ applicationId }: { applicationId: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [draft, setDraft] = useState('');

  const key = ['application-notes', applicationId];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => (await api.get<Note[]>(`/applications/${applicationId}/notes`)).data,
  });

  const add = useMutation({
    mutationFn: async () =>
      (await api.post(`/applications/${applicationId}/notes`, { body: draft.trim() })).data,
    onSuccess: () => {
      setDraft('');
      void queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save that note')),
  });

  const remove = useMutation({
    mutationFn: async (noteId: string) =>
      (await api.delete(`/applications/${applicationId}/notes/${noteId}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    onError: (error) => toast.error(errorMessage(error, 'Could not delete that note')),
  });

  return (
    <div className="mt-1">
      <span className="hint">Hiring team notes — never shown to the candidate</span>

      {isLoading ? null : (data ?? []).length === 0 ? (
        <p className="muted mb-0" style={{ fontSize: 13 }}>
          No notes yet.
        </p>
      ) : (
        <ul className="notes-list">
          {(data ?? []).map((note) => (
            <li key={note.id}>
              <p className="mb-0" style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
                {note.body}
              </p>
              <div className="row between">
                <span className="muted" style={{ fontSize: 12 }}>
                  {note.authorEmail ?? 'Team member'} · {formatDate(note.createdAt, true)}
                </span>
                <button
                  className="ghost btn-sm"
                  onClick={() => remove.mutate(note.id)}
                  aria-label="Delete note"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="row mt-1" style={{ gap: 8, alignItems: 'flex-start' }}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Checked references, strong on the stack…"
          rows={2}
          maxLength={4000}
          style={{ flex: 1 }}
        />
        <button
          className="btn-sm"
          disabled={!draft.trim() || add.isPending}
          onClick={() => add.mutate()}
        >
          {add.isPending ? 'Saving…' : 'Add note'}
        </button>
      </div>
    </div>
  );
}
