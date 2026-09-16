import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Empty, Loading } from '../../components/ui';
import { api } from '../../lib/api';
import { formatSalary } from '../../lib/format';
import ApplyButton from './ApplyButton';

interface RecommendedJob {
  id: string;
  title: string;
  company: { id: string; name: string; logoUrl: string | null };
  location: string | null;
  workMode: string;
  salaryMin: number | null;
  salaryMax: number | null;
  score: number;
  matchedSkills: string[];
}

export default function CandidateJobs() {
  const { data, isLoading } = useQuery({
    queryKey: ['recommended-jobs'],
    queryFn: async () => (await api.get<RecommendedJob[]>('/jobs/recommended')).data,
  });

  if (isLoading) return <Loading />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Recommended jobs</h1>
          <p className="muted mb-0">
            Published roles from verified companies, ranked against your skills, experience and preferences.
          </p>
        </div>
      </div>

      <Alert tone="info">
        Match scores are advisory. A lower score does not mean you should not apply — it shows where your profile and
        the job description differ.
      </Alert>

      {!data || data.length === 0 ? (
        <Card>
          <Empty title="No matching jobs yet" hint="Complete your profile and skills so we can match you accurately." />
        </Card>
      ) : (
        data.map((job) => (
          <Card key={job.id}>
            <div className="row between wrap">
              <div>
                <h3 className="mb-0">{job.title}</h3>
                <p className="muted mb-0">
                  {job.company.name} · {job.location ?? 'Location flexible'} · {job.workMode}
                </p>
                <div className="chip-row mt-1">
                  {job.matchedSkills.map((skill) => (
                    <span key={skill} className="chip">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="badge success">{job.score}% match</div>
                <div className="muted mt-1" style={{ fontSize: 13 }}>
                  {formatSalary({ min: job.salaryMin, max: job.salaryMax, currency: 'EUR' })}
                </div>
                <div className="mt-1">
                  <ApplyButton jobId={job.id} />
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </>
  );
}
