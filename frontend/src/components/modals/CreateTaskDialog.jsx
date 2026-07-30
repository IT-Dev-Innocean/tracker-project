import { useState } from 'react';
import { DialogRoot, DialogContent } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea, Select } from '@/components/ui/Input';
import { useUIStore } from '@/stores/uiStore';
import { useBoardStore } from '@/stores/boardStore';
import { boardApi } from '@/api';

export default function CreateTaskDialog() {
  const { isCreateTaskOpen, closeCreateTask, showToast } = useUIStore();
  const { selectedBoard, categories, refreshTasks } = useBoardStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    project_name: '',
    requester: '',
    category: categories[0] || 'Other',
    description: '',
    start_date: '',
    deadline: '',
    impact: 'Medium',
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project_name.trim() || !selectedBoard) return;
    setLoading(true);
    try {
      await boardApi.createTask(selectedBoard.id, {
        ...form,
        requester: form.requester || `@${localStorage.getItem('innocean_username')}`,
      });
      showToast('Task created!', 'success');
      closeCreateTask();
      setForm({ project_name: '', requester: '', category: categories[0] || 'Other', description: '', start_date: '', deadline: '', impact: 'Medium' });
      await refreshTasks();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create task', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedBoard || selectedBoard.id === 'global') return null;

  return (
    <DialogRoot open={isCreateTaskOpen} onOpenChange={(o) => !o && closeCreateTask()}>
      <DialogContent title="Add Task" className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div>
            <Label>Task Name *</Label>
            <Input value={form.project_name} onChange={(e) => set('project_name', e.target.value)} placeholder="Task title" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div>
              <Label>Impact</Label>
              <Select value={form.impact} onChange={(e) => set('impact', e.target.value)}>
                {['Low', 'Medium', 'High'].map((i) => <option key={i} value={i}>{i}</option>)}
              </Select>
            </div>
          </div>
          <div>
            <Label>Assignee</Label>
            <Input value={form.requester} onChange={(e) => set('requester', e.target.value)} placeholder="@username" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </div>
            <div>
              <Label>Deadline</Label>
              <Input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Task details..." rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={closeCreateTask}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.project_name.trim()}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </DialogRoot>
  );
}
