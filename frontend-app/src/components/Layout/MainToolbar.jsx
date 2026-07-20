import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { IconPlus } from '../../SharedUI';
import BoardFilterSort from '../BoardFilterSort';
import { LiveClock } from '../../Widgets';

export default function MainToolbar() {
  const {
    language,
    selectedBoard,
    setSelectedBoard,
    setIsProactiveAIOpen,
    viewMode,
    showLiveClock,
    showLiveClockDate,
    invitations,
    setIsInvitesModalOpen,
    openTeamModal,
    accountStatus,
    setIsProjectChatOpen,
    setDrawerTab,
    showNotification,
    setExportMode,
    setIsExportModalOpen,
    searchQuery,
    setSearchQuery,
    handleOpenNewTaskForm,
    groupBy,
    setGroupBy,
    setViewMode,
    showMyTasks,
    setShowMyTasks,
    showOverdueOnly,
    setShowOverdueOnly,
    showUnreadOnly,
    setShowUnreadOnly,
    showHasSubtasks,
    setShowHasSubtasks,
    hideCompleted,
    setHideCompleted,
    sortBy,
    setSortBy,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    filterAssignee,
    setFilterAssignee,
    columns,
    categories,
    assigneeOptions,
    teamMembers,
    setColModal,
  } = useAppContext();

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = React.useState(false);
  const tMsg = (en, id) => (language === 'id' ? id : en);

  // Check if any filters are active to highlight the filter toggle button
  const hasActiveFilters = 
    showMyTasks || 
    showOverdueOnly || 
    showUnreadOnly || 
    showHasSubtasks || 
    hideCompleted || 
    filterStatus || 
    filterCategory || 
    filterAssignee;

  return (
    <header className="px-4 py-3 md:px-6 md:py-6 flex flex-col gap-3 md:gap-4 shrink-0 border-b border-neutral-100 dark:border-neutral-800/50 md:border-b-0">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-500 mb-0.5 md:mb-1 flex items-center gap-1.5 tour-breadcrumb">
            <span 
              onClick={() => {
                setSelectedBoard(null);
                setIsProactiveAIOpen(false);
              }}
              className="cursor-pointer hover:text-indigo-600 hover:underline transition-colors flex items-center gap-1 shrink-0"
              title={tMsg('Go to Dashboard', 'Kembali ke Dashboard')}
            >
              <span>🏠</span> <span className="hidden sm:inline">{tMsg('Dashboard', 'Dashboard')}</span>
            </span>
            <span className="text-neutral-300 dark:text-neutral-600">/</span>
            <span className="truncate max-w-37.5 sm:max-w-50">
              {selectedBoard.id === 'global' ? tMsg('Master View', 'Tampilan Utama') : selectedBoard.name}
            </span>
          </div>
          <h2 className="text-lg md:text-2xl font-extrabold text-slate-800 dark:text-white capitalize">
            {viewMode === 'kanban' ? 'Kanban Board' : viewMode === 'list' ? 'Table List' : viewMode}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-sm font-medium mt-0.5 md:mt-1">
            {viewMode === 'kanban'
              ? tMsg(
                  'Manage and track your operational tasks efficiently.',
                  'Kelola dan lacak tugas operasional Anda dengan efisien.'
                )
              : viewMode === 'list'
              ? tMsg(
                  'View your tasks in a compact spreadsheet format.',
                  'Lihat tugas Anda dalam format lembar kerja yang ringkas.'
                )
              : viewMode === 'analytics'
              ? tMsg(
                  "Monitor your team's performance and project health.",
                  'Pantau kinerja tim dan kesehatan proyek Anda.'
                )
              : viewMode === 'timeline'
              ? tMsg(
                  'Visualize project schedules and manage resource allocation.',
                  'Visualisasikan jadwal proyek dan kelola alokasi sumber daya.'
                )
              : viewMode === 'calendar'
              ? tMsg(
                  'Track deadlines and milestones in a monthly view.',
                  'Lacak tenggat waktu dan pencapaian dalam tampilan bulanan.'
                )
              : tMsg(
                  'Manage and track your operational tasks efficiently.',
                  'Kelola dan lacak tugas operasional Anda dengan efisien.'
                )}
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 w-full md:w-auto">
          <div className="hidden md:block">
            {showLiveClock && (
              <LiveClock showLiveClockDate={showLiveClockDate} language={language} />
            )}
          </div>
          <div className="flex items-center gap-1.5 w-full md:w-auto justify-between md:justify-end pb-2 md:pb-0 border-b border-neutral-100 dark:border-neutral-800 md:border-0 shrink-0">
            {invitations && invitations.length > 0 && (
              <button
                onClick={() => setIsInvitesModalOpen(true)}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors relative"
                title={tMsg('Team Invitations', 'Undangan Tim')}
              >
                📩
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>
            )}
            {!selectedBoard.is_private && selectedBoard.id !== 'global' && (
              <div className="flex items-center gap-1.5 tour-team-menu w-full md:w-auto justify-end">
                <button
                  onClick={() => openTeamModal(selectedBoard.id)}
                  disabled={accountStatus === 'suspended'}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors relative"
                  title={tMsg('Manage Team', 'Kelola Tim')}
                >
                  👥
                  {selectedBoard.access_requests_count > 0 && selectedBoard.role === 'owner' && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsProjectChatOpen(true);
                    setDrawerTab('team');
                  }}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors relative"
                  title={tMsg('Team Chat', 'Obrolan Tim')}
                >
                  💬
                </button>
                <button
                  onClick={() => {
                    const slug = selectedBoard.name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)+/g, '');
                    const url = `${window.location.origin}/project/${selectedBoard.id}-${slug}`;
                    navigator.clipboard.writeText(url).catch(() => {
                      const temp = document.createElement('textarea');
                      temp.value = url;
                      document.body.appendChild(temp);
                      temp.select();
                      document.execCommand('copy');
                      document.body.removeChild(temp);
                    });
                    showNotification(tMsg('Project link copied!', 'Tautan proyek disalin!'), 'success');
                  }}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                  title={tMsg('Share Project', 'Bagikan Proyek')}
                >
                  🔗
                </button>
                <button
                  onClick={() => {
                    setExportMode('board');
                    setIsExportModalOpen(true);
                  }}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                  title={tMsg('Export CSV', 'Ekspor CSV')}
                >
                  💾
                </button>
                <button
                  onClick={() => {
                    setExportMode('global');
                    setIsExportModalOpen(true);
                  }}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                  title={tMsg('Get All My Data', 'Dapatkan Semua Data')}
                >
                  🌍
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <div className="relative flex-1 md:flex-initial">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
                🔍
              </span>
              <input
                type="text"
                placeholder={tMsg('Search tasks...', 'Cari tugas...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none w-full md:w-48 transition-all text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10"
                  title="Clear Search"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className={`md:hidden p-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 text-xs font-bold shrink-0 ${
                isMobileFiltersOpen || hasActiveFilters
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title={tMsg('Toggle Views & Filters', 'Tampilkan Tampilan & Filter')}
            >
              <span>🎛️</span>
              <span>{tMsg('Filters', 'Filter')}</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse"></span>
              )}
            </button>
            <button
              onClick={handleOpenNewTaskForm}
              disabled={accountStatus === 'suspended' || selectedBoard.id === 'global'}
              className="bg-black dark:bg-white dark:text-slate-900 text-white font-bold py-2 px-3 sm:px-4 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 text-sm shrink-0 tour-new-task disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            >
              <IconPlus className="w-4 h-4" /> <span className="hidden sm:inline">{tMsg('New Request', 'Permintaan Baru')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`${isMobileFiltersOpen ? 'flex' : 'hidden md:flex'} flex-col gap-3 w-full border-t border-neutral-100 dark:border-neutral-800/50 pt-3 md:border-0 md:pt-0 md:flex-row md:items-center md:justify-between`}>
        <div className="flex flex-nowrap lg:flex-wrap items-center gap-2 sm:gap-3 w-full pb-2 lg:pb-0 overflow-x-auto custom-scrollbar">
          <div className="flex flex-nowrap lg:flex-wrap bg-slate-200 dark:bg-slate-800 p-1 rounded-lg shrink-0 tour-views gap-1 sm:gap-0">
            {['kanban', 'list', 'analytics', 'timeline', 'calendar'].map((v) => {
              const icons = {
                kanban: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <path d="M9 3v18"></path>
                    <path d="M15 3v18"></path>
                  </svg>
                ),
                list: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                ),
                analytics: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                    <line x1="2" y1="20" x2="22" y2="20"></line>
                  </svg>
                ),
                timeline: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18"></path>
                    <rect x="7" y="7" width="5" height="4" rx="1"></rect>
                    <rect x="14" y="13" width="6" height="4" rx="1"></rect>
                  </svg>
                ),
                calendar: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                ),
              };
              const labels = {
                kanban: 'Board',
                list: 'List',
                analytics: 'Analytics',
                timeline: 'Timeline',
                calendar: 'Calendar',
              };
              return (
                <button
                  key={v}
                  onClick={() => {
                    if (v === 'timeline' && groupBy === 'Status') setGroupBy('Project');
                    else if (v === 'kanban' && groupBy === 'Project') setGroupBy('Status');
                    setViewMode(v);
                  }}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold transition-all capitalize whitespace-nowrap shrink-0 ${
                    viewMode === v
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {icons[v]}
                  {labels[v]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-nowrap lg:flex-wrap items-center gap-1.5 shrink-0 tour-filters overflow-x-auto custom-scrollbar pb-2 md:pb-0">
          <button
            onClick={() => {
              setShowMyTasks(!showMyTasks);
              if (!showMyTasks) setShowOverdueOnly(false);
            }}
            disabled={accountStatus === 'suspended'}
            className={`py-1.5 px-3 rounded-full shadow-sm focus:outline-none text-xs font-semibold transition-all border flex justify-center items-center gap-1.5 whitespace-nowrap shrink-0 ${
              showMyTasks
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            My Tasks
          </button>
          <button
            onClick={() => {
              setShowOverdueOnly(!showOverdueOnly);
              if (!showOverdueOnly) setShowMyTasks(false);
            }}
            className={`py-1.5 px-3 rounded-full shadow-sm focus:outline-none text-xs font-semibold transition-all border flex justify-center items-center gap-1.5 whitespace-nowrap shrink-0 ${
              showOverdueOnly
                ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-300'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            {tMsg('Overdue', 'Terlambat')}
          </button>
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`py-1.5 px-3 rounded-full shadow-sm focus:outline-none text-xs font-semibold transition-all border flex justify-center items-center gap-1.5 whitespace-nowrap shrink-0 ${
              showUnreadOnly
                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-300'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            {tMsg('Unread', 'Belum Dibaca')}
          </button>
          <button
            onClick={() => setShowHasSubtasks(!showHasSubtasks)}
            className={`py-1.5 px-3 rounded-full shadow-sm focus:outline-none text-xs font-semibold transition-all border flex justify-center items-center gap-1.5 whitespace-nowrap shrink-0 ${
              showHasSubtasks
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-300'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            {tMsg('Has Subtasks', 'Ada Sub-tugas')}
          </button>

          {(viewMode === 'kanban' ||
            viewMode === 'list' ||
            viewMode === 'timeline' ||
            viewMode === 'calendar') && (
            <button
              onClick={() => setHideCompleted(!hideCompleted)}
              className={`py-1.5 px-3 rounded-full shadow-sm focus:outline-none text-xs font-semibold transition-all border flex justify-center items-center gap-1.5 whitespace-nowrap shrink-0 ${
                hideCompleted
                  ? 'bg-slate-100 border-slate-300 text-slate-500 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-400'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
              title={tMsg('Hide Done & Rejected tasks to declutter the view', 'Sembunyikan tugas Selesai & Ditolak agar tampilan lebih bersih')}
            >
              {hideCompleted ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  {tMsg('Completed Hidden', 'Selesai Disembunyikan')}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  {tMsg('Show Completed', 'Tampilkan Selesai')}
                </>
              )}
            </button>
          )}

          <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 shrink-0 block mx-1"></div>

          <BoardFilterSort
            columns={columns}
            categories={categories}
            assigneeOptions={assigneeOptions}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterAssignee={filterAssignee}
            setFilterAssignee={setFilterAssignee}
            groupBy={groupBy}
            setGroupBy={setGroupBy}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        </div>
      </div>
    </header>
  );
}
