import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { isAdmin } from '@/lib/access';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function PublicRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function AdminRoute({ children }) {
  const location = useLocation();
  const {
    isAuthenticated,
    profile,
    isProfileLoading,
    isProfileInitialized,
    init,
  } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !profile && !isProfileLoading) init();
  }, [init, isAuthenticated, isProfileLoading, profile]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isProfileLoading || (!profile && !isProfileInitialized)) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-cu-muted">
        Checking access…
      </div>
    );
  }

  if (!isAdmin(profile)) {
    return <Navigate to="/" replace state={{ forbidden: true }} />;
  }

  return children;
}
