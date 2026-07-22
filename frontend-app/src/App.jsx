import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDeepLinks } from './hooks/useDeepLinks';
import axios from 'axios';
import 'driver.js/dist/driver.css';
import { IconPerson, IconPlus, Avatar } from './SharedUI';
import KanbanBoard from './KanbanBoard';
import { HighlightText, stripHtml } from './Utils';
import TableList from './TableList';
import AnalyticsView from './AnalyticsView';
import CalendarView from './CalendarView';
import TimelineView from './TimelineView';
import {
  DeleteTaskModal,
  DeleteCommentModal,
  RevokeMemberModal,
  DeleteBoardModal,
  ExportModal,
  CreateBoardModal,
  TeamModal,
  InvitationsModal,
  ColumnModal,
  LeaveModal,
  FeedbackModal,
  LogoutConfirmModal,
  NotificationModal,
  WelcomeTourModal,
  ContactSupportModal,
  MyTicketsModal,
  UnfinishedSubtasksModal,
} from './Modals';
import ChangelogModal from './ChangelogModal';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import TermsOfServiceModal from './TermsOfServiceModal';
import AppThemes from './ThemeStyles';
import TaskFormModal from './TaskFormModal';
import TaskDetailModal from './TaskDetailModal';
import AdminModal from './AdminModal';
import DocumentationModal from './DocumentationModal';
import ProactiveAIModal from './ProactiveAIModal';
import ChatWorkspaceModal from './ChatWorkspaceModal';
import SystemSpecsModal from './SystemSpecsModal';
import LandingPage from './LandingPage';
import { useAppContext } from './hooks/useAppContext';
import AppModals from './components/AppModals';
import BoardFilterSort from './components/BoardFilterSort';
import ChatMessage, { renderChatMessageContent } from './ChatMessage';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import SmartAssistant from './SmartAssistant';
import SettingsPage from './SettingsPage';
import { PomodoroWidget, ProjectLifecycleBanner, LiveClock } from './Widgets';
import Sidebar from './components/Sidebar';
import MobileTopBar from './components/Layout/MobileTopBar';
import MainToolbar from './components/Layout/MainToolbar';
import HomeDashboard from './components/HomeDashboard';
import TimesheetView from './TimesheetView';

import './api/axiosSetup';

