import { useEffect } from 'react';
import TopBar from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUIStore } from '@/stores/uiStore';
import { useBoardStore } from '@/stores/boardStore';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '@/lib/utils';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, fetchNotifications, markRead, markAllRead } = useNotificationStore();
  const openTask = useUIStore((s) => s.openTask);
  const fetchBoards = useBoardStore((s) => s.fetchBoards);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleClick = async (notif) => {
    if (!notif.is_read) await markRead(notif.id);
    if (notif.related_task_id) {
      openTask(notif.related_task_id);
    } else if (notif.board_id) {
      await fetchBoards();
      navigate(`/board/${notif.board_id}`);
    }
  };

  return (
    <>
      <TopBar title="Notifications" showViews={false} showAddTask={false} />
      <div className="flex-1 overflow-auto p-6 scrollbar-thin">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-cu-muted">{notifications.filter((n) => !n.is_read).length} unread</p>
            <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button>
          </div>
          <div className="space-y-1">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-cu-muted">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`flex items-start gap-3 w-full rounded-lg px-4 py-3 text-left transition-colors hover:bg-cu-hover/40 ${!notif.is_read ? 'bg-cu-accent/5 border border-cu-accent/20' : 'border border-transparent'}`}
                >
                  {!notif.is_read && <div className="h-2 w-2 rounded-full bg-cu-accent mt-1.5 shrink-0" />}
                  <div className={`flex-1 ${notif.is_read ? 'ml-5' : ''}`}>
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-cu-muted mt-0.5">{formatDateTime(notif.timestamp)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
