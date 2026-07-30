import { useMemo } from 'react';
import { formatDate, isUserAssigned } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { useBoardStore } from '@/stores/boardStore';
import { useUIStore } from '@/stores/uiStore';
import { LayoutGrid, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export default function HomeDashboard() {
  const username = useAuthStore((s) => s.username);
  const { boards, tasks, isLoading } = useBoardStore();
  const openTask = useUIStore((s) => s.openTask);
  const openCreateBoard = useUIStore((s) => s.openCreateBoard);

  const myTasks = useMemo(() => {
    return (tasks || [])
      .filter((t) => {
        const s = (t.status || '').toLowerCase();
        return s !== 'done' && s !== 'rejected' && isUserAssigned(t, username);
      })
      .sort((a, b) => (a.queue_global_number || 999) - (b.queue_global_number || 999))
      .slice(0, 8);
  }, [tasks, username]);

  const stats = useMemo(() => {
    const active = (tasks || []).filter((t) => {
      const s = (t.status || '').toLowerCase();
      return s !== 'done' && s !== 'rejected';
    });
    const mine = active.filter((t) => isUserAssigned(t, username));
    const overdue = mine.filter((t) => {
      if (!t.deadline) return false;
      return new Date(t.deadline.replace(/-/g, '/')) < new Date();
    });
    return { total: active.length, mine: mine.length, overdue: overdue.length, boards: boards.length };
  }, [tasks, boards, username]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-cu-muted text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold mb-1">Welcome back, {username}</h1>
          <p className="text-sm text-cu-muted">Here's what's happening across your workspace.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active Tasks', value: stats.total, icon: CheckCircle2, color: 'text-blue-400' },
            { label: 'My Tasks', value: stats.mine, icon: Clock, color: 'text-violet-400' },
            { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-red-400' },
            { label: 'Projects', value: stats.boards, icon: LayoutGrid, color: 'text-green-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-lg border border-cu-border bg-cu-surface p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="text-xs text-cu-muted">{label}</span>
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* My top queue */}
        <div className="rounded-lg border border-cu-border bg-cu-surface">
          <div className="flex items-center justify-between px-4 py-3 border-b border-cu-border">
            <h2 className="text-sm font-semibold">My Top Queue</h2>
          </div>
          <div className="divide-y divide-cu-border/50">
            {myTasks.length === 0 ? (
              <p className="px-4 py-6 text-sm text-cu-muted text-center">No active tasks assigned to you</p>
            ) : (
              myTasks.map((task, i) => (
                <button
                  key={task.id}
                  onClick={() => openTask(task.id)}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-cu-hover/40 transition-colors text-left"
                >
                  <span className="text-xs text-cu-muted w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.project_name}</p>
                    <p className="text-xs text-cu-muted">{task.board_name}</p>
                  </div>
                  <Badge variant={task.status === 'In Progress' ? 'blue' : 'default'}>{task.status}</Badge>
                  {task.deadline && (
                    <span className="text-xs text-cu-muted">{formatDate(task.deadline)}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Projects overview */}
        <div className="rounded-lg border border-cu-border bg-cu-surface">
          <div className="flex items-center justify-between px-4 py-3 border-b border-cu-border">
            <h2 className="text-sm font-semibold">Projects</h2>
            <button onClick={openCreateBoard} className="text-xs text-cu-accent hover:underline">
              + New Project
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {boards.slice(0, 6).map((board) => (
              <div
                key={board.id}
                className="rounded-lg border border-cu-border bg-cu-card p-3 hover:border-cu-accent/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <LayoutGrid className="h-4 w-4 text-cu-muted" />
                  <span className="text-sm font-medium truncate">{board.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-cu-muted">
                  <span>{board.done_tasks || 0}/{board.total_tasks || 0} done</span>
                  {board.my_pending > 0 && (
                    <Badge variant="purple">{board.my_pending} pending</Badge>
                  )}
                </div>
                {board.team_preview?.length > 0 && (
                  <div className="flex -space-x-1 mt-2">
                    {board.team_preview.slice(0, 4).map((u) => (
                      <UserAvatar key={u} username={u} size="sm" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
