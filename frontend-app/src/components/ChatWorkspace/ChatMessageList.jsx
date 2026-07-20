import React from 'react';
import ChatMessage from '../../ChatMessage';
import { Avatar } from '../../SharedUI';

export default function ChatMessageList({
  scrollContainerRef,
  handleScroll,
  isLoadingMessages,
  messages,
  hasMoreMessages,
  loadMoreMessages,
  tMsg,
  formatDateMMM,
  currentUser,
  avatarsMap,
  firstUnreadId,
  setReplyingTo,
  deleteWorkspaceMessage,
  showNotification,
  toggleWorkspaceReaction,
  activeChat,
  isSuperAdmin,
  accountStatus,
  isAiReplying,
  messagesEndRef,
  latestMentionId,
  setDismissedMentions,
  setLatestMentionId,
  showScrollBottom,
  setShowScrollBottom,
}) {
  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-neutral-50/50 dark:bg-neutral-900/30 relative z-10"
    >
      <div className="relative z-10 flex flex-col gap-4">
        {isLoadingMessages && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50 py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mb-2"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              Loading...
            </span>
          </div>
        ) : (
          <>
            {hasMoreMessages && (
              <div className="flex justify-center my-2 relative">
                <button
                  onClick={loadMoreMessages}
                  className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-4 py-2 rounded-full transition-colors border border-indigo-200 dark:border-indigo-800/50 shadow-sm z-10"
                >
                  Load older messages
                </button>
              </div>
            )}

            {messages.map((c, index, arr) => {
              const currDate = new Date(c.timestamp.replace(/-/g, '/')).toDateString();
              const prevDate =
                index > 0 ? new Date(arr[index - 1].timestamp.replace(/-/g, '/')).toDateString() : null;
              const showDivider = currDate !== prevDate;

              let dividerDisplay = '';
              if (showDivider) {
                const today = new Date().toDateString();
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                if (currDate === today) dividerDisplay = tMsg('Today', 'Hari Ini');
                else if (currDate === yesterday) dividerDisplay = tMsg('Yesterday', 'Kemarin');
                else dividerDisplay = formatDateMMM(c.timestamp);
              }

              return (
                <ChatMessage
                  key={c.id}
                  message={c}
                  currentUser={currentUser}
                  avatarsMap={avatarsMap}
                  showDivider={showDivider}
                  dividerDisplay={dividerDisplay}
                  isFirstUnread={c.id === firstUnreadId}
                  onReply={() => setReplyingTo(c)}
                  onDelete={() => deleteWorkspaceMessage(c.id)}
                  onCopy={() => {
                    let cleanText = c.text
                      .replace(/\*\*(.*?)\*\*/g, '$1')
                      .replace(/\*(.*?)\*/g, '$1')
                      .replace(/__(.*?)__/g, '$1');
                    const temp = document.createElement('textarea');
                    temp.innerHTML = cleanText;
                    navigator.clipboard.writeText(temp.value.trim());
                    if (showNotification)
                      showNotification(tMsg('Copied to clipboard!', 'Disalin ke papan klip!'), 'info');
                  }}
                  onReact={(emoji) => toggleWorkspaceReaction(c.id, emoji)}
                  canReply={
                    activeChat.type !== 'dm' &&
                    (activeChat.type === 'project' || activeChat.is_involved !== false || isSuperAdmin)
                  }
                  canDelete={
                    (c.username === currentUser || isSuperAdmin) && accountStatus !== 'suspended'
                  }
                  canReact={
                    accountStatus !== 'suspended' &&
                    (activeChat.type === 'dm' ||
                      activeChat.type === 'project' ||
                      activeChat.is_involved !== false ||
                      isSuperAdmin)
                  }
                  idPrefix="cw-msg-"
                  tMsg={tMsg}
                />
              );
            })}

            {isAiReplying && activeChat.type === 'task' && (
              <div className="flex gap-3 w-full p-1.5 -mx-1.5 flex-row chat-animate group/bubble">
                <Avatar name="Smart Assistant 🤖" url="" size="w-8 h-8 shrink-0" textClass="text-[10px]" />
                <div className="flex flex-col items-start min-w-0 max-w-[92%]">
                  <div className="flex items-baseline gap-2 mb-1 flex-row">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      @Smart Assistant 🤖
                    </span>
                  </div>
                  <div className="p-3 text-sm font-medium leading-relaxed shadow-sm shrink min-w-0 bg-white dark:bg-neutral-800 text-black dark:text-white border border-neutral-100 dark:border-neutral-700 rounded-2xl rounded-tl-sm flex gap-1.5 items-center h-10">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span
                      className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    ></span>
                  </div>
                </div>
              </div>
            )}

            {messages.length === 0 && (
              <p className="text-center text-sm text-neutral-500 font-medium italic mt-10">
                {activeChat.type === 'dm'
                  ? 'Start a conversation!'
                  : 'No messages yet. Start the conversation!'}
              </p>
            )}
          </>
        )}
        <div ref={messagesEndRef} className="h-10 shrink-0" />
      </div>

      {/* Floating Mentions Jumper inside Area */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-40 pointer-events-none [&>button]:pointer-events-auto">
        {latestMentionId && (
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById(`cw-msg-${latestMentionId}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add(
                  'ring-2',
                  'ring-indigo-500',
                  'bg-indigo-50',
                  'dark:bg-indigo-900/30',
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
                      'scale-[1.02]',
                      'z-50'
                    ),
                  2500
                );
              }
              setDismissedMentions((prev) => new Set(prev).add(latestMentionId));
              setLatestMentionId(null);
            }}
            className="w-10 h-10 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center font-black text-lg hover:scale-110 transition-transform"
            title="Jump to mention"
          >
            @
          </button>
        )}
        {showScrollBottom && (
          <button
            type="button"
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              setShowScrollBottom(false);
            }}
            className="w-10 h-10 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center font-black hover:scale-110 transition-transform"
            title="Scroll to bottom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
