import { createBrowserRouter, RouterProvider, Navigate, useLocation } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import { AdminRoute, PublicRoute } from './ProtectedRoute';
import { LandingPage, LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from '@/pages/AuthPages';
import { HomePage, BoardPage, GlobalPage } from '@/pages/BoardPages';
import TimesheetPage from '@/pages/TimesheetPage';
import NotificationsPage from '@/pages/NotificationsPage';
import TaskPreviewPage from '@/pages/TaskPreviewPage';
import TeamPage from '@/pages/TeamPage';
import AdminPage from '@/pages/AdminPage';
import { useAuthStore } from '@/stores/authStore';

function AppEntry() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    if (location.pathname === '/') return <LandingPage />;
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <AppShell />;
}

const router = createBrowserRouter([
  {
    path: '/task/:taskId',
    element: <TaskPreviewPage />,
  },
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    path: '/',
    element: <AppEntry />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'global', element: <GlobalPage /> },
      { path: 'board/:boardId', element: <BoardPage /> },
      { path: 'timesheets', element: <TimesheetPage /> },
      { path: 'team', element: <TeamPage /> },
      { path: 'admin', element: <AdminRoute><AdminPage /></AdminRoute> },
      { path: 'notifications', element: <NotificationsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
