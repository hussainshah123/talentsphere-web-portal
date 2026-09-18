import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../components/Toast';
import { Card, Empty, Loading } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatDate, formatSalary } from '../../lib/format';
import ApplyButton from './ApplyButton';
import type { SavedJob } from '../../lib/types';

/** The step before applying: jobs kept to come back to. */
export default function SavedJobs() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['saved-jobs'],
    queryFn: async () => (await api.get<SavedJob[]>('/candidates/me/saved-jobs')).data,
  });

  const remove = useMutation({
    mutationFn: async (jobId: string) =>
      (await api.delete(`/candidates/me/saved-jobs/${jobId}`)).data,
    onSuccess: () => {
      toast.success('Removed from saved jobs');
      void queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not remove this job')),
  });

  if (isLoading) return <Loading />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Saved jobs</h1>
          <p className="muted mb-0">
            Jobs you kept to come back to. Saving one tells the company nothing.
          </p>
        </div>
      </div>

      {!data || data.length === 0 ? (
        <Card>
          <Empty
            title="Nothing saved yet"
            hint="Use Save on any job in Find jobs and it collects here."
          />
        </Card>
      ) : (
        data.map((entry) => (
          <Card key={entry.id}>
            <div className="row between wrap">
              <div>
                <h3 className="mb-0">{entry.job.title}</h3>
                <p className="muted mb-0">
                  {entry.job.company?.name}
                  {entry.job.location ? ` · ${entry.job.location}` : ''} · saved{' '}
                  {formatDate(entry.createdAt)}
                </p>
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                {formatSalary({
                  min: entry.job.salaryMin,
                  max: entry.job.salaryMax,
                  currency: entry.job.salaryCurrency,
                })}
              </div>
            </div>

            {entry.note && <p className="muted mt-1">{entry.note}</p>}

            <div className="row mt-2" style={{ gap: 10 }}>
              <ApplyButton jobId={entry.jobId} jobOpen={entry.job.status === 'PUBLISHED'} />
              <button
                className="secondary btn-sm"
                disabled={remove.isPending}
                onClick={() => remove.mutate(entry.jobId)}
              >
                Remove
              </button>
            </div>
          </Card>
        ))
      )}
    </>
  );
}
