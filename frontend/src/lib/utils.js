import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.replace(/-/g, '/'));
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.replace(/-/g, '/'));
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isOverdue(deadline, status) {
  if (!deadline) return false;
  const s = (status || '').toLowerCase();
  if (s === 'done' || s === 'rejected') return false;
  const d = new Date(deadline.replace(/-/g, '/'));
  return d < new Date();
}

export function getTaskAssignee(task) {
  if (task.main_assignee) return task.main_assignee;
  if (!task.requester) return 'Unassigned';
  const match = task.requester.match(/@([\w.-]+)/);
  return match ? match[1] : task.requester.split(/[,;]/)[0]?.trim() || 'Unassigned';
}

export function isUserAssigned(task, username) {
  if (!username || !task.requester) return false;
  const re = new RegExp(`@${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w.-])`, 'i');
  return re.test(task.requester) || task.main_assignee === username;
}

export function parseJsonArray(str, fallback = []) {
  if (!str) return fallback;
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export const DEFAULT_COLUMNS = ['Pending', 'In Progress', 'Done', 'Rejected'];
export const DEFAULT_CATEGORIES = [
  'Development',
  'Design',
  'Marketing',
  'Research',
  'Maintenance',
  'Consulting',
  'Other',
];

export const PRIORITY_COLORS = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-cu-muted',
};

export const IMPACT_COLORS = {
  High: 'bg-red-500/20 text-red-400',
  Medium: 'bg-yellow-500/20 text-yellow-400',
  Low: 'bg-green-500/20 text-green-400',
};
