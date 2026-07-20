import React from 'react';

export default function CalendarView({
  calDate,
  setCalDate,
  leaves,
  filteredTasks,
  setSelectedTask,
  currentUser,
  isUserAssigned,
  timelineDrag,
  setTimelineDrag,
  accountStatus,
  selectedBoard,
  isSuperAdmin,
  isTrashHovered,
  dateFormat,
}) {
  const [subView, setSubView] = React.useState('month'); // 'month' | 'week' | 'schedule'
  const [expandedDate, setExpandedDate] = React.useState(null);
  const [selectedLeave, setSelectedLeave] = React.useState(null);
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const formatDatePref = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString.replace(/-/g, '/'));
    if (isNaN(d)) return dateString.split(' ')[0];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (dateFormat === 'DD/MM/YYYY') {
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } else if (dateFormat === 'YYYY-MM-DD') {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else if (dateFormat === 'MMM DD, YYYY') {
      return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
    }
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const grid = [];
  let week = [];
  for (let i = 0; i < firstDay; i++) week.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    grid.push(week);
  }

  // Helper functions for week view
  const getStartOfWeek = (d) => {
    const res = new Date(d);
    const day = res.getDay();
    res.setDate(res.getDate() - day);
    res.setHours(0, 0, 0, 0);
    return res;
  };

  const getWeekDays = (d) => {
    const start = getStartOfWeek(d);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const currentRows = React.useMemo(() => {
    if (subView === 'week') {
      return [getWeekDays(calDate)];
    }
    // month view
    return grid.map(w => w.map(d => d ? new Date(year, month, d) : null));
  }, [subView, calDate, year, month, daysInMonth, firstDay]);

  const parseDate = (d) => {
    if (!d) return null;
    const p = new Date(d.replace(/-/g, '/'));
    if (isNaN(p)) return null;
    p.setHours(0, 0, 0, 0);
    return p;
  };

  const parsedTasks = filteredTasks.map((t) => {
    let start = parseDate(t.start_date || t.timestamp.split(' ')[0]);
    while (true) {
      const dStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(
        start.getDate()
      ).padStart(2, '0')}`;
      const isWeekend = start.getDay() === 0 || start.getDay() === 6;
      const isHoliday = leaves.some(
        (l) => l.leave_date === dStr && (l.leave_type !== 'personal' || isUserAssigned(t, l.username))
      );
      if (isWeekend || isHoliday) start.setDate(start.getDate() + 1);
      else break;
    }

    let end = parseDate(
      (t.status === 'Done' || t.status === 'Rejected') && t.completed_time ? t.completed_time : t.deadline
    );
    if (!end) end = new Date(start);
    if (end < start) end = new Date(start.getTime());

    if (timelineDrag && timelineDrag.task && timelineDrag.task.id === t.id) {
      if (timelineDrag.mode === 'end') {
        end.setDate(end.getDate() + timelineDrag.startOffsetDays);
        if (end < start) end = new Date(start.getTime());
      } else if (timelineDrag.mode === 'start') {
        start.setDate(start.getDate() + timelineDrag.startOffsetDays);
        if (start > end) start = new Date(end.getTime());
      } else if (timelineDrag.mode === 'both') {
        start.setDate(start.getDate() + timelineDrag.startOffsetDays);
        end.setDate(end.getDate() + timelineDrag.startOffsetDays);
      }
    }

    let effectiveEnd = new Date(end);
    while (true) {
      const dStr = `${effectiveEnd.getFullYear()}-${String(effectiveEnd.getMonth() + 1).padStart(2, '0')}-${String(
        effectiveEnd.getDate()
      ).padStart(2, '0')}`;
      const isWeekend = effectiveEnd.getDay() === 0 || effectiveEnd.getDay() === 6;
      const isHoliday = leaves.some(
        (l) => l.leave_date === dStr && (l.leave_type !== 'personal' || isUserAssigned(t, l.username))
      );
      if ((isWeekend || isHoliday) && effectiveEnd > start) effectiveEnd.setDate(effectiveEnd.getDate() - 1);
      else break;
    }

    return { ...t, start, end, effectiveEnd };
  });

  const handleDragStart = (e, t, mode) => {
    e.stopPropagation();
    e.preventDefault(); // Mencegah native browser drag-and-drop (menghindari kursor dilarang)
    if (accountStatus === 'suspended') return;
    const cell = e.currentTarget.closest('.calendar-day-cell');
    const dragWidth = cell ? cell.offsetWidth : 100;
    const dragHeight = cell ? cell.offsetHeight : 100;
    setTimelineDrag({
      task: t,
      startX: e.pageX,
      startY: e.pageY,
      startOffsetDays: 0,
      mode,
      dragWidth,
      dragHeight,
      isCalendar: true,
    });
  };

  // Schedule View Calculations
  const scheduleDays = React.useMemo(() => {
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [year, month, daysInMonth]);

  const scheduleActiveDays = React.useMemo(() => {
    return scheduleDays.map(cellDate => {
      const cellDateStr = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(
        cellDate.getDate()
      ).padStart(2, '0')}`;
      const dayLeaves = leaves.filter((l) => l.leave_date === cellDateStr);
      const dayTasks = parsedTasks.filter((t) => {
        const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
        const isTaskHoliday = dayLeaves.some(
          (l) => l.leave_type !== 'personal' || isUserAssigned(t, l.username)
        );
        if (isWeekend || isTaskHoliday) return false;
        return cellDate.getTime() >= t.start.getTime() && cellDate.getTime() <= t.end.getTime();
      });
      return { cellDate, cellDateStr, dayLeaves, dayTasks };
    }).filter(d => d.dayTasks.length > 0 || d.dayLeaves.length > 0);
  }, [scheduleDays, parsedTasks, leaves, currentUser]);

  const navigatePrev = () => {
    if (subView === 'week') {
      setCalDate(new Date(calDate.getFullYear(), calDate.getMonth(), calDate.getDate() - 7));
    } else {
      setCalDate(new Date(year, month - 1, 1));
    }
  };

  const navigateNext = () => {
    if (subView === 'week') {
      setCalDate(new Date(calDate.getFullYear(), calDate.getMonth(), calDate.getDate() + 7));
    } else {
      setCalDate(new Date(year, month + 1, 1));
    }
  };

  const getHeaderTitle = () => {
    if (subView === 'week') {
      const weekDays = currentRows[0];
      const start = weekDays[0];
      const end = weekDays[6];
      if (start.getMonth() === end.getMonth()) {
        return `${monthNames[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
      }
      return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${monthNames[month]} {year}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-125 sm:min-h-150">
      <div className="flex flex-col md:flex-row justify-between items-center p-3 sm:p-4 gap-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
        <h2 className="text-sm sm:text-lg md:text-xl font-extrabold text-slate-800 dark:text-white text-center md:text-left min-w-0 truncate w-full md:w-auto">
          {subView === 'week' ? getHeaderTitle() : `${monthNames[month]} ${year}`}
        </h2>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
          {/* Navigation Button Group */}
          <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg shrink-0">
            <button
              onClick={navigatePrev}
              className="px-2.5 sm:px-4 py-1.5 font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 rounded-md transition-colors text-xs"
            >
              &lt; Prev
            </button>
            <button
              onClick={() => {
                setCalDate(new Date());
                if (subView === 'schedule') {
                  setTimeout(() => {
                    const el = document.getElementById('schedule-today');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 100);
                }
              }}
              className="px-2.5 sm:px-4 py-1.5 font-bold text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors text-xs"
            >
              Today
            </button>
            <button
              onClick={navigateNext}
              className="px-2.5 sm:px-4 py-1.5 font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 rounded-md transition-colors text-xs"
            >
              Next &gt;
            </button>
          </div>

          {/* View Switcher Tabs */}
          <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg shrink-0">
            {['month', 'week', 'schedule'].map((view) => (
              <button
                key={view}
                onClick={() => setSubView(view)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all capitalize ${
                  subView === view
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>

      {subView !== 'schedule' ? (
        <>
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50">
            {dayNames.map((d) => (
              <div
                key={d}
                className="py-1.5 sm:py-3 text-center text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-r border-slate-200 dark:border-slate-700 last:border-0"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="flex-1 grid min-h-0" style={{ gridTemplateRows: `repeat(${currentRows.length}, minmax(0, 1fr))` }}>
            {currentRows.map((w, wIdx) => (
              <div
                key={wIdx}
                className="min-h-0 grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 last:border-0"
              >
                {w.map((cellDate, dIdx) => {
                  const isWeekend = dIdx === 0 || dIdx === 6;
                  const isToday = cellDate && cellDate.toDateString() === new Date().toDateString();
                  const cellDateStr = cellDate
                    ? `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(
                        cellDate.getDate()
                      ).padStart(2, '0')}`
                    : null;
                  const dayLeaves = cellDateStr ? leaves.filter((l) => l.leave_date === cellDateStr) : [];
                  const hasGlobalHoliday = dayLeaves.some((l) => l.leave_type !== 'personal' || l.username === currentUser);

                  let cellBg = 'bg-white dark:bg-slate-800';
                  if (!cellDate) cellBg = 'bg-slate-50/50 dark:bg-slate-900/40';
                  else if (isToday) cellBg = 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500 z-10';
                  else if (hasGlobalHoliday) cellBg = 'bg-red-100/80 dark:bg-red-900/30';
                  else if (isWeekend) cellBg = 'bg-slate-200/70 dark:bg-slate-900/60';

                  const dayTasks = cellDate
                    ? parsedTasks.filter((t) => {
                        const isTaskHoliday = dayLeaves.some(
                          (l) => l.leave_type !== 'personal' || isUserAssigned(t, l.username)
                        );
                        if (isWeekend || isTaskHoliday) return false;
                        return cellDate.getTime() >= t.start.getTime() && cellDate.getTime() <= t.end.getTime();
                      })
                    : [];

                  const isExpanded = expandedDate === cellDateStr;
                  const limit = subView === 'week' ? 10 : 3;
                  const visibleTasks = isExpanded ? dayTasks : dayTasks.slice(0, limit);
                  const hiddenCount = dayTasks.length - limit;

                  return (
                    <div
                      key={dIdx}
                      className={`calendar-day-cell relative min-w-0 min-h-0 border-r border-slate-200 dark:border-slate-700 last:border-0 p-1 flex flex-col ${cellBg}`}
                    >
                      {cellDate && (
                        <>
                          <div
                            className={`text-right text-[10px] sm:text-xs font-bold p-1 sm:p-2 ${
                              isToday
                                ? 'text-blue-600 dark:text-blue-400'
                                : dayLeaves.length > 0
                                ? 'text-red-700 dark:text-red-300'
                                : isWeekend
                                ? 'text-slate-600 dark:text-slate-300'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            <span className={isToday ? 'font-black' : ''}>{cellDate.getDate()}</span>
                            {dayLeaves.map((l) => (
                              <div
                                key={l.id}
                                className="text-[8px] text-red-800 dark:text-red-200 bg-white/60 dark:bg-black/40 shadow-sm backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 px-1 py-0.5 rounded mt-1 truncate cursor-pointer hover:bg-white dark:hover:bg-neutral-900 transition-colors"
                                title="Click for details"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLeave(l);
                                }}
                              >
                                {l.leave_type === 'personal' ? '🌴' : '🎌'}{' '}
                                {l.leave_type === 'personal' && l.username !== currentUser ? `@${l.username} ` : ''}
                                {l.description}
                              </div>
                            ))}
                          </div>
                          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1 mt-1">
                            {visibleTasks.map((t) => {
                              let bgColor = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
                              if (t.status === 'Rejected')
                                bgColor = 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
                              else if (t.status === 'In Progress')
                                bgColor = 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
                              else if (t.status === 'Pending')
                                bgColor = 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';

                              const isFirst = cellDate.getTime() === t.start.getTime();
                              const isLast = cellDate.getTime() === t.effectiveEnd.getTime();
                              const isTaskAdmin =
                                isSuperAdmin ||
                                t.owner_username === currentUser ||
                                (selectedBoard && selectedBoard.owner_username === currentUser) ||
                                (t.requester &&
                                  new RegExp(`@${currentUser.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w.-])`, 'i').test(
                                    t.requester
                                  ));
                              const isDraggable =
                                t.status !== 'Done' &&
                                t.status !== 'Rejected' &&
                                accountStatus !== 'suspended' &&
                                isTaskAdmin;
                              const isDraggingThis = timelineDrag?.task?.id === t.id;

                              return (
                                <div
                                  key={t.id}
                                  className={`flex items-stretch text-[8px] sm:text-[10px] font-bold rounded-md hover:brightness-95 ${bgColor} ${
                                    isDraggingThis
                                      ? isTrashHovered
                                        ? 'cursor-grabbing z-60 opacity-0! bg-transparent! shadow-none! border-transparent! text-transparent! transition-opacity duration-150'
                                        : 'shadow-2xl -rotate-1 cursor-grabbing z-60 ring-4 ring-indigo-500/40 scale-105 opacity-95 transition-[box-shadow,transform,opacity,border-color] duration-200'
                                      : 'transition-all duration-200 hover:scale-[1.02] hover:shadow-sm'
                                  }`}
                                  title={t.project_name}
                                >
                                  {isFirst && isDraggable && (
                                    <div
                                      className="w-2 sm:w-3 bg-black/10 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/30 cursor-ew-resize shrink-0 rounded-l-md"
                                      onMouseDown={(e) => handleDragStart(e, t, 'start')}
                                    />
                                  )}
                                  <div
                                    className={`flex-1 px-1 sm:px-2 py-0.5 sm:py-1.5 truncate ${
                                      isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                                    }`}
                                    onClick={() => {
                                      if (!timelineDrag || timelineDrag.startOffsetDays === 0) setSelectedTask(t);
                                    }}
                                    onMouseDown={(e) => {
                                      if (isDraggable) handleDragStart(e, t, 'both');
                                    }}
                                  >
                                    {isFirst && <span className="opacity-70 font-black mr-1">Start:</span>}
                                    {t.project_name}
                                    {isLast && <span className="opacity-70 font-black ml-1">:End</span>}
                                  </div>
                                  {isLast && isDraggable && (
                                    <div
                                      className="w-2 sm:w-3 bg-black/10 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/30 cursor-ew-resize shrink-0 rounded-r-md"
                                      onMouseDown={(e) => handleDragStart(e, t, 'end')}
                                    />
                                  )}
                                </div>
                              );
                            })}
                            {!isExpanded && hiddenCount > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedDate(cellDateStr);
                                }}
                                className="w-full text-[10px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 text-left px-1 py-0.5 transition-colors"
                              >
                                +{hiddenCount} more
                              </button>
                            )}
                            {isExpanded && hiddenCount > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedDate(null);
                                }}
                                className="w-full text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-left px-1 py-0.5 transition-colors"
                              >
                                Show less
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
          {scheduleActiveDays.length > 0 ? (
            scheduleActiveDays.map(({ cellDate, cellDateStr, dayLeaves, dayTasks }) => {
              const isToday = cellDate.toDateString() === new Date().toDateString();
              const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
              const hasGlobalHoliday = dayLeaves.some((l) => l.leave_type !== 'personal' || l.username === currentUser);

              let headerBg = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';
              if (isToday) headerBg = 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
              else if (hasGlobalHoliday) headerBg = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';

              return (
                <div
                  key={cellDateStr}
                  id={isToday ? 'schedule-today' : undefined}
                  className={`flex flex-col sm:flex-row border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md ${headerBg}`}
                >
                  {/* Date Card Header */}
                  <div className="p-3 sm:p-4 sm:w-48 shrink-0 flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-900/50">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 sm:flex-col sm:items-center sm:gap-0">
                      <span className="text-[10px] sm:text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                        {dayNames[cellDate.getDay()]}
                      </span>
                      <span className="text-base sm:text-2xl font-black text-slate-800 dark:text-white my-0 sm:my-1">
                        {cellDate.getDate()}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                        {monthNames[cellDate.getMonth()]} {cellDate.getFullYear()}
                      </span>
                    </div>
                    {isToday && (
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-blue-500 text-white rounded-full sm:mt-2">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Tasks and Leaves */}
                  <div className="flex-1 p-4 space-y-3">
                    {dayLeaves.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {dayLeaves.map((l) => (
                          <div
                            key={l.id}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-800 dark:text-red-200 bg-red-100/70 dark:bg-red-950/40 border border-red-200/50 dark:border-red-800/50 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                            onClick={() => setSelectedLeave(l)}
                          >
                            <span>{l.leave_type === 'personal' ? '🌴' : '🎌'}</span>
                            <span>
                              {l.leave_type === 'personal' && l.username !== currentUser ? `@${l.username}: ` : ''}
                              {l.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {dayTasks.length > 0 ? (
                      <div className="grid gap-2">
                        {dayTasks.map((t) => {
                          let statusBg = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
                          if (t.status === 'Rejected')
                            statusBg = 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
                          else if (t.status === 'In Progress')
                            statusBg = 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
                          else if (t.status === 'Pending')
                            statusBg = 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';

                          return (
                            <div
                              key={t.id}
                              onClick={() => setSelectedTask(t)}
                              className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 gap-2 rounded-lg border border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 cursor-pointer shadow-sm hover:shadow transition-all hover:scale-[1.01]`}
                            >
                              <div className="flex-1 min-w-0 w-full">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white line-clamp-2 wrap-break-word">
                                  {t.project_name}
                                </h4>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex flex-wrap gap-x-2 gap-y-1">
                                  {t.owner_username && (
                                    <span>Assigned to: <strong>@{t.owner_username}</strong></span>
                                  )}
                                  {t.start_date && (
                                    <span>• Start: <strong>{formatDatePref(t.start_date)}</strong></span>
                                  )}
                                  {t.deadline && (
                                    <span>• Deadline: <strong>{formatDatePref(t.deadline)}</strong></span>
                                  )}
                                </p>
                              </div>
                              <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full uppercase tracking-wider shrink-0 self-start sm:self-auto ${statusBg}`}>
                                {t.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      !dayLeaves.length && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">No schedules or holidays</p>
                      )
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full min-h-75 flex flex-col justify-center items-center text-center p-8">
              <span className="text-5xl mb-4">📅</span>
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Tasks Scheduled</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1">
                There are no tasks or leaves scheduled for {monthNames[month]} {year}. Use the navigation at the top to check other months.
              </p>
            </div>
          )}
        </div>
      )}

      {selectedLeave && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLeave(null);
          }}
        >
          <div
            className="bg-white dark:bg-neutral-950 p-6 sm:p-8 w-full max-w-sm border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl text-center mac-animate"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm border border-red-200 dark:border-red-800/50">
              {selectedLeave.leave_type === 'personal' ? '🌴' : '🎌'}
            </div>
            <h3 className="text-xl font-black text-black dark:text-white mb-2 uppercase tracking-tighter">
              {selectedLeave.leave_type === 'personal' ? 'Personal Leave' : 'Public Holiday'}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-sm font-medium leading-relaxed">
              {selectedLeave.leave_type === 'personal' && selectedLeave.username !== currentUser ? (
                <span className="block mb-2 font-bold text-indigo-500 dark:text-indigo-400">
                  @{selectedLeave.username}
                </span>
              ) : null}
              <strong>Date:</strong> {selectedLeave.leave_date} <br />
              <strong>Details:</strong> {selectedLeave.description}
            </p>
            <button
              onClick={() => setSelectedLeave(null)}
              className="w-full px-4 py-3 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors uppercase tracking-widest text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
