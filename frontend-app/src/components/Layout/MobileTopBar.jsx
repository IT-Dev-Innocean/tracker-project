import { Avatar } from '../../SharedUI';
import { useAppContext } from '../../contexts/AppContext';
import InnoceanLogo from '../InnoceanLogo';
import { Icon } from '../icons/Icon';
import { useFeatureFlags, useFeatureFlag } from '../../featureFlags';

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

export default function MobileTopBar() {
  const {
    MY_TICKETS_UI_ENABLED,
    SUBMIT_IDEA_UI_ENABLED,
    CONTACT_SUPPORT_UI_ENABLED,
    REPLAY_TOUR_UI_ENABLED,
  } = useFeatureFlags();
  const {
    language,
    setIsMobileMenuOpen,
    setSelectedBoard,
    setIsProactiveAIOpen,
    unreadCount,
    isNotifOpen,
    setIsNotifOpen,
    handleReadAllNotifications,
    notifications,
    handleReadNotification,
    handleNotificationTaskClick,
    setIsInvitesModalOpen,
    formatDateMMM,
    isMobileProfileOpen,
    setIsMobileProfileOpen,
    currentUser,
    avatarsMap,
    workspaceRole,
    isSuperAdmin,
    setIsSettingsOpen,
    t,
    setIsLeaveModalOpen,
    accountStatus,
    setIsChatWorkspaceOpen,
    setIsMyTicketsOpen,
    setIsDocsOpen,
    setIsFeedbackOpen,
    setIsSupportOpen,
    setIsProjectChatOpen,
    setDrawerTab,
    startTour,
    isInstallable,
    handleInstallClick,
    setIsLogoutConfirmOpen,
    openGlobalSearch,
  } = useAppContext();

  const isSmartAssistantEnabled = useFeatureFlag('SMART_ASSISTANT_ENABLED');
  const tMsg = (en, id) => (language === 'id' ? id : en);
  const role = isSuperAdmin ? 'admin' : workspaceRole;
  const roleLabel =
    role === 'admin'
      ? tMsg('Admin', 'Admin')
      : role === 'project_owner'
        ? tMsg('Owner', 'Pemilik')
        : role === 'manager'
          ? tMsg('Manager', 'Manager')
          : role === 'staff'
            ? tMsg('Staff', 'Staff')
            : role || tMsg('Member', 'Anggota');

  return (
    <div className='md:hidden flex items-center justify-between bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md px-4 py-3 border-b border-neutral-200/50 dark:border-neutral-800/50 shrink-0 z-50'>
      <div className='flex items-center gap-2'>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className='theme-interactive p-1.5 -ml-1.5 text-neutral-600 dark:text-neutral-300 rounded-md transition-colors'>
          <Icon name='menu' className='w-6 h-6' />
        </button>
        <InnoceanLogo
          size='md'
          className='tour-board-title-mobile'
          onClick={() => {
            setSelectedBoard(null);
            setIsProactiveAIOpen(true);
          }}
        />
      </div>

      <div className='flex items-center gap-4 relative'>
        <button
          type='button'
          onClick={openGlobalSearch}
          className='theme-interactive p-1 text-neutral-600 dark:text-neutral-300 rounded-md transition-colors'
          title={tMsg('Search', 'Cari')}>
          <Icon name='search' className='w-5 h-5' />
        </button>
        <div className='relative'>
          {unreadCount > 0 ? (
            <button
              onClick={() => setIsNotifOpen(true)}
              className='theme-interactive text-xl relative p-1 text-neutral-600 dark:text-neutral-300 rounded-md transition-colors'>
              <Icon name='bell' className='w-5 h-5' />
              <span className='absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black'></span>
            </button>
          ) : (
            <button
              onClick={() => setIsNotifOpen(true)}
              className='theme-interactive text-xl p-1 text-neutral-600 dark:text-neutral-300 rounded-md transition-colors'>
              <Icon name='bell' className='w-5 h-5' />
            </button>
          )}
          {isNotifOpen && (
            <>
              <div
                className='fixed inset-0 z-40'
                onClick={() => setIsNotifOpen(false)}></div>
              <div className='absolute top-full right-0 mt-2 w-[85vw] sm:w-80 max-w-[320px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-50 flex flex-col max-h-[60vh] sm:max-h-96 overflow-hidden'>
                <div className='p-3 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-900'>
                  <h3 className='font-bold text-sm text-black dark:text-white'>
                    {tMsg('Notifications', 'Notifikasi')}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleReadAllNotifications}
                      className='text-xs text-indigo-500 font-bold hover:underline'>
                      {tMsg('Mark all read', 'Tandai semua dibaca')}
                    </button>
                  )}
                </div>
                <div className='overflow-y-auto flex-1'>
                  {notifications.length === 0 ? (
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
                              {(() => {
                                let msgText = n.message ? n.message.replace(/<!--TASK_ID:\d+-->/g, '') : '';
                                if (formatDateMMM && msgText.includes('Your timesheet for period')) {
                                  msgText = msgText.replace(/period (\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})/, (_, d1, d2) => {
                                    return `period ${formatDateMMM(d1)} to ${formatDateMMM(d2)}`;
                                  });
                                }
                                return msgText;
                              })()}
                            </p>
                            <p className='text-[10px] text-neutral-400 mt-0.5'>
                              {formatDateMMM(n.timestamp)}
                            </p>
                          </div>
                          {!n.is_read && (
                            <div className='w-2 h-2 bg-indigo-500 rounded-full shrink-0 mt-1'></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className='relative'>
          {isMobileProfileOpen && (
            <div
              className='fixed inset-0 z-40'
              onClick={() => setIsMobileProfileOpen(false)}></div>
          )}
          <button
            onClick={() => setIsMobileProfileOpen(!isMobileProfileOpen)}
            className='theme-interactive flex flex-col items-center gap-0.5 p-1 -mr-1 rounded-lg transition-colors tour-account-menu-mobile text-slate-600 dark:text-slate-400'
            title={`${currentUser} · ${roleLabel}`}>
            <Avatar
              name={currentUser}
              url={avatarsMap[currentUser]}
              size='w-8 h-8'
              textClass='text-xs'
            />
            <span className='text-[10px] font-semibold leading-none max-w-14 truncate mt-2'>
              {roleLabel}
            </span>
          </button>
          {isMobileProfileOpen && (
            <div className='absolute top-full right-0 mt-2 w-56 z-50'>
              <div className='bg-white/95 dark:bg-black/95 backdrop-blur-xl shadow-xl border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden py-1'>
                <button
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsMobileProfileOpen(false);
                  }}
                  className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors'>
                  <Icon name='settings' className='w-4 h-4' />{' '}
                  {tMsg('Settings', 'Pengaturan')}
                </button>
                <button
                  onClick={() => {
                    setIsLeaveModalOpen(true);
                    setIsMobileProfileOpen(false);
                  }}
                  disabled={accountStatus === 'suspended'}
                  className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors'>
                  <Icon name='calendar-days' className='w-4 h-4' />{' '}
                  {tMsg('Time Off', 'Cuti')}
                </button>
                {isSmartAssistantEnabled && (
                  <button
                    onClick={() => {
                      setIsProjectChatOpen(true);
                      setDrawerTab('assistant');
                      setIsMobileProfileOpen(false);
                    }}
                    disabled={accountStatus === 'suspended'}
                    className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors'>
                    <Icon name='sparkles' className='w-4 h-4' />{' '}
                    {tMsg('Smart Assistant', 'Asisten Pintar AI')}
                  </button>
                )}
                {MY_TICKETS_UI_ENABLED && (
                  <button
                    onClick={() => {
                      setIsMyTicketsOpen(true);
                      setIsMobileProfileOpen(false);
                    }}
                    disabled={accountStatus === 'suspended'}
                    className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors'>
                    <Icon name='ticket' className='w-4 h-4' />{' '}
                    {tMsg('My Tickets', 'Tiket Saya')}
                  </button>
                )}
                <div className='border-t border-neutral-200 dark:border-neutral-800 my-1'></div>
                <button
                  onClick={() => {
                    setIsDocsOpen(true);
                    setIsMobileProfileOpen(false);
                  }}
                  className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors'>
                  <Icon name='book-open' className='w-4 h-4' />{' '}
                  {tMsg('Documentation', 'Dokumentasi')}
                </button>
                {SUBMIT_IDEA_UI_ENABLED && (
                  <button
                    onClick={() => {
                      setIsFeedbackOpen(true);
                      setIsMobileProfileOpen(false);
                    }}
                    disabled={accountStatus === 'suspended'}
                    className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors'>
                    <Icon name='lightbulb' className='w-4 h-4' />{' '}
                    {tMsg('Submit Idea', 'Kirim Masukan')}
                  </button>
                )}
                {CONTACT_SUPPORT_UI_ENABLED && (
                  <button
                    onClick={() => {
                      setIsSupportOpen(true);
                      setIsMobileProfileOpen(false);
                    }}
                    disabled={accountStatus === 'suspended'}
                    className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors'>
                    <Icon name='phone' className='w-4 h-4' />{' '}
                    {tMsg('Contact Support', 'Hubungi Dukungan')}
                  </button>
                )}
                {REPLAY_TOUR_UI_ENABLED && (
                  <button
                    onClick={() => {
                      startTour();
                      setIsMobileProfileOpen(false);
                    }}
                    className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors'>
                    <Icon name='compass' className='w-4 h-4' />{' '}
                    {tMsg('Replay Tour', 'Ulangi Tur')}
                  </button>
                )}
                {isInstallable && (
                  <button
                    onClick={() => {
                      handleInstallClick();
                      setIsMobileProfileOpen(false);
                    }}
                    className='w-full text-left px-4 py-3 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 transition-colors mt-1 rounded-lg'>
                    <Icon name='download' className='w-4 h-4' />
                    {tMsg('Install App', 'Instal Aplikasi')}
                  </button>
                )}
                <div className='border-t border-neutral-200 dark:border-neutral-800 my-1'></div>
                <button
                  onClick={() => {
                    setIsLogoutConfirmOpen(true);
                    setIsMobileProfileOpen(false);
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
    </div>
  );
}
