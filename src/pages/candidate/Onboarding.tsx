import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { Alert, Card, Field, Loading, Progress } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { CandidateProfile } from '../../lib/types';

const STEPS = ['About you', 'Experience & education', 'Skills & preferences', 'CV upload', 'Verification'];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['candidate-profile'],
    queryFn: async () => (await api.get<CandidateProfile>('/candidates/me')).data,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });

  if (isLoading || !profile) return <Loading />;

  return (
    <div className="page" style={{ margin: '0 auto' }}>
      <h1>Set up your profile</h1>
      <p className="muted">
        Five short steps. Your profile only becomes visible to companies after you pass the verification checklist.
      </p>

      <div className="stepper">
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            className={`step ${index === step ? 'active' : index < step ? 'done' : ''}`}
            onClick={() => setStep(index)}
            style={{ background: 'none' }}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      <Progress value={profile.completenessDetail.score} />

      <div className="mt-2">
        {step === 0 && <BasicsStep profile={profile} onDone={() => { void invalidate(); setStep(1); }} />}
        {step === 1 && <HistoryStep profile={profile} onDone={() => { void invalidate(); setStep(2); }} />}
        {step === 2 && <SkillsStep profile={profile} onDone={() => { void invalidate(); setStep(3); }} />}
        {step === 3 && <CvStep onDone={() => { void invalidate(); setStep(4); }} />}
        {step === 4 && (
          <Card title="You are ready for verification">
            {!user?.emailVerified && (
              <Alert tone="warning">
                Your email is not verified yet — that is a required check. Open the verification center for the full
                list.
              </Alert>
            )}
            <p>
              Head to the verification center to confirm your information is accurate and submit your profile. Once
              every required check passes, your profile goes live with a verified badge.
            </p>
            <div className="row">
              <button onClick={() => navigate('/verification')}>Open verification center</button>
              <button className="secondary" onClick={() => navigate('/dashboard')}>
                Go to dashboard
              </button>
            </div>
          </Card>
        )}
      </div>

      <div className="row between mt-2">
        <button className="secondary" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>
          Back
        </button>
        <button
          className="secondary"
          onClick={() => {
            if (step === STEPS.length - 1) {
              navigate('/dashboard');
              toast.push('You can finish your profile any time from the dashboard.');
            } else {
              setStep((value) => value + 1);
            }
          }}
        >
          {step === STEPS.length - 1 ? 'Finish later' : 'Skip this step'}
        </button>
      </div>
    </div>
  );
}

function BasicsStep({ profile, onDone }: { profile: CandidateProfile; onDone: () => void }) {
  const toast = useToast();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      fullName: profile.fullName,
      headline: profile.headline ?? '',
      bio: profile.bio ?? '',
      country: profile.country ?? '',
      city: profile.city ?? '',
      currentTitle: profile.currentTitle ?? '',
      industry: profile.industry ?? '',
      experienceYears: profile.experienceYears?.toString() ?? '0',
    },
  });

  const save = useMutation({
    mutationFn: async (values: Record<string, string>) =>
      (await api.patch('/candidates/me', {
        ...values,
        experienceYears: Number(values.experienceYears) || 0,
      })).data,
    onSuccess: onDone,
    onError: (error) => toast.error(errorMessage(error, 'Could not save')),
  });

  return (
    <Card title="About you">
      <form onSubmit={handleSubmit((values) => save.mutate(values as Record<string, string>))}>
        <div className="grid cols-2">
          <Field label="Full name" required>
            <input {...register('fullName', { required: true })} />
          </Field>
          <Field label="Professional headline">
            <input placeholder="Senior Backend Engineer · Node.js" {...register('headline')} />
          </Field>
        </div>
        <Field label="Summary" hint="Minimum 40 characters">
          <textarea rows={4} {...register('bio')} />
        </Field>
        <div className="grid cols-4">
          <Field label="Country">
            <input {...register('country')} />
          </Field>
          <Field label="City">
            <input {...register('city')} />
          </Field>
          <Field label="Current title">
            <input {...register('currentTitle')} />
          </Field>
          <Field label="Years of experience">
            <input type="number" step="0.5" min={0} {...register('experienceYears')} />
          </Field>
        </div>
        <Field label="Industry">
          <input {...register('industry')} />
        </Field>
        <button type="submit" disabled={save.isPending}>
          Save and continue
        </button>
      </form>
    </Card>
  );
}

