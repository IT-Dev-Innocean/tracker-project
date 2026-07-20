import { useState } from 'react';

export function useUISettings() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [notification, setNotification] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('innocean_notify');
      if (saved) {
        sessionStorage.removeItem('innocean_notify');
        return { ...JSON.parse(saved), id: Date.now() };
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  
  // Modals & Popups UI states that aren't in useModals
  const [inviteInput, setInviteInput] = useState('');
  const [inviteSuggestions, setInviteSuggestions] = useState([]);
  const [inviteIndex, setInviteIndex] = useState(0);

  // Mentions
  const [isMentioning, setIsMentioning] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [isCommentMentioning, setIsCommentMentioning] = useState(false);
  const [commentMentionQuery, setCommentMentionQuery] = useState('');
  const [commentMentionIndex, setCommentMentionIndex] = useState(0);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification((prev) => (prev && prev.id === Date.now() ? null : prev));
    }, 4000);
  };

  return {
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    notification, setNotification,
    isLoading, setIsLoading,
    inviteInput, setInviteInput,
    inviteSuggestions, setInviteSuggestions,
    inviteIndex, setInviteIndex,
    isMentioning, setIsMentioning,
    mentionQuery, setMentionQuery,
    mentionIndex, setMentionIndex,
    isCommentMentioning, setIsCommentMentioning,
    commentMentionQuery, setCommentMentionQuery,
    commentMentionIndex, setCommentMentionIndex,
    showNotification
  };
}
