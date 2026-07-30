import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { taskApi } from '@/api';
import { Badge } from '@/components/ui/Input';
import { formatDate, getTaskAssignee } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/Avatar';
import { Link } from 'react-router-dom';

export default function TaskPreviewPage() {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    taskApi.preview(taskId)
      .then(({ data }) => setTask(data.task))
      .catch((err) => setError(err.response?.data?.detail || 'Task not found'));
  }, [taskId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cu-bg">
        <div className="text-center">
          <p className="text-cu-muted mb-4">{error}</p>
          <Link to="/login" className="text-cu-accent hover:underline text-sm">Sign in to view</Link>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cu-bg text-cu-muted text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cu-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-lg border border-cu-border bg-cu-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="purple">{task.status}</Badge>
          {task.category && <Badge>{task.category}</Badge>}
        </div>
        <h1 className="text-xl font-semibold mb-4">{task.project_name}</h1>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-cu-muted text-xs">Assignee</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <UserAvatar username={getTaskAssignee(task)} size="sm" />
              <span>{getTaskAssignee(task)}</span>
            </div>
          </div>
          <div>
            <span className="text-cu-muted text-xs">Deadline</span>
            <p className="mt-0.5">{formatDate(task.deadline)}</p>
          </div>
        </div>
        {task.description && (
          <p className="text-sm text-cu-muted whitespace-pre-wrap">{task.description}</p>
        )}
        <div className="mt-6 pt-4 border-t border-cu-border">
          <Link to="/login" className="text-sm text-cu-accent hover:underline">
            Sign in for full access →
          </Link>
        </div>
      </div>
    </div>
  );
}
