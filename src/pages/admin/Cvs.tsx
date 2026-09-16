import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '../../components/Toast';
import { Badge, Card, Loading, Pagination } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatDate, formatFileSize } from '../../lib/format';
import type { Paginated } from '../../lib/types';

interface AdminCv {
  id: string;
  parserStatus: string;
  parserMessage: string | null;
  atsScore: number | null;
  analyzedAt: string | null;
  createdAt: string;
  candidate: { id: string; fullName: string };
  file: { originalName: string; mimeType: string; size: number; scanStatus: string };
}

export default function AdminCvs() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-cvs', status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (status) params.set('status', status);
      return (await api.get<Paginated<AdminCv>>(`/admin/cvs?${params}`)).data;
    },
  });

  const reprocess = useMutation({
    mutationFn: async (id: string) => (await api.post(`/admin/cvs/${id}/reprocess`)).data,
    onSuccess: () => {
      toast.success('Re-queued for parsing and scoring');
      void queryClient.invalidateQueries({ queryKey: ['admin-cvs'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not re-queue the CV')),
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>CV & ATS monitoring</h1>
          <p className="muted mb-0">Watch parser health and re-run failed analyses.</p>
        </div>
      </div>

      <Card>
        <div className="chip-row">
          {['', 'PENDING', 'PROCESSING', 'PARSED', 'FAILED'].map((value) => (
            <button
              key={value || 'ALL'}
              className={status === value ? '' : 'secondary'}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
            >
              {value ? value.toLowerCase() : 'all'}
            </button>
          ))}
        </div>
      </Card>

      {isLoading || !data ? (
        <Loading />
      ) : (
        <Card>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>File</th>
                  <th>Parser</th>
                  <th>Scan</th>
                  <th>ATS</th>
                  <th>Uploaded</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((cv) => (
                  <tr key={cv.id}>
                    <td>{cv.candidate.fullName}</td>
                    <td>
                      {cv.file.originalName}
                      <div className="muted" style={{ fontSize: 12 }}>
                        {cv.file.mimeType} · {formatFileSize(cv.file.size)}
                      </div>
                    </td>
                    <td>
                      <Badge
                        tone={
                          cv.parserStatus === 'PARSED' ? 'success' : cv.parserStatus === 'FAILED' ? 'danger' : 'warning'
                        }
                      >
                        {cv.parserStatus.toLowerCase()}
                      </Badge>
                      {cv.parserMessage && (
                        <div className="muted" style={{ fontSize: 12 }}>
                          {cv.parserMessage}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge tone={cv.file.scanStatus === 'CLEAN' ? 'success' : 'danger'}>
                        {cv.file.scanStatus.toLowerCase()}
                      </Badge>
                    </td>
                    <td>{cv.atsScore ?? '—'}</td>
                    <td className="muted">{formatDate(cv.createdAt, true)}</td>
                    <td>
                      <button className="ghost btn-sm" onClick={() => reprocess.mutate(cv.id)}>
                        Re-run
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </Card>
      )}
    </>
  );
}
