import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AppIcon, type IconName } from './AppIcon';
import { scoreTone, titleCase } from '../lib/format';
import type { VerificationStatus } from '../lib/types';

/* ---------------------------------------------------------------- surface */

export function Card({
  title,
  icon,
  action,
  children,
  className = '',
  interactive = false,
  accent = false,
}: {
  title?: ReactNode;
  icon?: IconName;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  accent?: boolean;
}) {
  return (
    <section
      className={`card ${interactive ? 'interactive' : ''} ${accent ? 'card-accent' : ''} ${className}`}
    >
      {(title || action) && (
        <header className="card-header">
          {typeof title === 'string' ? (
            <h3 className="mb-0">
              {icon ? <AppIcon name={icon} size={18} /> : null}
              {title}
            </h3>
          ) : (
            title
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/** Counts up to the target once on mount — makes dashboards feel alive. */
function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(0);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // easeOutCubic
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return value;
}

export function Stat({
  label,
  value,
  hint,
  icon,
  suffix,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: IconName;
  suffix?: string;
}) {
  const numeric = typeof value === 'number' ? value : Number(value);
  const animated = useCountUp(Number.isFinite(numeric) ? numeric : 0);

  return (
    <div className="stat">
      {icon ? <AppIcon name={icon} size={17} className="stat-icon" /> : null}
      <div className="value">
        {Number.isFinite(numeric) ? animated : value}
        {suffix ?? ''}
      </div>
      <div className="label">{label}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------- badges */

export function Badge({
  children,
  tone = 'default',
  dot = false,
  icon,
}: {
  children: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  dot?: boolean;
  icon?: IconName;
}) {
  return (
    <span className={`badge ${tone === 'default' ? '' : tone} ${dot ? 'badge-dot' : ''}`}>
      {icon ? <AppIcon name={icon} size={12} strokeWidth={2.4} /> : null}
      {children}
    </span>
  );
}

const VERIFICATION_TONE: Record<VerificationStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  NOT_STARTED: 'default',
  IN_PROGRESS: 'info',
  PENDING_REVIEW: 'warning',
  REJECTED: 'danger',
  VERIFIED: 'success',
  SUSPENDED: 'danger',
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return (
    <Badge tone={VERIFICATION_TONE[status] ?? 'default'} icon={status === 'VERIFIED' ? 'check' : undefined} dot={status !== 'VERIFIED'}>
      {status === 'VERIFIED' ? 'Verified' : titleCase(status)}
    </Badge>
  );
}

export function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden>
      {initials || '?'}
    </div>
  );
}

/* --------------------------------------------------------------- progress */

/* Each tone runs from a deeper shade into a lighter one of the same hue, so the
   arc reads as one colour with depth rather than as two colours. */
const RING_STOPS: Record<'success' | 'warning' | 'danger', [string, string]> = {
  success: ['#0b6544', '#2fb37c'],
  warning: ['#96450a', '#e0912c'],
  danger: ['#9e2233', '#e0596d'],
};

export function ScoreRing({ score, label = 'ATS score', size = 116 }: { score: number; label?: string; size?: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const tone = scoreTone(clamped);
  const [from, to] = RING_STOPS[tone as 'success' | 'warning' | 'danger'] ?? RING_STOPS.success;
  /* An SVG gradient is referenced by id, so two rings on one page need two ids. */
  const gradientId = `ring-${useId().replace(/:/g, '')}`;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className="score-ring"
      style={{ width: size, height: size, ['--ring-circumference' as string]: `${circumference}` }}
      role="img"
      aria-label={`${label}: ${clamped} out of 100`}
    >
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle className="track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <circle
          className="value-arc"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke={`url(#${gradientId})`}
          style={{ strokeDashoffset: circumference - (circumference * clamped) / 100 }}
        />
      </svg>
      <div className="score-content">
        <div className="score-number">{clamped}</div>
        <div className="score-label">{label}</div>
      </div>
    </div>
  );
}

export function Progress({ value, tone }: { value: number; tone?: 'accent' | 'warning' | 'danger' }) {
  const clamped = Math.max(0, Math.min(100, value));
  const resolved = tone ?? (clamped >= 75 ? 'accent' : clamped >= 50 ? 'warning' : 'danger');
  return (
    <div
      className={`progress ${resolved === 'accent' ? '' : resolved}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div style={{ width: `${clamped}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ forms */

export function Field({
  label,
  error,
  hint,
  children,
  required,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="field">
      <label>
        {label}
        {required && <span style={{ color: 'var(--danger)' }}> *</span>}
      </label>
      {children}
      {hint && !error && <div className="hint">{hint}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

/* --------------------------------------------------------------- feedback */

const ALERT_ICON: Record<string, IconName> = {
  info: 'info',
  success: 'check',
  warning: 'warning',
  danger: 'warning',
};

export function Alert({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  children: ReactNode;
}) {
  return (
    <div className={`alert ${tone}`}>
      <AppIcon name={ALERT_ICON[tone]} size={18} className="alert-icon" />
      <div>{children}</div>
    </div>
  );
}

export function Empty({
  title,
  hint,
  action,
  icon = 'info',
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  icon?: IconName;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <AppIcon name={icon} size={26} />
      </div>
      <h4>{title}</h4>
      {hint && <p style={{ maxWidth: 420, margin: '0 auto 14px' }}>{hint}</p>}
      {action}
    </div>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="row" style={{ padding: 28, justifyContent: 'center', color: 'var(--text-3)' }}>
      <span className="spinner" /> {label}
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card">
      <div className="skeleton" style={{ width: '45%', height: 18, marginBottom: 14 }} />
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="skeleton"
          style={{ width: `${90 - index * 12}%`, marginBottom: 9 }}
        />
      ))}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="row between mt-2">
      <button className="secondary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <AppIcon name="back" size={15} /> Previous
      </button>
      <span className="muted" style={{ fontSize: 13 }}>
        Page <strong>{page}</strong> of {totalPages}
      </span>
      <button className="secondary btn-sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next <AppIcon name="forward" size={15} />
      </button>
    </div>
  );
}

/**
 * A dialog over the whole viewport.
 *
 * It renders into `document.body` rather than where it is written. `position:
 * fixed` is only relative to the viewport while no ancestor is a containing
 * block for it, and a transform, filter or animated transform on any ancestor
 * makes one — at which point the overlay is measured against that ancestor and,
 * if it clips, trapped inside it. Cards here do exactly that: they lift on hover
 * and clip their overflow, so a dialog opened from a button inside one appeared
 * inside the card. Portalling puts the dialog beyond the reach of all of it.
 */
export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* The page behind must not scroll while a dialog owns the screen. */
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="card modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="card-header">
          <h3 className="mb-0">{title}</h3>
          <button className="ghost" onClick={onClose} aria-label="Close">
            <AppIcon name="close" size={18} />
          </button>
        </div>
        {children}
        {footer && <div className="row mt-2" style={{ justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export { AppIcon };
export type { IconName };
