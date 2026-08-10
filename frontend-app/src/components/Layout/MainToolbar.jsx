import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { IconPlus } from '../../SharedUI';
import BoardFilterSort from '../BoardFilterSort';
import QuickFiltersPopover from '../QuickFiltersPopover';
import { LiveClock } from '../../Widgets';
import { Icon } from '../icons/Icon';
import { useFeatureFlags } from '../../featureFlags';

export default function MainToolbar() {
  const {
    TEAM_CHAT_UI_ENABLED,
    EXPORT_CSV_UI_ENABLED,
    GET_ALL_DATA_UI_ENABLED,
  } = useFeatureFlags();
  const {
    language,
    selectedBoard,
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
    workspaceRole,
  } = useAppContext();

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = React.useState(false);
  const tMsg = (en, id) => (language === 'id' ? id : en);
  const canCreateTasks =
    workspaceRole === 'admin' ||
    workspaceRole === 'project_owner' ||
    workspaceRole === 'manager' ||
    !workspaceRole;
  const canInviteAndShare = workspaceRole !== 'staff';

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

  const viewTabIcons = {
    kanban: <Icon name='columns-2' className='w-3.5 h-3.5' />,
    list: <Icon name='list' className='w-3.5 h-3.5' />,
    timeline: <Icon name='chart-gantt' className='w-3.5 h-3.5' />,
    calendar: <Icon name='calendar' className='w-3.5 h-3.5' />,
    analytics: <Icon name='chart-no-axes-column' className='w-3.5 h-3.5' />,
  };
  const viewTabLabels = {
    kanban: 'Board',
    list: 'List',
    timeline: 'Timeline',
    calendar: 'Calendar',
    analytics: 'Analytics',
  };

  const renderUtilityActions = () => {
    const showBoardUtilities =
      !selectedBoard.is_private &&
      selectedBoard.id !== 'global' &&
      (canInviteAndShare ||
        TEAM_CHAT_UI_ENABLED ||
        EXPORT_CSV_UI_ENABLED ||
        GET_ALL_DATA_UI_ENABLED);

    const toolBtnClass =
      'theme-interactive inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-500 rounded-lg transition-colors relative whitespace-nowrap shrink-0';

    return (
      <>
        {invitations && invitations.length > 0 && (
          <button
            onClick={() => setIsInvitesModalOpen(true)}
            className='inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors relative whitespace-nowrap shrink-0'
            title={tMsg('Team Invitations', 'Undangan Tim')}>
            <Icon name='mail' className='w-4 h-4' />
            <span>{tMsg('Invites', 'Undangan')}</span>
            <span className='absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse'></span>
          </button>
        )}
        {showBoardUtilities && (
          <div className='flex items-center gap-1 tour-team-menu flex-wrap'>
            {canInviteAndShare && (
              <button
                onClick={() => openTeamModal(selectedBoard.id)}
                disabled={accountStatus === 'suspended'}
                className={toolBtnClass}
                title={tMsg('Manage Team', 'Kelola Tim')}>
                <Icon name='users' className='w-4 h-4' />
                <span>{tMsg('Invite Team', 'Undang Tim')}</span>
                {selectedBoard.access_requests_count > 0 &&
                  selectedBoard.role === 'owner' && (
                    <span className='absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse'></span>
                  )}
              </button>
            )}
            {TEAM_CHAT_UI_ENABLED && (
              <button
                onClick={() => {
                  setIsProjectChatOpen(true);
                  setDrawerTab('team');
                }}
                className={toolBtnClass}
                title={tMsg('Team Chat', 'Obrolan Tim')}>
                <Icon name='message-circle' className='w-4 h-4' />
                <span>{tMsg('Team Chat', 'Obrolan Tim')}</span>
              </button>
            )}
            {canInviteAndShare && (
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
                  showNotification(
                    tMsg('Project link copied!', 'Tautan proyek disalin!'),
                    'success'
                  );
                }}
                className={toolBtnClass}
                title={tMsg('Share Project', 'Bagikan Proyek')}>
                <Icon name='link' className='w-4 h-4' />
                <span>{tMsg('Share Project', 'Bagikan Proyek')}</span>
              </button>
            )}
            {EXPORT_CSV_UI_ENABLED && (
              <button
                onClick={() => {
                  setExportMode('board');
                  setIsExportModalOpen(true);
                }}
                className={toolBtnClass}
                title={tMsg('Export CSV', 'Ekspor CSV')}>
                <Icon name='save' className='w-4 h-4' />
                <span>{tMsg('Export CSV', 'Ekspor CSV')}</span>
              </button>
            )}
            {GET_ALL_DATA_UI_ENABLED && (
              <button
                onClick={() => {
                  setExportMode('global');
                  setIsExportModalOpen(true);
                }}
                className={toolBtnClass}
                title={tMsg('Get All My Data', 'Dapatkan Semua Data')}>
                <Icon name='globe' className='w-4 h-4' />
                <span>{tMsg('Get All My Data', 'Dapatkan Semua Data')}</span>
              </button>
            )}
          </div>
        )}
      </>
    );
  };

  const renderSearchField = () => (
    <div className='relative flex-1 md:flex-initial'>
      <span className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none'>
        <Icon name='search' className='w-4 h-4' />
      </span>
      <input
        type='text'
        placeholder={tMsg('Search tasks...', 'Cari tugas...')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className='pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none w-full md:w-48 transition-all text-sm'
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10'
          title='Clear Search'>
          <Icon name='x' className='w-4 h-4' />
        </button>
      )}
    </div>
  );

  const renderNewTaskButton = ({ fullWidth = false } = {}) =>
    canCreateTasks && selectedBoard?.id !== 'global' ? (
      <button
        onClick={handleOpenNewTaskForm}
        disabled={accountStatus === 'suspended'}
        className={`bg-black dark:bg-white dark:text-slate-900 text-white font-bold py-2 px-3 sm:px-4 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 text-sm tour-new-task disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 ${
          fullWidth ? 'w-full' : 'shrink-0'
        }`}>
        <IconPlus className='w-4 h-4' />
        <span className={fullWidth ? 'inline' : 'hidden sm:inline'}>
          {tMsg('Create Task', 'Buat Tugas')}
        </span>
      </button>
    ) : null;

  return (
    <header className='px-4 py-3 md:px-6 md:py-6 flex flex-col gap-3 md:gap-4 shrink-0 border-b border-neutral-100 dark:border-neutral-800/50 md:border-b-0'>
      {/* Title + tools + desktop actions */}
      <div className='flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4'>
        <div className='flex flex-wrap items-center gap-2 sm:gap-3 min-w-0'>
          <h2 className='text-2xl sm:text-xl lg:text-3xl font-extrabold text-slate-800 dark:text-white capitalize shrink-0'>
            {selectedBoard.id === 'global'
              ? tMsg('My Tasks', 'Tugas Saya')
              : selectedBoard.name}
          </h2>
          {renderUtilityActions()}
        </div>

        {/* Desktop: clock + new */}
        <div className='hidden md:flex items-center gap-3 w-auto shrink-0'>
          {showLiveClock && (
            <LiveClock
              showLiveClockDate={showLiveClockDate}
              language={language}
            />
          )}
          {renderNewTaskButton()}
        </div>
      </div>

      {/* View tabs — pill segmented control (theme-aware active bg) */}
      <div className='w-full overflow-x-auto custom-scrollbar tour-views'>
        <div className='inline-flex items-center gap-1 p-1 rounded-none bg-transparent w-full border-t md:border-t-0 border-b border-neutral-200 dark:border-neutral-700'>
          {['kanban', 'list', 'timeline', 'calendar', 'analytics']
            .filter((v) => v !== 'analytics' || workspaceRole !== 'staff')
            .map((v) => {
              const isActive = viewMode === v;
              return (
                <button
                  key={v}
                  type='button'
                  onClick={() => {
                    if (v === 'timeline' && groupBy === 'Status')
                      setGroupBy('Project');
                    else if (v === 'kanban' && groupBy === 'Project')
                      setGroupBy('Status');
                    setViewMode(v);
                  }}
                  className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all capitalize whitespace-nowrap shrink-0 rounded-lg ${
                    isActive
                      ? 'theme-tab-active shadow-sm'
                      : 'theme-interactive text-slate-500 dark:text-slate-400'
                  }`}>
                  {viewTabIcons[v]}
                  {viewTabLabels[v]}
                </button>
              );
            })}
        </div>
      </div>

      {/* Mobile: create task (full width) then search + filters */}
      <div className='flex md:hidden flex-col gap-2 w-full shrink-0'>
        {renderNewTaskButton({ fullWidth: true })}
        <div className='flex items-center gap-2 w-full'>
          {renderSearchField()}
          <button
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className={`theme-interactive p-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 text-xs font-bold shrink-0 ${
              isMobileFiltersOpen || hasActiveFilters
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            title={tMsg('Toggle Filters', 'Tampilkan Filter')}>
            <Icon name='sliders' className='w-4 h-4' />
            <span>{tMsg('Filters', 'Filter')}</span>
            {hasActiveFilters && (
              <span className='w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse'></span>
            )}
          </button>
        </div>
      </div>

      {/* Desktop: search (left) + Filter + Display (right) */}
      <div className='hidden md:flex items-center justify-between gap-3 w-full tour-filters'>
        <div className='shrink-0'>{renderSearchField()}</div>
        <div className='flex items-center gap-2 shrink-0'>
          <QuickFiltersPopover
            language={language}
            accountStatus={accountStatus}
            viewMode={viewMode}
            selectedBoard={selectedBoard}
            showMyTasks={showMyTasks}
            setShowMyTasks={setShowMyTasks}
            showOverdueOnly={showOverdueOnly}
            setShowOverdueOnly={setShowOverdueOnly}
            showUnreadOnly={showUnreadOnly}
            setShowUnreadOnly={setShowUnreadOnly}
            showHasSubtasks={showHasSubtasks}
            setShowHasSubtasks={setShowHasSubtasks}
            hideCompleted={hideCompleted}
            setHideCompleted={setHideCompleted}
          />
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

      {/* Mobile: filter chips when Filters opened */}
      <div
        className={`${isMobileFiltersOpen ? 'flex' : 'hidden'} md:hidden flex-nowrap items-center justify-between gap-2 overflow-x-auto custom-scrollbar`}>
        <div className='flex flex-nowrap items-center gap-1.5 shrink-0'>
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
            }`}>
            <Icon name='user' className='w-3.5 h-3.5' />
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
            }`}>
            <Icon name='alert-triangle' className='w-3.5 h-3.5' />
            {tMsg('Overdue', 'Terlambat')}
          </button>
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`py-1.5 px-3 rounded-full shadow-sm focus:outline-none text-xs font-semibold transition-all border flex justify-center items-center gap-1.5 whitespace-nowrap shrink-0 ${
              showUnreadOnly
                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-300'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}>
            <Icon name='message-square' className='w-3.5 h-3.5' />
            {tMsg('Unread', 'Belum Dibaca')}
          </button>
          <button
            onClick={() => setShowHasSubtasks(!showHasSubtasks)}
            className={`py-1.5 px-3 rounded-full shadow-sm focus:outline-none text-xs font-semibold transition-all border flex justify-center items-center gap-1.5 whitespace-nowrap shrink-0 ${
              showHasSubtasks
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-300'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}>
            <Icon name='square-check' className='w-3.5 h-3.5' />
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
              title={tMsg(
                'Hide Done & Rejected tasks to declutter the view',
                'Sembunyikan tugas Selesai & Ditolak agar tampilan lebih bersih'
              )}>
              {hideCompleted ? (
                <>
                  <Icon name='eye-off' className='w-3.5 h-3.5' />
                  {tMsg('Completed Hidden', 'Selesai Disembunyikan')}
                </>
              ) : (
                <>
                  <Icon name='eye' className='w-3.5 h-3.5' />
                  {tMsg('Show Completed', 'Tampilkan Selesai')}
                </>
              )}
            </button>
          )}
        </div>

        <div className='flex items-center gap-2 shrink-0 ml-auto'>
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
