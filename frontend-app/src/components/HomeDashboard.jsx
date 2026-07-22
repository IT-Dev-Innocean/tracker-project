import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAppContext } from '../contexts/AppContext';
import { isUserAssigned, getTaskAssignee } from '../useAppLogic';
import { Avatar } from '../SharedUI';

const cleanMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/<!--.*?-->/g, '')
    .replace(/&lt;!--.*?--&gt;/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/```/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*#+\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
};

export default function HomeDashboard() {
  const {
    currentUser,
    boards,
    tasks,
    filteredTasks,
    notifications,
    language,
    setIsCreateBoardOpen,
    setSelectedBoard,
    accountStatus,
    setShowMyTasks,
    setShowOverdueOnly,
    isLoading,
    isTasksLoading,
    isBoardsLoading,
    handleNotificationTaskClick,
    avatarsMap,
    setSelectedTask,
    formatDateMMM,
    setIsChatWorkspaceOpen,
    setWorkspaceChatTarget,
    teamWorkloadStats,
    inboxChats,
    isInboxLoading,
    fetchInboxChats,
    sortBy,
  } = useAppContext();

  // Refs to manage API call state and caching to prevent race conditions and spamming.
  const isFetchPending = useRef(false);
  const lastActiveDataKeyRef = useRef('');

  useEffect(() => {
    fetchInboxChats();
  }, []);

  const openTaskInGlobal = (task) => {
    setSelectedBoard({ id: 'global', name: `🌍 ${tMsg('See the Big Picture', 'Lihat Gambaran Besar')}`, role: 'owner', isVirtual: true });
    setShowMyTasks(false);
    setShowOverdueOnly(false);
    setTimeout(() => {
      setSelectedTask(task);
    }, 100);
  };

  // Urutkan tugas aktif user berdasarkan aturan Master View secara global (semua project)
  const sortedUserTasks = React.useMemo(() => {
    const userActiveTasks = (tasks || []).filter(t => {
      const status = (t.status || '').toLowerCase();
      return status !== 'done' && status !== 'rejected' && isUserAssigned(t, currentUser);
    });

    const prioWeight = { critical: 1, warning: 2, normal: 3 };
    const impactWeightDefault = { High: 1, Medium: 2, Low: 3 };
    const impactWeightCustom = { High: 3, Medium: 2, Low: 1 };

    return [...userActiveTasks].sort((a, b) => {
      // Urutkan berdasarkan nomor antrean global terlebih dahulu (agar sesuai dengan definisi "My Top Queue")
      const qa = a.queue_global_number || 999999;
      const qb = b.queue_global_number || 999999;
      if (qa !== qb) return qa - qb;

      const currentSort = sortBy || 'Default';
      if (currentSort === 'Default') {
        const wa = prioWeight[a.priority_lvl || 'normal'] || 3;
        const wb = prioWeight[b.priority_lvl || 'normal'] || 3;
        if (wa !== wb) return wa - wb;

        const impA = impactWeightDefault[a.impact || 'Medium'] || 2;
        const impB = impactWeightDefault[b.impact || 'Medium'] || 2;
        if (impA !== impB) return impA - impB;

        const da = a.deadline
          ? new Date(a.deadline.replace(/-/g, '/')).getTime()
          : new Date(a.timestamp.replace(/-/g, '/')).getTime();
        const db = b.deadline
          ? new Date(b.deadline.replace(/-/g, '/')).getTime()
          : new Date(b.timestamp.replace(/-/g, '/')).getTime();
        if (da !== db) return da - db;
        return a.id - b.id;
      }
      if (currentSort === 'Impact') {
        const wa = impactWeightCustom[a.impact || 'Medium'] || 0;
        const wb = impactWeightCustom[b.impact || 'Medium'] || 0;
        if (wa !== wb) return wb - wa;
        if (a.etc !== b.etc) return (b.etc || 2) - (a.etc || 2);
        const da = a.deadline ? new Date(a.deadline.replace(/-/g, '/')).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline.replace(/-/g, '/')).getTime() : Infinity;
        if (da !== db) return da - db;
        return a.id - b.id;
      }
      if (currentSort === 'Due Date') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        const da = new Date(a.deadline.replace(/-/g, '/')).getTime();
        const db = new Date(b.deadline.replace(/-/g, '/')).getTime();
        return da - db;
      }
      if (currentSort === 'Date Created') {
        const da = new Date(a.timestamp.replace(/-/g, '/')).getTime();
        const db = new Date(b.timestamp.replace(/-/g, '/')).getTime();
        return db - da;
      }
      return a.id - b.id;
    });
  }, [tasks, currentUser, sortBy]);

  const topQueueTasks = sortedUserTasks.slice(0, 5);

  const recentComments = (notifications || [])
    .filter(n => n.type === 'comment' || n.type === 'mention' || n.type === 'mention_no_email')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  const myWorkload = teamWorkloadStats?.[currentUser] || { total_etc: 0, done_etc: 0 };
  const myActiveWorkloadEtc = myWorkload.total_etc - myWorkload.done_etc;
  const myTotalWorkloadEtc = myWorkload.total_etc;

  const isWeeklyOverload = myActiveWorkloadEtc > 40;
  const isMonthlyOverload = myTotalWorkloadEtc > 160;

  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  const tMsg = (en, id) => (language === 'id' ? id : en);

  const today = new Date();
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', dateOptions);

  // Sync logic: tasks that belong to the global project (WIP only and assigned to the user)
  const myTasks = tasks.filter(t => {
    const status = (t.status || '').toLowerCase();
    return status !== 'done' && status !== 'rejected' && isUserAssigned(t, currentUser);
  });
  const activeProjectsCount = boards.length;
  const criticalProjectsCount = boards.filter(b => b.health_alert?.includes('Attention')).length;
  
  // Overdue logic
  const overdueTasksCount = tasks.filter(t => {
    if (!t.deadline) return false;
    const status = (t.status || '').toLowerCase();
    if (status === 'done' || status === 'rejected') return false;
    const end = new Date(t.deadline);
    const now = new Date();
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return end < now;
  }).length;

  const visibleChatsForKey = inboxChats.filter(chat => !(chat.latest_message || '').includes('<!--PRIVATE:'));
  const dataKey = `${myTasks.length}_${overdueTasksCount}_${activeProjectsCount}_${visibleChatsForKey.length}`;

  const fetchAiSummary = async (currentDataKey) => {
    // Prevent spamming the API on every mount
    const cachedSummary = sessionStorage.getItem('aiWorkloadSnapshot');
    const cachedTime = sessionStorage.getItem('aiWorkloadSnapshotTime');
    const cachedKey = sessionStorage.getItem('aiWorkloadDataKey');
    const now = new Date().getTime();

    // Cache valid for 30 minutes (1800000 ms) and only if data hasn't changed
    if (cachedSummary && cachedTime && cachedKey === currentDataKey && now - parseInt(cachedTime) < 1800000) {
      setAiSummary(cachedSummary);
      return;
    }

    if (isFetchPending.current) return; // Prevent concurrent requests
    isFetchPending.current = true;
    lastActiveDataKeyRef.current = currentDataKey;
    setIsSummarizing(true);
    try {
      const topQueue = topQueueTasks.slice(0, 3).map(t => t.project_name || t.title).join(', ');
      const recentComments = visibleChatsForKey.slice(0, 2).map(chat => {
        const place = chat.is_dm ? `DM with @${chat.partner_username}` : (chat.board_name || chat.project_name);
        if (chat.latest_sender === currentUser) {
          return `You replied in ${place}`;
        }
        return `Message from @${chat.latest_sender} in ${place}`;
      }).join('; ');

      // Only count chats the user has NOT yet read for the AI
      const trulyUnreadCount = visibleChatsForKey.filter(chat => {
        if (chat.latest_sender === currentUser) return false;
        if (chat.is_dm) return (chat.unread_count || 0) > 0;
        if (chat.is_project_chat) {
          const lastRead = localStorage.getItem(`innocean_last_read_board_${chat.board_id}_${currentUser}`);
          return !lastRead || chat.timestamp > lastRead;
        } else {
          const lastRead = localStorage.getItem(`innocean_last_read_task_${chat.task_id}_${currentUser}`);
          return !lastRead || chat.timestamp > lastRead;
        }
      }).length;

      const workloadInfo = `The user's current active workload is ${Math.round(myActiveWorkloadEtc)} hours out of a total of ${Math.round(myTotalWorkloadEtc)} hours. `;
      const weeklyOverloadWarning = isWeeklyOverload ? tMsg('The user is currently experiencing a weekly overload. ', 'Pengguna saat ini mengalami kelebihan beban kerja mingguan. ') : '';
      const monthlyOverloadWarning = isMonthlyOverload ? tMsg("The user's total assigned work for this period indicates a monthly overload. ", 'Total pekerjaan yang ditugaskan pada pengguna untuk periode ini menunjukkan kelebihan beban bulanan. ') : '';

      const prompt = `As an AI assistant, provide a super brief (max 2 sentences) executive summary of the user's workload. Address the user directly (e.g., "You have..."). Use markdown bold syntax (**text**) to highlight key numbers, statuses, or action items (like overdue tasks or overload warnings). Here's the data: The user has ${myTasks.length} tasks, ${overdueTasksCount} overdue tasks, and is involved in ${activeProjectsCount} active projects. ` +
        workloadInfo + weeklyOverloadWarning + monthlyOverloadWarning +
        (topQueue ? `Their top queue priorities are: ${topQueue}. ` : '') +
        (recentComments ? `Their recent chat activity (may already be read): ${recentComments}. ` : '') +
        (trulyUnreadCount > 0 ? `They have ${trulyUnreadCount} unread message(s) that still need a response. ` : `All recent messages have been read. `) +
        `Use a professional, motivating tone. If there are overload warnings, mention them directly. Reply in ${language === 'id' ? 'Indonesian' : 'English'}.`;
      
      const response = await axios.post('/api/ai/generate', {
        prompt: prompt,
        task_context: '',
        board_id: 'global'
      });
      const summaryText = response.data.text;
      setAiSummary(summaryText);
      sessionStorage.setItem('aiWorkloadSnapshot', summaryText);
      sessionStorage.setItem('aiWorkloadSnapshotTime', now.toString());
      sessionStorage.setItem('aiWorkloadDataKey', currentDataKey);
    } catch (error) {
      console.error("AI Summary Error", error);
      const fallbackMsg = tMsg(
        'AI Summary is currently unavailable. Please focus on your priority tasks for today.',
        'Ringkasan AI saat ini tidak tersedia. Silakan fokus pada tugas prioritas Anda hari ini.'
      );
      setAiSummary(fallbackMsg);
    } finally {
      setIsSummarizing(false);
      isFetchPending.current = false;
    }
  };

  useEffect(() => {
    if (isLoading || isTasksLoading || isBoardsLoading) return;

    const hasData = tasks.length > 0 || boards.length > 0;
    let timer;

    if (hasData) {
      // Data is present, fetch summary with a small delay
      timer = setTimeout(() => fetchAiSummary(dataKey), 500);
    } else {
      // Data is empty. It might still be syncing in the background.
      // Wait up to 5 seconds before giving up and assuming the user has no data.
      timer = setTimeout(() => fetchAiSummary(dataKey), 5000);
    }

    return () => clearTimeout(timer);
  }, [isLoading, isTasksLoading, isBoardsLoading, tasks.length > 0, boards.length > 0, dataKey]);

  const getTaskDeadlineInfo = (task) => {
    if (!task.deadline) return null;
    const now = new Date();
    now.setHours(0,0,0,0);
    const d = new Date(task.deadline);
    d.setHours(0,0,0,0);
    
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    let color = 'text-green-600 dark:text-green-400';
    let badgeColor = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/50';
    
    if (diffDays < 0) {
      color = 'text-red-600 dark:text-red-400';
      badgeColor = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50';
    } else if (diffDays <= 3) {
      color = 'text-amber-600 dark:text-amber-400';
      badgeColor = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
    }
    
    let timeStr = '';
    if (diffDays < 0) {
      timeStr = tMsg(`Overdue ${Math.abs(diffDays)}d`, `Terlambat ${Math.abs(diffDays)}h`);
    } else if (diffDays === 0) {
      timeStr = tMsg('Due Today', 'Batas Hari Ini');
    } else if (diffDays === 1) {
      timeStr = tMsg('1d left', '1h lagi');
    } else if (diffDays < 7) {
      timeStr = tMsg(`${diffDays}d left`, `${diffDays}h lagi`);
    } else {
      const w = Math.floor(diffDays / 7);
      const remD = diffDays % 7;
      timeStr = remD === 0 ? tMsg(`${w}w left`, `${w}m lagi`) : tMsg(`${w}w ${remD}d left`, `${w}m ${remD}h lagi`);
    }
    
    return { color, badgeColor, timeStr };
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-6 md:p-10 w-full h-full relative">
      <div className="max-w-5xl mx-auto space-y-8 mt-12 md:mt-4 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-2">
              {formattedDate}
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white leading-none">
              {tMsg('Welcome back,', 'Selamat datang,')} <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-slate-800 to-black dark:from-white dark:to-slate-300">{currentUser}</span>
            </h1>
          </div>
          <button
            onClick={() => setIsCreateBoardOpen(true)}
            disabled={accountStatus === 'suspended'}
            className="tour-home-new-project shrink-0 bg-black dark:bg-white text-white dark:text-black font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform shadow-md disabled:opacity-50 text-sm"
          >
            + {tMsg('New Project', 'Proyek Baru')}
          </button>
        </div>

        {/* AI Summary Widget */}
        <div className="tour-ai-briefing relative bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-black dark:bg-white"></div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
              <span className="text-xl">✨</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between uppercase tracking-widest w-full">
                <span className="flex items-center gap-2">
                  {tMsg('Your Daily AI Briefing', 'Sekilas Kerja Hari Ini dari AI')}
                  {isSummarizing && (
                    <span className="inline-block w-3 h-3 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></span>
                  )}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    sessionStorage.removeItem('aiWorkloadSnapshot');
                    sessionStorage.removeItem('aiWorkloadSnapshotTime');
                    sessionStorage.removeItem('aiWorkloadDataKey');
                    fetchAiSummary(dataKey);
                  }}
                  disabled={isSummarizing}
                  className="text-slate-400 hover:text-black dark:hover:text-white transition-colors disabled:opacity-50"
                  title={tMsg('Refresh AI Briefing', 'Perbarui Ringkasan AI')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </h3>
              <div className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-sm md:text-base">
                {isSummarizing ? (
                  <span className="animate-pulse">{tMsg('Analyzing your projects and tasks...', 'Menganalisis proyek dan tugas Anda...')}</span>
                ) : (
                  aiSummary ? (
                    <span dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\*\*(.*?)\*\*/g, '<strong class="text-black dark:text-white font-bold">$1</strong>') }} />
                  ) : (
                    tMsg('No summary generated.', 'Belum ada ringkasan.')
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* My Capacity Meter */}
        {myActiveWorkloadEtc > 0 && (
          <div className="tour-my-capacity bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <span>⏳</span> {tMsg('My Capacity', 'Kapasitas Saya')}
              </h3>
              {(isWeeklyOverload || isMonthlyOverload) && (
                <div className="flex items-center gap-2">
                  {isWeeklyOverload && (
                    <span className="text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full border border-red-200 dark:border-red-800/50">
                      ⚠️ {tMsg('Weekly Overload', 'Beban Mingguan Berlebih')}
                    </span>
                  )}
                  {isMonthlyOverload && (
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800/50">
                      ⚠️ {tMsg('Monthly Overload', 'Beban Bulanan Berlebih')}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {Math.round(myActiveWorkloadEtc * 10) / 10}<span className="text-lg">h</span>
              </div>
              <div className="flex-1">
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${myTotalWorkloadEtc > 0 ? (myWorkload.done_etc / myTotalWorkloadEtc) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium flex justify-between">
                  <span>{tMsg('Remaining Work', 'Sisa Pekerjaan')}</span>
                  <span>
                    {Math.round(myWorkload.done_etc * 10) / 10}h / {Math.round(myTotalWorkloadEtc * 10) / 10}h {tMsg('Done', 'Selesai')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="tour-quick-stats grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div 
            onClick={() => {
              setSelectedBoard({ id: 'global', name: `🌍 ${tMsg('See the Big Picture', 'Lihat Gambaran Besar')}`, role: 'owner', isVirtual: true });
              setShowMyTasks(true);
              setShowOverdueOnly(false);
            }}
            className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:border-black dark:hover:border-white transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="text-2xl mb-3 group-hover:scale-110 transition-transform origin-left">📋</div>
              <div className="text-4xl font-black text-black dark:text-white mb-1">
                {isLoading ? (
                  <div className="w-12 h-10 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse my-0.5"></div>
                ) : (
                  myTasks.length
                )}
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{tMsg('My Tasks', 'Tugas Saya')}</div>
          </div>
          
          <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-3">📂</div>
              <div className="text-4xl font-black text-black dark:text-white mb-1">
                {isLoading ? (
                  <div className="w-12 h-10 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse my-0.5"></div>
                ) : (
                  activeProjectsCount
                )}
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{tMsg('Active Projects', 'Proyek Aktif')}</div>
          </div>

          <div 
            onClick={() => {
              setSelectedBoard({ id: 'global', name: `🌍 ${tMsg('See the Big Picture', 'Lihat Gambaran Besar')}`, role: 'owner', isVirtual: true });
              setShowOverdueOnly(true);
              setShowMyTasks(false);
            }}
            className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-red-100 dark:border-red-900/30 p-6 rounded-2xl shadow-sm relative overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <div className="text-2xl mb-3 relative z-10">⚠️</div>
              <div className="text-4xl font-black text-amber-600 dark:text-amber-500 mb-1 relative z-10">
                {isLoading ? (
                  <div className="w-12 h-10 bg-amber-200/50 dark:bg-amber-900/20 rounded animate-pulse my-0.5"></div>
                ) : (
                  overdueTasksCount
                )}
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest relative z-10 mt-2">{tMsg('Overdue Tasks', 'Tugas Terlambat')}</div>
          </div>

          <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-red-100 dark:border-red-900/30 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <div className="text-2xl mb-3 relative z-10">🚨</div>
              <div className="text-4xl font-black text-red-600 dark:text-red-500 mb-1 relative z-10">
                {isLoading ? (
                  <div className="w-12 h-10 bg-red-200/50 dark:bg-red-900/20 rounded animate-pulse my-0.5"></div>
                ) : (
                  criticalProjectsCount
                )}
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest relative z-10 mt-2">{tMsg('Critical Projects', 'Proyek Kritis')}</div>
          </div>
        </div>

        {/* Bottom Section: Quick Feeds */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Top Queue Tasks */}
          <div className="tour-top-queue bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col h-full min-h-75">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-widest flex items-center gap-2 shrink-0">
              <span>⚡</span> {tMsg('My Top Queue', 'Antrean Teratas Saya')}
            </h3>
            <div className="flex-1 space-y-1 pr-2">
              {topQueueTasks.length > 0 ? topQueueTasks.map((task, index) => (
                <div 
                  key={task.id} 
                  onClick={() => openTaskInGlobal(task)}
                  className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 py-3 last:border-0 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 px-2 -mx-2 rounded-lg transition-colors"
                >
                  <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate" title={task.project_name || task.title}>{task.project_name || task.title}</div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide text-[10px] mt-1">
                      <span className="text-slate-500 shrink-0 font-medium">
                        {boards.find(b => parseInt(b.id) === parseInt(task.board_id))?.name || 'Global'}
                      </span>
                      
                      {/* Assignee Avatar */}
                      {(() => {
                        const assigneeName = getTaskAssignee(task).replace('@', '');
                        return (
                          <div className="flex items-center shrink-0 ml-1" title={`Assignee: ${assigneeName}`}>
                            <Avatar name={assigneeName} url={avatarsMap?.[assigneeName]} size="w-3.5 h-3.5" textClass="text-[6px]" />
                          </div>
                        );
                      })()}

                      {/* Category */}
                      {task.category && (
                        <span className="shrink-0 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-medium border border-neutral-200 dark:border-neutral-700">
                          {task.category}
                        </span>
                      )}

                      {/* Impact */}
                      {task.impact && (
                        <span className={`shrink-0 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 ${
                          task.impact === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900/50' :
                          task.impact === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50' :
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-900/50'
                        }`}>
                          {task.impact === 'High' ? '🔥' : task.impact === 'Medium' ? '⚡' : '🌱'} {task.impact}
                        </span>
                      )}

                      {/* Recurring */}
                      {task.recurring && task.recurring !== 'none' && (
                        <span className="shrink-0 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5 border border-purple-200 dark:border-purple-900/50">
                          🔄 {task.recurring}
                        </span>
                      )}

                      {/* ETC */}
                      {task.etc && (
                        <span className="shrink-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5 border border-blue-200 dark:border-blue-900/50">
                          ⏱ {task.etc}
                        </span>
                      )}
                    </div>

                    {/* Dates / Countdown (Row 3) */}
                    {(task.start_date || task.deadline) && (
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1.5">
                        {task.start_date && (
                          <div>
                            <span className="font-medium">Start: </span>
                            {formatDateMMM(task.start_date)}
                          </div>
                        )}
                        {task.deadline && (() => {
                          const dlInfo = getTaskDeadlineInfo(task);
                          return (
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold">Due: </span>
                              <span className={`font-bold ${dlInfo.color}`}>{formatDateMMM(task.deadline)}</span>
                              <span className={`px-1.5 py-0.5 rounded font-black border tracking-wider text-[9px] ${dlInfo.badgeColor}`}>
                                {dlInfo.timeStr}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-sm text-slate-500 flex flex-col items-center h-full justify-center text-center gap-2">
                  <div className="text-4xl">🎉</div>
                  <div>{tMsg('You have no pending tasks! You are all caught up.', 'Tidak ada tugas tertunda! Anda sudah menyelesaikan semuanya.')}</div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Comments */}
          <div className="tour-recent-comments bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col h-full min-h-75">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-widest flex items-center gap-2 shrink-0">
              <span>💬</span> {tMsg('Recent Comments', 'Komentar Terbaru')}
            </h3>
            <div className="flex-1 space-y-3 pr-2">
              {isInboxLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
                </div>
              ) : (() => {
                const visibleChats = inboxChats.filter(chat => {
                  const displayMessage = chat.latest_message || '';
                  return !displayMessage.includes('<!--PRIVATE:');
                });
                return visibleChats.length > 0 ? visibleChats.slice(0, 4).map(chat => {
                  let displayMessage = chat.latest_message || 'No message content';
                  const isUnread = (() => {
                    if (chat.latest_sender === currentUser) return false;
                    if (chat.is_dm) return chat.unread_count > 0;
                    if (chat.is_project_chat) {
                      const lastRead = localStorage.getItem(`innocean_last_read_board_${chat.board_id}_${currentUser}`);
                      const hasUnreadNotification = (notifications || []).some(
                        n => !n.is_read && String(n.related_task_id) === String(chat.board_id) && 
                        (n.type === 'team_chat' || n.type === 'team_chat_no_email' || n.type === 'mention' || n.type === 'mention_no_email')
                      );
                      if (!lastRead) return true;
                      return chat.timestamp > lastRead || hasUnreadNotification;
                    } else {
                      const lastRead = localStorage.getItem(`innocean_last_read_task_${chat.task_id}_${currentUser}`);
                      const hasUnreadNotification = (notifications || []).some(
                        n => !n.is_read && String(n.related_task_id) === String(chat.task_id) && 
                        (n.type === 'comment' || n.type === 'mention' || n.type === 'mention_no_email')
                      );
                      if (!lastRead) return true;
                      return chat.timestamp > lastRead || hasUnreadNotification;
                    }
                  })();

                  return (
                    <div 
                      key={`${chat.is_dm ? 'dm-' + chat.partner_username : chat.task_id}-${chat.timestamp}`}
                      onClick={() => {
                        if (chat.is_dm) {
                          setWorkspaceChatTarget({
                            type: 'dm',
                            id: chat.partner_username,
                            name: chat.partner_username,
                            partner: chat.partner_username,
                          });
                          setIsChatWorkspaceOpen(true);
                        } else if (chat.is_project_chat) {
                          setWorkspaceChatTarget({
                            type: 'project',
                            id: chat.board_id,
                            name: chat.board_name || 'Project Chat',
                            board_id: chat.board_id,
                          });
                          setIsChatWorkspaceOpen(true);
                        } else {
                          handleNotificationTaskClick(chat.task_id);
                        }
                      }}
                      className={`flex flex-col gap-1 border-b border-neutral-100 dark:border-neutral-800 pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 p-2 -mx-2 rounded-lg transition-all ${
                        isUnread 
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-l-2 border-l-indigo-500 pl-3' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-lg shrink-0">
                          {chat.is_dm ? '💬' : chat.is_project_chat ? '🏢' : '📋'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                            {chat.is_dm
                              ? `DM: @${chat.partner_username}`
                              : chat.is_project_chat
                              ? `Project: ${chat.board_name}`
                              : chat.project_name}
                            {isUnread && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 inline-block animate-pulse" title="Unread" />
                            )}
                          </div>
                          <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                            @{chat.latest_sender}
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium ml-auto shrink-0 self-start">
                          {formatDateMMM(chat.timestamp)}
                        </div>
                      </div>
                      {!chat.is_dm && (
                        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mt-1 line-clamp-2 pl-7">
                          {cleanMarkdown(displayMessage)}
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <div className="text-sm text-slate-500 flex flex-col items-center h-full justify-center text-center gap-2">
                    <div className="text-4xl">💭</div>
                    <div>{tMsg('No recent comments found.', 'Tidak ada komentar terbaru.')}</div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Getting Started CTA */}
        <div className="mt-8 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 text-center flex flex-col items-center pb-10">
          <div className="text-4xl mb-4 animate-bounce">🚀</div>
          <h3 className="text-xl font-black text-black dark:text-white mb-2">
            {tMsg('Ready to get things done?', 'Siap untuk menyelesaikan tugas?')}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto text-sm mb-6 leading-relaxed">
            {tMsg(
              'Select a project from the sidebar to view your board, or see the big picture to see everything at once.',
              'Pilih proyek dari sidebar untuk melihat papan Anda, atau lihat gambaran besar untuk melihat semuanya sekaligus.'
            )}
          </p>
          <button
            onClick={() => {
              setSelectedBoard({ id: 'global', name: `🌍 ${tMsg('See the Big Picture', 'Lihat Gambaran Besar')}`, role: 'owner', isVirtual: true });
              setShowMyTasks(false);
              setShowOverdueOnly(false);
            }}
            className="group relative inline-flex items-center justify-center gap-3 bg-black dark:bg-white text-white dark:text-black font-black py-4 px-10 rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 text-sm md:text-base overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <span className="text-xl group-hover:scale-125 transition-transform duration-300">🌍</span> 
            <span>{tMsg('Master View', 'Tampilan Master')}</span>
            <span className="text-xl group-hover:translate-x-2 transition-transform duration-300">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
