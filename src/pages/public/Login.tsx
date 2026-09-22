import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { homeFor } from '../../components/ProtectedRoute';
import { Alert, Field } from '../../components/ui';
import { errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { safeNext, withNext } from '../../lib/next';
import AuthLayout from './AuthLayout';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  /*
   * Two ways to arrive with somewhere to go back to: ?next= (a link that knew
   * where it was sending you, like the apply gate) and the state ProtectedRoute
   * sets when it bounces you off a page you were not signed in for.
   */
  const fromGuard = (location.state as { from?: string } | null)?.from;
  const next = safeNext(params.get('next')) ?? safeNext(fromGuard);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const user = await login(values.email, values.password);
      navigate(next ?? homeFor(user.role), { replace: true });
    } catch (caught) {
      setError(errorMessage(caught, 'Could not sign you in'));
    }
  });

  return (
    <AuthLayout
      title="Sign in"
      subtitle={
        next
          ? 'Sign in and we will take you straight back to where you left off.'
          : 'Use your email and password to access your workspace.'
      }
      footer={
        <p className="muted">
          No account yet? <Link to={withNext('/register', next)}>Create one</Link> ·{' '}
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <form onSubmit={onSubmit} noValidate>
        <Field label="Email" error={errors.email?.message} required>
          <input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message} required>
          <input type="password" autoComplete="current-password" {...register('password')} />
        </Field>
        <button type="submit" disabled={isSubmitting} style={{ width: '100%', justifyContent: 'center' }}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
