import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Alert, Field } from '../../components/ui';
import { errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import AuthLayout from './AuthLayout';

const schema = z.object({
  fullName: z.string().min(2, 'Tell us your full name'),
  email: z.string().email('Enter a valid email address'),
  phone: z
    .string()
    .optional()
    .refine((value) => !value || /^\+?[\d\s-]{6,20}$/.test(value), 'Enter a valid phone number'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .regex(/[A-Za-z]/, 'Include a letter')
    .regex(/\d/, 'Include a number'),
  role: z.enum(['CANDIDATE', 'RECRUITER']),
  acceptedTerms: z.literal(true, { message: 'You must accept the terms and privacy policy' }),
});

type FormValues = z.input<typeof schema>;

export default function Register() {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: params.get('role') === 'RECRUITER' ? 'RECRUITER' : 'CANDIDATE',
    },
  });

  const role = watch('role');

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const user = await signUp({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone || undefined,
        role: values.role,
        acceptedTerms: true,
      });
      navigate(user.role === 'RECRUITER' ? '/recruiter/onboarding' : '/verify-email', { replace: true });
    } catch (caught) {
      setError(errorMessage(caught, 'Could not create your account'));
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Candidates build a verified profile. Companies get access after company verification."
      footer={
        <p className="muted">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <form onSubmit={onSubmit} noValidate>
        <Field label="I am a" required>
          <select {...register('role')}>
            <option value="CANDIDATE">Candidate looking for work</option>
            <option value="RECRUITER">Recruiter hiring for a company</option>
          </select>
        </Field>
        <Field label={role === 'RECRUITER' ? 'Your name' : 'Full name'} error={errors.fullName?.message} required>
          <input autoComplete="name" {...register('fullName')} />
        </Field>
        <Field label="Email" error={errors.email?.message} required>
          <input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field
          label="Phone (optional)"
          error={errors.phone?.message}
          hint="Used for optional phone verification. Never shown to recruiters unless you allow it."
        >
          <input type="tel" autoComplete="tel" {...register('phone')} />
        </Field>
        <Field label="Password" error={errors.password?.message} hint="At least 8 characters with a letter and a number" required>
          <input type="password" autoComplete="new-password" {...register('password')} />
        </Field>
        <label className="checkbox">
          <input type="checkbox" {...register('acceptedTerms')} />
          <span>
            I accept the terms of service and privacy policy, and I understand that my profile is only visible to
            companies after verification.
          </span>
        </label>
        {errors.acceptedTerms && <div className="error" style={{ color: 'var(--danger)', fontSize: 12.5 }}>{errors.acceptedTerms.message}</div>}
        <button type="submit" disabled={isSubmitting} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
