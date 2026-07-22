import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { HighlightText, LoadingSpinner } from './Utils';
import { useAppContext } from './hooks/useAppContext';

function getWeekDays(startOfWeek) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    days.push(`${yyyy}-${mm}-${dd}`);
  }
  return days;
}

function getWeekString(dateObj) {
  const date = new Date(dateObj.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  const week = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
}

function parseWeekString(weekStr) {
  if (!weekStr) return new Date();
  const [y, w] = weekStr.split('-W');
  const simple = new Date(y, 0, 1 + (w - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  const sunday = new Date(ISOweekStart);
  sunday.setDate(sunday.getDate() - 1);
  return sunday;
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Adjust to Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfWeekStr(dateStr) {
  const d = getStartOfWeek(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getRowId(bId, rId, customProject, customTask) {
  const hasBoard = bId && bId !== 'custom';
  const hasRequest = rId && rId !== 'custom';
  if (hasBoard || hasRequest) {
    return `${hasBoard ? bId : ''}_${hasRequest ? rId : ''}`;
  }
  return `custom_${customProject || ''}_${customTask || ''}`;
}

export default function TimesheetView({ currentUser, tasks = [], boards = [] }) {
  const { formatDateMMM, profileData, language, setShowTimesheets } = useAppContext();
  const tMsg = (en, id) => (language === 'id' ? id : en);
  const [entries, setEntries] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [manualRows, setManualRows] = useState([]); // Array of { id, board_id, request_id }
  const [selectedRowIds, setSelectedRowIds] = useState(new Set()); // row_ids selected for submission
  
  // Tabs State
  const [activeSubTab, setActiveSubTab] = useState('my-timesheet');
  
  // Collapsible States
  const [expandedHistoryWeeks, setExpandedHistoryWeeks] = useState(new Set());
  const [expandedApprovalWeeks, setExpandedApprovalWeeks] = useState(new Set());

  const toggleExpandHistoryWeek = (weekStartStr) => {
    const newSet = new Set(expandedHistoryWeeks);
    if (newSet.has(weekStartStr)) newSet.delete(weekStartStr);
    else newSet.add(weekStartStr);
    setExpandedHistoryWeeks(newSet);
  };

  const toggleExpandApprovalWeek = (username, weekStartStr) => {
    const key = `${username}_${weekStartStr}`;
    const newSet = new Set(expandedApprovalWeeks);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setExpandedApprovalWeeks(newSet);
  };

  // Group Approvals by User & Week
  const groupedApprovals = useMemo(() => {
    const userMap = new Map();

    approvals.forEach(entry => {
      const username = entry.user_username;
      const weekStartStr = getStartOfWeekStr(entry.date);

      if (!userMap.has(username)) {
        userMap.set(username, new Map());
      }
      const weekMap = userMap.get(username);
      if (!weekMap.has(weekStartStr)) {
        weekMap.set(weekStartStr, []);
      }
      weekMap.get(weekStartStr).push(entry);
    });

    const result = [];
    userMap.forEach((weekMap, username) => {
      const weeks = [];
      weekMap.forEach((entriesInWeek, weekStartStr) => {
        const weekDays = getWeekDays(new Date(weekStartStr));
        const rowsMap = new Map();
        let weekTotal = 0;
        const entryIds = entriesInWeek.map(e => e.id);

        entriesInWeek.forEach(entry => {
          const rowId = getRowId(entry.board_id, entry.request_id, entry.project_name, entry.task_name);
          if (!rowsMap.has(rowId)) {
            rowsMap.set(rowId, {
              id: rowId,
              board_id: entry.board_id,
              request_id: entry.request_id,
              custom_project_name: entry.project_name,
              custom_task_name: entry.task_name,
              days: {},
            });
          }
          rowsMap.get(rowId).days[entry.date] = entry;
          weekTotal += parseFloat(entry.hours_logged || 0);
        });

        const rows = Array.from(rowsMap.values());
        rows.forEach(row => {
          let rowTotal = 0;
          weekDays.forEach(d => {
            if (row.days[d]) rowTotal += parseFloat(row.days[d].hours_logged || 0);
          });
          row.totalHours = rowTotal;
        });

        weeks.push({
          weekStartStr,
          weekDays,
          rows,
          totalHours: weekTotal,
          entryIds,
        });
      });
      weeks.sort((a, b) => b.weekStartStr.localeCompare(a.weekStartStr));
      result.push({
        username,
        weeks,
      });
    });

    result.sort((a, b) => a.username.localeCompare(b.username));
    return result;
  }, [approvals]);
  
  // Modals state
  const [deleteRowModal, setDeleteRowModal] = useState(null); // stores row object
  const [errorModalMsg, setErrorModalMsg] = useState(null);

  const token = localStorage.getItem('innocean_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [entriesRes, approvalsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL || ''}/api/timesheets/entries`, { headers }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL || ''}/api/timesheets/approvals`, { headers })
      ]);
      setEntries(entriesRes.data.entries || []);
      setApprovals(approvalsRes.data.entries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);

  // Aggregate entries into a weekly grid
  // Grid format: Array of rows
  // Row: { id (boardId_reqId), board_id, request_id, days: { 'YYYY-MM-DD': entryObj }, totalHours }
  const gridRows = useMemo(() => {
    const rowsMap = new Map();

    // Map backend entries for the current week
    entries.forEach(entry => {
      if (!weekDays.includes(entry.date)) return;
      if (entry.is_deleted) return;

      const rowId = getRowId(entry.board_id, entry.request_id, entry.custom_project_name, entry.custom_task_name);
      if (!rowsMap.has(rowId)) {
        rowsMap.set(rowId, {
          id: rowId,
          board_id: entry.board_id,
          request_id: entry.request_id,
          custom_project_name: entry.custom_project_name,
          custom_task_name: entry.custom_task_name,
          days: {},
          isManual: false,
        });
      }
      rowsMap.get(rowId).days[entry.date] = entry;
    });

    // Add manual rows
    manualRows.forEach(mr => {
      if (!rowsMap.has(mr.id)) {
        rowsMap.set(mr.id, {
          ...mr,
          days: {},
        });
      }
    });

    const arr = Array.from(rowsMap.values());
    arr.forEach(row => {
      let total = 0;
      weekDays.forEach(d => {
        if (row.days[d]) total += parseFloat(row.days[d].hours_logged || 0);
      });
      row.totalHours = total;
    });

    return arr;
  }, [entries, weekDays, manualRows]);

  const dailyTotals = useMemo(() => {
    const totals = {};
    weekDays.forEach(dateStr => {
      let dayTotal = 0;
      gridRows.forEach(r => {
        const d = r.days[dateStr];
        if (d && !d.is_deleted && d.hours_logged) dayTotal += parseFloat(d.hours_logged);
      });
      totals[dateStr] = dayTotal;
    });
    return totals;
  }, [gridRows, weekDays]);

  const weeklyTotal = useMemo(() => {
    return gridRows.reduce((acc, r) => acc + (r.totalHours || 0), 0);
  }, [gridRows]);

  const hasDailyOvertime = useMemo(() => {
    return Object.values(dailyTotals).some(t => t > 8);
  }, [dailyTotals]);

  const hasWeeklyOvertime = weeklyTotal > 40;

  const isWeekSubmitted = useMemo(() => {
    return entries.some(e => weekDays.includes(e.date) && ['Pending', 'Approved'].includes(e.status));
  }, [entries, weekDays]);

  const toggleRowSelection = (rowId) => {
    const newSet = new Set(selectedRowIds);
    if (newSet.has(rowId)) newSet.delete(rowId);
    else newSet.add(rowId);
    setSelectedRowIds(newSet);
  };

  const handleAddRow = () => {
    if (manualRows.length >= 15) return setErrorModalMsg('You can only add up to 15 manual rows per week.');
    const tempId = `manual_${Date.now()}_${Math.random()}`;
    setManualRows([...manualRows, { id: tempId, board_id: '', request_id: '', isManual: true }]);
  };

  const handleRowChange = (rowId, field, value) => {
    setManualRows(manualRows.map(mr => {
      if (mr.id === rowId) {
        if (field === 'board_id') {
          return { 
            ...mr, 
            board_id: value, 
            request_id: '', 
            custom_project_name: value === 'custom' ? '' : mr.custom_project_name 
          };
        }
        if (field === 'request_id') {
          return { 
            ...mr, 
            request_id: value, 
            custom_task_name: value === 'custom' ? '' : mr.custom_task_name 
          };
        }
        return { ...mr, [field]: value };
      }
      return mr;
    }));
  };

  const handleDayHoursChange = (row, dateStr, val) => {
    const newValue = val === '' ? '' : parseFloat(val);
    
    let updatedEntries = [...entries];
    const existingIndex = updatedEntries.findIndex(e => 
      e.date === dateStr && 
      getRowId(e.board_id, e.request_id, e.custom_project_name, e.custom_task_name) === row.id
    );

    if (existingIndex >= 0) {
      if (newValue === '' || newValue === 0) {
        updatedEntries[existingIndex].hours_logged = 0;
        updatedEntries[existingIndex].is_deleted = true; // custom flag for frontend
      } else {
        updatedEntries[existingIndex].hours_logged = newValue;
        updatedEntries[existingIndex].is_deleted = false;
      }
    } else {
      if (newValue !== '' && newValue > 0) {
        const b = boards.find(b => b.id === parseInt(row.board_id));
        const t = tasks.find(t => t.id === parseInt(row.request_id));
        updatedEntries.push({
          _frontendId: Date.now() + Math.random(), // flag as new
          date: dateStr,
          hours_logged: newValue,
          board_id: row.board_id && row.board_id !== 'custom' ? parseInt(row.board_id) : null,
          request_id: row.request_id && row.request_id !== 'custom' ? parseInt(row.request_id) : null,
          project_name: row.board_id === 'custom' ? row.custom_project_name : (b ? b.name : null),
          task_name: row.request_id === 'custom' ? row.custom_task_name : (t ? t.project_name : null),
          custom_project_name: row.board_id === 'custom' ? row.custom_project_name : null,
          custom_task_name: row.request_id === 'custom' ? row.custom_task_name : null,
          status: 'Draft',
          description: '' // Optional for weekly grid
        });
      }
    }
    
    if (row.isManual && newValue !== '' && newValue > 0) {
      setManualRows(manualRows.filter(mr => mr.id !== row.id));
    }
    
    setEntries(updatedEntries);
  };

  const handleDeleteRow = (row) => {
    setDeleteRowModal(row);
  };

  const confirmDeleteRow = async () => {
    const row = deleteRowModal;
    if (!row) return;

    if (row.isManual) {
      setManualRows(manualRows.filter(mr => mr.id !== row.id));
    } else {
      const entryIdsToDelete = [];
      const localIdsToFilter = [];

      weekDays.forEach(dateStr => {
        const d = row.days[dateStr];
        if (d) {
          if (d.id) {
            entryIdsToDelete.push(d.id);
          } else if (d._frontendId) {
            localIdsToFilter.push(d._frontendId);
          }
        }
      });

      if (entryIdsToDelete.length > 0) {
        setIsSaving(true);
        try {
          await Promise.all(
            entryIdsToDelete.map(id => 
              axios.delete(`${import.meta.env.VITE_API_BASE_URL || ''}/api/timesheets/entry/${id}`, { headers })
            )
          );
          setEntries(prev => prev.filter(e => !entryIdsToDelete.includes(e.id)));
          await fetchData();
        } catch (err) {
          setErrorModalMsg(err.response?.data?.detail || 'Error deleting row entries');
        } finally {
          setIsSaving(false);
        }
      } else {
        setEntries(prev => prev.filter(e => !localIdsToFilter.includes(e._frontendId)));
      }
    }
    setDeleteRowModal(null);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    let newEntries = [...entries];
    try {
      const requests = [];
      const currentWeekEntries = entries.filter(e => weekDays.includes(e.date));

      for (const entry of currentWeekEntries) {
        if (entry.status && !['Draft', 'Rejected'].includes(entry.status)) continue;

        if (entry._frontendId) {
          if (entry.hours_logged > 0) {
            requests.push(axios.post(`${import.meta.env.VITE_API_BASE_URL || ''}/api/timesheets/entry`, {
              date: entry.date,
              hours_logged: entry.hours_logged,
              board_id: entry.board_id,
              request_id: entry.request_id,
              custom_project_name: entry.custom_project_name,
              custom_task_name: entry.custom_task_name,
              description: entry.description
            }, { headers }));
          }
        } else if (entry.id) {
          if (entry.hours_logged === 0 || entry.is_deleted) {
            requests.push(axios.delete(`${import.meta.env.VITE_API_BASE_URL || ''}/api/timesheets/entry/${entry.id}`, { headers }));
          } else {
            requests.push(axios.put(`${import.meta.env.VITE_API_BASE_URL || ''}/api/timesheets/entry/${entry.id}`, {
              hours_logged: entry.hours_logged,
              description: entry.description
            }, { headers }));
          }
        }
      }

      if (requests.length > 0) {
        await Promise.all(requests);
      }
      
      setManualRows([]);
      const [entriesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL || ''}/api/timesheets/entries`, { headers })
      ]);
      newEntries = entriesRes.data.entries || [];
      setEntries(newEntries);
    } catch (err) {
      setErrorModalMsg(err.response?.data?.detail || 'Error saving draft');
    } finally {
      setIsSaving(false);
    }
    return newEntries;
  };

  const handleSubmitSelected = async () => {
    if (!profileData?.timesheet_approver) {
      return setErrorModalMsg(tMsg(
        'You do not have an assigned timesheet approver. Please contact your administrator.',
        'Anda belum memiliki penyetuju timesheet yang ditunjuk. Silakan hubungi admin.'
      ));
    }
    if (selectedRowIds.size === 0) return setErrorModalMsg('Select at least one row to submit.');
    
    // Auto-save first
    const latestEntries = await handleSaveDraft();

    // Collect all entry IDs that belong to the selected rows and are within this week
    const entryIdsToSubmit = [];
    latestEntries.forEach(entry => {
      if (weekDays.includes(entry.date) && ['Draft', 'Rejected'].includes(entry.status)) {
        const rId = getRowId(entry.board_id, entry.request_id);
        if (selectedRowIds.has(rId) && entry.id) {
          entryIdsToSubmit.push(entry.id);
        }
      }
    });

    if (entryIdsToSubmit.length === 0) {
      return setErrorModalMsg('No saved drafts found in the selected rows for this week. Make sure to input hours first.');
    }

    setIsSaving(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL || ''}/api/timesheets/submit`, {
        entry_ids: entryIdsToSubmit
      }, { headers });
      setSelectedRowIds(new Set());
      await fetchData();
      // Keep alert for success or replace with a toast in the future
      alert(res.data.message);
    } catch (err) {
      setErrorModalMsg(err.response?.data?.detail || 'Error submitting timesheets');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async (entry_ids, status) => {
    try {
      const res = await axios.patch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/timesheets/approve`, {
        entry_ids,
        status
      }, { headers });
      alert(res.data.message);
      fetchData();
    } catch (err) {
      setErrorModalMsg(err.response?.data?.detail || 'Error processing approval');
    }
  };

  const handleExportCSV = () => {
    const rows = [['Date', 'Project', 'Task', 'Hours', 'Status']];
    submittedHistory.forEach(entry => {
      rows.push([
        entry.date,
        entry.project_name || '-',
        entry.task_name || '-',
        entry.hours_logged,
        entry.status
      ]);
    });
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `timesheets_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const nextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
    setSelectedRowIds(new Set());
  };

  const prevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
    setSelectedRowIds(new Set());
  };

  const currentWeek = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
    setSelectedRowIds(new Set());
  };

  // Submitted history
  const submittedHistory = entries.filter(e => !['Draft'].includes(e.status)).sort((a, b) => new Date(b.date) - new Date(a.date));

  const historyGridByWeek = useMemo(() => {
    const weeksMap = new Map();
    submittedHistory.forEach(entry => {
      const wStart = getStartOfWeek(entry.date).toISOString();
      if (!weeksMap.has(wStart)) weeksMap.set(wStart, { weekStart: new Date(wStart), rowsMap: new Map() });
      
      const rowsMap = weeksMap.get(wStart).rowsMap;
      const rowId = getRowId(entry.board_id, entry.request_id, entry.custom_project_name, entry.custom_task_name);
      if (!rowsMap.has(rowId)) {
        rowsMap.set(rowId, {
          id: rowId,
          board_id: entry.board_id,
          request_id: entry.request_id,
          custom_project_name: entry.custom_project_name,
          custom_task_name: entry.custom_task_name,
          days: {},
          totalHours: 0
        });
      }
      rowsMap.get(rowId).days[entry.date] = entry;
      rowsMap.get(rowId).totalHours += parseFloat(entry.hours_logged || 0);
    });
    
    return Array.from(weeksMap.values())
      .sort((a,b) => b.weekStart - a.weekStart)
      .map(w => ({
        weekStart: w.weekStart,
        weekDays: getWeekDays(w.weekStart),
        rows: Array.from(w.rowsMap.values())
      }));
  }, [submittedHistory]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading && entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-neutral-950">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-transparent p-6 md:p-10 pb-32 w-full relative flex flex-col gap-8 text-sm mt-12 md:mt-4 z-10 custom-scrollbar">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest shrink-0">
        <button
          onClick={() => setShowTimesheets?.(false)}
          className="hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
        >
          🏠 {tMsg('Dashboard', 'Dasbor')}
        </button>
        <span className="opacity-50">/</span>
        <span className="text-neutral-700 dark:text-slate-300 font-extrabold">
          {tMsg('My Timesheets', 'Timesheet Saya')}
        </span>
      </div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6 shrink-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white leading-none flex items-center gap-3">
            <span className="text-indigo-600 dark:text-indigo-400">⏱️</span> 
            My timesheets
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Log and manage your hours across all projects on a weekly basis.</p>
        </div>
        
        {/* Approver Status Badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm text-xs font-bold w-max">
          <span>🎯 {tMsg('Approver', 'Penyetuju')}:</span>
          {profileData?.timesheet_approver ? (
            <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
              @{profileData.timesheet_approver}
            </span>
          ) : (
            <span className="text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
              ⚠️ {tMsg('No Approver (Contact Admin)', 'Belum Ditentukan (Hubungi Admin)')}
            </span>
          )}
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-6 border-b border-neutral-200 dark:border-neutral-850 pb-px shrink-0">
        <button
          onClick={() => setActiveSubTab('my-timesheet')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeSubTab === 'my-timesheet'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold border-b-2 border-indigo-500'
              : 'text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
          }`}
        >
          {tMsg('My Timesheet', 'Timesheet Saya')}
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeSubTab === 'history'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold border-b-2 border-indigo-500'
              : 'text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
          }`}
        >
          {tMsg('History & Submitted', 'Riwayat & Terkirim')}
        </button>
        {approvals.length > 0 && (
          <button
            onClick={() => setActiveSubTab('approvals')}
            className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-1.5 ${
              activeSubTab === 'approvals'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold border-b-2 border-indigo-500'
                : 'text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            {tMsg('Team Approvals', 'Persetujuan Tim')}
            <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full shadow-sm">
              {approvals.length}
            </span>
          </button>
        )}
      </div>

      {/* Overtime Warning */}
      {(hasDailyOvertime || hasWeeklyOvertime) && (
        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex gap-3 text-amber-800 dark:text-amber-300 shadow-sm mac-animate">
          <div className="text-xl">⚠️</div>
          <div>
            <h4 className="font-bold text-sm">Overtime Warning</h4>
            <p className="text-xs mt-0.5 opacity-90 font-medium animate-pulse">
              {hasDailyOvertime && hasWeeklyOvertime
                ? 'You have logged more than 8 hours in a single day and more than 40 hours for this week.'
                : hasDailyOvertime
                ? 'You have logged more than 8 hours in a single day.'
                : 'You have logged more than 40 hours for this week.'}{' '}
              Please ensure this overtime is approved.
            </p>
          </div>
        </div>
      )}

      {/* Weekly Grid */}
      {activeSubTab === 'my-timesheet' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-2 bg-white dark:bg-neutral-950 p-1 border border-slate-200 dark:border-neutral-800 rounded-lg shadow-sm">
            <button onClick={prevWeek} className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded text-slate-600 dark:text-slate-300 font-medium transition-colors">Prev</button>
            <button onClick={currentWeek} className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded text-slate-600 dark:text-slate-300 font-medium transition-colors">Today</button>
            <button onClick={nextWeek} className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded text-slate-600 dark:text-slate-300 font-medium transition-colors">Next</button>
            <input 
              type="date" 
              value={weekDays[0]} 
              onChange={(e) => e.target.value && setCurrentWeekStart(getStartOfWeek(e.target.value))}
              className="ml-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded p-1 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500"
              title="Jump to week containing this date"
            />
            <span className="ml-4 font-bold text-slate-800 dark:text-slate-200">
              {formatDateMMM(weekDays[0])} - {formatDateMMM(weekDays[6])}
            </span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleSaveDraft} 
              disabled={isSaving || isWeekSubmitted}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors border border-slate-200 dark:border-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
            <button 
              onClick={handleSubmitSelected} 
              disabled={isSaving || selectedRowIds.size === 0 || isWeekSubmitted}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium shadow-sm transition-colors"
            >
              Submit Selected
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-[500px] relative custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-neutral-950 text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800 text-xs shadow-sm">
              <tr>
                <th className="py-3 px-4 font-medium text-center w-12">
                  <input type="checkbox" disabled={isWeekSubmitted} onChange={e => {
                    if (e.target.checked) setSelectedRowIds(new Set(gridRows.map(r => r.id)));
                    else setSelectedRowIds(new Set());
                  }} checked={selectedRowIds.size > 0 && selectedRowIds.size === gridRows.length} className="rounded border-slate-300 dark:border-neutral-700 cursor-pointer disabled:opacity-50" />
                </th>
                <th className="py-3 px-4 font-medium w-56">Project</th>
                <th className="py-3 px-4 font-medium w-auto min-w-[16rem]">Task</th>
                <th className="py-3 px-4 font-medium w-20 text-center">ETC</th>
                {weekDays.map((dateStr, i) => (
                  <th key={dateStr} className="py-3 px-2 font-medium text-center w-20">
                    <div>{dayNames[i]}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{formatDateMMM(dateStr).replace(/,?\s*\d{4}/, '')}</div>
                  </th>
                ))}
                <th className="py-3 px-4 font-medium text-center w-20">Total</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/50">
              {gridRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">No timesheet entries for this week. Add a row to begin logging time.</td>
                </tr>
              ) : gridRows.map((row) => {
                const isSelected = selectedRowIds.has(row.id);
                // Check if row has pending/approved entries this week (disable editing)
                const isReadOnly = Object.values(row.days).some(d => d && ['Pending', 'Approved'].includes(d.status));
                
                let etcValue = '-';
                let projectTasks = [];
                
                if (row.board_id) {
                  projectTasks = tasks.filter(t => t.board_id === parseInt(row.board_id));
                  if (row.request_id) {
                    const taskObj = projectTasks.find(t => t.id === parseInt(row.request_id));
                    if (taskObj) etcValue = `${taskObj.etc}h`;
                  }
                } else if (!row.isManual) {
                  projectTasks = tasks.filter(t => t.id === row.request_id); // fallback if no board
                }

                return (
                  <tr key={row.id} className={`${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-neutral-900/50'} transition-colors`}>
                    <td className="py-3 px-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        disabled={isWeekSubmitted}
                        onChange={() => toggleRowSelection(row.id)}
                        className="rounded border-slate-300 dark:border-neutral-700 cursor-pointer disabled:opacity-50"
                      />
                    </td>
                    <td className="py-3 px-4">
                      {row.isManual ? (
                        <div className="flex flex-col gap-1.5 w-full">
                          <select 
                            value={row.board_id || ''} 
                            onChange={(e) => handleRowChange(row.id, 'board_id', e.target.value)}
                            className="w-full bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded p-1.5 outline-none focus:border-indigo-500 text-xs text-slate-700 dark:text-slate-200"
                          >
                            <option value="">-- No Project --</option>
                            {boards.filter(b => b.is_private !== 1).map(b => (
                              <option key={b.id} value={b.id}>[{b.id}] {b.name}</option>
                            ))}
                            <option value="custom">✍️ Custom Project...</option>
                          </select>
                          {row.board_id === 'custom' && (
                            <input
                              type="text"
                              placeholder="Type project name..."
                              value={row.custom_project_name || ''}
                              onChange={(e) => handleRowChange(row.id, 'custom_project_name', e.target.value)}
                              className="w-full bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded p-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                            />
                          )}
                        </div>
                      ) : (
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {(() => {
                            if (row.custom_project_name) return row.custom_project_name;
                            const b = boards.find(b => b.id === parseInt(row.board_id));
                            return b ? `[${b.id}] ${b.name}` : 'General / No Project';
                          })()}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {row.isManual && row.board_id ? (
                        <div className="flex flex-col gap-1.5 w-full">
                          <select 
                            value={row.request_id || ''} 
                            onChange={(e) => handleRowChange(row.id, 'request_id', e.target.value)}
                            className="w-full bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded p-1.5 outline-none focus:border-indigo-500 text-xs text-slate-700 dark:text-slate-200"
                          >
                            <option value="">-- Select Task --</option>
                            {projectTasks.map(t => (
                              <option key={t.id} value={t.id}>[{t.id}] {t.project_name && t.project_name.length > 40 ? t.project_name.substring(0, 40) + '...' : t.project_name}</option>
                            ))}
                            <option value="custom">✍️ Custom Task...</option>
                          </select>
                          {row.request_id === 'custom' && (
                            <input
                              type="text"
                              placeholder="Type task name..."
                              value={row.custom_task_name || ''}
                              onChange={(e) => handleRowChange(row.id, 'custom_task_name', e.target.value)}
                              className="w-full bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded p-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400 max-w-[200px] truncate block" title={row.custom_task_name || Object.values(row.days)[0]?.task_name}>
                          {row.custom_task_name || (Object.values(row.days)[0]?.task_name ? `${row.request_id ? `[${row.request_id}] ` : ''}${Object.values(row.days)[0]?.task_name}` : 'No Task')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-neutral-800 px-2 py-1 rounded">{etcValue}</span>
                    </td>
                    {weekDays.map(dateStr => {
                      const dayData = row.days[dateStr];
                      const val = dayData && !dayData.is_deleted ? dayData.hours_logged : '';
                      const isDayReadOnly = isReadOnly || (dayData && ['Pending', 'Approved'].includes(dayData.status));
                      
                      return (
                        <td key={dateStr} className="py-2 px-1 text-center relative group">
                          {isDayReadOnly ? (
                            <div className="w-14 mx-auto py-1.5 text-center text-slate-500 font-medium">
                              {val || '-'}
                            </div>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={val}
                              onChange={(e) => handleDayHoursChange(row, dateStr, e.target.value)}
                              className="w-14 text-center bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 focus:border-indigo-500 rounded py-1.5 outline-none transition-all text-slate-800 dark:text-slate-200"
                              placeholder="-"
                            />
                          )}
                          {dayData && dayData.status && (
                            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                              dayData.status === 'Approved' ? 'bg-emerald-500' :
                              dayData.status === 'Pending' ? 'bg-amber-500' :
                              dayData.status === 'Rejected' ? 'bg-red-500' : 'bg-slate-300'
                            }`} title={dayData.status}></div>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {row.totalHours > 0 ? `${row.totalHours}h` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => handleDeleteRow(row)} 
                        disabled={isWeekSubmitted}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Remove Row"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 z-20 bg-slate-50 dark:bg-neutral-950 border-t border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-slate-300 font-bold shadow-[0_-1px_0_0_rgba(226,232,240,1)] dark:shadow-[0_-1px_0_0_rgba(38,38,38,1)]">
              <tr>
                <td colSpan="3" className="py-2 px-4 text-left">
                  <button 
                    onClick={handleAddRow} 
                    disabled={isWeekSubmitted}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ➕ Add Row
                  </button>
                </td>
                <td className="py-3 px-4 text-right">Daily Totals:</td>
                {weekDays.map(dateStr => {
                  let dayTotal = 0;
                  gridRows.forEach(r => {
                    const d = r.days[dateStr];
                    if (d && !d.is_deleted && d.hours_logged) dayTotal += parseFloat(d.hours_logged);
                  });
                  return (
                    <td key={dateStr} className={`py-3 px-2 text-center font-bold ${dayTotal > 8 ? 'text-amber-500' : 'text-indigo-600 dark:text-indigo-400'}`} title={dayTotal > 8 ? 'Overtime warning: > 8 hours' : ''}>
                      {dayTotal > 0 ? `${dayTotal}h` : '-'}
                    </td>
                  );
                })}
                <td className={`py-3 px-4 text-center font-bold ${(() => {
                  const weekTotal = gridRows.reduce((acc, r) => acc + (r.totalHours || 0), 0);
                  return weekTotal > 40 ? 'text-amber-500' : 'text-indigo-600 dark:text-indigo-400';
                })()}`} title={gridRows.reduce((acc, r) => acc + (r.totalHours || 0), 0) > 40 ? 'Overtime warning: > 40 hours' : ''}>
                  {gridRows.reduce((acc, r) => acc + (r.totalHours || 0), 0) > 0 ? `${gridRows.reduce((acc, r) => acc + (r.totalHours || 0), 0)}h` : '-'}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )}

      {activeSubTab === 'history' && (
        /* History Section */
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex flex-col gap-8 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-neutral-800 pb-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">History & Submitted</h2>
            {submittedHistory.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-100 dark:border-indigo-800/30 shadow-sm"
              >
                📥 Export to CSV
              </button>
            )}
          </div>
          
          {historyGridByWeek.length === 0 ? (
             <div className="text-center text-slate-400 italic py-6">No submitted history found.</div>
          ) : (
            <div className="space-y-4">
              {historyGridByWeek.map((weekGroup, idx) => {
                const weekStartStr = weekGroup.weekDays[0];
                const isExpanded = expandedHistoryWeeks.has(weekStartStr);
                const totalHours = weekGroup.rows.reduce((sum, r) => sum + (r.totalHours || 0), 0);
                
                return (
                  <div key={idx} className="flex flex-col border border-slate-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
                    <button
                      onClick={() => toggleExpandHistoryWeek(weekStartStr)}
                      className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-neutral-950 hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors w-full text-left font-bold text-slate-700 dark:text-slate-200"
                    >
                      <span className="flex items-center gap-2">
                        <span>📅</span>
                        <span>
                          Week of {formatDateMMM(weekGroup.weekDays[0]).replace(/,?\s*\d{4}/, '')} - {formatDateMMM(weekGroup.weekDays[6]).replace(/,?\s*\d{4}/, '')}
                        </span>
                        <span className="ml-2 px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full text-xs border border-indigo-100 dark:border-indigo-800/30">
                          Total: {totalHours}h
                        </span>
                      </span>
                      <span className="text-slate-400 text-xs font-semibold">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </button>
                    
                    {isExpanded && (
                      <div className="p-4 overflow-x-auto border-t border-slate-200 dark:border-neutral-850 bg-white dark:bg-neutral-950">
                        <table className="w-full text-left whitespace-nowrap text-sm">
                          <thead className="bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400">
                            <tr>
                              <th className="py-3 px-4 font-medium w-56">Project</th>
                              <th className="py-3 px-4 font-medium w-auto min-w-[16rem]">Task</th>
                              <th className="py-3 px-4 font-medium w-20 text-center">ETC</th>
                              {weekGroup.weekDays.map((dateStr, i) => (
                                <th key={dateStr} className="py-3 px-2 font-medium text-center w-20">
                                  <div>{dayNames[i]}</div>
                                  <div className="text-[10px] opacity-70 mt-0.5">{formatDateMMM(dateStr).replace(/,?\s*\d{4}/, '')}</div>
                                </th>
                              ))}
                              <th className="py-3 px-4 font-medium text-center w-20">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/50 text-slate-700 dark:text-slate-300">
                            {weekGroup.rows.map(row => {
                              let etcValue = '-';
                              if (row.board_id) {
                                const projectTasks = tasks.filter(t => t.board_id === parseInt(row.board_id));
                                if (row.request_id) {
                                  const taskObj = projectTasks.find(t => t.id === parseInt(row.request_id));
                                  if (taskObj) etcValue = `${taskObj.etc}h`;
                                }
                              }
          
                              return (
                                <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-neutral-950/50 transition-colors">
                                  <td className="py-3 px-4 font-medium">
                                    {row.custom_project_name || (boards.find(b => b.id === parseInt(row.board_id))?.name ? `[${row.board_id}] ${boards.find(b => b.id === parseInt(row.board_id))?.name}` : 'General / No Project')}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="max-w-[200px] truncate block" title={row.custom_task_name || Object.values(row.days)[0]?.task_name}>
                                      {row.custom_task_name || (Object.values(row.days)[0]?.task_name ? `${row.request_id ? `[${row.request_id}] ` : ''}${Object.values(row.days)[0]?.task_name}` : 'No Task')}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-neutral-800 px-2 py-1 rounded">{etcValue}</span>
                                  </td>
                                  {weekGroup.weekDays.map(dateStr => {
                                    const d = row.days[dateStr];
                                    return (
                                      <td key={dateStr} className="py-3 px-2 text-center relative group">
                                        <div className="w-14 mx-auto text-center font-medium">
                                          {d ? d.hours_logged : '-'}
                                        </div>
                                        {d && d.status && (
                                          <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                                            d.status === 'Approved' ? 'bg-emerald-500' :
                                            d.status === 'Pending' ? 'bg-amber-500' :
                                            d.status === 'Rejected' ? 'bg-red-500' : 'bg-slate-300'
                                          }`} title={d.status}></div>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="py-3 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                                    {row.totalHours > 0 ? `${row.totalHours}h` : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'approvals' && (
        /* Approvals Section (If Approver) */
        <div className="bg-white dark:bg-neutral-900 border border-amber-250 dark:border-amber-900/50 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-amber-200 dark:border-amber-900/50 pb-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="text-amber-500">🛡️</span> Pending Approvals for Team
            </h2>
          </div>
          
          {groupedApprovals.length === 0 ? (
            <div className="text-center text-slate-400 italic py-6">No pending team approvals found.</div>
          ) : (
            <div className="space-y-6">
              {groupedApprovals.map(userGroup => (
                <div key={userGroup.username} className="flex flex-col gap-4 border border-amber-200/50 dark:border-amber-900/20 rounded-2xl p-4 bg-amber-50/10 dark:bg-amber-950/5">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-850 dark:text-slate-200 border-b border-amber-100 dark:border-amber-900/20 pb-2">
                    <span className="text-lg">👤</span>
                    <span>@{userGroup.username}</span>
                  </div>
                  
                  <div className="space-y-4">
                    {userGroup.weeks.map(weekGroup => {
                      const weekStartStr = weekGroup.weekStartStr;
                      const key = `${userGroup.username}_${weekStartStr}`;
                      const isExpanded = expandedApprovalWeeks.has(key);
                      
                      return (
                        <div key={weekStartStr} className="border border-slate-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-950 overflow-hidden shadow-sm">
                          <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-neutral-900/50 transition-colors w-full text-left font-bold text-slate-700 dark:text-slate-200 text-xs flex-wrap sm:flex-nowrap gap-2">
                            <button
                              onClick={() => toggleExpandApprovalWeek(userGroup.username, weekStartStr)}
                              className="flex items-center gap-2 hover:opacity-80"
                            >
                              <span>📅</span>
                              <span>
                                Week of {formatDateMMM(weekGroup.weekDays[0]).replace(/,?\s*\d{4}/, '')} - {formatDateMMM(weekGroup.weekDays[6]).replace(/,?\s*\d{4}/, '')}
                              </span>
                              <span className="ml-2 px-2 py-0.5 bg-amber-105 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-black border border-amber-200 dark:border-amber-900/20">
                                {weekGroup.totalHours}h
                              </span>
                              <span className="text-slate-400 text-[10px] ml-2">
                                {isExpanded ? '▼' : '▶'}
                              </span>
                            </button>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(weekGroup.entryIds, 'Approved')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] transition-all"
                              >
                                Approve Week
                              </button>
                              <button
                                onClick={() => handleApprove(weekGroup.entryIds, 'Rejected')}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-[10px] transition-all"
                              >
                                Reject Week
                              </button>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="p-4 overflow-x-auto border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                              <table className="w-full text-left whitespace-nowrap text-xs">
                                <thead className="bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400">
                                  <tr>
                                    <th className="py-2.5 px-3 font-medium w-48">Project</th>
                                    <th className="py-2.5 px-3 font-medium w-auto">Task</th>
                                    {weekGroup.weekDays.map((dateStr, i) => (
                                      <th key={dateStr} className="py-2.5 px-2 font-medium text-center w-16">
                                        <div>{dayNames[i]}</div>
                                        <div className="text-[9px] opacity-70 mt-0.5">{formatDateMMM(dateStr).replace(/,?\s*\d{4}/, '')}</div>
                                      </th>
                                    ))}
                                    <th className="py-2.5 px-3 font-medium text-center w-16">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-150 dark:divide-neutral-800/50 text-slate-700 dark:text-slate-300">
                                  {weekGroup.rows.map(row => (
                                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-neutral-900/20">
                                      <td className="py-2 px-3 font-medium">
                                        {row.custom_project_name || '-'}
                                      </td>
                                      <td className="py-2 px-3">
                                        <span className="max-w-[200px] truncate block" title={row.custom_task_name}>
                                          {row.custom_task_name || 'No Task'}
                                        </span>
                                      </td>
                                      {weekGroup.weekDays.map(dateStr => {
                                        const d = row.days[dateStr];
                                        return (
                                          <td key={dateStr} className="py-2 px-2 text-center relative">
                                            <div className="w-12 mx-auto text-center font-medium">
                                              {d ? d.hours_logged : '-'}
                                            </div>
                                          </td>
                                        );
                                      })}
                                      <td className="py-2 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                                        {row.totalHours > 0 ? `${row.totalHours}h` : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {deleteRowModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-200 dark:border-neutral-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Row</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Are you sure you want to remove this row? Any drafted hours will be deleted on Save.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteRowModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">Cancel</button>
              <button onClick={confirmDeleteRow} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {errorModalMsg && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Submission Error</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{errorModalMsg}</p>
            <div className="flex justify-end">
              <button onClick={() => setErrorModalMsg(null)} className="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 dark:bg-indigo-600 dark:hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
