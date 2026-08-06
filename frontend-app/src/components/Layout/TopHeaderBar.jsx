import { useMemo, useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Avatar } from '../../SharedUI';
import { Icon } from '../icons/Icon';
import {
  MY_TICKETS_UI_ENABLED,
  SUBMIT_IDEA_UI_ENABLED,
  CONTACT_SUPPORT_UI_ENABLED,
  REPLAY_TOUR_UI_ENABLED,
} from '../../featureFlags';

function NotificationTypeIcon({ type }) {
  if (type === 'task_assigned')
    return <Icon name='arrow-right' className='w-5 h-5' />;
  if (type === 'task_completed')
    return <Icon name='check-circle' className='w-5 h-5' />;
  if (type === 'comment' || type === 'mention' || type === 'team_chat') {
    return <Icon name='message-circle' className='w-5 h-5' />;
  }
  if (type === 'team_invite' || type === 'access_request') {
    return <Icon name='handshake' className='w-5 h-5' />;
  }
  return <Icon name='bell' className='w-5 h-5' />;
}

export default function TopHeaderBar() {
  const {
    currentUser,
    avatarsMap,
    language,
    unreadCount,
    isNotifOpen,
    setIsNotifOpen,
    notifications,
    handleReadAllNotifications,
    handleReadNotification,
    handleNotificationTaskClick,
    setIsInvitesModalOpen,
    formatDateMMM,
    setIsChatWorkspaceOpen,
    setExportMode,
    setIsExportModalOpen,
    setIsSettingsOpen,
    setIsLeaveModalOpen,
    accountStatus,
    setIsProjectChatOpen,
    setDrawerTab,
    setIsMyTicketsOpen,
    setIsDocsOpen,
    setIsFeedbackOpen,
    setIsSupportOpen,
    startTour,
    isInstallable,
    handleInstallClick,
    setIsLogoutConfirmOpen,
    inboxChats,
    dmConversations,
    openGlobalSearch,
    setSelectedBoard,
    setShowTeams,
    setShowAdmin,
    setShowProjectManage,
    setShowTimesheets,
    setSidebarNav,
    unsubmittedTimesheetsCount,
  } = useAppContext();

  const tMsg = (en, id) => (language === 'id' ? id : en);
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad/.test(navigator.platform);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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

  const closeAllMenus = () => {
    setIsNotifOpen(false);
    setIsProfileMenuOpen(false);
  };

  const openProfileMenu = () => {
    setIsNotifOpen(false);
    setIsProfileMenuOpen((prev) => !prev);
  };

  const toggleNotifOpen = () => {
    setIsProfileMenuOpen(false);
    setIsNotifOpen(!isNotifOpen);
  };

  return (
    <header className='hidden md:flex sticky top-0 shrink-0 z-40 w-full items-center justify-between bg-white/95 dark:bg-neutral-950/95 backdrop-blur border-b border-neutral-200/50 dark:border-neutral-800/50 px-4 md:px-6 py-2'>
      <button
        type='button'
        onClick={openGlobalSearch}
        className='flex items-center gap-2 max-w-xs w-full bg-neutral-100/60 dark:bg-neutral-900/60 hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 text-neutral-400 text-sm rounded-lg pl-3 pr-3 py-1.5 transition-all text-left'>
        <Icon name='search' className='w-4 h-4 shrink-0' />
        <span className='truncate flex-1 text-neutral-400'>
          {tMsg('Search projects, teams...', 'Cari proyek, tim...')}
        </span>
        <span className='flex items-center gap-0.5 shrink-0 text-[10px] font-medium text-neutral-400'>
          <kbd className='px-1 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-[9px]'>
            {isMac ? '⌘' : 'Ctrl'}
          </kbd>
          <kbd className='px-1 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-[9px]'>
            K
          </kbd>
        </span>
      </button>

      {(isNotifOpen || isProfileMenuOpen) && (
        <div className='fixed inset-0 z-40' onClick={closeAllMenus} />
      )}

      <div className='relative z-50 flex items-center gap-1'>
        <button
          type='button'
          onClick={() => setIsChatWorkspaceOpen(true)}
          className='hidden md:flex flex-col items-center gap-0.5 text-slate-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg px-2.5 py-1.5 transition-colors relative'
          title={tMsg('Chat', 'Obrolan')}>
          <Icon name='message-circle' className='w-5 h-5' />
          <span className='text-[10px] font-semibold'>
            {tMsg('Chat', 'Obrolan')}
          </span>
          {totalUnreadChats > 0 && (
            <span className='absolute top-0.5 right-1 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-white dark:border-black scale-90 min-w-4 text-center leading-none'>
              {totalUnreadChats}
            </span>
          )}
        </button>

        <button
          type='button'
          onClick={() => {
            setExportMode('global');
            setIsExportModalOpen(true);
          }}
          className='hidden md:flex flex-col items-center gap-0.5 text-slate-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg px-2.5 py-1.5 transition-colors'
          title={tMsg('Export', 'Ekspor')}>
          <Icon name='globe' className='w-5 h-5' />
          <span className='text-[10px] font-semibold'>
            {tMsg('Export', 'Ekspor')}
          </span>
        </button>

        <div className='relative'>
          <button
            type='button'
            onClick={toggleNotifOpen}
            className='flex flex-col items-center gap-0.5 text-slate-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg px-2.5 py-1.5 transition-colors relative'
            title={tMsg('Notifications', 'Notifikasi')}>
            <Icon name='bell' className='w-5 h-5' />
            <span className='text-[10px] font-semibold'>
              {tMsg('Notifications', 'Notifikasi')}
            </span>
            {(unreadCount > 0 || unsubmittedTimesheetsCount > 0) && (
              <span className='absolute top-0.5 right-1 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-white dark:border-black scale-90 min-w-4 text-center leading-none'>
                {unreadCount + (unsubmittedTimesheetsCount > 0 ? 1 : 0)}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className='absolute top-full right-0 mt-2 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-50 flex flex-col max-h-112.5 overflow-hidden'>
              <div className='p-3 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-900'>
                <h3 className='font-bold text-sm text-black dark:text-white'>
                  {tMsg('Notifications', 'Notifikasi')}
                </h3>
                {unreadCount > 0 && (
                  <button
                    type='button'
                    onClick={handleReadAllNotifications}
                    className='text-xs text-indigo-500 font-bold hover:underline'>
                    {tMsg('Mark all read', 'Tandai semua dibaca')}
                  </button>
                )}
              </div>
              <div className='overflow-y-auto flex-1'>
                {unsubmittedTimesheetsCount > 0 && (
                  <div
                    onClick={() => {
                      setSelectedBoard?.(null);
                      setShowTeams?.(false);
                      setShowAdmin?.(false);
                      setShowProjectManage?.(false);
                      setShowTimesheets?.(true);
                      setSidebarNav?.('home');
                      setIsNotifOpen(false);
                    }}
                    className='p-3 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer transition-colors flex items-start gap-3'>
                    <div className='p-2 bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 rounded-lg shrink-0'>
                      <Icon name='alert-triangle' className='w-4 h-4' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <h5 className='text-xs font-bold text-red-900 dark:text-red-200'>
                        {tMsg(
                          'Action Required: Unsubmitted Timesheets',
                          'Tindakan Diperlukan: Timesheet Belum Disubmit'
                        )}
                      </h5>
                      <p className='text-[11px] text-red-700 dark:text-red-300 mt-0.5 font-medium leading-snug'>
                        {tMsg(
                          `You have ${unsubmittedTimesheetsCount} unsubmitted week(s). Click to complete.`,
                          `Anda memiliki ${unsubmittedTimesheetsCount} minggu timesheet yang belum disubmit. Klik untuk mengisi.`
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {notifications.length === 0 &&
                unsubmittedTimesheetsCount === 0 ? (
                  <div className='p-8 text-center text-neutral-400 text-sm'>
                    <Icon
                      name='mail'
                      className='w-8 h-8 mx-auto mb-2 opacity-60'
                    />
                    {tMsg('No notifications yet.', 'Belum ada notifikasi.')}
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.is_read) handleReadNotification(n.id);
                        if (
                          n.related_task_id &&
                          n.type !== 'team_chat' &&
                          n.type !== 'team_chat_no_email' &&
                          n.type !== 'team_invite' &&
                          n.type !== 'access_request'
                        ) {
                          handleNotificationTaskClick(n.related_task_id);
                        } else if (n.type === 'team_invite') {
                          setIsInvitesModalOpen(true);
                        }
                        setIsNotifOpen(false);
                      }}
                      className={`p-3 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${
                        !n.is_read
                          ? 'bg-indigo-50/50 dark:bg-indigo-900/10'
                          : ''
                      }`}>
                      <div className='flex gap-2.5 items-start text-left'>
                        <span className='shrink-0'>
                          <NotificationTypeIcon type={n.type} />
                        </span>
                        <div className='flex-1 min-w-0'>
                          <p
                            className={`text-xs leading-snug ${
                              !n.is_read
                                ? 'font-bold text-black dark:text-white'
                                : 'text-neutral-600 dark:text-neutral-400'
                            }`}>
                            {n.message?.replace(/<!--TASK_ID:\d+-->/g, '')}
                          </p>
                          <p className='text-[10px] text-neutral-400 mt-0.5'>
                            {formatDateMMM(n.timestamp)}
                          </p>
                        </div>
                        {!n.is_read && (
                          <div className='w-2 h-2 bg-indigo-500 rounded-full shrink-0 mt-1' />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* <button
          type='button'
          onClick={() => setIsSettingsOpen(true)}
          className='flex flex-col items-center gap-0.5 text-slate-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg px-2.5 py-1.5 transition-colors'
          title={tMsg('Settings', 'Pengaturan')}>
          <Icon name='settings' className='w-5 h-5' />
          <span className='text-[10px] font-semibold'>
            {tMsg('Settings', 'Pengaturan')}
          </span>
        </button> */}

        <div className='relative ml-1 pl-2 border-l border-neutral-200/70 dark:border-neutral-800/70'>
          <button
            type='button'
            onClick={openProfileMenu}
            className='rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors tour-account-menu'
            title={currentUser}>
            <Avatar
              name={currentUser}
              url={avatarsMap[currentUser]}
              size='w-9 h-9'
              textClass='text-sm'
            />
          </button>

          {isProfileMenuOpen && (
            <div className='absolute top-full right-0 mt-2 w-56 z-50'>
              <div className='bg-white/95 dark:bg-black/95 backdrop-blur-xl shadow-xl border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden py-1'>
                <button
                  type='button'
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsProfileMenuOpen(false);
                  }}
                  className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors'>
                  <Icon name='settings' className='w-4 h-4' />{' '}
                  {tMsg('Settings', 'Pengaturan')}
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setIsLeaveModalOpen(true);
                    setIsProfileMenuOpen(false);
                  }}
                  disabled={accountStatus === 'suspended'}
                  className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors'>
                  <Icon name='calendar-days' className='w-4 h-4' />{' '}
                  {tMsg('Time Off', 'Cuti')}
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setIsProjectChatOpen(true);
                    setDrawerTab('assistant');
                    setIsProfileMenuOpen(false);
                  }}
                  disabled={accountStatus === 'suspended'}
                  className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors'>
                  <Icon name='sparkles' className='w-4 h-4' />{' '}
                  {tMsg('Smart Assistant', 'Asisten Pintar AI')}
                </button>
                {MY_TICKETS_UI_ENABLED && (
                  <button
                    type='button'
                    onClick={() => {
                      setIsMyTicketsOpen(true);
                      setIsProfileMenuOpen(false);
                    }}
                    disabled={accountStatus === 'suspended'}
                    className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors'>
                    <Icon name='ticket' className='w-4 h-4' />{' '}
                    {tMsg('My Tickets', 'Tiket Saya')}
                  </button>
                )}
                <div className='border-t border-neutral-200 dark:border-neutral-800 my-1' />
                <button
                  type='button'
                  onClick={() => {
                    setIsDocsOpen(true);
                    setIsProfileMenuOpen(false);
                  }}
                  className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors'>
                  <Icon name='book-open' className='w-4 h-4' />{' '}
                  {tMsg('Documentation', 'Dokumentasi')}
                </button>
                {SUBMIT_IDEA_UI_ENABLED && (
                  <button
                    type='button'
                    onClick={() => {
                      setIsFeedbackOpen(true);
                      setIsProfileMenuOpen(false);
                    }}
                    disabled={accountStatus === 'suspended'}
                    className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors'>
                    <Icon name='lightbulb' className='w-4 h-4' />{' '}
                    {tMsg('Submit Idea', 'Kirim Masukan')}
                  </button>
                )}
                {CONTACT_SUPPORT_UI_ENABLED && (
                  <button
                    type='button'
                    onClick={() => {
                      setIsSupportOpen(true);
                      setIsProfileMenuOpen(false);
                    }}
                    disabled={accountStatus === 'suspended'}
                    className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors'>
                    <Icon name='phone' className='w-4 h-4' />{' '}
                    {tMsg('Contact Support', 'Hubungi Dukungan')}
                  </button>
                )}
                {REPLAY_TOUR_UI_ENABLED && (
                  <button
                    type='button'
                    onClick={() => {
                      startTour();
                      setIsProfileMenuOpen(false);
                    }}
                    className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors'>
                    <Icon name='compass' className='w-4 h-4' />{' '}
                    {tMsg('Replay Tour', 'Ulangi Tur')}
                  </button>
                )}
                {isInstallable && (
                  <button
                    type='button'
                    onClick={() => {
                      handleInstallClick();
                      setIsProfileMenuOpen(false);
                    }}
                    className='w-full text-left px-4 py-3 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 transition-colors mt-1 rounded-lg'>
                    <Icon name='download' className='w-4 h-4' />
                    {tMsg('Install App', 'Instal Aplikasi')}
                  </button>
                )}
                <div className='border-t border-neutral-200 dark:border-neutral-800 my-1' />
                <button
                  type='button'
                  onClick={() => {
                    setIsLogoutConfirmOpen(true);
                    setIsProfileMenuOpen(false);
                  }}
                  className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2 transition-colors'>
                  <Icon name='logout' className='w-4 h-4' />{' '}
                  {tMsg('Logout', 'Keluar')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
