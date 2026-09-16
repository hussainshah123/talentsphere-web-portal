import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { homeFor } from '../../components/ProtectedRoute';
import { useToast } from '../../components/Toast';
import { Alert, Field } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import AuthLayout from './AuthLayout';

export default function VerifyEmail() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/verify-email', { code, email: email || undefined });
      const me = await refreshUser();
      toast.success('Email verified');
      navigate(me ? homeFor(me.role) : '/login', { replace: true });
    } catch (caught) {
      setError(errorMessage(caught, 'Could not verify that code'));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await api.post('/auth/request-otp', { purpose: 'EMAIL_VERIFICATION' });
      toast.success('A new code is on its way');
    } catch (caught) {
      toast.error(errorMessage(caught, 'Could not send a new code'));
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We sent a 6-digit code to your inbox. Email verification is the first verification check."
      footer={
        <p className="muted">
          Wrong account? <Link to="/login">Sign in with another email</Link>
        </p>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <form onSubmit={submit}>
        {!user && (
          <Field label="Email" required>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
        )}
        <Field label="Verification code" required hint="In development the code is printed in the API log.">
          <input
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            placeholder="123456"
          />
        </Field>
        <button type="submit" disabled={busy || code.length !== 6} style={{ width: '100%', justifyContent: 'center' }}>
          {busy ? 'Verifying…' : 'Verify email'}
        </button>
      </form>
      {user && (
        <button className="ghost mt-1" onClick={resend}>
          Send a new code
        </button>
      )}
    </AuthLayout>
  );
}
