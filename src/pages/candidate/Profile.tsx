import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '../../components/Toast';
import { Alert, Card, Field, Loading, Progress } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { formatMonth } from '../../lib/format';
import type { CandidateProfile } from '../../lib/types';

interface ProfileForm {
  fullName: string;
  headline: string;
  bio: string;
  country: string;
  city: string;
  timezone: string;
  currentTitle: string;
  industry: string;
  employmentType: string;
  noticePeriodDays: string;
  availabilityDate: string;
  experienceYears: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  workMode: string;
  openToRelocation: boolean;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  websiteUrl: string;
}

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP'];
const WORK_MODES = ['FLEXIBLE', 'REMOTE', 'HYBRID', 'ONSITE'];
const PROFICIENCIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

export default function Profile() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['candidate-profile'],
    queryFn: async () => (await api.get<CandidateProfile>('/candidates/me')).data,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
    void queryClient.invalidateQueries({ queryKey: ['candidate-dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['verification'] });
  };

  const { register, handleSubmit, reset, formState } = useForm<ProfileForm>();

  useEffect(() => {
    if (!profile) return;
    reset({
      fullName: profile.fullName ?? '',
      headline: profile.headline ?? '',
      bio: profile.bio ?? '',
      country: profile.country ?? '',
      city: profile.city ?? '',
      timezone: profile.timezone ?? '',
      currentTitle: profile.currentTitle ?? '',
      industry: profile.industry ?? '',
      employmentType: profile.employmentType ?? '',
      noticePeriodDays: profile.noticePeriodDays?.toString() ?? '',
      availabilityDate: profile.availabilityDate?.slice(0, 10) ?? '',
      experienceYears: profile.experienceYears?.toString() ?? '0',
      salaryMin: profile.salaryMin?.toString() ?? '',
      salaryMax: profile.salaryMax?.toString() ?? '',
      salaryCurrency: profile.salaryCurrency ?? 'USD',
      workMode: profile.workMode ?? 'FLEXIBLE',
      openToRelocation: profile.openToRelocation ?? false,
      linkedinUrl: profile.linkedinUrl ?? '',
      githubUrl: profile.githubUrl ?? '',
      portfolioUrl: profile.portfolioUrl ?? '',
      websiteUrl: profile.websiteUrl ?? '',
    });
  }, [profile, reset]);

  const saveProfile = useMutation({
    mutationFn: async (values: ProfileForm) => {
      const payload: Record<string, unknown> = {
        fullName: values.fullName,
        headline: values.headline || undefined,
        bio: values.bio || undefined,
        country: values.country || undefined,
        city: values.city || undefined,
        timezone: values.timezone || undefined,
        currentTitle: values.currentTitle || undefined,
        industry: values.industry || undefined,
        employmentType: values.employmentType || undefined,
        noticePeriodDays: values.noticePeriodDays ? Number(values.noticePeriodDays) : undefined,
        availabilityDate: values.availabilityDate ? new Date(values.availabilityDate).toISOString() : undefined,
        experienceYears: values.experienceYears ? Number(values.experienceYears) : undefined,
        salaryMin: values.salaryMin ? Number(values.salaryMin) : undefined,
        salaryMax: values.salaryMax ? Number(values.salaryMax) : undefined,
        salaryCurrency: values.salaryCurrency || undefined,
        workMode: values.workMode || undefined,
        openToRelocation: values.openToRelocation,
        linkedinUrl: values.linkedinUrl || undefined,
        githubUrl: values.githubUrl || undefined,
        portfolioUrl: values.portfolioUrl || undefined,
        websiteUrl: values.websiteUrl || undefined,
      };
      return (await api.patch('/candidates/me', payload)).data;
    },
    onSuccess: () => {
      toast.success('Profile saved');
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save your profile')),
  });

  if (isLoading || !profile) return <Loading />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My profile</h1>
          <p className="muted mb-0">Everything recruiters can see — and the fields verification depends on.</p>
        </div>
        <div style={{ minWidth: 220 }}>
          <div className="row between" style={{ fontSize: 13 }}>
            <span className="muted">Completeness</span>
            <strong>{profile.completenessDetail.score}%</strong>
          </div>
          <Progress value={profile.completenessDetail.score} />
        </div>
      </div>

      {profile.completenessDetail.missing.length > 0 && (
        <Alert tone="info">
          <strong>To reach 100%:</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {profile.completenessDetail.missing.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </Alert>
      )}

      <form onSubmit={handleSubmit((values) => saveProfile.mutate(values))}>
        <Card title="Basic information">
          <div className="grid cols-2">
            <Field label="Full name" required>
              <input {...register('fullName', { required: true })} />
            </Field>
            <Field label="Professional headline" hint="Example: Senior Backend Engineer · Node.js & PostgreSQL">
              <input {...register('headline')} />
            </Field>
          </div>
          <Field label="Summary" hint="At least 40 characters. Say what you do, your focus and what you are looking for.">
            <textarea rows={4} {...register('bio')} />
          </Field>
        </Card>

        <Card title="Location & work preferences">
          <div className="grid cols-3">
            <Field label="Country">
              <input {...register('country')} />
            </Field>
            <Field label="City">
              <input {...register('city')} />
            </Field>
            <Field label="Timezone" hint="Example: Europe/Berlin">
              <input {...register('timezone')} />
            </Field>
          </div>
          <div className="grid cols-3">
            <Field label="Work mode">
              <select {...register('workMode')}>
                {WORK_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Availability date">
              <input type="date" {...register('availabilityDate')} />
            </Field>
            <Field label="Notice period (days)">
              <input type="number" min={0} max={365} {...register('noticePeriodDays')} />
            </Field>
          </div>
          <label className="checkbox">
            <input type="checkbox" {...register('openToRelocation')} />
            <span>I am open to relocation</span>
          </label>
        </Card>

        <Card title="Professional details">
          <div className="grid cols-3">
            <Field label="Current job title">
              <input {...register('currentTitle')} />
            </Field>
            <Field label="Industry">
              <input {...register('industry')} />
            </Field>
            <Field label="Total experience (years)">
              <input type="number" step="0.5" min={0} max={60} {...register('experienceYears')} />
            </Field>
          </div>
          <div className="grid cols-4">
            <Field label="Employment type">
              <select {...register('employmentType')}>
                <option value="">Not set</option>
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Expected salary (min)">
              <input type="number" min={0} {...register('salaryMin')} />
            </Field>
            <Field label="Expected salary (max)">
              <input type="number" min={0} {...register('salaryMax')} />
            </Field>
            <Field label="Currency">
              <input maxLength={3} {...register('salaryCurrency')} />
            </Field>
          </div>
        </Card>

        <Card title="Links">
          <div className="grid cols-2">
            <Field label="LinkedIn">
              <input placeholder="https://linkedin.com/in/…" {...register('linkedinUrl')} />
            </Field>
            <Field label="GitHub">
              <input placeholder="https://github.com/…" {...register('githubUrl')} />
            </Field>
            <Field label="Portfolio">
              <input placeholder="https://…" {...register('portfolioUrl')} />
            </Field>
            <Field label="Personal website">
              <input placeholder="https://…" {...register('websiteUrl')} />
            </Field>
          </div>
        </Card>

        <div className="row mt-2">
          <button type="submit" disabled={saveProfile.isPending || formState.isSubmitting}>
            {saveProfile.isPending ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>

      <SkillsSection profile={profile} onChange={invalidate} />
      <ExperienceSection profile={profile} onChange={invalidate} />
      <EducationSection profile={profile} onChange={invalidate} />
      <PreferencesSection profile={profile} onChange={invalidate} />
    </>
  );
}

function SkillsSection({ profile, onChange }: { profile: CandidateProfile; onChange: () => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [proficiency, setProficiency] = useState('INTERMEDIATE');
  const [years, setYears] = useState('1');

  const add = useMutation({
    mutationFn: async () =>
      (await api.post('/candidates/me/skills', {
        name,
        proficiency,
        yearsExperience: Number(years) || 0,
      })).data,
    onSuccess: () => {
      setName('');
      onChange();
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not add the skill')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/candidates/me/skills/${id}`)).data,
    onSuccess: onChange,
  });

  return (
    <Card title="Skills">
      <div className="chip-row">
        {profile.skills.length === 0 && <span className="muted">No skills yet — add at least three.</span>}
        {profile.skills.map((entry) => (
          <span key={entry.id} className="chip">
            {entry.skill.name}
            <span className="muted">
              · {entry.proficiency.toLowerCase()} · {entry.yearsExperience}y
            </span>
            <button type="button" onClick={() => remove.mutate(entry.id)} aria-label={`Remove ${entry.skill.name}`}>
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="row wrap mt-2">
        <input
          style={{ maxWidth: 220 }}
          placeholder="Add a skill"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <select style={{ maxWidth: 170 }} value={proficiency} onChange={(event) => setProficiency(event.target.value)}>
          {PROFICIENCIES.map((level) => (
            <option key={level} value={level}>
              {level.toLowerCase()}
            </option>
          ))}
        </select>
        <input
          style={{ maxWidth: 110 }}
          type="number"
          min={0}
          max={60}
          value={years}
          onChange={(event) => setYears(event.target.value)}
        />
        <button type="button" disabled={!name.trim() || add.isPending} onClick={() => add.mutate()}>
          Add skill
        </button>
      </div>
    </Card>
  );
}

function ExperienceSection({ profile, onChange }: { profile: CandidateProfile; onChange: () => void }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<{
    company: string;
    title: string;
    location: string;
    description: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
  }>();

  const add = useMutation({
    mutationFn: async (values: Record<string, unknown>) => (await api.post('/candidates/me/experiences', values)).data,
    onSuccess: () => {
      reset();
      setOpen(false);
      onChange();
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not add the experience')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/candidates/me/experiences/${id}`)).data,
    onSuccess: onChange,
  });

  return (
    <Card
      title="Employment history"
      action={
        <button type="button" className="secondary btn-sm" onClick={() => setOpen((value) => !value)}>
          {open ? 'Cancel' : 'Add role'}
        </button>
      }
    >
      {open && (
        <form
          className="mb-0"
          onSubmit={handleSubmit((values) =>
            add.mutate({
              company: values.company,
              title: values.title,
              location: values.location || undefined,
              description: values.description || undefined,
              startDate: new Date(values.startDate).toISOString(),
              endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
              isCurrent: values.isCurrent,
            }),
          )}
        >
          <div className="grid cols-2">
            <Field label="Job title" required>
              <input {...register('title', { required: true })} />
            </Field>
            <Field label="Company" required>
              <input {...register('company', { required: true })} />
            </Field>
            <Field label="Start date" required>
              <input type="date" {...register('startDate', { required: true })} />
            </Field>
            <Field label="End date" hint="Leave empty if this is your current role">
              <input type="date" {...register('endDate')} />
            </Field>
          </div>
          <Field label="What you did" hint="Use bullet points and quantify results — it also improves your ATS score.">
            <textarea rows={3} {...register('description')} />
          </Field>
          <label className="checkbox">
            <input type="checkbox" {...register('isCurrent')} />
            <span>This is my current role</span>
          </label>
          <button type="submit" disabled={add.isPending}>
            Save role
          </button>
        </form>
      )}

      {profile.workExperiences.length === 0 && !open && (
        <p className="muted mb-0">No roles added yet.</p>
      )}
      {profile.workExperiences.map((entry) => (
        <div key={entry.id} style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
          <div className="row between">
            <div>
              <strong>{entry.title}</strong> · {entry.company}
              <div className="muted" style={{ fontSize: 13 }}>
                {formatMonth(entry.startDate)} – {entry.isCurrent ? 'Present' : formatMonth(entry.endDate)}
                {entry.location ? ` · ${entry.location}` : ''}
              </div>
            </div>
            <button type="button" className="ghost btn-sm" onClick={() => remove.mutate(entry.id)}>
              Remove
            </button>
          </div>
          {entry.description && <p className="muted mt-1 mb-0">{entry.description}</p>}
        </div>
      ))}
    </Card>
  );
}

function EducationSection({ profile, onChange }: { profile: CandidateProfile; onChange: () => void }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<{
    institute: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    grade: string;
  }>();

  const add = useMutation({
    mutationFn: async (values: Record<string, unknown>) => (await api.post('/candidates/me/educations', values)).data,
    onSuccess: () => {
      reset();
      setOpen(false);
      onChange();
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not add the education entry')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/candidates/me/educations/${id}`)).data,
    onSuccess: onChange,
  });

  return (
    <Card
      title="Education"
      action={
        <button type="button" className="secondary btn-sm" onClick={() => setOpen((value) => !value)}>
          {open ? 'Cancel' : 'Add education'}
        </button>
      }
    >
      {open && (
        <form
          onSubmit={handleSubmit((values) =>
            add.mutate({
              institute: values.institute,
              degree: values.degree,
              field: values.field || undefined,
              startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
              endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
              grade: values.grade || undefined,
            }),
          )}
        >
          <div className="grid cols-2">
            <Field label="Institute" required>
              <input {...register('institute', { required: true })} />
            </Field>
            <Field label="Degree" required>
              <input {...register('degree', { required: true })} />
            </Field>
            <Field label="Field of study">
              <input {...register('field')} />
            </Field>
            <Field label="Grade / GPA (optional)">
              <input {...register('grade')} />
            </Field>
            <Field label="Start date">
              <input type="date" {...register('startDate')} />
            </Field>
            <Field label="End date">
              <input type="date" {...register('endDate')} />
            </Field>
          </div>
          <button type="submit" disabled={add.isPending}>
            Save education
          </button>
        </form>
      )}

      {profile.educations.length === 0 && !open && <p className="muted mb-0">No education entries yet.</p>}
      {profile.educations.map((entry) => (
        <div key={entry.id} className="row between" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
          <div>
            <strong>{entry.degree}</strong> · {entry.institute}
            <div className="muted" style={{ fontSize: 13 }}>
              {formatMonth(entry.startDate)} – {formatMonth(entry.endDate)}
              {entry.field ? ` · ${entry.field}` : ''}
              {entry.grade ? ` · ${entry.grade}` : ''}
            </div>
          </div>
          <button type="button" className="ghost btn-sm" onClick={() => remove.mutate(entry.id)}>
            Remove
          </button>
        </div>
      ))}
    </Card>
  );
}

function PreferencesSection({ profile, onChange }: { profile: CandidateProfile; onChange: () => void }) {
  const toast = useToast();
  const [titles, setTitles] = useState((profile.preferences?.preferredTitles ?? []).join(', '));
  const [locations, setLocations] = useState((profile.preferences?.preferredLocations ?? []).join(', '));
  const [industries, setIndustries] = useState((profile.preferences?.industries ?? []).join(', '));
  const [relocation, setRelocation] = useState(profile.preferences?.relocationAllowed ?? false);
  const [alerts, setAlerts] = useState(profile.preferences?.jobAlertsEnabled ?? true);

  const save = useMutation({
    mutationFn: async () =>
      (await api.put('/candidates/me/preferences', {
        preferredTitles: split(titles),
        preferredLocations: split(locations),
        industries: split(industries),
        relocationAllowed: relocation,
        jobAlertsEnabled: alerts,
      })).data,
    onSuccess: () => {
      toast.success('Preferences saved');
      onChange();
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save preferences')),
  });

  return (
    <Card title="Job preferences">
      <div className="grid cols-3">
        <Field label="Preferred roles" hint="Comma separated">
          <input value={titles} onChange={(event) => setTitles(event.target.value)} />
        </Field>
        <Field label="Preferred locations" hint="Comma separated">
          <input value={locations} onChange={(event) => setLocations(event.target.value)} />
        </Field>
        <Field label="Preferred industries" hint="Comma separated">
          <input value={industries} onChange={(event) => setIndustries(event.target.value)} />
        </Field>
      </div>
      <label className="checkbox">
        <input type="checkbox" checked={relocation} onChange={(event) => setRelocation(event.target.checked)} />
        <span>I am willing to relocate for the right role</span>
      </label>
      <label className="checkbox">
        <input type="checkbox" checked={alerts} onChange={(event) => setAlerts(event.target.checked)} />
        <span>Send me job alerts that match my preferences</span>
      </label>
      <button type="button" onClick={() => save.mutate()} disabled={save.isPending}>
        Save preferences
      </button>
    </Card>
  );
}

function split(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