function App() {
  const {
    isAuthenticated,
    currentUser,
    isLoginMode,
    showAuthForm,
    loginUsername,
    loginPassword,
    regFullName,
    regEmail,
    regConfirmPassword,
    resetToken,
    isResetMode,
    isForgotMode,
    forgotEmail,
    tasks,
    columns,
    categories,
    colModal,
    isFormOpen,
    viewMode,
    selectedTask,
    isDeleteConfirmOpen,
    isEditing,
    editFormData,
    searchQuery,
    filterStatus,
    filterCategory,
    filterAssignee,
    showMyTasks,
    showOverdueOnly,
    groupBy,
    sortBy,
    isDarkMode,
    calDate,
    subtasks,
    isSubtasksLoading,
    newSubtaskName,
    newSubtaskAssignee,
    formData,
    formSubtasks,
    formSubtaskInput,
    formSubtaskAssignee,
    showPassword,
    showConfirmPassword,
    notification,
    isTeamModalOpen,
    isInvitesModalOpen,
    inviteInput,
    inviteSuggestions,
    invitations,
    isSettingsOpen,
    profileData,
    isMentioning,
    mentionQuery,
    isAdminModalOpen,
    adminUsers,
    comments,
    newComment,
    isAiReplying,
    handleAskAITaskChat,
    teamMembers,
    notifications,
    isNotifOpen,
    commentToDelete,
    memberToRevoke,
    avatarsMap,
    myTeam,
    boards,
    selectedBoard,
    isCreateBoardOpen,
    newBoardName,
    boardToDelete,
    deleteBoardConfirmText,
    isExportModalOpen,
    exportMode,
    exportStartDate,
    exportEndDate,
    isLeaveModalOpen,
    leaves,
    leaveForm,
    timelineDrag,
    accountStatus,
    isSuperAdmin,
    isFeedbackOpen,
    feedbackText,
    isNotifClosing,
    closeNotif,
    showTimesheets,
    setShowTimesheets,
    setIsAuthenticated,
    setCurrentUser,
    setIsLoginMode,
    setShowAuthForm,
    setLoginUsername,
    setLoginPassword,
    setRegFullName,
    setRegEmail,
    setRegConfirmPassword,
    setResetToken,
    setIsResetMode,
    setIsForgotMode,
    setForgotEmail,
    setTasks,
    setColumns,
    setCategories,
    setColModal,
    setIsFormOpen,
    setViewMode,
    setSelectedTask,
    setIsDeleteConfirmOpen,
    setIsEditing,
    setEditFormData,
    setSearchQuery,
    setFilterStatus,
    setFilterCategory,
    setFilterAssignee,
    setShowMyTasks,
    setShowOverdueOnly,
    showUnreadOnly,
    setShowUnreadOnly,
    showHasSubtasks,
    setShowHasSubtasks,
    hideCompleted,
    setHideCompleted,
    setGroupBy,
    setSortBy,
    setIsDarkMode,
    setCalDate,
    setSubtasks,
    setNewSubtaskName,
    setNewSubtaskAssignee,
    setFormData,
    setFormSubtasks,
    setFormSubtaskInput,
    setFormSubtaskAssignee,
    setShowPassword,
    setShowConfirmPassword,
    setNotification,
    setIsTeamModalOpen,
    setIsInvitesModalOpen,
    setInviteInput,
    setInviteSuggestions,
    setInvitations,
    setIsSettingsOpen,
    setProfileData,
    setIsMentioning,
    userDirectory,
    setMentionQuery,
    isCommentMentioning,
    setIsCommentMentioning,
    commentMentionQuery,
    setCommentMentionQuery,
    commentMentionIndex,
    setCommentMentionIndex,
    setIsAdminModalOpen,
    setAdminUsers,
    setComments,
    setNewComment,
    setTeamMembers,
    setNotifications,
    setIsNotifOpen,
    setCommentToDelete,
    setMemberToRevoke,
    setAvatarsMap,
    setMyTeam,
    setBoards,
    setSelectedBoard,
    setIsCreateBoardOpen,
    setNewBoardName,
    isPrivateBoard,
    setIsPrivateBoard,
    setBoardToDelete,
    setDeleteBoardConfirmText,
    setIsExportModalOpen,
    setExportMode,
    setExportStartDate,
    setExportEndDate,
    setIsLeaveModalOpen,
    setLeaves,
    setLeaveForm,
    setTimelineDrag,
    setAccountStatus,
    setIsFeedbackOpen,
    setFeedbackText,
    isSupportOpen,
    supportText,
    setIsSupportOpen,
    setSupportText,
    startTour,
    startDriverTour,
    showWelcomeTour,
    setShowWelcomeTour,
    handleOpenNewTaskForm,
    handleManualFormClick,
    loginWithGoogle,
    handleMouseDown,
    handleMouseLeave,
    handleMouseUp,
    handleMouseMove,
    showNotification,
    handleReadNotification,
    handleReadAllNotifications,
    handleNotificationTaskClick,
    handleOpenAddBoard,
    handleOpenRenameBoard,
    handleOpenDeleteBoard,
    handleColSubmit,
    handleAddSubtask,
    handleToggleSubtask,
    handleDeleteSubtask,
    handleSubtaskDragEnd,
    handleCommentChange,
    insertCommentMention,
    handleAddComment,
    handleDeleteComment,
    confirmDeleteComment,
    onDragEnd,
    handleRequesterChange,
    insertMention,
    handleSubmit,
    handleQuickAddTask,
    handleAddFormSubtask,
    handleRemoveFormSubtask,
    handleDelete,
    startEditing,
    handleEditSubmit,
    handleDirectStatusChange,
    handleExportCSV,
    handleLogin,
    openTeamModal,
    handleInviteTeam,
    handleInviteInputChange,
    applyInviteSuggestion,
    handleRevokeMember,
    handleAcceptAccessRequest,
    handleTransferToMember,
    confirmRevokeMember,
    handleAcceptInvite,
    handleDeclineInvite,
    openSettings,
    handleUpdateProfile,
    handleAvatarUpload,
    openAdminModal,
    handleUpdateUserStatus,
    handleToggleSuperAdmin,
    handleManualVerify,
    handleAddLeave,
    handleDeleteLeave,
    handleDeleteUser,
    handleRegister,
    handleForgotPassword,
    handleResetPassword,
    handleLogout,
    handleCreateBoard,
    confirmDeleteBoard,
    handleFeedbackSubmit,
    handleSupportSubmit,
    closeGlobalSearch,
    handleQuickLinkAdd,
    handleQuickLinkRemove,
    handleStartMeet,
    handleChatScroll,
    isDocsOpen,
    setIsDocsOpen,
    isMomNotepadOpen,
    setIsMomNotepadOpen,
    isMyTicketsOpen,
    setIsMyTicketsOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isLogoutConfirmOpen,
    setIsLogoutConfirmOpen,
    isChatWorkspaceOpen,
    setIsChatWorkspaceOpen,
    isPrivacyOpen,
    setIsPrivacyOpen,
    isTermsOpen,
    setIsTermsOpen,
    isSpecsOpen,
    setIsSpecsOpen,
    isChangelogOpen,
    setIsChangelogOpen,
    isSubmitting,
    isTasksLoading,
    isBoardsLoading,
    isKanbanDragging,
    setIsKanbanDragging,
    isTrashHovered,
    setIsTrashHovered,
    filteredTasks,
    activeColumns,
    assigneeOptions,
    unreadCount,
    scrollRef,
    fetchTasks,
    fetchBoards,
    fetchLeaves,
    DEFAULT_COLUMNS,
    DAY_WIDTH,
    formatDateMMM,
    isUserAssigned,
    globalSearchQuery,
    setGlobalSearchQuery,
    globalSearchResults,
    isGlobalSearchOpen,
    isGlobalSearchClosing,
    setIsGlobalSearchOpen,
    handleGlobalSearchSelect,
    pendingStatusChange,
    setPendingStatusChange,
    confirmPendingStatusChange,
    hoveredTimelineRow,
    setHoveredTimelineRow,
    isProactiveAIOpen,
    setIsProactiveAIOpen,
    handleToggleAutoNudge,
    isAssistantOpen,
    setIsAssistantOpen,
    appTheme,
    handleSelectAppTheme,
    cardTheme,
    handleSelectCardTheme,
    appBgImage,
    handleAppBgUpload,
    removeAppBgImage,
    appTexture,
    handleSelectAppTexture,
    chatBg,
    handleChatBgUpload,
    removeChatBg,
    handleSelectDefaultBg,
    isProjectChatOpen,
    setIsProjectChatOpen,
    handleToggleReaction,
    projectChatMessages,
    newProjectChatMessage,
    projectChatReplyingTo,
    setProjectChatReplyingTo,
    deleteProjectChatMessage,
    handleProjectChatChange,
    insertProjectMention,
    sendProjectChatMessage,
    chatEndRef,
    drawerTab,
    setDrawerTab,
    isProjectMentioning,
    projectMentionQuery,
    hasNewProjectChat,
    setHasNewProjectChat,
    hasMoreProjectChat,
    loadMoreProjectChat,
    chatSearchQuery,
    setChatSearchQuery,
    isChatSearchOpen,
    setIsChatSearchOpen,
    showScrollBottom,
    setShowScrollBottom,
    latestMentionId,
    setLatestMentionId,
    dismissMention,
    hasMoreComments,
    loadMoreComments,
    isLoading,
    setIsLoading,
    dmConversations,
    setDmConversations,
    fetchDmConversations,
    language,
    setLanguage,
    t,
    dateFormat,
    setDateFormat,
    showLiveClock,
    setShowLiveClock,
    showLiveClockDate,
    setShowLiveClockDate,
    pomodoroEnabled,
    setPomodoroEnabled,
    showAssistantButton,
    setShowAssistantButton,
    notifPosition,
    setNotifPosition,
    notifSound,
    setNotifSound,
    notifPrivacy,
    setNotifPrivacy,
    browserNotifEnabled,
    setBrowserNotifEnabled,
    mentionIndex,
    setMentionIndex,
    inviteIndex,
    setInviteIndex,
    projectMentionIndex,
    setProjectMentionIndex,
    setIsProjectMentioning,
    boardViewMode,
    setBoardViewMode,
    boardSortBy,
    setBoardSortBy,
    favoriteBoards,
    setFavoriteBoards,
    isInstallable,
    handleInstallClick,
    showTosUpdate,
    handleAcceptTos,
    previewTask,
    setPreviewTask,
    clonedTaskIds,
    setClonedTaskIds,
    startX,
    scrollLeft,
    isMobileProfileOpen,
    setIsMobileProfileOpen,
  } = useAppContext();

  const [activeDragType, setActiveDragType] = useState(null);

  const tMsg = (en, id) => (language === 'id' ? id : en);

  const totalUnreadChats = useMemo(() => {
    const unreadDms = (dmConversations || []).reduce((sum, convo) => sum + (convo.unread_count || 0), 0);
    const unreadMentionsAndComments = (notifications || []).filter(
      (n) =>
        !n.is_read &&
        (n.type === 'comment' ||
          n.type === 'mention' ||
          n.type === 'mention_no_email' ||
          n.type === 'team_chat' ||
          n.type === 'team_chat_no_email')
    ).length;
    return unreadDms + unreadMentionsAndComments;
  }, [notifications, dmConversations]);

  const chatContainerRef = React.useRef(null);
  const [firstUnreadProjectChatId, setFirstUnreadProjectChatId] = useState(null);
  const sessionLastReadProjectRef = React.useRef(null);
  const initialScrollProjectDoneRef = React.useRef(false);
  const lastProjectMsgIdRef = React.useRef(null);

  React.useEffect(() => {
    initialScrollProjectDoneRef.current = false;
    setFirstUnreadProjectChatId(null);
    lastProjectMsgIdRef.current = null;
    if (selectedBoard) {
      sessionLastReadProjectRef.current = localStorage.getItem(
        `innocean_last_read_board_${selectedBoard.id}_${currentUser}`
      );
    }
  }, [isProjectChatOpen, drawerTab, selectedBoard?.id, currentUser]);

  React.useEffect(() => {
    if (isProjectChatOpen && drawerTab === 'team' && projectChatMessages.length > 0) {
      const lastRead = sessionLastReadProjectRef.current;
      let targetId = firstUnreadProjectChatId;

      const latestMsgId = projectChatMessages[projectChatMessages.length - 1].id;
      const isFirstLoad = lastProjectMsgIdRef.current === null;
      const isNewMessageAtBottom = !isFirstLoad && lastProjectMsgIdRef.current !== latestMsgId;
      lastProjectMsgIdRef.current = latestMsgId;

      if (!targetId && lastRead && isFirstLoad) {
        const unreadMsg = projectChatMessages.find((c) => c.timestamp > lastRead && c.username !== currentUser);
        if (unreadMsg) {
          targetId = unreadMsg.id;
          setFirstUnreadProjectChatId(targetId);
          initialScrollProjectDoneRef.current = false;
        }
      }

      if (!initialScrollProjectDoneRef.current) {
        initialScrollProjectDoneRef.current = true;
        if (targetId) {
          let attempts = 0;
          const interval = setInterval(() => {
            const el = document.getElementById(`chat-msg-${targetId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'auto', block: 'center' });
              setShowScrollBottom(true);
              clearInterval(interval);
            } else {
              attempts++;
              if (attempts >= 10) {
                clearInterval(interval);
                chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
                setShowScrollBottom(false);
              }
            }
          }, 100);
        } else {
          setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
            setShowScrollBottom(false);
            if (selectedBoard) {
              localStorage.setItem(
                `innocean_last_read_board_${selectedBoard.id}_${currentUser}`,
                projectChatMessages[projectChatMessages.length - 1].timestamp
              );
            }
          }, 150);
        }
      } else if (isNewMessageAtBottom) {
        const container = chatContainerRef.current;
        if (container) {
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
          const isMyMessage = projectChatMessages[projectChatMessages.length - 1].username === currentUser;

          if (isNearBottom || isMyMessage) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            setShowScrollBottom(false);
            if (selectedBoard) {
              localStorage.setItem(
                `innocean_last_read_board_${selectedBoard.id}_${currentUser}`,
                projectChatMessages[projectChatMessages.length - 1].timestamp
              );
            }
          } else {
            setShowScrollBottom(true);
          }
        }
      }
    }
  }, [projectChatMessages, isProjectChatOpen, drawerTab, currentUser, firstUnreadProjectChatId, selectedBoard]);

  const sortedBoards = useMemo(() => {
    let sorted = [...boards];
    if (!selectedBoard && globalSearchQuery.trim()) {
      const q = globalSearchQuery.toLowerCase();
      sorted = sorted.filter((b) => b.name.toLowerCase().includes(q) || b.owner_username.toLowerCase().includes(q));
    }

    if (boardSortBy === 'recent') {
      sorted.sort((a, b) => b.id - a.id);
    } else if (boardSortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (boardSortBy === 'active') {
      sorted.sort((a, b) => (b.total_tasks || 0) - (a.total_tasks || 0));
    }
    sorted.sort((a, b) => {
      const isTodoA = a.name.toLowerCase() === 'to-do list' && a.is_private;
      const isTodoB = b.name.toLowerCase() === 'to-do list' && b.is_private;
      if (isTodoA && !isTodoB) return -1;
      if (!isTodoA && isTodoB) return 1;

      const isFavA = favoriteBoards.includes(a.id);
      const isFavB = favoriteBoards.includes(b.id);
      if (isFavA && !isFavB) return -1;
      if (!isFavA && isFavB) return 1;
      return 0;
    });
    return sorted;
  }, [boards, boardSortBy, favoriteBoards, globalSearchQuery, selectedBoard]);

  // Pagination State for Projects
  const [boardPage, setBoardPage] = useState(1);
  const [boardsPerPage, setBoardsPerPage] = useState(() => {
    if (typeof window !== 'undefined') return Number(localStorage.getItem('innocean_boards_per_page')) || 7;
    return 7;
  });
  useEffect(() => localStorage.setItem('innocean_boards_per_page', boardsPerPage), [boardsPerPage]);

  const translateNotif = (msg) => {
    if (!msg) return '';

    // Selalu bersihkan tag TASK_ID dari HTML terlepas dari pengaturan bahasa
    const cleanMsg = msg.replace(/(?:<!--|&lt;!--)\s*TASK_ID:\d+\s*(?:-->|--&gt;)/gi, '');
    if (language !== 'id') return cleanMsg;

    return cleanMsg
      .replace('assigned you a new task:', 'menugaskan Anda tugas baru:')
      .replace('assigned you to the task:', 'menugaskan Anda ke tugas:')
      .replace('assigned you to a sub-task in:', 'menugaskan Anda ke sub-tugas di:')
      .replace('mentioned you in a comment on:', 'menyebut Anda dalam komentar di:')
      .replace('mentioned you in', 'menyebut Anda di')
      .replace('mentioned @team in', 'menyebut @team di')
      .replace('commented on your task:', 'mengomentari tugas Anda:')
      .replace('commented on a task assigned to you:', 'mengomentari tugas yang diberikan kepada Anda:')
      .replace('changed task status to', 'mengubah status tugas menjadi')
      .replace('invited you to project:', 'mengundang Anda ke proyek:')
      .replace('is requesting access to your project', 'meminta akses ke proyek Anda')
      .replace('to view task', 'untuk melihat tugas')
      .replace("Your request to join project '", "Permintaan Anda untuk bergabung dengan proyek '")
      .replace("' has been accepted. You are now a member!", "' telah diterima. Anda sekarang adalah anggota!")
      .replace('reacted', 'memberikan reaksi')
      .replace('to your message in', 'pada pesan Anda di')
      .replace('to your comment', 'pada komentar Anda')
      .replace('submitted a new system feedback.', 'mengirimkan masukan sistem baru.')
      .replace('chat', 'obrolan');
  };

  const matchedGlobalBoards = useMemo(() => {
    if (globalSearchQuery.trim().length < 2) return [];
    const keywords = globalSearchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return boards
      .filter((b) => {
        const combinedText = [b.name, b.owner_username].join(' ').toLowerCase();
        return keywords.every((kw) => combinedText.includes(kw));
      })
      .slice(0, 5);
  }, [globalSearchQuery, boards]);

  const deepLinkProcessedRef = useRef(false);

  useDeepLinks({
    isAuthenticated,
    boards,
    setSelectedBoard,
    currentUser,
    showNotification,
    handleNotificationTaskClick,
    tMsg,
  });

  if (!isAuthenticated) {
    return (
      <>
        <AppThemes appTheme={appTheme} />
        {isLoading && (
          <div
            className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm transition-all duration-300"
            style={{ zIndex: 9999 }}
          >
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent mb-4 shadow-sm"></div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 animate-pulse uppercase tracking-widest">
              Processing...
            </p>
          </div>
        )}
        {notification && (
          <NotificationModal
            key={notification.id}
            notification={notification}
            setNotification={setNotification}
            language={language}
            notifPosition={notifPosition}
            notifSound={notifSound}
            notifPrivacy={notifPrivacy}
          />
        )}
        <LandingPage
          showAuthForm={showAuthForm}
          setShowAuthForm={setShowAuthForm}
          isLoginMode={isLoginMode}
          setIsLoginMode={setIsLoginMode}
          isResetMode={isResetMode}
          setIsResetMode={setIsResetMode}
          setResetToken={setResetToken}
          isForgotMode={isForgotMode}
          setIsForgotMode={setIsForgotMode}
          loginUsername={loginUsername}
          setLoginUsername={setLoginUsername}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          regFullName={regFullName}
          setRegFullName={setRegFullName}
          regEmail={regEmail}
          setRegEmail={setRegEmail}
          regConfirmPassword={regConfirmPassword}
          setRegConfirmPassword={setRegConfirmPassword}
          forgotEmail={forgotEmail}
          setForgotEmail={setForgotEmail}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          handleLogin={handleLogin}
          handleRegister={handleRegister}
          handleForgotPassword={handleForgotPassword}
          handleResetPassword={handleResetPassword}
          loginWithGoogle={loginWithGoogle}
          notification={notification}
          isInstallable={isInstallable}
          handleInstallClick={handleInstallClick}
        />
        {previewTask && (
          <TaskDetailModal
            isPreviewMode={true}
            selectedTask={previewTask}
            setSelectedTask={(val) => {
              setPreviewTask(val);
              if (!val && typeof window !== 'undefined') {
                const url = new URL(window.location);
                url.pathname = '/';
                window.history.pushState({}, '', url);
              }
            }}
            tasks={[]}
            columns={DEFAULT_COLUMNS}
            subtasks={[]}
            comments={[]}
            teamMembers={[]}
            language={language}
            formatDateMMM={formatDateMMM}
            avatarsMap={{}}
            handleDirectStatusChange={() => {}}
            handleEditSubmit={() => {}}
            handleOpenAddBoard={() => {}}
            handleOpenRenameBoard={() => {}}
            handleOpenDeleteBoard={() => {}}
            handleDeleteComment={() => {}}
            handleAskAITaskChat={() => {}}
            handleCommentChange={() => {}}
            insertCommentMention={() => {}}
            handleAddComment={() => {}}
            handleToggleReaction={() => {}}
            handleQuickLinkAdd={() => {}}
            handleQuickLinkRemove={() => {}}
            showNotification={showNotification}
          />
        )}
      </>
    );
  }

  const handleBeforeCapture = (before) => {
    // Instantly remove overflow from columns so r-b-dnd ignores them and registers <main> as the scroll parent.
    // This is required because r-b-dnd only supports ONE scroll parent. By making <main> the scroll parent,
    // horizontal scrolling of the board will correctly update the drop hitboxes of the columns!
    const cols = document.querySelectorAll('.kanban-column-scroll');
    cols.forEach((col) => {
      col.style.setProperty('overflow-y', 'visible', 'important');
    });
  };

  const handleGlobalDragStart = (start) => {
    setActiveDragType(start?.type || null);
    setIsKanbanDragging(true);
  };

  const handleGlobalDragEnd = (result) => {
    setActiveDragType(null);
    setIsKanbanDragging(false);

    // Restore column overflow
    const cols = document.querySelectorAll('.kanban-column-scroll');
    cols.forEach((col) => {
      col.style.removeProperty('overflow-y');
    });

    // Intersepsi Manual Jika Tugas Dijatuhkan Ke Tong Sampah (Tanpa perlu Droppable Pustaka)
    if (isTrashHovered && result.draggableId && result.type !== 'subtask') {
      const draggedTask = tasks.find((t) => t.id.toString() === result.draggableId);
      if (draggedTask) {
        const isTaskAdmin =
          isSuperAdmin ||
          draggedTask.owner_username === currentUser ||
          (selectedBoard && selectedBoard.owner_username === currentUser) ||
          (draggedTask.requester &&
            new RegExp(`@${currentUser.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w.-])`, 'i').test(
              draggedTask.requester
            ));
        if (isTaskAdmin) {
          setSelectedTask(draggedTask);
          setIsDeleteConfirmOpen(true);
        } else {
          showNotification(
            tMsg(
              'Permission Denied: Only Task Admins can delete this task.',
              'Izin Ditolak: Hanya Admin Tugas yang dapat menghapus tugas ini.'
            ),
            'error'
          );
        }
      }
      setIsTrashHovered(false);
      return;
    }

    if (!result.destination) return;
    if (result.type === 'subtask') {
      handleSubtaskDragEnd(result);
    } else {
      onDragEnd(result);
    }
  };

  const handleProjectChatScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop < clientHeight + 150;
    setShowScrollBottom(!isNearBottom);
    if (isNearBottom && projectChatMessages.length > 0 && selectedBoard) {
      localStorage.setItem(
        `innocean_last_read_board_${selectedBoard.id}_${currentUser}`,
        projectChatMessages[projectChatMessages.length - 1].timestamp
      );
    }
  };

  const textureStyles = {
    noise: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
    dots: isDarkMode
      ? 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)'
      : 'radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)',
    grid: isDarkMode
      ? 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)'
      : 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
  };

  const toggleFavoriteBoard = (id) => {
    setFavoriteBoards((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const totalBoardPages = Math.ceil(sortedBoards.length / boardsPerPage) || 1;
  const currentBoardPage = Math.min(boardPage, totalBoardPages);
  const currentBoards = sortedBoards.slice((currentBoardPage - 1) * boardsPerPage, currentBoardPage * boardsPerPage);

  const globalCriticalCount = boards.filter((b) => b.health_alert && b.health_alert.includes('Attention')).length;
  const globalWorkloadCount = boards.filter((b) => b.health_alert && b.health_alert.includes('Workload')).length;
  let globalHealthAlert = '';
  let globalAlertClass = 'bg-slate-500/10 border-slate-500/30';
  let globalAlertTextClass = 'text-slate-200';
  let globalAlertIcon = '✨';

  if (globalCriticalCount > 0) {
    globalHealthAlert = tMsg(
      `Attention! You have critical tasks in ${globalCriticalCount} project(s).`,
      `Perhatian! Anda memiliki tugas kritis di ${globalCriticalCount} proyek.`
    );
    globalAlertClass = 'bg-red-500/20 border-red-500/30';
    globalAlertTextClass = 'text-red-200';
    globalAlertIcon = '🚨';
  } else if (globalWorkloadCount > 0) {
    globalHealthAlert = tMsg(
      `Workload Notice: High activity in ${globalWorkloadCount} project(s).`,
      `Pemberitahuan Beban Kerja: Aktivitas tinggi di ${globalWorkloadCount} proyek.`
    );
    globalAlertClass = 'bg-amber-500/20 border-amber-500/30';
    globalAlertTextClass = 'text-amber-200';
    globalAlertIcon = '🤝';
  } else if (boards.length > 0) {
    globalHealthAlert = tMsg(`All projects are on track. Keep it up!`, `Semua proyek berjalan lancar. Pertahankan!`);
    globalAlertClass = 'bg-emerald-500/20 border-emerald-500/30';
    globalAlertTextClass = 'text-emerald-200';
    globalAlertIcon = '✨';
  }

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalBoardPages <= maxVisible) {
      for (let i = 1; i <= totalBoardPages; i++) pages.push(i);
    } else {
      if (currentBoardPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalBoardPages);
      } else if (currentBoardPage >= totalBoardPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalBoardPages - 3; i <= totalBoardPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentBoardPage - 1);
        pages.push(currentBoardPage);
        pages.push(currentBoardPage + 1);
        pages.push('...');
        pages.push(totalBoardPages);
      }
    }
    return pages;
  };

  useEffect(() => {
    // Pindahkan Tong Sampah secara instan ke dekat kursor SESAAT sebelum sistem DND mulai bekerja
    const positionTrash = (clientX, clientY) => {
      if (typeof window !== 'undefined' && window.innerWidth < 768) return; // Nonaktifkan di mobile

      const wrapper = document.getElementById('trash-wrapper');
      if (wrapper) {
        let x = clientX + 800; // Muncul sangat jauh di sebelah kanan
        let y = clientY; // Sejajar kursor
        if (typeof window !== 'undefined') {
          if (x > window.innerWidth - 120) {
            x = clientX - 800; // Pindah ke kiri jika mentok
            if (x < 120) x = clientX > window.innerWidth / 2 ? 80 : window.innerWidth - 80;
          }
          if (y < 120) y = 120;
          if (y > window.innerHeight - 120) y = window.innerHeight - 120;
        }
        wrapper.style.left = `${x}px`;
        wrapper.style.top = `${y}px`;
      }
    };

    const handleMouseDown = (e) => positionTrash(e.clientX, e.clientY);
    window.addEventListener('mousedown', handleMouseDown, true);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, []);

  // Global Event Listener untuk mendeteksi kursor menabrak tong sampah & Auto-Scroll Edge
  useEffect(() => {
    let animationFrameId;
    let currentMouseX = -1;
    let currentMouseY = -1;
    let frameCount = 0;

    const handleMouseMoveGlobal = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      currentMouseX = clientX;
      currentMouseY = clientY;

      if ((isKanbanDragging && activeDragType !== 'column') || timelineDrag) {
        const trashEl = document.getElementById('floating-trash');
        if (trashEl && typeof window !== 'undefined' && window.innerWidth >= 768) {
          const rect = trashEl.getBoundingClientRect();
          const padding = 40;
          const isOver =
            clientX >= rect.left - padding &&
            clientX <= rect.right + padding &&
            clientY >= rect.top - padding &&
            clientY <= rect.bottom + padding;
          if (isOver !== isTrashHovered) setIsTrashHovered(isOver);
        }
      }
    };

    if (isKanbanDragging || timelineDrag) {
      window.addEventListener('mousemove', handleMouseMoveGlobal, { capture: true, passive: true });
      window.addEventListener('touchmove', handleMouseMoveGlobal, { capture: true, passive: true });

      const autoScrollLoop = () => {
        if (scrollRef.current && (isKanbanDragging || timelineDrag) && currentMouseX !== -1) {
          const rect = scrollRef.current.getBoundingClientRect();
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          const threshold = isMobile ? 80 : 150;
          const maxSpeed = isMobile ? 12 : 16;

          if (currentMouseX < rect.left + threshold) {
            const intensity = Math.max(0.1, 1 - (currentMouseX - rect.left) / threshold);
            scrollRef.current.scrollLeft -= maxSpeed * intensity;
          } else if (currentMouseX > rect.right - threshold) {
            const intensity = Math.max(0.1, 1 - (rect.right - currentMouseX) / threshold);
            scrollRef.current.scrollLeft += maxSpeed * intensity;
          }
        }
        animationFrameId = requestAnimationFrame(autoScrollLoop);
      };
      
      animationFrameId = requestAnimationFrame(autoScrollLoop);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveGlobal, { capture: true, passive: true });
      window.removeEventListener('touchmove', handleMouseMoveGlobal, { capture: true, passive: true });
      cancelAnimationFrame(animationFrameId);
    };
  }, [isKanbanDragging, activeDragType, timelineDrag, isTrashHovered, setIsTrashHovered]);

  return (
    <DragDropContext onBeforeCapture={handleBeforeCapture} onDragStart={handleGlobalDragStart} onDragEnd={handleGlobalDragEnd}>
      <AppThemes appTheme={appTheme} />
      <style>{`
      @keyframes mac-enter {
        0% { opacity: 0; transform: scale(0.95); }
        100% { opacity: 1; transform: none; }
      }
      .mac-animate {
        animation: mac-enter 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      @keyframes mac-exit {
        0% { opacity: 1; transform: none; }
        100% { opacity: 0; transform: scale(0.95); }
      }
      .mac-exit {
        animation: mac-exit 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      @keyframes mac-slide-in {
        0% { opacity: 0; transform: translateX(100%); }
        100% { opacity: 1; transform: none; }
      }
      .mac-slide-in {
        animation: mac-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      @keyframes chat-bubble-up {
        0% { opacity: 0; transform: translateY(15px) scale(0.95); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      .chat-animate {
        animation: chat-bubble-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      
      /* Universal Mac-style Table Row Highlight for Light Mode */
      html:not(.dark) body tbody tr:hover,
      html:not(.dark) body table tbody tr.group:hover {
        background-color: #E5F1FF !important;
        transition: background-color 0.15s ease-in-out;
      }
      
      /* Universal Table Row Highlight for Dark Mode */
      .dark body tbody tr:hover,
      .dark body table tbody tr.group:hover {
        background-color: rgba(255, 255, 255, 0.08) !important;
        transition: background-color 0.15s ease-in-out;
      }
      
      @keyframes crumple {
        0% { transform: scale(1) rotate(0deg) translateY(-50px); opacity: 1; }
        100% { transform: scale(0.2) rotate(720deg) translateY(20px); opacity: 0; }
      }
      .animate-crumple {
        animation: crumple 0.6s ease-in-out infinite;
      }

      /* Custom Tour (Driver.js) Styling */
      .driver-popover {
        border-radius: 1.5rem !important;
        padding: 1.5rem !important;
        background-color: #ffffff !important;
        color: #000000 !important;
        border: 1px solid #e5e7eb !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        font-family: inherit !important;
        max-width: 320px !important;
      }
      .dark .driver-popover {
        background-color: #111318 !important;
        color: #ffffff !important;
        border: 1px solid #1f2937 !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7) !important;
      }
      .driver-popover-title {
        font-size: 1.15rem !important;
        font-weight: 900 !important;
        margin-bottom: 0.5rem !important;
        letter-spacing: normal !important;
      }
      .driver-popover-description {
        font-size: 0.8rem !important;
        font-weight: 500 !important;
        color: #6b7280 !important;
        line-height: 1.6 !important;
        margin-bottom: 1rem !important;
      }
      .dark .driver-popover-description {
        color: #9ca3af !important;
      }
      .driver-popover-footer {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 0.5rem !important;
        margin-top: 1rem !important;
      }
      .driver-popover-progress-text {
        font-size: 0.75rem !important;
        font-weight: 700 !important;
        color: #9ca3af !important;
      }
      .driver-popover-footer button {
        border-radius: 0.75rem !important;
        padding: 0.5rem 1rem !important;
        font-size: 0.65rem !important;
        font-weight: 800 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        border: none !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
        text-shadow: none !important;
      }
      .driver-popover-prev-btn {
        background-color: #f3f4f6 !important;
        color: #4b5563 !important;
      }
      .dark .driver-popover-prev-btn {
        background-color: #1f2937 !important;
        color: #d1d5db !important;
      }
      .driver-popover-next-btn {
        background-color: #4f46e5 !important;
        color: #ffffff !important;
      }
      .driver-popover-next-btn:hover {
        background-color: #4338ca !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
      }
      .driver-popover-close-btn {
        top: 1rem !important;
        right: 1rem !important;
        color: #9ca3af !important;
        transition: color 0.2s !important;
      }
      .driver-popover-close-btn:hover {
        color: #ef4444 !important;
      }
    `}</style>
      <div
        className={`flex h-screen overflow-hidden text-black dark:text-white font-sans transition-colors duration-200 ${
          (!appTheme ||
            appTheme === 'gamer' ||
            appTheme === 'minimal' ||
            appTheme === 'hacker' ||
            appTheme === 'chatapp' ||
            appTheme === 'editor' ||
            appTheme === 'cupertino' ||
            appTheme === 'social' ||
            appTheme === 'retail') &&
          !appBgImage
            ? 'bg-neutral-50 dark:bg-neutral-950'
            : ''
        }`}
        style={
          appBgImage
            ? {
                backgroundImage: `url(${appBgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
              }
            : appTheme &&
              appTheme !== 'gamer' &&
              appTheme !== 'minimal' &&
              appTheme !== 'hacker' &&
              appTheme !== 'chatapp' &&
              appTheme !== 'editor' &&
              appTheme !== 'cupertino' &&
              appTheme !== 'social' &&
              appTheme !== 'retail'
            ? {
                background:
                  appTheme === 'sunset'
                    ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                    : appTheme,
                backgroundAttachment: 'fixed',
              }
            : {}
        }
      >
        {appTexture && (
          <div
            className="fixed inset-0 z-0 pointer-events-none opacity-60"
            style={{
              backgroundImage: textureStyles[appTexture],
              backgroundSize: appTexture === 'noise' ? '150px' : '20px 20px',
              backgroundAttachment: 'fixed',
            }}
          ></div>
        )}
        {isLoading && !isProactiveAIOpen && !isChatWorkspaceOpen && !isDocsOpen && !isChangelogOpen && (
          <div
            className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm transition-all duration-300"
            style={{ zIndex: 9999 }}
          >
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent mb-4 shadow-sm"></div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 animate-pulse uppercase tracking-widest">
              Loading...
            </p>
          </div>
        )}
        {notification && (
          <NotificationModal
            key={notification.id}
            notification={notification}
            setNotification={setNotification}
            language={language}
            notifPosition={notifPosition}
            notifSound={notifSound}
            notifPrivacy={notifPrivacy}
          />
        )}
        {showTosUpdate && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-90 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-10 max-w-lg w-full shadow-2xl mac-animate text-center">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-inner border border-indigo-100 dark:border-indigo-800/50">
                📜
              </div>
              <h2 className="text-2xl font-black text-black dark:text-white uppercase mb-4">
                {tMsg('Updated Terms', 'Pembaruan Persyaratan')}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-8">
                {tMsg(
                  'We have updated our Terms of Service and Privacy Policy to better protect your data and improve our services. Please review and accept them to continue using INNOCEAN Tracker.',
                  'Kami telah memperbarui Syarat dan Ketentuan serta Kebijakan Privasi untuk melindungi data Anda dan meningkatkan layanan kami. Silakan tinjau dan setujui untuk melanjutkan.'
                )}
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsTermsOpen(true)}
                    className="flex-1 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-black dark:text-white font-bold py-3 rounded-xl transition-colors text-xs uppercase tracking-widest border border-neutral-200 dark:border-neutral-800"
                  >
                    Terms
                  </button>
                  <button
                    onClick={() => setIsPrivacyOpen(true)}
                    className="flex-1 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-black dark:text-white font-bold py-3 rounded-xl transition-colors text-xs uppercase tracking-widest border border-neutral-200 dark:border-neutral-800"
                  >
                    Privacy
                  </button>
                </div>
                <button
                  onClick={handleAcceptTos}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-colors text-xs uppercase tracking-widest mt-2"
                >
                  {tMsg('I Have Read & Agree', 'Saya Telah Membaca & Setuju')}
                </button>
              </div>
            </div>
          </div>
        )}
        {accountStatus === 'suspended' && (
          <div className="bg-cyan-100 dark:bg-cyan-900/40 border-b border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 text-center py-3 px-4 font-bold text-sm sticky top-0 z-99">
            ❄️ Your account is currently frozen. All editing capabilities are disabled. Please contact an Administrator.
          </div>
        )}
        {selectedBoard && selectedBoard.deletion_date && accountStatus !== 'suspended' && (
          <ProjectLifecycleBanner deletionDateStr={selectedBoard.deletion_date} language={language} />
        )}
        <Sidebar showTimesheets={showTimesheets} setShowTimesheets={setShowTimesheets} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <MobileTopBar />
          {!selectedBoard ? (
            showTimesheets ? <TimesheetView currentUser={currentUser} tasks={tasks} boards={boards} /> : <HomeDashboard />
          ) : (
            <div className="flex-1 flex flex-col w-full min-h-0 overflow-hidden">
              <MainToolbar />

              <main
                ref={scrollRef}
                className={`flex-1 px-6 pb-4 flex flex-col min-h-0 ${
                  viewMode === 'kanban' ? 'overflow-auto sm:overflow-x-auto sm:overflow-y-hidden' : 'overflow-auto'
                } ${accountStatus === 'suspended' ? 'cursor-not-allowed' : ''} ${
                  timelineDrag
                    ? (timelineDrag.mode === 'both' ? 'cursor-grabbing' : 'cursor-ew-resize') + ' select-none'
                    : ''
                }`}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
              >
                {isTasksLoading && tasks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-100 h-full opacity-70">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 dark:border-indigo-400 border-t-transparent mb-4 shadow-sm"></div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">
                      {tMsg('Loading Tasks...', 'Memuat Tugas...')}
                    </p>
                  </div>
                ) : (
                  <>
                    {viewMode === 'kanban' && (
                      <KanbanBoard
                        isKanbanDragging={isKanbanDragging}
                        clonedTaskIds={clonedTaskIds}
                        activeColumns={activeColumns}
                        filteredTasks={filteredTasks}
                        searchQuery={searchQuery}
                        groupBy={groupBy}
                        DEFAULT_COLUMNS={DEFAULT_COLUMNS}
                        avatarsMap={avatarsMap}
                        currentUser={currentUser}
                        onDragEnd={onDragEnd}
                        handleOpenRenameBoard={handleOpenRenameBoard}
                        handleOpenDeleteBoard={handleOpenDeleteBoard}
                        setSelectedTask={setSelectedTask}
                        accountStatus={accountStatus}
                        selectedBoard={selectedBoard}
                        handleOpenAddBoard={handleOpenAddBoard}
                        formatDateMMM={formatDateMMM}
                        boards={boards}
                        setSelectedBoard={setSelectedBoard}
                        isSuperAdmin={isSuperAdmin}
                        notifications={notifications}
                        cardTheme={cardTheme}
                        isTrashHovered={isTrashHovered}
                        language={language}
                      />
                    )}

                    {viewMode === 'list' && (
                      <TableList
                        clonedTaskIds={clonedTaskIds}
                        filteredTasks={filteredTasks}
                        setSelectedTask={setSelectedTask}
                        currentUser={currentUser}
                        avatarsMap={avatarsMap}
                        formatDateMMM={formatDateMMM}
                        handleQuickAddTask={handleQuickAddTask}
                        selectedBoard={selectedBoard}
                        accountStatus={accountStatus}
                        categories={categories}
                        teamMembers={teamMembers}
                        isMentioning={isMentioning}
                        mentionIndex={mentionIndex}
                        setMentionIndex={setMentionIndex}
                        setIsMentioning={setIsMentioning}
                        mentionQuery={mentionQuery}
                        handleRequesterChange={handleRequesterChange}
                        insertMention={insertMention}
                        notifications={notifications}
                        boards={boards}
                        fetchTasks={fetchTasks}
                        setClonedTaskIds={setClonedTaskIds}
                        showNotification={showNotification}
                        searchQuery={searchQuery}
                        language={language}
                      />
                    )}

                    {viewMode === 'analytics' && (
                      <div className="instagram-solid-cards contents">
                        <AnalyticsView
                          filteredTasks={filteredTasks}
                          columns={columns}
                          avatarsMap={avatarsMap}
                          teamMembers={teamMembers}
                          setSelectedTask={setSelectedTask}
                          currentUser={currentUser}
                          language={language}
                        />
                      </div>
                    )}

                    {viewMode === 'timeline' && (
                      <TimelineView
                        filteredTasks={filteredTasks}
                        leaves={leaves}
                        currentUser={currentUser}
                        isUserAssigned={isUserAssigned}
                        timelineDrag={timelineDrag}
                        setTimelineDrag={setTimelineDrag}
                        setSelectedTask={setSelectedTask}
                        accountStatus={accountStatus}
                        DAY_WIDTH={DAY_WIDTH}
                        selectedBoard={selectedBoard}
                        isSuperAdmin={isSuperAdmin}
                        groupBy={groupBy}
                        hoveredTimelineRow={hoveredTimelineRow}
                        setHoveredTimelineRow={setHoveredTimelineRow}
                        isTrashHovered={isTrashHovered}
                        isDarkMode={isDarkMode}
                        language={language}
                      />
                    )}

                    {viewMode === 'calendar' && (
                      <CalendarView
                        calDate={calDate}
                        setCalDate={setCalDate}
                        leaves={leaves}
                        filteredTasks={filteredTasks}
                        setSelectedTask={setSelectedTask}
                        currentUser={currentUser}
                        isUserAssigned={isUserAssigned}
                        timelineDrag={timelineDrag}
                        setTimelineDrag={setTimelineDrag}
                        accountStatus={accountStatus}
                        selectedBoard={selectedBoard}
                        isSuperAdmin={isSuperAdmin}
                        isTrashHovered={isTrashHovered}
                        language={language}
                        dateFormat={dateFormat}
                      />
                    )}
                  </>
                )}
              </main>
            </div>
          )}

          {/* Universal Footer for Logged In User */}
          <footer className="flex flex-col sm:flex-row py-2.5 px-6 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black justify-between items-center gap-2 sm:gap-4 shrink-0 z-40 relative">
            <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest text-center sm:text-left">
              © {new Date().getFullYear()} INNOCEAN Tracker.
            </p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
              <button
                onClick={() => setIsSpecsOpen(true)}
                className="text-[10px] font-bold text-neutral-500 hover:text-black dark:hover:text-white uppercase tracking-widest transition-colors"
              >
                Specs
              </button>
              <button
                onClick={() => setIsChangelogOpen(true)}
                className="text-[10px] font-bold text-neutral-500 hover:text-black dark:hover:text-white uppercase tracking-widest transition-colors"
              >
                Changelog
              </button>
              <button
                onClick={() => setIsDocsOpen(true)}
                className="text-[10px] font-bold text-neutral-500 hover:text-black dark:hover:text-white uppercase tracking-widest transition-colors"
              >
                Docs
              </button>
              <button
                onClick={() => setIsPrivacyOpen(true)}
                className="text-[10px] font-bold text-neutral-500 hover:text-black dark:hover:text-white uppercase tracking-widest transition-colors"
              >
                Privacy
              </button>
              <button
                onClick={() => setIsTermsOpen(true)}
                className="text-[10px] font-bold text-neutral-500 hover:text-black dark:hover:text-white uppercase tracking-widest transition-colors"
              >
                Terms
              </button>
            </div>
          </footer>

          {/* Floating Trash for Drag and Drop Deletion */}
          <div
            id="trash-wrapper"
            className="fixed z-100 pointer-events-none hidden md:block"
            style={{
              left: '-1000px',
              top: '-1000px',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className={`transition-all duration-300 ease-out ${
                (isKanbanDragging && activeDragType !== 'column') || timelineDrag
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-50'
              }`}
            >
              <div
                id="floating-trash"
                className={`flex items-center justify-center text-[70px] sm:text-[90px] transition-all duration-300 pointer-events-auto ${
                  isTrashHovered
                    ? 'scale-125 -rotate-12 opacity-100 drop-shadow-[0_0_40px_rgba(220,38,38,0.8)]'
                    : 'scale-100 grayscale opacity-40 drop-shadow-xl hover:grayscale-0 hover:opacity-100'
                }`}
              >
                🗑️
                {/* Kertas diremas yang melompat ke dalam tong sampah */}
                {isTrashHovered && (
                  <div className="absolute top-0 left-1/4 text-[50px] animate-crumple pointer-events-none drop-shadow-md z-50">
                    📄
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>{' '}
        {/* End Main Content Wrapper */}
        <AppModals />
        {isSettingsOpen && (
          <SettingsPage
            closeSettings={() => setIsSettingsOpen(false)}
            profileData={profileData}
            setProfileData={setProfileData}
            handleUpdateProfile={handleUpdateProfile}
            handleAvatarUpload={handleAvatarUpload}
            appTheme={appTheme}
            handleSelectAppTheme={handleSelectAppTheme}
            appBgImage={appBgImage}
            handleAppBgUpload={handleAppBgUpload}
            removeAppBgImage={removeAppBgImage}
            appTexture={appTexture}
            handleSelectAppTexture={handleSelectAppTexture}
            chatBg={chatBg}
            handleChatBgUpload={handleChatBgUpload}
            removeChatBg={removeChatBg}
            handleSelectDefaultBg={handleSelectDefaultBg}
            cardTheme={cardTheme}
            handleSelectCardTheme={handleSelectCardTheme}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            language={language}
            setLanguage={setLanguage}
            dateFormat={dateFormat}
            setDateFormat={setDateFormat}
            showLiveClock={showLiveClock}
            setShowLiveClock={setShowLiveClock}
            showLiveClockDate={showLiveClockDate}
            setShowLiveClockDate={setShowLiveClockDate}
            pomodoroEnabled={pomodoroEnabled}
            setPomodoroEnabled={setPomodoroEnabled}
            showAssistantButton={showAssistantButton}
            setShowAssistantButton={setShowAssistantButton}
            notifPosition={notifPosition}
            setNotifPosition={setNotifPosition}
            notifSound={notifSound}
            setNotifSound={setNotifSound}
            notifPrivacy={notifPrivacy}
            setNotifPrivacy={setNotifPrivacy}
            browserNotifEnabled={browserNotifEnabled}
            setBrowserNotifEnabled={setBrowserNotifEnabled}
            showNotification={showNotification}
            tMsg={tMsg}
          />
        )}
        {pomodoroEnabled && accountStatus !== 'suspended' && <PomodoroWidget isDarkMode={isDarkMode} />}
        {/* Floating Smart Assistant Button */}
        {!isProjectChatOpen && accountStatus !== 'suspended' && showAssistantButton && (
          <button
            onClick={() => {
              setIsProjectChatOpen(true);
              setDrawerTab('assistant');
            }}
            className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-60 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_30px_rgba(255,255,255,0.2)] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 group"
            title={tMsg('Smart Assistant', 'Asisten Pintar AI')}
          >
            <span className="text-2xl group-hover:rotate-12 transition-transform">✨</span>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 border-2 border-white dark:border-black"></span>
            </span>
          </button>
        )}
        {/* Transparent Dark Overlay & Smooth Slide-in Drawer */}
        <div
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-85 transition-opacity duration-300 ${
            isProjectChatOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsProjectChatOpen(false)}
        ></div>
        <div
          className={`fixed inset-0 sm:inset-auto sm:bottom-28 sm:right-10 w-full sm:w-100 xl:w-112.5 sm:h-[calc(100vh-160px)] sm:max-h-200 bg-white dark:bg-neutral-950 sm:shadow-2xl sm:border border-neutral-200 dark:border-neutral-800 z-90 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom-right sm:rounded-4xl overflow-hidden ${
            isProjectChatOpen
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-90 translate-y-10 pointer-events-none'
          }`}
        >
          <div className="flex border-b border-neutral-200 dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-950">
            <button
              onClick={() => setDrawerTab('assistant')}
              className="flex-1 py-4 text-[10px] sm:text-xs uppercase tracking-wider transition-colors font-black text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/10"
            >
              ✨ Assistant
            </button>
            <button
              onClick={() => setIsProjectChatOpen(false)}
              className="px-4 text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors border-b-2 border-transparent"
            >
              ✖
            </button>
          </div>

          {/* Team Chat Tab */}
          {selectedBoard && selectedBoard.id !== 'global' && (
            <div className={`flex-1 flex-col overflow-hidden relative ${drawerTab === 'team' ? 'flex' : 'hidden'}`}>
              <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex flex-col gap-3 shrink-0 z-20">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest truncate flex items-center gap-2">
                    <span>Project Space:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-black">{selectedBoard.name}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsChatSearchOpen(!isChatSearchOpen)}
                      className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                        isChatSearchOpen
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white'
                          : 'text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800'
                      }`}
                      title={tMsg('Search Chat', 'Cari Obrolan')}
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
                      onClick={() => handleStartMeet(selectedBoard.id)}
                      className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors uppercase tracking-widest"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        ></path>
                      </svg>{' '}
                      Meet Now
                    </button>
                  </div>
                </div>
              </div>

              {isChatSearchOpen && (
                <div className="border-b border-neutral-200 dark:border-neutral-800 p-2 bg-neutral-50 dark:bg-neutral-900 shrink-0 z-10 shadow-inner">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">🔍</span>
                    <input
                      type="text"
                      placeholder={tMsg('Search messages...', 'Cari pesan...')}
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl pl-8 pr-4 py-2 text-xs font-medium text-black dark:text-white outline-none focus:border-indigo-500 transition-colors shadow-inner"
                    />
                    {chatSearchQuery && (
                      <div className="absolute top-full mt-2 left-0 w-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-700 shadow-2xl rounded-xl z-50 max-h-64 overflow-y-auto custom-scrollbar mac-animate">
                        {projectChatMessages
                          .filter(
                            (c) =>
                              (c.text || '').toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                              (c.username || '').toLowerCase().includes(chatSearchQuery.toLowerCase())
                          )
                          .map((c) => (
                            <div
                              key={`search-${c.id}`}
                              onClick={() => {
                                setChatSearchQuery('');
                                setIsChatSearchOpen(false);
                                const el = document.getElementById(`chat-msg-${c.id}`);
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
                              className="p-4 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex flex-col gap-1.5"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                  @{c.username}
                                </span>
                                <span className="text-[9px] font-medium text-neutral-400">
                                  {formatDateMMM(c.timestamp)}
                                </span>
                              </div>
                              <p className="text-xs text-black dark:text-white line-clamp-2">{stripHtml(c.text)}</p>
                            </div>
                          ))}
                        {projectChatMessages.filter(
                          (c) =>
                            (c.text || '').toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                            (c.username || '').toLowerCase().includes(chatSearchQuery.toLowerCase())
                        ).length === 0 && (
                          <div className="p-4 text-center text-xs font-bold text-neutral-500">No messages found.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

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

                <div
                  ref={chatContainerRef}
                  onScroll={handleProjectChatScroll}
                  className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-5 custom-scrollbar bg-neutral-50/50 dark:bg-neutral-900/30 relative z-10"
                >
                  <div className="relative z-10 flex flex-col gap-4">
                    {hasMoreProjectChat && (
                      <div className="flex justify-center my-2 relative">
                        <button
                          onClick={loadMoreProjectChat}
                          className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-4 py-2 rounded-full transition-colors border border-indigo-200 dark:border-indigo-800/50 shadow-sm z-10"
                        >
                          Load older messages
                        </button>
                      </div>
                    )}

                    {projectChatMessages.map((c, index, arr) => {
                      const isMe = c.username === currentUser;
                      const currDate = new Date(c.timestamp.replace(/-/g, '/')).toDateString();
                      const prevDate =
                        index > 0 ? new Date(arr[index - 1].timestamp.replace(/-/g, '/')).toDateString() : null;
                      const showDivider = currDate !== prevDate;

                      let dividerDisplay = '';
                      if (showDivider) {
                        const today = new Date().toDateString();
                        const yesterday = new Date(Date.now() - 86400000).toDateString();
                        if (currDate === today) dividerDisplay = 'Today';
                        else if (currDate === yesterday) dividerDisplay = 'Yesterday';
                        else dividerDisplay = formatDateMMM(c.timestamp);
                      }
                      const isFirstUnread = c.id === firstUnreadProjectChatId;

                      return (
                        <React.Fragment key={c.id}>
                          {showDivider && (
                            <div className="flex justify-center my-2 relative">
                              <div className="absolute top-1/2 left-0 w-full h-px bg-neutral-200 dark:bg-neutral-800 z-0"></div>
                              <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest z-10 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                {dividerDisplay}
                              </span>
                            </div>
                          )}
                          {isFirstUnread && (
                            <div className="flex justify-center my-4 relative chat-animate">
                              <div className="absolute top-1/2 left-0 w-full h-px bg-red-200 dark:bg-red-800/50 z-0"></div>
                              <span className="bg-red-50 dark:bg-red-900/30 text-red-500 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest z-10 border border-red-200 dark:border-red-800/50 shadow-sm">
                                {tMsg('Unread Messages', 'Pesan Belum Dibaca')}
                              </span>
                            </div>
                          )}
                          <div
                            id={`chat-msg-${c.id}`}
                            className={`flex gap-3 w-full p-1.5 -mx-1.5 transition-all duration-500 ${
                              isMe ? 'flex-row-reverse' : 'flex-row'
                            } chat-animate scroll-mt-20 group/bubble`}
                          >
                            <Avatar
                              name={c.username}
                              url={avatarsMap[c.username]}
                              size="w-8 h-8 shrink-0"
                              textClass="text-[10px]"
                            />
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} min-w-0 max-w-[92%]`}>
                              <div
                                className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                              >
                                <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                                  @{c.username}
                                </span>
                                <span className="text-[8px] font-bold text-neutral-400 opacity-70">
                                  {new Date(c.timestamp.replace(/-/g, '/')).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>

                              <div
                                className={`flex items-center gap-2 max-w-full ${
                                  isMe ? 'flex-row-reverse' : 'flex-row'
                                }`}
                              >
                                <div
                                  className={`p-3 text-sm font-medium leading-relaxed shadow-sm shrink min-w-0 ${
                                    isMe
                                      ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                                      : 'bg-white dark:bg-neutral-800 text-black dark:text-white border border-neutral-100 dark:border-neutral-700 rounded-2xl rounded-tl-sm'
                                  }`}
                                >
                                  <div
                                    dangerouslySetInnerHTML={{ __html: renderChatMessageContent(c.text, isMe) }}
                                    className="wrap-break-word space-y-1 select-text"
                                  />
                                </div>
                                <div
                                  className={`flex flex-col items-center justify-center gap-1 opacity-100 md:opacity-0 group-hover/bubble:opacity-100 transition-opacity shrink-0`}
                                >
                                  <button
                                    onClick={() => setProjectChatReplyingTo(c)}
                                    className="p-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-sm text-neutral-400 hover:text-indigo-500 transition-colors"
                                    title="Reply"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                      ></path>
                                    </svg>
                                  </button>
                                  {(isMe || isSuperAdmin) && accountStatus !== 'suspended' && (
                                    <button
                                      onClick={() => deleteProjectChatMessage(c.id)}
                                      className="p-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-sm text-neutral-400 hover:text-red-500 transition-colors"
                                      title="Delete"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        ></path>
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      let cleanText = c.text
                                        .replace(/\*\*(.*?)\*\*/g, '$1')
                                        .replace(/\*(.*?)\*/g, '$1')
                                        .replace(/__(.*?)__/g, '$1');
                                      const temp = document.createElement('textarea');
                                      temp.innerHTML = cleanText;
                                      navigator.clipboard.writeText(temp.value.trim());
                                      showNotification(tMsg('Copied to clipboard!', 'Disalin ke papan klip!'), 'info');
                                    }}
                                    className="p-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-sm text-neutral-400 hover:text-indigo-500 transition-colors"
                                    title="Copy"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                      ></path>
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              <div
                                className={`flex flex-wrap items-center gap-1.5 mt-1.5 ${
                                  isMe ? 'justify-end' : 'justify-start'
                                }`}
                              >
                                {c.reactions &&
                                  Object.keys(c.reactions).length > 0 &&
                                  Object.entries(c.reactions).map(([emoji, users]) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleToggleReaction(c.id, emoji, true)}
                                      className={`px-1.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 border shadow-sm transition-colors ${
                                        users.includes(currentUser)
                                          ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-600 dark:text-indigo-300'
                                          : 'bg-white border-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                      }`}
                                      title={users.join(', ')}
                                    >
                                      <span>{emoji}</span> <span className="font-bold">{users.length}</span>
                                    </button>
                                  ))}
                                <div className="relative group/picker flex items-center opacity-100 md:opacity-0 group-hover/bubble:opacity-100 transition-opacity">
                                  <button
                                    className="p-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-sm text-neutral-400 hover:text-indigo-500 transition-colors"
                                    title="Add Reaction"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      ></path>
                                    </svg>
                                  </button>
                                  <div
                                    className={`absolute top-1/2 -translate-y-1/2 ${
                                      isMe ? 'right-full pr-1.5' : 'left-full pl-1.5'
                                    } hidden group-hover/picker:flex z-50`}
                                  >
                                    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-lg p-1 flex gap-1 flex-nowrap">
                                      {['👍', '❤️', '😂', '😮', '🙏', '✅'].map((em) => (
                                        <button
                                          key={em}
                                          onClick={() => handleToggleReaction(c.id, em, true)}
                                          className="w-6 h-6 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full flex items-center justify-center transition-transform hover:scale-125 text-sm"
                                        >
                                          {em}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    {projectChatMessages.length === 0 && (
                      <p className="text-center text-sm text-neutral-500 font-medium italic mt-10">
                        No messages yet. Say hello to the team! 👋
                      </p>
                    )}

                    <div ref={chatEndRef} className="h-32 shrink-0" />
                  </div>
                </div>
              </div>

              <div
                className={`p-4 border-t border-neutral-200 dark:border-neutral-800 shrink-0 relative z-20 ${
                  chatBg ? 'bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md' : 'bg-white dark:bg-neutral-950'
                }`}
              >
                <form
                  onSubmit={(e) => {
                    sendProjectChatMessage(e);
                    const ta = e.target.querySelector('textarea');
                    if (ta) ta.style.height = '44px';
                  }}
                  className="flex gap-2 relative items-end"
                >
                  <textarea
                    value={newProjectChatMessage}
                    onChange={(e) => handleProjectChatChange(e.target.value)}
                    disabled={accountStatus === 'suspended'}
                    placeholder="Message the team..."
                    className="flex-1 py-3 px-4 bg-neutral-100 dark:bg-neutral-900 border border-transparent text-black dark:text-white rounded-xl focus:bg-white dark:focus:bg-black focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-medium placeholder-neutral-400 transition-colors disabled:opacity-50 resize-none max-h-30"
                    style={{ minHeight: '44px' }}
                    rows="1"
                    onInput={(e) => {
                      e.target.style.height = '44px';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (isProjectMentioning) {
                        const allOptions = ['team', ...teamMembers];
                        const filteredOptions = allOptions.filter((m) => m.toLowerCase().includes(projectMentionQuery));
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setProjectMentionIndex((prev) => (prev + 1) % (filteredOptions.length || 1));
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setProjectMentionIndex(
                            (prev) => (prev - 1 + filteredOptions.length) % (filteredOptions.length || 1)
                          );
                        } else if (e.key === 'Enter' || e.key === 'Tab') {
                          if (filteredOptions.length > 0) {
                            e.preventDefault();
                            insertProjectMention(filteredOptions[projectMentionIndex] || filteredOptions[0]);
                          } else if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            setIsProjectMentioning(false);
                            sendProjectChatMessage(e);
                            e.target.style.height = '44px';
                          } else {
                            setIsProjectMentioning(false);
                          }
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setIsProjectMentioning(false);
                        }
                      } else if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendProjectChatMessage(e);
                        e.target.style.height = '44px';
                      }
                    }}
                  />
                  {isProjectMentioning && accountStatus !== 'suspended' && (
                    <div className="absolute left-0 bottom-full mb-2 w-full bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl z-50 max-h-40 overflow-y-auto py-2 origin-bottom mac-animate">
                      {(() => {
                        const allOptions = ['team', ...teamMembers];
                        const filteredOptions = allOptions.filter((m) => m.toLowerCase().includes(projectMentionQuery));
                        if (filteredOptions.length > 0) {
                          return filteredOptions.map((m, idx) => (
                            <div
                              key={m}
                              className={`px-4 py-2.5 cursor-pointer text-sm text-black dark:text-white font-medium border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 flex items-center gap-2 ${
                                projectMentionIndex === idx
                                  ? 'bg-neutral-100 dark:bg-neutral-800'
                                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                              onClick={() => insertProjectMention(m)}
                            >
                              <span>@{m}</span>
                              {m === 'team' && (
                                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">
                                  (Notify everyone in project)
                                </span>
                              )}
                            </div>
                          ));
                        }
                        return <div className="px-4 py-3 text-sm text-neutral-500 italic">No members found</div>;
                      })()}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={accountStatus === 'suspended' || !newProjectChatMessage.trim()}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 w-12 h-12 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 shrink-0"
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

              {/* Floating Action Buttons inside Drawer */}
              <div className="absolute bottom-24 right-6 flex flex-col gap-2 z-40 pointer-events-none [&>button]:pointer-events-auto">
                {latestMentionId && (
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`chat-msg-${latestMentionId}`);
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
                      dismissMention(latestMentionId);
                    }}
                    className="w-10 h-10 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center font-black text-lg hover:scale-110 transition-transform"
                    title="Jump to mention"
                  >
                    @
                  </button>
                )}
                {showScrollBottom && (
                  <button
                    type="button"
                    onClick={() => {
                      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                      setShowScrollBottom(false);
                    }}
                    className="w-10 h-10 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center font-black hover:scale-110 transition-transform"
                    title="Scroll to bottom"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      ></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Assistant Tab */}
          <div className={`flex-1 flex-col overflow-hidden ${drawerTab === 'assistant' ? 'flex' : 'hidden'}`}>
            <SmartAssistant
              currentUser={currentUser}
              selectedBoard={selectedBoard}
              teamMembers={teamMembers}
              categories={categories}
              fetchTasks={fetchTasks}
              fetchLeaves={fetchLeaves}
              showNotification={showNotification}
              accountStatus={accountStatus}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              setIsLeaveModalOpen={setIsLeaveModalOpen}
              setIsExportModalOpen={setIsExportModalOpen}
              setIsFeedbackOpen={setIsFeedbackOpen}
              setIsDocsOpen={setIsDocsOpen}
              setGlobalSearchQuery={setGlobalSearchQuery}
              setIsGlobalSearchOpen={setIsGlobalSearchOpen}
              tasks={tasks}
              setSelectedTask={setSelectedTask}
              setSelectedBoard={setSelectedBoard}
              setIsEditing={setIsEditing}
              chatBg={chatBg}
              setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
              openTeamModal={openTeamModal}
              isOpen={isProjectChatOpen && drawerTab === 'assistant'}
              closeDrawer={() => setIsProjectChatOpen(false)}
              startDriverTour={startTour}
              boards={boards}
              language={language}
              avatarsMap={avatarsMap}
              setIsProactiveAIOpen={setIsProactiveAIOpen}
              userDirectory={userDirectory}
              formatDateMMM={formatDateMMM}
              setIsMomNotepadOpen={setIsMomNotepadOpen}
            />
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}

export default App;
