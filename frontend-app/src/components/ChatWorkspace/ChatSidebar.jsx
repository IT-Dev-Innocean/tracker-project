import React from 'react';
import axios from 'axios';
import { HighlightText } from '../../Utils';
import { Avatar } from '../../SharedUI';

export default function ChatSidebar({
  activeChat,
  setActiveChat,
  isDesktopSidebarOpen,
  sidebarWidth,
  boards,
  boardSearchQuery,
  setBoardSearchQuery,
  expandedBoards,
  toggleBoard,
  unreadBoardTotal,
  notifications,
  showUnreadFilter,
  setShowUnreadFilter,
  showMyTasksFilter,
  setShowMyTasksFilter,
  handleExpandAll,
  handleCollapseAll,
  boardTasks,
  dmConversations,
  isNewDmOpen,
  setIsNewDmOpen,
  newDmSearch,
  setNewDmSearch,
  filteredUsers,
  newDmSearchIndex,
  handleNewDmSelect,
  setDmConvToDelete,
  avatarsMap,
  tMsg,
  inboxChats,
  currentUser,
  tasks,
}) {
  const unreadInboxChatsCount = React.useMemo(() => {
    return (inboxChats || []).filter(chat => {
      if (chat.latest_sender === currentUser) return false;
      if (chat.is_dm) return (chat.unread_count || 0) > 0;
      if (chat.is_project_chat) {
        const lastRead = localStorage.getItem(`innocean_last_read_board_${chat.board_id}_${currentUser}`);
        const hasUnreadNotification = (notifications || []).some(
          n => !n.is_read && String(n.related_task_id) === String(chat.board_id) && 
          (n.type === 'team_chat' || n.type === 'team_chat_no_email' || n.type === 'mention' || n.type === 'mention_no_email')
        );
        if (!lastRead) return true;
        return chat.timestamp > lastRead || hasUnreadNotification;
      } else {
        const lastRead = localStorage.getItem(`innocean_last_read_task_${chat.task_id}_${currentUser}`);
        const hasUnreadNotification = (notifications || []).some(
          n => !n.is_read && String(n.related_task_id) === String(chat.task_id) && 
          (n.type === 'comment' || n.type === 'mention' || n.type === 'mention_no_email')
        );
        if (!lastRead) return true;
        return chat.timestamp > lastRead || hasUnreadNotification;
      }
    }).length;
  }, [inboxChats, notifications, currentUser]);

  const availableDmUsers = React.useMemo(() => {
    return (filteredUsers || []).filter(
      (u) => u.username !== currentUser && u.username !== 'admin' && u.is_connected
    );
  }, [filteredUsers, currentUser]);

  return (
    <div
      className={`bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-full transition-all duration-300 ease-in-out ${
        isDesktopSidebarOpen ? 'w-[288px]' : 'w-0 overflow-hidden border-r-0'
      }`}
      style={isDesktopSidebarOpen ? { width: sidebarWidth } : {}}
    >
      {/* Search & Filters */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <h3 className="font-black text-lg text-black dark:text-white mb-3">💬 Workspace</h3>
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">🔍</span>
          <input
            type="text"
            placeholder={tMsg('Search workspace...', 'Cari ruang kerja...')}
            value={boardSearchQuery}
            onChange={(e) => setBoardSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 bg-neutral-100 dark:bg-neutral-800 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-900 rounded-lg text-sm transition-all outline-none"
          />
          {boardSearchQuery && (
            <button
              onClick={() => setBoardSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black dark:hover:text-white p-1 font-bold text-xs"
            >
              ✖
            </button>
          )}

          {/* Global Search Popup Overlay */}
          {boardSearchQuery.trim() && (() => {
            const keywords = boardSearchQuery.toLowerCase().split(/\s+/).filter(Boolean);
            if (keywords.length === 0) return null;
            
            // 1. Filter Projects (Boards)
            const matchingBoards = (boards || [])
              .filter(b => {
                if (b.id === 'global') return false;
                const combined = b.name.toLowerCase();
                return keywords.every(kw => combined.includes(kw));
              })
              .slice(0, 5);

            // 2. Filter Tasks
            const matchingTasks = (tasks || [])
              .filter(t => {
                const combined = (t.project_name || '').toLowerCase();
                return keywords.every(kw => combined.includes(kw));
              })
              .slice(0, 5);

            // 3. Filter Chat Messages (from recent inboxChats)
            const matchingChats = (inboxChats || [])
              .filter(c => {
                const combined = [c.latest_message || '', c.latest_sender || ''].join(' ').toLowerCase();
                return keywords.every(kw => combined.includes(kw));
              })
              .slice(0, 5);

            // 4. Filter Users (Workspace directory for new DMs)
            const matchingUsers = (availableDmUsers || [])
              .filter(u => {
                const combined = u.username.toLowerCase();
                return keywords.every(kw => combined.includes(kw));
              })
              .slice(0, 5);

            const hasAnyResult = matchingBoards.length > 0 || matchingTasks.length > 0 || matchingChats.length > 0 || matchingUsers.length > 0;

            return (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-xl z-50 max-h-87.5 overflow-y-auto custom-scrollbar p-2 space-y-3">
                
                {/* Projects Category */}
                {matchingBoards.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest px-2 mb-1 flex items-center justify-between">
                      <span>📁 {tMsg('Projects', 'Proyek')}</span>
                      <span className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-[8px]">{matchingBoards.length}</span>
                    </div>
                    {matchingBoards.map(b => (
                      <button
                        key={`global-search-proj-${b.id}`}
                        onClick={() => {
                          setActiveChat({ type: 'project', id: b.id, name: `${b.name} (General)`, board_id: b.id });
                          setBoardSearchQuery('');
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
                      >
                        <span className="text-neutral-400">🏢</span>
                        <span className="truncate flex-1">
                          <HighlightText text={b.name} query={boardSearchQuery} />
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tasks Category */}
                {matchingTasks.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest px-2 mb-1 flex items-center justify-between">
                      <span>📋 {tMsg('Tasks', 'Tugas')}</span>
                      <span className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-[8px]">{matchingTasks.length}</span>
                    </div>
                    {matchingTasks.map(t => (
                      <button
                        key={`global-search-task-${t.id}`}
                        onClick={() => {
                          setActiveChat({ type: 'task', id: t.id, name: t.project_name, board_id: t.board_id, is_involved: t.is_involved });
                          setBoardSearchQuery('');
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
                      >
                        <span className="text-neutral-400">📋</span>
                        <span className="truncate flex-1">
                          <HighlightText text={t.project_name} query={boardSearchQuery} />
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Chat Messages Category */}
                {matchingChats.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest px-2 mb-1 flex items-center justify-between">
                      <span>💬 {tMsg('Chats', 'Obrolan')}</span>
                      <span className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-[8px]">{matchingChats.length}</span>
                    </div>
                    {matchingChats.map(c => {
                      let displayName = '';
                      if (c.is_dm) {
                        displayName = `@${c.partner_username}`;
                      } else if (c.is_project_chat) {
                        displayName = c.board_name;
                      } else {
                        displayName = c.project_name;
                      }
                      return (
                        <button
                          key={`global-search-msg-${c.timestamp}-${c.latest_sender}`}
                          onClick={() => {
                            if (c.is_dm) {
                              setActiveChat({ type: 'dm', id: c.partner_username, name: c.partner_username, partner: c.partner_username });
                            } else {
                              setActiveChat({
                                type: c.is_project_chat ? 'project' : 'task',
                                id: c.is_project_chat ? c.board_id : c.task_id,
                                name: c.is_project_chat ? `${c.board_name} (General)` : c.project_name,
                                board_id: c.board_id,
                              });
                            }
                            setBoardSearchQuery('');
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex flex-col gap-0.5 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-37.5">
                              @<HighlightText text={c.latest_sender} query={boardSearchQuery} /> &middot; <HighlightText text={displayName} query={boardSearchQuery} />
                            </span>
                            <span className="text-[8px] bg-neutral-100 dark:bg-neutral-800 px-1 rounded text-neutral-400 font-medium">
                              {c.is_dm ? 'DM' : c.is_project_chat ? 'General' : 'Task'}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-600 dark:text-neutral-300 line-clamp-1 leading-normal italic">
                            "<HighlightText text={c.latest_message} query={boardSearchQuery} />"
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Users Category */}
                {matchingUsers.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest px-2 mb-1 flex items-center justify-between">
                      <span>👤 {tMsg('Users', 'Pengguna')}</span>
                      <span className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-[8px]">{matchingUsers.length}</span>
                    </div>
                    {matchingUsers.map(u => (
                      <button
                        key={`global-search-user-${u.username}`}
                        onClick={() => {
                          handleNewDmSelect(u);
                          setBoardSearchQuery('');
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
                      >
                        <Avatar name={u.username} url={avatarsMap[u.username]} size="w-4 h-4" />
                        <span className="truncate flex-1">
                          @<HighlightText text={u.username} query={boardSearchQuery} />
                        </span>
                        <span className="text-[8px] bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded text-indigo-500 font-bold shrink-0 font-sans">
                          Message
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {!hasAnyResult && (
                  <div className="p-4 text-center text-xs font-bold text-neutral-500">
                    📭 {tMsg('No search results found.', 'Tidak ada hasil pencarian.')}
                  </div>
                )}

              </div>
            );
          })()}
        </div>
        <div className="space-y-2">
          <button
            onClick={() => setActiveChat({ type: 'inbox', id: 'inbox', name: 'Inbox' })}
            className={`w-full py-1.5 px-2 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1.5 relative ${
              activeChat?.type === 'inbox'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-350 dark:hover:bg-neutral-750'
            }`}
          >
            📭 Inbox
            {unreadInboxChatsCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black leading-none shrink-0 scale-90">
                {unreadInboxChatsCount}
              </span>
            )}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMyTasksFilter(!showMyTasksFilter)}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
                showMyTasksFilter
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
              }`}
              title={tMsg('My Tasks', 'Tugas Saya')}
            >
              👤 {tMsg('My Tasks', 'Tugas Saya')}
            </button>
            <button
              onClick={() => setShowUnreadFilter(!showUnreadFilter)}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
                showUnreadFilter
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
              }`}
              title={tMsg('Unread', 'Belum Dibaca')}
            >
              🔔 {tMsg('Unread', 'Belum Dibaca')}
            </button>
          </div>
        </div>
      </div>

      {/* Boards & Tasks */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <div className="mb-2 px-2 flex justify-between items-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
          <span>{tMsg('Projects & Tasks', 'Proyek & Tugas')}</span>
          <div className="flex gap-2">
            <button
              onClick={handleExpandAll}
              className="hover:text-black dark:hover:text-white transition-colors text-xs font-black"
              title={tMsg('Expand All', 'Buka Semua')}
            >
              ⊞
            </button>
            <button
              onClick={handleCollapseAll}
              className="hover:text-black dark:hover:text-white transition-colors text-xs font-black"
              title={tMsg('Collapse All', 'Tutup Semua')}
            >
              ⊟
            </button>
          </div>
        </div>
        {boards
          .filter((b) => b.id !== 'global')
          .map((board) => {
            const unreadBoardTotal = notifications?.filter(
              (n) => !n.is_read && String(n.board_id) === String(board.id)
            ).length || 0;

            return (
              <div key={`tree-board-${board.id}`} className="mb-1 border-b border-neutral-100 dark:border-neutral-800/50 pb-1 last:border-0">
                <button
                  onClick={() => toggleBoard(board.id)}
                  className="w-full text-left flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors group"
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1 text-left">
                    <span className="w-4 h-4 flex items-center justify-center text-neutral-400 group-hover:text-black dark:group-hover:text-white shrink-0 transition-colors">
                      {expandedBoards[board.id] ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                      )}
                    </span>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate flex-1" title={board.name}>
                      {board.name}
                    </span>
                  </div>
                  {unreadBoardTotal > 0 && (
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm shrink-0 animate-pulse ml-2">
                      {unreadBoardTotal}
                    </span>
                  )}
                </button>
                {expandedBoards[board.id] && (
                  <div className="pl-6 pr-2 mt-1 space-y-0.5">
                    {!board.is_private && (() => {
                      const unreadProj = notifications?.filter(
                        (n) => !n.is_read && (n.type === 'team_chat' || n.type === 'team_chat_no_email') && String(n.related_task_id) === String(board.id)
                      ).length || 0;
                      if (showUnreadFilter && unreadProj === 0) return null;
                      if (showMyTasksFilter && !showUnreadFilter && unreadProj === 0) return null;

                      return (
                        <button
                          onClick={() => setActiveChat({ type: 'project', id: board.id, name: `${board.name} (General)`, board_id: board.id })}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${
                            activeChat?.type === 'project' && activeChat?.id === board.id
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <span className="truncate flex-1">🏢 General Chat</span>
                          {unreadProj > 0 && (
                            <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-md shadow-sm shrink-0 animate-pulse ml-2">
                              {unreadProj}
                            </span>
                          )}
                        </button>
                      );
                    })()}

                    {(boardTasks[board.id] || []).filter((t) => {
                      if (showMyTasksFilter && !t.is_involved) return false;
                      if (showUnreadFilter) {
                        // Match ANY unread notification for this task (consistent with board badge)
                        const unreadTask = notifications?.filter(
                          (n) => !n.is_read && String(n.related_task_id) === String(t.id)
                        ).length || 0;
                        if (unreadTask === 0) return false;
                      }
                      return true;
                    }).map((t) => {
                      const unreadTask = notifications?.filter(
                        (n) => !n.is_read && String(n.related_task_id) === String(t.id)
                      ).length || 0;
                      return (
                        <button
                          key={`tree-task-${t.id}`}
                          onClick={() => setActiveChat({ type: 'task', id: t.id, name: t.project_name, board_id: board.id, is_involved: t.is_involved })}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                            activeChat?.type === 'task' && activeChat?.id === t.id
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <span className="truncate flex-1 flex items-center gap-1.5">
                            <span className="text-[10px] opacity-70">📋</span>
                            {t.project_name}
                          </span>
                          {unreadTask > 0 && (
                            <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-md shadow-sm shrink-0 animate-pulse ml-2">
                              {unreadTask}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Direct Messages Section */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-neutral-500">Direct Messages</h3>
          <button
            onClick={() => setIsNewDmOpen(!isNewDmOpen)}
            className="text-xs font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-indigo-500 hover:text-white px-2 py-0.5 rounded transition-colors"
          >
            + New
          </button>
        </div>
        {isNewDmOpen && (
          <div className="mb-3 relative">
            <input
              type="text"
              autoFocus
              placeholder="Search user..."
              value={newDmSearch}
              onChange={(e) => { setNewDmSearch(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); /* handle nav */ }
                if (e.key === 'ArrowUp') { e.preventDefault(); /* handle nav */ }
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const matches = availableDmUsers.filter(u =>
                    u.username.toLowerCase().includes(newDmSearch.toLowerCase())
                  );
                  if (matches.length > 0) {
                    handleNewDmSelect(matches[newDmSearchIndex] || matches[0]);
                  }
                }
              }}
              className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-1 px-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            {newDmSearch && (() => {
              const matches = availableDmUsers.filter(u =>
                u.username.toLowerCase().includes(newDmSearch.toLowerCase())
              );
              return (
                <div className="absolute left-0 right-0 bottom-full mb-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
                  {matches.map((u, idx) => (
                    <button
                      key={u.username}
                      onClick={() => handleNewDmSelect(u)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 ${
                        idx === newDmSearchIndex ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                      }`}
                    >
                      <Avatar name={u.username} url={avatarsMap[u.username]} size="w-5 h-5" />
                      <span>@{u.username}</span>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
        <div className="space-y-0.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
          {dmConversations.map((dm) => (
            <div key={`dm-sidebar-${dm.partner}`} className="flex items-center group">
              <button
                onClick={() => setActiveChat({ type: 'dm', id: dm.partner, name: dm.partner, partner: dm.partner })}
                className={`flex-1 text-left px-2 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
                  activeChat?.type === 'dm' && activeChat?.id === dm.partner
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                <Avatar name={dm.partner} url={avatarsMap[dm.partner]} size="w-5 h-5" />
                <span className="truncate flex-1">@{dm.partner}</span>
                {dm.unread_count > 0 && (
                  <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-md shadow-sm shrink-0">
                    {dm.unread_count}
                  </span>
                )}
              </button>
              <button
                onClick={() => setDmConvToDelete(dm.partner)}
                className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 p-1 transition-opacity"
                title="Delete conversation"
              >
                ✖
              </button>
            </div>
          ))}
          {/* Inline matching users search results section has been removed to keep background lists clean */}
        </div>
      </div>
    </div>
  );
}
