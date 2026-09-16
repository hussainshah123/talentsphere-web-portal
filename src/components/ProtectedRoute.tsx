import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Loading } from './ui';
import type { UserRole } from '../lib/types';

export function ProtectedRoute({
  roles,
  children,
}: {
  roles?: UserRole[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading label="Checking your session…" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return <>{children}</>;
}

export function homeFor(role: UserRole): string {
  if (role === 'RECRUITER') return '/recruiter';
  if (role === 'ADMIN' || role === 'VERIFICATION_OFFICER') return '/admin';
  return '/dashboard';
}
