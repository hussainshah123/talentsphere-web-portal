import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { Alert, Card, Field, Modal } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export default function AccountSettings() {
  const { user, logout, refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const changePassword = useMutation({
    mutationFn: async () => (await api.post('/auth/change-password', { currentPassword, newPassword })).data,
    onSuccess: () => {
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not change your password')),
  });

  const requestPhoneOtp = useMutation({
    mutationFn: async () => (await api.post('/auth/request-otp', { purpose: 'PHONE_VERIFICATION' })).data,
    onSuccess: () => toast.success('Verification code sent to your phone'),
    onError: (error) => toast.error(errorMessage(error, 'Could not send the code')),
  });

  const verifyPhone = useMutation({
    mutationFn: async () => (await api.post('/auth/verify-phone', { code: phoneCode })).data,
    onSuccess: async () => {
      toast.success('Phone verified');
      setPhoneCode('');
      await refreshUser();
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not verify that code')),
  });

  const deleteAccount = useMutation({
    mutationFn: async () => (await api.delete('/candidates/me')).data,
    onSuccess: async () => {
      toast.success('Account deleted');
      await logout();
      navigate('/');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not delete the account')),
  });

  if (!user) return null;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Account settings</h1>
          <p className="muted mb-0">Sign-in details, verification of contact channels and account deletion.</p>
        </div>
      </div>

      <Card title="Account">
        <table>
          <tbody>
            <tr>
              <td className="muted">Email</td>
              <td>
                {user.email}{' '}
                <span className={`badge ${user.emailVerified ? 'success' : 'warning'}`}>
                  {user.emailVerified ? 'verified' : 'not verified'}
                </span>
              </td>
            </tr>
            <tr>
              <td className="muted">Phone</td>
              <td>
                {user.phone ?? '—'}{' '}
                {user.phone && (
                  <span className={`badge ${user.phoneVerified ? 'success' : 'warning'}`}>
                    {user.phoneVerified ? 'verified' : 'not verified'}
                  </span>
                )}
              </td>
            </tr>
            <tr>
              <td className="muted">Role</td>
              <td>{user.role.toLowerCase().replace('_', ' ')}</td>
            </tr>
          </tbody>
        </table>
      </Card>

      {user.phone && !user.phoneVerified && (
        <Card title="Verify your phone">
          <p className="muted">
            Phone verification is an optional verification check that increases your verification score.
          </p>
          <div className="row wrap">
            <button className="secondary" onClick={() => requestPhoneOtp.mutate()}>
              Send code
            </button>
            <input
              style={{ maxWidth: 160 }}
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={phoneCode}
              onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, ''))}
            />
            <button disabled={phoneCode.length !== 6} onClick={() => verifyPhone.mutate()}>
              Verify phone
            </button>
          </div>
        </Card>
      )}

      <Card title="Change password">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            changePassword.mutate();
          }}
        >
          <div className="grid cols-2">
            <Field label="Current password" required>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </Field>
            <Field label="New password" hint="At least 8 characters" required>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                required
              />
            </Field>
          </div>
          <button type="submit" disabled={changePassword.isPending}>
            Update password
          </button>
        </form>
      </Card>

      {user.role === 'CANDIDATE' && (
        <Card title="Delete account">
          <Alert tone="warning">
            Deleting removes your profile from search, revokes recruiter access and marks your files for deletion.
            Audit records of verification decisions are retained as required.
          </Alert>
          <button className="danger" onClick={() => setDeleteOpen(true)}>
            Delete my account
          </button>
        </Card>
      )}

      {deleteOpen && (
        <Modal
          title="Delete your account?"
          onClose={() => setDeleteOpen(false)}
          footer={
            <>
              <button className="secondary" onClick={() => setDeleteOpen(false)}>
                Keep my account
              </button>
              <button className="danger" onClick={() => deleteAccount.mutate()} disabled={deleteAccount.isPending}>
                Yes, delete it
              </button>
            </>
          }
        >
          <p>This cannot be undone from the app. Your profile stops appearing in candidate search immediately.</p>
        </Modal>
      )}
    </>
  );
}
