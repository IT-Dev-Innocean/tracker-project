import { useState, useEffect } from 'react';
import TopBar from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select, Badge } from '@/components/ui/Input';
import { timesheetApi } from '@/api';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { formatDate } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

export default function TimesheetPage() {
  const profile = useAuthStore((s) => s.profile);
  const showToast = useUIStore((s) => s.showToast);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', hours_logged: '', description: '', custom_project_name: '', custom_task_name: '' });
  const [selected, setSelected] = useState(new Set());

  const fetchEntries = async () => {
    try {
      const { data } = await timesheetApi.getEntries();
      setEntries(data.entries || []);
    } catch {
      showToast('Failed to load timesheets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await timesheetApi.createEntry({
        date: form.date,
        hours_logged: parseFloat(form.hours_logged),
        description: form.description,
        custom_project_name: form.custom_project_name,
        custom_task_name: form.custom_task_name,
      });
      showToast('Entry created', 'success');
      setShowForm(false);
      setForm({ date: '', hours_logged: '', description: '', custom_project_name: '', custom_task_name: '' });
      fetchEntries();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create entry', 'error');
    }
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    try {
      await timesheetApi.submit([...selected]);
      showToast('Submitted for approval', 'success');
      setSelected(new Set());
      fetchEntries();
    } catch {
      showToast('Failed to submit', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await timesheetApi.deleteEntry(id);
      fetchEntries();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusVariant = { Draft: 'default', Pending: 'yellow', Approved: 'green', Rejected: 'red' };

  return (
    <>
      <TopBar title="Timesheets" showViews={false} showAddTask={false} />
      <div className="flex-1 overflow-auto p-6 scrollbar-thin">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-cu-muted">Log and submit your work hours</p>
            <div className="flex gap-2">
              {selected.size > 0 && (
                <Button size="sm" onClick={handleSubmit}>Submit ({selected.size})</Button>
              )}
              <Button size="sm" onClick={() => setShowForm(!showForm)}>
                <Plus className="h-3.5 w-3.5" /> New Entry
              </Button>
            </div>
          </div>

          {showForm && (
            <form onSubmit={handleCreate} className="rounded-lg border border-cu-border bg-cu-surface p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
                <div><Label>Hours</Label><Input type="number" step="0.5" min="0.5" max="24" value={form.hours_logged} onChange={(e) => setForm({ ...form, hours_logged: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Project</Label><Input value={form.custom_project_name} onChange={(e) => setForm({ ...form, custom_project_name: e.target.value })} /></div>
                <div><Label>Task</Label><Input value={form.custom_task_name} onChange={(e) => setForm({ ...form, custom_task_name: e.target.value })} /></div>
              </div>
              <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <Button type="submit" size="sm">Save Entry</Button>
            </form>
          )}

          {loading ? (
            <p className="text-sm text-cu-muted text-center py-8">Loading...</p>
          ) : (
            <div className="rounded-lg border border-cu-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cu-border bg-cu-surface">
                    <th className="py-2 px-3 w-8"></th>
                    <th className="py-2 px-3 text-left text-xs text-cu-muted">Date</th>
                    <th className="py-2 px-3 text-left text-xs text-cu-muted">Project</th>
                    <th className="py-2 px-3 text-left text-xs text-cu-muted">Hours</th>
                    <th className="py-2 px-3 text-left text-xs text-cu-muted">Status</th>
                    <th className="py-2 px-3 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-cu-border/50 hover:bg-cu-hover/30">
                      <td className="py-2 px-3">
                        {entry.status === 'Draft' && (
                          <input type="checkbox" checked={selected.has(entry.id)} onChange={() => toggleSelect(entry.id)} className="rounded" />
                        )}
                      </td>
                      <td className="py-2 px-3">{formatDate(entry.date)}</td>
                      <td className="py-2 px-3">{entry.custom_project_name || entry.project_name || '—'}</td>
                      <td className="py-2 px-3">{entry.hours_logged}h</td>
                      <td className="py-2 px-3"><Badge variant={statusVariant[entry.status] || 'default'}>{entry.status}</Badge></td>
                      <td className="py-2 px-3">
                        {entry.status === 'Draft' && (
                          <button onClick={() => handleDelete(entry.id)} className="p-1 hover:bg-cu-hover rounded">
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-cu-muted">No timesheet entries yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
