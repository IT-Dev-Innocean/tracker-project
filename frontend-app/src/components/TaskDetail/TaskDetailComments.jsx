import React from 'react';
import { HighlightText, stripHtml } from '../../Utils';
import ChatMessage from '../../ChatMessage';
import { Avatar } from '../../SharedUI';

export default function TaskDetailComments({
  isTaskChatSearchOpen,
  setIsTaskChatSearchOpen,
  taskChatSearchQuery,
  setTaskChatSearchQuery,
  regularComments,
  comments,
  formatDateMMM,
  hasMoreComments,
  loadMoreComments,
  currentUser,
  avatarsMap,
  firstUnreadId,
  replyingTo,
  setReplyingTo,
  handleDeleteComment,
  showNotification,
  handleToggleReaction,
  isInvolved,
  isSuperAdmin,
  accountStatus,
  isAiReplying,
  commentsEndRef,
  taskLatestMentionId,
  setTaskLatestMentionId,
  setDismissedTaskMentions,
  showTaskScrollBottom,
  setShowTaskScrollBottom,
  handleChatSubmit,
  newComment,
  handleCommentChange,
  isCommentMentioning,
  setIsCommentMentioning,
  selectedBoard,
  globalMentionOptions,
  commentMentionQuery,
  commentMentionIndex,
  setCommentMentionIndex,
  insertCommentMention,
  teamMembers,
  tMsg,
}) {
  return (
    <>
      {/* Main Comments List Area */}
      {/* We assume the parent TaskDetailModal wraps this in the scroll container */}
      {hasMoreComments && (
        <div className="flex justify-center my-2 relative">
          <button
            onClick={loadMoreComments}
            className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-4 py-2 rounded-full transition-colors border border-indigo-200 dark:border-indigo-800/50 shadow-sm z-10"
          >
            {tMsg('Load older comments', 'Muat komentar lama')}
          </button>
        </div>
      )}

      {regularComments.map((c, index) => {
        const currDate = new Date(c.timestamp.replace(/-/g, '/')).toDateString();
        const prevDate =
          index > 0
            ? new Date(regularComments[index - 1].timestamp.replace(/-/g, '/')).toDateString()
            : null;
        const showDivider = currDate !== prevDate;
        let dividerDisplay = '';
        if (showDivider) {
          const today = new Date().toDateString();
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          if (currDate === today) dividerDisplay = tMsg('Today', 'Hari Ini');
          else if (currDate === yesterday) dividerDisplay = tMsg('Yesterday', 'Kemarin');
          else dividerDisplay = formatDateMMM(c.timestamp);
        }
        const isMe = c.username === currentUser;
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
            onDelete={() => handleDeleteComment(c.id)}
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
            onReact={(emoji) => handleToggleReaction(c.id, emoji, false)}
            canReply={isInvolved}
            canDelete={(isMe || isSuperAdmin) && accountStatus !== 'suspended'}
            canReact={isInvolved && accountStatus !== 'suspended'}
            idPrefix="task-chat-msg-"
            tMsg={tMsg}
          />
        );
      })}
      {isAiReplying && (
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
      <div ref={commentsEndRef} className="h-32 shrink-0" />
      {regularComments.length === 0 && (
        <p className="text-center text-sm text-neutral-500 font-medium italic mt-10">
          {tMsg('No comments yet. Start the conversation!', 'Belum ada komentar. Mulai percakapan!')}
        </p>
      )}
    </>
  );
}
