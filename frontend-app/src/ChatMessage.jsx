import React from 'react';
import { Avatar } from './SharedUI';
import { Icon } from './components/icons/Icon';

export const renderChatMessageContent = (text, isMe) => {
  if (!text) return '';
  const codeBlocks = [];
  let escaped = String(text);

  escaped = escaped.replace(/```([\s\S]*?)(?:```|$)/g, (match, p1) => {
    codeBlocks.push(p1);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  escaped = escaped
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /^&gt; (.*?)(?=\n|$)/gm,
      `<blockquote class="border-l-2 ${
        isMe
          ? 'border-indigo-300 bg-indigo-700/30 text-indigo-100'
          : 'border-neutral-300 bg-neutral-200 dark:bg-neutral-800 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400'
      } pl-2 py-1 my-1 italic text-[11px] rounded-r-sm line-clamp-3">$1</blockquote>`
    )
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/\n/g, '<br/>')
    .replace(
      /(@[\w.-]+|@Smart Assistant|@AI \(Team\)|@AI \(Private\))/gi,
      '<span class="font-bold opacity-100 text-shadow-blue-600 dark:text-blue-400">$1</span>'
    )
    .replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 hover:opacity-80 break-all">$1</a>'
    );

  codeBlocks.forEach((code, i) => {
    let cleanCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    cleanCode = cleanCode.replace(/^[a-z0-9_-]+[ \t]*\r?\n/i, '');
    let lines = cleanCode.split(/\r?\n/);
    let minIndent = Infinity;
    lines.forEach((line) => {
      if (line.trim().length > 0) {
        const match = line.match(/^[ \t]*/);
        if (match) minIndent = Math.min(minIndent, match[0].length);
      }
    });
    if (minIndent > 0 && minIndent !== Infinity) {
      cleanCode = lines
        .map((line) =>
          line.length >= minIndent ? line.substring(minIndent) : line
        )
        .join('\n');
    } else {
      cleanCode = lines.join('\n');
    }
    const block = `<details class="group bg-[#272822] text-[#F8F8F2] rounded-xl my-3 shadow-lg border border-[#3e3d32] overflow-hidden w-full max-w-full" open><summary class="px-3 py-2 bg-[#1e1f1c] cursor-pointer text-xs font-bold font-sans flex items-center justify-between select-none border-b border-[#3e3d32] hover:bg-[#2c2d27] transition-colors"><span class="text-[#A6E22E] flex items-center gap-2"><span>Code</span></span><div class="flex items-center gap-3"><button type="button" onclick="event.preventDefault(); event.stopPropagation(); navigator.clipboard.writeText(this.closest('details').querySelector('code').innerText); const t = this.innerHTML; this.innerHTML = 'Copied!'; setTimeout(() => this.innerHTML = t, 2000);" class="text-[10px] font-bold text-neutral-400 hover:text-[#A6E22E] transition-colors bg-[#272822] border border-[#3e3d32] px-2.5 py-1 rounded-md active:scale-95">Copy</button><span class="group-open:rotate-180 transition-transform">▼</span></div></summary><div class="overflow-x-auto p-3 w-full custom-scrollbar"><pre class="font-mono text-[10px] sm:text-xs text-left" style="white-space: pre; line-height: 1.3;"><code>${cleanCode}</code></pre></div></details>`;
    escaped = escaped.replace(`__CODE_BLOCK_${i}__`, block);
  });
  return escaped;
};

