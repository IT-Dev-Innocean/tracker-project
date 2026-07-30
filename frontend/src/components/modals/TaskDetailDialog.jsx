import { useState, useEffect } from 'react';
import { DialogRoot, DialogContent } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea, Select, Badge } from '@/components/ui/Input';
import { UserAvatar } from '@/components/ui/Avatar';
import { useUIStore } from '@/stores/uiStore';
import { useBoardStore } from '@/stores/boardStore';
import { taskApi } from '@/api';
import { formatDate, formatDateTime, getTaskAssignee } from '@/lib/utils';
import { Trash2, Plus, Check } from 'lucide-react';

export default function TaskDetailDialog() {
  const { selectedTaskId, closeTask, showToast } = useUIStore();
  const { columns, categories, refreshTasks, updateTaskInList, removeTaskFromList } = useBoardStore();
  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('details');

  useEffect(() => {
    if (!selectedTaskId) return;
    loadTask();
  }, [selectedTaskId]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const [taskRes, subRes, comRes] = await Promise.all([
        taskApi.get(selectedTaskId),
        taskApi.getSubtasks(selectedTaskId),
        taskApi.getComments(selectedTaskId),
      ]);
      setTask(taskRes.data.task);
      setEditForm(taskRes.data.task);
      setSubtasks(subRes.data.subtasks || []);
      setComments(comRes.data.comments || []);
    } catch {
      showToast('Failed to load task', 'error');
      closeTask();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await taskApi.updateStatus(task.id, status);
      setTask((t) => ({ ...t, status }));
      updateTaskInList(task.id, { status });
      showToast('Status updated', 'success');
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleSave = async () => {
    try {
      await taskApi.updateDetails(task.id, {
        project_name: editForm.project_name,
        requester: editForm.requester,
        category: editForm.category,
        description: editForm.description,
        start_date: editForm.start_date,
        deadline: editForm.deadline,
        impact: editForm.impact,
        status: editForm.status,
      });
      setTask(editForm);
      updateTaskInList(task.id, editForm);
      setIsEditing(false);
      showToast('Task updated', 'success');
    } catch {
      showToast('Failed to update task', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskApi.delete(task.id);
      removeTaskFromList(task.id);
      closeTask();
      showToast('Task deleted', 'success');
    } catch {
      showToast('Failed to delete task', 'error');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await taskApi.addComment(task.id, newComment.trim());
      setNewComment('');
      const { data } = await taskApi.getComments(task.id);
      setComments(data.comments || []);
    } catch {
      showToast('Failed to add comment', 'error');
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    try {
      await taskApi.addSubtask(task.id, newSubtask.trim());
      setNewSubtask('');
      const { data } = await taskApi.getSubtasks(task.id);
      setSubtasks(data.subtasks || []);
    } catch {
      showToast('Failed to add subtask', 'error');
    }
  };

  const toggleSubtask = async (st) => {
    try {
      await taskApi.updateSubtask(st.id, { is_done: st.is_done ? 0 : 1 });
      setSubtasks((prev) =>
        prev.map((s) => (s.id === st.id ? { ...s, is_done: st.is_done ? 0 : 1 } : s))
      );
    } catch {
      showToast('Failed to update subtask', 'error');
    }
  };

  if (!selectedTaskId) return null;

  return (
    <DialogRoot open={!!selectedTaskId} onOpenChange={(o) => !o && closeTask()}>
      <DialogContent className="max-w-2xl" title={loading ? 'Loading...' : task?.project_name}>
        {task && (
          <div className="mt-2">
            {/* Status bar */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-auto text-xs"
              >
                {columns.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
              {task.impact && <Badge variant={task.impact === 'High' ? 'red' : task.impact === 'Medium' ? 'yellow' : 'green'}>{task.impact}</Badge>}
              {task.category && <Badge variant="purple">{task.category}</Badge>}
              <div className="ml-auto flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-cu-border mb-4">
              {['details', 'subtasks', 'comments'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-2 text-sm capitalize transition-colors ${tab === t ? 'text-cu-text border-b-2 border-cu-accent -mb-px' : 'text-cu-muted hover:text-cu-text'}`}
                >
                  {t} {t === 'subtasks' && subtasks.length > 0 && `(${subtasks.length})`}
                  {t === 'comments' && comments.length > 0 && `(${comments.length})`}
                </button>
              ))}
            </div>

            {tab === 'details' && (
              <div className="space-y-3">
                {isEditing ? (
                  <>
                    <div><Label>Task Name</Label><Input value={editForm.project_name} onChange={(e) => setEditForm({ ...editForm, project_name: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Category</Label><Select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</Select></div>
                      <div><Label>Impact</Label><Select value={editForm.impact} onChange={(e) => setEditForm({ ...editForm, impact: e.target.value })}>{['Low','Medium','High'].map(i => <option key={i}>{i}</option>)}</Select></div>
                    </div>
                    <div><Label>Assignee</Label><Input value={editForm.requester} onChange={(e) => setEditForm({ ...editForm, requester: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Start</Label><Input type="date" value={editForm.start_date?.split(' ')[0] || ''} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} /></div>
                      <div><Label>Deadline</Label><Input type="date" value={editForm.deadline?.split(' ')[0] || ''} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} /></div>
                    </div>
                    <div><Label>Description</Label><Textarea value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={4} /></div>
                    <Button onClick={handleSave}>Save Changes</Button>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-cu-muted text-xs">Assignee</span><div className="flex items-center gap-1.5 mt-0.5"><UserAvatar username={getTaskAssignee(task)} size="sm" /><span>{getTaskAssignee(task)}</span></div></div>
                      <div><span className="text-cu-muted text-xs">Requester</span><p className="mt-0.5">{task.requester || '—'}</p></div>
                      <div><span className="text-cu-muted text-xs">Start Date</span><p className="mt-0.5">{formatDate(task.start_date)}</p></div>
                      <div><span className="text-cu-muted text-xs">Deadline</span><p className="mt-0.5">{formatDate(task.deadline)}</p></div>
                      <div><span className="text-cu-muted text-xs">Priority</span><p className="mt-0.5 capitalize">{task.priority_str || task.priority_lvl || '—'}</p></div>
                      <div><span className="text-cu-muted text-xs">Created</span><p className="mt-0.5">{formatDateTime(task.timestamp)}</p></div>
                    </div>
                    {task.description && (
                      <div className="mt-3"><span className="text-cu-muted text-xs">Description</span><p className="mt-1 text-sm whitespace-pre-wrap">{task.description}</p></div>
                    )}
                  </>
                )}
              </div>
            )}

            {tab === 'subtasks' && (
              <div className="space-y-2">
                {subtasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2 group">
                    <button onClick={() => toggleSubtask(st)} className={`h-4 w-4 rounded border flex items-center justify-center ${st.is_done ? 'bg-cu-accent border-cu-accent' : 'border-cu-border'}`}>
                      {st.is_done ? <Check className="h-3 w-3 text-white" /> : null}
                    </button>
                    <span className={`text-sm flex-1 ${st.is_done ? 'line-through text-cu-muted' : ''}`}>{st.task_name}</span>
                    {st.assignee && <span className="text-xs text-cu-muted">@{st.assignee}</span>}
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Input value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} placeholder="Add subtask..." className="flex-1" onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()} />
                  <Button size="sm" onClick={handleAddSubtask}><Plus className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            )}

            {tab === 'comments' && (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <UserAvatar username={c.username} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{c.username}</span>
                        <span className="text-[10px] text-cu-muted">{formatDateTime(c.timestamp)}</span>
                      </div>
                      <p className="text-sm mt-0.5">{c.text}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 mt-3">
                  <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." className="flex-1" onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
                  <Button size="sm" onClick={handleAddComment}>Send</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </DialogRoot>
  );
}
