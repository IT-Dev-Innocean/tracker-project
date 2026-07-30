import { formatDate, getTaskAssignee, isOverdue, cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Input';

export default function ListView({ tasks, columns, onTaskClick }) {
  return (
    <div className="flex-1 overflow-auto px-4 pb-4 scrollbar-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cu-border text-left">
            <th className="py-2 px-3 text-xs font-medium text-cu-muted w-[35%]">Task</th>
            <th className="py-2 px-3 text-xs font-medium text-cu-muted">Status</th>
            <th className="py-2 px-3 text-xs font-medium text-cu-muted">Assignee</th>
            <th className="py-2 px-3 text-xs font-medium text-cu-muted">Category</th>
            <th className="py-2 px-3 text-xs font-medium text-cu-muted">Deadline</th>
            <th className="py-2 px-3 text-xs font-medium text-cu-muted">Priority</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const assignee = getTaskAssignee(task);
            const overdue = isOverdue(task.deadline, task.status);
            return (
              <tr
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="border-b border-cu-border/50 hover:bg-cu-hover/40 cursor-pointer transition-colors"
              >
                <td className="py-2.5 px-3 font-medium">{task.project_name}</td>
                <td className="py-2.5 px-3">
                  <Badge variant={task.status === 'Done' ? 'green' : task.status === 'In Progress' ? 'blue' : 'default'}>
                    {task.status}
                  </Badge>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <UserAvatar username={assignee} size="sm" />
                    <span className="text-xs text-cu-muted">{assignee}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-xs text-cu-muted">{task.category || '—'}</td>
                <td className={cn('py-2.5 px-3 text-xs', overdue ? 'text-red-400' : 'text-cu-muted')}>
                  {formatDate(task.deadline)}
                </td>
                <td className="py-2.5 px-3 text-xs text-cu-muted capitalize">
                  {task.priority_lvl || 'normal'}
                </td>
              </tr>
            );
          })}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-cu-muted text-sm">
                No tasks found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
