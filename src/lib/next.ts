/**
 * Where to send someone once they have signed in or signed up.
 *
 * The value arrives from a query string, so it is attacker-controlled: only an
 * ordinary in-app path is allowed through. Anything absolute, protocol-relative
 * or backslashed would be an open redirect, and the auth pages are exactly the
 * place a phishing link would aim at.
 */
export function safeNext(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/')) return null;
  /* "//evil.test" and "/\evil.test" both leave the site. */
  if (value.startsWith('//') || value.startsWith('/\\')) return null;
  /* Bouncing back to an auth page would loop. */
  if (/^\/(login|register|verify-email|forgot-password|reset-password)\b/.test(value)) return null;
  return value;
}

/** Appends a return path to an auth URL, skipping it when there is nothing to return to. */
export function withNext(path: string, next: string | null | undefined): string {
  const safe = safeNext(next);
  if (!safe) return path;
  return `${path}${path.includes('?') ? '&' : '?'}next=${encodeURIComponent(safe)}`;
}
