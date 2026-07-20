import React from 'react';
import ChatMessage from '../../ChatMessage';
import { LoadingSpinner } from '../../Utils';

export default function SmartAssistantChat({
  messages,
  setDiscardConfirmAction,
  setMessages,
  setAssistantMode,
  tMsg,
  selectedModel,
  setSelectedModel,
  language,
  aiProvider,
  startConversation,
  chatBg,
  scrollContainerRef,
  currentUser,
  getLocalTimestamp,
  avatarsMap,
  showNotification,
  handleUserReply,
  step,
  currentBotMessage,
  optCancel,
  noteSuggestions,
  setInputValue,
  inputValue,
  handleInputChange,
  isMentioning,
  globalMentionOptions,
  mentionQuery,
  mentionIndex,
  setMentionIndex,
  insertMention,
  setIsMentioning,
  accountStatus,
  teamMembers,
  messagesEndRef,
  renderDiscardModal,
}) {
  return (
    <div className="flex-1 flex flex-col w-full h-full bg-white dark:bg-neutral-950 relative z-20">
      <style>{`
        @keyframes chat-bubble-up {
          0% { opacity: 0; transform: translateY(15px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-animate {
          animation: chat-bubble-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex justify-between items-center shrink-0">
        <button
          onClick={() => {
            if (messages.length > 2) {
              setDiscardConfirmAction(() => () => {
                setMessages([]);
                setAssistantMode('landing');
              });
              return;
            }
            setMessages([]);
            setAssistantMode('landing');
          }}
          className="text-[10px] font-bold text-neutral-400 hover:text-black dark:hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1 w-16"
        >
          ◀ {tMsg('Menu', 'Menu')}
        </button>
        <div className="flex items-center gap-2 flex-1 justify-center">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-transparent border-none p-0 pr-4 focus:ring-0 cursor-pointer outline-none hover:opacity-80 transition-opacity [&>option]:bg-white dark:[&>option]:bg-neutral-900 [&>option]:text-black dark:[&>option]:text-white"
            title={language === 'id' ? 'Pilih Model AI' : 'Select AI Model'}
          >
            <option value="auto">✨ {aiProvider === 'Smart Assistant' ? 'AUTO AI' : aiProvider.toUpperCase()}</option>
            <option value="gemini">⚡ GOOGLE GEMINI</option>
            <option value="llama">🧠 GPT-OSS 120B</option>
          </select>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest hidden sm:block">
            • {tMsg('Your Private AI', 'AI Pribadi Anda')}
          </p>
        </div>
        <button
          onClick={() => {
            if (messages.length > 2) {
              setDiscardConfirmAction(() => () => {
                startConversation();
              });
              return;
            }
            startConversation();
          }}
          className="text-[10px] font-bold text-neutral-400 hover:text-black dark:hover:text-white uppercase tracking-widest transition-colors flex items-center justify-end gap-1 w-16"
        >
          {tMsg('Reset', 'Ulang')} ↻
        </button>
      </div>

      <div className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
        {/* Static Background Layer */}
        {chatBg && (
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={
              chatBg.startsWith('data:image')
                ? { backgroundImage: `url(${chatBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: chatBg }
            }
          />
        )}
        {chatBg && (
          <div className="absolute inset-0 bg-white/40 dark:bg-black/60 backdrop-blur-[2px] z-0 pointer-events-none"></div>
        )}

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar relative z-10">
          {messages.map((msg, index, arr) => {
            if (msg.sender === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-4 chat-animate">
                  <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                </div>
              );
            }

            const isMe = msg.sender === 'user';
            const chatMsgData = {
              id: msg.id,
              username: isMe ? currentUser : 'Smart Assistant 🤖',
              text: msg.text,
              timestamp: msg.timestamp || getLocalTimestamp(),
              reactions: {},
            };

            const currDate = new Date(chatMsgData.timestamp.replace(/-/g, '/')).toDateString();
            const prevDate =
              index > 0
                ? new Date((arr[index - 1].timestamp || getLocalTimestamp()).replace(/-/g, '/')).toDateString()
                : null;
            const showDivider = currDate !== prevDate;
            let dividerDisplay = '';
            if (showDivider) {
              const today = new Date().toDateString();
              const yesterday = new Date(Date.now() - 86400000).toDateString();
              if (currDate === today) dividerDisplay = tMsg('Today', 'Hari Ini');
              else if (currDate === yesterday) dividerDisplay = tMsg('Yesterday', 'Kemarin');
              else dividerDisplay = chatMsgData.timestamp.split(' ')[0];
            }

            return (
              <ChatMessage
                key={msg.id}
                message={chatMsgData}
                currentUser={currentUser}
                avatarsMap={{ ...avatarsMap, 'Smart Assistant 🤖': '' }}
                showDivider={showDivider}
                dividerDisplay={dividerDisplay}
                isFirstUnread={false}
                onReply={() => {}}
                onDelete={() => {}}
                onCopy={() => {
                  let cleanText = msg.text
                    .replace(/<[^>]*>?/gm, '')
                    .replace(/\*\*(.*?)\*\*/g, '$1')
                    .replace(/\*(.*?)\*/g, '$1');
                  const temp = document.createElement('textarea');
                  temp.innerHTML = cleanText;
                  navigator.clipboard.writeText(temp.value.trim());
                  showNotification(tMsg('Copied to clipboard!', 'Disalin ke papan klip!'), 'info');
                }}
                onReact={() => {}}
                canReply={false}
                canDelete={false}
                canReact={false}
                idPrefix="ai-msg-"
                tMsg={tMsg}
              >
                {msg.options && msg.sender === 'bot' && msg.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-indigo-200/30 dark:border-neutral-700/50">
                    {msg.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleUserReply(opt)}
                        disabled={step === 'end' && currentBotMessage?.id !== msg.id}
                        className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700 text-black dark:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors disabled:opacity-50"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </ChatMessage>
            );
          })}

          {step === 'taking_notes' && (
            <div className="sticky bottom-2 w-full flex justify-end gap-2 pointer-events-none mt-4 z-50">
              <button
                onClick={() => handleUserReply(optCancel)}
                className="bg-white dark:bg-neutral-800 text-red-500 border border-red-200 dark:border-red-900/50 px-4 py-3.5 rounded-full shadow-lg font-bold uppercase tracking-widest text-[10px] hover:bg-red-50 dark:hover:bg-red-900/30 transition-all pointer-events-auto"
              >
                ✖
              </button>
              <button
                onClick={() => handleUserReply(tMsg('Process Notes', 'Proses Catatan'))}
                className="bg-emerald-600 text-white px-5 py-3.5 rounded-full shadow-[0_10px_20px_rgba(16,185,129,0.3)] font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 hover:scale-105 transition-all pointer-events-auto flex items-center gap-2"
              >
                <span>⚙️</span> {tMsg('Process Notes', 'Proses Catatan')}
              </button>
            </div>
          )}

          <div ref={messagesEndRef} className="h-32 shrink-0" />
        </div>
      </div>

      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl shrink-0 relative z-20">
        {step === 'taking_notes' && noteSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 max-h-24 overflow-y-auto custom-scrollbar items-end">
            {noteSuggestions.map((s) =>
              s.id === 'loading' ? (
                <span key={s.id} className="text-[10px] text-neutral-400 italic flex items-center gap-1.5 py-1 px-2">
                  <LoadingSpinner /> {s.text}
                </span>
              ) : (
                <button
                  key={s.id}
                  onClick={() => {
                    setInputValue(s.text);
                    document.getElementById('ai-chat-input')?.focus();
                  }}
                  className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400 text-[11px] font-medium px-3 py-1.5 rounded-xl text-left hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-sm"
                >
                  {s.text}
                </button>
              )
            )}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUserReply(inputValue);
            const ta = e.target.querySelector('textarea');
            if (ta) ta.style.height = '44px';
          }}
          className="flex gap-2 relative items-end"
        >
          {currentBotMessage?.isDate ? (
            <input
              type="date"
              value={inputValue}
              onChange={handleInputChange}
              className="flex-1 p-3.5 bg-neutral-100 dark:bg-neutral-900 border border-transparent rounded-xl text-sm font-medium text-black dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
              autoFocus
            />
          ) : (
            <textarea
              id="ai-chat-input"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (isMentioning) {
                  const allOptions = [...globalMentionOptions];
                  const filteredOptions = allOptions.filter((m) => m.toLowerCase().includes(mentionQuery));
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setMentionIndex((prev) => (prev + 1) % (filteredOptions.length || 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setMentionIndex((prev) => (prev - 1 + filteredOptions.length) % (filteredOptions.length || 1));
                  } else if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    if (filteredOptions.length > 0) insertMention(filteredOptions[mentionIndex] || filteredOptions[0]);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsMentioning(false);
                  }
                } else if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleUserReply(inputValue);
                  e.target.style.height = '44px';
                }
              }}
              placeholder={language === 'id' ? 'Ketik pesan...' : 'Type a message...'}
              className="flex-1 py-3 px-4 bg-neutral-100 dark:bg-neutral-900 border border-transparent rounded-xl text-sm font-medium text-black dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50 resize-none max-h-[300px] custom-scrollbar"
              style={{ minHeight: '44px' }}
              rows="1"
              onInput={(e) => {
                e.target.style.height = '44px';
                e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
              }}
              autoFocus
            />
          )}
          {isMentioning && accountStatus !== 'suspended' && (
            <div className="absolute left-0 bottom-full mb-2 w-full min-w-[200px] bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl z-50 max-h-40 overflow-y-auto py-2 mac-animate">
              {(() => {
                const allOptions = [...globalMentionOptions];
                const filteredOptions = allOptions.filter((m) => m.toLowerCase().includes(mentionQuery));
                if (filteredOptions.length > 0) {
                  return filteredOptions.map((m, idx) => (
                    <div
                      key={m}
                      className={`px-4 py-2.5 cursor-pointer text-sm text-black dark:text-white font-medium border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 flex items-center gap-2 ${
                        mentionIndex === idx
                          ? 'bg-neutral-100 dark:bg-neutral-800'
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                      onClick={() => insertMention(m)}
                    >
                      <span>@{m}</span>
                      {!teamMembers.includes(m) && (
                        <span className="text-[8px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest ml-auto">
                          + Auto-Invite
                        </span>
                      )}
                    </div>
                  ));
                }
                return (
                  <div className="px-4 py-3 text-sm text-neutral-500 italic">
                    {tMsg('No members found', 'Tidak ada anggota ditemukan')}
                  </div>
                );
              })()}
            </div>
          )}
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="w-12 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              ></path>
            </svg>
          </button>
        </form>
      </div>

      {renderDiscardModal()}
    </div>
  );
}
