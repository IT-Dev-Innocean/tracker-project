import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
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
  TransferOwnershipModal,
} from '../Modals';
import TaskFormModal from '../TaskFormModal';
import TaskDetailModal from '../TaskDetailModal';
import ChangelogModal from '../ChangelogModal';
import PrivacyPolicyModal from '../PrivacyPolicyModal';
import TermsOfServiceModal from '../TermsOfServiceModal';
import AdminModal from '../AdminModal';
import DocumentationModal from '../DocumentationModal';
import ProactiveAIModal from '../ProactiveAIModal';
import ChatWorkspaceModal from '../ChatWorkspaceModal';
import SystemSpecsModal from '../SystemSpecsModal';
import MoMNotepadModal from './SmartAssistant/MoMNotepadModal';

export default function AppModals() {
  const context = useAppContext();

  // Expose all context variables locally so the copied JSX works without modification
  const {
    isProactiveAIOpen,
    setIsProactiveAIOpen,
    proactiveAiSuggestions,
    isAiGenerating,
    handleExecuteAiSuggestion,
    handleRequestAiSuggestions,
    isFormOpen,
    setIsFormOpen,
    currentUser,
    handleSubmit,
    formData,
    setFormData,
    handleRequesterChange,
    isMentioning,
    teamMembers,
    mentionQuery,
    insertMention,
    categories,
    handleOpenAddBoard,
    handleOpenRenameBoard,
    handleOpenDeleteBoard,
    formSubtaskInput,
    setFormSubtaskInput,
    handleAddFormSubtask,
    formSubtaskAssignee,
    setFormSubtaskAssignee,
    formSubtasks,
    setFormSubtasks,
    handleRemoveFormSubtask,
    mentionIndex,
    setMentionIndex,
    setIsMentioning,
    language,
    isSubmitting,
    handleManualFormClick,
    selectedBoard,
    selectedTask,
    tasks,
    setSelectedTask,
    isEditing,
    setIsEditing,
    handleDirectStatusChange,
    columns,
    editFormData,
    setEditFormData,
    formatDateMMM,
    handleEditSubmit,
    isSuperAdmin,
    accountStatus,
    subtasks,
    handleToggleSubtask,
    handleUpdateSubtaskAssignee,
    handleDeleteSubtask,
    handleSubtaskDragEnd,
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
    isCommentMentioning,
    commentMentionQuery,
    userDirectory,
    commentMentionIndex,
    setCommentMentionIndex,
    setIsCommentMentioning,
    boards,
    setSelectedBoard,
    handleQuickLinkAdd,
    handleQuickLinkRemove,
    isSubtasksLoading,
    hasMoreComments,
    loadMoreComments,
    chatBg,
    handleToggleReaction,
    showNotification,
    handleToggleAutoNudge,
    previewTask,
    setPreviewTask,
    unfinishedSubtasks,
    handleCompleteParentOnly,
    handleCompleteAllTasks,
    isDeleteConfirmOpen,
    handleDeleteTask,
    isCommentDeleteConfirmOpen,
    confirmDeleteComment,
    isRevokeMemberOpen,
    setIsRevokeMemberOpen,
    memberToRevoke,
    handleRevokeMember,
    isDeleteBoardOpen,
    setIsDeleteBoardOpen,
    handleDeleteBoard,
    isExportModalOpen,
    setIsExportModalOpen,
    handleExportData,
    isCreateBoardOpen,
    setIsCreateBoardOpen,
    handleCreateBoard,
    newBoardName,
    setNewBoardName,
    isPrivateBoard,
    setIsPrivateBoard,
    isTeamModalOpen,
    setIsTeamModalOpen,
    inviteSuggestions,
    setInviteSuggestions,
    inviteIndex,
    setInviteIndex,
    handleSendInvite,
    isInvitationsModalOpen,
    setIsInvitationsModalOpen,
    invitations,
    handleRespondInvite,
    colModal,
    setColModal,
    handleSaveColumn,
    isLeaveModalOpen,
    setIsLeaveModalOpen,
    leaveForm,
    setLeaveForm,
    leaves,
    handleLeaveSubmit,
    handleCancelLeave,
    handleDeleteLeave,
    isAdminModalOpen,
    setIsAdminModalOpen,
    isAdminSystemLoading,
    systemLogs,
    handleClearSystemLogs,
    handleClearAllCaches,
    dbStats,
    handleOptimizeDb,
    adminUsers,
    handleAdminVerifyUser,
    handleAdminDeleteUser,
    handleAdminToggleStatus,
    handleSendGlobalAnnouncement,
    allUsersGlobalData,
    handleExportGlobalData,
    dbInfo,
    serverInfo,
    isFeedbackModalOpen,
    setIsFeedbackModalOpen,
    feedbackText,
    setFeedbackText,
    handleFeedbackSubmit,
    isContactSupportOpen,
    setIsContactSupportOpen,
    supportText,
    setSupportText,
    handleSupportSubmit,
    isDocsOpen,
    setIsDocsOpen,
    isMomNotepadOpen,
    setIsMomNotepadOpen,
    isMyTicketsModalOpen,
    setIsMyTicketsModalOpen,
    myTickets,
    isLogoutConfirmOpen,
    setIsLogoutConfirmOpen,
    handleLogout,
    isChatWorkspaceOpen,
    setIsChatWorkspaceOpen,
    isProjectChatOpen,
    setIsProjectChatOpen,
    projectChatMessages,
    hasMoreProjectChat,
    handleLoadMoreProjectChat,
    newProjectChatMessage,
    setNewProjectChatMessage,
    handleProjectChatSubmit,
    handleProjectChatScroll,
    isProjectMentioning,
    setIsProjectMentioning,
    projectMentionQuery,
    setProjectMentionQuery,
    projectMentionIndex,
    setProjectMentionIndex,
    isPrivacyOpen,
    setIsPrivacyOpen,
    isTermsOpen,
    setIsTermsOpen,
    isSpecsOpen,
    setIsSpecsOpen,
    isChangelogOpen,
    setIsChangelogOpen,
    startTour,
    setCommentToDelete,
    pendingStatusChange,
    setPendingStatusChange,
    confirmPendingStatusChange,
    cancelPendingStatusChange,
    DEFAULT_COLUMNS,
    applyInviteSuggestion,
    boardToDelete,
    commentToDelete,
    confirmDeleteBoard,
    confirmRevokeMember,
    deleteBoardConfirmText,
    deleteProjectChatMessage,
    dmConversations,
    exportEndDate,
    exportMode,
    exportStartDate,
    fetchBoards,
    fetchDmConversations,
    fetchInboxChats,
    inboxChats,
    isInboxLoading,
    fetchTasks,
    handleAcceptAccessRequest,
    handleAcceptInvite,
    handleAddLeave,
    handleColSubmit,
    handleDeclineInvite,
    handleDelete,
    handleDeleteUser,
    handleExportCSV,
    handleInviteInputChange,
    handleInviteTeam,
    handleManualVerify,
    handleNotificationTaskClick,
    handleReadNotification,
    handleMarkAllInboxAsRead,
    handleToggleSuperAdmin,
    handleTransferToMember,
    handleUpdateUserStatus,
    inviteInput,
    isDarkMode,
    isFeedbackOpen,
    isInvitesModalOpen,
    isMyTicketsOpen,
    isSupportOpen,
    myTeam,
    notifications,
    setAdminUsers,
    setBoardToDelete,
    setDeleteBoardConfirmText,
    setDmConversations,
    setDrawerTab,
    setExportEndDate,
    setExportStartDate,
    setIsDarkMode,
    setIsFeedbackOpen,
    setIsInvitesModalOpen,
    setIsMyTicketsOpen,
    setIsSupportOpen,
    setLanguage,
    setMemberToRevoke,
    transferTargetUsername,
    setTransferTargetUsername,
    confirmTransferOwnership,
    setShowWelcomeTour,
    setViewMode,
    showWelcomeTour,
    sortedBoards,
    startDriverTour,
    workspaceChatTarget,
    setWorkspaceChatTarget,
  } = context;

  return (
    <>
      {isProactiveAIOpen && (
        <ProactiveAIModal
          setIsProactiveAIOpen={setIsProactiveAIOpen}
          boards={boards}
          fetchBoards={fetchBoards}
          setSelectedBoard={setSelectedBoard}
          currentUser={currentUser}
          language={language}
          setIsProjectChatOpen={setIsProjectChatOpen}
          setDrawerTab={setDrawerTab}
          setViewMode={setViewMode}
          fetchTasks={fetchTasks}
          showNotification={showNotification}
          userDirectory={userDirectory}
          formatDateMMM={formatDateMMM}
          avatarsMap={avatarsMap}
        />
      )}

      {isFormOpen && (
        <TaskFormModal
          setIsFormOpen={setIsFormOpen}
          currentUser={currentUser}
          handleSubmit={handleSubmit}
          formData={formData}
          setFormData={setFormData}
          handleRequesterChange={handleRequesterChange}
          isMentioning={isMentioning}
          teamMembers={teamMembers}
          mentionQuery={mentionQuery}
          insertMention={insertMention}
          categories={categories}
          handleOpenAddBoard={handleOpenAddBoard}
          handleOpenRenameBoard={handleOpenRenameBoard}
          handleOpenDeleteBoard={handleOpenDeleteBoard}
          formSubtaskInput={formSubtaskInput}
          setFormSubtaskInput={setFormSubtaskInput}
          handleAddFormSubtask={handleAddFormSubtask}
          formSubtaskAssignee={formSubtaskAssignee}
          setFormSubtaskAssignee={setFormSubtaskAssignee}
          formSubtasks={formSubtasks}
          setFormSubtasks={setFormSubtasks}
          handleRemoveFormSubtask={handleRemoveFormSubtask}
          mentionIndex={mentionIndex}
          setMentionIndex={setMentionIndex}
          setIsMentioning={setIsMentioning}
          language={language}
          isSubmitting={isSubmitting}
          handleManualFormClick={handleManualFormClick}
          selectedBoard={selectedBoard}
        />
      )}

      {selectedTask && !isChatWorkspaceOpen && (
        <TaskDetailModal
          selectedTask={selectedTask}
          tasks={tasks}
          setSelectedTask={setSelectedTask}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          handleDirectStatusChange={handleDirectStatusChange}
          columns={columns}
          editFormData={editFormData}
          setEditFormData={setEditFormData}
          formatDateMMM={formatDateMMM}
          handleRequesterChange={handleRequesterChange}
          isMentioning={isMentioning}
          teamMembers={teamMembers}
          mentionQuery={mentionQuery}
          insertMention={insertMention}
          categories={categories}
          handleOpenAddBoard={handleOpenAddBoard}
          handleOpenRenameBoard={handleOpenRenameBoard}
          handleOpenDeleteBoard={handleOpenDeleteBoard}
          handleEditSubmit={handleEditSubmit}
          isSuperAdmin={isSuperAdmin}
          currentUser={currentUser}
          selectedBoard={selectedBoard}
          accountStatus={accountStatus}
          subtasks={subtasks}
          handleToggleSubtask={handleToggleSubtask}
          handleUpdateSubtaskAssignee={handleUpdateSubtaskAssignee}
          handleDeleteSubtask={handleDeleteSubtask}
          handleSubtaskDragEnd={handleSubtaskDragEnd}
          newSubtaskName={newSubtaskName}
          setNewSubtaskName={setNewSubtaskName}
          newSubtaskAssignee={newSubtaskAssignee}
          setNewSubtaskAssignee={setNewSubtaskAssignee}
          handleAddSubtask={handleAddSubtask}
          comments={comments}
          avatarsMap={avatarsMap}
          handleDeleteComment={handleDeleteComment}
          newComment={newComment}
          isAiReplying={isAiReplying}
          handleAskAITaskChat={handleAskAITaskChat}
          handleCommentChange={handleCommentChange}
          insertCommentMention={insertCommentMention}
          handleAddComment={handleAddComment}
          setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
          startEditing={startEditing}
          mentionIndex={mentionIndex}
          setMentionIndex={setMentionIndex}
          setIsMentioning={setIsMentioning}
          isCommentMentioning={isCommentMentioning}
          commentMentionQuery={commentMentionQuery}
          userDirectory={userDirectory}
          commentMentionIndex={commentMentionIndex}
          setCommentMentionIndex={setCommentMentionIndex}
          setIsCommentMentioning={setIsCommentMentioning}
          boards={boards}
          setSelectedBoard={setSelectedBoard}
          handleQuickLinkAdd={handleQuickLinkAdd}
          handleQuickLinkRemove={handleQuickLinkRemove}
          isSubtasksLoading={isSubtasksLoading}
          hasMoreComments={hasMoreComments}
          loadMoreComments={loadMoreComments}
          chatBg={chatBg}
          handleToggleReaction={handleToggleReaction}
          language={language}
          showNotification={showNotification}
          handleToggleAutoNudge={handleToggleAutoNudge}
          isSubmitting={isSubmitting}
        />
      )}

      {previewTask && (
        <TaskDetailModal
          isPreviewMode={true}
          selectedTask={previewTask}
          setSelectedTask={(val) => {
            setPreviewTask(val);
            if (!val && typeof window !== 'undefined') {
              const url = new URL(window.location);
              url.searchParams.delete('task');
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
          currentUser={currentUser}
        />
      )}

      {pendingStatusChange && (
        <UnfinishedSubtasksModal
          pendingStatusChange={pendingStatusChange}
          setPendingStatusChange={setPendingStatusChange}
          confirmPendingStatusChange={confirmPendingStatusChange}
          cancelPendingStatusChange={cancelPendingStatusChange}
          language={language}
        />
      )}
      {isDeleteConfirmOpen && (
        <DeleteTaskModal
          setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
          selectedTask={selectedTask}
          handleDelete={handleDelete}
          language={language}
          isSubmitting={isSubmitting}
        />
      )}
      {commentToDelete && (
        <DeleteCommentModal
          setCommentToDelete={setCommentToDelete}
          confirmDeleteComment={confirmDeleteComment}
          language={language}
        />
      )}
      {memberToRevoke &&
        (() => {
          const member = myTeam.find((m) => String(m.id) === String(memberToRevoke));
          return (
            <RevokeMemberModal
              setMemberToRevoke={setMemberToRevoke}
              confirmRevokeMember={confirmRevokeMember}
              language={language}
              isRequesting={member?.status === 'requesting'}
              isPending={member?.status === 'pending'}
            />
          );
        })()}
      {transferTargetUsername && (
        <TransferOwnershipModal
          transferTargetUsername={transferTargetUsername}
          setTransferTargetUsername={setTransferTargetUsername}
          confirmTransferOwnership={confirmTransferOwnership}
          language={language}
          isSubmitting={isSubmitting}
        />
      )}
      {boardToDelete && (
        <DeleteBoardModal
          boardToDelete={boardToDelete}
          setBoardToDelete={setBoardToDelete}
          deleteBoardConfirmText={deleteBoardConfirmText}
          setDeleteBoardConfirmText={setDeleteBoardConfirmText}
          confirmDeleteBoard={confirmDeleteBoard}
          language={language}
          isSubmitting={isSubmitting}
        />
      )}
      {isExportModalOpen && (
        <ExportModal
          setIsExportModalOpen={setIsExportModalOpen}
          exportMode={exportMode}
          handleExportCSV={handleExportCSV}
          exportStartDate={exportStartDate}
          setExportStartDate={setExportStartDate}
          exportEndDate={exportEndDate}
          setExportEndDate={setExportEndDate}
          language={language}
        />
      )}
      {isCreateBoardOpen && (
        <CreateBoardModal
          setIsCreateBoardOpen={setIsCreateBoardOpen}
          handleCreateBoard={handleCreateBoard}
          newBoardName={newBoardName}
          setNewBoardName={setNewBoardName}
          isPrivateBoard={isPrivateBoard}
          setIsPrivateBoard={setIsPrivateBoard}
          language={language}
          isSubmitting={isSubmitting}
        />
      )}
      {isTeamModalOpen && (
        <TeamModal
          setIsTeamModalOpen={setIsTeamModalOpen}
          handleInviteTeam={handleInviteTeam}
          inviteInput={inviteInput}
          handleInviteInputChange={handleInviteInputChange}
          inviteSuggestions={inviteSuggestions}
          inviteIndex={inviteIndex}
          setInviteIndex={setInviteIndex}
          setInviteSuggestions={setInviteSuggestions}
          avatarsMap={avatarsMap}
          currentUser={currentUser}
          applyInviteSuggestion={applyInviteSuggestion}
          myTeam={myTeam}
          handleRevokeMember={handleRevokeMember}
          handleAcceptAccessRequest={handleAcceptAccessRequest}
          handleTransferToMember={handleTransferToMember}
          language={language}
          selectedBoard={selectedBoard}
          isSuperAdmin={isSuperAdmin}
        />
      )}
      {isInvitesModalOpen && (
        <InvitationsModal
          setIsInvitesModalOpen={setIsInvitesModalOpen}
          invitations={invitations}
          handleAcceptInvite={handleAcceptInvite}
          handleDeclineInvite={handleDeclineInvite}
          language={language}
        />
      )}
      {colModal.isOpen && (
        <ColumnModal
          colModal={colModal}
          setColModal={setColModal}
          handleColSubmit={handleColSubmit}
          language={language}
        />
      )}
      {isLeaveModalOpen && (
        <LeaveModal
          setIsLeaveModalOpen={setIsLeaveModalOpen}
          handleAddLeave={handleAddLeave}
          leaveForm={leaveForm}
          setLeaveForm={setLeaveForm}
          isSuperAdmin={isSuperAdmin}
          currentUser={currentUser}
          leaves={leaves}
          handleDeleteLeave={handleDeleteLeave}
          formatDateMMM={formatDateMMM}
          language={language}
          isSubmitting={isSubmitting}
        />
      )}
      {isAdminModalOpen && (
        <AdminModal
          setIsAdminModalOpen={setIsAdminModalOpen}
          adminUsers={adminUsers}
          handleDeleteUser={handleDeleteUser}
          handleUpdateUserStatus={handleUpdateUserStatus}
          handleToggleSuperAdmin={handleToggleSuperAdmin}
          handleManualVerify={handleManualVerify}
          currentUser={currentUser}
          language={language}
          showNotification={showNotification}
          setAdminUsers={setAdminUsers}
        />
      )}
      {isFeedbackOpen && (
        <FeedbackModal
          setIsFeedbackOpen={setIsFeedbackOpen}
          feedbackText={feedbackText}
          setFeedbackText={setFeedbackText}
          handleFeedbackSubmit={handleFeedbackSubmit}
          language={language}
          isSubmitting={isSubmitting}
        />
      )}
      {isSupportOpen && (
        <ContactSupportModal
          setIsSupportOpen={setIsSupportOpen}
          supportText={supportText}
          setSupportText={setSupportText}
          handleSupportSubmit={handleSupportSubmit}
          language={language}
          isSubmitting={isSubmitting}
        />
      )}
      {isDocsOpen && (
        <DocumentationModal setIsDocsOpen={setIsDocsOpen} isSuperAdmin={isSuperAdmin} language={language} />
      )}
      {isMomNotepadOpen && (
        <MoMNotepadModal
          onClose={() => setIsMomNotepadOpen(false)}
          currentUser={currentUser}
          boards={boards}
          categories={categories}
          fetchTasks={fetchTasks}
          showNotification={showNotification}
          userDirectory={userDirectory}
          isSuperAdmin={isSuperAdmin}
        />
      )}
      {isMyTicketsOpen && (
        <MyTicketsModal
          setIsMyTicketsOpen={setIsMyTicketsOpen}
          language={language}
          setSelectedTask={setSelectedTask}
          notifications={notifications}
        />
      )}
      {isLogoutConfirmOpen && (
        <LogoutConfirmModal
          setIsLogoutConfirmOpen={setIsLogoutConfirmOpen}
          handleLogout={handleLogout}
          language={language}
        />
      )}
      {isChatWorkspaceOpen && (
        <ChatWorkspaceModal
          setIsChatWorkspaceOpen={setIsChatWorkspaceOpen}
          boards={boards}
          tasks={tasks}
          avatarsMap={avatarsMap}
          currentUser={currentUser}
          formatDateMMM={formatDateMMM}
          language={language}
          handleAskAITaskChat={handleAskAITaskChat}
          handleToggleReaction={handleToggleReaction}
          handleDeleteComment={handleDeleteComment}
          deleteProjectChatMessage={deleteProjectChatMessage}
          showNotification={showNotification}
          accountStatus={accountStatus}
          isAiReplying={isAiReplying}
          setSelectedTask={setSelectedTask}
          isSuperAdmin={isSuperAdmin}
          notifications={notifications}
          handleNotificationTaskClick={handleNotificationTaskClick}
          handleReadNotification={handleReadNotification}
          userDirectory={userDirectory}
          dmConversations={dmConversations}
          setDmConversations={setDmConversations}
          fetchDmConversations={fetchDmConversations}
          inboxChats={inboxChats}
          isInboxLoading={isInboxLoading}
          fetchInboxChats={fetchInboxChats}
          handleMarkAllInboxAsRead={handleMarkAllInboxAsRead}
          chatBg={chatBg}
          workspaceChatTarget={workspaceChatTarget}
          setWorkspaceChatTarget={setWorkspaceChatTarget}
        >
          {selectedTask && (
            <TaskDetailModal
              isInline={true}
              onCloseInline={() => setSelectedTask(null)}
              tasks={tasks}
              selectedTask={selectedTask}
              setSelectedTask={setSelectedTask}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              handleDirectStatusChange={handleDirectStatusChange}
              columns={columns}
              editFormData={editFormData}
              setEditFormData={setEditFormData}
              formatDateMMM={formatDateMMM}
              handleRequesterChange={handleRequesterChange}
              isMentioning={isMentioning}
              teamMembers={teamMembers}
              mentionQuery={mentionQuery}
              insertMention={insertMention}
              categories={categories}
              handleOpenAddBoard={handleOpenAddBoard}
              handleOpenRenameBoard={handleOpenRenameBoard}
              handleOpenDeleteBoard={handleOpenDeleteBoard}
              handleEditSubmit={handleEditSubmit}
              isSuperAdmin={isSuperAdmin}
              currentUser={currentUser}
              selectedBoard={selectedBoard}
              accountStatus={accountStatus}
              subtasks={subtasks}
              handleToggleSubtask={handleToggleSubtask}
              handleUpdateSubtaskAssignee={handleUpdateSubtaskAssignee}
              handleDeleteSubtask={handleDeleteSubtask}
              handleSubtaskDragEnd={handleSubtaskDragEnd}
              newSubtaskName={newSubtaskName}
              setNewSubtaskName={setNewSubtaskName}
              newSubtaskAssignee={newSubtaskAssignee}
              setNewSubtaskAssignee={setNewSubtaskAssignee}
              handleAddSubtask={handleAddSubtask}
              comments={comments}
              avatarsMap={avatarsMap}
              handleDeleteComment={handleDeleteComment}
              newComment={newComment}
              isAiReplying={isAiReplying}
              handleAskAITaskChat={handleAskAITaskChat}
              handleCommentChange={handleCommentChange}
              insertCommentMention={insertCommentMention}
              handleAddComment={handleAddComment}
              setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
              startEditing={startEditing}
              mentionIndex={mentionIndex}
              setMentionIndex={setMentionIndex}
              setIsMentioning={setIsMentioning}
              isCommentMentioning={isCommentMentioning}
              commentMentionQuery={commentMentionQuery}
              userDirectory={userDirectory}
              commentMentionIndex={commentMentionIndex}
              setCommentMentionIndex={setCommentMentionIndex}
              setIsCommentMentioning={setIsCommentMentioning}
              boards={boards}
              setSelectedBoard={setSelectedBoard}
              handleQuickLinkAdd={handleQuickLinkAdd}
              handleQuickLinkRemove={handleQuickLinkRemove}
              isSubtasksLoading={isSubtasksLoading}
              hasMoreComments={hasMoreComments}
              loadMoreComments={loadMoreComments}
              chatBg={chatBg}
              handleToggleReaction={handleToggleReaction}
              language={language}
              showNotification={showNotification}
              handleToggleAutoNudge={handleToggleAutoNudge}
              isSubmitting={isSubmitting}
            />
          )}
        </ChatWorkspaceModal>
      )}
      {isPrivacyOpen && <PrivacyPolicyModal setIsPrivacyOpen={setIsPrivacyOpen} language={language} />}
      {isTermsOpen && <TermsOfServiceModal setIsTermsOpen={setIsTermsOpen} language={language} />}
      {isSpecsOpen && <SystemSpecsModal setIsSpecsOpen={setIsSpecsOpen} language={language} />}
      {isChangelogOpen && <ChangelogModal setIsChangelogOpen={setIsChangelogOpen} language={language} />}

      {showWelcomeTour && (
        <WelcomeTourModal
          setShowWelcomeTour={setShowWelcomeTour}
          startDriverTour={startDriverTour}
          language={language}
          setLanguage={setLanguage}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          setIsProactiveAIOpen={setIsProactiveAIOpen}
          currentUser={currentUser}
        />
      )}
    </>
  );
}
