import { useMemo } from 'react';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Input';

export default function CalendarView({ tasks, onTaskClick }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!t.deadline) return;
      const key = t.deadline.split(' ')[0];
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="flex-1 overflow-auto p-4 scrollbar-thin">
      <h2 className="text-sm font-semibold mb-4">{monthName}</h2>
      <div className="grid grid-cols-7 gap-px bg-cu-border rounded-lg overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="bg-cu-surface p-2 text-center text-xs font-medium text-cu-muted">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-cu-bg min-h-[80px]" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTasks = tasksByDate[dateKey] || [];
          const isToday = day === today.getDate();

          return (
            <div
              key={day}
              className={`bg-cu-bg min-h-[80px] p-1.5 ${isToday ? 'ring-1 ring-inset ring-cu-accent' : ''}`}
            >
              <span className={`text-xs ${isToday ? 'text-cu-accent font-bold' : 'text-cu-muted'}`}>
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onTaskClick(t)}
                    className="block w-full text-left text-[10px] truncate rounded px-1 py-0.5 bg-cu-accent/20 text-violet-300 hover:bg-cu-accent/30"
                  >
                    {t.project_name}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-cu-muted">+{dayTasks.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
