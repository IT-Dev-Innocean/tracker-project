import { Avatar } from '../../SharedUI';
import { useAppContext } from '../../contexts/AppContext';
import InnoceanLogo from '../InnoceanLogo';

export default function MobileTopBar() {
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
    isSuperAdmin,
    openAdminModal,
  } = useAppContext();

  const tMsg = (en, id) => (language === 'id' ? id : en);

  return (
    <div className='md:hidden flex items-center justify-between bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md px-4 py-3 border-b border-neutral-200/50 dark:border-neutral-800/50 shrink-0 z-[45]'>
      <div className='flex items-center gap-2'>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className='p-1.5 -ml-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors'>
          <svg
            className='w-6 h-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2.5'
              d='M4 6h16M4 12h16M4 18h16'></path>
          </svg>
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
        <div className='relative'>
          {unreadCount > 0 ? (
            <button
              onClick={() => setIsNotifOpen(true)}
              className='text-xl relative p-1 text-neutral-600 dark:text-neutral-300'>
              🔔
              <span className='absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black'></span>
            </button>
          ) : (
            <button
              onClick={() => setIsNotifOpen(true)}
              className='text-xl p-1 text-neutral-600 dark:text-neutral-300'>
              🔔
            </button>
          )}
          {isNotifOpen && (
            <>
              <div
                className='fixed inset-0 z-40'
                onClick={() => setIsNotifOpen(false)}></div>
              <div className='absolute top-full right-0 mt-2 w-[85vw] sm:w-80 max-w-[320px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-50 flex flex-col max-h-[60vh] sm:max-h-[450px] overflow-hidden'>
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
                      <span className='text-3xl block mb-2'>📭</span>
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
                          <span className='text-lg shrink-0'>
                            {n.type === 'task_assigned'
                              ? '👉'
                              : n.type === 'task_completed'
                                ? '✅'
                                : n.type === 'comment' ||
                                    n.type === 'mention' ||
                                    n.type === 'team_chat'
                                  ? '💬'
                                  : n.type === 'team_invite' ||
                                      n.type === 'access_request'
                                    ? '🤝'
                                    : '🔔'}
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
            className='p-1 -mr-1 tour-account-menu-mobile'>
            <Avatar
              name={currentUser}
              url={avatarsMap[currentUser]}
              size='w-8 h-8'
              textClass='text-xs'
            />
          </button>
          {isMobileProfileOpen && (
            <div className='absolute top-full right-0 mt-2 w-56 z-50'>
              <div className='bg-white/95 dark:bg-black/95 backdrop-blur-xl shadow-xl border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden py-1'>
                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      openAdminModal();
                      setIsMobileProfileOpen(false);
                    }}
                    className='w-full text-left px-4 py-3 text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center gap-2 transition-colors'>
                    <span>🔑</span> {tMsg('Manage Users', 'Kelola Pengguna')}
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsMobileProfileOpen(false);
                  }}
                  className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors'>
                  <span>⚙️</span> {tMsg('Settings', 'Pengaturan')}
                </button>
                <button
                  onClick={() => {
                    setIsLeaveModalOpen(true);
                    setIsMobileProfileOpen(false);
                  }}
                  disabled={accountStatus === 'suspended'}
                  className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors'>
                  <span>🌴</span> {tMsg('Time Off', 'Cuti')}
                </button>
                <button
                  onClick={() => {
                    setIsProjectChatOpen(true);
                    setDrawerTab('assistant');
                    setIsMobileProfileOpen(false);
                  }}
                  disabled={accountStatus === 'suspended'}
                  className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors'>
                  <span>✨</span> {tMsg('Smart Assistant', 'Asisten Pintar AI')}
                </button>
                <button
                  onClick={() => {
                    setIsMyTicketsOpen(true);
                    setIsMobileProfileOpen(false);
                  }}
                  disabled={accountStatus === 'suspended'}
                  className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors'>
                  <span>🎫</span> {tMsg('My Tickets', 'Tiket Saya')}
                </button>
                <div className='border-t border-neutral-200 dark:border-neutral-800 my-1'></div>
                <button
                  onClick={() => {
                    setIsDocsOpen(true);
                    setIsMobileProfileOpen(false);
                  }}
                  className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors'>
                  <span>📖</span> {tMsg('Documentation', 'Dokumentasi')}
                </button>
                <button
                  onClick={() => {
                    setIsFeedbackOpen(true);
                    setIsMobileProfileOpen(false);
                  }}
                  disabled={accountStatus === 'suspended'}
                  className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors'>
                  <span>💡</span> {tMsg('Submit Idea', 'Kirim Masukan')}
                </button>
                <button
                  onClick={() => {
                    setIsSupportOpen(true);
                    setIsMobileProfileOpen(false);
                  }}
                  disabled={accountStatus === 'suspended'}
                  className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors'>
                  <span>🎧</span> {tMsg('Contact Support', 'Hubungi Dukungan')}
                </button>
                <button
                  onClick={() => {
                    startTour();
                    setIsMobileProfileOpen(false);
                  }}
                  className='w-full text-left px-4 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors'>
                  <span>🧭</span> {tMsg('Replay Tour', 'Ulangi Tur')}
                </button>
                {isInstallable && (
                  <button
                    onClick={() => {
                      handleInstallClick();
                      setIsMobileProfileOpen(false);
                    }}
                    className='w-full text-left px-4 py-3 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 transition-colors mt-1 rounded-lg'>
                    <svg
                      className='w-4 h-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2.5'
                        d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-3 3m0 0l-3-3m3 3V4'></path>
                    </svg>
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
                  <span>🚪</span> {tMsg('Logout', 'Keluar')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