function HistoryStep({ profile, onDone }: { profile: CandidateProfile; onDone: () => void }) {
  const toast = useToast();
  const experience = useForm({
    defaultValues: { title: '', company: '', startDate: '', endDate: '', isCurrent: true, description: '' },
  });
  const education = useForm({ defaultValues: { degree: '', institute: '', endDate: '' } });

  const addExperience = useMutation({
    mutationFn: async (values: Record<string, unknown>) => (await api.post('/candidates/me/experiences', values)).data,
    onSuccess: () => {
      experience.reset();
      toast.success('Role added');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not add the role')),
  });

  const addEducation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => (await api.post('/candidates/me/educations', values)).data,
    onSuccess: () => {
      education.reset();
      toast.success('Education added');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not add the education entry')),
  });

  return (
    <>
      <Card title={`Work experience (${profile.workExperiences.length} added)`}>
        <form
          onSubmit={experience.handleSubmit((values) =>
            addExperience.mutate({
              title: values.title,
              company: values.company,
              startDate: new Date(values.startDate).toISOString(),
              endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
              isCurrent: values.isCurrent,
              description: values.description || undefined,
            }),
          )}
        >
          <div className="grid cols-2">
            <Field label="Job title" required>
              <input {...experience.register('title', { required: true })} />
            </Field>
            <Field label="Company" required>
              <input {...experience.register('company', { required: true })} />
            </Field>
            <Field label="Start date" required>
              <input type="date" {...experience.register('startDate', { required: true })} />
            </Field>
            <Field label="End date">
              <input type="date" {...experience.register('endDate')} />
            </Field>
          </div>
          <Field label="Key achievements" hint="Quantify results — it lifts your ATS score too.">
            <textarea rows={3} {...experience.register('description')} />
          </Field>
          <button type="submit" disabled={addExperience.isPending}>
            Add role
          </button>
        </form>
      </Card>

      <Card title={`Education (${profile.educations.length} added)`}>
        <form
          onSubmit={education.handleSubmit((values) =>
            addEducation.mutate({
              degree: values.degree,
              institute: values.institute,
              endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
            }),
          )}
        >
          <div className="grid cols-3">
            <Field label="Degree" required>
              <input {...education.register('degree', { required: true })} />
            </Field>
            <Field label="Institute" required>
              <input {...education.register('institute', { required: true })} />
            </Field>
            <Field label="Graduation date">
              <input type="date" {...education.register('endDate')} />
            </Field>
          </div>
          <button type="submit" disabled={addEducation.isPending}>
            Add education
          </button>
        </form>
      </Card>

      <button className="mt-2" onClick={onDone}>
        Continue
      </button>
    </>
  );
}

function SkillsStep({ profile, onDone }: { profile: CandidateProfile; onDone: () => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [skills, setSkills] = useState(profile.skills.map((entry) => entry.skill.name));
  const [titles, setTitles] = useState((profile.preferences?.preferredTitles ?? []).join(', '));
  const [locations, setLocations] = useState((profile.preferences?.preferredLocations ?? []).join(', '));
  const [salaryMin, setSalaryMin] = useState(profile.salaryMin?.toString() ?? '');
  const [salaryMax, setSalaryMax] = useState(profile.salaryMax?.toString() ?? '');

  const addSkill = useMutation({
    mutationFn: async (skillName: string) =>
      (await api.post('/candidates/me/skills', { name: skillName, proficiency: 'ADVANCED', yearsExperience: 2 })).data,
    onSuccess: (_result, skillName) => {
      setSkills((current) => [...current, skillName]);
      setName('');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not add the skill')),
  });

  const savePreferences = useMutation({
    mutationFn: async () => {
      await api.put('/candidates/me/preferences', {
        preferredTitles: titles.split(',').map((item) => item.trim()).filter(Boolean),
        preferredLocations: locations.split(',').map((item) => item.trim()).filter(Boolean),
      });
      if (salaryMin || salaryMax) {
        await api.patch('/candidates/me', {
          salaryMin: salaryMin ? Number(salaryMin) : undefined,
          salaryMax: salaryMax ? Number(salaryMax) : undefined,
        });
      }
    },
    onSuccess: onDone,
    onError: (error) => toast.error(errorMessage(error, 'Could not save preferences')),
  });

  return (
    <Card title="Skills & preferences">
      <div className="chip-row">
        {skills.map((skill) => (
          <span key={skill} className="chip">
            {skill}
          </span>
        ))}
        {skills.length === 0 && <span className="muted">Add at least three skills.</span>}
      </div>
      <div className="row mt-2">
        <input
          style={{ maxWidth: 260 }}
          placeholder="e.g. TypeScript"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button type="button" disabled={!name.trim() || addSkill.isPending} onClick={() => addSkill.mutate(name.trim())}>
          Add skill
        </button>
      </div>

      <div className="grid cols-2 mt-2">
        <Field label="Preferred roles" hint="Comma separated">
          <input value={titles} onChange={(event) => setTitles(event.target.value)} />
        </Field>
        <Field label="Preferred locations" hint="Comma separated">
          <input value={locations} onChange={(event) => setLocations(event.target.value)} />
        </Field>
        <Field label="Expected salary (min)">
          <input type="number" value={salaryMin} onChange={(event) => setSalaryMin(event.target.value)} />
        </Field>
        <Field label="Expected salary (max)">
          <input type="number" value={salaryMax} onChange={(event) => setSalaryMax(event.target.value)} />
        </Field>
      </div>

      <button onClick={() => savePreferences.mutate()} disabled={savePreferences.isPending}>
        Save and continue
      </button>
    </Card>
  );
}

function CvStep({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return (await api.post('/candidates/me/cv', form)).data;
    },
    onSuccess: () => {
      setStatus('Uploaded. ATS analysis is running in the background.');
      toast.success('CV uploaded');
    },
    onError: (error) => toast.error(errorMessage(error, 'Upload failed')),
  });

  return (
    <Card title="Upload your CV">
      <p className="muted">
        PDF, DOC or DOCX up to 10MB. We extract the text, score it for ATS compatibility and can pre-fill your
        profile from it. A parsed CV is a required verification check.
      </p>
      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload.mutate(file);
        }}
      />
      <div className="row">
        <button onClick={() => fileInput.current?.click()} disabled={upload.isPending}>
          {upload.isPending ? 'Uploading…' : 'Choose file'}
        </button>
        <button className="secondary" onClick={onDone}>
          Continue
        </button>
      </div>
      {status && <Alert tone="success">{status}</Alert>}
    </Card>
  );
}
