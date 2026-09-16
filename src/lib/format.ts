export function formatDate(value: string | null | undefined, withTime = false): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function formatMonth(value: string | null | undefined): string {
  if (!value) return 'Present';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Present';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

export function relativeTime(value: string | null | undefined): string {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function formatSalary(
  range: { min: number | null; max: number | null; currency: string } | null | undefined,
): string {
  if (!range || (range.min === null && range.max === null)) return 'Not disclosed';
  const format = (amount: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: range.currency || 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  if (range.min !== null && range.max !== null) return `${format(range.min)} – ${format(range.max)}`;
  return format((range.min ?? range.max) as number);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function scoreTone(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 75) return 'success';
  if (score >= 50) return 'warning';
  return 'danger';
}
