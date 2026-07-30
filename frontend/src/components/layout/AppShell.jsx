import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import CreateBoardDialog from '@/components/modals/CreateBoardDialog';
import CreateTaskDialog from '@/components/modals/CreateTaskDialog';
import TaskDetailDialog from '@/components/modals/TaskDetailDialog';
import TeamDialog from '@/components/modals/TeamDialog';
import InvitationsDialog from '@/components/modals/InvitationsDialog';
import SettingsDialog from '@/components/modals/SettingsDialog';
import Toast from '@/components/ui/Toast';

export default function AppShell() {
  const init = useAuthStore((s) => s.init);
  const { fetchNotifications, fetchInvitations } = useNotificationStore();

  useEffect(() => {
    init();
    fetchNotifications();
    fetchInvitations();

    const poll = setInterval(() => {
      fetchNotifications();
      fetchInvitations();
    }, 60000);

    const onAuthError = () => {
      window.location.href = '/login';
    };
    window.addEventListener('auth_error', onAuthError);

    return () => {
      clearInterval(poll);
      window.removeEventListener('auth_error', onAuthError);
    };
  }, [init, fetchNotifications, fetchInvitations]);

  return (
    <div className="flex h-screen overflow-hidden bg-cu-bg">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </main>
      <CreateBoardDialog />
      <CreateTaskDialog />
      <TaskDetailDialog />
      <TeamDialog />
      <InvitationsDialog />
      <SettingsDialog />
      <Toast />
    </div>
  );
}
