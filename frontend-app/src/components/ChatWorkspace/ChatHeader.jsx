import React from 'react';
import { Avatar } from '../../SharedUI';
import { Icon } from '../icons/Icon';
import { stripHtml } from '../../Utils';

export default function ChatHeader({
  activeChat,
  isDesktopSidebarOpen,
  setIsDesktopSidebarOpen,
  setIsMobileSidebarOpen,
  chatSearchQuery,
  setChatSearchQuery,
  messages,
  avatarsMap,
  tMsg,
  formatDateMMM,
  handleMeetNow,
  handleNotificationTaskClick,
}) {
  return (
    <div className="h-16 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6 bg-white dark:bg-neutral-950 shrink-0 z-30 shadow-sm relative">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && window.innerWidth >= 768) {
              setIsDesktopSidebarOpen(true);
            } else {
              setIsMobileSidebarOpen(true);
            }
          }}
          className={`p-2 -ml-2 mr-1 text-neutral-500 hover:text-black dark:hover:text-white transition-colors shrink-0 ${
            isDesktopSidebarOpen ? 'md:hidden' : ''
          }`}
        >
          <Icon name="chevron-right" className="w-5 h-5" strokeWidth={2} />
        </button>
        {activeChat.type === 'dm' ? (
          <Avatar name={activeChat.partner} url={avatarsMap[activeChat.partner]} size="w-8 h-8" />
        ) : (
          <Icon
            name={activeChat.type === 'project' ? 'building' : 'clipboard-list'}
            className="w-6 h-6 text-neutral-500"
          />
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-sm text-black dark:text-white truncate">
            {activeChat.type === 'dm' ? `@${activeChat.name}` : activeChat.name}
          </h3>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest truncate">
            {activeChat.type === 'dm'
              ? 'Direct Message'
              : activeChat.type === 'project'
              ? 'Project Channel'
              : 'Task Thread'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative hidden sm:block w-40 md:w-56">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder={tMsg('Search messages...', 'Cari pesan...')}
            value={chatSearchQuery}
            onChange={(e) => setChatSearchQuery(e.target.value)}
            className="w-full bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 rounded-lg pl-8 pr-8 py-1.5 text-xs font-medium text-black dark:text-white outline-none transition-colors"
          />
          {chatSearchQuery && (
            <button
              onClick={() => setChatSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black dark:hover:text-white p-1"
            >
              <Icon name="x" className="w-3.5 h-3.5" />
            </button>
          )}
          {chatSearchQuery && (
            <div className="absolute top-full mt-2 right-0 w-64 md:w-72 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-700 shadow-2xl rounded-xl z-50 max-h-64 overflow-y-auto custom-scrollbar mac-animate">
              {messages
                .filter((c) => {
                  const keywords = chatSearchQuery.toLowerCase().split(/\s+/).filter(Boolean);
                  const combinedText = [c.text, c.username].join(' ').toLowerCase();
                  return keywords.every((kw) => combinedText.includes(kw));
                })
                .map((c) => (
                  <div
                    key={`search-${c.id}`}
                    onClick={() => {
                      setChatSearchQuery('');
                      const el = document.getElementById(`cw-msg-${c.id}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add(
                          'ring-2',
                          'ring-indigo-500',
                          'bg-indigo-50',
                          'dark:bg-indigo-900/30',
                          'rounded-2xl',
                          'scale-[1.02]',
                          'z-50'
                        );
                        setTimeout(
                          () =>
                            el.classList.remove(
                              'ring-2',
                              'ring-indigo-500',
                              'bg-indigo-50',
                              'dark:bg-indigo-900/30',
                              'rounded-2xl',
                              'scale-[1.02]',
                              'z-50'
                            ),
                          2500
                        );
                      }
                    }}
                    className="p-3 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex flex-col gap-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        @{c.username}
                      </span>
                      <span className="text-[9px] font-medium text-neutral-400">
                        {formatDateMMM(c.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-black dark:text-white line-clamp-2">{stripHtml(c.text)}</p>
                  </div>
                ))}
              {messages.filter((c) => {
                const keywords = chatSearchQuery.toLowerCase().split(/\s+/).filter(Boolean);
                const combinedText = [c.text, c.username].join(' ').toLowerCase();
                return keywords.every((kw) => combinedText.includes(kw));
              }).length === 0 && (
                <div className="p-4 text-center text-xs font-bold text-neutral-500">No messages found.</div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleMeetNow}
          className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors uppercase tracking-widest"
        >
          <Icon name="video" className="w-4 h-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Meet Now</span>
        </button>
        {activeChat.type === 'task' && (
          <button
            onClick={() => {
              if (handleNotificationTaskClick) handleNotificationTaskClick(activeChat.id);
            }}
            className="text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-lg shadow-sm transition-colors uppercase tracking-widest border border-indigo-200 dark:border-indigo-800/50 flex items-center gap-1"
          >
            View Task
            <Icon name="arrow-up-right" className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
