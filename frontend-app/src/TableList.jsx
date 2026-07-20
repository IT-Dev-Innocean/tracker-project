import React, { useState, useMemo, useEffect, useRef } from 'react';
import axios from 'axios';
import { HighlightText } from './Utils';

const IconPerson = ({ className }) => (
  <svg className={className || 'w-4 h-4'} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const Avatar = ({ name, url, size, textClass }) => {
  if (url)
    return (
      <img
        src={url}
        alt={name || 'User'}
        className={`${size || 'w-6 h-6'} rounded-full object-cover`}
        title={name?.replace('@', '').trim()}
      />
    );
  const initial = name ? name.replace('@', '').charAt(0).toUpperCase() : '?';
  const cleanName = name ? name.replace('@', '').trim() : '';
  return (
    <div
      className={`${
        size || 'w-6 h-6'
      } rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold border border-indigo-200 dark:border-indigo-700 ${
        textClass || 'text-xs'
      }`}
      title={cleanName}
    >
      {initial}
    </div>
  );
};

export default function TableList({
  clonedTaskIds,
  filteredTasks = [],
  setSelectedTask,
  currentUser,
  avatarsMap = {},
  formatDateMMM = (d) => d,
  handleQuickAddTask = () => {},
  selectedBoard,
  accountStatus,
  categories = [],
  teamMembers = [],
  isMentioning,
  mentionIndex,
  setMentionIndex,
  setIsMentioning,
  mentionQuery,
  handleRequesterChange = () => {},
  insertMention = () => {},
  notifications = [],
  boards = [],
  fetchTasks,
  setClonedTaskIds,
  showNotification,
  searchQuery = '',
  language = 'en',
}) {
  const getTaskDeadlineInfo = (task) => {
    if (!task.deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dl = new Date(task.deadline.replace(/-/g, '/'));
    dl.setHours(0, 0, 0, 0);
    const diffDays = Math.round((dl - today) / (1000 * 60 * 60 * 24));

    const tMsg = (en, id) => (language === 'id' ? id : en);
    let timeStr = '';
    let badgeColor = 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';

    if (diffDays < 0) {
      timeStr = tMsg(`${Math.abs(diffDays)}d overdue`, `${Math.abs(diffDays)}h lewat`);
      badgeColor = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50';
    } else if (diffDays === 0) {
      timeStr = tMsg('Today', 'Hari Ini');
      badgeColor = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
    } else if (diffDays === 1) {
      timeStr = tMsg('1d left', '1h lagi');
      badgeColor = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
    } else if (diffDays < 7) {
      timeStr = tMsg(`${diffDays}d left`, `${diffDays}h lagi`);
      badgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
    } else {
      const w = Math.floor(diffDays / 7);
      const d = diffDays % 7;
      timeStr = d === 0 ? tMsg(`${w}w left`, `${w}m lagi`) : tMsg(`${w}w ${d}d left`, `${w}m ${d}h lagi`);
      badgeColor = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
    }

    return { badgeColor, timeStr };
  };

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(() => {
    if (typeof window !== 'undefined') return Number(localStorage.getItem('innocean_tasks_per_page')) || 15;
    return 15;
  });
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [showCompletedMobile, setShowCompletedMobile] = useState(false);
  const [processingTaskId, setProcessingTaskId] = useState(null);
  const [newlyAddedId, setNewlyAddedId] = useState(null);
  const [newlyActivatedId, setNewlyActivatedId] = useState(null);
  const [newlyReactivatedId, setNewlyReactivatedId] = useState(null);
  const [newlyCompletedId, setNewlyCompletedId] = useState(null);
  const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);

  const handleAnimationEnd = (taskId) => {
    if (newlyActivatedId === taskId) {
      setNewlyActivatedId(null);
    }
    if (newlyCompletedId === taskId) {
      setNewlyCompletedId(null);
    }
    if (newlyReactivatedId === taskId) {
      setNewlyReactivatedId(null);
    }
  };

  useEffect(() => localStorage.setItem('innocean_tasks_per_page', tasksPerPage), [tasksPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredTasks, sortConfig, tasksPerPage]);

  const getLocalToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(
      2,
      '0'
    )}`;
  };
  const defaultDeadline = getLocalToday();

  const [quickAddData, setQuickAddData] = useState({
    project_name: '',
    requester: currentUser ? `@${currentUser}` : '',
    category: categories?.[0] || 'Development',
    deadline: '',
    impact: 'Medium',
    etc: 2,
  });

  const optimisticIdRef = useRef(null);
  const [displayTasks, setDisplayTasks] = useState(filteredTasks);
  useEffect(() => {
    if (optimisticIdRef.current) {
      const realNewTask = filteredTasks.find(
        (t) =>
          t.project_name === optimisticIdRef.current.name &&
          t.requester === optimisticIdRef.current.requester &&
          !displayTasks.some((dt) => dt.id === t.id)
      );

      if (realNewTask) {
        const tempIdToReplace = optimisticIdRef.current.id;
        setDisplayTasks((prev) => {
          const newTasks = prev.map((t) => (t.id === tempIdToReplace ? realNewTask : t));
          return newTasks;
        });
        optimisticIdRef.current = null;
      } else {
        // Fallback if match fails, to prevent stale UI
        setDisplayTasks(filteredTasks);
      }
    } else {
      setDisplayTasks(filteredTasks);
    }
  }, [filteredTasks]);

  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [bulkTargetBoard, setBulkTargetBoard] = useState('');
  const [isBulkMoving, setIsBulkMoving] = useState(false);

  const handleToggleBulkSelect = () => {
    if (isBulkSelectMode) {
      setSelectedTaskIds([]);
    }
    setIsBulkSelectMode((prev) => !prev);
  };

  const handleToggleSelectTask = (taskId) => {
    setSelectedTaskIds((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]));
  };

  const handleSelectAllCurrentPage = (e) => {
    if (e.target.checked) {
      setSelectedTaskIds(currentTasks.map((t) => t.id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleBulkMove = async () => {
    if (!bulkTargetBoard || selectedTaskIds.length === 0) return;
    setIsBulkMoving(true);
    const tasksToMove = filteredTasks.filter((t) => selectedTaskIds.includes(t.id));
    try {
      for (const t of tasksToMove) {
        const payload = {
          project_name: t.project_name,
          requester: t.requester,
          category: t.category,
          description: t.description || '',
          supporting_access: t.supporting_access || '',
          start_date: t.start_date || (t.timestamp && t.timestamp.split(' ')[0]),
          deadline: t.deadline ? t.deadline.split(' ')[0] + ' 17:00:00' : '',
          impact: t.impact || 'Medium',
          etc: t.etc || 2,
          status: t.status,
          board_id: parseInt(bulkTargetBoard),
        };
        await axios.put(`/api/tasks/${t.id}/details`, payload);
      }
      setSelectedTaskIds([]);
      setBulkTargetBoard('');
      if (fetchTasks) fetchTasks();
      if (showNotification) showNotification('Tasks successfully moved!', 'success');
    } catch (e) {
      console.error(e);
      if (showNotification) showNotification('Failed to move some tasks', 'error');
    } finally {
      setIsBulkMoving(false);
    }
  };

  const handleToggleTaskDone = async (task, e) => {
    e.stopPropagation();
    if (processingTaskId === task.id) return; // Mencegah klik ganda
    setProcessingTaskId(task.id);
    
    const newStatus = task.status === 'Done' ? 'In Progress' : 'Done';
    const originalStatus = task.status;

    // 1. MULAI ANIMASI KELUAR (SLIDE OUT) SEBELUM DATA BERPINDAH
    if (newStatus === 'Done') {
      setNewlyCompletedId(task.id);
    } else {
      setNewlyReactivatedId(task.id);
    }

    try {
      // Gunakan endpoint status yang lebih ringan & bisa me-return cloned_task_id
      const apiCall = axios.put(`/api/tasks/${task.id}`, { status: newStatus });
      const animationDelay = new Promise((resolve) => setTimeout(resolve, 500)); // Sinkronkan dengan durasi CSS animasi 0.5s

      // 2. JALANKAN API DAN TUNGGU ANIMASI KELUAR SELESAI
      const [res] = await Promise.all([apiCall, animationDelay]);

      if (res.data?.cloned_task_id && setClonedTaskIds) {
        const clonedId = res.data.cloned_task_id;
        setClonedTaskIds((prev) => {
          const next = new Set(prev);
          next.add(clonedId);
          next.add(Number(clonedId));
          next.add(String(clonedId));
          return next;
        });
      }

      // 3. OPTIMISTIC UI UPDATE: Pindahkan task ke daftar baru SETELAH slide-out selesai
      setDisplayTasks((prevTasks) => 
        prevTasks.map((t) => t.id === task.id ? { 
          ...t, 
          status: newStatus,
          completed_time: newStatus === 'Done' ? new Date().toISOString() : t.completed_time
        } : t)
      );

      // 4. ATUR ANIMASI MASUK (SLIDE IN) DI DAFTAR TUJUAN
      if (newStatus === 'In Progress') {
        setNewlyReactivatedId(null);
        setNewlyActivatedId(task.id);
      }

      // Sinkronisasi data di background agar UI tidak out-of-sync
      if (fetchTasks) fetchTasks();
    } catch (error) {
      console.error('Failed to update task status:', error);
      if (showNotification) {
        showNotification(error.response?.data?.detail || 'Failed to update task status.', 'error');
      }
      // Kembalikan UI jika API gagal
      setNewlyCompletedId(null);
      setNewlyReactivatedId(null);
      if (fetchTasks) fetchTasks();
    } finally {
      setProcessingTaskId(null);
    }
  };

  useEffect(() => {
    if (categories && !categories.includes(quickAddData.category)) {
      setQuickAddData((prev) => ({ ...prev, category: categories[0] }));
    }
  }, [categories]);

  const submitQuickAdd = () => {
    if (quickAddData.project_name.trim()) {
      const tempId = `temp-${Date.now()}`;
      const newTask = {
        ...quickAddData,
        id: tempId,
        timestamp: new Date().toISOString(),
        status: 'Pending',
        priority_lvl: 'normal',
        priority_str: 'NORMAL',
        subtask_total: 0,
        subtask_done: 0,
        owner_username: currentUser,
        board_id: selectedBoard.id,
        board_name: selectedBoard.name,
      };

      optimisticIdRef.current = { id: tempId, name: newTask.project_name, requester: newTask.requester };

      setDisplayTasks((prev) => [newTask, ...prev]);
      setNewlyAddedId(tempId);

      handleQuickAddTask(quickAddData)
        .then(() => {
          if (fetchTasks) fetchTasks();
          showNotification('Task created!', 'success');
        })
        .catch((err) => {
          showNotification(err.response?.data?.detail || 'Failed to create task', 'error');
          setDisplayTasks((prev) => prev.filter((t) => t.id !== tempId));
          optimisticIdRef.current = null;
        });

      setQuickAddData({
        project_name: '',
        requester: currentUser ? `@${currentUser}` : '',
        category: categories?.[0] || 'Development',
        deadline: '',
        impact: 'Medium',
        etc: 2,
      });
    }
  };

  const sortedTasks = useMemo(() => {
    let sortableTasks = [...displayTasks];
    if (sortConfig.key !== null) {
      sortableTasks.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'deadline') {
          aValue = a.deadline
            ? new Date(a.deadline.replace(/-/g, '/')).getTime()
            : sortConfig.direction === 'ascending'
            ? Infinity
            : -Infinity;
          bValue = b.deadline
            ? new Date(b.deadline.replace(/-/g, '/')).getTime()
            : sortConfig.direction === 'ascending'
            ? Infinity
            : -Infinity;
        } else if (sortConfig.key === 'start_date') {
          aValue = a.start_date
            ? new Date(a.start_date.replace(/-/g, '/')).getTime()
            : sortConfig.direction === 'ascending'
            ? Infinity
            : -Infinity;
          bValue = b.start_date
            ? new Date(b.start_date.replace(/-/g, '/')).getTime()
            : sortConfig.direction === 'ascending'
            ? Infinity
            : -Infinity;
        } else if (sortConfig.key === 'priority_lvl') {
          const prioWeight = { critical: 3, warning: 2, normal: 1 };
          let weightA = prioWeight[a.priority_lvl] || 0;
          let weightB = prioWeight[b.priority_lvl] || 0;
          if (weightA === weightB) {
            const impactWeight = { High: 3, Medium: 2, Low: 1 };
            weightA = impactWeight[a.impact || 'Medium'] || 0;
            weightB = impactWeight[b.impact || 'Medium'] || 0;
          }
          aValue = weightA;
          bValue = weightB;
        } else if (sortConfig.key === 'impact') {
          const impactWeight = { High: 3, Medium: 2, Low: 1 };
          aValue = impactWeight[a.impact || 'Medium'] || 0;
          bValue = impactWeight[b.impact || 'Medium'] || 0;
        } else if (sortConfig.key === 'etc') {
          aValue = a.etc || 0;
          bValue = b.etc || 0;
        } else if (sortConfig.key === 'queue') {
          const isGlobal = !selectedBoard || selectedBoard.id === 'global';
          aValue = (isGlobal ? a.queue_global_number : a.queue_project_number) || 999999;
          bValue = (isGlobal ? b.queue_global_number : b.queue_project_number) || 999999;
        } else if (sortConfig.key === 'subtasks') {
          aValue = a.subtask_total > 0 ? a.subtask_done / a.subtask_total : -1;
          bValue = b.subtask_total > 0 ? b.subtask_done / b.subtask_total : -1;
        } else {
          aValue = (aValue || '').toString().toLowerCase();
          bValue = (bValue || '').toString().toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableTasks;
  }, [displayTasks, sortConfig, selectedBoard]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      key = null;
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    if (sortConfig.direction === 'ascending') return <span className="ml-1 text-indigo-500">↑</span>;
    return <span className="ml-1 text-indigo-500">↓</span>;
  };

  const activeTasks = useMemo(
    () => sortedTasks.filter((task) => task.status !== 'Done' && task.status !== 'Rejected'),
    [sortedTasks]
  );
  const doneTasks = useMemo(
    () =>
      sortedTasks
        .filter((task) => task.status === 'Done')
        .sort((a, b) => new Date(b.completed_time || 0) - new Date(a.completed_time || 0)),
    [sortedTasks]
  );

  const archiveLimit = 10;
  const visibleDoneTasks = useMemo(() => {
    return !isArchiveExpanded ? doneTasks.slice(0, archiveLimit) : doneTasks;
  }, [doneTasks, isArchiveExpanded]);

  const archivedCount = doneTasks.length - visibleDoneTasks.length;

  const totalPages = Math.ceil(activeTasks.length / tasksPerPage) || 1;
  const currentTasks = activeTasks.slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const isSameBoard =
    selectedBoard && selectedBoard.id !== 'global' && String(bulkTargetBoard) === String(selectedBoard.id);

  return (
    <>
      {/* Tambahkan CSS di sini agar animasi lebih halus */}
      <style>{`
        @keyframes slide-in-from-top {
          0% {
            transform: translateY(-20px) scale(0.98);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        .animate-slide-in-from-top { animation: slide-in-from-top 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
      {/* Tambahkan CSS di sini agar animasi lebih halus */}
      <style>{`
        @keyframes slide-in-from-left {
          0% { transform: translateX(-20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in-from-left 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }
        @keyframes slide-in-from-right {
          0% { transform: translateX(20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-from-right 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }
        @keyframes slide-out-to-right {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(50px); opacity: 0; }
        }
        .animate-slide-out {
          animation: slide-out-to-right 0.5s ease-out forwards;
          will-change: transform, opacity;
        }
        @keyframes slide-out-to-left {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-50px); opacity: 0; }
        }
        .animate-slide-out-left {
          animation: slide-out-to-left 0.5s ease-out forwards;
          will-change: transform, opacity;
        }
      `}</style>
      <div className="flex flex-1 min-h-0 gap-6 text-slate-800 dark:text-slate-200">
        {/* Main Task List Container */}
        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-sm rounded-3xl flex flex-col flex-1 min-h-0 relative overflow-hidden">
          {/* Sort & Filter Action Bar */}
          <div className="flex flex-wrap items-center gap-2 px-4 md:px-6 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs font-bold text-neutral-500 dark:text-neutral-400 shrink-0">
            <span className="mr-2 uppercase tracking-widest text-[10px]">Sort By:</span>
            <div className="hidden md:flex flex-wrap items-center gap-2">
              {[
                { key: 'queue', label: 'Queue' },
                { key: 'project_name', label: 'Name' },
                { key: 'status', label: 'Status' },
                { key: 'start_date', label: 'Start Date' },
                { key: 'deadline', label: 'Deadline' },
                { key: 'priority_lvl', label: 'Priority' },
              ].map((sortOption) => (
                <button
                  key={sortOption.key}
                  onClick={() => requestSort(sortOption.key)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    sortConfig.key === sortOption.key
                      ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                      : 'hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  {sortOption.label} {renderSortIcon(sortOption.key)}
                </button>
              ))}
            </div>
            <select onChange={(e) => requestSort(e.target.value)} value={sortConfig.key || ''} className="flex-1 md:hidden bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-xs font-bold">
              <option value="">Default</option>
              {[{ key: 'queue', label: 'Queue' }, { key: 'project_name', label: 'Name' }, { key: 'status', label: 'Status' }, { key: 'start_date', label: 'Start Date' }, { key: 'deadline', label: 'Deadline' }, { key: 'priority_lvl', label: 'Priority' }].map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
            </select>
            {isBulkSelectMode && (
              <div className="ml-auto flex items-center gap-3">
                {selectedTaskIds.length > 0 && (
                  <div className="flex items-center gap-2 mr-1 border-r border-neutral-200 dark:border-neutral-700/50 pr-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] uppercase tracking-wider">
                      {selectedTaskIds.length} Selected:
                    </span>
                    <select
                      value={bulkTargetBoard}
                      onChange={(e) => setBulkTargetBoard(e.target.value)}
                      className="py-1 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-800 dark:text-white text-[10px] font-bold outline-none"
                    >
                      <option value="" className="text-slate-800 dark:text-white">Move to Project</option>
                      {boards?.map((b) => (
                        <option key={b.id} value={b.id} className="text-slate-800 dark:text-white">
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleBulkMove}
                      disabled={!bulkTargetBoard || isBulkMoving || isSameBoard}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm disabled:opacity-50 transition-colors"
                    >
                      {isBulkMoving ? 'Moving...' : 'Move'}
                    </button>
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer bg-neutral-200 dark:bg-neutral-800 px-3 py-1.5 rounded-md text-neutral-800 dark:text-neutral-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={currentTasks.length > 0 && selectedTaskIds.length === currentTasks.length}
                    onChange={handleSelectAllCurrentPage}
                    className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  Select All
                </label>
              </div>
            )}
          </div>

          {}
          {/* Task List Content */}
          <div className="flex-1 overflow-y-auto w-full custom-scrollbar relative min-h-0 p-4 md:p-6 space-y-4 bg-neutral-50/30 dark:bg-neutral-950/30">
            {/* Quick Add Row */}
            {selectedBoard && selectedBoard.id !== 'global' && accountStatus !== 'suspended' && currentPage === 1 && (
              <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 transition-all shadow-sm flex flex-col gap-3 relative">
                <div className="flex items-center gap-3">
                  <span className="text-indigo-500 font-black text-xl select-none">✨</span>
                  <input
                    type="text"
                    value={quickAddData.project_name}
                    onChange={(e) => setQuickAddData({ ...quickAddData, project_name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submitQuickAdd();
                      }
                    }}
                    placeholder="New task request title... (Press Enter to submit)"
                    className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-base font-bold text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
                  />
                  <button
                    onClick={submitQuickAdd}
                    className="hidden md:block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors uppercase tracking-widest"
                  >
                    Add Task
                  </button>
                </div>

                {/* Quick Add Metadata Inputs */}
                <div className="flex flex-wrap items-center gap-2 pl-9">
                  {/* Assignee Input */}
                  <div className="relative group">
                    <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 focus-within:ring-2 ring-indigo-500/50">
                      <span className="text-[10px] uppercase font-bold text-neutral-400">👤</span>
                      <input
                        type="text"
                        value={quickAddData.requester}
                        onChange={(e) => handleRequesterChange(e.target.value, setQuickAddData, quickAddData)}
                        onKeyDown={(e) => {
                          if (isMentioning) {
                            const filtered = teamMembers.filter((m) => m.toLowerCase().includes(mentionQuery));
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setMentionIndex((prev) => (prev + 1) % (filtered.length || 1));
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setMentionIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
                            } else if (e.key === 'Enter' || e.key === 'Tab') {
                              if (filtered.length > 0) {
                                e.preventDefault();
                                insertMention(filtered[mentionIndex] || filtered[0], setQuickAddData, quickAddData);
                              }
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setIsMentioning(false);
                            }
                          }
                        }}
                        placeholder="@assignee..."
                        className="w-24 bg-transparent border-none focus:ring-0 outline-none text-xs font-medium text-slate-700 dark:text-slate-300 placeholder-slate-400"
                      />
                    </div>
                    {isMentioning && accountStatus !== 'suspended' && (
                      <div className="absolute left-0 top-full mt-1 w-48 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-xl z-99 max-h-40 overflow-y-auto py-2">
                        {teamMembers.filter((m) => m.toLowerCase().includes(mentionQuery)).length > 0 ? (
                          teamMembers
                            .filter((m) => m.toLowerCase().includes(mentionQuery))
                            .map((m, idx) => (
                              <div
                                key={m}
                                className={`px-4 py-2 cursor-pointer text-xs text-black dark:text-white font-bold border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 ${
                                  mentionIndex === idx
                                    ? 'bg-neutral-100 dark:bg-neutral-800'
                                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                                onClick={() => insertMention(m, setQuickAddData, quickAddData)}
                              >
                                @{m}
                              </div>
                            ))
                        ) : (
                          <div className="px-4 py-2 text-xs text-neutral-400 font-bold italic">Not found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Category Input */}
                  <select
                    value={quickAddData.category}
                    onChange={(e) => setQuickAddData({ ...quickAddData, category: e.target.value })}
                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 ring-indigo-500/50 cursor-pointer"
                  >
                    {categories?.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  {/* Impact Input */}
                  <select
                    value={quickAddData.impact}
                    onChange={(e) => setQuickAddData({ ...quickAddData, impact: e.target.value })}
                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 ring-indigo-500/50 cursor-pointer"
                  >
                    <option value="High">🔥 High Impact</option>
                    <option value="Medium">⚡ Med Impact</option>
                    <option value="Low">🧊 Low Impact</option>
                  </select>

                  {/* Deadline Input */}
                  <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 focus-within:ring-2 ring-indigo-500/50">
                    <span className="text-[10px] uppercase font-bold text-neutral-400">📅</span>
                    <input
                      type="date"
                      value={quickAddData.deadline}
                      onChange={(e) => setQuickAddData({ ...quickAddData, deadline: e.target.value })}
                      className="bg-transparent border-none focus:ring-0 outline-none text-xs font-bold text-slate-700 dark:text-slate-300"
                    />
                  </div>

                  {/* ETC Input */}
                  <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 focus-within:ring-2 ring-indigo-500/50">
                    <span className="text-[10px] uppercase font-bold text-neutral-400">⏱️</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={quickAddData.etc}
                      onChange={(e) => setQuickAddData({ ...quickAddData, etc: parseFloat(e.target.value) || 0 })}
                      className="w-12 bg-transparent border-none focus:ring-0 outline-none text-xs font-bold text-slate-700 dark:text-slate-300 text-center"
                      placeholder="Hours"
                    />
                  </div>
                  {/* Mobile submit */}
                  <button
                    onClick={submitQuickAdd}
                    className="md:hidden mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors uppercase tracking-widest"
                  >
                    Submit Task
                  </button>
                </div>
              </div>
            )}

            {/* Render List Tasks Aktif */}
            {currentTasks.length > 0 ? (
              currentTasks.map((task, index) => {
                const isNewClone = clonedTaskIds && (clonedTaskIds.has(task.id) || clonedTaskIds.has(String(task.id)) || clonedTaskIds.has(Number(task.id)));
                const isGlobal = !selectedBoard || selectedBoard.id === 'global';
                const qPos = isGlobal ? task.queue_global_number : task.queue_project_number;
                const qTot = isGlobal ? task.total_global_queue : task.total_project_queue;
                const unreadComments = (notifications || []).filter(
                  (n) => !n.is_read && n.related_task_id === task.id && (n.type === 'comment' || n.type === 'mention' || n.type === 'mention_no_email')
                ).length;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dlDate = task.deadline ? new Date(task.deadline.replace(/-/g, '/')) : null;
                if (dlDate) dlDate.setHours(0, 0, 0, 0);
                const isOverdue = dlDate && dlDate < today && task.status !== 'Done' && task.status !== 'Rejected';

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    onAnimationEnd={() => {
                      if (newlyAddedId === task.id) setNewlyAddedId(null);
                      if (newlyActivatedId === task.id) setNewlyActivatedId(null);
                    }}
                    className={`flex flex-col sm:flex-row items-start gap-4 p-4 md:p-5 rounded-2xl border ${
                      newlyCompletedId === task.id ? 'animate-slide-out' : ''
                    } ${newlyActivatedId === task.id ? 'animate-slide-in-right' : ''} ${
                      newlyAddedId === task.id ? 'animate-slide-in-from-top' : ''
                    } ${
                      isNewClone
                        ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/50'
                        : isOverdue
                        ? 'bg-red-50/40 dark:bg-red-900/10 border-red-300 dark:border-red-800/60'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                    } hover:shadow-md ${!isOverdue ? 'hover:border-neutral-300 dark:hover:border-neutral-700' : 'hover:border-red-400 dark:hover:border-red-600'} transition-all cursor-pointer group ${
                      task.status === 'Done' ? 'opacity-70' : ''
                    }`}
                  >
                    {/* Left Column: Actions & Queue */}
                    <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 w-full sm:w-auto shrink-0" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        {processingTaskId === task.id ? (
                          <div className="w-5 h-5 flex items-center justify-center">
                             <div className="w-4 h-4 border-2 border-indigo-200 dark:border-indigo-700 border-t-indigo-500 rounded-full animate-spin"></div>
                          </div>
                        ) : isBulkSelectMode ? (
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.includes(task.id)}
                            onChange={() => handleToggleSelectTask(task.id)}
                            className="rounded border-neutral-300 w-5 h-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        ) : (
                          <input
                            type="checkbox"
                            checked={task.status === 'Done'}
                            onChange={(e) => handleToggleTaskDone(task, e)}
                            title={task.status === 'Done' ? 'Mark as not done' : 'Mark as done'}
                            className={`rounded-full border-neutral-400 dark:border-neutral-600 focus:ring-indigo-500 cursor-pointer w-5 h-5 transition-all ${
                              task.status === 'Done' ? 'bg-indigo-600 text-indigo-600' : 'bg-transparent dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-transparent'
                            }`}
                          />
                        )}
                      </div>
                      {qPos && qTot && (
                        <span
                          className="text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-2.5 py-1 rounded-lg shadow-sm border border-amber-300 dark:border-amber-700/50 text-center sm:w-full mt-0 sm:mt-1"
                          title={isGlobal ? 'Overall Queue Position' : 'Queue Position'}
                        >
                          {qPos} / {qTot}
                        </span>
                      )}
                      {task.recurring && task.recurring !== 'none' && (
                        <span
                          className="text-[10px] capitalize font-bold text-blue-800 dark:text-blue-300 bg-blue-100/60 dark:bg-blue-900/60 px-2.5 py-1 rounded-lg shadow-sm border border-blue-200 dark:border-blue-700/50 text-center sm:w-full mt-1.5 flex items-center justify-center gap-1"
                          title="Recurring Task"
                        >
                          🔁 {task.recurring}
                        </span>
                      )}
                    </div>

                    {/* Right Column: Task Content & Badges */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2.5 w-full">
                      {/* Header: Title & Deadline */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                          {isNewClone && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest shadow-sm bg-indigo-500 dark:bg-indigo-600 text-white animate-pulse shrink-0">
                              NEW CLONE
                            </span>
                          )}
                          <h4 className={`text-base font-bold text-slate-800 dark:text-slate-100 leading-snug ${task.status === 'Done' ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}>
                            <HighlightText text={task.project_name} query={searchQuery} />
                          </h4>
                          {unreadComments > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-md shadow-sm font-black animate-pulse flex items-center gap-1 shrink-0">
                              💬 {unreadComments} New
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/50 px-2 py-1 rounded-lg shrink-0 whitespace-nowrap">
                          <span>{task.start_date ? formatDateMMM(task.start_date) : '--'}</span>
                          <span>→</span>
                          <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-black' : ''}>
                            {task.deadline ? formatDateMMM(task.deadline) : 'No Deadline'}
                          </span>
                          {task.deadline && task.status !== 'Done' && task.status !== 'Rejected' && (() => {
                            const dlInfo = getTaskDeadlineInfo(task);
                            if (!dlInfo) return null;
                            return (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest border shrink-0 ml-1.5 ${dlInfo.badgeColor}`}>
                                {dlInfo.timeStr}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Description Line Clamp */}
                      {task.description && typeof task.description === 'string' && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 pr-4">
                          {task.description.replace(/<[^>]+>/g, '').replace(/[*_~`]/g, '')}
                        </p>
                      )}

                      {/* Meta Badges & Assignee Container */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mt-1 w-full">
                        
                        {/* Left: Metadata Badges */}
                        <div className="flex flex-wrap items-center gap-2 flex-1">
                          
                          {/* Project Name Badge */}
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700" title="Project / Board">
                            📂 {task.board_name}
                          </span>

                          {/* Category Badge */}
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-800/50">
                            🏷️ {task.category}
                          </span>

                          {/* Status Badge */}
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${
                            task.status === 'Done' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                            : task.status === 'Rejected' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            : task.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
                          }`}>
                            {task.status}
                          </span>

                          {/* Impact Badge */}
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-wide ${
                            task.impact === 'High' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50'
                            : task.impact === 'Low' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50'
                          }`}>
                            {task.impact === 'High' ? '🔥 High' : task.impact === 'Low' ? '🧊 Low' : '⚡ Med'}
                          </span>

                          {/* Subtask Badge */}
                          {task.subtask_total > 0 && (
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${
                              task.subtask_done === task.subtask_total
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                            }`}>
                              📋 {task.subtask_done}/{task.subtask_total}
                            </span>
                          )}

                          {/* ETC Badge */}
                          {(task.etc !== undefined && task.etc !== null) && (
                             <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                               ⏱️ {task.etc}h
                             </span>
                          )}

                        </div>
                        
                        {/* Right: Assignee & Mentions Area */}
                        <div className="flex items-center gap-4 shrink-0 self-start sm:self-auto border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800/50 pt-2 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end mt-1 sm:mt-0">
                          {/* Owner Mention */}
                          {task.owner_username && task.owner_username !== currentUser && (
                            <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 px-2 py-1">
                              🤝 from {task.owner_username}
                            </span>
                          )}

                          <div className="flex items-center gap-2">                            
                            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md border shadow-sm min-w-0 max-w-37.5 sm:max-w-none ${
                                task.requester && task.requester.includes('@') 
                                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' 
                                  : 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                              }`}                              
                              title={task.requester && task.requester.includes('@') ? `Assigned To: ${task.requester}` : `Requester: ${task.requester}`}                              
                            >
                              {task.requester && task.requester.includes('@') ? '👉' : <IconPerson className="w-3 h-3 shrink-0" />}
                              <Avatar name={task.requester} url={avatarsMap[task.requester ? task.requester.replace('@', '').trim() : '']} size="w-4 h-4" textClass="text-[8px]" />
                              <span className="truncate">{task.requester}</span>
                            </span>
                            {/* Subtask Assignees */}
                            {(() => {
                              const mainAssignee = (task.requester || '').replace('@', '').trim().toLowerCase();
                              const subAssignees = (task.subtask_assignees || '')
                                .split(', ')
                                .filter(Boolean)
                                .filter(name => name.toLowerCase() !== mainAssignee);
                              const uniqueSubAssignees = [...new Set(subAssignees)];

                              if (uniqueSubAssignees.length > 0) {
                                return (
                                  <div className="flex -space-x-2" title={`Subtask assignees: ${uniqueSubAssignees.join(', ')}`}>
                                    {uniqueSubAssignees.slice(0, 3).map(name => (
                                      <Avatar 
                                        key={name}
                                        name={name} 
                                        url={avatarsMap[name.trim()]} 
                                        size="w-5 h-5" 
                                        textClass="text-[8px]" 
                                      />
                                    ))}
                                    {uniqueSubAssignees.length > 3 && (
                                      <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[8px] font-bold border-2 border-white dark:border-neutral-900">
                                        +{uniqueSubAssignees.length - 3}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400 text-center">
                <span className="text-4xl mb-3 opacity-50">🍃</span>
                <p className="font-bold">No tasks found.</p>
                <p className="text-xs mt-1">Enjoy the clarity of an empty list, or add a new task!</p>
              </div>
            )}

            {/* Mobile Completed Tasks Toggle (Visible only on < xl screens) */}
            <div className="xl:hidden w-full border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 mt-6 shadow-sm overflow-hidden mb-2">
              <button
                onClick={() => setShowCompletedMobile(!showCompletedMobile)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <span className="flex items-center gap-2">✅ Completed Tasks <span className="bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded-full text-[10px]">{doneTasks.length}</span></span>
                <span className="text-lg leading-none">{showCompletedMobile ? '▾' : '▸'}</span>
              </button>
              
               {showCompletedMobile && (
                <div className="flex flex-col max-h-[50vh] bg-neutral-50/50 dark:bg-neutral-950/50 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {visibleDoneTasks.length > 0 ? (
                      visibleDoneTasks.map((task) => (
                        <div
                          key={task.id}
                          onAnimationEnd={() => handleAnimationEnd(task.id)}
                          className={`bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-start gap-3 opacity-70 hover:opacity-100 transition-all duration-300 cursor-pointer group ${
                            newlyCompletedId === task.id ? 'animate-slide-in' : ''
                          } ${newlyReactivatedId === task.id ? 'animate-slide-out-left' : ''}`}
                          onClick={() => setSelectedTask(task)}
                        >
                          {processingTaskId === task.id ? (
                             <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
                               <div className="w-4 h-4 border-2 border-indigo-200 dark:border-indigo-700 border-t-indigo-500 rounded-full animate-spin"></div>
                             </div>
                          ) : (
                            <input
                              type="checkbox"
                              checked={true}
                              onChange={(e) => handleToggleTaskDone(task, e)}
                              onClick={(e) => e.stopPropagation()}
                              title="Mark as not done"
                              className="mt-0.5 rounded-full border-neutral-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4 bg-indigo-600 shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold line-through text-neutral-600 dark:text-neutral-400 truncate group-hover:text-indigo-600 transition-colors">
                              {task.project_name}
                            </p>
                            <p className="text-[9px] font-medium text-neutral-400 mt-0.5">
                              {formatDateMMM(task.completed_time)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs font-bold text-neutral-400">
                        No completed tasks yet.
                      </div>
                    )}
                  </div>
                  {doneTasks.length > archiveLimit && (
                    <div className="p-3 shrink-0 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                      <button
                        onClick={() => setIsArchiveExpanded(!isArchiveExpanded)}
                        className="w-full py-2 bg-neutral-200/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors shadow-sm"
                      >
                        {isArchiveExpanded ? '⬆ Hide Archived Tasks' : `📂 View ${archivedCount} Archived Tasks`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Footer / Pagination */}
          {sortedTasks.length > 0 && (
            <div className="flex flex-col justify-between items-center px-4 md:px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 gap-4 shrink-0 mt-auto">
              <div className="w-full flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-[10px] font-bold text-slate-500 uppercase tracking-widest">Show:</span>
                <select
                  value={tasksPerPage}
                  onChange={(e) => {
                    setTasksPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-1.5 px-2 rounded-lg cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value={15}>15 Tasks</option>
                  <option value={30}>30 Tasks</option>
                  <option value={60}>60 Tasks</option>
                  <option value={120}>120 Tasks</option>
                </select>
                </div>
                <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Active: <span className="text-slate-800 dark:text-slate-200">{activeTasks.length}</span>
                </span>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
                <button
                  onClick={handleToggleBulkSelect}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors uppercase tracking-widest ${
                    isBulkSelectMode
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700 hover:bg-red-200'
                      : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  {isBulkSelectMode ? 'Cancel Bulk' : 'Bulk Select'}
                </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  Prev
                </button>

                <div className="hidden sm:flex items-center gap-1.5 mx-2">
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
                      disabled={page === '...'}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                        page === currentPage
                          ? 'bg-indigo-600 text-white shadow-md'
                          : page === '...'
                          ? 'text-slate-400 bg-transparent cursor-default'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <span className="sm:hidden px-3 text-xs font-black text-slate-800 dark:text-white tracking-widest">
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Completed Tasks Sidebar (Desktop only) */}
        <div className="hidden xl:flex flex-col w-80 shrink-0">
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-sm rounded-3xl flex flex-col flex-1 min-h-0">
            <h3 className="p-6 text-base font-black text-slate-800 dark:text-white border-b border-neutral-200 dark:border-neutral-800 shrink-0 flex items-center gap-2">
              ✅ Completed Tasks
            </h3>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-neutral-50/30 dark:bg-neutral-950/30">
              {visibleDoneTasks.length > 0 ? (
                visibleDoneTasks.map((task) => (
                  <div
                    key={task.id}
                    onAnimationEnd={() => handleAnimationEnd(task.id)}
                    className={`bg-white dark:bg-neutral-900 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-start gap-3 opacity-70 hover:opacity-100 hover:shadow-sm transition-all duration-300 cursor-pointer group ${
                      newlyCompletedId === task.id ? 'animate-slide-in' : ''
                    } ${newlyReactivatedId === task.id ? 'animate-slide-out-left' : ''}`}
                  >
                    {processingTaskId === task.id ? (
                      <div
                        className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="w-4 h-4 border-2 border-indigo-200 dark:border-indigo-700 border-t-indigo-500 rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={(e) => handleToggleTaskDone(task, e)}
                        onClick={(e) => e.stopPropagation()}
                        title="Mark as not done"
                        className="mt-0.5 rounded-full border-neutral-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-5 h-5 bg-indigo-600 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0" onClick={() => setSelectedTask(task)}>
                      <p
                        className="text-sm font-bold line-through text-neutral-600 dark:text-neutral-400 truncate group-hover:text-indigo-600 transition-colors"
                        title={task.project_name}
                      >
                        {task.project_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                          {task.board_name}
                        </span>
                        <p className="text-[9px] font-medium text-neutral-400">{formatDateMMM(task.completed_time)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-neutral-400 dark:text-neutral-600">
                  <p className="text-4xl mb-2 opacity-50">🎉</p>
                  <p className="text-xs font-bold text-center">
                    No completed tasks yet.
                    <br />
                    Keep going!
                  </p>
                </div>
              )}
            </div>
            {doneTasks.length > archiveLimit && (
              <div className="p-4 shrink-0 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-950/30 rounded-b-3xl">
                <button
                  onClick={() => setIsArchiveExpanded(!isArchiveExpanded)}
                  className="w-full py-3 bg-neutral-200/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors shadow-sm"
                >
                  {isArchiveExpanded ? '⬆ Hide Archived Tasks' : `📂 View ${archivedCount} Archived Tasks`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}