import React, { useState } from 'react';
import axios from 'axios';
import { IconPerson, Avatar } from './SharedUI';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { HighlightText, stripHtml, useCloseAnimation, LoadingSpinner, renderRichText } from './Utils';
import ChatMessage from './ChatMessage';
import TaskDetailHeader from './components/TaskDetail/TaskDetailHeader';
import TaskDetailSidebar from './components/TaskDetail/TaskDetailSidebar';
import TaskDetailSubtasks from './components/TaskDetail/TaskDetailSubtasks';
import TaskDetailActivity from './components/TaskDetail/TaskDetailActivity';
import TaskDetailComments from './components/TaskDetail/TaskDetailComments';
import TaskDetailCommentForm from './components/TaskDetail/TaskDetailCommentForm';
export default function TaskDetailModal({
  tasks,
  selectedTask,
  setSelectedTask,
  isEditing,
  setIsEditing,
  handleDirectStatusChange,
  columns,
  editFormData,
  setEditFormData,
  formatDateMMM,
  handleRequesterChange,
  isMentioning,
  teamMembers,
  mentionQuery,
  insertMention,
  categories = [],
  handleOpenAddBoard,
  handleOpenRenameBoard,
  handleOpenDeleteBoard,
  handleEditSubmit,
  isSuperAdmin,
  currentUser,
  selectedBoard,
  subtasks,
  handleToggleSubtask,
  handleUpdateSubtaskAssignee,
  handleDeleteSubtask,
  newSubtaskName,
  setNewSubtaskName,
  newSubtaskAssignee,
  setNewSubtaskAssignee,
  handleAddSubtask,
  comments,
  avatarsMap,
  handleDeleteComment,
  newComment,
  isAiReplying,
  handleAskAITaskChat,
  handleCommentChange,
  insertCommentMention,
  handleAddComment,
  setIsDeleteConfirmOpen,
  startEditing,
  accountStatus,
  mentionIndex,
  setMentionIndex,
  setIsMentioning,
  isCommentMentioning,
  commentMentionQuery,
  commentMentionIndex,
  setCommentMentionIndex,
  setIsCommentMentioning,
  boards,
  setSelectedBoard,
  chatBg,
  hasMoreComments,
  loadMoreComments,
  handleToggleReaction,
  language,
  handleQuickLinkAdd,
  handleQuickLinkRemove,
  isSubtasksLoading,
  showNotification,
  isSubmitting,
  handleToggleAutoNudge,
  userDirectory,
  isInline = false,
  onCloseInline = null,
  isPreviewMode = false,
}) {
  const [activeTab, setActiveTab] = useState('comments');
  const [mobileTab, setMobileTab] = useState('details');
  const [hasRequestedAccess, setHasRequestedAccess] = useState(false);
  const [isClosing, close] = useCloseAnimation(() => {
    if (isInline && onCloseInline) onCloseInline();
    else setSelectedTask(null);
  });
  const tMsg = (en, id) => (language === 'id' ? id : en);

  const [replyingTo, setReplyingTo] = useState(null);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const commentsEndRef = React.useRef(null);
  const commentsContainerRef = React.useRef(null);
  const [linkToRemove, setLinkToRemove] = useState(null);

  const [isGeneratingNudge, setIsGeneratingNudge] = useState(false);
  const [isNudgeConfirmOpen, setIsNudgeConfirmOpen] = useState(false);

  const assignedUsers = [];
  if (selectedTask?.requester) {
    const matches = selectedTask.requester.match(/@([\w.-]+)/g);
    if (matches) matches.forEach((m) => assignedUsers.push(m));
  }
  if (subtasks) {
    subtasks.forEach((st) => {
      if (st.assignee) assignedUsers.push(`@${st.assignee}`);
    });
  }
  const uniqueAssignees = Array.from(new Set(assignedUsers));
  const hasAnyAssignee = uniqueAssignees.length > 0;

  // Kalkulasi Cerdas untuk Posisi Antrean (Queue Position) Hibrida
  const isGlobalQueue = !selectedBoard || selectedBoard.id === 'global' || isPreviewMode;
  const queuePosition = isGlobalQueue ? selectedTask.queue_global_number : selectedTask.queue_project_number;
  const totalQueue = isGlobalQueue ? selectedTask.total_global_queue : selectedTask.total_project_queue;
  const mainAssignee = selectedTask.main_assignee;
  const queueLabel = isGlobalQueue ? tMsg('Overall Queue', 'Antrean Total') : tMsg('Queue', 'Antrean');
  const queueType = isGlobalQueue ? 'overall' : tMsg('project', 'proyek');

  const executeSmartNudge = async () => {
    setIsNudgeConfirmOpen(false);
    setIsGeneratingNudge(true);
    setActiveTab('comments');
    setMobileTab('activity');

    const promptText = `Please act as the Smart Assistant. Write a short, friendly, and professional follow-up message (1-2 sentences) to check the progress of the task "${
      selectedTask.project_name
    }". Address it to the assignee(s): ${uniqueAssignees.join(
      ', '
    )}. Explicitly mention that @${currentUser} requested this check-in/update. Please respond in the same language as the task title.`;

    try {
      // Menggunakan endpoint ai-reply agar diposting sebagai "Smart Assistant"
      await axios.post(`/api/tasks/${selectedTask.id}/ai-reply`, { text: promptText });
      if (showNotification)
        showNotification(
          tMsg('Follow-up sent! It will appear shortly.', 'Follow-up terkirim! Akan segera muncul.'),
          'success'
        );
    } catch (err) {
      const errorMsg = err.response?.data?.detail || tMsg('Failed to send Smart Nudge', 'Gagal mengirim pantauan');
      if (showNotification) showNotification(errorMsg, 'error');
    } finally {
      setIsGeneratingNudge(false);
    }
  };

  const globalMentionOptions = selectedBoard?.is_private
    ? [currentUser]
    : userDirectory && userDirectory.length > 0
    ? userDirectory
        .filter((u) => u.is_connected)
        .map((u) => u.username)
        .filter((u) => u !== 'admin')
    : teamMembers;

  const [taskChatSearchQuery, setTaskChatSearchQuery] = useState('');
  const [isTaskChatSearchOpen, setIsTaskChatSearchOpen] = useState(false);
  const [showTaskScrollBottom, setShowTaskScrollBottom] = useState(false);
  const [taskLatestMentionId, setTaskLatestMentionId] = useState(null);
  const [dismissedTaskMentions, setDismissedTaskMentions] = useState([]);
  const [firstUnreadId, setFirstUnreadId] = useState(null);
  const sessionLastReadRef = React.useRef(null);
  const initialScrollDoneRef = React.useRef(false);
  const lastTaskMsgIdRef = React.useRef(null);

  const regularComments = React.useMemo(
    () => comments.filter((c) => c.username !== 'System' && !c?.text?.startsWith('[ACTIVITY]')),
    [comments]
  );
  const activityLogs = React.useMemo(
    () => comments.filter((c) => c.username === 'System' && c?.text?.startsWith('[ACTIVITY]')).reverse(),
    [comments]
  );

  const handleTaskChatScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop < clientHeight + 150;
    setShowTaskScrollBottom(!isNearBottom);
    if (isNearBottom && regularComments.length > 0) {
      localStorage.setItem(
        `innocean_last_read_task_${selectedTask.id}_${currentUser}`,
        regularComments[regularComments.length - 1].timestamp
      );
    }
  };

  const handleStartTaskMeet = () => {
    const cleanName = (selectedTask.project_name || 'task')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const roomName = `task-${selectedTask.id}-${cleanName}`.substring(0, 50);
    const meetLink = `https://meet.google.com/lookup/${roomName}`;

    // Buka Google Meet dalam jendela Popup terpisah agar terasa seperti In-App
    const popupFeatures =
      'width=1000,height=700,left=100,top=100,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
    window.open(meetLink, 'GoogleMeetPopup', popupFeatures);
    // Secara otomatis mengirim pesan undangan dengan link Meet
    handleAddComment(null, `@all 🎥 I've started a Google Meet for this task! Join here: ${meetLink}`);
  };

  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const handleGenerateDesc = async () => {
    if (!editFormData.project_name) {
      alert(
        language === 'id' ? 'Silakan masukkan nama/judul tugas terlebih dahulu.' : 'Please enter a task name first.'
      );
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const baseDesc = editFormData.description ? `\n\nUser's initial brief/draft:\n${editFormData.description}` : '';
      const prompt = `Write a professional, structured task description (brief) in markdown format. The task title is "${editFormData.project_name}", category is "${editFormData.category}". Please respond in the same language as the task title.${baseDesc}`;
      const res = await axios.post('/api/ai/generate', { prompt });
      setEditFormData({ ...editFormData, description: res.data.text });
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        (language === 'id' ? 'Gagal membuat deskripsi dengan AI.' : 'Failed to generate description with AI.');
      if (showNotification) showNotification(errorMsg, 'error');
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const [isEstimatingEtc, setIsEstimatingEtc] = useState(false);
  const handleEstimateEtc = async () => {
    if (!editFormData.project_name) {
      alert(language === 'id' ? 'Silakan masukkan judul tugas terlebih dahulu.' : 'Please enter a task name first.');
      return;
    }
    setIsEstimatingEtc(true);
    try {
      const prompt = `Estimate the time consumption in hours (integer) to complete this task based on its title and description. Task Title: "${
        editFormData.project_name
      }". Description: "${
        editFormData.description || ''
      }". Return ONLY a single integer representing the hours. Do not include any other text.`;
      const res = await axios.post('/api/ai/generate', { prompt, provider: 'auto' });
      const val = parseInt(res.data.text.trim());
      if (!isNaN(val)) {
        setEditFormData({ ...editFormData, etc: val });
      }
    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.detail || (language === 'id' ? 'Gagal mengestimasi ETC.' : 'Failed to estimate ETC.');
      if (showNotification) showNotification(errorMsg, 'error');
    } finally {
      setIsEstimatingEtc(false);
    }
  };

  React.useEffect(() => {
    initialScrollDoneRef.current = false;
    setFirstUnreadId(null);
    lastTaskMsgIdRef.current = null;
    sessionLastReadRef.current = localStorage.getItem(`innocean_last_read_task_${selectedTask.id}_${currentUser}`);
  }, [selectedTask.id, activeTab, currentUser]);

  React.useEffect(() => {
    if (activeTab === 'comments' && regularComments.length > 0) {
      const lastRead = sessionLastReadRef.current;
      let targetId = firstUnreadId;

      const latestMsgId = regularComments[regularComments.length - 1].id;
      const isFirstLoad = lastTaskMsgIdRef.current === null;
      const isNewMessageAtBottom = !isFirstLoad && lastTaskMsgIdRef.current !== latestMsgId;
      lastTaskMsgIdRef.current = latestMsgId;

      if (!targetId && lastRead && isFirstLoad) {
        const unreadMsg = regularComments.find((c) => c.timestamp > lastRead && c.username !== currentUser);
        if (unreadMsg) {
          targetId = unreadMsg.id;
          setFirstUnreadId(targetId);
          initialScrollDoneRef.current = false;
        }
      }

      if (!initialScrollDoneRef.current) {
        initialScrollDoneRef.current = true;
        if (targetId) {
          let attempts = 0;
          const interval = setInterval(() => {
            const el = document.getElementById(`task-chat-msg-${targetId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'auto', block: 'center' });
              clearInterval(interval);
            } else {
              attempts++;
              if (attempts >= 10) {
                clearInterval(interval);
                commentsEndRef.current?.scrollIntoView({ behavior: 'auto' });
              }
            }
          }, 100);
        } else {
          setTimeout(() => {
            commentsEndRef.current?.scrollIntoView({ behavior: 'auto' });
            localStorage.setItem(
              `innocean_last_read_task_${selectedTask.id}_${currentUser}`,
              regularComments[regularComments.length - 1].timestamp
            );
          }, 150);
        }
      } else if (isNewMessageAtBottom) {
        const container = commentsContainerRef.current;
        if (container) {
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
          const isMyMessage = regularComments[regularComments.length - 1].username === currentUser;

          if (isNearBottom || isMyMessage) {
            commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            localStorage.setItem(
              `innocean_last_read_task_${selectedTask.id}_${currentUser}`,
              regularComments[regularComments.length - 1].timestamp
            );
          }
        }
      }
    }
  }, [regularComments, activeTab, selectedTask.id, currentUser, firstUnreadId]);

  React.useEffect(() => {
    if (activeTab === 'comments' && comments.length > 0 && currentUser) {
      const mention = [...comments]
        .reverse()
        .find(
          (m) =>
            (m.text.includes(`@${currentUser}`) || m.text.includes('@all') || m.text.includes('@team')) &&
            !dismissedTaskMentions.some((id) => String(id) === String(m.id))
        );
      if (mention) setTaskLatestMentionId(mention.id);
      else setTaskLatestMentionId(null);
    } else {
      setTaskLatestMentionId(null);
    }
  }, [comments, currentUser, dismissedTaskMentions, activeTab]);

  const isSystemTicket =
    selectedTask.owner_username === 'admin' &&
    (selectedTask.category === 'Feedback' || selectedTask.category === 'Support');

  let isTaskAdmin = false;
  if (!isPreviewMode && currentUser) {
    isTaskAdmin =
      isSuperAdmin ||
      selectedTask.owner_username === currentUser ||
      (selectedBoard && selectedBoard.owner_username === currentUser) ||
      (selectedTask.requester &&
        (selectedTask.requester.toLowerCase() === currentUser.toLowerCase() ||
          new RegExp(`@${currentUser.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w.-])`, 'i').test(
            selectedTask.requester
          )));
  }

  if (isSystemTicket && !isSuperAdmin) {
    isTaskAdmin = false;
  }

  const isSubtaskAssignee = subtasks && subtasks.some((st) => st.assignee && currentUser && st.assignee.toLowerCase() === currentUser.toLowerCase());
  const isInvolved =
    !isPreviewMode &&
    (isTaskAdmin ||
      isSubtaskAssignee ||
      (isSystemTicket &&
        selectedTask.requester &&
        currentUser &&
        selectedTask.requester.toLowerCase() === currentUser.toLowerCase()));

  const generateGoogleCalendarUrl = () => {
    const text = encodeURIComponent(selectedTask.project_name || 'Untitled Task');
    let desc = selectedTask.description || '';
    // Membersihkan simbol markdown dasar agar rapi di Google Calendar
    desc = desc
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1');
    const details = encodeURIComponent(desc);

    const formatDateForGCal = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr.replace(/-/g, '/'));
      if (isNaN(d.getTime())) return '';
      return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    };

    const startDateStr =
      selectedTask.start_date || (selectedTask.timestamp ? selectedTask.timestamp.split(' ')[0] : '');
    const startDate = formatDateForGCal(startDateStr);
    const endDate = formatDateForGCal(selectedTask.deadline);

    let dates = '';
    if (startDate && endDate) dates = `&dates=${startDate}/${endDate}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}${dates}`;
  };

  const generateGoogleMeetScheduleUrl = () => {
    const text = encodeURIComponent(`Meeting: ${selectedTask.project_name || 'Untitled Task'}`);
    let desc = selectedTask.description || '';
    desc = desc
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1');
    const details = encodeURIComponent(`Discussion for task: ${selectedTask.project_name}\n\n${desc}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}`;
  };

  const openCalendarPopup = (url) => {
    const popupFeatures =
      'width=1000,height=700,left=100,top=100,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
    window.open(url, 'CalendarPopup', popupFeatures);
  };

  const submitQuickLink = (e) => {
    e.preventDefault();
    if (newLinkUrl.trim() && handleQuickLinkAdd) {
      handleQuickLinkAdd(selectedTask.id, newLinkUrl);
      setNewLinkUrl('');
      setIsAddingLink(false);
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    let finalComment = newComment;
    if (replyingTo) {
      const cleanPreview = replyingTo.text
        .replace(/^> .*?\n/gm, '')
        .replace(/<[^>]*>?/gm, '')
        .trim();
      const truncated = cleanPreview.length > 80 ? cleanPreview.substring(0, 80) + '...' : cleanPreview;
      finalComment = `> **@${replyingTo.username}**: ${truncated}\n${newComment}`;
    }

    const lowerComment = newComment.toLowerCase();
    const isPrivateAI = lowerComment.includes('@ai (private)');
    const isTeamAI =
      lowerComment.includes('@smart assistant') || lowerComment.includes('@ai (team)') || lowerComment.includes('@ai');

    if (isPrivateAI || isTeamAI) {
      if (handleAskAITaskChat && !isAiReplying) {
        handleAskAITaskChat(
          selectedTask.id,
          finalComment,
          newComment.trim(),
          () => {
            handleCommentChange('');
            setReplyingTo(null);
          },
          isPrivateAI
        );
        return;
      }
    }

    handleAddComment(e, finalComment);
    setReplyingTo(null);
  };

  return (
    <div
      className={
        isInline
          ? `flex flex-col h-full w-full bg-white dark:bg-neutral-950 lg:border-l border-neutral-200 dark:border-neutral-800 shadow-[-10px_0_20px_rgba(0,0,0,0.05)] dark:shadow-[-10px_0_20px_rgba(0,0,0,0.2)] relative z-10 transition-transform duration-500 ease-in-out min-h-0 ${
              isClosing ? 'translate-x-full' : 'translate-x-0 mac-slide-in'
            }`
          : `fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-100 p-3 sm:p-4 transition-opacity duration-200 ${
              isClosing ? 'opacity-0' : 'opacity-100'
            }`
      }
    >
      <div
        className={
          isInline
            ? `flex flex-col flex-1 h-full overflow-hidden min-h-0`
            : `bg-white dark:bg-neutral-950 shadow-2xl border border-neutral-200 dark:border-neutral-800 rounded-3xl md:rounded-[2.5rem] w-full max-w-6xl flex flex-col h-[95vh] overflow-hidden transition-all duration-300 ${
                isClosing ? 'mac-exit' : 'mac-animate'
              }`
        }
      >
        <TaskDetailHeader
          isInline={isInline}
          isEditing={isEditing}
          selectedTask={selectedTask}
          handleDirectStatusChange={handleDirectStatusChange}
          columns={columns}
          isPreviewMode={isPreviewMode}
          accountStatus={accountStatus}
          isTaskAdmin={isTaskAdmin}
          isSubtasksLoading={isSubtasksLoading}
          close={close}
          tMsg={tMsg}
        />

        <div
          className={`flex w-full border-b border-neutral-200 dark:border-neutral-800 shrink-0 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl z-20 ${
            isInline ? '' : 'lg:hidden'
          }`}
        >
          <button
            onClick={() => setMobileTab('details')}
            className={`flex-1 py-3 text-[10px] sm:text-xs uppercase tracking-wider transition-colors ${
              mobileTab === 'details'
                ? 'font-black text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/10'
                : 'font-bold text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            📝 {tMsg('Details', 'Detail')}
          </button>
          <button
            onClick={() => setMobileTab('activity')}
            className={`flex-1 py-3 text-[10px] sm:text-xs uppercase tracking-wider transition-colors ${
              mobileTab === 'activity'
                ? 'font-black text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/10'
                : 'font-bold text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            💬 {tMsg('Activity', 'Aktivitas')}
          </button>
        </div>

        <div className={`flex flex-col flex-1 overflow-hidden min-h-0 ${isInline ? '' : 'lg:flex-row'}`}>
          <div
            className={`flex-1 min-w-0 flex flex-col min-h-0 ${
              mobileTab === 'details' ? 'flex' : isInline ? 'hidden' : 'hidden lg:flex'
            }`}
          >
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="flex flex-col h-full overflow-hidden min-h-0">
                <div
                  className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar ${
                    isInline ? 'p-4 sm:p-5' : 'p-5 sm:p-8'
                  }`}
                >
                  <div className="mb-8 mt-1">
                    <input
                      type="text"
                      value={editFormData.project_name}
                      onChange={(e) => setEditFormData({ ...editFormData, project_name: e.target.value })}
                      className="w-full text-lg font-extrabold bg-transparent border-0 border-b-2 border-neutral-200 dark:border-neutral-800 focus:border-black dark:focus:border-white focus:ring-0 px-0 py-3 text-black dark:text-white placeholder-neutral-400 transition-colors outline-none"
                      placeholder={tMsg('Enter task name...', 'Masukkan judul tugas...')}
                      autoFocus
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 mb-8">
                    <div className="flex-1 bg-neutral-50 dark:bg-neutral-900 p-5 border border-neutral-100 dark:border-neutral-800 rounded-2xl flex flex-col justify-center">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                        {tMsg('Created At', 'Dibuat Pada')}
                      </p>
                      <p className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                        {formatDateMMM(selectedTask.timestamp)}
                      </p>
                    </div>

                    <div className="flex-1 bg-neutral-50 dark:bg-neutral-900 p-5 border border-neutral-100 dark:border-neutral-800 rounded-2xl group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all flex flex-col justify-center relative">
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                        {tMsg('Project', 'Proyek')}
                      </label>
                      <select
                        value={editFormData.board_id || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, board_id: parseInt(e.target.value) })}
                        className="w-full bg-transparent border-0 focus:ring-0 p-0 text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider truncate [&>option]:bg-white dark:[&>option]:bg-neutral-950 appearance-none z-10 relative"
                      >
                        {boards.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 mt-2 pointer-events-none text-neutral-400 text-xs font-bold z-0">
                        ▼
                      </div>
                    </div>

                    {selectedTask.completed_time && (
                      <div className="flex-1 bg-black dark:bg-white p-5 rounded-2xl shadow-lg">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 dark:text-neutral-500 mb-1">
                          {tMsg('Completed At', 'Selesai Pada')}
                        </p>
                        <p className="text-xs font-bold text-white dark:text-black uppercase tracking-wider">
                          {formatDateMMM(selectedTask.completed_time)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 relative z-50">
                      <div className="flex items-center gap-2 sm:gap-4 group relative z-50 min-w-0">
                        <span
                          className="text-neutral-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors w-8 flex justify-center text-xl"
                          title={
                            editFormData.requester?.includes('@')
                              ? tMsg('Assignee', 'Pekerja')
                              : tMsg('Requester', 'Peminta')
                          }
                        >
                          {editFormData.requester?.includes('@') ? '👉' : <IconPerson className="w-6 h-6" />}
                        </span>
                        <div className="flex-1 min-w-0 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center relative">
                          <input
                            type="text"
                            value={editFormData.requester}
                            onChange={(e) => handleRequesterChange(e.target.value, setEditFormData, editFormData)}
                            onKeyDown={(e) => {
                              if (isMentioning) {
                                const filtered = globalMentionOptions.filter((m) =>
                                  m.toLowerCase().includes(mentionQuery)
                                );
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setMentionIndex((prev) => (prev + 1) % (filtered.length || 1));
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setMentionIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
                                } else if (e.key === 'Enter' || e.key === 'Tab') {
                                  e.preventDefault();
                                  if (filtered.length > 0)
                                    insertMention(filtered[mentionIndex] || filtered[0], setEditFormData, editFormData);
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  setIsMentioning(false);
                                }
                              }
                            }}
                            className="w-full bg-transparent border-0 focus:ring-0 p-3.5 text-xs font-bold text-black dark:text-white outline-none placeholder-neutral-400 placeholder:text-[9px] sm:placeholder:text-[10px]"
                            required
                            placeholder={tMsg(
                              'Requester name (or type @ to assign someone)',
                              'Nama peminta (atau ketik @ untuk menugaskan)'
                            )}
                            autoComplete="off"
                          />

                          {isMentioning && (
                            <div className="absolute left-0 top-full mt-2 w-full bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl z-50 max-h-40 overflow-y-auto py-2 mac-animate">
                              {globalMentionOptions.filter((m) => m.toLowerCase().includes(mentionQuery)).length > 0 ? (
                                globalMentionOptions
                                  .filter((m) => m.toLowerCase().includes(mentionQuery))
                                  .map((m, idx) => (
                                    <div
                                      key={m}
                                      className={`px-4 py-2.5 cursor-pointer text-xs text-black dark:text-white font-bold border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 flex items-center gap-2 ${
                                        mentionIndex === idx
                                          ? 'bg-neutral-100 dark:bg-neutral-800'
                                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                      }`}
                                      onClick={() => insertMention(m, setEditFormData, editFormData)}
                                    >
                                      <span>@{m}</span>
                                      {!teamMembers.includes(m) && (
                                        <span className="text-[8px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest ml-auto">
                                          + Auto-Invite
                                        </span>
                                      )}
                                    </div>
                                  ))
                              ) : (
                                <div className="px-4 py-3 text-xs text-neutral-400 font-bold italic">
                                  {tMsg('No members found', 'Tidak ada anggota ditemukan')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4 group min-w-0">
                        <span
                          className="text-neutral-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors w-8 flex justify-center text-xl"
                          title="Status"
                        >
                          📌
                        </span>
                        <div
                          className={`flex-1 min-w-0 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 transition-all flex items-center ${
                            isSubtasksLoading ? 'opacity-70' : 'focus-within:bg-white dark:focus-within:bg-black'
                          }`}
                        >
                          <select
                            value={editFormData.status}
                            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                            disabled={isSubtasksLoading}
                            className="w-full bg-transparent border-0 focus:ring-0 p-3.5 text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider truncate [&>option]:bg-white dark:[&>option]:bg-neutral-950 [&>option]:text-black dark:[&>option]:text-white disabled:cursor-not-allowed"
                          >
                            {columns.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-2 sm:mt-6">
                      <div className="group">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest items-center gap-2">
                            <span className="text-base">🗓️</span> {tMsg('Start Date', 'Tanggal Mulai')}
                          </label>
                          <span className="text-[9px] font-bold text-indigo-500">
                            {formatDateMMM(editFormData.start_date)}
                          </span>
                        </div>
                        <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center">
                          <input
                            type="date"
                            value={editFormData.start_date}
                            onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
                            className="w-full bg-transparent border-0 focus:ring-0 p-3.5 text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider"
                            required
                          />
                        </div>
                      </div>
                      <div className="group">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest items-center gap-2">
                            <span className="text-base">📅</span> {tMsg('Deadline', 'Tenggat Waktu')}
                          </label>
                          <span className="text-[9px] font-bold text-indigo-500">
                            {formatDateMMM(editFormData.deadline)}
                          </span>
                        </div>
                        <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center">
                          <input
                            type="date"
                            value={editFormData.deadline}
                            onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                            className="w-full bg-transparent border-0 focus:ring-0 p-3.5 text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:gap-6 mt-2 sm:mt-6">
                      <div className="group">
                        <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest mb-2 items-center gap-2">
                          <span className="text-base">📂</span> {tMsg('Category', 'Kategori')}
                        </label>
                        <div className="flex gap-1.5 sm:gap-2">
                          <div className="flex-1 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center min-w-0">
                            <select
                              value={editFormData.category || categories[0] || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                              className="w-full bg-transparent border-0 focus:ring-0 p-3.5 text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider truncate [&>option]:bg-white dark:[&>option]:bg-neutral-950"
                            >
                              {categories.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenAddBoard('Category')}
                            className="bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 px-3 sm:px-4 rounded-2xl transition-colors text-sm font-bold flex items-center justify-center shrink-0 shadow-sm"
                            title={tMsg('Add New Category', 'Tambah Kategori Baru')}
                          >
                            ➕
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-2 sm:mt-6">
                      <div className="group min-w-0">
                        <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest mb-2 items-center gap-2 truncate">
                          <span className="text-base hidden sm:inline">🔁</span> {tMsg('Recurring', 'Berulang')}
                        </label>
                        <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center">
                          <select
                            value={editFormData.recurring || 'none'}
                            onChange={(e) => setEditFormData({ ...editFormData, recurring: e.target.value })}
                            className="w-full bg-transparent border-0 focus:ring-0 p-3.5 text-[10px] sm:text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider truncate [&>option]:bg-white dark:[&>option]:bg-neutral-950"
                          >
                            <option value="none">{tMsg('None', 'Tidak')}</option>
                            <option value="daily">{tMsg('Daily', 'Harian')}</option>
                            <option value="weekly">{tMsg('Weekly', 'Mingguan')}</option>
                            <option value="monthly">{tMsg('Monthly', 'Bulanan')}</option>
                          </select>
                        </div>
                      </div>
                      <div className="group col-span-1">
                        <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest mb-2 items-center gap-2 min-h-4 truncate">
                          <span className="text-base hidden sm:inline">💥</span> {tMsg('Impact', 'Dampak')}
                        </label>
                        <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center">
                          <select
                            value={editFormData.impact || 'Medium'}
                            onChange={(e) => setEditFormData({ ...editFormData, impact: e.target.value })}
                            className="w-full bg-transparent border-0 focus:ring-0 p-3.5 text-[10px] sm:text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider truncate [&>option]:bg-white dark:[&>option]:bg-neutral-950"
                          >
                            <option value="High">🔥 High</option>
                            <option value="Medium">⚡ Medium</option>
                            <option value="Low">🧊 Low</option>
                          </select>
                        </div>
                      </div>
                      <div className="group col-span-1">
                        <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest mb-2 items-center gap-2 min-h-4 truncate">
                          <span className="text-base hidden sm:inline">⏳</span> {tMsg('ETC (Hrs)', 'ETC (Jam)')}
                          <span
                            className="cursor-help text-neutral-400 font-normal normal-case tracking-normal"
                            title="Estimated Time Consumption"
                          >
                            🛈
                          </span>
                        </label>
                        <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center p-1 sm:pr-1">
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={editFormData.etc}
                            onChange={(e) => setEditFormData({ ...editFormData, etc: parseFloat(e.target.value) || 2 })}
                            className="w-full min-w-0 text-center sm:text-left bg-transparent border-0 focus:ring-0 p-2.5 sm:p-3.5 text-[10px] sm:text-xs font-bold text-black dark:text-white cursor-pointer outline-none uppercase tracking-wider"
                            required
                          />
                          <button
                            type="button"
                            onClick={handleEstimateEtc}
                            disabled={isEstimatingEtc}
                            className="shrink-0 text-[10px] font-bold px-1.5 sm:px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg sm:rounded-xl shadow-sm border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-colors"
                            title="AI Estimate"
                          >
                            {isEstimatingEtc ? (
                              '⏳'
                            ) : (
                              <>
                                <span className="sm:hidden">✨</span>
                                <span className="hidden sm:inline">✨ AI Est.</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="group pt-2">
                      <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest mb-2 items-center gap-2">
                        <span className="text-base">📝</span> {tMsg('Description', 'Deskripsi')}
                      </label>
                      <div className="bg-neutral-100 dark:bg-neutral-900 rounded-3xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all p-2">
                        <div className="flex gap-2 mb-2 px-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                          <button
                            type="button"
                            onClick={() =>
                              setEditFormData({
                                ...editFormData,
                                description: (editFormData.description || '') + '**bold text**',
                              })
                            }
                            className="text-[10px] font-bold px-2.5 py-1 bg-white dark:bg-black rounded-md shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50"
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditFormData({
                                ...editFormData,
                                description: (editFormData.description || '') + '*italic text*',
                              })
                            }
                            className="text-[10px] font-bold px-2.5 py-1 bg-white dark:bg-black rounded-md shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 italic"
                          >
                            I
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditFormData({
                                ...editFormData,
                                description: (editFormData.description || '') + '__underline__',
                              })
                            }
                            className="text-[10px] font-bold px-2.5 py-1 bg-white dark:bg-black rounded-md shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 underline"
                          >
                            U
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditFormData({
                                ...editFormData,
                                description: (editFormData.description || '') + '\n- list item',
                              })
                            }
                            className="text-[10px] font-bold px-2.5 py-1 bg-white dark:bg-black rounded-md shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50"
                          >
                            • List
                          </button>
                          <button
                            type="button"
                            onClick={handleGenerateDesc}
                            disabled={isGeneratingDesc}
                            className="ml-auto text-[10px] font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md shadow-sm border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 flex items-center gap-1 transition-colors"
                          >
                            {isGeneratingDesc ? '⏳...' : '✨ Auto Generate'}
                          </button>
                        </div>
                        <textarea
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          className="w-full bg-transparent border-0 focus:ring-0 p-3.5 text-sm font-medium text-black dark:text-white min-h-25 resize-y outline-none placeholder-neutral-400 leading-relaxed"
                          placeholder={tMsg('Add details or notes...', 'Tambahkan detail atau catatan...')}
                        ></textarea>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-2 ml-4 font-medium italic">
                        {tMsg(
                          'Rich text supported: **bold**, *italic*, __underline__, and new lines starting with "- " for bullets.',
                          'Dukungan teks kaya: **tebal**, *miring*, __garis bawah__, dan baris baru dengan "- " untuk poin.'
                        )}
                      </p>
                    </div>

                    <div className="group pt-2">
                      <label className="block text-[10px] font-bold text-neutral-500 group-focus-within:text-black dark:group-focus-within:text-white uppercase tracking-widest mb-2 items-center gap-2">
                        <span className="text-base">🔗</span>{' '}
                        {tMsg('External Links / Supporting Access', 'Tautan Eksternal / Akses Pendukung')}
                      </label>
                      <div className="flex flex-col gap-2 w-full min-w-0">
                        {(editFormData.supporting_access ? editFormData.supporting_access.split('\n') : ['']).map(
                          (link, idx, arr) => (
                            <div key={idx} className="flex items-center gap-2 w-full min-w-0">
                              <div className="flex-1 min-w-0 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-black transition-all flex items-center">
                                <input
                                  type="url"
                                  value={link}
                                  onChange={(e) => {
                                    const newLinks = [...arr];
                                    newLinks[idx] = e.target.value;
                                    setEditFormData({ ...editFormData, supporting_access: newLinks.join('\n') });
                                  }}
                                  className="w-full bg-transparent border-0 focus:ring-0 p-3.5 text-sm font-medium text-black dark:text-white outline-none placeholder-neutral-400"
                                  placeholder={tMsg('Paste URL (<https://...)>', 'Tempel URL (<https://...)>')}
                                />
                              </div>
                              {arr.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newLinks = arr.filter((_, i) => i !== idx);
                                    setEditFormData({ ...editFormData, supporting_access: newLinks.join('\n') });
                                  }}
                                  className="text-neutral-400 hover:text-red-500 font-bold p-2 transition-colors"
                                  title="Remove Link"
                                >
                                  ✖
                                </button>
                              )}
                            </div>
                          )
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const arr = editFormData.supporting_access
                              ? editFormData.supporting_access.split('\n')
                              : [''];
                            setEditFormData({ ...editFormData, supporting_access: [...arr, ''].join('\n') });
                          }}
                          className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 self-start mt-1 flex items-center gap-1.5 uppercase tracking-widest transition-colors bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg"
                        >
                          <span>➕</span> {tMsg('Add Another Link', 'Tambah Tautan Lainnya')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`py-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 shrink-0 bg-white dark:bg-neutral-950 sticky bottom-0 z-30 ${
                    isInline ? 'px-4 sm:px-5' : 'px-5 sm:px-8'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="w-full sm:w-auto px-6 py-4 sm:py-3 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors uppercase tracking-widest text-xs"
                  >
                    {tMsg('Cancel', 'Batal')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubtasksLoading || isSubmitting}
                    className={`w-full sm:w-auto px-8 py-4 sm:py-3 rounded-full font-bold text-white transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-black dark:border-white ${
                      isSubmitting
                        ? 'bg-neutral-600 dark:bg-neutral-400 dark:text-neutral-900 border-neutral-600 dark:border-neutral-400'
                        : 'bg-black dark:bg-white dark:text-black hover:opacity-80 hover:-translate-y-0.5'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner /> {tMsg('Saving...', 'Menyimpan...')}
                      </>
                    ) : (
                      tMsg('Save Changes', 'Simpan Perubahan')
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col h-full overflow-hidden min-h-0">
                <div
                  className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-6 text-black dark:text-white ${
                    isInline ? 'p-4 sm:p-5' : 'p-5 sm:p-8'
                  }`}
                >
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 sm:gap-0 mb-3 pb-3 pt-1 border-b border-neutral-100 dark:border-neutral-800/50">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest min-w-0">
                        <span
                          className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 shrink-0 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                          title={tMsg('Copy Task Link', 'Salin Tautan Tugas')}
                          onClick={() => {
                            const slug = (selectedTask.project_name || '')
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)+/g, '');
                            const url = `${window.location.origin}/task/${selectedTask.id}-${slug}`;
                            navigator.clipboard.writeText(url);
                            if (showNotification)
                              showNotification(
                                tMsg('Task link copied to clipboard!', 'Tautan tugas disalin ke papan klip!'),
                                'success'
                              );
                          }}
                        >
                          #{selectedTask.id} 🔗
                        </span>
                        <span className="text-neutral-300 dark:text-neutral-700 shrink-0">/</span>
                        {selectedTask.board_name && selectedTask.board_name !== 'Unknown' && (
                          <>
                            <span
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline cursor-pointer flex items-center gap-1 transition-colors bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-800/50 max-w-37.5 truncate"
                              onClick={() => {
                                if (boards && setSelectedBoard) {
                                  const targetBoard = boards.find((b) => b.id === selectedTask.board_id);
                                  if (targetBoard) {
                                    setSelectedBoard(targetBoard);
                                    setSelectedTask(null);
                                  }
                                }
                              }}
                              title={`Go to Project: ${selectedTask.board_name}`}
                            >
                              <span className="truncate">📂 {selectedTask.board_name}</span>
                            </span>
                            <span className="text-neutral-300 dark:text-neutral-700 shrink-0">/</span>
                          </>
                        )}
                        <span
                          className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 shrink-0 truncate max-w-25"
                          title={selectedTask.category}
                        >
                          {selectedTask.category}
                        </span>
                        <span className="text-neutral-300 dark:text-neutral-700 shrink-0">/</span>
                        <span
                          className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 shrink-0 truncate max-w-30"
                          title={tMsg('Created by', 'Dibuat oleh') + `: @${selectedTask.owner_username}`}
                        >
                          <IconPerson className="w-3 h-3 shrink-0" />{' '}
                          <span className="truncate">@{selectedTask.owner_username}</span>
                        </span>
                      </div>
                      <span
                        className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1 shrink-0 sm:ml-2"
                        title="Date Created"
                      >
                        📅 {formatDateMMM(selectedTask.timestamp)}
                      </span>
                    </div>
                    <p className="text-lg font-extrabold wrap-break-word">{selectedTask.project_name || 'Untitled Task'}</p>
                  </div>
                  <TaskDetailSidebar
                    selectedTask={selectedTask}
                    tMsg={tMsg}
                    queuePosition={queuePosition}
                    totalQueue={totalQueue}
                    mainAssignee={mainAssignee}
                    queueType={queueType}
                    queueLabel={queueLabel}
                    formatDateMMM={formatDateMMM}
                    openCalendarPopup={openCalendarPopup}
                    generateGoogleMeetScheduleUrl={generateGoogleMeetScheduleUrl}
                    generateGoogleCalendarUrl={generateGoogleCalendarUrl}
                    isPreviewMode={isPreviewMode}
                    setIsNudgeConfirmOpen={setIsNudgeConfirmOpen}
                    isGeneratingNudge={isGeneratingNudge}
                    hasAnyAssignee={hasAnyAssignee}
                    isTaskAdmin={isTaskAdmin}
                    accountStatus={accountStatus}
                    handleToggleAutoNudge={handleToggleAutoNudge}
                    setSelectedTask={setSelectedTask}
                    showNotification={showNotification}
                  />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 dark:text-neutral-400 mb-2">
                      {tMsg('Description', 'Deskripsi')}
                    </p>
                    {isPreviewMode ? (
                      <div className="relative">
                        <div className="whitespace-pre-wrap wrap-break-word bg-neutral-50 dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800 text-sm font-medium leading-relaxed max-h-60 overflow-hidden text-neutral-600 dark:text-neutral-300 filter blur-xs select-none opacity-60">
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
                          labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                          laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
                          voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-black/80 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-widest shadow-xl backdrop-blur-md text-center">
                            🔒{' '}
                            {currentUser
                              ? tMsg('Project Members Only', 'Khusus Anggota Proyek')
                              : tMsg('Login to View Description', 'Login untuk Melihat Deskripsi')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap wrap-break-word bg-neutral-50 dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800 text-sm font-medium leading-relaxed max-h-60 overflow-y-auto text-neutral-600 dark:text-neutral-300">
                        {renderRichText(selectedTask.description)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 dark:text-neutral-400">
                        {tMsg('Supporting Access', 'Akses Pendukung')}
                      </p>
                      {isTaskAdmin && accountStatus !== 'suspended' && !isAddingLink && !isPreviewMode && (
                        <button
                          onClick={() => setIsAddingLink(true)}
                          className="text-[9px] font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 uppercase tracking-widest"
                        >
                          <span>➕</span> {tMsg('Add Link', 'Tambah Tautan')}
                        </button>
                      )}
                    </div>
                    {((!selectedTask.supporting_access || !selectedTask.supporting_access.trim()) && !isAddingLink) ||
                    isPreviewMode ? (
                      <span className="text-neutral-400 dark:text-neutral-600 font-medium text-sm">-</span>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {(selectedTask.supporting_access || '')
                          .split('\n')
                          .filter((l) => l.trim())
                          .map((link, idx) => {
                            const trimmedLink = link.trim();
                            const isUrl = trimmedLink.startsWith('http://') || trimmedLink.startsWith('https://');
                            if (!isUrl)
                              return (
                                <span key={idx} className="text-sm text-neutral-600 dark:text-neutral-400 break-all">
                                  {trimmedLink}
                                </span>
                              );

                            const isDrive =
                              trimmedLink.includes('drive.google.com') || trimmedLink.includes('docs.google.com');
                            const isFigma = trimmedLink.includes('figma.com');
                            const isOneDrive =
                              trimmedLink.includes('sharepoint.com') ||
                              trimmedLink.includes('onedrive.live.com') ||
                              trimmedLink.includes('1drv.ms');

                            let cardClass =
                              'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-indigo-700';
                            let iconClass = 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';
                            let icon = '🔗';
                            let title = 'External Attachment';

                            if (isDrive) {
                              cardClass =
                                'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700';
                              iconClass = 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400';
                              icon = '📂';
                              title = 'Google Workspace Asset';
                            } else if (isFigma) {
                              cardClass =
                                'bg-pink-50/50 dark:bg-pink-900/10 border-pink-100 dark:border-pink-800/50 hover:border-pink-300 dark:hover:border-pink-700';
                              iconClass = 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400';
                              icon = '🎨';
                              title = 'Figma Design Asset';
                            } else if (isOneDrive) {
                              cardClass =
                                'bg-cyan-50/50 dark:bg-cyan-900/10 border-cyan-100 dark:border-cyan-800/50 hover:border-cyan-300 dark:hover:border-cyan-700';
                              iconClass = 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400';
                              icon = '☁️';
                              title = 'Microsoft OneDrive Asset';
                            }

                            return (
                              <div key={idx} className="flex items-center gap-2 w-full min-w-0">
                                <a
                                  href={trimmedLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex-1 min-w-0 flex items-center gap-4 p-3 md:p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all group ${cardClass}`}
                                >
                                  <div
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0 group-hover:scale-110 transition-transform ${iconClass}`}
                                  >
                                    {icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm sm:text-base text-black dark:text-white truncate">
                                      {title}
                                    </p>
                                    <p className="text-[10px] font-medium tracking-wide mt-0.5 truncate text-neutral-500 dark:text-neutral-400">
                                      {trimmedLink.replace(/^https?:\/\//, '')}
                                    </p>
                                  </div>
                                  <div className="text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                      ></path>
                                    </svg>
                                  </div>
                                </a>
                                {isTaskAdmin && accountStatus !== 'suspended' && handleQuickLinkRemove && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setLinkToRemove(trimmedLink);
                                    }}
                                    className="p-3 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-colors shrink-0"
                                    title={tMsg('Remove Link', 'Hapus Tautan')}
                                  >
                                    ✖
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        {isAddingLink && (
                          <form onSubmit={submitQuickLink} className="flex items-center gap-2 mt-1">
                            <input
                              type="url"
                              required
                              value={newLinkUrl}
                              onChange={(e) => setNewLinkUrl(e.target.value)}
                              placeholder="https://..."
                              className="flex-1 bg-neutral-100 dark:bg-neutral-900 border border-transparent focus:bg-white dark:focus:bg-black focus:border-indigo-500 rounded-xl px-4 py-3 text-sm outline-none transition-all shadow-sm"
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="bg-indigo-600 text-white px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingLink(false);
                                setNewLinkUrl('');
                              }}
                              className="bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors shadow-sm"
                            >
                              Cancel
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>

                   <TaskDetailSubtasks
                    tMsg={tMsg}
                    selectedTask={selectedTask}
                    isPreviewMode={isPreviewMode}
                    subtasks={subtasks}
                    currentUser={currentUser}
                    isTaskAdmin={isTaskAdmin}
                    accountStatus={accountStatus}
                    isSystemTicket={isSystemTicket}
                    handleToggleSubtask={handleToggleSubtask}
                    handleUpdateSubtaskAssignee={handleUpdateSubtaskAssignee}
                    teamMembers={teamMembers}
                    handleDeleteSubtask={handleDeleteSubtask}
                    handleAddSubtask={handleAddSubtask}
                    newSubtaskName={newSubtaskName}
                    setNewSubtaskName={setNewSubtaskName}
                    newSubtaskAssignee={newSubtaskAssignee}
                    setNewSubtaskAssignee={setNewSubtaskAssignee}
                  />
                </div>

                <div
                  className={`py-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col-reverse sm:flex-row justify-between items-center gap-4 shrink-0 bg-white dark:bg-neutral-950 sticky bottom-0 z-30 ${
                    isInline ? 'px-4 sm:px-5' : 'px-5 sm:px-8'
                  }`}
                >
                  {!isPreviewMode &&
                  (isSuperAdmin ||
                    selectedTask.owner_username === currentUser ||
                    (selectedBoard && selectedBoard.owner_username === currentUser)) &&
                  accountStatus !== 'suspended' ? (
                    <button
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      className="px-5 py-3.5 w-full sm:w-auto rounded-full font-bold text-red-500 hover:text-white bg-transparent hover:bg-red-500 border border-transparent hover:border-red-500 transition-all uppercase tracking-widest text-xs"
                    >
                      🗑️ {tMsg('Delete Task', 'Hapus Tugas')}
                    </button>
                  ) : (
                    <div></div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                    {accountStatus !== 'suspended' && isTaskAdmin && !isPreviewMode && (
                      <button
                        onClick={startEditing}
                        className="w-full sm:w-auto px-6 py-4 sm:py-3.5 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors uppercase tracking-widest text-xs"
                      >
                        ✏️ {tMsg('Edit', 'Edit')}
                      </button>
                    )}
                    <button
                      onClick={close}
                      className="w-full sm:w-auto px-8 py-4 sm:py-3.5 rounded-full font-bold text-white bg-black hover:opacity-80 dark:bg-white dark:text-black border border-black dark:border-white shadow-lg transition-all uppercase tracking-widest text-xs hover:-translate-y-0.5"
                    >
                      {tMsg('Close', 'Tutup')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Comments & Activity) */}
          <div
            className={`w-full shrink-0 flex-col h-full z-10 relative bg-cover bg-center ${
              isInline ? '' : 'lg:w-100 xl:w-112.5 lg:border-l lg:h-auto border-t lg:border-t-0'
            } border-neutral-200 dark:border-neutral-800 ${
              mobileTab === 'activity' ? 'flex' : isInline ? 'hidden' : 'hidden lg:flex'
            } ${!chatBg ? 'bg-neutral-50/50 dark:bg-neutral-900/30' : ''}`}
            style={
              chatBg
                ? chatBg.startsWith('data:image')
                  ? { backgroundImage: `url(${chatBg})` }
                  : { background: chatBg }
                : {}
            }
          >
            {chatBg && (
              <div className="absolute inset-0 bg-white/40 dark:bg-black/60 backdrop-blur-[2px] z-0 pointer-events-none"></div>
            )}

            {isPreviewMode ? (
              <div className="flex-1 flex items-center justify-center relative z-20">
                <div className="z-10 text-center p-6 sm:p-8 bg-white/80 dark:bg-black/80 backdrop-blur-md m-4 sm:m-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl">
                  <div className="text-5xl mb-6 drop-shadow-md">💬</div>
                  <h3 className="text-xl font-black text-black dark:text-white uppercase mb-3">
                    {currentUser
                      ? tMsg('Private Workspace', 'Ruang Kerja Terkunci')
                      : tMsg('Join the Conversation', 'Bergabung dalam Percakapan')}
                  </h3>
                  <p className="text-sm text-neutral-500 font-medium mb-8 leading-relaxed max-w-xs mx-auto">
                    {currentUser
                      ? tMsg(
                          'Ask the project owner to invite you to this workspace, or click the button below to send a request.',
                          'Minta pemilik proyek untuk mengundang Anda, atau klik tombol di bawah untuk mengirim permintaan akses.'
                        )
                      : tMsg(
                          'Sign in to collaborate, view activity logs, chat with the team, and manage this task.',
                          'Masuk untuk berkolaborasi, melihat log aktivitas, mengobrol dengan tim, dan mengelola tugas ini.'
                        )}
                  </p>
                  {currentUser ? (
                    <button
                      disabled={hasRequestedAccess}
                      onClick={() => {
                        axios
                          .post(`/api/boards/${selectedTask.board_id}/request-access?task_id=${selectedTask.id}`)
                          .then((res) => {
                            setHasRequestedAccess(true);
                            if (showNotification) showNotification(res.data.message, 'success');
                          })
                          .catch((err) => {
                            if (showNotification)
                              showNotification(err.response?.data?.detail || 'Failed to send request', 'error');
                          });
                      }}
                      className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-full text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                    >
                      {hasRequestedAccess
                        ? tMsg('✓ Request Sent', '✓ Permintaan Terkirim')
                        : tMsg('Request Access', 'Minta Akses')}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        close();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-full text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
                    >
                      {tMsg('Sign In to Workspace', 'Masuk ke Ruang Kerja')}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div
                  className={`flex flex-col border-b border-neutral-200 dark:border-neutral-800 shrink-0 relative z-20 ${
                    chatBg ? 'bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md' : 'bg-white dark:bg-neutral-950'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="flex flex-1">
                      <button
                        onClick={() => setActiveTab('comments')}
                        className={`flex-1 py-4 text-[10px] sm:text-xs uppercase tracking-wider transition-colors ${
                          activeTab === 'comments'
                            ? 'font-black text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/10'
                            : 'font-bold text-neutral-400 hover:text-black dark:hover:text-white'
                        }`}
                      >
                        💬 {tMsg('Comments', 'Komentar')} ({regularComments.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('activity')}
                        className={`flex-1 py-4 text-[10px] sm:text-xs uppercase tracking-wider transition-colors ${
                          activeTab === 'activity'
                            ? 'font-black text-black dark:text-white border-b-2 border-black dark:border-white bg-neutral-100/50 dark:bg-neutral-800/50'
                            : 'font-bold text-neutral-400 hover:text-black dark:hover:text-white'
                        }`}
                      >
                        📜 {tMsg('Activity', 'Aktivitas')}
                      </button>
                    </div>
                    {activeTab === 'comments' && (
                      <div className="flex items-center gap-2 px-4 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsTaskChatSearchOpen(!isTaskChatSearchOpen)}
                          className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                            isTaskChatSearchOpen
                              ? 'bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white'
                              : 'text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800'
                          }`}
                          title={tMsg('Search Comments', 'Cari Komentar')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            ></path>
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={handleStartTaskMeet}
                          className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors uppercase tracking-widest"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            ></path>
                          </svg>
                          <span className="hidden sm:inline">Meet Now</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {activeTab === 'comments' && isTaskChatSearchOpen && (
                  <div className="relative w-full border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50 p-2 mac-animate shrink-0 z-20">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">🔍</span>
                    <input
                      type="text"
                      placeholder={tMsg('Search comments...', 'Cari komentar...')}
                      value={taskChatSearchQuery}
                      onChange={(e) => setTaskChatSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl pl-8 pr-4 py-2 text-xs font-medium text-black dark:text-white outline-none focus:border-indigo-500 transition-colors shadow-inner"
                      autoFocus
                    />
                    {taskChatSearchQuery && (
                      <div className="absolute top-full mt-2 left-2 right-2 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-700 shadow-2xl rounded-xl z-50 max-h-64 overflow-y-auto custom-scrollbar mac-animate">
                        {regularComments
                          .filter((c) => {
                            const keywords = taskChatSearchQuery.toLowerCase().split(/\s+/).filter(Boolean);
                            const combinedText = [c.text, c.username].join(' ').toLowerCase();
                            return keywords.every((kw) => combinedText.includes(kw));
                          })
                          .map((c) => (
                            <div
                              key={`search-${c.id}`}
                              onClick={() => {
                                setTaskChatSearchQuery('');
                                setIsTaskChatSearchOpen(false);
                                const el = document.getElementById(`task-chat-msg-${c.id}`);
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  el.classList.add(
                                    'ring-2',
                                    'ring-indigo-500',
                                    'bg-indigo-50',
                                    'dark:bg-indigo-900/30',
                                    'rounded-2xl',
                                    'scale-[1.02]',
                                    'z-50'
                                  );
                                  setTimeout(() => {
                                    el.classList.remove(
                                      'ring-2',
                                      'ring-indigo-500',
                                      'bg-indigo-50',
                                      'dark:bg-indigo-900/30',
                                      'rounded-2xl',
                                      'scale-[1.02]',
                                      'z-50'
                                    );
                                  }, 2500);
                                }
                              }}
                              className="p-4 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex flex-col gap-1.5 text-left"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                  @{c.username}
                                </span>
                                <span className="text-[9px] font-medium text-neutral-400">
                                  {formatDateMMM(c.timestamp)}
                                </span>
                              </div>
                              <p className="text-xs text-black dark:text-white line-clamp-2">
                                <HighlightText text={stripHtml(c.text)} query={taskChatSearchQuery} />
                              </p>
                            </div>
                          ))}
                        {regularComments.filter((c) => {
                          const keywords = taskChatSearchQuery.toLowerCase().split(/\s+/).filter(Boolean);
                          const combinedText = [c.text, c.username].join(' ').toLowerCase();
                          return keywords.every((kw) => combinedText.includes(kw));
                        }).length === 0 && (
                          <div className="p-4 text-center text-xs font-bold text-neutral-500">No messages found.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div
                  ref={commentsContainerRef}
                  onScroll={handleTaskChatScroll}
                  className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-5 custom-scrollbar relative z-10"
                >
                  {activeTab === 'comments' && (
                    <TaskDetailComments
                      isTaskChatSearchOpen={isTaskChatSearchOpen}
                      setIsTaskChatSearchOpen={setIsTaskChatSearchOpen}
                      taskChatSearchQuery={taskChatSearchQuery}
                      setTaskChatSearchQuery={setTaskChatSearchQuery}
                      regularComments={regularComments}
                      comments={comments}
                      formatDateMMM={formatDateMMM}
                      hasMoreComments={hasMoreComments}
                      loadMoreComments={loadMoreComments}
                      currentUser={currentUser}
                      avatarsMap={avatarsMap}
                      firstUnreadId={firstUnreadId}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                      handleDeleteComment={handleDeleteComment}
                      showNotification={showNotification}
                      handleToggleReaction={handleToggleReaction}
                      isInvolved={isInvolved}
                      isSuperAdmin={isSuperAdmin}
                      accountStatus={accountStatus}
                      isAiReplying={isAiReplying}
                      commentsEndRef={commentsEndRef}
                      tMsg={tMsg}
                    />
                  )}

                  {activeTab === 'activity' && (
                    <TaskDetailActivity
                      activityLogs={activityLogs}
                      tMsg={tMsg}
                      formatDateMMM={formatDateMMM}
                    />
                  )}
                </div>

                {activeTab === 'comments' && accountStatus !== 'suspended' && (
                  <div
                    className={`p-4 border-t border-neutral-200 dark:border-neutral-800 shrink-0 relative z-10 ${
                      chatBg ? 'bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md' : 'bg-white dark:bg-neutral-950'
                    }`}
                  >
                    <TaskDetailCommentForm
                      isInvolved={isInvolved}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                      taskLatestMentionId={taskLatestMentionId}
                      setTaskLatestMentionId={setTaskLatestMentionId}
                      setDismissedTaskMentions={setDismissedTaskMentions}
                      comments={comments}
                      currentUser={currentUser}
                      showTaskScrollBottom={showTaskScrollBottom}
                      setShowTaskScrollBottom={setShowTaskScrollBottom}
                      commentsEndRef={commentsEndRef}
                      handleChatSubmit={handleChatSubmit}
                      newComment={newComment}
                      handleCommentChange={handleCommentChange}
                      accountStatus={accountStatus}
                      isCommentMentioning={isCommentMentioning}
                      setIsCommentMentioning={setIsCommentMentioning}
                      selectedBoard={selectedBoard}
                      globalMentionOptions={globalMentionOptions}
                      commentMentionQuery={commentMentionQuery}
                      commentMentionIndex={commentMentionIndex}
                      setCommentMentionIndex={setCommentMentionIndex}
                      insertCommentMention={insertCommentMention}
                      teamMembers={teamMembers}
                      tMsg={tMsg}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {linkToRemove && (
          <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-70 p-4 transition-opacity duration-200 opacity-100">
            <div className="bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-sm border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] text-center mac-animate">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm">
                ⚠️
              </div>
              <h3 className="text-2xl font-black text-black dark:text-white mb-4 uppercase">
                {tMsg('Remove Link?', 'Hapus Tautan?')}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-sm font-medium leading-relaxed">
                {tMsg('Are you sure you want to remove this link?', 'Apakah Anda yakin ingin menghapus tautan ini?')}
                <br /> {tMsg('This action cannot be undone.', 'Tindakan ini tidak dapat dibatalkan.')}
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setLinkToRemove(null)}
                  className="flex-1 px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors uppercase tracking-widest text-xs"
                >
                  {tMsg('Cancel', 'Batal')}
                </button>
                <button
                  onClick={() => {
                    handleQuickLinkRemove(selectedTask.id, linkToRemove);
                    setLinkToRemove(null);
                  }}
                  className="flex-1 px-4 py-4 rounded-full font-bold text-white bg-red-500 hover:bg-red-600 shadow-md transition-all uppercase tracking-widest text-xs hover:-translate-y-0.5"
                >
                  {tMsg('Remove', 'Hapus')}
                </button>
              </div>
            </div>
          </div>
        )}
        {isNudgeConfirmOpen && (
          <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-70 p-4 transition-opacity duration-200 opacity-100">
            <div className="bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-sm border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] text-center mac-animate">
              <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm border border-amber-200 dark:border-amber-800/50">
                🔔
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-black dark:text-white mb-4 uppercase">
                {tMsg('Send Smart Nudge?', 'Kirim Pantauan Cerdas?')}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-sm font-medium leading-relaxed">
                {tMsg(
                  'The Smart Assistant will generate and send an automatic follow-up message to the assignee.',
                  'Asisten Pintar akan membuat dan mengirimkan pesan pantauan otomatis kepada pekerja.'
                )}
              </p>
              <div className="flex justify-center gap-3 sm:gap-4">
                <button
                  onClick={() => setIsNudgeConfirmOpen(false)}
                  className="flex-1 px-4 py-4 rounded-full font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors uppercase tracking-widest text-[10px] sm:text-xs"
                >
                  {tMsg('Cancel', 'Batal')}
                </button>
                <button
                  onClick={executeSmartNudge}
                  disabled={isGeneratingNudge}
                  className="flex-1 px-4 py-4 rounded-full font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md transition-all uppercase tracking-widest text-[10px] sm:text-xs hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {isGeneratingNudge ? '⏳...' : tMsg('Yes, Send', 'Ya, Kirim')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// [CACHE CLEAR TRIGGER] Memaksa server Vite memuat ulang file ini.
