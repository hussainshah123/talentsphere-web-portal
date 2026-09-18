import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { Badge, Card, Empty, Field, Loading, Pagination } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import type { Job, Paginated } from '../../lib/types';

export default function RecruiterJobs() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['my-jobs', page],
    queryFn: async () => (await api.get<Paginated<Job>>(`/jobs/mine?page=${page}&pageSize=10`)).data,
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      title: '',
      description: '',
      requirements: '',
      skills: '',
      location: '',
      country: '',
      workMode: 'HYBRID',
      employmentType: 'FULL_TIME',
      salaryMin: '',
      salaryMax: '',
      experienceMin: '',
      experienceMax: '',
      state: '',
      timezone: '',
      industry: '',
      experienceLevel: '',
      educationLevel: '',
      remoteEligibility: '',
      remoteCountries: '',
      remoteTimezones: '',
      workAuthorization: 'EMPLOYER_SPECIFIED',
      visaSponsorship: 'no',
      status: 'PUBLISHED',
    },
  });

  const create = useMutation({
    mutationFn: async (values: Record<string, string>) =>
      (await api.post('/jobs', {
        title: values.title,
        description: values.description,
        requirements: values.requirements || undefined,
        skills: values.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
        location: values.location || undefined,
        country: values.country || undefined,
        workMode: values.workMode,
        employmentType: values.employmentType,
        salaryMin: values.salaryMin ? Number(values.salaryMin) : undefined,
        salaryMax: values.salaryMax ? Number(values.salaryMax) : undefined,
        experienceMin: values.experienceMin ? Number(values.experienceMin) : undefined,
        experienceMax: values.experienceMax ? Number(values.experienceMax) : undefined,
        state: values.state || undefined,
        timezone: values.timezone || undefined,
        industry: values.industry || undefined,
        experienceLevel: values.experienceLevel || undefined,
        educationLevel: values.educationLevel || undefined,
        remoteEligibility: values.remoteEligibility || undefined,
        remoteCountries: values.remoteCountries
          ? values.remoteCountries.split(',').map((entry) => entry.trim()).filter(Boolean)
          : undefined,
        remoteTimezones: values.remoteTimezones
          ? values.remoteTimezones.split(',').map((entry) => entry.trim()).filter(Boolean)
          : undefined,
        workAuthorization: values.workAuthorization || undefined,
        visaSponsorship: values.visaSponsorship === 'yes',
        status: values.status,
      })).data,
    onSuccess: () => {
      toast.success('Job created');
      reset();
      setCreating(false);
      void queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not create the job')),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.patch(`/jobs/${id}`, { status })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-jobs'] }),
    onError: (error) => toast.error(errorMessage(error, 'Could not update the job')),
  });

  if (isLoading || !data) return <Loading />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Jobs</h1>
          <p className="muted mb-0">Job descriptions power candidate matching and keyword scoring.</p>
        </div>
        <button onClick={() => setCreating((value) => !value)}>{creating ? 'Cancel' : 'New job'}</button>
      </div>

      {creating && (
        <Card title="Create a job">
          <form onSubmit={handleSubmit((values) => create.mutate(values as Record<string, string>))}>
            <div className="grid cols-2">
              <Field label="Job title" required>
                <input {...register('title', { required: true })} />
              </Field>
              <Field label="Key skills" hint="Comma separated — used for matching">
                <input placeholder="typescript, react, postgresql" {...register('skills')} />
              </Field>
            </div>
            <Field label="Description" required hint="At least 30 characters. Paste the full job ad for best matching.">
              <textarea rows={6} {...register('description', { required: true })} />
            </Field>
            <Field label="Requirements">
              <textarea rows={3} {...register('requirements')} />
            </Field>
            <div className="grid cols-4">
              <Field label="Location">
                <input {...register('location')} />
              </Field>
              <Field label="Country">
                <input {...register('country')} />
              </Field>
              <Field label="Work mode">
                <select {...register('workMode')}>
                  <option value="ONSITE">On-site</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="REMOTE">Remote</option>
                  <option value="FLEXIBLE">Flexible</option>
                </select>
              </Field>
              <Field label="Employment type">
                <select {...register('employmentType')}>
                  <option value="FULL_TIME">Full time</option>
                  <option value="PART_TIME">Part time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="FREELANCE">Freelance</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </Field>
              <Field label="Salary min">
                <input type="number" {...register('salaryMin')} />
              </Field>
              <Field label="Salary max">
                <input type="number" {...register('salaryMax')} />
              </Field>
              <Field label="Min experience (years)">
                <input type="number" step="0.5" {...register('experienceMin')} />
              </Field>
              <Field label="Max experience (years)">
                <input type="number" step="0.5" {...register('experienceMax')} />
              </Field>
              <Field label="State / province">
                <input {...register('state')} />
              </Field>
              <Field label="Industry">
                <input placeholder="software" {...register('industry')} />
              </Field>
              <Field label="Experience level">
                <select {...register('experienceLevel')}>
                  <option value="">Not specified</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="ENTRY">Entry</option>
                  <option value="JUNIOR">Junior</option>
                  <option value="MID">Mid</option>
                  <option value="SENIOR">Senior</option>
                  <option value="LEAD">Lead</option>
                  <option value="EXECUTIVE">Executive</option>
                </select>
              </Field>
              <Field label="Minimum education">
                <select {...register('educationLevel')}>
                  <option value="">Not specified</option>
                  <option value="NONE">None required</option>
                  <option value="HIGH_SCHOOL">High school</option>
                  <option value="DIPLOMA">Diploma</option>
                  <option value="BACHELORS">Bachelors</option>
                  <option value="MASTERS">Masters</option>
                  <option value="DOCTORATE">Doctorate</option>
                </select>
              </Field>
              <Field label="Status">
                <select {...register('status')}>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </Field>
            </div>

            <h4 className="mt-2 mb-0">Remote eligibility &amp; work authorisation</h4>
            <p className="muted" style={{ fontSize: 13 }}>
              These are what candidates filter on. Leaving eligibility unset treats the job as
              unrestricted — say so explicitly if it is not, or people apply who cannot take it.
            </p>
            <div className="grid cols-4">
              <Field label="Remote eligibility">
                <select {...register('remoteEligibility')}>
                  <option value="">Unrestricted</option>
                  <option value="WORLDWIDE">Worldwide</option>
                  <option value="SPECIFIC_COUNTRIES">Specific countries</option>
                  <option value="SPECIFIC_REGIONS">Specific regions</option>
                  <option value="SPECIFIC_TIMEZONES">Specific time zones</option>
                </select>
              </Field>
              <Field label="Countries / regions">
                <input placeholder="Germany, Poland" {...register('remoteCountries')} />
              </Field>
              <Field label="Time zones">
                <input placeholder="EST, GMT" {...register('remoteTimezones')} />
              </Field>
              <Field label="Company time zone">
                <input placeholder="GMT" {...register('timezone')} />
              </Field>
              <Field label="Work authorisation">
                <select {...register('workAuthorization')}>
                  <option value="EMPLOYER_SPECIFIED">Employer specified</option>
                  <option value="NOT_REQUIRED">Not required</option>
                  <option value="REQUIRED">Required</option>
                </select>
              </Field>
              <Field label="Visa sponsorship">
                <select {...register('visaSponsorship')}>
                  <option value="no">Not offered</option>
                  <option value="yes">Offered</option>
                </select>
              </Field>
            </div>
            <button type="submit" disabled={create.isPending}>
              Create job
            </button>
          </form>
        </Card>
      )}

      {data.items.length === 0 ? (
        <Card>
          <Empty title="No jobs yet" hint="Create a job to run candidate matching." />
        </Card>
      ) : (
        <Card>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Status</th>
                  <th>Applicants</th>
                  <th>Matches</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <Link to={`/recruiter/jobs/${job.id}`}>
                        <strong>{job.title}</strong>
                      </Link>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {[job.location, job.workMode, job.employmentType.replace('_', ' ')].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td>
                      <Badge tone={job.status === 'PUBLISHED' ? 'success' : job.status === 'CLOSED' ? 'danger' : 'warning'}>
                        {job.status.toLowerCase()}
                      </Badge>
                    </td>
                    <td>
                      {job._count?.applications ? (
                        <Link to={`/recruiter/jobs/${job.id}`}>
                          <strong>{job._count.applications}</strong>
                        </Link>
                      ) : (
                        <span className="muted">0</span>
                      )}
                    </td>
                    <td className="muted">{job._count?.matches ?? 0}</td>
                    <td className="muted">{formatDate(job.createdAt)}</td>
                    <td>
                      <div className="row">
                        <Link to={`/recruiter/jobs/${job.id}`} className="btn btn-secondary btn-sm">
                          Open
                        </Link>
                        {job.status === 'PUBLISHED' ? (
                          <button
                            className="secondary btn-sm"
                            onClick={() => setStatus.mutate({ id: job.id, status: 'CLOSED' })}
                          >
                            Close
                          </button>
                        ) : (
                          <button
                            className="secondary btn-sm"
                            onClick={() => setStatus.mutate({ id: job.id, status: 'PUBLISHED' })}
                          >
                            Publish
                          </button>
                        )}
                      </div>
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
