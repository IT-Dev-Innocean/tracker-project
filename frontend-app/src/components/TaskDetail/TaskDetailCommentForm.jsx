import React from 'react';
import { Icon } from '../icons/Icon';
import { getFeatureFlag, useFeatureFlag } from '../../featureFlags';

function getCommentMentionOptions(selectedBoard, globalMentionOptions) {
  const members = globalMentionOptions || [];
  const aiEnabled = getFeatureFlag('TASK_COMMENT_AI_MENTION_ENABLED');
  if (selectedBoard?.is_private) {
    return aiEnabled
      ? ['AI (Private)', 'AI (Team)', ...members]
      : [...members];
  }
  return aiEnabled
    ? ['all', 'AI (Team)', 'AI (Private)', ...members]
    : ['all', ...members];
}

export default function TaskDetailCommentForm({
  isInvolved,
  replyingTo,
  setReplyingTo,
  taskLatestMentionId,
  setTaskLatestMentionId,
  setDismissedTaskMentions,
  comments,
  currentUser,
  showTaskScrollBottom,
  setShowTaskScrollBottom,
  commentsEndRef,
  handleChatSubmit,
  newComment,
  handleCommentChange,
  accountStatus,
  isCommentMentioning,
  setIsCommentMentioning,
  selectedBoard,
  globalMentionOptions,
  commentMentionQuery,
  commentMentionIndex,
  setCommentMentionIndex,
  insertCommentMention,
  teamMembers,
  workspaceRole,
  tMsg,
}) {
  const TASK_COMMENT_AI_MENTION_ENABLED = useFeatureFlag('TASK_COMMENT_AI_MENTION_ENABLED');
  return (
    <>
      {isInvolved ? (
        <>
          {replyingTo && (
            <div className='mb-3 flex items-start justify-between bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl p-2.5 border border-indigo-100 dark:border-indigo-800/50'>
              <div className='min-w-0 flex-1 border-l-2 border-indigo-400 pl-2'>
                <span className='text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5'>
                  {tMsg('Replying to', 'Membalas')} @{replyingTo.username}
                </span>
                <p className='text-xs text-neutral-500 dark:text-neutral-400 truncate pr-4'>
                  {replyingTo.text
                    .replace(/^> .*?\n/gm, '')
                    .replace(/<[^>]*>?/gm, '')}
                </p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className='text-neutral-400 hover:text-black dark:hover:text-white p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors'>
                <Icon name='x' className='w-4 h-4' />
              </button>
            </div>
          )}
          <div className='absolute bottom-24 right-6 flex flex-col gap-2 z-40 pointer-events-none [&>button]:pointer-events-auto'>
            {taskLatestMentionId && (
              <button
                type='button'
                onClick={() => {
                  const el = document.getElementById(
                    `task-chat-msg-${taskLatestMentionId}`
                  );
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
                    setTimeout(() => {
                      el.classList.remove(
                        'ring-2',
                        'ring-indigo-500',
                        'bg-indigo-50',
                        'dark:bg-indigo-900/30',
                        'scale-[1.02]',
                        'z-50'
                      );
                    }, 2500);
                  }
                  const allMentionIds = comments
                    .filter(
                      (m) =>
                        m.text.includes(`@${currentUser}`) ||
                        m.text.includes('@all') ||
                        m.text.includes('@team')
                    )
                    .map((m) => m.id);
                  setDismissedTaskMentions((prev) => [
                    ...prev,
                    taskLatestMentionId,
                    ...allMentionIds,
                  ]);
                  setTaskLatestMentionId(null);
                }}
                className='w-10 h-10 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center font-black text-lg hover:scale-110 transition-transform'
                title='Jump to mention'>
                @
              </button>
            )}
            {showTaskScrollBottom && (
              <button
                type='button'
                onClick={() => {
                  commentsEndRef.current?.scrollIntoView({
                    behavior: 'smooth',
                  });
                  setShowTaskScrollBottom(false);
                }}
                className='w-10 h-10 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center font-black hover:scale-110 transition-transform'
                title='Scroll to bottom'>
                <Icon
                  name='chevron-down'
                  className='w-5 h-5'
                  strokeWidth={2.5}
                />
              </button>
            )}
          </div>
          <form
            onSubmit={(e) => {
              handleChatSubmit(e);
              const ta = e.target.querySelector('textarea');
              if (ta) ta.style.height = '44px';
            }}
            className='flex gap-2 relative items-end'>
            <textarea
              value={newComment}
              onChange={(e) => handleCommentChange(e.target.value)}
              disabled={accountStatus === 'suspended'}
              placeholder={
                TASK_COMMENT_AI_MENTION_ENABLED
                  ? tMsg(
                      'Write a comment... (@AI to ask)',
                      'Tulis komentar... (@AI untuk tanya)'
                    )
                  : tMsg('Write a comment...', 'Tulis komentar...')
              }
              className='flex-1 py-3 px-4 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl focus:bg-white dark:focus:bg-black focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-medium placeholder-neutral-400 transition-colors disabled:opacity-50 resize-none max-h-32'
              style={{ minHeight: '44px' }}
              rows='1'
              onInput={(e) => {
                e.target.style.height = '44px';
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (isCommentMentioning) {
                  const allOps = getCommentMentionOptions(
                    selectedBoard,
                    globalMentionOptions
                  );
                  const filtered = allOps.filter((m) =>
                    m.toLowerCase().includes(commentMentionQuery)
                  );
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setCommentMentionIndex(
                      (prev) => (prev + 1) % (filtered.length || 1)
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setCommentMentionIndex(
                      (prev) =>
                        (prev - 1 + filtered.length) % (filtered.length || 1)
                    );
                  } else if (e.key === 'Enter' || e.key === 'Tab') {
                    if (filtered.length > 0) {
                      e.preventDefault();
                      insertCommentMention(
                        filtered[commentMentionIndex] || filtered[0]
                      );
                    } else if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      setIsCommentMentioning(false);
                      handleChatSubmit(e);
                      e.target.style.height = '44px';
                    } else {
                      setIsCommentMentioning(false);
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsCommentMentioning(false);
                  }
                } else if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleChatSubmit(e);
                  e.target.style.height = '44px';
                }
              }}
            />
            {isCommentMentioning && accountStatus !== 'suspended' && (
              <div className='absolute left-0 bottom-full mb-2 w-full bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl z-50 max-h-40 overflow-y-auto py-2'>
                {(() => {
                  const effectiveGlobalOptions =
                    workspaceRole === 'staff'
                      ? teamMembers || []
                      : globalMentionOptions;
                  const allOptions = getCommentMentionOptions(
                    selectedBoard,
                    effectiveGlobalOptions
                  );
                  const filteredOptions = allOptions.filter((m) =>
                    m.toLowerCase().includes(commentMentionQuery)
                  );
                  if (filteredOptions.length > 0) {
                    return filteredOptions.map((m, idx) => (
                      <div
                        key={m}
                        className={`px-4 py-2.5 cursor-pointer text-sm text-black dark:text-white font-medium border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 flex items-center gap-2 ${
                          commentMentionIndex === idx
                            ? 'bg-neutral-100 dark:bg-neutral-800'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                        onClick={() => insertCommentMention(m)}>
                        <span>@{m}</span>
                        {m === 'all' && (
                          <span className='text-xs text-neutral-500 dark:text-neutral-400 font-normal'>
                            {tMsg(
                              '(Notify everyone involved in task)',
                              '(Beritahu semua yang terlibat di tugas)'
                            )}
                          </span>
                        )}
                        {m === 'AI (Team)' && (
                          <span className='text-xs text-neutral-500 dark:text-neutral-400 font-normal'>
                            {tMsg('(Ask AI openly)', '(Tanya AI di tim)')}
                          </span>
                        )}
                        {m === 'AI (Private)' && (
                          <span className='text-xs text-neutral-500 dark:text-neutral-400 font-normal'>
                            {tMsg('(Ask AI privately)', '(Tanya AI privat)')}
                          </span>
                        )}
                        {m !== 'all' &&
                          !m.startsWith('AI') &&
                          !teamMembers.includes(m) && (
                            <span className='text-[8px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest ml-auto'>
                              +Invite
                            </span>
                          )}
                      </div>
                    ));
                  }
                  return (
                    <div className='px-4 py-3 text-sm text-neutral-500 italic'>
                      {tMsg('No members found', 'Tidak ada anggota ditemukan')}
                    </div>
                  );
                })()}
              </div>
            )}
            <button
              type='submit'
              disabled={accountStatus === 'suspended' || !newComment.trim()}
              className='bg-indigo-600 text-white hover:bg-indigo-700 w-12 h-12 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 shrink-0'>
              <Icon name='send' className='w-5 h-5' strokeWidth={2} />
            </button>
          </form>
        </>
      ) : (
        <div className='p-4 text-center text-xs font-bold text-neutral-500 uppercase tracking-widest bg-neutral-100/50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center gap-2'>
          <Icon name='lock' className='w-3.5 h-3.5' />
          {tMsg(
            'Only involved members can comment',
            'Hanya anggota yang terlibat yang dapat berkomentar'
          )}
        </div>
      )}
    </>
  );
}
