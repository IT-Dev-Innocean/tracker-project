import re

with open('src/ChatWorkspaceModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace lines 806 to 2013 with our new components
# Let's find the exact string boundaries to replace.
# Start boundary:
start_pattern = r'<div\s+className="flex flex-col h-full w-\[85vw\] sm:w-\[320px\] md:w-\[288px\]"'
start_match = re.search(start_pattern, content)
if not start_match:
    print("Start not found")
    exit(1)

# End boundary: The end of ChatInputArea is followed by:
# ) : (
#   <div className="flex-1 flex flex-col relative bg-neutral-50/50 dark:bg-neutral-900/30">
end_pattern = r'\s*\)\s*:\s*\(\s*<div className="flex-1 flex flex-col relative bg-neutral-50/50 dark:bg-neutral-900/30">'
end_match = re.search(end_pattern, content)
if not end_match:
    print("End not found")
    exit(1)

# Ensure the end match is after the start match
end_idx = end_match.start()
start_idx = start_match.start()

replacement = """
          <ChatSidebar
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            isDesktopSidebarOpen={isDesktopSidebarOpen}
            sidebarWidth={sidebarWidth}
            boards={boards}
            boardSearchQuery={boardSearchQuery}
            setBoardSearchQuery={setBoardSearchQuery}
            expandedBoards={expandedBoards}
            toggleBoard={() => {}}
            unreadBoardTotal={0}
            notifications={notifications}
            showUnreadFilter={showUnreadFilter}
            showMyTasksFilter={showMyTasksFilter}
            boardTasks={boardTasks}
            dmConversations={dmConversations}
            isNewDmOpen={isNewDmOpen}
            setIsNewDmOpen={setIsNewDmOpen}
            newDmSearch={newDmSearch}
            setNewDmSearch={setNewDmSearch}
            filteredUsers={userDirectory || []}
            newDmSearchIndex={newDmSearchIndex}
            handleNewDmSelect={() => {}}
            setDmConvToDelete={setDmConvToDelete}
            avatarsMap={avatarsMap}
            tMsg={tMsg}
          />

          {/* Resizer */}
          {isDesktopSidebarOpen && (
            <div
              className="hidden md:block w-1 cursor-col-resize hover:bg-indigo-500 transition-colors shrink-0 z-50 bg-transparent border-r border-neutral-200 dark:border-neutral-800"
              onMouseDown={startResizing}
            ></div>
          )}

          {/* Right Main Content */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-950 relative">
            {activeChat ? (
              activeChat.type === 'inbox' ? (
                <div className="flex-1 flex flex-col overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/30">
                  <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-between shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                            setIsDesktopSidebarOpen(true);
                          } else {
                            setIsMobileSidebarOpen(true);
                          }
                        }}
                        className={`p-2 -ml-2 mr-2 text-neutral-500 hover:text-black dark:hover:text-white transition-colors ${
                          isDesktopSidebarOpen ? 'md:hidden' : ''
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div>
                        <h2 className="text-lg sm:text-xl font-black text-black dark:text-white flex items-center gap-2">
                          <span className="hidden sm:inline">💬</span>{' '}
                          {tMsg('Inbox & Recent Activity', 'Kotak Masuk & Aktivitas Terbaru')}
                        </h2>
                        <p className="hidden sm:block text-xs text-neutral-500 font-medium mt-1">
                          {tMsg('Catch up on your latest conversations.', 'Ikuti percakapan terbaru Anda.')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsInboxLoading(true);
                        axios.get('/api/my-chats').then((res) => {
                          setInboxChats(res.data.chats || []);
                          setIsInboxLoading(false);
                        });
                      }}
                      className="text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white px-3 py-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      ↻ Refresh
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                    {isInboxLoading ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
                      </div>
                    ) : inboxChats.length === 0 ? (
                      <div className="text-center py-10 text-neutral-500">
                        <span className="text-4xl mb-4 block opacity-50">📭</span>
                        <p className="font-medium text-sm">No recent messages found.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-w-4xl mx-auto">
                        {inboxChats.map((chat) => {
                          let displayMessage = chat.latest_message || 'No message content';
                          const privMatch = displayMessage.match(/<!--PRIVATE:([\\w.-]+)-->/);
                          if (privMatch) {
                            if (privMatch[1] === currentUser) {
                              displayMessage = '🔒 ' + displayMessage.replace(/<!--PRIVATE:[\\w.-]+-->\\s*/, '');
                            } else {
                              displayMessage = '🔒 [Private Message]';
                            }
                          }
                          return (
                            <div
                              key={`${chat.is_dm ? 'dm-' + chat.partner_username : chat.task_id}-${chat.timestamp}`}
                              onClick={() => {
                                if (chat.is_dm) {
                                  setActiveChat({
                                    type: 'dm',
                                    id: chat.partner_username,
                                    name: chat.partner_username,
                                    partner: chat.partner_username,
                                  });
                                } else {
                                  setActiveChat({
                                    type: chat.is_project_chat ? 'project' : 'task',
                                    id: chat.is_project_chat ? chat.board_id : chat.task_id,
                                    name: chat.is_project_chat ? `${chat.board_name} (General)` : chat.project_name,
                                    board_id: chat.board_id,
                                  });
                                }
                              }}
                              className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-4 flex items-start gap-4 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
                            >
                              <div className="text-3xl mt-1 shrink-0">
                                {chat.is_dm ? '💬' : chat.is_project_chat ? '🏢' : '📋'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <h3 className="font-bold text-sm text-black dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                    {chat.is_dm
                                      ? tMsg(
                                          `Direct Message with @${chat.partner_username}`,
                                          `Pesan Pribadi dengan @${chat.partner_username}`
                                        )
                                      : chat.is_project_chat
                                      ? `Project Chat: ${chat.board_name}`
                                      : chat.project_name}
                                  </h3>
                                  <span className="text-[9px] font-bold text-neutral-400 shrink-0 ml-2 whitespace-nowrap">
                                    {formatDateMMM(chat.timestamp)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 mb-1.5">
                                  <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                                    {chat.is_dm ? 'DM' : chat.board_name}
                                  </span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                                    @{chat.latest_sender}:
                                  </span>
                                  <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                                    {displayMessage}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <ChatHeader
                    activeChat={activeChat}
                    isDesktopSidebarOpen={isDesktopSidebarOpen}
                    setIsDesktopSidebarOpen={setIsDesktopSidebarOpen}
                    setIsMobileSidebarOpen={setIsMobileSidebarOpen}
                    chatSearchQuery={chatSearchQuery}
                    setChatSearchQuery={setChatSearchQuery}
                    messages={messages}
                    avatarsMap={avatarsMap}
                    tMsg={tMsg}
                    formatDateMMM={formatDateMMM}
                    handleMeetNow={() => {}}
                    handleNotificationTaskClick={handleNotificationTaskClick}
                  />
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
                    <ChatMessageList
                      scrollContainerRef={scrollContainerRef}
                      handleScroll={() => {}}
                      isLoadingMessages={isLoadingMessages}
                      messages={messages}
                      hasMoreMessages={hasMoreMessages}
                      loadMoreMessages={() => {}}
                      tMsg={tMsg}
                      formatDateMMM={formatDateMMM}
                      currentUser={currentUser}
                      avatarsMap={avatarsMap}
                      firstUnreadId={firstUnreadId}
                      setReplyingTo={setReplyingTo}
                      deleteWorkspaceMessage={() => {}}
                      showNotification={showNotification}
                      toggleWorkspaceReaction={() => {}}
                      activeChat={activeChat}
                      isSuperAdmin={isSuperAdmin}
                      accountStatus={accountStatus}
                      isAiReplying={isAiReplying}
                      messagesEndRef={messagesEndRef}
                      latestMentionId={latestMentionId}
                      setDismissedMentions={setDismissedMentions}
                      setLatestMentionId={setLatestMentionId}
                      showScrollBottom={showScrollBottom}
                      setShowScrollBottom={setShowScrollBottom}
                    />
                  </div>
                  <ChatInputArea
                    activeChat={activeChat}
                    isSuperAdmin={isSuperAdmin}
                    accountStatus={accountStatus}
                    chatBg={chatBg}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    sendMessage={() => {}}
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    handleInputChange={() => {}}
                    boards={boards}
                    activeBoardMembers={activeBoardMembers}
                    isAiReplying={isAiReplying}
                    handleAskAITaskChat={handleAskAITaskChat}
                    messagesEndRef={messagesEndRef}
                    setMessages={setMessages}
                    currentUser={currentUser}
                    getLocalTimestamp={getLocalTimestamp}
                    isMentioning={isMentioning}
                    setIsMentioning={setIsMentioning}
                    mentionQuery={mentionQuery}
                    mentionIndex={mentionIndex}
                    setMentionIndex={setMentionIndex}
                    insertMention={() => {}}
                    tMsg={tMsg}
                  />
                </>
              )
            ) : (
              <div className="flex-1 flex flex-col relative bg-neutral-50/50 dark:bg-neutral-900/30">
"""

new_content = content[:start_idx] + replacement + content[end_idx+len(") : ("):]

with open('src/ChatWorkspaceModal.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Success')
