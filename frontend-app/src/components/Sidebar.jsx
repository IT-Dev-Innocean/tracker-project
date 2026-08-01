import { useMemo, useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { IconPlus } from '../SharedUI';
import { HighlightText } from '../Utils';
import InnoceanLogo from './InnoceanLogo';
import { Icon } from './icons/Icon';
import {
  MASTER_VIEW_UI_ENABLED,
  TIMESHEETS_UI_ENABLED,
  TODO_LIST_UI_ENABLED,
} from '../featureFlags';

export default function Sidebar() {
  const {
    currentUser,
    boards,
    selectedBoard,
    setSelectedBoard,
    favoriteBoards,
    setFavoriteBoards,
    notifications,
    setIsCreateBoardOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    language,
    isProactiveAIOpen,
    setIsProactiveAIOpen,
    globalSearchQuery,
    setGlobalSearchQuery,
    setIsGlobalSearchOpen,
    globalSearchResults,
    isGlobalSearchOpen,
    isGlobalSearchClosing,
    closeGlobalSearch,
    handleGlobalSearchSelect,
    accountStatus,
    showNotification,
    formatDateMMM,
    isSuperAdmin,
    openAdminModal,
    setBoardToDelete,
    showTimesheets,
    setShowTimesheets,
    showTeams,
    setShowTeams,
    showAdmin,
    setShowAdmin,
    showProjectManage,
    setShowProjectManage,
    sidebarNav,
    setSidebarNav,
    userDirectory,
    workspaceRole,
    setIsChatWorkspaceOpen,
    setExportMode,
    setIsExportModalOpen,
    inboxChats,
    dmConversations,
  } = useAppContext();

  const tMsg = (en, id) => (language === 'id' ? id : en);
  const canCreateProjects =
    workspaceRole === 'admin' ||
    workspaceRole === 'project_owner' ||
    (!workspaceRole && isSuperAdmin);
  const canManageProjectDir =
    workspaceRole === 'admin' ||
    workspaceRole === 'project_owner' ||
    isSuperAdmin;
  const isAdminRole = workspaceRole === 'admin' || isSuperAdmin;
  const canOpenTeams =
    workspaceRole === 'admin' ||
    workspaceRole === 'project_owner' ||
    isSuperAdmin;

  // Sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined')
      return localStorage.getItem('innocean_sidebar_collapsed') === 'true';
    return false;
  });
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('innocean_sidebar_collapsed', String(next));
      return next;
    });
  };

  const unreadInboxChatsCount = useMemo(() => {
    return (inboxChats || []).filter((chat) => {
      if (chat.latest_sender === currentUser) return false;
      if (chat.is_dm) return (chat.unread_count || 0) > 0;
      if (chat.is_project_chat) {
        const lastRead = localStorage.getItem(
          `innocean_last_read_board_${chat.board_id}_${currentUser}`
        );
        const hasUnreadNotification = (notifications || []).some(
          (n) =>
            !n.is_read &&
            String(n.related_task_id) === String(chat.board_id) &&
            (n.type === 'team_chat' ||
              n.type === 'team_chat_no_email' ||
              n.type === 'mention' ||
              n.type === 'mention_no_email')
        );
        if (!lastRead) return true;
        return chat.timestamp > lastRead || hasUnreadNotification;
      }
      const lastRead = localStorage.getItem(
        `innocean_last_read_task_${chat.task_id}_${currentUser}`
      );
      const hasUnreadNotification = (notifications || []).some(
        (n) =>
          !n.is_read &&
          String(n.related_task_id) === String(chat.task_id) &&
          (n.type === 'comment' ||
            n.type === 'mention' ||
            n.type === 'mention_no_email')
      );
      if (!lastRead) return true;
      return chat.timestamp > lastRead || hasUnreadNotification;
    }).length;
  }, [inboxChats, notifications, currentUser]);

  const totalUnreadChats = useMemo(() => {
    const unreadDms = (dmConversations || []).reduce(
      (sum, convo) => sum + (convo.unread_count || 0),
      0
    );
    const unreadMentionsAndComments = (notifications || []).filter(
      (n) =>
        !n.is_read &&
        (n.type === 'comment' ||
          n.type === 'mention' ||
          n.type === 'mention_no_email' ||
          n.type === 'team_chat' ||
          n.type === 'team_chat_no_email')
    ).length;
    return Math.max(
      unreadInboxChatsCount,
      unreadDms + unreadMentionsAndComments
    );
  }, [unreadInboxChatsCount, notifications, dmConversations]);

  const [sortMode, setSortMode] = useState(() => {
    if (typeof window !== 'undefined')
      return localStorage.getItem('innocean_board_sort') || 'recent';
    return 'recent';
  });

  const handleSortChange = (mode) => {
    setSortMode(mode);
    localStorage.setItem('innocean_board_sort', mode);
  };

  const todoListBoard = useMemo(() => {
    return boards.find(
      (b) => b.name.toLowerCase() === 'to-do list' && b.is_private
    );
  }, [boards]);

  const sortedBoards = useMemo(() => {
    let sorted = [...boards];
    if (sortMode === 'alphabet') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === 'active') {
      sorted.sort((a, b) => {
        const aScore = a.health_alert?.includes('Attention') ? 1 : 0;
        const bScore = b.health_alert?.includes('Attention') ? 1 : 0;
        if (bScore !== aScore) return bScore - aScore;
        return b.id - a.id;
      });
    } else {
      sorted.sort((a, b) => b.id - a.id);
    }
    return sorted;
  }, [boards, sortMode]);

  const displayBoards = useMemo(() => {
    return sortedBoards.filter((b) => b.id !== todoListBoard?.id);
  }, [sortedBoards, todoListBoard]);

  const favorites = useMemo(() => {
    return displayBoards.filter((b) => favoriteBoards.includes(b.id));
  }, [displayBoards, favoriteBoards]);

  const matchedGlobalBoards = useMemo(() => {
    if (globalSearchQuery.trim().length < 2) return [];
    const keywords = globalSearchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    return boards.filter((b) => {
      const searchStr = `${b.name} ${b.owner_username}`.toLowerCase();
      return keywords.every((kw) => searchStr.includes(kw));
    });
  }, [globalSearchQuery, boards]);

  const renderBoardItem = (board, isFavoriteSection = false) => {
    const isActive = selectedBoard?.id === board.id;
    const unreadChats = notifications.filter(
      (n) =>
        !n.is_read &&
        (n.type === 'team_chat' ||
          n.type === 'team_chat_no_email' ||
          n.type === 'comment' ||
          n.type === 'mention' ||
          n.type === 'mention_no_email') &&
        (n.board_id
          ? parseInt(n.board_id) === parseInt(board.id)
          : parseInt(n.related_task_id) === parseInt(board.id))
    ).length;

    const getInitials = (name) => name.substring(0, 2).toUpperCase();
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-emerald-400 to-teal-500',
      'from-rose-400 to-red-500',
      'from-amber-400 to-orange-500',
      'from-fuchsia-500 to-purple-600',
      'from-cyan-400 to-blue-500',
    ];
    const colorIndex = board.id % colors.length;
    const gradient = colors[colorIndex];

    return (
      <div
        role='button'
        tabIndex={0}
        key={`sb-${isFavoriteSection ? 'fav' : 'all'}-${board.id}`}
        title={isCollapsed ? board.name : undefined}
        onClick={() => {
          setSelectedBoard(board);
          setSidebarNav?.('projects');
          setShowTeams?.(false);
          setShowAdmin?.(false);
          setShowProjectManage?.(false);
          setShowTimesheets?.(false);
          setIsMobileMenuOpen(false);
          setIsProactiveAIOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedBoard(board);
            setSidebarNav?.('projects');
            setShowTeams?.(false);
            setShowAdmin?.(false);
            setShowProjectManage?.(false);
            setShowTimesheets?.(false);
            setIsMobileMenuOpen(false);
            setIsProactiveAIOpen(false);
          }
        }}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          isActive &&
          !showTimesheets &&
          !showTeams &&
          !showAdmin &&
          !showProjectManage
            ? 'bg-neutral-100 dark:bg-neutral-800/50 text-black dark:text-white'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-400'
        }`}>
        {isActive &&
          !showTimesheets &&
          !showTeams &&
          !showAdmin &&
          !showProjectManage && (
            <div className='absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-black dark:bg-white rounded-r-md'></div>
          )}
        <div className='flex items-center gap-3 min-w-0'>
          <div
            className={`w-6 h-6 rounded-md bg-linear-to-br ${gradient} text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm opacity-90`}>
            {getInitials(board.name)}
          </div>
          {!isCollapsed && (
            <div className='flex items-center gap-1.5 min-w-0 flex-1'>
              <span
                className={`text-sm truncate font-medium ${isActive && !showTimesheets ? 'font-bold' : ''}`}>
                {board.name}
              </span>
              {!!board.is_private && (
                <span
                  className='text-[10px] opacity-60 shrink-0'
                  title={tMsg('Private Project', 'Proyek Privat')}>
                  <Icon name='lock' className='w-3 h-3' />
                </span>
              )}
            </div>
          )}
        </div>
        <div className='flex items-center gap-1.5 shrink-0'>
          {!isCollapsed && (
            <div className='flex items-center gap-1'>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (favoriteBoards.includes(board.id)) {
                    setFavoriteBoards(
                      favoriteBoards.filter((id) => id !== board.id)
                    );
                  } else {
                    setFavoriteBoards([...favoriteBoards, board.id]);
                  }
                }}
                className={`p-1 rounded transition-opacity ${
                  favoriteBoards.includes(board.id)
                    ? 'text-amber-500 opacity-100'
                    : 'text-neutral-300 hover:text-amber-400 opacity-0 group-hover:opacity-100'
                }`}
                title={
                  favoriteBoards.includes(board.id)
                    ? tMsg('Unpin Project', 'Lepas Sematan')
                    : tMsg('Pin Project', 'Sematkan Proyek')
                }>
                <Icon
                  name='star'
                  className={`w-3.5 h-3.5 ${favoriteBoards.includes(board.id) ? 'fill-current' : ''}`}
                />
              </button>
              {(isSuperAdmin || board.owner_username === currentUser) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBoardToDelete(board);
                  }}
                  className='p-1 rounded text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity'
                  title={tMsg('Delete Project', 'Hapus Proyek')}>
                  <Icon name='trash' className='w-3.5 h-3.5' />
                </button>
              )}
            </div>
          )}
          {unreadChats > 0 && (
            <span
              className='w-2 h-2 rounded-full bg-red-500'
              title={`${unreadChats} unread`}></span>
          )}
          {board.health_alert?.includes('Attention') && unreadChats === 0 && (
            <span
              className='w-2 h-2 rounded-full bg-amber-500'
              title='Attention Needed'></span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className='fixed inset-0 bg-black/60 backdrop-blur-sm z-80 md:hidden'
          onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-90 md:z-50 md:relative bg-white/95 dark:bg-neutral-950/95 backdrop-blur-2xl border-r border-neutral-200/50 dark:border-neutral-800/50 flex flex-col transition-all duration-300 ease-in-out transform shadow-2xl md:shadow-none ${
          isMobileMenuOpen
            ? 'translate-x-0'
            : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'w-16' : 'w-64 md:w-72'}`}>
        <div
          className={`h-16 hidden md:flex items-center shrink-0 bg-white dark:bg-neutral-950 border-b border-neutral-200/50 dark:border-neutral-800/50 ${
            isCollapsed ? 'px-3 justify-center' : 'px-6'
          }`}>
          <InnoceanLogo
            collapsed={isCollapsed}
            size={isCollapsed ? 'sm' : 'md'}
            className='tour-board-title'
            onClick={() => {
              setSelectedBoard(null);
              setIsProactiveAIOpen(true);
              setIsMobileMenuOpen(false);
            }}
          />
          {!isCollapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse();
              }}
              className='ml-auto p-1.5 text-neutral-400 hover:text-black dark:hover:text-white transition-colors rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800'
              title='Collapse sidebar'>
              <Icon name='panel-left-close' className='w-6 h-6' />
            </button>
          )}
        </div>

        {!isCollapsed && (
          <div className='px-4 pt-5 pb-2 shrink-0 relative'>
            <div className='relative mb-3 group z-50'>
              <span className='absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors'>
                <Icon name='search' className='w-4 h-4' />
              </span>
              <input
                type='text'
                placeholder={tMsg(
                  'Search everywhere...',
                  'Cari dimana saja...'
                )}
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                onFocus={() => {
                  if (globalSearchQuery.length > 0) setIsGlobalSearchOpen(true);
                }}
                className='w-full bg-neutral-100/50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-black text-black dark:text-white text-sm rounded-lg pl-9 pr-8 py-2 outline-none transition-all placeholder-neutral-400 shadow-inner'
              />
              {globalSearchQuery && (
                <button
                  onClick={() => {
                    setGlobalSearchQuery('');
                    closeGlobalSearch();
                  }}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black dark:hover:text-white font-bold text-xs'>
                  <Icon name='x' className='w-3 h-3' />
                </button>
              )}

              {/* Global Search Results Overlay */}
              {isGlobalSearchOpen && (
                <>
                  <div
                    className='fixed inset-0 z-40'
                    onClick={closeGlobalSearch}></div>
                  <div
                    className={`absolute top-full left-0 mt-3 w-full sm:w-87.5 bg-white/95 dark:bg-neutral-950/95 
                  backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl overflow-hidden z-50 flex 
                  flex-col max-h-100 origin-top ${isGlobalSearchClosing ? 'mac-exit' : 'mac-animate'}`}>
                    <div className='px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900'>
                      <span className='text-[9px] font-bold text-neutral-400 uppercase tracking-widest'>
                        Global Search Results
                      </span>
                    </div>
                    {globalSearchResults.length > 0 ||
                    matchedGlobalBoards.length > 0 ? (
                      <div className='overflow-y-auto py-2'>
                        {matchedGlobalBoards.length > 0 && (
                          <div className='mb-2'>
                            <div className='px-5 py-1.5 text-[9px] font-bold text-black dark:text-white uppercase tracking-widest bg-neutral-100 dark:bg-neutral-900'>
                              <Icon name='folder' className='w-3 h-3 inline' />{' '}
                              Projects
                            </div>
                            {matchedGlobalBoards.map((b) => (
                              <div
                                key={`gb-${b.id}`}
                                onClick={() => {
                                  setSelectedBoard(b);
                                  setGlobalSearchQuery('');
                                  closeGlobalSearch();
                                }}
                                className='px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer border-b border-neutral-100 dark:border-neutral-800/50 transition-colors flex items-center gap-3'>
                                <Icon
                                  name='folder-open'
                                  className='w-5 h-5 shrink-0'
                                />
                                <div className='flex flex-col min-w-0'>
                                  <span className='text-sm font-bold text-black dark:text-white truncate'>
                                    <HighlightText
                                      text={b.name}
                                      query={globalSearchQuery}
                                    />
                                  </span>
                                  <span className='text-[10px] text-neutral-500 font-medium truncate'>
                                    Owned by @
                                    <HighlightText
                                      text={b.owner_username}
                                      query={globalSearchQuery}
                                    />
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {globalSearchResults.length > 0 && (
                          <div className='mb-1'>
                            <div className='px-5 py-1.5 text-[9px] font-bold text-black dark:text-white uppercase tracking-widest bg-neutral-100 dark:bg-neutral-900'>
                              <Icon
                                name='clipboard-list'
                                className='w-3 h-3 inline'
                              />{' '}
                              Tasks
                            </div>
                            {globalSearchResults.map((t) => (
                              <div
                                key={t.id}
                                onClick={() => handleGlobalSearchSelect(t)}
                                className='px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 transition-colors flex flex-col gap-1.5'>
                                <div className='flex justify-between items-start'>
                                  <span className='text-sm font-bold text-black dark:text-white truncate mr-2'>
                                    <HighlightText
                                      text={t.project_name}
                                      query={globalSearchQuery}
                                    />
                                  </span>
                                  <span
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0 ${
                                      t.status === 'Done'
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}>
                                    {t.status}
                                  </span>
                                </div>
                                <div className='flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-neutral-500'>
                                  <span
                                    className='truncate text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 hover:underline cursor-pointer transition-colors max-w-30'
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const board = boards.find(
                                        (b) => b.id === t.board_id
                                      );
                                      if (board) {
                                        setSelectedBoard(board);
                                        setGlobalSearchQuery('');
                                        closeGlobalSearch();
                                      }
                                    }}>
                                    <Icon
                                      name='folder-open'
                                      className='w-3 h-3 inline'
                                    />{' '}
                                    <HighlightText
                                      text={t.board_name}
                                      query={globalSearchQuery}
                                    />
                                  </span>
                                  {t.category && (
                                    <>
                                      <span className='text-neutral-300 dark:text-neutral-700'>
                                        &bull;
                                      </span>
                                      <span className='bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase'>
                                        {t.category}
                                      </span>
                                    </>
                                  )}
                                  {t.requester && (
                                    <>
                                      <span className='text-neutral-300 dark:text-neutral-700'>
                                        &bull;
                                      </span>
                                      <span className='truncate flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400'>
                                        <Icon
                                          name='user'
                                          className='w-3 h-3 inline'
                                        />{' '}
                                        <HighlightText
                                          text={t.requester}
                                          query={globalSearchQuery}
                                        />
                                      </span>
                                    </>
                                  )}
                                  {t.deadline && (
                                    <>
                                      <span className='text-neutral-300 dark:text-neutral-700'>
                                        &bull;
                                      </span>
                                      <span className='text-neutral-500 dark:text-slate-400 text-[10px] font-medium'>
                                        <Icon
                                          name='calendar'
                                          className='w-3 h-3 inline'
                                        />{' '}
                                        {formatDateMMM(t.deadline)}
                                      </span>
                                    </>
                                  )}
                                  {t.priority_str &&
                                    t.status !== 'Done' &&
                                    t.status !== 'Rejected' && (
                                      <>
                                        <span className='text-neutral-300 dark:text-neutral-700'>
                                          &bull;
                                        </span>
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                            t.priority_lvl === 'critical'
                                              ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                              : t.priority_lvl === 'warning'
                                                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                                : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                          }`}>
                                          {t.priority_str}
                                        </span>
                                      </>
                                    )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className='p-4 text-center text-xs text-neutral-500'>
                        {tMsg(
                          'No projects or tasks found.',
                          'Tidak ada proyek atau tugas ditemukan.'
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {canCreateProjects && (
              <button
                onClick={() => {
                  setIsCreateBoardOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                disabled={accountStatus === 'suspended'}
                className='w-full flex items-center gap-2 justify-center bg-black dark:bg-white text-white dark:text-black hover:opacity-80 font-bold py-2 px-4 rounded-lg transition-opacity disabled:opacity-50 text-sm shadow-sm'>
                <IconPlus className='w-4 h-4' />{' '}
                {tMsg('New Project', 'Proyek Baru')}
              </button>
            )}
          </div>
        )}

        <div
          className={`flex-1 overflow-y-auto px-3 pb-2 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800 scrollbar-track-transparent ${
            isCollapsed ? 'pt-0' : 'pt-2'
          }`}>
          {isCollapsed && (
            <div className='sticky top-0 bg-white dark:bg-neutral-950 z-10 flex flex-col items-center py-2 mb-2 border-b border-neutral-100 dark:border-neutral-800 w-full'>
              <button
                onClick={toggleCollapse}
                className='w-10 h-10 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors'
                title='Expand sidebar'>
                <Icon name='panel-left-open' className='w-6 h-6' />
              </button>
            </div>
          )}
          <div
            className={`mb-8 space-y-0.5 ${isCollapsed ? 'mt-0 px-0' : 'mt-2 px-0'}`}>
            <button
              onClick={() => {
                setSelectedBoard(null);
                setShowTeams?.(false);
                setShowAdmin?.(false);
                setShowProjectManage?.(false);
                setShowTimesheets?.(false);
                setSidebarNav?.('home');
                setIsMobileMenuOpen(false);
                setIsProactiveAIOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                sidebarNav === 'home' &&
                !selectedBoard &&
                !showTeams &&
                !showAdmin &&
                !showProjectManage &&
                !showTimesheets
                  ? 'bg-neutral-100 dark:bg-neutral-800/50 text-black dark:text-white font-bold'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-400 font-medium'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={tMsg('Home', 'Beranda')}>
              <div className='w-6 h-6 flex items-center justify-center'>
                <Icon name='home' className='w-5 h-5' />
              </div>
              {!isCollapsed && (
                <span className='text-sm truncate'>
                  {tMsg('Home', 'Beranda')}
                </span>
              )}
            </button>

            {canManageProjectDir && (
            <button
              onClick={() => {
                setShowTeams?.(false);
                setShowAdmin?.(false);
                setShowTimesheets?.(false);
                setSelectedBoard(null);
                setSidebarNav?.('projects');
                // Project Owner / Admin: buka halaman manajemen proyek langsung
                setShowProjectManage?.(true);
                setIsMobileMenuOpen(false);
                setIsProactiveAIOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                (sidebarNav === 'projects' ||
                  (!!selectedBoard && selectedBoard.id !== 'global') ||
                  showProjectManage) &&
                !showTeams &&
                !showAdmin &&
                !showTimesheets
                  ? 'bg-neutral-100 dark:bg-neutral-800/50 text-black dark:text-white font-bold'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-400 font-medium'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={tMsg('Projects', 'Proyek')}>
              <div className='w-6 h-6 flex items-center justify-center'>
                <Icon name='folder' className='w-5 h-5' />
              </div>
              {!isCollapsed && (
                <span className='text-sm truncate'>
                  {tMsg('Projects', 'Proyek')}
                </span>
              )}
            </button>
            )}

            {canOpenTeams && (
              <button
                onClick={() => {
                  setSelectedBoard(null);
                  setShowTimesheets?.(false);
                  setShowAdmin?.(false);
                  setShowProjectManage?.(false);
                  setShowTeams?.(true);
                  setSidebarNav?.('teams');
                  setIsMobileMenuOpen(false);
                  setIsProactiveAIOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  showTeams || sidebarNav === 'teams'
                    ? 'bg-neutral-100 dark:bg-neutral-800/50 text-black dark:text-white font-bold'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-400 font-medium'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={tMsg('Teams', 'Tim')}>
                <div className='w-6 h-6 flex items-center justify-center'>
                  <Icon name='users' className='w-5 h-5' />
                </div>
                {!isCollapsed && (
                  <span className='text-sm truncate flex-1 text-left'>
                    {tMsg('Teams', 'Tim')}
                  </span>
                )}
                {!isCollapsed && (
                  <span className='text-[10px] font-bold text-neutral-400'>
                    {(userDirectory || []).length || 0}
                  </span>
                )}
              </button>
            )}

            {TIMESHEETS_UI_ENABLED && (
              <button
                onClick={() => {
                  setSelectedBoard(null);
                  setShowTeams?.(false);
                  setShowAdmin?.(false);
                  setShowProjectManage?.(false);
                  setShowTimesheets?.(true);
                  setSidebarNav?.('home');
                  setIsMobileMenuOpen(false);
                  setIsProactiveAIOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  showTimesheets
                    ? 'bg-neutral-100 dark:bg-neutral-800/50 text-black dark:text-white font-bold'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-400 font-medium'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={tMsg('Timesheets', 'Lembar Waktu')}>
                <div className='w-6 h-6 flex items-center justify-center'>
                  <Icon name='clock' className='w-5 h-5' />
                </div>
                {!isCollapsed && (
                  <span className='text-sm truncate'>
                    {tMsg('Timesheets', 'Lembar Waktu')}
                  </span>
                )}
              </button>
            )}

            {isAdminRole && (
              <button
                onClick={() => {
                  openAdminModal();
                  setShowProjectManage?.(false);
                  setIsMobileMenuOpen(false);
                  setIsProactiveAIOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  showAdmin || sidebarNav === 'admin'
                    ? 'bg-neutral-100 dark:bg-neutral-800/50 text-black dark:text-white font-bold'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-400 font-medium'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={tMsg('Administrator', 'Administrator')}>
                <div className='w-6 h-6 flex items-center justify-center'>
                  <Icon name='shield' className='w-5 h-5' />
                </div>
                {!isCollapsed && (
                  <span className='text-sm truncate'>
                    {tMsg('Administrator', 'Administrator')}
                  </span>
                )}
              </button>
            )}
          </div>

          {MASTER_VIEW_UI_ENABLED && (
            <div className='mb-2'>
              <button
                onClick={() => {
                  setSelectedBoard({
                    id: 'global',
                    name: tMsg('See the Big Picture', 'Lihat Gambaran Besar'),
                    owner_username: currentUser,
                    role: 'owner',
                    isVirtual: true,
                  });
                  setShowTeams?.(false);
                  setShowAdmin?.(false);
                  setShowTimesheets?.(false);
                  setSidebarNav?.('projects');
                  setIsMobileMenuOpen(false);
                  setIsProactiveAIOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all tour-global-board ${
                  selectedBoard?.id === 'global' &&
                  !showTimesheets &&
                  !showTeams &&
                  !showAdmin
                    ? 'bg-neutral-100 dark:bg-neutral-800/50 text-black dark:text-white font-bold'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-400 font-medium'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={tMsg('See the Big Picture', 'Lihat Gambaran Besar')}>
                <div className='w-6 h-6 flex items-center justify-center'>
                  <Icon name='globe' className='w-5 h-5' />
                </div>
                {!isCollapsed && (
                  <span className='text-sm truncate'>
                    {tMsg('See the Big Picture', 'Lihat Gambaran Besar')}
                  </span>
                )}
              </button>
            </div>
          )}

          {TODO_LIST_UI_ENABLED && todoListBoard && (
            <div className='mb-2'>
              <button
                onClick={() => {
                  setSelectedBoard(todoListBoard);
                  setShowTeams?.(false);
                  setShowAdmin?.(false);
                  setShowTimesheets?.(false);
                  setSidebarNav?.('projects');
                  setIsMobileMenuOpen(false);
                  setIsProactiveAIOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  selectedBoard?.id === todoListBoard.id &&
                  !showTimesheets &&
                  !showTeams &&
                  !showAdmin
                    ? 'bg-neutral-100 dark:bg-neutral-800/50 text-black dark:text-white font-bold'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-400 font-medium'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={tMsg('My To-Do List', 'Daftar Tugas Saya')}>
                <div className='w-6 h-6 flex items-center justify-center'>
                  <Icon name='file-text' className='w-5 h-5' />
                </div>
                {!isCollapsed && (
                  <span className='text-sm truncate'>
                    {tMsg('My To-Do List', 'Daftar Tugas Saya')}
                  </span>
                )}
              </button>
            </div>
          )}

          {showTeams ? (
            <div className='mb-4'>
              {!isCollapsed && (
                <h3 className='px-3 mb-2 text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase'>
                  {tMsg('Directory', 'Direktori')}
                </h3>
              )}
              <button
                onClick={() => {
                  setShowTeams?.(true);
                  setSelectedBoard(null);
                  setSidebarNav?.('teams');
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all bg-neutral-100 dark:bg-neutral-800/50 text-black dark:text-white font-medium ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={tMsg('All People', 'Semua Orang')}>
                <div className='w-6 h-6 flex items-center justify-center'>
                  <Icon name='user' className='w-5 h-5' />
                </div>
                {!isCollapsed && (
                  <>
                    <span className='text-sm truncate flex-1 text-left'>
                      {tMsg('All People', 'Semua Orang')}
                    </span>
                    <span className='text-[10px] font-bold text-neutral-400'>
                      {(userDirectory || []).length || 0}
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              {favorites.length > 0 && (
                <div className='mb-6'>
                  {!isCollapsed && (
                    <h3 className='px-3 text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase mb-2'>
                      {tMsg('Pinned Projects', 'Proyek Disematkan')}
                    </h3>
                  )}
                  <div className='flex flex-col gap-0.5'>
                    {favorites.map((b) => renderBoardItem(b, true))}
                  </div>
                </div>
              )}

              <div className='mb-4'>
                {!isCollapsed && (
                  <div className='flex items-center justify-between px-3 mb-2'>
                    <h3 className='text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase'>
                      {tMsg('All Projects', 'Semua Proyek')}
                    </h3>
                    <select
                      value={sortMode}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className='bg-transparent text-[10px] text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer outline-none font-bold uppercase tracking-wider text-right'
                      title={tMsg('Sort Projects', 'Urutkan Proyek')}>
                      <option
                        value='recent'
                        className='bg-white dark:bg-neutral-900 text-black dark:text-white'>
                        {tMsg('Recent', 'Terbaru')}
                      </option>
                      <option
                        value='active'
                        className='bg-white dark:bg-neutral-900 text-black dark:text-white'>
                        {tMsg('Active', 'Teraktif')}
                      </option>
                      <option
                        value='alphabet'
                        className='bg-white dark:bg-neutral-900 text-black dark:text-white'>
                        {tMsg('A-Z', 'A-Z')}
                      </option>
                    </select>
                  </div>
                )}
                <div className='flex flex-col gap-0.5 tour-project-card'>
                  {displayBoards.length === 0
                    ? !isCollapsed && (
                        <div className='px-3 py-2 text-xs text-neutral-400 italic'>
                          {tMsg('No projects yet', 'Belum ada proyek')}
                        </div>
                      )
                    : displayBoards.map((b) => renderBoardItem(b))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile-only: Chat & Export di bawah sidebar (dibuka via hamburger) */}
        <div className='md:hidden p-3 border-t border-neutral-200/50 dark:border-neutral-800/50 shrink-0 bg-white dark:bg-neutral-950'>
          <div className='flex items-center gap-2 tour-quick-actions'>
            <button
              type='button'
              onClick={() => {
                setIsChatWorkspaceOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className='flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-400 transition-colors relative'
              title={tMsg('Chat', 'Obrolan')}>
              <Icon name='message-circle' className='w-5 h-5' />
              <span className='text-[10px] font-semibold'>
                {tMsg('Chat', 'Obrolan')}
              </span>
              {totalUnreadChats > 0 && (
                <span className='absolute top-1 right-3 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-white dark:border-black scale-90 min-w-4 text-center leading-none'>
                  {totalUnreadChats}
                </span>
              )}
            </button>
            <button
              type='button'
              onClick={() => {
                setExportMode('global');
                setIsExportModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className='flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-400 transition-colors'
              title={tMsg('Export', 'Ekspor')}>
              <Icon name='globe' className='w-5 h-5' />
              <span className='text-[10px] font-semibold'>
                {tMsg('Export', 'Ekspor')}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
