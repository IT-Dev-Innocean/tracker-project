import { useMemo, useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import InnoceanLogo from './InnoceanLogo';
import { Icon } from './icons/Icon';
import {
  MASTER_VIEW_UI_ENABLED,
  TIMESHEETS_UI_ENABLED,
  TODO_LIST_UI_ENABLED,
} from '../featureFlags';
import { isTodoListBoard, excludeTodoListBoards } from '../utils/boards';

export default function Sidebar() {
  const {
    currentUser,
    boards,
    selectedBoard,
    setSelectedBoard,
    favoriteBoards,
    setFavoriteBoards,
    notifications,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    language,
    isProactiveAIOpen,
    setIsProactiveAIOpen,
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
    showClientManage,
    setShowClientManage,
    sidebarNav,
    setSidebarNav,
    userDirectory,
    workspaceRole,
    setIsChatWorkspaceOpen,
    setExportMode,
    setIsExportModalOpen,
    inboxChats,
    dmConversations,
    unsubmittedTimesheetsCount,
  } = useAppContext();

  const tMsg = (en, id) => (language === 'id' ? id : en);
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
    return boards.find((b) => isTodoListBoard(b));
  }, [boards]);

  const sortedBoards = useMemo(() => {
    let sorted = excludeTodoListBoards(boards);
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

  const displayBoards = sortedBoards;

  const favorites = useMemo(() => {
    return displayBoards.filter((b) => favoriteBoards.includes(b.id));
  }, [displayBoards, favoriteBoards]);

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
          setShowClientManage?.(false);
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
            setShowClientManage?.(false);
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
          !showProjectManage &&
          !showClientManage
            ? 'bg-neutral-100 dark:bg-neutral-800/50 text-black dark:text-white'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-400'
        }`}>
        {isActive &&
          !showTimesheets &&
          !showTeams &&
          !showAdmin &&
          !showProjectManage &&
          !showClientManage && (
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

        <div
          className={`flex-1 overflow-y-auto px-3 pb-2 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800 scrollbar-track-transparent ${
            isCollapsed ? 'pt-0' : 'pt-2'
          }`}>
          {isCollapsed && (
            <div className='sticky top-0 bg-white dark:bg-neutral-950 z-10 flex flex-col items-center py-2 mb-2 border-b border-neutral-100 dark:border-neutral-800 w-full gap-1'>
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
                setShowClientManage?.(false);
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
                !showClientManage &&
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
                setShowClientManage?.(false);
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
                !showClientManage &&
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

            {canManageProjectDir && (
            <button
              onClick={() => {
                setShowTeams?.(false);
                setShowAdmin?.(false);
                setShowTimesheets?.(false);
                setShowProjectManage?.(false);
                setSelectedBoard(null);
                setSidebarNav?.('clients');
                setShowClientManage?.(true);
                setIsMobileMenuOpen(false);
                setIsProactiveAIOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                showClientManage || sidebarNav === 'clients'
                  ? 'bg-neutral-100 dark:bg-neutral-800/50 text-black dark:text-white font-bold'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-400 font-medium'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={tMsg('Clients', 'Klien')}>
              <div className='w-6 h-6 flex items-center justify-center'>
                <Icon name='building' className='w-5 h-5' />
              </div>
              {!isCollapsed && (
                <span className='text-sm truncate'>
                  {tMsg('Clients', 'Klien')}
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
                  setShowClientManage?.(false);
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
                  setShowClientManage?.(false);
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
                <div className='w-6 h-6 flex items-center justify-center relative'>
                  <Icon name='clock' className='w-5 h-5' />
                  {isCollapsed && unsubmittedTimesheetsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white dark:border-neutral-950 animate-pulse" />
                  )}
                </div>
                {!isCollapsed && (
                  <span className='text-sm truncate flex-1 text-left'>
                    {tMsg('Timesheets', 'Lembar Waktu')}
                  </span>
                )}
                {!isCollapsed && unsubmittedTimesheetsCount > 0 && (
                  <span
                    className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-full shadow-sm shrink-0 animate-pulse"
                    title={`${unsubmittedTimesheetsCount} minggu belum disubmit`}
                  >
                    ⚠️ {unsubmittedTimesheetsCount}
                  </span>
                )}
              </button>
            )}

            {isAdminRole && (
              <button
                onClick={() => {
                  openAdminModal();
                  setShowProjectManage?.(false);
                  setShowClientManage?.(false);
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
                  setShowProjectManage?.(false);
                  setShowClientManage?.(false);
                  setSidebarNav?.('projects');
                  setIsMobileMenuOpen(false);
                  setIsProactiveAIOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all tour-global-board ${
                  selectedBoard?.id === 'global' &&
                  !showTimesheets &&
                  !showTeams &&
                  !showAdmin &&
                  !showProjectManage &&
                  !showClientManage
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
                  setShowProjectManage?.(false);
                  setShowClientManage?.(false);
                  setSidebarNav?.('projects');
                  setIsMobileMenuOpen(false);
                  setIsProactiveAIOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  selectedBoard?.id === todoListBoard.id &&
                  !showTimesheets &&
                  !showTeams &&
                  !showAdmin &&
                  !showProjectManage &&
                  !showClientManage
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
