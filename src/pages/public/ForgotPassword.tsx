import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Field } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import AuthLayout from './AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (caught) {
      setError(errorMessage(caught, 'Could not start a password reset'));
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We email a 6-digit code if an account exists for that address."
      footer={
        <p className="muted">
          Remembered it? <Link to="/login">Back to sign in</Link>
        </p>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      {sent ? (
        <>
          <Alert tone="success">If that email is registered, a reset code is on its way.</Alert>
          <button onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}>
            I have my code
          </button>
        </>
      ) : (
        <form onSubmit={submit}>
          <Field label="Email" required>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <button type="submit" style={{ width: '100%', justifyContent: 'center' }}>
            Send reset code
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
