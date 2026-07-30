import { formatDate, getTaskAssignee, isOverdue, PRIORITY_COLORS, IMPACT_COLORS } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { Flag, MessageSquare, CheckSquare } from 'lucide-react';

export default function TaskCard({ task, onClick, avatarsMap = {} }) {
  const assignee = getTaskAssignee(task);
  const overdue = isOverdue(task.deadline, task.status);

  return (
    <div
      onClick={() => onClick(task)}
      className={cn(
        'group rounded-lg border border-cu-border bg-cu-card p-3 cursor-pointer',
        'hover:border-cu-accent/40 hover:shadow-md transition-all duration-150',
        (task.status === 'Done' || task.status === 'Rejected') && 'opacity-60'
      )}
    >
      <p className="text-sm font-medium text-cu-text leading-snug mb-2 line-clamp-2">
        {task.project_name}
      </p>

      <div className="flex flex-wrap gap-1 mb-2">
        {task.category && (
          <Badge variant="purple">{task.category}</Badge>
        )}
        {task.impact && (
          <span className={cn('text-[10px] rounded px-1.5 py-0.5 font-medium', IMPACT_COLORS[task.impact])}>
            {task.impact}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <UserAvatar
            username={assignee}
            src={avatarsMap[assignee]}
            size="sm"
          />
          {task.deadline && (
            <span className={cn('text-[11px]', overdue ? 'text-red-400' : 'text-cu-muted')}>
              {formatDate(task.deadline)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-cu-muted">
          {task.subtask_total > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <CheckSquare className="h-3 w-3" />
              {task.subtask_done}/{task.subtask_total}
            </span>
          )}
          {task.priority_lvl && task.priority_lvl !== 'normal' && (
            <Flag className={cn('h-3 w-3', PRIORITY_COLORS[task.priority_lvl])} />
          )}
        </div>
      </div>
    </div>
  );
}
