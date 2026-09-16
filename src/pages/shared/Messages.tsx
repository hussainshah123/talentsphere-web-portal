import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useToast } from '../../components/Toast';
import { Badge, Card, Empty, Loading, Modal } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { formatDate, relativeTime } from '../../lib/format';
import type { Conversation, Message, Paginated } from '../../lib/types';

export default function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => (await api.get<Paginated<Conversation>>('/conversations?pageSize=50')).data,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!activeId && conversations?.items.length) setActiveId(conversations.items[0].id);
  }, [conversations, activeId]);

  const { data: messages } = useQuery({
    queryKey: ['messages', activeId],
    queryFn: async () => (await api.get<Paginated<Message>>(`/conversations/${activeId}/messages?pageSize=100`)).data,
    enabled: Boolean(activeId),
    refetchInterval: 15_000,
  });

  const active = conversations?.items.find((conversation) => conversation.id === activeId) ?? null;

  const send = useMutation({
    mutationFn: async () => (await api.post(`/conversations/${activeId}/messages`, { body: draft })).data,
    onSuccess: () => {
      setDraft('');
      void queryClient.invalidateQueries({ queryKey: ['messages', activeId] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not send the message')),
  });

  const setStatus = useMutation({
    mutationFn: async (status: string) => (await api.patch(`/conversations/${activeId}/status`, { status })).data,
    onSuccess: () => {
      toast.success('Conversation updated');
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update the conversation')),
  });

  const blockCompany = useMutation({
    mutationFn: async () => (await api.post('/candidates/me/blocks', { companyId: active?.company.id })).data,
    onSuccess: () => {
      toast.success('Company blocked — they can no longer contact you');
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not block the company')),
  });

  const report = useMutation({
    mutationFn: async () =>
      (await api.post('/reports', {
        targetType: 'COMPANY',
        targetId: active?.company.id,
        reason: reportReason,
      })).data,
    onSuccess: () => {
      setReportOpen(false);
      setReportReason('');
      toast.success('Report submitted to moderation');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not submit the report')),
  });

  if (isLoading) return <Loading />;

  const isCandidate = user?.role === 'CANDIDATE';

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Messages</h1>
          <p className="muted mb-0">
            {isCandidate
              ? 'Recruiters can only reach you here. Accept, reject, block or report any conversation.'
              : 'Candidates see one outreach message until they reply. Keep it specific and relevant.'}
          </p>
        </div>
      </div>

      {!conversations || conversations.items.length === 0 ? (
        <Card>
          <Empty
            title="No conversations yet"
            hint={isCandidate ? 'Verified companies will reach out once your profile is live.' : 'Start one from candidate search.'}
          />
        </Card>
      ) : (
        <div className="conversation-layout">
          <Card>
            {conversations.items.map((conversation) => (
              <div
                key={conversation.id}
                className={`conversation-item ${conversation.id === activeId ? 'active' : ''}`}
                onClick={() => setActiveId(conversation.id)}
              >
                <div className="row between">
                  <strong>{isCandidate ? conversation.company.name : conversation.candidate.fullName}</strong>
                  <Badge tone={conversation.status === 'ACCEPTED' ? 'success' : conversation.status === 'PENDING' ? 'warning' : 'default'}>
                    {conversation.status.toLowerCase()}
                  </Badge>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>
                  {conversation.messages?.[0]?.body.slice(0, 60) ?? conversation.subject ?? 'No messages'}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {relativeTime(conversation.lastMessageAt)}
                </div>
              </div>
            ))}
          </Card>

          <Card>
            {!active ? (
              <Empty title="Select a conversation" />
            ) : (
              <>
                <div className="card-header">
                  <div>
                    <h3 className="mb-0">
                      {isCandidate ? active.company.name : active.candidate.fullName}
                    </h3>
                    <span className="muted" style={{ fontSize: 13 }}>
                      {active.subject ?? 'Conversation'} · started {formatDate(active.lastMessageAt)}
                    </span>
                  </div>
                  <div className="row">
                    {isCandidate && active.status === 'PENDING' && (
                      <>
                        <button className="secondary btn-sm" onClick={() => setStatus.mutate('ACCEPTED')}>
                          Accept
                        </button>
                        <button className="secondary btn-sm" onClick={() => setStatus.mutate('REJECTED')}>
                          Reject
                        </button>
                      </>
                    )}
                    {isCandidate && (
                      <>
                        <button className="secondary btn-sm" onClick={() => blockCompany.mutate()}>
                          Block
                        </button>
                        <button className="secondary btn-sm" onClick={() => setReportOpen(true)}>
                          Report
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="message-list">
                  {messages?.items.map((message) => (
                    <div key={message.id} className={`bubble ${message.mine ? 'mine' : ''}`}>
                      {message.body}
                      <time>{formatDate(message.createdAt, true)}</time>
                    </div>
                  ))}
                  {messages?.items.length === 0 && <p className="muted">No messages yet.</p>}
                </div>

                {['BLOCKED', 'REJECTED', 'CLOSED'].includes(active.status) ? (
                  <p className="muted mt-2 mb-0">This conversation is closed.</p>
                ) : (
                  <form
                    className="row mt-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (draft.trim()) send.mutate();
                    }}
                  >
                    <input
                      placeholder="Write a message…"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                    />
                    <button type="submit" disabled={!draft.trim() || send.isPending}>
                      Send
                    </button>
                  </form>
                )}
              </>
            )}
          </Card>
        </div>
      )}

      {reportOpen && (
        <Modal
          title="Report this company"
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
          <p className="muted">Moderators review every report. Open reports also pause a company's verification.</p>
          <textarea
            rows={4}
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
            placeholder="What happened?"
          />
        </Modal>
      )}
    </>
  );
}
