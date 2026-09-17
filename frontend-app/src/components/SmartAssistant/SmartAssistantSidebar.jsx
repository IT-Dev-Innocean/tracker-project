import React, { useEffect, useRef } from 'react';
import { Icon } from '../icons/Icon';

function formatUpdatedAt(value, tMsg) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return tMsg('Just now', 'Baru saja');
  if (diffMin < 60) return tMsg(`${diffMin}m ago`, `${diffMin} mnt lalu`);
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return tMsg(`${diffHr}h ago`, `${diffHr} jam lalu`);
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return tMsg(`${diffDay}d ago`, `${diffDay} hari lalu`);
  return date.toLocaleDateString();
}

export default function SmartAssistantSidebar({
  conversations = [],
  activeId,
  searchQuery,
  onSearchChange,
  isSearchOpen,
  onToggleSearch,
  onNewChat,
  onSelect,
  onDelete,
  isLoading,
  tMsg,
}) {
  const searchRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen) {
      searchRef.current?.focus();
    }
  }, [isSearchOpen]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3 space-y-1 shrink-0">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-black dark:text-white hover:bg-white dark:hover:bg-neutral-900 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 transition-colors"
        >
          <Icon name="plus" className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          {tMsg('New chat', 'Chat baru')}
        </button>
        <button
          type="button"
          onClick={onToggleSearch}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            isSearchOpen
              ? 'bg-white dark:bg-neutral-900 text-black dark:text-white border border-neutral-200 dark:border-neutral-800'
              : 'text-black dark:text-white hover:bg-white dark:hover:bg-neutral-900 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800'
          }`}
        >
          <Icon name="search" className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          {tMsg('Search chats', 'Cari chat')}
        </button>
        <button
          type="button"
          onClick={() => {
            if (searchQuery) onSearchChange('');
            if (isSearchOpen) onToggleSearch();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-black dark:text-white hover:bg-white dark:hover:bg-neutral-900 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 transition-colors"
        >
          <Icon name="clock" className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          {tMsg('Chat history', 'Riwayat chat')}
        </button>
      </div>

      {isSearchOpen && (
        <div className="px-3 pb-3 shrink-0">
          <div className="relative">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none"
            />
            <input
              ref={searchRef}
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={tMsg('Search chats...', 'Cari percakapan...')}
              className="w-full pl-8 pr-8 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-black dark:hover:text-white"
                aria-label={tMsg('Clear search', 'Hapus pencarian')}
              >
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="px-3 pb-2 shrink-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">
          {tMsg('Chat history', 'Riwayat chat')}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 pb-3 space-y-0.5">
        {isLoading && conversations.length === 0 ? (
          <p className="px-3 py-6 text-xs text-neutral-400 text-center">
            {tMsg('Loading history...', 'Memuat riwayat...')}
          </p>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-6 text-xs text-neutral-400 text-center">
            {searchQuery
              ? tMsg('No chats match that search.', 'Tidak ada chat yang cocok.')
              : tMsg('No chat history yet.', 'Belum ada riwayat chat.')}
          </p>
        ) : (
          conversations.map((conversation) => {
            const isActive = conversation.id === activeId;
            return (
              <div
                key={conversation.id}
                className={`group flex items-center gap-1 rounded-xl ${
                  isActive
                    ? 'bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200 dark:border-neutral-800'
                    : 'hover:bg-white/80 dark:hover:bg-neutral-900/80'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className="flex-1 min-w-0 text-left px-3 py-2.5"
                >
                  <p className="text-sm font-bold text-black dark:text-white truncate">
                    {conversation.title || tMsg('New chat', 'Chat baru')}
                  </p>
                  <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                    {conversation.preview || formatUpdatedAt(conversation.updated_at, tMsg)}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(conversation.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 mr-1 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
                  title={tMsg('Delete chat', 'Hapus chat')}
                  aria-label={tMsg('Delete chat', 'Hapus chat')}
                >
                  <Icon name="trash" className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
