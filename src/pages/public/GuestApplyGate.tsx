import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppIcon } from '../../components/AppIcon';
import { Modal } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { withNext } from '../../lib/next';
import ApplyButton from '../candidate/ApplyButton';

/**
 * The apply control on a public job.
 *
 * A signed-in candidate gets the real thing — the same ApplyButton the job board
 * behind the login uses, so applying happens on the job they are looking at. A
 * visitor gets the two ways in, each one saying plainly who it is for, and both
 * carrying the job in `next` so they land back here rather than on a dashboard.
 */
export default function GuestApplyGate({
  jobId,
  jobTitle,
  companyName,
  jobOpen = true,
  size = 'sm',
}: {
  jobId: string;
  jobTitle: string;
  companyName?: string;
  jobOpen?: boolean;
  size?: 'sm' | 'lg';
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const buttonClass = size === 'lg' ? 'btn btn-lg btn-shine' : 'btn btn-sm btn-shine';

  /* Signed in and a candidate: this is their own apply button, nothing special. */
  if (user?.role === 'CANDIDATE') {
    return <ApplyButton jobId={jobId} jobOpen={jobOpen} />;
  }

  /* Signed in as anyone else — a recruiter or staff cannot hold an application. */
  if (user) {
    return (
      <span className="muted" style={{ fontSize: 13 }}>
        Applying needs a candidate account
      </span>
    );
  }

  if (!jobOpen) {
    return (
      <span className="muted" style={{ fontSize: 13 }}>
        Not accepting applications
      </span>
    );
  }

  const back = `/browse-jobs/${jobId}`;

  return (
    <>
      <button className={`${buttonClass} lock-btn`} onClick={() => setOpen(true)}>
        <AppIcon name="lock" size={size === 'lg' ? 16 : 14} />
        Sign in to apply
      </button>

      {open && (
        <Modal title="Apply to this job" onClose={() => setOpen(false)}>
          <p className="muted mb-0" style={{ fontSize: 13.5 }}>
            You are applying to
          </p>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
            {jobTitle}
            {companyName ? <span className="muted" style={{ fontWeight: 400 }}> · {companyName}</span> : null}
          </p>
          <p className="muted" style={{ fontSize: 13.5 }}>
            An application carries your profile and your CV, so it needs an account. Pick whichever
            of these you are — either way you come straight back to this job.
          </p>

          {/* Two doors, each labelled with who walks through it. */}
          <div className="auth-choice">
            <Link to={withNext('/login', back)} className="auth-choice-card">
              <span className="auth-choice-icon">
                <AppIcon name="profile" size={18} />
              </span>
              <span>
                <strong>I already have an account</strong>
                <em>Sign in with your email and password</em>
              </span>
              <AppIcon name="forward" size={16} />
            </Link>

            <Link
              to={withNext('/register?role=CANDIDATE', back)}
              className="auth-choice-card primary"
            >
              <span className="auth-choice-icon">
                <AppIcon name="sparkle" size={18} />
              </span>
              <span>
                <strong>I am new here</strong>
                <em>Create a free candidate account — takes a minute</em>
              </span>
              <AppIcon name="forward" size={16} />
            </Link>
          </div>

          <ul className="ticks tight mt-2">
            {[
              'Free for candidates, always',
              'Your phone and email stay private until you release them',
              'Track the application and withdraw it at any time',
            ].map((line) => (
              <li key={line}>
                <AppIcon name="check" size={13} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </>
  );
}