export default function ChatMessage({
  message: c,
  currentUser,
  avatarsMap,
  showDivider,
  dividerDisplay,
  isFirstUnread,
  onReply,
  onDelete,
  onCopy,
  onReact,
  canReply,
  canDelete,
  canReact,
  idPrefix,
  tMsg,
  children,
}) {
  const isMe = c.username === currentUser;

  return (
    <React.Fragment>
      {showDivider && (
        <div className='flex justify-center my-2 relative'>
          <div className='absolute top-1/2 left-0 w-full h-px bg-neutral-200 dark:bg-neutral-800 z-0'></div>
          <span className='bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest z-10 border border-neutral-200 dark:border-neutral-700 shadow-sm'>
            {dividerDisplay}
          </span>
        </div>
      )}
      {isFirstUnread && (
        <div className='flex justify-center my-4 relative chat-animate'>
          <div className='absolute top-1/2 left-0 w-full h-px bg-red-200 dark:bg-red-800/50 z-0'></div>
          <span className='bg-red-50 dark:bg-red-900/30 text-red-500 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest z-10 border border-red-200 dark:border-red-800/50 shadow-sm'>
            {tMsg
              ? tMsg('Unread Messages', 'Pesan Belum Dibaca')
              : 'Unread Messages'}
          </span>
        </div>
      )}
      <div
        id={`${idPrefix}${c.id}`}
        className={`flex gap-3 w-full p-1.5 -mx-1.5 transition-all duration-500 ${
          isMe ? 'flex-row-reverse' : 'flex-row'
        } chat-animate scroll-mt-20 group/bubble`}>
        <Avatar
          name={c.username}
          url={avatarsMap[c.username]}
          size='w-8 h-8 shrink-0'
          textClass='text-[10px]'
        />
        <div
          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} min-w-0 max-w-[92%]`}>
          <div
            className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className='text-[10px] font-bold text-neutral-600 dark:text-neutral-400'>
              @{c.username}
            </span>
            <span className='text-[8px] font-bold text-neutral-400 opacity-70'>
              {new Date(c.timestamp.replace(/-/g, '/')).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {c.isPrivate && (
              <span className='text-[8px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded uppercase tracking-widest ml-1 shadow-sm inline-flex items-center gap-1'>
                <Icon name='lock' className='w-2.5 h-2.5' /> Private
              </span>
            )}
          </div>

          <div
            className={`flex items-center gap-2 max-w-full ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            <div
              className={`p-3 text-sm font-medium leading-relaxed shadow-sm shrink min-w-0 ${
                isMe
                  ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                  : 'bg-white dark:bg-neutral-800 text-black dark:text-white border border-neutral-100 dark:border-neutral-700 rounded-2xl rounded-tl-sm'
              }`}>
              <div
                dangerouslySetInnerHTML={{
                  __html: renderChatMessageContent(c.text, isMe),
                }}
                className='break-normal space-y-1 select-text'
              />
              {children}
            </div>
            <div className='flex items-center justify-center gap-1 opacity-100 md:opacity-0 group-hover/bubble:opacity-100 transition-opacity shrink-0'>
              {canReply && (
                <button
                  onClick={onReply}
                  className='p-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-sm text-neutral-400 hover:text-indigo-500 transition-colors'
                  title='Reply'>
                  <Icon name='reply' className='w-3 h-3' />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={onDelete}
                  className='p-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-sm text-neutral-400 hover:text-red-500 transition-colors'
                  title='Delete'>
                  <Icon name='trash' className='w-3 h-3' />
                </button>
              )}
              <button
                onClick={onCopy}
                className='p-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-sm text-neutral-400 hover:text-indigo-500 transition-colors'
                title='Copy'>
                <Icon name='copy' className='w-3.5 h-3.5' />
              </button>
            </div>
          </div>

          <div
            className={`flex flex-wrap items-center gap-1.5 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {c.reactions &&
              Object.keys(c.reactions).length > 0 &&
              Object.entries(c.reactions).map(([emoji, users]) => (
                <button
                  key={emoji}
                  onClick={() => onReact(emoji)}
                  className={`px-1.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 border shadow-sm transition-colors ${
                    users.includes(currentUser)
                      ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-600 dark:text-indigo-300'
                      : 'bg-white border-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                  }`}
                  title={users.join(', ')}>
                  <span>{emoji}</span>{' '}
                  <span className='font-bold'>{users.length}</span>
                </button>
              ))}
            {canReact && (
              <div className='relative group/picker flex items-center opacity-100 md:opacity-0 group-hover/bubble:opacity-100 transition-opacity'>
                <button
                  className='p-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-sm text-neutral-400 hover:text-indigo-500 transition-colors'
                  title='Add Reaction'>
                  <Icon name='smile-plus' className='w-3 h-3' />
                </button>
                <div
                  className={`absolute top-1/2 -translate-y-1/2 ${
                    isMe ? 'right-full pr-1.5' : 'left-full pl-1.5'
                  } hidden group-hover/picker:flex z-50`}>
                  <div className='bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-lg p-1 flex gap-1 flex-nowrap'>
                    {['👍', '❤️', '😂', '😮', '🙏', '✅'].map((em) => (
                      <button
                        key={em}
                        onClick={() => onReact(em)}
                        className='w-6 h-6 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full flex items-center justify-center transition-transform hover:scale-125 text-sm'>
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}
