import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Card, Empty, Loading } from '../../components/ui';
import { api } from '../../lib/api';
import { relativeTime } from '../../lib/format';
import type { NotificationItem, Paginated } from '../../lib/types';

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () =>
      (await api.get<Paginated<NotificationItem> & { unread: number }>('/notifications?pageSize=50')).data,
  });

  const markAll = useMutation({
    mutationFn: async () => (await api.patch('/notifications/read-all')).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOne = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/notifications/${id}/read`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (isLoading || !data) return <Loading />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p className="muted mb-0">{data.unread} unread</p>
        </div>
        <button className="secondary btn-sm" onClick={() => markAll.mutate()} disabled={data.unread === 0}>
          Mark all as read
        </button>
      </div>

      <Card>
        {data.items.length === 0 ? (
          <Empty title="Nothing here yet" hint="Verification decisions, ATS reports and new messages show up here." />
        ) : (
          data.items.map((notification) => (
            <div
              key={notification.id}
              className="row between"
              style={{
                borderBottom: '1px solid var(--border)',
                padding: '12px 0',
                alignItems: 'flex-start',
                opacity: notification.readAt ? 0.65 : 1,
              }}
            >
              <div>
                <div className="row">
                  <strong>{notification.title}</strong>
                  <Badge tone="info">{notification.type.toLowerCase()}</Badge>
                </div>
                <div className="muted">{notification.body}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {relativeTime(notification.createdAt)}
                </div>
              </div>
              {!notification.readAt && (
                <button className="ghost btn-sm" onClick={() => markOne.mutate(notification.id)}>
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </Card>
    </>
  );
}
