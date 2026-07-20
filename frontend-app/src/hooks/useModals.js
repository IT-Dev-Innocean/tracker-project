import { useState } from 'react';

export function useModals() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isInvitesModalOpen, setIsInvitesModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [showTosUpdate, setShowTosUpdate] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_docs_open') === 'true';
    return false;
  });
  const [isMomNotepadOpen, setIsMomNotepadOpen] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_mom_notepad_open') === 'true';
    return false;
  });
  const [isMyTicketsOpen, setIsMyTicketsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isChatWorkspaceOpen, setIsChatWorkspaceOpen] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_chat_ws_open') === 'true';
    return false;
  });
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_changelog_open') === 'true';
    return false;
  });
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isProactiveAIOpen, setIsProactiveAIOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('innocean_proactive_ai_open');
      if (savedState === 'true') return true;

      const currentUsr = localStorage.getItem('innocean_username');
      const hasSeenTour = localStorage.getItem(`innocean_tour_done_v2_${currentUsr}`);
      const legacyTour = localStorage.getItem('innocean_tour_done_v2');
      const hasCompletedTour = hasSeenTour || legacyTour;

      const justLoggedIn = sessionStorage.getItem('innocean_just_logged_in');
      if (justLoggedIn === 'true') {
        if (hasCompletedTour) return true;
      }
    }
    return false;
  });
  const [isProjectChatOpen, setIsProjectChatOpen] = useState(false);
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [workspaceChatTarget, setWorkspaceChatTarget] = useState(null);

  return {
    isFormOpen, setIsFormOpen,
    isDeleteConfirmOpen, setIsDeleteConfirmOpen,
    isTeamModalOpen, setIsTeamModalOpen,
    isInvitesModalOpen, setIsInvitesModalOpen,
    isSettingsOpen, setIsSettingsOpen,
    isAdminModalOpen, setIsAdminModalOpen,
    isNotifOpen, setIsNotifOpen,
    isCreateBoardOpen, setIsCreateBoardOpen,
    showTosUpdate, setShowTosUpdate,
    isExportModalOpen, setIsExportModalOpen,
    isLeaveModalOpen, setIsLeaveModalOpen,
    isGlobalSearchOpen, setIsGlobalSearchOpen,
    isFeedbackOpen, setIsFeedbackOpen,
    isSupportOpen, setIsSupportOpen,
    isDocsOpen, setIsDocsOpen,
    isMomNotepadOpen, setIsMomNotepadOpen,
    isMyTicketsOpen, setIsMyTicketsOpen,
    isMobileMenuOpen, setIsMobileMenuOpen,
    isMobileProfileOpen, setIsMobileProfileOpen,
    isLogoutConfirmOpen, setIsLogoutConfirmOpen,
    isChatWorkspaceOpen, setIsChatWorkspaceOpen,
    isPrivacyOpen, setIsPrivacyOpen,
    isTermsOpen, setIsTermsOpen,
    isSpecsOpen, setIsSpecsOpen,
    isChangelogOpen, setIsChangelogOpen,
    isAssistantOpen, setIsAssistantOpen,
    isProactiveAIOpen, setIsProactiveAIOpen,
    isProjectChatOpen, setIsProjectChatOpen,
    isChatSearchOpen, setIsChatSearchOpen,
    showWelcomeTour, setShowWelcomeTour,
    workspaceChatTarget, setWorkspaceChatTarget,
  };
}
