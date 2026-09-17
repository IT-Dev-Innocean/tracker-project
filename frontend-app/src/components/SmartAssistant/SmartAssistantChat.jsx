import React from 'react';
import { renderChatMessageContent } from '../../ChatMessage';
import { LoadingSpinner } from '../../Utils';
import { Icon } from '../icons/Icon';
import AssistantWelcome from './AssistantWelcome';
import AssistantRecommendations from './AssistantRecommendations';

const INPUT_MIN_HEIGHT = 96;

export default function SmartAssistantChat({
  messages,
  tMsg,
  language,
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
  recommendations = [],
}) {
  const hasMessages = messages.some((msg) => msg.sender === 'user' || msg.sender === 'bot');
  const resetInputHeight = (textarea) => {
    if (!textarea) return;
    textarea.style.height = `${INPUT_MIN_HEIGHT}px`;
  };

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
        .assistant-prose strong {
          font-weight: 700;
        }
        .assistant-prose a {
          color: inherit;
        }
      `}</style>
      <div className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
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

        <div
          ref={scrollContainerRef}
          className={`flex-1 overflow-y-auto custom-scrollbar relative z-10 ${
            hasMessages ? 'px-5 py-6 space-y-6' : 'p-5 flex flex-col'
          }`}
        >
          {!hasMessages && (
            <div className="flex-1 flex items-center justify-center min-h-0">
              <AssistantWelcome currentUser={currentUser} tMsg={tMsg} />
            </div>
          )}
          {messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-2 chat-animate">
                  <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                </div>
              );
            }

            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="flex justify-end chat-animate">
                  <div className="max-w-[85%] rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-black dark:text-white px-4 py-2.5 text-sm leading-relaxed">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: renderChatMessageContent(msg.text, true),
                      }}
                    />
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className="w-full chat-animate">
                <div
                  className="w-full text-[15px] leading-7 text-black dark:text-neutral-100 assistant-prose"
                  dangerouslySetInnerHTML={{
                    __html: renderChatMessageContent(msg.text, false),
                  }}
                />
                {msg.options && msg.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
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
              </div>
            );
          })}

          {step === 'taking_notes' && (
            <div className="sticky bottom-2 w-full flex justify-end gap-2 pointer-events-none mt-4 z-50">
              <button
                onClick={() => handleUserReply(optCancel)}
                className="bg-white dark:bg-neutral-800 text-red-500 border border-red-200 dark:border-red-900/50 px-4 py-3.5 rounded-full shadow-lg font-bold uppercase tracking-widest text-[10px] hover:bg-red-50 dark:hover:bg-red-900/30 transition-all pointer-events-auto"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleUserReply(tMsg('Process Notes', 'Proses Catatan'))}
                className="bg-emerald-600 text-white px-5 py-3.5 rounded-full shadow-[0_10px_20px_rgba(16,185,129,0.3)] font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 hover:scale-105 transition-all pointer-events-auto flex items-center gap-2"
              >
                <Icon name="settings" className="w-3.5 h-3.5 inline-block mr-1" /> {tMsg('Process Notes', 'Proses Catatan')}
              </button>
            </div>
          )}

          {hasMessages && <div ref={messagesEndRef} className="h-8 shrink-0" />}
          {!hasMessages && <div ref={messagesEndRef} />}
        </div>
      </div>

      <div className="px-4 pb-3 pt-2 bg-transparent relative z-20 shrink-0">
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
        {!hasMessages && (
          <AssistantRecommendations
            recommendations={recommendations}
            onSelect={(prompt) => handleUserReply(prompt, { stayInChat: true })}
          />
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUserReply(inputValue);
            resetInputHeight(e.target.querySelector('textarea'));
          }}
          className="relative"
        >
          {currentBotMessage?.isDate ? (
            <input
              type="date"
              value={inputValue}
              onChange={handleInputChange}
              className="w-full p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl text-sm font-medium text-black dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50 shadow-sm"
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
                  resetInputHeight(e.target);
                }
              }}
              placeholder={language === 'id' ? 'Ketik pesan...' : 'Type a message...'}
              className="w-full py-4 px-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl text-sm font-medium text-black dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50 resize-none max-h-[300px] custom-scrollbar shadow-sm"
              style={{ minHeight: `${INPUT_MIN_HEIGHT}px` }}
              rows="3"
              onInput={(e) => {
                e.target.style.height = `${INPUT_MIN_HEIGHT}px`;
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
        </form>
        <p className="mt-2 text-center text-[11px] text-neutral-400 px-2">
          {tMsg(
            'AI can be wrong. Double-check tasks, deadlines, and assignments before acting.',
            'AI dapat keliru. Periksa ulang tugas, deadline, dan penugasan sebelum ditindaklanjuti.'
          )}
        </p>
      </div>

      {renderDiscardModal()}
    </div>
  );
}
