import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { Alert, Field } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import AuthLayout from './AuthLayout';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await api.post('/auth/reset-password', { email, code, password });
      toast.success('Password updated — sign in with your new password');
      navigate('/login', { replace: true });
    } catch (caught) {
      setError(errorMessage(caught, 'Could not reset your password'));
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Enter the code we emailed you together with your new password."
      footer={
        <p className="muted">
          <Link to="/forgot-password">Request a new code</Link>
        </p>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <form onSubmit={submit}>
        <Field label="Email" required>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Field>
        <Field label="Reset code" required>
          <input
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            required
          />
        </Field>
        <Field label="New password" hint="At least 8 characters" required>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </Field>
        <button type="submit" style={{ width: '100%', justifyContent: 'center' }}>
          Update password
        </button>
      </form>
    </AuthLayout>
  );
}
