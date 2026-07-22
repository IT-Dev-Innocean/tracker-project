import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Avatar } from './SharedUI';
import { HighlightText, stripHtml, useCloseAnimation } from './Utils';
import ChatMessage from './ChatMessage';
import ChatSidebar from './components/ChatWorkspace/ChatSidebar';
import ChatHeader from './components/ChatWorkspace/ChatHeader';
import ChatMessageList from './components/ChatWorkspace/ChatMessageList';
import ChatInputArea from './components/ChatWorkspace/ChatInputArea';
export default function ChatWorkspaceModal({
  setIsChatWorkspaceOpen,
  boards,
  tasks,
  avatarsMap,
  currentUser,
  formatDateMMM,
  language,
  handleAskAITaskChat,
  handleToggleReaction,
  handleDeleteComment,
  deleteProjectChatMessage,
  showNotification,
  accountStatus,
  isAiReplying,
  setSelectedTask,
  isSuperAdmin,
  notifications,
  handleNotificationTaskClick,
  handleReadNotification,
  userDirectory,
  dmConversations,
  setDmConversations,
  fetchDmConversations,
  chatBg,
  workspaceChatTarget,
  setWorkspaceChatTarget,
  inboxChats,
  isInboxLoading,
  fetchInboxChats,
  handleMarkAllInboxAsRead,
  children,
}) {
  const [isClosing, close] = useCloseAnimation(() => {
    setIsChatWorkspaceOpen(false);
    if (setSelectedTask) setSelectedTask(null); // Bersihkan state agar tidak muncul sebagai modal penuh setelah ditutup
  });
  const tMsg = (en, id) => (language === 'id' ? id : en);

  const [boardSearchQuery, setBoardSearchQuery] = useState('');
  const [expandedBoards, setExpandedBoards] = useState({});
  const [boardTasks, setBoardTasks] = useState({});
  const [activeChat, setActiveChat] = useState(null); // { type: 'project' | 'task', id: number, name: string, board_id: number }

  useEffect(() => {
    if (workspaceChatTarget) {
      setActiveChat(workspaceChatTarget);
      setWorkspaceChatTarget(null);
    }
  }, [workspaceChatTarget, setWorkspaceChatTarget]);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const messagesEndRef = React.useRef(null);
  const scrollContainerRef = React.useRef(null);

  // Advanced Chat Features
  const [replyingTo, setReplyingTo] = useState(null);
  const [isMentioning, setIsMentioning] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [msgToDelete, setMsgToDelete] = useState(null);
  const [activeBoardMembers, setActiveBoardMembers] = useState([]);

  // Filters State
  const [showMyTasksFilter, setShowMyTasksFilter] = useState(false);
  const [showUnreadFilter, setShowUnreadFilter] = useState(false);

  // Inbox State - lifted globally

  // DM State
  const [isNewDmOpen, setIsNewDmOpen] = useState(false);
  const [newDmSearch, setNewDmSearch] = useState('');
  const [newDmSearchIndex, setNewDmSearchIndex] = useState(0);
  const [dmConvToDelete, setDmConvToDelete] = useState(null);

  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(!activeChat);
  useEffect(() => {
    if (activeChat) setIsMobileSidebarOpen(false);
  }, [activeChat?.id, activeChat?.type]);

  useEffect(() => {
    fetchDmConversations();
    fetchInboxChats();
  }, []);

  useEffect(() => {
    if (activeChat?.type === 'inbox') {
      fetchInboxChats();
    }
  }, [activeChat?.type]);

  useEffect(() => {
    if (activeChat && activeChat.board_id) {
      if (activeChat.board_id === 'global') return;
      axios
        .get(`/api/boards/${activeChat.board_id}/members`)
        .then((res) => setActiveBoardMembers(res.data.members || []))
        .catch(console.error);
    }
  }, [activeChat?.board_id]);

  // Auto-refresh expanded boards when tasks are deleted/updated globally
  useEffect(() => {
    if (tasks && boards) {
      Object.keys(expandedBoards).forEach((boardId) => {
        if (expandedBoards[boardId] && boardId !== 'global' && boardId !== 'undefined') {
          axios
            .get(`/api/boards/${boardId}/tasks/light`)
            .then((res) => {
              setBoardTasks((prev) => ({ ...prev, [boardId]: res.data.tasks || [] }));
            })
            .catch(() => {});
        }
      });
    }
  }, [tasks]);

  // Auto-close active chat and return to Inbox if task was deleted
  useEffect(() => {
    if (activeChat?.type === 'task' && activeChat.board_id) {
      const bTasks = boardTasks[activeChat.board_id];
      if (bTasks && !bTasks.some((t) => String(t.id) === String(activeChat.id))) {
        setActiveChat({ type: 'inbox', id: 'inbox', name: 'Inbox' });
        if (showNotification)
          showNotification(tMsg('Task was deleted or moved.', 'Tugas telah dihapus atau dipindahkan.'), 'info');
      }
    }
  }, [boardTasks, activeChat]);

  const padTime = (n) => String(n).padStart(2, '0');
  const getLocalTimestamp = () => {
    const now = new Date();
    return `${now.getFullYear()}-${padTime(now.getMonth() + 1)}-${padTime(now.getDate())} ${padTime(
      now.getHours()
    )}:${padTime(now.getMinutes())}:${padTime(now.getSeconds())}`;
  };

  // Unread & Scroll Features
  const [firstUnreadId, setFirstUnreadId] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [latestMentionId, setLatestMentionId] = useState(null);
  const [dismissedMentions, setDismissedMentions] = useState(new Set());
  const sessionLastReadRef = React.useRef(null);
  const initialScrollDoneRef = React.useRef(false);
  const lastMsgIdRef = React.useRef(null);

  // Resizable Sidebar
  const [sidebarWidth, setSidebarWidth] = useState(288); // Default 72 tailwind = 288px
  const [isResizing, setIsResizing] = useState(false);

  // Resizable Task Preview
  const [previewWidth, setPreviewWidth] = useState(650); // Default 600px
  const [isPreviewResizing, setIsPreviewResizing] = useState(false);

  const startResizing = React.useCallback(() => setIsResizing(true), []);
  const stopResizing = React.useCallback(() => setIsResizing(false), []);
  const resize = React.useCallback(
    (e) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth >= 200 && newWidth <= 600) setSidebarWidth(newWidth);
      }
    },
    [isResizing]
  );

  const startPreviewResizing = React.useCallback(() => setIsPreviewResizing(true), []);
  const stopPreviewResizing = React.useCallback(() => setIsPreviewResizing(false), []);
  const resizePreview = React.useCallback(
    (e) => {
      if (isPreviewResizing) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 400 && newWidth <= 1200) setPreviewWidth(newWidth);
      }
    },
    [isPreviewResizing]
  );

  React.useEffect(() => {
    if (isResizing || isPreviewResizing) {
      if (isResizing) {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
      }
      if (isPreviewResizing) {
        window.addEventListener('mousemove', resizePreview);
        window.addEventListener('mouseup', stopPreviewResizing);
      }
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.cursor = '';
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('mousemove', resizePreview);
      window.removeEventListener('mouseup', stopPreviewResizing);
      document.body.style.cursor = '';
    };
  }, [isResizing, resize, stopResizing, isPreviewResizing, resizePreview, stopPreviewResizing]);

  const filteredAndSortedBoards = React.useMemo(() => {
    let result = [...(boards || [])];
    if (showMyTasksFilter || showUnreadFilter) {
      result = result.filter((b) => {
        let matchMyTasks = true;
        let matchUnread = true;

        if (showMyTasksFilter) {
          matchMyTasks = b.my_pending > 0;
        }

        if (showUnreadFilter) {
          matchUnread = notifications?.some((n) => !n.is_read && String(n.board_id) === String(b.id));
        }

        return matchMyTasks && matchUnread;
      });
    }
    return result;
  }, [boards, showMyTasksFilter, showUnreadFilter, notifications]);

  // Auto-expand boards and fetch their tasks when the unread filter is activated
  useEffect(() => {
    if (!showUnreadFilter) return;
    if (filteredAndSortedBoards.length === 0) return;

    const newExpanded = { ...expandedBoards };
    filteredAndSortedBoards.forEach((b) => {
      if (b.id === 'global' || b.id === 'undefined') return;
      newExpanded[b.id] = true;
      // Always re-fetch to ensure tasks are populated and up-to-date
      axios
        .get(`/api/boards/${b.id}/tasks/light`)
        .then((res) => {
          setBoardTasks((prev) => ({ ...prev, [b.id]: res.data.tasks || [] }));
        })
        .catch(() => {});
    });
    setExpandedBoards(newExpanded);
  }, [showUnreadFilter, filteredAndSortedBoards.length]);

  // Expand / Collapse Board Sidebar
  const toggleBoard = (boardId) => {
    const isExpanded = expandedBoards[boardId];
    setExpandedBoards((prev) => ({ ...prev, [boardId]: !isExpanded }));

    if (!isExpanded && !boardTasks[boardId]) {
      // Mencegah pemanggilan API dengan ID undefined atau global
      if (!boardId || boardId === 'undefined' || boardId === 'global') return;
      axios
        .get(`/api/boards/${boardId}/tasks/light`)
        .then((res) => {
          setBoardTasks((prev) => ({ ...prev, [boardId]: res.data.tasks || [] }));
        })
        .catch((err) => {
          console.error(err);
          setBoardTasks((prev) => ({ ...prev, [boardId]: [] }));
        });
    }
  };

  const handleExpandAll = () => {
    const newExpanded = { ...expandedBoards };
    filteredAndSortedBoards.forEach((b) => {
      newExpanded[b.id] = true;
      if (!boardTasks[b.id] && b.id !== 'global' && b.id !== 'undefined') {
        axios
          .get(`/api/boards/${b.id}/tasks/light`)
          .then((res) => {
            setBoardTasks((prev) => ({ ...prev, [b.id]: res.data.tasks || [] }));
          })
          .catch(() => {});
      }
    });
    setExpandedBoards(newExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedBoards({});
  };

  const handleNewDmSelect = (user) => {
    if (!user) return;
    setActiveChat({
      type: 'dm',
      id: user.username,
      name: user.username,
      partner: user.username,
    });
    setIsNewDmOpen(false);
    setNewDmSearch('');
  };

  // Fetching Messages for Active Chat
  const fetchMessages = (initial = false, loadMore = false) => {
    if (!activeChat || activeChat.type === 'inbox') return;
    if (initial) setIsLoadingMessages(true);

    const limit = 50;
    const currentOffset = loadMore ? messages.length : 0;
    const limitToFetch = loadMore ? limit : Math.max(messages.length || 50, 50);

    let endpoint = '';
    if (activeChat.type === 'project')
      endpoint = `/api/boards/${activeChat.id}/chat?limit=${limitToFetch}&offset=${currentOffset}`;
    else if (activeChat.type === 'task')
      endpoint = `/api/tasks/${activeChat.id}/comments?limit=${limitToFetch}&offset=${currentOffset}`;
    else if (activeChat.type === 'dm')
      endpoint = `/api/dm/${activeChat.id}?limit=${limitToFetch}&offset=${currentOffset}`;
    if (!endpoint) return;

    axios
      .get(endpoint)
      .then((res) => {
        let msgs = activeChat.type === 'task' ? res.data.comments : res.data.messages;

        msgs = (msgs || [])
          .map((c) => {
            const match = c.text.match(/<!--PRIVATE:([\w.-]+)-->/);
            if (match) {
              return {
                ...c,
                isPrivate: true,
                privateUser: match[1],
                text: c.text.replace(/<!--PRIVATE:[\w.-]+-->\s*/, ''),
              };
            }
            return c;
          })
          .filter((c) => !c.isPrivate || c.privateUser === currentUser);

        if (loadMore) {
          setHasMoreMessages(msgs.length === limit);
          setMessages((prev) => [...msgs, ...prev]);
        } else {
          setHasMoreMessages(msgs.length === limitToFetch);
          setMessages(msgs || []);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (initial) setIsLoadingMessages(false);
      });
  };

  // Remember last opened chat
  useEffect(() => {
    const savedChat = localStorage.getItem(`innocean_cw_active_${currentUser}`);
    if (savedChat && !activeChat && !workspaceChatTarget) {
      try {
        const parsed = JSON.parse(savedChat);
        setActiveChat(parsed);
        if (parsed.board_id && parsed.board_id !== 'undefined') {
          setExpandedBoards((prev) => ({ ...prev, [parsed.board_id]: true }));
        }

        if (parsed.board_id && parsed.board_id !== 'global' && parsed.board_id !== 'undefined') {
          axios
            .get(`/api/boards/${parsed.board_id}/tasks/light`)
            .then((res) => {
              setBoardTasks((prev) => ({ ...prev, [parsed.board_id]: res.data.tasks || [] }));
              if (parsed.type === 'task') {
                const t = res.data.tasks?.find((t) => t.id === parsed.id);
                if (t) setActiveChat((prev) => (prev ? { ...prev, is_involved: t.is_involved } : prev));
              }
            })
            .catch(console.error);
        }
      } catch (e) {}
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeChat) {
      localStorage.setItem(`innocean_cw_active_${currentUser}`, JSON.stringify(activeChat));
    }
  }, [activeChat, currentUser]);

  // Auto-open/close Task Preview when navigating chats
  useEffect(() => {
    if (activeChat?.type === 'task') {
      if (handleNotificationTaskClick) handleNotificationTaskClick(activeChat.id);
    } else {
      if (setSelectedTask) setSelectedTask(null);
    }
  }, [activeChat?.id, activeChat?.type]);

  // Resolve missing is_involved flag if opened from Inbox or unread notification
  useEffect(() => {
    if (
      activeChat?.type === 'task' &&
      activeChat.is_involved === undefined &&
      activeChat.board_id &&
      activeChat.board_id !== 'global'
    ) {
      const taskList = boardTasks[activeChat.board_id];
      if (taskList) {
        const t = taskList.find((task) => task.id === activeChat.id);
        if (t && t.is_involved !== undefined) setActiveChat((prev) => ({ ...prev, is_involved: t.is_involved }));
      } else {
        axios
          .get(`/api/boards/${activeChat.board_id}/tasks/light`)
          .then((res) => {
            setBoardTasks((prev) => ({ ...prev, [activeChat.board_id]: res.data.tasks || [] }));
            const t = res.data.tasks?.find((task) => task.id === activeChat.id);
            if (t) setActiveChat((prev) => ({ ...prev, is_involved: t.is_involved }));
          })
          .catch(() => {});
      }
    }
  }, [activeChat?.id, activeChat?.type, activeChat?.is_involved, activeChat?.board_id, boardTasks]);

  const loadMoreMessages = () => {
    fetchMessages(false, true);
  };

  // Setup Unread Storage Key
  useEffect(() => {
    initialScrollDoneRef.current = false;
    setFirstUnreadId(null);
    lastMsgIdRef.current = null;
    if (activeChat) {
      const storageKey =
        activeChat.type === 'project'
          ? `innocean_last_read_board_${activeChat.id}_${currentUser}`
          : `innocean_last_read_task_${activeChat.id}_${currentUser}`;
      sessionLastReadRef.current = localStorage.getItem(storageKey);
    }
  }, [activeChat?.id, activeChat?.type, currentUser]);

  // Handle Polling and Initial Load
  useEffect(() => {
    if (activeChat?.id && activeChat?.type) {
      setMessages([]);
      fetchMessages(true);

      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') fetchMessages();
      }, 10000); // 10s safe polling for Free Tier

      return () => clearInterval(interval);
    }
  }, [activeChat?.id, activeChat?.type]);

  // Sync AI state with Workspace Chat
  const prevAiReplying = React.useRef(isAiReplying);
  useEffect(() => {
    if (prevAiReplying.current && !isAiReplying && activeChat) {
      fetchMessages();
    }
    prevAiReplying.current = isAiReplying;
  }, [isAiReplying, activeChat]);

  // Clear unread badges for the active chat and sync with notification modal
  useEffect(() => {
    if (activeChat && notifications && handleReadNotification && messages.length > 0) {
      const unreadForThis = notifications.filter(
        (n) =>
          !n.is_read &&
          (n.type === 'comment' ||
            n.type === 'mention' ||
            n.type === 'mention_no_email' ||
            n.type === 'team_chat' ||
            n.type === 'team_chat_no_email') &&
          (n.related_task_id === activeChat.id || String(n.related_task_id) === String(activeChat.id))
      );
      if (unreadForThis.length > 0) unreadForThis.forEach((n) => handleReadNotification(n.id));
    }
  }, [activeChat, messages, notifications, handleReadNotification]);

  // Clear DM Unread
  useEffect(() => {
    if (activeChat && activeChat.type === 'dm' && messages.length > 0) {
      axios.put(`/api/dm/${activeChat.id}/read`).then(fetchDmConversations).catch(console.error);
    }
  }, [activeChat, messages]);

  // Unread Line, Auto Scroll, and Mentions Tracking
  useEffect(() => {
    if (messages.length > 0 && activeChat) {
      const lastRead = sessionLastReadRef.current;
      let targetId = firstUnreadId;
      const latestMsgId = messages[messages.length - 1].id;
      const isFirstLoad = lastMsgIdRef.current === null;
      const isNewMessageAtBottom = !isFirstLoad && lastMsgIdRef.current !== latestMsgId;
      lastMsgIdRef.current = latestMsgId;

      if (!targetId && lastRead && isFirstLoad) {
        const unreadMsg = messages.find((c) => c.timestamp > lastRead && c.username !== currentUser);
        if (unreadMsg) {
          targetId = unreadMsg.id;
          setFirstUnreadId(targetId);
          initialScrollDoneRef.current = false;
        }
      }

      const storageKey =
        activeChat.type === 'project'
          ? `innocean_last_read_board_${activeChat.id}_${currentUser}`
          : `innocean_last_read_task_${activeChat.id}_${currentUser}`;

      if (!initialScrollDoneRef.current) {
        initialScrollDoneRef.current = true;
        if (targetId) {
          let attempts = 0;
          const interval = setInterval(() => {
            const el = document.getElementById(`cw-msg-${targetId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'auto', block: 'center' });
              setShowScrollBottom(true);
              clearInterval(interval);
            } else {
              attempts++;
              if (attempts >= 10) {
                clearInterval(interval);
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
                setShowScrollBottom(false);
              }
            }
          }, 100);
        } else {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            setShowScrollBottom(false);
            localStorage.setItem(storageKey, messages[messages.length - 1].timestamp);
          }, 150);
        }
      } else if (isNewMessageAtBottom) {
        const container = scrollContainerRef.current;
        if (container) {
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
          const isMyMessage = messages[messages.length - 1].username === currentUser;
          if (isNearBottom || isMyMessage) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            setShowScrollBottom(false);
            localStorage.setItem(storageKey, messages[messages.length - 1].timestamp);
          } else {
            setShowScrollBottom(true);
          }
        }
      }

      // Mention tracking
      const mention = [...messages]
        .reverse()
        .find(
          (m) =>
            (m.text.includes(`@${currentUser}`) || m.text.includes('@team') || m.text.includes('@all')) &&
            !dismissedMentions.has(m.id)
        );
      if (mention) setLatestMentionId(mention.id);
      else setLatestMentionId(null);
    }
  }, [messages, activeChat, currentUser, firstUnreadId, dismissedMentions]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);
    const match = val.match(/(?:^|\s)@([\w.-]*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setIsMentioning(true);
      setMentionIndex(0);
    } else {
      setIsMentioning(false);
    }
  };

  const insertMention = (username) => {
    const newVal = newMessage.replace(/(?:^|\s)@([\w.-]*)$/, ` @${username} `);
    setNewMessage(newVal);
    setIsMentioning(false);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    let finalComment = newMessage.trim();
    if (replyingTo) {
      const cleanPreview = replyingTo.text
        .replace(/^> .*?\n/gm, '')
        .replace(/<[^>]*>?/gm, '')
        .trim();
      const truncated = cleanPreview.length > 80 ? cleanPreview.substring(0, 80) + '...' : cleanPreview;
      finalComment = `> **@${replyingTo.username}**: ${truncated}\n${finalComment}`;
    }

    const lowerComment = newMessage.toLowerCase();
    const isPrivateAI = lowerComment.includes('@ai (private)');

    if (activeChat.type === 'task' && (lowerComment.includes('@smart assistant') || lowerComment.includes('@ai'))) {
      if (handleAskAITaskChat && !isAiReplying) {
        // Optimistic UI untuk pesan pengguna sendiri agar instan
        const tempId = Date.now();
        setMessages((prev) => [
          ...prev,
          {
            id: tempId,
            username: currentUser,
            text: finalComment,
            timestamp: getLocalTimestamp(),
            reactions: {},
            isPrivate: isPrivateAI,
            privateUser: currentUser,
          },
        ]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

        handleAskAITaskChat(
          activeChat.id,
          finalComment,
          newMessage.trim(),
          () => {
            setNewMessage('');
            setReplyingTo(null);
          },
          isPrivateAI
        );
        return;
      }
    }

    const commentText =
      activeChat.type === 'task' && isPrivateAI ? `<!--PRIVATE:${currentUser}-->${finalComment}` : finalComment;

    let endpoint = '';
    if (activeChat.type === 'project') endpoint = `/api/boards/${activeChat.id}/chat`;
    else if (activeChat.type === 'task') endpoint = `/api/tasks/${activeChat.id}/comments`;
    else if (activeChat.type === 'dm') endpoint = `/api/dm/${activeChat.id}`;

    axios
      .post(endpoint, { text: commentText })
      .then(() => {
        setNewMessage('');
        setReplyingTo(null);
        fetchMessages();
        if (activeChat.type === 'dm') fetchDmConversations();
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.detail || tMsg('Failed to send message', 'Gagal mengirim pesan');
        if (showNotification) showNotification(errorMsg, 'error');
      });
  };

  const handleMeetNow = () => {
    if (!activeChat) return;
    const cleanName = (activeChat.name || 'meeting')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const cleanId = String(activeChat.id)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    let roomName = '';
    if (activeChat.type === 'dm') {
      roomName = `dm-with-${cleanId}`.substring(0, 50).replace(/^-+|-+$/g, '');
    } else {
      roomName = `${activeChat.type}-${cleanId}-${cleanName}`.substring(0, 50).replace(/^-+|-+$/g, '');
    }

    const meetLink = `https://meet.google.com/lookup/${roomName}`;
    const popupFeatures =
      'width=1000,height=700,left=100,top=100,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
    window.open(meetLink, 'GoogleMeetPopup', popupFeatures);

    const mentionType = activeChat.type === 'project' ? '@team' : activeChat.type === 'dm' ? '' : '@all';
    const msg = `${mentionType ? mentionType + ' ' : ''}🎥 I've started a Google Meet! Join here: ${meetLink}`;
    let endpoint = '';
    if (activeChat.type === 'project') endpoint = `/api/boards/${activeChat.id}/chat`;
    else if (activeChat.type === 'task') endpoint = `/api/tasks/${activeChat.id}/comments`;
    else if (activeChat.type === 'dm') endpoint = `/api/dm/${activeChat.id}`;
    if (endpoint) axios.post(endpoint, { text: msg }).then(() => fetchMessages());
  };

  // --- INTERNAL MESSAGE ACTIONS (FIX CRASH ON DM) ---
  const deleteWorkspaceMessage = (msgId) => {
    setMsgToDelete(msgId);
  };

  const confirmDeleteMessage = () => {
    if (!msgToDelete) return;

    let endpoint = '';
    if (activeChat.type === 'project') endpoint = `/api/boards/${activeChat.id}/chat/${msgToDelete}`;
    else if (activeChat.type === 'task') endpoint = `/api/tasks/${activeChat.id}/comments/${msgToDelete}`;
    else if (activeChat.type === 'dm') endpoint = `/api/dm/${msgToDelete}`;

    if (!endpoint) return;
    axios
      .delete(endpoint)
      .then(() => {
        fetchMessages();
        if (activeChat.type === 'dm') fetchDmConversations();
        if (showNotification) showNotification(tMsg('Message deleted', 'Pesan dihapus'), 'success');
        setMsgToDelete(null);
      })
      .catch((err) => {
        if (showNotification) showNotification(tMsg('Failed to delete message', 'Gagal menghapus pesan'), 'error');
        setMsgToDelete(null);
      });
  };

  const toggleWorkspaceReaction = (msgId, emoji) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const newRx = { ...(m.reactions || {}) };
          const isSelected = newRx[emoji]?.includes(currentUser);
          Object.keys(newRx).forEach((k) => {
            newRx[k] = newRx[k].filter((u) => u !== currentUser);
            if (newRx[k].length === 0) delete newRx[k];
          });
          if (!isSelected) {
            if (!newRx[emoji]) newRx[emoji] = [];
            newRx[emoji].push(currentUser);
          }
          return { ...m, reactions: newRx };
        }
        return m;
      })
    );

    let endpoint = '';
    if (activeChat.type === 'project' || activeChat.type === 'task') endpoint = `/api/comments/${msgId}/react`;
    else if (activeChat.type === 'dm') endpoint = `/api/dm/react/${msgId}`;
    if (endpoint) axios.post(endpoint, { emoji }).catch(() => fetchMessages());
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setShowScrollBottom(scrollHeight - scrollTop > clientHeight + 150);
  };

  const inboxUnreadCount = React.useMemo(() => {
    const dmUnread = (dmConversations || []).reduce((acc, dm) => acc + (dm.unread_count || 0), 0);
    const notifUnread = (notifications || []).filter(
      (n) =>
        !n.is_read && ['team_chat', 'team_chat_no_email', 'comment', 'mention', 'mention_no_email'].includes(n.type)
    ).length;
    return dmUnread + notifUnread;
  }, [dmConversations, notifications]);

  return (
    <div
      className={`fixed inset-0 bg-white dark:bg-neutral-950 z-90 flex flex-col transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Header */}
      <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📱</span>
          <h2 className="text-lg font-black text-black dark:text-white uppercase tracking-wider">
            {tMsg('Workspace Chat', 'Ruang Kerja Obrolan')}
          </h2>
        </div>
        <button
          onClick={close}
          className="w-8 h-8 flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors text-black dark:text-white font-bold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="md:hidden absolute inset-0 bg-black/40 backdrop-blur-sm z-45 transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          ></div>
        )}

        {/* Left Sidebar (Tree View) */}
        <div
          className={`h-full border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex flex-col shrink-0 absolute md:static inset-y-0 left-0 z-50 md:z-0 transition-all duration-300 ease-in-out shadow-2xl md:shadow-none overflow-hidden ${
            isMobileSidebarOpen
              ? 'translate-x-0 w-[85vw] sm:w-[320px]'
              : '-translate-x-full md:translate-x-0 w-[85vw] sm:w-[320px]'
          } ${isDesktopSidebarOpen ? 'md:border-r' : 'md:w-0 md:border-r-0 md:opacity-0'}`}
          style={{
            width:
              typeof window !== 'undefined' && window.innerWidth >= 768 && isDesktopSidebarOpen
                ? sidebarWidth
                : undefined,
          }}
        >
          
          <ChatSidebar
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            isDesktopSidebarOpen={isDesktopSidebarOpen}
            sidebarWidth={sidebarWidth}
            boards={filteredAndSortedBoards}
            tasks={tasks}
            boardSearchQuery={boardSearchQuery}
            setBoardSearchQuery={setBoardSearchQuery}
            expandedBoards={expandedBoards}
            toggleBoard={toggleBoard}
            unreadBoardTotal={0}
            notifications={notifications}
            showUnreadFilter={showUnreadFilter}
            setShowUnreadFilter={setShowUnreadFilter}
            showMyTasksFilter={showMyTasksFilter}
            setShowMyTasksFilter={setShowMyTasksFilter}
            handleExpandAll={handleExpandAll}
            handleCollapseAll={handleCollapseAll}
            boardTasks={boardTasks}
            dmConversations={dmConversations}
            isNewDmOpen={isNewDmOpen}
            setIsNewDmOpen={setIsNewDmOpen}
            newDmSearch={newDmSearch}
            setNewDmSearch={setNewDmSearch}
            filteredUsers={userDirectory || []}
            newDmSearchIndex={newDmSearchIndex}
            handleNewDmSelect={handleNewDmSelect}
            setDmConvToDelete={setDmConvToDelete}
            avatarsMap={avatarsMap}
            tMsg={tMsg}
            inboxChats={inboxChats}
            currentUser={currentUser}
          />
        </div>
        {/* Left sidebar end */}

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
                    <div className="flex gap-2">
                      <button
                        onClick={handleMarkAllInboxAsRead}
                        className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                      >
                        ✅ {tMsg('Mark all read', 'Tandai semua dibaca')}
                      </button>
                      <button
                        onClick={() => {
                          fetchInboxChats();
                        }}
                        className="text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white px-3 py-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                      >
                        ↻ Refresh
                      </button>
                    </div>
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
                          const isUnread = (() => {
                            if (chat.latest_sender === currentUser) return false;
                            if (chat.is_dm) return chat.unread_count > 0;
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
                          })();

                          const privMatch = displayMessage.match(/<!--PRIVATE:([\w.-]+)-->/);
                          if (privMatch) {
                            if (privMatch[1] === currentUser) {
                              displayMessage = '🔒 ' + displayMessage.replace(/<!--PRIVATE:[\w.-]+-->\s*/, '');
                            } else {
                              displayMessage = '🔒 [Private Message]';
                            }
                          }
                          // Clean HTML and Markdown elements from the preview text
                          const cleanHtml = stripHtml(displayMessage) || '';
                          const cleanMessage = cleanHtml
                            .replace(/(\*\*|__)(.*?)\1/g, '$2')
                            .replace(/(\*|_)(.*?)\1/g, '$2')
                            .replace(/`([^`]+)`/g, '$1')
                            .replace(/#+\s+/g, '')
                            .trim();

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
                              className={`border rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group ${
                                isUnread 
                                  ? 'bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-800 border-l-4 border-l-indigo-500 pl-3' 
                                  : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800/80'
                              }`}
                            >
                              <div className="w-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-850 flex items-center justify-center text-lg shrink-0 border border-neutral-100 dark:border-neutral-800 shadow-sm group-hover:scale-105 transition-transform">
                                {chat.is_dm ? '💬' : chat.is_project_chat ? '🏢' : '📋'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 min-w-0">
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
                                    {isUnread && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 inline-block animate-pulse" title="Unread" />
                                    )}
                                    <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider">
                                      {chat.is_dm ? 'DM' : chat.board_name}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-semibold text-neutral-400 shrink-0 whitespace-nowrap">
                                    {formatDateMMM(chat.timestamp)}
                                  </span>
                                </div>
                                <div className="flex items-start gap-1.5 mt-1.5">
                                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0">
                                    @{chat.latest_sender}:
                                  </span>
                                  <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1 leading-relaxed truncate">
                                    {cleanMessage}
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
                    handleMeetNow={handleMeetNow}
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
                      handleScroll={handleScroll}
                      isLoadingMessages={isLoadingMessages}
                      messages={messages}
                      hasMoreMessages={hasMoreMessages}
                      loadMoreMessages={loadMoreMessages}
                      tMsg={tMsg}
                      formatDateMMM={formatDateMMM}
                      currentUser={currentUser}
                      avatarsMap={avatarsMap}
                      firstUnreadId={firstUnreadId}
                      setReplyingTo={setReplyingTo}
                      deleteWorkspaceMessage={deleteWorkspaceMessage}
                      showNotification={showNotification}
                      toggleWorkspaceReaction={toggleWorkspaceReaction}
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
                    sendMessage={sendMessage}
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    handleInputChange={handleInputChange}
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
                    insertMention={insertMention}
                    tMsg={tMsg}
                  />
                </>
              )
            ) : (
              <div className="flex-1 flex flex-col relative bg-neutral-50/50 dark:bg-neutral-900/30">
                <div className={`absolute top-4 left-4 z-10 ${isDesktopSidebarOpen ? 'md:hidden' : ''}`}>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                        setIsDesktopSidebarOpen(true);
                      } else {
                        setIsMobileSidebarOpen(true);
                      }
                    }}
                    className="p-2 text-neutral-500 hover:text-black dark:hover:text-white transition-colors font-bold flex items-center gap-2 text-xs uppercase tracking-widest"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>{' '}
                    {tMsg('Menu', 'Menu')}
                  </button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-8 text-center">
                  <span className="text-6xl mb-4 opacity-50">💬</span>
                  <h3 className="text-lg font-bold text-black dark:text-white mb-2">No chat selected</h3>
                  <p className="text-sm font-medium">
                    Choose an Inbox message, Project, or Task from the sidebar to start chatting.
                  </p>
                </div>
              </div>
            )}
          </div>

        {/* Right Task Preview Panel */}
        {children && (
          <>
            {/* Resizer for Task Preview */}
            <div
              className="hidden lg:block w-1 cursor-col-resize hover:bg-indigo-500 transition-colors shrink-0 z-50 bg-transparent border-l border-neutral-200 dark:border-neutral-800"
              onMouseDown={startPreviewResizing}
            ></div>
            <div
              className="absolute inset-0 lg:static shrink-0 bg-white dark:bg-neutral-950 z-100 lg:z-30 flex flex-col shadow-[-10px_0_20px_rgba(0,0,0,0.05)] dark:shadow-[-10px_0_20px_rgba(0,0,0,0.2)] mac-slide-in overflow-hidden min-h-0"
              style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? previewWidth : undefined }}
            >
              {children}
            </div>
          </>
        )}
      </div>

      {dmConvToDelete && (
        <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-100 p-4 transition-opacity duration-200 opacity-100">
          <div className="bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-sm border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] text-center mac-animate">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm">
              ⚠️
            </div>
            <h3 className="text-2xl font-black text-black dark:text-white mb-4 uppercase">
              Delete Chat?
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-sm font-medium leading-relaxed">
              Are you sure you want to delete this conversation with <strong>@{dmConvToDelete}</strong>?
              <br /> This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setDmConvToDelete(null)}
                className="flex-1 px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors uppercase tracking-widest text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  axios
                    .delete(`/api/dm/conversations/${dmConvToDelete}`)
                    .then(() => {
                      if (showNotification) showNotification('Conversation deleted', 'success');
                      fetchDmConversations();
                      if (activeChat?.type === 'dm' && activeChat?.id === dmConvToDelete) {
                        setActiveChat({ type: 'inbox', id: 'inbox', name: 'Inbox' });
                      }
                      setDmConvToDelete(null);
                    })
                    .catch(() => {
                      if (showNotification) showNotification('Failed to delete conversation', 'error');
                    });
                }}
                className="flex-1 px-4 py-4 rounded-full font-bold text-white bg-red-500 hover:bg-red-600 shadow-md transition-all uppercase tracking-widest text-xs hover:-translate-y-0.5"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {msgToDelete && (
        <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-100 p-4 transition-opacity duration-200 opacity-100">
          <div className="bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-sm border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] text-center mac-animate">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm">
              ⚠️
            </div>
            <h3 className="text-2xl font-black text-black dark:text-white mb-4 uppercase">
              {tMsg('Delete Message?', 'Hapus Pesan?')}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-sm font-medium leading-relaxed">
              {tMsg('Are you sure you want to delete this message?', 'Apakah Anda yakin ingin menghapus pesan ini?')}
              <br /> {tMsg('This action cannot be undone.', 'Tindakan ini tidak dapat dibatalkan.')}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setMsgToDelete(null)}
                className="flex-1 px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors uppercase tracking-widest text-xs"
              >
                {tMsg('Cancel', 'Batal')}
              </button>
              <button
                onClick={confirmDeleteMessage}
                className="flex-1 px-4 py-4 rounded-full font-bold text-white bg-red-500 hover:bg-red-600 shadow-md transition-all uppercase tracking-widest text-xs hover:-translate-y-0.5"
              >
                {tMsg('Delete', 'Hapus')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
