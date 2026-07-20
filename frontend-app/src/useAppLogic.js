import { useFilters } from './hooks/useFilters';
import { useTheme } from './hooks/useTheme';
import { useModals } from './hooks/useModals';
import { useAuth } from './hooks/useAuth';
import { useTask } from './hooks/useTask';
import { useBoard } from './hooks/useBoard';
import { useUISettings } from './hooks/useUISettings';
import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import axios from 'axios'; 
import { useGoogleLogin } from '@react-oauth/google';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const DEFAULT_COLUMNS = ['Pending', 'In Progress', 'Done', 'Rejected'];
const DEFAULT_CATEGORIES = ['Development', 'Design', 'Marketing', 'Research', 'Maintenance', 'Consulting', 'Other'];
const DAY_WIDTH = 45;
let cachedGlobalTasks = null;
let cachedGlobalTasksTime = 0;

export const isUserAssigned = (task, username) => {
  if (!task || !username) return false;
  const uname = username.toLowerCase();
  const reqLower = (task.requester || '').toLowerCase();
  const escapedUname = uname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const isMentionedExact = new RegExp(`@${escapedUname}(?![\\w.-])`, 'i').test(reqLower);
  const isAssignedSubtask =
    (task.subtask_assignees || '').toLowerCase().split(', ').includes(uname) ||
    (Array.isArray(task.subtasks) && task.subtasks.some((st) => (st.assignee || '').toLowerCase() === uname));
  const isOwner = (task.owner_username || '').toLowerCase() === uname;
  const hasAnyMention = reqLower.includes('@');

  return isMentionedExact || isAssignedSubtask || (isOwner && !hasAnyMention);
};

const translations = {
  en: {
    File: 'File',
    Team: 'Team',
    Account: 'Account',
    'New Request': 'New Request',
    'Export CSV': 'Export CSV',
    'Manage Team': 'Manage Team',
    Invitations: 'Invitations',
    'Team Chat': 'Team Chat',
    Profile: 'Profile',
    'Time Off': 'Time Off',
    'Replay Tour': 'Replay Tour',
    Admin: 'Admin',
    'Search across all projects...': 'Search across all projects...',
    'Your Projects': 'Your Projects',
    'Select a workspace to start managing tasks.': 'Select a workspace to start managing tasks.',
    'New Project': 'New Project',
    'Global Export': 'Get All My Data',
    'Master View': 'Master View',
    'Global Workload': 'See the Big Picture',
    'All tasks across your projects': 'All tasks across your projects',
    'Click to View Everything': 'Click to View Everything',
    'Kanban Board': 'Kanban Board',
    'Table List': 'Table List',
    Analytics: 'Analytics',
    Timeline: 'Timeline',
    Calendar: 'Calendar',
    'My Tasks': 'My Tasks',
    'Group: Status': 'Group: Status',
    'Group: Category': 'Group: Category',
    'Group: Assignee': 'Group: Assignee',
    'Group: Project': 'Group: Project',
    'Sort: Default': 'Sort: Default',
    'Sort: Due Date': 'Sort: Due Date',
    'Sort: Date Created': 'Sort: Date Created',
    'Sort: Impact': 'Sort: Impact',
  },
  id: {
    File: 'Berkas',
    Team: 'Tim',
    Account: 'Akun',
    'New Request': 'Tugas Baru',
    'Export CSV': 'Ekspor CSV',
    'Manage Team': 'Kelola Tim',
    Invitations: 'Undangan',
    'Team Chat': 'Obrolan Tim',
    Profile: 'Profil',
    'Time Off': 'Cuti & Libur',
    'Replay Tour': 'Ulangi Tur',
    Admin: 'Admin',
    'Search across all projects...': 'Cari di semua proyek...',
    'Your Projects': 'Proyek Anda',
    'Select a workspace to start managing tasks.': 'Pilih ruang kerja untuk mulai mengelola tugas.',
    'New Project': 'Proyek Baru',
    'Global Export': 'Dapatkan Semua Data',
    'Master View': 'Tampilan Utama',
    'Global Workload': 'Lihat Gambaran Besar',
    'All tasks across your projects': 'Semua tugas di seluruh proyek Anda',
    'Click to View Everything': 'Klik untuk Melihat Semua',
    'Kanban Board': 'Papan Kanban',
    'Table List': 'Daftar Tabel',
    Analytics: 'Analitik',
    Timeline: 'Lini Masa',
    Calendar: 'Kalender',
    'My Tasks': 'Tugas Saya',
    'Group: Status': 'Grup: Status',
    'Group: Category': 'Grup: Kategori',
    'Group: Assignee': 'Grup: Pekerja',
    'Group: Project': 'Grup: Proyek',
    'Sort: Default': 'Urutkan: Bawaan',
    'Sort: Due Date': 'Urutkan: Tenggat Waktu',
    'Sort: Date Created': 'Urutkan: Tanggal Dibuat',
    'Sort: Impact': 'Urutkan: Dampak',
  },
};

// Helper untuk mengekstrak nama pekerja (Assignee) dari data tugas
export const getTaskAssignee = (task) => {
  if (!task) return 'Unassigned';
  const match = (task.requester || '').match(/@([\w.-]+)/);
  if (match) return `@${match[1]}`;
  if (task.owner_username) return `@${task.owner_username}`;
  return 'Unassigned';
};

const parseLocalZero = (dateStr) => {
  if (!dateStr) return new Date(0);
  const d = new Date(dateStr.split(' ')[0].replace(/-/g, '/'));
  d.setHours(0, 0, 0, 0);
  return d;
};

const getLocalToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(
    2,
    '0'
  )}`;
};

export default function useAppLogic() {
  const { searchQuery, setSearchQuery, groupBy, setGroupBy, sortBy, setSortBy } = useFilters();

  // Set default sort on initial load
  useEffect(() => {
    setSortBy('Date Created');
  }, []); // Empty dependency array ensures this runs only once on mount

  const {
    isDarkMode,
    setIsDarkMode,
    appTheme,
    setAppTheme,
    appBgImage,
    setAppBgImage,
    appTexture,
    setAppTexture,
    cardTheme,
    setCardTheme,
    language,
    setLanguage,
  } = useTheme();

  const {
    isFormOpen,
    setIsFormOpen,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    isTeamModalOpen,
    setIsTeamModalOpen,
    isInvitesModalOpen,
    setIsInvitesModalOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isAdminModalOpen,
    setIsAdminModalOpen,
    isNotifOpen,
    setIsNotifOpen,
    isCreateBoardOpen,
    setIsCreateBoardOpen,
    showTosUpdate,
    setShowTosUpdate,
    isExportModalOpen,
    setIsExportModalOpen,
    isLeaveModalOpen,
    setIsLeaveModalOpen,
    isGlobalSearchOpen,
    setIsGlobalSearchOpen,
    isFeedbackOpen,
    setIsFeedbackOpen,
    isSupportOpen,
    setIsSupportOpen,
    isDocsOpen,
    setIsDocsOpen,
    isMomNotepadOpen,
    setIsMomNotepadOpen,
    isMyTicketsOpen,
    setIsMyTicketsOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isMobileProfileOpen,
    setIsMobileProfileOpen,
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
    isAssistantOpen,
    setIsAssistantOpen,
    isProactiveAIOpen,
    setIsProactiveAIOpen,
    isProjectChatOpen,
    setIsProjectChatOpen,
    isChatSearchOpen,
    setIsChatSearchOpen,
    showWelcomeTour,
    setShowWelcomeTour,
    workspaceChatTarget,
    setWorkspaceChatTarget,
  } = useModals();

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('token')) {
      localStorage.removeItem('innocean_auth');
      localStorage.removeItem('innocean_token');
      localStorage.removeItem('innocean_username');
      return false;
    }
    return localStorage.getItem('innocean_auth') === 'true';
  });

  const isAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('token')) return '';
    return localStorage.getItem('innocean_username') || '';
  });
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showAuthForm, setShowAuthForm] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const path = window.location.pathname;
      if (
        params.get('token') ||
        params.get('verify') ||
        params.get('task') ||
        params.get('board') ||
        path.startsWith('/task/') ||
        path.startsWith('/project/')
      )
        return true;
    }
    return false;
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [resetToken, setResetToken] = useState(() => {
    if (typeof window !== 'undefined') return new URLSearchParams(window.location.search).get('token');
    return null;
  });
  const [isResetMode, setIsResetMode] = useState(!!resetToken);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [colModal, setColModal] = useState({ isOpen: false, target: 'Status', mode: 'add', oldName: '', newName: '' });
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('innocean_view_mode') || 'kanban';
    }
    return 'kanban';
  });
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showHasSubtasks, setShowHasSubtasks] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_hide_completed') === 'true';
    return false;
  });
  const [calDate, setCalDate] = useState(new Date());
  const [subtasks, setSubtasks] = useState([]);
  const [clonedTaskIds, setClonedTaskIds] = useState(new Set());
  const isInitialTasksLoad = useRef(true);
  const [isSubtasksLoading, setIsSubtasksLoading] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState('');
  const [formData, setFormData] = useState({
    project_name: '',
    requester: '',
    category: 'Development',
    description: '',
    supporting_access: '',
    start_date: getLocalToday(),
    deadline: getLocalToday(),
    impact: 'Medium',
    etc: 2,
    auto_nudge: false,
    recurring: 'none',
  });
  const [formSubtasks, setFormSubtasks] = useState([]);
  const [formSubtaskInput, setFormSubtaskInput] = useState('');
  const [formSubtaskAssignee, setFormSubtaskAssignee] = useState('');
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
  const [inviteInput, setInviteInput] = useState('');
  const [inviteSuggestions, setInviteSuggestions] = useState([]);
  const [inviteIndex, setInviteIndex] = useState(0);
  const [userDirectory, setUserDirectory] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [profileData, setProfileData] = useState({ username: '', email: '', full_name: '' });
  const [isMentioning, setIsMentioning] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [isCommentMentioning, setIsCommentMentioning] = useState(false);
  const [commentMentionQuery, setCommentMentionQuery] = useState('');
  const [commentMentionIndex, setCommentMentionIndex] = useState(0);
  const [adminUsers, setAdminUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showTimesheets, setShowTimesheets] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_show_timesheets') === 'true';
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('innocean_show_timesheets', String(showTimesheets));
    }
  }, [showTimesheets]);
  const [isNotifClosing, setIsNotifClosing] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [memberToRevoke, setMemberToRevoke] = useState(null);
  const [transferTargetUsername, setTransferTargetUsername] = useState(null);
  const [avatarsMap, setAvatarsMap] = useState({});
  const [myTeam, setMyTeam] = useState([]);
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('innocean_selected_board');
      return saved && saved !== 'null' && saved !== 'undefined' ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [newBoardName, setNewBoardName] = useState('');
  const [isPrivateBoard, setIsPrivateBoard] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);

  // PWA (Progressive Web App) Install Logic
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    }
  };

  // ToS & Privacy Policy Update Consent Logic
  const prevProactiveAIOpen = useRef(isProactiveAIOpen);
  useEffect(() => {
    if (prevProactiveAIOpen.current === true && !isProactiveAIOpen && isAuthenticated && currentUser) {
      const hasAccepted = localStorage.getItem(`innocean_tos_accepted_${currentUser}`);
      if (hasAccepted !== 'true') {
        const timer = setTimeout(() => {
          setShowTosUpdate(true);
        }, 15000); // Delay 15 detik setelah Proactive AI ditutup
        return () => clearTimeout(timer);
      }
    }
    prevProactiveAIOpen.current = isProactiveAIOpen;
  }, [isProactiveAIOpen, isAuthenticated, currentUser]);

  const handleAcceptTos = () => {
    localStorage.setItem(`innocean_tos_accepted_${currentUser}`, 'true');
    setShowTosUpdate(false);
    showNotification(
      language === 'id' ? 'Terima kasih telah menyetujui persyaratan!' : 'Thank you for accepting the terms!',
      'success'
    );
  };
  const [deleteBoardConfirmText, setDeleteBoardConfirmText] = useState('');
  const [exportMode, setExportMode] = useState('board');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [leaves, setLeaves] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ start_date: '', end_date: '', desc: '', type: 'personal' });
  const [timelineDrag, setTimelineDrag] = useState(null);
  const [hoveredTimelineRow, setHoveredTimelineRow] = useState(null);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [isBoardsLoading, setIsBoardsLoading] = useState(false);
  const [isKanbanDragging, setIsKanbanDragging] = useState(false);
  const [isTrashHovered, setIsTrashHovered] = useState(false);

  // State Khusus Pratinjau Publik
  const [previewTask, setPreviewTask] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated) {
      const path = window.location.pathname;
      if (path.startsWith('/task/')) {
        const taskId = parseInt(path.replace('/task/', '').split('-')[0], 10);
        if (!isNaN(taskId)) {
          axios
            .get(`/api/tasks/preview/${taskId}`)
            .then((res) => {
              setPreviewTask(res.data.task);
            })
            .catch((err) => {
              console.error('Preview error', err);
              alert(
                language === 'id'
                  ? 'Gagal memuat pratinjau. Tugas mungkin telah dihapus, bersifat privat, atau server sedang sibuk (Cold Start).'
                  : 'Failed to load preview. The task might be deleted, private, or the server is busy.'
              );
            });
        }
      }
    }
  }, [isAuthenticated]);

  // NEW: Project Boards Preferences
  const [boardViewMode, setBoardViewMode] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_board_view') || 'grid';
    return 'grid';
  });
  const [boardSortBy, setBoardSortBy] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_board_sort') || 'active';
    return 'active';
  });
  const [favoriteBoards, setFavoriteBoards] = useState(() => {
    if (typeof window !== 'undefined') return JSON.parse(localStorage.getItem('innocean_fav_boards') || '[]');
    return [];
  });
  useEffect(() => localStorage.setItem('innocean_board_view', boardViewMode), [boardViewMode]);
  useEffect(() => localStorage.setItem('innocean_board_sort', boardSortBy), [boardSortBy]);
  useEffect(() => localStorage.setItem('innocean_fav_boards', JSON.stringify(favoriteBoards)), [favoriteBoards]);
  useEffect(() => localStorage.setItem('innocean_hide_completed', hideCompleted), [hideCompleted]);

  const confirmPendingStatusChange = () => {
    if (!pendingStatusChange) return;
    const { type, payload } = pendingStatusChange;
    if (type === 'drag') {
      onDragEnd(payload, true);
    } else if (type === 'direct') {
      handleDirectStatusChange(payload, true);
    } else if (type === 'edit') {
      handleEditSubmit(null, true);
    } else if (type === 'timeline') {
      handleMouseUp(null, payload);
    }
    setPendingStatusChange(null);
  };

  const cancelPendingStatusChange = () => {
    if (pendingStatusChange?.previousTasks) {
      setTasks(pendingStatusChange.previousTasks);
    }
    setPendingStatusChange(null);
  };

  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isGlobalSearchClosing, setIsGlobalSearchClosing] = useState(false);
  const [accountStatus, setAccountStatus] = useState('active');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [supportText, setSupportText] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('innocean_docs_open', isDocsOpen);
  }, [isDocsOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('innocean_mom_notepad_open', isMomNotepadOpen);
  }, [isMomNotepadOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('innocean_chat_ws_open', isChatWorkspaceOpen);
  }, [isChatWorkspaceOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('innocean_changelog_open', isChangelogOpen);
  }, [isChangelogOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('innocean_proactive_ai_open', isProactiveAIOpen);
  }, [isProactiveAIOpen]);

  const [chatBg, setChatBg] = useState('');
  const [projectChatMessages, setProjectChatMessages] = useState([]);
  const [newProjectChatMessage, setNewProjectChatMessage] = useState('');
  const [drawerTab, setDrawerTab] = useState('team'); // 'team' or 'assistant'
  const [isProjectMentioning, setIsProjectMentioning] = useState(false);
  const [projectMentionQuery, setProjectMentionQuery] = useState('');
  const [projectMentionIndex, setProjectMentionIndex] = useState(0);
  const [hasNewProjectChat, setHasNewProjectChat] = useState(false);
  const [hasMoreProjectChat, setHasMoreProjectChat] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [dmConversations, setDmConversations] = useState([]);
  const [inboxChats, setInboxChats] = useState([]);
  const [isInboxLoading, setIsInboxLoading] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [latestMentionId, setLatestMentionId] = useState(null);
  const [dismissedMentionIds, setDismissedMentionIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const t = (key) => translations[language]?.[key] || key;
  const tMsg = (en, id) => (language === 'id' ? id : en);

  const [dateFormat, setDateFormat] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_date_format') || 'DD MMM YYYY';
    return 'DD MMM YYYY';
  });

  const [showLiveClock, setShowLiveClock] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_show_clock') === 'true';
    return false;
  });
  const [showLiveClockDate, setShowLiveClockDate] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_show_clock_date') !== 'false';
    return true;
  });
  const [pomodoroEnabled, setPomodoroEnabled] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_pomodoro') === 'true';
    return false;
  });
  const [showAssistantButton, setShowAssistantButton] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_show_assistant_btn') !== 'false';
    return true;
  });
  const [notifPosition, setNotifPosition] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_notif_pos') || 'bottom-right';
    return 'bottom-right';
  });
  const [notifSound, setNotifSound] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_notif_sound') !== 'false';
    return true;
  });
  const [notifPrivacy, setNotifPrivacy] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_notif_privacy') === 'true';
    return false;
  });

  const [browserNotifEnabled, setBrowserNotifEnabled] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('innocean_browser_notif') === 'true';
    return false;
  });

  const lastNotifIdRef = useRef(null);

  useEffect(() => {
    if (notifications.length > 0) {
      const maxId = Math.max(...notifications.map((n) => n.id));
      if (lastNotifIdRef.current === null) {
        lastNotifIdRef.current = maxId;
      } else if (maxId > lastNotifIdRef.current) {
        const newNotifs = notifications.filter((n) => n.id > lastNotifIdRef.current && !n.is_read);
        if (newNotifs.length > 0) {
          const singleMsg = newNotifs[0].message.replace(/(?:<!--|&lt;!--)\s*TASK_ID:\d+\s*(?:-->|--&gt;)/gi, '');
          const multiMsg =
            language === 'id'
              ? `Anda memiliki ${newNotifs.length} notifikasi aktivitas baru.`
              : `You have ${newNotifs.length} new activity notifications.`;
          const displayMsg = newNotifs.length === 1 ? singleMsg : multiMsg;

          // Tampilkan Desktop Notif jika diizinkan
          if (browserNotifEnabled && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('INNOCEAN Tracker', { body: displayMsg });
          }

          // Tampilkan Toast In-App Notif
          setNotification({ message: displayMsg, type: 'info', id: Date.now() });

          // Auto-refresh papan Kanban agar task yang baru masuk langsung muncul tanpa perlu refresh halaman
          if (selectedBoard) fetchTasks();
          fetchBoards(); // Memperbarui lencana peringatan merah (badges) di beranda secara otomatis
        }
        lastNotifIdRef.current = maxId;
      }
    }
  }, [notifications, browserNotifEnabled, language, selectedBoard]);

  const formatDateMMM = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString.replace(/-/g, '/'));
    if (isNaN(d)) return dateString.split(' ')[0];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (dateFormat === 'DD/MM/YYYY') {
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } else if (dateFormat === 'YYYY-MM-DD') {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else if (dateFormat === 'MMM DD, YYYY') {
      return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
    }
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const prevChatLenRef = useRef(0);
  const chatEndRef = useRef(null);

  const closeNotif = () => {
    setIsNotifClosing(true);
    setTimeout(() => {
      setIsNotifOpen(false);
      setIsNotifClosing(false);
    }, 200);
  };

  const closeGlobalSearch = () => {
    setIsGlobalSearchClosing(true);
    setTimeout(() => {
      setIsGlobalSearchOpen(false);
      setIsGlobalSearchClosing(false);
    }, 200);
  };

  useEffect(() => {
    if (currentUser) {
      setChatBg(localStorage.getItem(`innocean_chat_bg_${currentUser}`) || '');
    } else {
      setChatBg('');
    }
  }, [currentUser]);

  const handleChatBgUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotification('Image size must be less than 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setChatBg(reader.result);
        if (currentUser) {
          localStorage.setItem(`innocean_chat_bg_${currentUser}`, reader.result);
        }
        showNotification('Chat background updated!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeChatBg = () => {
    setChatBg('');
    if (currentUser) {
      localStorage.removeItem(`innocean_chat_bg_${currentUser}`);
    }
    showNotification('Chat background removed!', 'success');
  };

  const handleSelectDefaultBg = (bgStr) => {
    setChatBg(bgStr);
    if (currentUser) {
      localStorage.setItem(`innocean_chat_bg_${currentUser}`, bgStr);
    }
    showNotification('Chat theme updated!', 'success');
  };

  const handleSelectAppTheme = (themeStr) => {
    setAppTheme(themeStr);
    if (typeof window !== 'undefined') localStorage.setItem('innocean_app_theme', themeStr);
    showNotification('App background updated!', 'success');
  };

  const handleAppBgUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size must be less than 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAppBgImage(reader.result);
        if (typeof window !== 'undefined') localStorage.setItem('innocean_app_bg_image', reader.result);
        showNotification('Custom background updated!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAppBgImage = () => {
    setAppBgImage('');
    if (typeof window !== 'undefined') localStorage.removeItem('innocean_app_bg_image');
    showNotification('Custom background removed!', 'success');
  };

  const handleSelectAppTexture = (textureStr) => {
    setAppTexture(textureStr);
    if (typeof window !== 'undefined') localStorage.setItem('innocean_app_texture', textureStr);
    showNotification('Texture overlay updated!', 'success');
  };

  const handleSelectCardTheme = (themeStr) => {
    setCardTheme(themeStr);
    if (typeof window !== 'undefined') localStorage.setItem('innocean_card_theme', themeStr);
    showNotification('Task card theme updated!', 'success');
  };

  useEffect(() => {
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [isLoginMode, isForgotMode, isResetMode, showAuthForm]);

  const driverRef = useRef(null);
  const scrollRef = useRef(null);
  const activeScrollRef = useRef(null);
  const mouseUpRef = useRef();
  const currentBoardIdRef = useRef(null);
  const commentsLengthRef = useRef(0);
  const projectChatLengthRef = useRef(0);

  useEffect(() => {
    commentsLengthRef.current = comments.length;
    projectChatLengthRef.current = projectChatMessages.length;
  }, [comments, projectChatMessages]);

  const showNotification = (message, type = 'info') => {
    let safeMessage = message;
    if (message && typeof message !== 'string') {
      try {
        safeMessage = JSON.stringify(message);
      } catch (e) {
        safeMessage = 'An unexpected error occurred.';
      }
    }
    setNotification({ message: safeMessage, type, id: Date.now() });
  };

  const startTour = () => {
    setShowWelcomeTour(true);
  };

  const startDriverTour = () => {
    let driverObj = null;
    driverObj = driver({
      allowClose: true,
      allowKeyboardControl: true,
      showProgress: true,
      animate: true,
      overlayColor: 'rgba(0, 0, 0, 0.75)',
      onDestroyStarted: () => {
        if (!selectedBoard || selectedBoard.id === 'global') {
          localStorage.setItem(`innocean_tour_done_v2_${currentUser}`, 'true');
          setIsProactiveAIOpen(true);
        } else {
          localStorage.setItem(`innocean_board_tour_done_v2_${currentUser}`, 'true');
        }
        setIsFormOpen(false);
        setIsMobileMenuOpen(false);
        driverObj.destroy();
      },
      steps:
        !selectedBoard || selectedBoard.id === 'global'
          ? [
              {
                popover: {
                  title: tMsg('Welcome to INNOCEAN Tracker! 🚀', 'Selamat datang di INNOCEAN Tracker! 🚀'),
                  description: tMsg(
                    'This is your main dashboard. Let us give you a quick tour! Click the logo anytime to return here.',
                    'Ini adalah dasbor utama Anda. Mari kita mulai tur singkat! Klik logo kapan saja untuk kembali ke sini.'
                  ),
                  side: 'bottom',
                  align: 'start',
                },
              },
              {
                element: '.tour-ai-briefing',
                popover: {
                  title: tMsg('AI Daily Briefing', 'Ringkasan Harian AI'),
                  description: tMsg(
                    'Get a quick AI-powered summary of your workload and priorities for the day.',
                    'Dapatkan ringkasan singkat bertenaga AI tentang beban kerja dan prioritas Anda hari ini.'
                  ),
                  side: 'bottom',
                  align: 'start',
                },
              },
              {
                element: '.tour-my-capacity',
                popover: {
                  title: tMsg('Your Capacity Meter', 'Pengukur Kapasitas Anda'),
                  description: tMsg(
                    "This meter shows your remaining active workload in hours. It also warns you if you're approaching a weekly or monthly overload, helping you manage your bandwidth.",
                    'Pengukur ini menunjukkan sisa beban kerja aktif Anda dalam jam. Ini juga akan memberi peringatan jika Anda mendekati kelebihan beban mingguan atau bulanan, membantu Anda mengelola kapasitas kerja.'
                  ),
                  side: 'bottom',
                  align: 'start',
                },
              },
              {
                element: '.tour-quick-stats',
                popover: {
                  title: tMsg('Quick Stats', 'Statistik Cepat'),
                  description: tMsg(
                    'Keep an eye on your personal tasks, active projects, and any overdue or critical items.',
                    'Pantau tugas pribadi Anda, proyek aktif, dan item yang terlambat atau kritis.'
                  ),
                  side: 'top',
                  align: 'start',
                },
              },
              {
                element: '.tour-top-queue',
                popover: {
                  title: tMsg('My Top Queue', 'Antrean Teratas Saya'),
                  description: tMsg(
                    'Tackle your highest priority pending tasks here to keep your work flowing smoothly.',
                    'Selesaikan tugas tertunda dengan prioritas tertinggi Anda di sini agar pekerjaan Anda berjalan lancar.'
                  ),
                  side: 'top',
                  align: 'start',
                },
              },
              {
                element: '.tour-recent-comments',
                popover: {
                  title: tMsg('Recent Comments', 'Komentar Terbaru'),
                  description: tMsg(
                    'Stay in the loop with the latest discussions, task updates, and teammate feedback.',
                    'Tetap terinformasi dengan diskusi terbaru, pembaruan tugas, dan masukan rekan tim.'
                  ),
                  side: 'top',
                  align: 'start',
                },
              },
              {
                element: '.tour-home-new-project',
                popover: {
                  title: tMsg('Create a Project', 'Buat Proyek'),
                  description: tMsg(
                    'Start a new project workspace here. You can invite your team members later.',
                    'Mulai ruang kerja proyek baru di sini. Anda dapat mengundang anggota tim nanti.'
                  ),
                  side: 'left',
                  align: 'start',
                },
              },
              {
                element: '.tour-global-board',
                popover: {
                  title: tMsg('Global Board', 'Papan Global'),
                  description: tMsg(
                    'Access your Global Board from the sidebar anytime to see tasks from all projects.',
                    'Akses Papan Global Anda dari bilah sisi kapan saja untuk melihat tugas dari semua proyek.'
                  ),
                  side: 'right',
                  align: 'start',
                },
                onHighlightStarted: () => {
                  if (window.innerWidth < 768 && !isMobileMenuOpen) {
                    setIsMobileMenuOpen(true);
                  }
                },
              },
              {
                element: '.tour-my-todolist',
                popover: {
                  title: tMsg('My To-Do List', 'Daftar Tugas Saya'),
                  description: tMsg(
                    'Access your personal to-do list quickly from here. Keep track of your own tasks across all projects.',
                    'Akses daftar tugas pribadi Anda dengan cepat dari sini. Pantau tugas Anda sendiri di semua proyek.'
                  ),
                  side: 'right',
                  align: 'start',
                },
                onHighlightStarted: () => {
                  if (window.innerWidth < 768 && !isMobileMenuOpen) {
                    setIsMobileMenuOpen(true);
                  }
                },
              },
              {
                element: '.tour-project-card',
                popover: {
                  title: tMsg('Your Projects', 'Proyek Anda'),
                  description: tMsg(
                    'Your individual project workspaces will appear here in the sidebar.',
                    'Ruang kerja proyek individual Anda akan muncul di sini di bilah sisi.'
                  ),
                  side: 'right',
                  align: 'start',
                },
                onHighlightStarted: () => {
                  if (window.innerWidth < 768 && !isMobileMenuOpen) {
                    setIsMobileMenuOpen(true);
                  }
                },
              },
              {
                element: '.tour-quick-actions',
                popover: {
                  title: tMsg('Quick Actions', 'Aksi Cepat'),
                  description: tMsg(
                    'Quickly access chat, export your data, view notifications, and open settings.',
                    'Akses obrolan dengan cepat, ekspor data Anda, lihat notifikasi, dan buka pengaturan.'
                  ),
                  side: 'right',
                  align: 'start',
                },
                onHighlightStarted: () => {
                  if (window.innerWidth < 768 && !isMobileMenuOpen) {
                    setIsMobileMenuOpen(true);
                  }
                },
              },
              {
                element: window.innerWidth >= 768 ? '.tour-account-menu' : '.tour-account-menu-mobile',
                popover: {
                  title: tMsg('Account Options', 'Opsi Akun'),
                  description: tMsg(
                    'Manage your profile, set personal leaves, or start this tour again from the Account menu.',
                    'Kelola profil Anda, atur cuti pribadi, atau mulai tur ini lagi dari menu Akun.'
                  ),
                  side: 'bottom',
                  align: 'start',
                },
                onHighlightStarted: () => {
                  if (window.innerWidth < 768 && isMobileMenuOpen) {
                    setIsMobileMenuOpen(false);
                  }
                },
              },
              {
                popover: {
                  title: tMsg("You're All Set! 🎉", 'Semua Siap! 🎉'),
                  description: tMsg(
                    "That's the end of the tour! Now let's put it into practice. Go ahead and create your first project to get started!",
                    'Sekian tur kali ini! Sekarang mari kita praktikkan. Ayo buat proyek pertamamu sekarang untuk memulai!'
                  ),
                  align: 'center',
                },
              },
            ]
          : [
              {
                element: window.innerWidth >= 768 ? '.tour-board-title' : '.tour-board-title-mobile',
                popover: {
                  title: tMsg('Home Dashboard', 'Beranda Utama'),
                  description: tMsg(
                    'Click the INNOCEAN Tracker logo anytime to return to your Home Dashboard.',
                    'Klik logo INNOCEAN Tracker kapan saja untuk kembali ke Beranda Utama Anda.'
                  ),
                  side: 'right',
                  align: 'center',
                },
              },
              {
                element: '.tour-breadcrumb',
                popover: {
                  title: tMsg('Project Path', 'Jalur Proyek'),
                  description: tMsg(
                    'Here you can easily identify the name of the current project workspace.',
                    'Di sini Anda dapat dengan mudah mengidentifikasi nama ruang kerja proyek saat ini.'
                  ),
                  side: 'bottom',
                  align: 'start',
                },
              },
              {
                element: '.tour-team-menu',
                popover: {
                  title: tMsg('Manage Team & Invites', 'Kelola Tim & Undangan'),
                  description: tMsg(
                    'Invite your colleagues to this project or manage their access here. You will also see project invitation notifications here.',
                    'Undang rekan kerja Anda ke proyek ini atau kelola akses mereka di sini. Notifikasi undangan proyek juga akan muncul di sini.'
                  ),
                  side: 'bottom',
                  align: 'start',
                },
              },

              {
                element: '.tour-views',
                popover: {
                  title: tMsg('Workspace Views', 'Tampilan Ruang Kerja'),
                  description: tMsg(
                    'Switch between Kanban, Table List, Analytics Dashboard, Timeline (Gantt), and Calendar modes.',
                    'Beralih antara mode Papan Kanban, Daftar Tabel, Dasbor Analitik, Lini Masa (Gantt), dan Kalender.'
                  ),
                  side: 'bottom',
                  align: 'start',
                },
              },
              {
                element: '.tour-filters',
                popover: {
                  title: tMsg('Smart Filters', 'Filter Cerdas'),
                  description: tMsg(
                    'Filter tasks by status, category, or click "My Tasks" to instantly see your workload.',
                    'Saring tugas berdasarkan status, kategori, atau klik "Tugas Saya" untuk langsung melihat beban kerja Anda.'
                  ),
                  side: 'bottom',
                  align: 'start',
                },
              },
              {
                element: '.tour-new-task',
                popover: {
                  title: tMsg('Create Task', 'Buat Tugas'),
                  description: tMsg(
                    'Let\'s simulate creating a request! Click the actual "New Request" button to open the form.',
                    'Mari kita simulasikan pembuatan permintaan! Klik tombol "Tugas Baru" yang asli untuk membuka formulir.'
                  ),
                  side: 'left',
                  align: 'start',
                  showButtons: ['previous'],
                },
                onHighlighted: () => {
                  if (driverRef.current) driverRef.current.isAtNewTask = true;
                },
                onDeselected: () => {
                  if (driverRef.current) driverRef.current.isAtNewTask = false;
                },
              },
              {
                element: '.tour-form-ai-input',
                popover: {
                  title: tMsg('Smart Assistant AI', 'Asisten Pintar AI'),
                  description: tMsg(
                    'You can now type your request naturally and let the AI draft the task, deadline, and checklist for you!',
                    'Anda kini dapat mengetik permintaan secara alami dan biarkan AI menyusun tugas, tenggat waktu, dan daftar periksa untuk Anda!'
                  ),
                  side: 'bottom',
                  align: 'start',
                },
                onPrevClick: () => {
                  setIsFormOpen(false);
                  setTimeout(() => driverObj.movePrevious(), 300);
                },
              },
              {
                element: '.tour-form-manual-btn',
                popover: {
                  title: tMsg('Manual Entry', 'Isi Manual'),
                  description: tMsg(
                    'Prefer the old way? Click "Just Fill Manually" to open the standard task form.',
                    'Lebih suka cara lama? Klik "Isi Manual Saja" untuk membuka formulir tugas standar.'
                  ),
                  side: 'top',
                  align: 'start',
                  showButtons: ['previous'],
                },
                onHighlighted: () => {
                  if (driverRef.current) driverRef.current.isAtManualBtn = true;
                },
                onDeselected: () => {
                  if (driverRef.current) driverRef.current.isAtManualBtn = false;
                },
              },
              {
                element: '.tour-form-project',
                popover: {
                  title: tMsg('Task Title', 'Judul Tugas'),
                  description: tMsg(
                    'Enter the title of your campaign or task here.',
                    'Masukkan judul kampanye atau tugas Anda di sini.'
                  ),
                  side: 'top',
                  align: 'start',
                },
                onPrevClick: () => {
                  setIsFormOpen(false);
                  setTimeout(() => driverObj.moveTo(4), 300);
                },
              },
              {
                element: '.tour-form-requester',
                popover: {
                  title: tMsg('Smart Assignment', 'Penugasan Cerdas'),
                  description: tMsg(
                    'Type a name, or type "@" to search and instantly assign this to a team member. They will get an email!',
                    'Ketik nama, atau ketik "@" untuk mencari dan langsung menugaskan ini ke anggota tim. Mereka akan mendapat email!'
                  ),
                  side: 'top',
                  align: 'start',
                },
              },
              {
                element: '.tour-form-deadline',
                popover: {
                  title: tMsg('Smart Deadline', 'Tenggat Waktu Cerdas'),
                  description: tMsg(
                    'Pick a deadline. Our system automatically avoids weekends and public holidays!',
                    'Pilih tenggat waktu. Sistem kami otomatis menghindari akhir pekan dan libur nasional!'
                  ),
                  side: 'top',
                  align: 'start',
                },
              },
              {
                element: '.tour-form-checklist',
                popover: {
                  title: tMsg('Sub-task Delegation', 'Delegasi Sub-tugas'),
                  description: tMsg(
                    'Break down the task into smaller checklists and assign them to different people.',
                    'Pecah tugas menjadi daftar periksa yang lebih kecil dan tugaskan ke orang yang berbeda.'
                  ),
                  side: 'top',
                  align: 'start',
                },
              },
              {
                element: '.tour-form-submit',
                popover: {
                  title: tMsg('Submit Request', 'Kirim Permintaan'),
                  description: tMsg(
                    'Once filled, hit Create Task. That concludes our workspace tour! 🚀',
                    'Setelah diisi, tekan Buat Tugas. Itu mengakhiri tur ruang kerja kita! 🚀'
                  ),
                  side: 'top',
                  align: 'start',
                },
                onNextClick: () => {
                  setIsFormOpen(false);
                  driverObj.moveNext();
                },
              },
            ],
    });
    driverRef.current = driverObj;
    setTimeout(() => {
      driverObj.drive();
    }, 100);
  };

  useEffect(() => {
    if (selectedBoard && selectedBoard.id !== 'global' && !isProactiveAIOpen && !isProjectChatOpen) {
      const hasSeenBoardTour = localStorage.getItem(`innocean_board_tour_done_v2_${currentUser}`);
      const isAIOffering = localStorage.getItem('innocean_ai_offer_docs') === 'true';
      if (!hasSeenBoardTour && !isAIOffering) {
        const timer = setTimeout(() => {
          startDriverTour();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedBoard, isProactiveAIOpen, isProjectChatOpen, currentUser]);

  const handleManualFormClick = () => {
    if (driverRef.current && driverRef.current.isAtManualBtn) {
      setTimeout(() => {
        if (driverRef.current) driverRef.current.moveNext();
      }, 400);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const hasSeenTour = localStorage.getItem(`innocean_tour_done_v2_${currentUser}`);
      const legacyTour = localStorage.getItem('innocean_tour_done_v2');

      if (!hasSeenTour && !legacyTour) {
        const timer = setTimeout(() => setShowWelcomeTour(true), 1500);
        return () => clearTimeout(timer);
      } else {
        if (!hasSeenTour && legacyTour) {
          localStorage.setItem(`innocean_tour_done_v2_${currentUser}`, 'true');
          localStorage.removeItem('innocean_tour_done_v2');
        }

        const justLoggedIn = sessionStorage.getItem('innocean_just_logged_in');
        if (justLoggedIn) {
          sessionStorage.removeItem('innocean_just_logged_in');
        }
      }
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const verifyToken = params.get('verify');
      if (verifyToken) {
        axios
          .post('/api/verify-email', { token: verifyToken })
          .then((res) => {
            showNotification(res.data.message, 'success');
            setIsLoginMode(true);
            setShowAuthForm(true);
          })
          .catch((err) => {
            showNotification(err.response?.data?.detail || 'Verification failed or token expired.', 'error');
          })
          .finally(() => {
            const url = new URL(window.location);
            url.searchParams.delete('verify');
            window.history.pushState({}, '', url);
          });
      }
    }
  }, []);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setIsLoading(true);

      const wakeTimer = setTimeout(() => {
        showNotification(
          language === 'id'
            ? 'Server sedang dibangunkan (Cold Start). Harap tunggu hingga 50 detik...'
            : 'Waking up server (Cold Start). Please wait up to 50 seconds...',
          'info'
        );
      }, 5000);

      axios
        .post('/api/google-login', { token: tokenResponse.access_token }, { timeout: 75000 })
        .then((res) => {
          clearTimeout(wakeTimer);
          localStorage.setItem('innocean_auth', 'true');
          localStorage.setItem('innocean_token', res.data.token);
          localStorage.setItem('innocean_username', res.data.username);
          sessionStorage.setItem('innocean_just_logged_in', 'true');
          // Gunakan Hard Reload agar memori React untuk Dashboard termuat dengan bersih tanpa blank screen
          window.location.href = '/';
        })
        .catch((err) => {
          clearTimeout(wakeTimer);
          setIsLoading(false);
          showNotification(err.response?.data?.detail || 'Google Login failed', 'error');
        });
    },
    onError: () => showNotification('Google Login failed or cancelled', 'error'),
  });

  const [isPanning, setIsPanning] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    if (
      e.target.closest('.task-card') ||
      e.target.closest('.board-col-header') ||
      e.target.closest('#floating-trash') ||
      e.target.closest('[data-rbd-drag-handle-context-id]') ||
      e.target.closest('[data-rpd-drag-handle-context-id]') ||
      e.target.closest('button') ||
      e.target.closest('input') ||
      e.target.closest('textarea') ||
      e.target.closest('select') ||
      e.target.closest('a') ||
      e.target.closest('.fixed') ||
      e.target.closest(
        'p, span, h1, h2, h3, h4, h5, h6, strong, em, b, i, blockquote, pre, code, td, th, tr, details, summary, label, li'
      )
    ) {
      return;
    }

    const scrollable = e.target.closest('.overflow-auto, .overflow-x-auto') || scrollRef.current;
    if (scrollable) {
      const rect = scrollable.getBoundingClientRect();
      const scrollbarHeight = scrollable.offsetHeight - scrollable.clientHeight;
      const scrollbarWidth = scrollable.offsetWidth - scrollable.clientWidth;
      if (
        (scrollbarHeight > 0 && e.clientY >= rect.bottom - scrollbarHeight) ||
        (scrollbarWidth > 0 && e.clientX >= rect.right - scrollbarWidth)
      ) {
        return;
      }

      activeScrollRef.current = scrollable;
      setIsPanning(true);
      setStartX(e.pageX - scrollable.offsetLeft);
      setScrollLeft(scrollable.scrollLeft);
    }
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
    activeScrollRef.current = null;
  };

  const handleMouseUp = (e, forceDropPayload = null) => {
    setIsPanning(false);
    activeScrollRef.current = null;

    // Deteksi Pasti (Synchronous) Jika Task Dijatuhkan di Atas Tong Sampah Mengambang
    let droppedOnTrash = isTrashHovered;
    if (timelineDrag) {
      const trashEl = document.getElementById('floating-trash');
      if (trashEl) {
        const rect = trashEl.getBoundingClientRect();
        const padding = 40; // Area toleransi hit-box
        if (
          e.clientX >= rect.left - padding &&
          e.clientX <= rect.right + padding &&
          e.clientY >= rect.top - padding &&
          e.clientY <= rect.bottom + padding
        ) {
          droppedOnTrash = true;
        }
      }
    }

    if (droppedOnTrash && timelineDrag) {
      const t = timelineDrag.task;
      setSelectedTask(t);
      setIsDeleteConfirmOpen(true);
      setTimelineDrag(null);
      setIsTrashHovered(false);
      setHoveredTimelineRow(null);
      return;
    }

    const currentDrag = forceDropPayload ? forceDropPayload.dragged : timelineDrag;
    const currentRow = forceDropPayload ? forceDropPayload.hoveredRow : hoveredTimelineRow;

    if (currentDrag) {
      let requiresUpdate = false;
      const t = currentDrag.task;
      const payload = {
        project_name: t.project_name,
        requester: t.requester,
        category: t.category,
        description: t.description || '',
        supporting_access: t.supporting_access || '',
        start_date: t.start_date || '',
        deadline: t.deadline ? t.deadline.split(' ')[0] + ' 17:00:00' : '',
        impact: t.impact || 'Medium',
        etc: t.etc || 2,
        auto_nudge: t.auto_nudge || false,
        recurring: t.recurring || 'none',
        status: t.status,
        board_id: t.board_id,
      };
      const updatedTask = { ...t };

      if (currentDrag.mode === 'both' && currentRow && currentRow !== 'unknown') {
        if (groupBy === 'Assignee' && currentRow !== getTaskAssignee(t)) {
          updatedTask.requester = currentRow === 'Unassigned' ? '' : currentRow;
          payload.requester = updatedTask.requester;
          requiresUpdate = true;
        } else if (groupBy === 'Status' && currentRow !== t.status) {
          if (!forceDropPayload && currentRow === 'Done' && t.subtask_done < t.subtask_total) {
            setPendingStatusChange({
              type: 'timeline',
              payload: { dragged: currentDrag, hoveredRow: currentRow },
            });
            setTimelineDrag(null);
            setHoveredTimelineRow(null);
            return;
          }
          updatedTask.status = currentRow;
          payload.status = updatedTask.status;
          requiresUpdate = true;
        } else if (groupBy === 'Category' && currentRow !== (t.category || 'Uncategorized')) {
          updatedTask.category = currentRow === 'Uncategorized' ? '' : currentRow;
          payload.category = updatedTask.category;
          requiresUpdate = true;
        } else if (groupBy === 'Project' && String(currentRow) !== String(t.board_id || 'unknown')) {
          const newBoardId = parseInt(currentRow);
          if (!isNaN(newBoardId)) {
            updatedTask.board_id = newBoardId;
            payload.board_id = newBoardId;
            requiresUpdate = true;
          }
        }
      }

      if (requiresUpdate) {
        const isTaskAdmin =
          isSuperAdmin ||
          t.owner_username === currentUser ||
          (selectedBoard && selectedBoard.owner_username === currentUser) ||
          (t.requester &&
            new RegExp(`@${currentUser.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w.-])`, 'i').test(t.requester));
        if (isTaskAdmin) {
          setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
          axios
            .put(`/api/tasks/${updatedTask.id}/details`, payload)
            .then(() => {
              showNotification(`Task successfully reassigned!`, 'success');
              fetchTasks();
            })
            .catch((err) => {
              showNotification(err.response?.data?.detail || 'Failed to update task', 'error');
              fetchTasks();
            });
        } else {
          showNotification('Permission Denied: You cannot modify this task.', 'error');
        }
      }

      if (currentDrag.startOffsetDays !== 0) {
        updateTaskDates(currentDrag.task, currentDrag.startOffsetDays, currentDrag.mode);
        setTimeout(() => setTimelineDrag(null), 100);
      } else {
        setTimelineDrag(null);
      }
      setHoveredTimelineRow(null);
    }
  };

  useLayoutEffect(() => {
    mouseUpRef.current = handleMouseUp;
  });

  useEffect(() => {
    const onMouseUpGlobal = (e) => {
      if (mouseUpRef.current) mouseUpRef.current(e);
    };

    window.addEventListener('mouseup', onMouseUpGlobal);
    return () => {
      window.removeEventListener('mouseup', onMouseUpGlobal);
    };
  }, []);

  const handleMouseMove = (e) => {
    if (timelineDrag) {
      e.preventDefault();

      const dragWidth = timelineDrag.dragWidth || DAY_WIDTH;
      const deltaX = e.pageX - timelineDrag.startX;
      let deltaDays = Math.round(deltaX / dragWidth);

      // Jika dalam mode Kalender, tambahkan kalkulasi pergerakan vertikal (per minggu = 7 hari)
      if (timelineDrag.isCalendar) {
        const dragHeight = timelineDrag.dragHeight || 100;
        const deltaY = e.pageY - (timelineDrag.startY || e.pageY);
        const deltaWeeks = Math.round(deltaY / dragHeight);
        deltaDays += deltaWeeks * 7;
      }

      if (deltaDays !== timelineDrag.startOffsetDays) {
        setTimelineDrag((prev) => (prev ? { ...prev, startOffsetDays: deltaDays } : null));
      }
      return;
    }
    if (!isPanning || !activeScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - activeScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    activeScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const updateTaskDates = (task, deltaDays, mode = 'end') => {
    const parseDateStr = (dStr) => {
      if (!dStr) return new Date();
      const d = new Date(dStr.replace(/-/g, '/'));
      d.setHours(0, 0, 0, 0);
      return d;
    };
    const formatDStr = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    let sDate = parseDateStr(task.start_date || task.timestamp.split(' ')[0]);
    let eDate = task.deadline ? parseDateStr(task.deadline.split(' ')[0]) : parseDateStr();

    const snapToValidDay = (date, direction = 1) => {
      let d = new Date(date);
      while (true) {
        const dStr = formatDStr(d);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const isHoliday = leaves.some(
          (l) => l.leave_date === dStr && (l.leave_type !== 'personal' || isUserAssigned(task, l.username))
        );
        if (isWeekend || isHoliday) {
          d.setDate(d.getDate() + direction);
        } else {
          break;
        }
      }
      return d;
    };

    if (mode === 'end') {
      eDate.setDate(eDate.getDate() + deltaDays);
      if (eDate < sDate) eDate = new Date(sDate);
      eDate = snapToValidDay(eDate, deltaDays >= 0 ? 1 : -1);
    } else if (mode === 'start') {
      sDate.setDate(sDate.getDate() + deltaDays);
      if (sDate > eDate) sDate = new Date(eDate);
      sDate = snapToValidDay(sDate, deltaDays >= 0 ? 1 : -1);
    } else if (mode === 'both') {
      sDate.setDate(sDate.getDate() + deltaDays);
      eDate.setDate(eDate.getDate() + deltaDays);
      sDate = snapToValidDay(sDate, deltaDays >= 0 ? 1 : -1);
      eDate = snapToValidDay(eDate, deltaDays >= 0 ? 1 : -1);
    }

    if (eDate < sDate) eDate = new Date(sDate);

    const newStartDate = formatDStr(sDate);
    const newDeadline = formatDStr(eDate) + ' 17:00:00';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((eDate - today) / (1000 * 60 * 60 * 24));
    let newPriorityLvl = 'normal';
    let newPriorityStr = 'NORMAL';
    if (diffDays <= 1) {
      newPriorityLvl = 'critical';
      newPriorityStr = 'CRITICAL';
    } else if (diffDays <= 3) {
      newPriorityLvl = 'warning';
      newPriorityStr = 'WARNING';
    }

    const updatedTask = {
      ...task,
      start_date: newStartDate,
      deadline: newDeadline,
      priority_lvl: newPriorityLvl,
      priority_str: newPriorityStr,
    };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));

    const payload = {
      project_name: task.project_name,
      requester: task.requester,
      category: task.category,
      description: task.description || '',
      supporting_access: task.supporting_access || '',
      start_date: newStartDate,
      deadline: newDeadline,
      impact: task.impact || 'Medium',
      etc: task.etc || 2,
      auto_nudge: task.auto_nudge || false,
      recurring: task.recurring || 'none',
      status: task.status,
    };

    axios
      .put(`/api/tasks/${task.id}/details`, payload)
      .then(() => {
        showNotification('Timeline dates updated', 'success');
        fetchTasks();
      })
      .catch((err) => {
        showNotification(err.response?.data?.detail || 'Failed to update dates', 'error');
        fetchTasks();
      });
  };

  const handleLogout = () => {
    setIsLogoutConfirmOpen(false);
    setIsLoading(true);
    window.isLoggingOut = true;

    // Set state ke homepage segera agar transisi visual langsung mengarah ke Landing Page (Homepage)
    // dan bukan ke form login/register
    setShowAuthForm(false);
    setIsAuthenticated(false);
    setCurrentUser('');
    setSelectedBoard(null);

    setTimeout(() => {
      localStorage.removeItem('innocean_auth');
      localStorage.removeItem('innocean_token');
      localStorage.removeItem('innocean_username');
      localStorage.removeItem('innocean_selected_board');
      localStorage.removeItem('innocean_proactive_ai_open');
      localStorage.removeItem('innocean_docs_open');
      localStorage.removeItem('innocean_chat_ws_open');
      localStorage.removeItem('innocean_changelog_open');

      // Gunakan reload untuk memastikan seluruh memori cache/state React benar-benar bersih
      // Spinner loading akan menutupi transisi ini dengan mulus
      window.location.href = '/';
    }, 1000);
  };

  useEffect(() => {
    const sessionExpired = sessionStorage.getItem('innocean_session_expired');
    if (sessionExpired) {
      sessionStorage.removeItem('innocean_session_expired');
      showNotification('Session expired. Please login again.', 'error');
    }
  }, []);

  useEffect(() => {
    const handleAuthError = () => {
      if (window.isLoggingOut) return;
      
      // Clear storage
      localStorage.removeItem('innocean_auth');
      localStorage.removeItem('innocean_token');
      localStorage.removeItem('innocean_username');
      localStorage.removeItem('innocean_selected_board');
      localStorage.removeItem('innocean_proactive_ai_open');
      localStorage.removeItem('innocean_docs_open');
      localStorage.removeItem('innocean_chat_ws_open');
      localStorage.removeItem('innocean_changelog_open');
      
      // Set session expired indicator in sessionStorage to show notification on fresh load
      sessionStorage.setItem('innocean_session_expired', 'true');

      // Redirect immediately to clean all state and prevent blank/black screens
      window.location.href = '/';
    };
    window.addEventListener('auth_error', handleAuthError);

    const interceptor = axios.interceptors.request.use((config) => {
      const method = (config.method || '').toLowerCase();
      if (method === 'post' || method === 'put' || method === 'delete') {
        if (config.url && (config.url.includes('/api/tasks') || config.url.includes('/api/boards'))) {
          cachedGlobalTasks = null;
          cachedGlobalTasksTime = 0;
        }
      }
      return config;
    });

    return () => {
      window.removeEventListener('auth_error', handleAuthError);
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  const fetchBoards = () => {
    if (!isAuthenticated) return;
    setIsBoardsLoading(true);
    axios
      .get('/api/boards')
      .then((res) => setBoards(res.data.boards || []))
      .catch((err) => {
        if (err.response?.status !== 401) console.error(err);
      })
      .finally(() => setIsBoardsLoading(false));
  };

  const fetchTasks = (force = false) => {
    if (!isAuthenticated) return;

    if (force) {
      cachedGlobalTasks = null;
      cachedGlobalTasksTime = 0;
    }

    const handleNewTasks = (fetchedTasks) => {
      setTasks(fetchedTasks);
    };

    if (!selectedBoard || selectedBoard.id === 'global') {
      const now = Date.now();
      if (cachedGlobalTasks && now - cachedGlobalTasksTime < 30000) {
        handleNewTasks(cachedGlobalTasks);
        setIsTasksLoading(false);
        // Refresh in the background silently
        axios
          .get('/api/tasks/all')
          .then((res) => {
            const fetched = res.data.tasks || [];
            handleNewTasks(fetched);
            cachedGlobalTasks = fetched;
            cachedGlobalTasksTime = Date.now();
          })
          .catch((err) => {
            if (err.response?.status !== 401) console.error(err);
          });
        return;
      }

      setIsTasksLoading(true);
      axios
        .get('/api/tasks/all')
        .then((res) => {
          const fetched = res.data.tasks || [];
          handleNewTasks(fetched);
          cachedGlobalTasks = fetched;
          cachedGlobalTasksTime = Date.now();
        })
        .catch((err) => {
          if (err.response?.status !== 401) console.error(err);
        })
        .finally(() => setIsTasksLoading(false));
      return;
    }

    axios
      .get(`/api/boards/${selectedBoard.id}/tasks`)
      .then((res) => {
        handleNewTasks(res.data.tasks || []);
      })
      .catch((err) => {
        if (err.response?.status === 403 || err.response?.status === 404) setSelectedBoard(null);
        if (err.response?.status !== 401) console.error(err);
      })
      .finally(() => setIsTasksLoading(false));
  };

  const fetchInvitations = () => {
    if (!isAuthenticated) return;
    axios
      .get('/api/invitations')
      .then((res) => setInvitations(res.data.invitations || []))
      .catch((err) => console.error(err));
  };

  const fetchTeamMembers = () => {
    if (!isAuthenticated) return;

    if (!selectedBoard || selectedBoard.id === 'global') {
      setTeamMembers(
        userDirectory.filter((u) => isSuperAdmin || u.is_connected || u.username === currentUser).map((u) => u.username)
      );
      return;
    }

    axios
      .get(`/api/boards/${selectedBoard.id}/members`)
      .then((res) => setTeamMembers(res.data.members || []))
      .catch((err) => {
        if (err.response?.status === 403) setSelectedBoard(null);
        console.error(err);
      });
  };

  const fetchAvatars = () => {
    if (!isAuthenticated) return;
    axios
      .get('/api/users/avatars')
      .then((res) => {
        setAvatarsMap(res.data.avatars || {});
        if (res.data.directory) setUserDirectory(res.data.directory);
      })
      .catch(console.error);
  };

  const fetchMyTeam = (bId = null) => {
    if (!isAuthenticated) return;
    const targetId = bId || (selectedBoard ? selectedBoard.id : null);
    if (!targetId || targetId === 'global') return;
    axios
      .get(`/api/boards/${targetId}/manage`)
      .then((res) => setMyTeam(res.data.team || []))
      .catch(console.error);
  };

  const fetchNotifications = () => {
    if (!isAuthenticated) return;
    axios
      .get('/api/notifications')
      .then((res) => setNotifications(res.data.notifications || []))
      .catch((err) => {
        if (err.response?.status !== 401) console.error(err);
      });
  };

  const fetchLeaves = () => {
    if (!isAuthenticated) return;
    axios
      .get('/api/leaves')
      .then((res) => setLeaves(res.data.leaves || []))
      .catch((err) => console.error(err));
  };

  const fetchDmConversations = () => {
    if (!isAuthenticated) return;
    axios
      .get('/api/dm/conversations')
      .then((res) => setDmConversations(res.data.conversations || []))
      .catch(console.error);
  };

  const fetchInboxChats = () => {
    if (!isAuthenticated) return;
    if (inboxChats.length === 0) {
      setIsInboxLoading(true);
    }
    axios
      .get('/api/my-chats')
      .then((res) => {
        setInboxChats(res.data.chats || []);
        setIsInboxLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsInboxLoading(false);
      });
  };

  const fetchProfileStatus = () => {
    if (!isAuthenticated) return;
    axios
      .get('/api/profile')
      .then((res) => {
        setAccountStatus(res.data.account_status || 'active');
        setIsSuperAdmin(res.data.is_superadmin === 1);
        setProfileData({ ...res.data, current_password: '', new_password: '' });
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      const wakeTimer = setTimeout(() => {
        showNotification(
          language === 'id'
            ? 'Server sedang dibangunkan (Cold Start). Harap tunggu hingga 50 detik...'
            : 'Waking up server (Cold Start). Please wait up to 50 seconds...',
          'info'
        );
      }, 5000);

      // Failsafe timer: Jika jaringan mobile menggantung (hang) dan axios gagal merespons
      // layar loading akan ditutup paksa setelah 75 detik agar aplikasi tidak macet.
      const failsafeTimer = setTimeout(() => {
        setIsLoading(false);
        showNotification(
          language === 'id'
            ? 'Koneksi ke server memakan waktu terlalu lama. Silakan muat ulang halaman.'
            : 'Connection to server took too long. Please refresh the page.',
          'error'
        );
      }, 75000);

      // Lakukan "Ping" ke server root untuk membangunkannya dan menyembunyikan loading
      axios.get('/', { timeout: 70000 }).finally(() => {
        clearTimeout(wakeTimer);
        clearTimeout(failsafeTimer);
        setIsLoading(false);
      });

      fetchBoards();
      fetchInvitations();
      fetchNotifications();
      fetchAvatars();
      fetchLeaves();
      fetchProfileStatus();
      fetchDmConversations();
      fetchInboxChats();
      fetchTasks();

      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchNotifications();
          fetchInvitations();
          fetchDmConversations();
          fetchInboxChats();
        }
      }, 60000);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          fetchNotifications();
          fetchInvitations();
          fetchDmConversations();
          fetchInboxChats();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedBoard) {
      localStorage.setItem('innocean_selected_board', JSON.stringify(selectedBoard));
    } else {
      localStorage.removeItem('innocean_selected_board');
    }
  }, [selectedBoard]);

  const syncBoardSettings = (newCols, newCats) => {
    if (!selectedBoard || selectedBoard.id === 'global') return;
    axios
      .put(`/api/boards/${selectedBoard.id}/settings`, {
        statuses: JSON.stringify(newCols),
        categories: JSON.stringify(newCats),
      })
      .then(() => {
        setSelectedBoard((prev) =>
          prev ? { ...prev, statuses: JSON.stringify(newCols), categories: JSON.stringify(newCats) } : null
        );
        setBoards((prev) =>
          prev.map((b) =>
            b.id === selectedBoard.id
              ? { ...b, statuses: JSON.stringify(newCols), categories: JSON.stringify(newCats) }
              : b
          )
        );
      })
      .catch(console.error);
  };

  // Effect to handle board changes (fetching tasks, setting columns/categories)
  useEffect(() => {
    if (selectedBoard) {
      if (currentBoardIdRef.current !== selectedBoard.id) {
        setTasks([]);
        currentBoardIdRef.current = selectedBoard.id;

        if (selectedBoard.id !== 'global') {
          let dbCols = [],
            dbCats = [];
          try {
            dbCols = JSON.parse(selectedBoard.statuses || '[]');
          } catch (e) {}
          try {
            dbCats = JSON.parse(selectedBoard.categories || '[]');
          } catch (e) {}

          if (dbCols.length === 0) dbCols = DEFAULT_COLUMNS;
          if (dbCats.length === 0) dbCats = DEFAULT_CATEGORIES;

          const savedCols = localStorage.getItem(`innocean_columns_${selectedBoard.id}`);
          const savedCats = localStorage.getItem(`innocean_categories_${selectedBoard.id}`);
          let localCols = savedCols && savedCols !== 'null' && savedCols !== 'undefined' ? JSON.parse(savedCols) : [];
          let localCats = savedCats && savedCats !== 'null' && savedCats !== 'undefined' ? JSON.parse(savedCats) : [];

          const mergedCols = [
            ...localCols.filter((c) => dbCols.includes(c)),
            ...dbCols.filter((c) => !localCols.includes(c)),
          ];
          const mergedCats = [
            ...localCats.filter((c) => dbCats.includes(c)),
            ...dbCats.filter((c) => !localCats.includes(c)),
          ];

          setColumns(mergedCols.length > 0 ? mergedCols : DEFAULT_COLUMNS);
          setCategories(mergedCats.length > 0 ? mergedCats : DEFAULT_CATEGORIES);
        } else {
          setColumns(DEFAULT_COLUMNS);
          setCategories(DEFAULT_CATEGORIES);
        }
        fetchTasks();
      }
    } else {
      setColumns(DEFAULT_COLUMNS);
      setCategories(DEFAULT_CATEGORIES);
      if (!cachedGlobalTasks) {
        setTasks([]);
      } else {
        setTasks(cachedGlobalTasks);
      }
      currentBoardIdRef.current = null;
      fetchTasks();
    }
  }, [selectedBoard]);

  // Effect to keep team members in sync with the current view and user data
  useEffect(() => {
    if (isAuthenticated) {
      fetchTeamMembers();
    }
  }, [selectedBoard, userDirectory, isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('innocean_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'kanban' || viewMode === 'timeline') {
      setSortBy('Default');
    } else if (viewMode === 'list') {
      setSortBy('Date Created');
    }
  }, [viewMode, setSortBy]);

  useEffect(() => {
    if (selectedBoard && selectedBoard.id !== 'global') {
      fetchTasks();
    }
  }, [groupBy]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) INNOCEAN Tracker`;
    } else {
      document.title = 'INNOCEAN Tracker | Enterprise Workload Manager';
    }
  }, [unreadCount]);

  const handleReadNotification = (id) => {
    axios.put(`/api/notifications/${id}/read`).then(fetchNotifications).catch(console.error);
  };
  const handleReadAllNotifications = () => {
    axios.put('/api/notifications/read_all').then(fetchNotifications).catch(console.error);
  };

  const handleMarkAllInboxAsRead = async () => {
    try {
      // 1. Mark all notifications as read in backend
      await axios.put('/api/notifications/read_all');
      fetchNotifications();

      // 2. Mark all DMs as read in backend
      await axios.put('/api/dm/read-all');
      fetchDmConversations();


      // 3. Mark all board/task comments as read in local storage
      (inboxChats || []).forEach((chat) => {
        if (chat.latest_sender === currentUser) return;
        if (chat.is_dm) return;
        if (chat.is_project_chat) {
          localStorage.setItem(
            `innocean_last_read_board_${chat.board_id}_${currentUser}`,
            chat.timestamp
          );
        } else {
          localStorage.setItem(
            `innocean_last_read_task_${chat.task_id}_${currentUser}`,
            chat.timestamp
          );
        }
      });

      // 4. Refresh my chats list
      fetchInboxChats();
    } catch (err) {
      console.error("Error marking all inbox chats as read:", err);
    }
  };

  const handleNotificationTaskClick = (taskId) => {
    axios
      .get(`/api/tasks/${taskId}`)
      .then((res) => {
        const task = res.data?.task;
        if (!task) return;
        const board = (boards || []).find((b) => b.id === task.board_id);
        if (board) setSelectedBoard(board);
        setTimeout(() => setSelectedTask(task), 50); // Jeda kecil agar board pindah dulu
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          axios
            .get(`/api/tasks/preview/${taskId}`)
            .then((res) => {
              setPreviewTask(res.data.task);
            })
            .catch((err2) => {
              showNotification(err2.response?.data?.detail || 'Task not found or access denied', 'error');
            });
        } else {
          showNotification(err.response?.data?.detail || 'Task not found or access denied', 'error');
        }
      });
  };

  useEffect(() => {
    if (tasks.length > 0 && selectedBoard) {
      // Mencegah pencocokan saat task baru saja dimuat tapi project belum tersinkronisasi
      if (selectedBoard.id !== 'global' && tasks[0].board_id !== selectedBoard.id) return;

      let colsChanged = false;
      let catsChanged = false;

      // 1. Deduplicate existing columns & categories (Auto-merge case-insensitive)
      const deduplicate = (arr) => {
        const unique = [];
        const map = new Set();
        arr.forEach((item) => {
          const lower = item.toLowerCase();
          if (!map.has(lower)) {
            map.add(lower);
            unique.push(item);
          }
        });
        return unique;
      };

      let newCols = deduplicate(columns);
      if (newCols.length !== columns.length) colsChanged = true;

      let newCats = deduplicate(categories);

      // Auto-remove empty categories after 7 days (Keep defaults + currently used + recently empty)
      const usedCatsLower = new Set(tasks.map((t) => (t.category || '').toLowerCase()).filter(Boolean));
      const defaultCatsLower = new Set(DEFAULT_CATEGORIES.map((c) => c.toLowerCase()));
      const preFilterLen = newCats.length;
      
      const emptyCatsKey = `innocean_empty_cats_${selectedBoard.id}`;
      let emptyCatsTimestamps = {};
      try {
        emptyCatsTimestamps = JSON.parse(localStorage.getItem(emptyCatsKey) || '{}');
      } catch (e) {}

      let timestampsChanged = false;
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      newCats = newCats.filter((c) => {
        const lowerC = c.toLowerCase();
        if (defaultCatsLower.has(lowerC) || usedCatsLower.has(lowerC)) {
          if (emptyCatsTimestamps[lowerC]) {
            delete emptyCatsTimestamps[lowerC];
            timestampsChanged = true;
          }
          return true; // Keep used or default
        }

        // It is an empty custom category
        if (!emptyCatsTimestamps[lowerC]) {
          emptyCatsTimestamps[lowerC] = Date.now();
          timestampsChanged = true;
          return true; // Keep it, just became empty
        } else {
          const daysEmpty = Date.now() - emptyCatsTimestamps[lowerC];
          if (daysEmpty > sevenDaysMs) {
            delete emptyCatsTimestamps[lowerC];
            timestampsChanged = true;
            return false; // Purge!
          }
          return true; // Keep it, not 7 days yet
        }
      });

      if (timestampsChanged) {
        localStorage.setItem(emptyCatsKey, JSON.stringify(emptyCatsTimestamps));
      }

      if (newCats.length !== preFilterLen || newCats.length !== categories.length) catsChanged = true;

      const taskStatuses = [...new Set(tasks.map((t) => t.status))];
      const missingCols = taskStatuses.filter((s) => !newCols.some((c) => c.toLowerCase() === s.toLowerCase()));
      if (missingCols.length > 0) {
        newCols = [...newCols, ...missingCols];
        colsChanged = true;
      }

      const taskCats = [...new Set(tasks.map((t) => t.category))].filter(Boolean);
      const missingCats = taskCats.filter((c) => !newCats.some((nc) => nc.toLowerCase() === c.toLowerCase()));
      if (missingCats.length > 0) {
        newCats = [...newCats, ...missingCats];
        catsChanged = true;
      }

      // 2. Auto-merge tasks that use duplicate/wrong-cased categories or statuses
      let tasksToUpdate = [];
      const updatedTasks = tasks.map((t) => {
        let updated = false;
        let tStatus = t.status;
        let tCat = t.category;

        const matchedCol = newCols.find((c) => c.toLowerCase() === t.status.toLowerCase());
        if (matchedCol && matchedCol !== t.status) {
          tStatus = matchedCol;
          updated = true;
        }

        if (t.category) {
          const matchedCat = newCats.find((c) => c.toLowerCase() === t.category.toLowerCase());
          if (matchedCat && matchedCat !== t.category) {
            tCat = matchedCat;
            updated = true;
          }
        }

        if (updated) {
          const uTask = { ...t, status: tStatus, category: tCat };
          tasksToUpdate.push(uTask);
          return uTask;
        }
        return t;
      });

      if (tasksToUpdate.length > 0) {
        setTasks(updatedTasks);
        tasksToUpdate.forEach((t) => {
          const payload = {
            project_name: t.project_name,
            requester: t.requester,
            category: t.category,
            description: t.description || '',
            supporting_access: t.supporting_access || '',
            start_date: t.start_date || t.timestamp.split(' ')[0],
            deadline: t.deadline ? t.deadline.split(' ')[0] + ' 17:00:00' : '',
            impact: t.impact || 'Medium',
            etc: t.etc || 2,
            auto_nudge: t.auto_nudge || false,
            recurring: t.recurring || 'none',
            status: t.status,
          };
          axios.put(`/api/tasks/${t.id}/details`, payload).catch(console.error);
        });
      }

      if (selectedBoard.id !== 'global') {
        if (colsChanged) {
          localStorage.setItem(`innocean_columns_${selectedBoard.id}`, JSON.stringify(newCols));
          setColumns(newCols);
        }
        if (catsChanged) {
          localStorage.setItem(`innocean_categories_${selectedBoard.id}`, JSON.stringify(newCats));
          setCategories(newCats);
        }
        if (colsChanged || catsChanged) {
          syncBoardSettings(newCols, newCats);
        }
      }
    }
  }, [tasks, columns, categories, selectedBoard]);

  const handleOpenAddBoard = (target) => {
    const maxLimit = 50;
    const currentLen = target === 'Status' ? columns.length : categories.length;
    const limitName = target === 'Status' ? 'columns' : 'categories';
    if (currentLen >= maxLimit) {
      showNotification(`System limit reached. Maximum ${maxLimit} ${limitName} allowed.`, 'error');
      return;
    }
    setColModal({ isOpen: true, target, mode: 'add', oldName: '', newName: '' });
  };

  const handleOpenRenameBoard = (target, oldName) => {
    setColModal({ isOpen: true, target, mode: 'rename', oldName, newName: oldName });
  };

  const handleOpenDeleteBoard = (target, oldName) => {
    const hasTasks =
      target === 'Status' ? tasks.some((t) => t.status === oldName) : tasks.some((t) => t.category === oldName);
    if (hasTasks) {
      showNotification(`Cannot remove "${oldName}" because it currently contains tasks.`, 'error');
      return;
    }
    setColModal({ isOpen: true, target, mode: 'delete', oldName, newName: '' });
  };

  const handleColSubmit = (e) => {
    e.preventDefault();
    const { mode, oldName, newName, target } = colModal;
    const list = target === 'Status' ? columns : categories;
    const setList = target === 'Status' ? setColumns : setCategories;
    const storageKey =
      target === 'Status' ? `innocean_columns_${selectedBoard?.id}` : `innocean_categories_${selectedBoard?.id}`;

    if (mode === 'add') {
      const name = newName.trim();
      if (!name) return;
      if (list.some((c) => c.toLowerCase() === name.toLowerCase())) {
        showNotification(`${target} already exists!`, 'error');
        return;
      }
      const newList = [...list, name];
      setList(newList);
      if (selectedBoard && selectedBoard.id !== 'global') {
        localStorage.setItem(storageKey, JSON.stringify(newList));
        if (target === 'Status') syncBoardSettings(newList, categories);
        else syncBoardSettings(columns, newList);
      }
      if (target === 'Category') {
        if (isFormOpen) setFormData((prev) => ({ ...prev, category: name }));
        if (isEditing) setEditFormData((prev) => ({ ...prev, category: name }));
      }
      showNotification(`${target} added!`, 'success');
    } else if (mode === 'rename') {
      const name = newName.trim();
      if (!name || name.toLowerCase() === oldName.toLowerCase()) {
        setColModal({ ...colModal, isOpen: false });
        return;
      }
      if (list.some((c) => c.toLowerCase() === name.toLowerCase())) {
        showNotification(`${target} name already exists!`, 'error');
        return;
      }

      const newList = list.map((c) => (c === oldName ? name : c));
      setList(newList);
      if (selectedBoard && selectedBoard.id !== 'global') {
        localStorage.setItem(storageKey, JSON.stringify(newList));
        if (target === 'Status') syncBoardSettings(newList, categories);
        else syncBoardSettings(columns, newList);
      }

      if (target === 'Status') {
        const updatedTasks = tasks.map((t) => (t.status === oldName ? { ...t, status: name } : t));
        setTasks(updatedTasks);
        const tasksToUpdate = tasks.filter((t) => t.status === oldName);
        tasksToUpdate.forEach((t) => axios.put(`/api/tasks/${t.id}`, { status: name }).catch(console.error));
      } else {
        const updatedTasks = tasks.map((t) => (t.category === oldName ? { ...t, category: name } : t));
        setTasks(updatedTasks);
        const tasksToUpdate = tasks.filter((t) => t.category === oldName);
        tasksToUpdate.forEach((t) => {
          const payload = {
            project_name: t.project_name,
            requester: t.requester,
            category: name,
            description: t.description || '',
            supporting_access: t.supporting_access || '',
            start_date: t.start_date || t.timestamp.split(' ')[0],
            deadline: t.deadline ? t.deadline.split(' ')[0] + ' 17:00:00' : '',
            impact: t.impact || 'Medium',
            etc: t.etc || 2,
            auto_nudge: t.auto_nudge || false,
            recurring: t.recurring || 'none',
            status: t.status,
          };
          axios.put(`/api/tasks/${t.id}/details`, payload).catch(console.error);
        });
      }

      showNotification(`${target} renamed!`, 'success');
    } else if (mode === 'delete') {
      const newList = list.filter((c) => c !== oldName);
      setList(newList);
      if (selectedBoard && selectedBoard.id !== 'global') {
        localStorage.setItem(storageKey, JSON.stringify(newList));
        if (target === 'Status') syncBoardSettings(newList, categories);
        else syncBoardSettings(columns, newList);
      }
      showNotification(`${target} deleted!`, 'success');
    }

    setColModal({ isOpen: false, target: 'Status', mode: 'add', oldName: '', newName: '' });
  };

  useLayoutEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      if (isAuthenticated) localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      if (isAuthenticated) localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode, isAuthenticated]);

  useEffect(() => {
    if (selectedTask?.id) {
      fetchSubtasks(selectedTask.id);
      fetchComments(selectedTask.id);

      // Fetch full task details if the current selectedTask is a partial search result (lacks queue/recurring fields)
      if (selectedTask.queue_global_number === undefined || selectedTask.recurring === undefined) {
        axios
          .get(`/api/tasks/${selectedTask.id}`)
          .then((res) => {
            if (res.data?.task) {
              setSelectedTask(res.data.task);
            }
          })
          .catch((err) => console.error('Failed to load full task details:', err));
      }

      // Auto-read notifications for this task when opened
      const unreadForTask = notifications.filter((n) => !n.is_read && n.related_task_id === selectedTask?.id);
      if (unreadForTask.length > 0) {
        Promise.all(unreadForTask.map((n) => axios.put(`/api/notifications/${n.id}/read`)))
          .then(() => fetchNotifications())
          .catch(console.error);
      }

      // Also mark localStorage last_read for this task so unread badges in
      // ChatSidebar and HomeDashboard disappear immediately regardless of how the task was opened.
      // We use the current timestamp as a "read up to now" marker; if the task later
      // gets a new comment it will correctly show as unread again.
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      localStorage.setItem(`innocean_last_read_task_${selectedTask.id}_${currentUser}`, nowStr);

    } else {
      setSubtasks([]);
      setComments([]);
    }

    let interval;
    if (selectedTask?.id) {
      interval = setInterval(() => {
        if (document.visibilityState === 'visible') fetchComments(selectedTask.id);
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [selectedTask?.id]);

  const fetchSubtasks = (taskId) => {
    setIsSubtasksLoading(true);
    axios
      .get(`/api/tasks/${taskId}/subtasks`)
      .then((res) => setSubtasks(res.data.subtasks || []))
      .catch((err) => console.error('Failed to load sub-tasks:', err))
      .finally(() => setIsSubtasksLoading(false));
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskName.trim()) return;
    axios
      .post(`/api/tasks/${selectedTask.id}/subtasks`, {
        task_name: newSubtaskName,
        assignee: newSubtaskAssignee || null,
      })
      .then(() => {
        setNewSubtaskName('');
        setNewSubtaskAssignee('');
        fetchSubtasks(selectedTask.id);
        fetchComments(selectedTask.id);
        fetchTasks();
      })
      .catch((err) => showNotification(err.response?.data?.detail || 'Failed to add sub-task!', 'error'));
  };

  const handleToggleSubtask = (subtaskId, currentStatus, currentAssignee) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    // Optimistic update — ubah UI langsung tanpa tunggu server
    const prevSubtasks = subtasks;
    setSubtasks((prev) =>
      prev.map((st) => (st.id === subtaskId ? { ...st, is_done: newStatus } : st))
    );
    axios
      .put(`/api/subtasks/${subtaskId}`, { is_done: newStatus, assignee: currentAssignee })
      .then(() => {
        fetchSubtasks(selectedTask.id);
        fetchComments(selectedTask.id);
        fetchTasks();
      })
      .catch((err) => {
        // Rollback jika gagal
        setSubtasks(prevSubtasks);
        showNotification(err.response?.data?.detail || 'Failed to update sub-task!', 'error');
      });
  };

  const handleUpdateSubtaskAssignee = (subtaskId, currentIsDone, newAssignee) => {
    const keepStatus = currentIsDone === 1 ? 1 : 0;
    // Optimistic update — ubah assignee langsung di UI
    const prevSubtasks = subtasks;
    setSubtasks((prev) =>
      prev.map((st) => (st.id === subtaskId ? { ...st, assignee: newAssignee } : st))
    );
    axios
      .put(`/api/subtasks/${subtaskId}`, { is_done: keepStatus, assignee: newAssignee })
      .then(() => {
        fetchSubtasks(selectedTask.id);
        fetchComments(selectedTask.id);
        fetchTasks();
      })
      .catch((err) => {
        // Rollback jika gagal
        setSubtasks(prevSubtasks);
        showNotification(err.response?.data?.detail || 'Failed to update sub-task assignee!', 'error');
      });
  };

  const handleDeleteSubtask = (subtaskId) => {
    axios
      .delete(`/api/subtasks/${subtaskId}`)
      .then(() => {
        fetchSubtasks(selectedTask.id);
        fetchComments(selectedTask.id);
        fetchTasks();
      })
      .catch((err) => showNotification(err.response?.data?.detail || 'Failed to delete sub-task!', 'error'));
  };

  const fetchComments = (taskId, loadMore = false) => {
    let offset = loadMore ? commentsLengthRef.current : 0;
    let limit = loadMore ? 50 : Math.max(commentsLengthRef.current || 50, 50);
    axios
      .get(`/api/tasks/${taskId}/comments?offset=${offset}&limit=${limit}`)
      .then((res) => {
        let msgs = res.data.comments || [];
        msgs = msgs
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
          setHasMoreComments(msgs.length === 50);
          setComments((prev) => [...msgs, ...prev]);
        } else {
          setHasMoreComments(msgs.length === limit);
          setComments(msgs);
        }
      })
      .catch((err) => console.error('Failed to load comments:', err));
  };

  const loadMoreComments = () => {
    if (selectedTask) fetchComments(selectedTask.id, true);
  };

  const handleCommentChange = (value) => {
    setNewComment(value);
    const match = value.match(/(?:^|\s)@([\w.-]*)$/);
    if (match) {
      setCommentMentionQuery(match[1].toLowerCase());
      setIsCommentMentioning(true);
      setCommentMentionIndex(0);
    } else {
      setIsCommentMentioning(false);
    }
  };

  const insertCommentMention = (username) => {
    const newVal = newComment.replace(/(?:^|\s)@([\w.-]*)$/, ` @${username} `);
    setNewComment(newVal);
    setIsCommentMentioning(false);
  };

  const handleAddComment = (e, textOverride = null) => {
    if (e) e.preventDefault();
    const textToSubmit = typeof textOverride === 'string' ? textOverride : newComment;
    if (!textToSubmit.trim()) return;
    axios
      .post(`/api/tasks/${selectedTask.id}/comments`, { text: textToSubmit.trim() })
      .then(() => {
        setNewComment('');
        fetchComments(selectedTask.id);
        setSelectedBoard((prev) => (prev ? { ...prev, deletion_date: null } : null));
      })
      .catch((err) => showNotification(err.response?.data?.detail || 'Failed to add comment!', 'error'));
  };

  const handleAskAITaskChat = (taskId, finalComment, userText, onSuccess, isPrivateAI = false) => {
    setIsAiReplying(true);

    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const localTimeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const tempId = Date.now();
    const optimisticComment = {
      id: tempId,
      username: currentUser,
      text: finalComment,
      timestamp: localTimeStr,
      reactions: {},
      isPrivate: isPrivateAI,
      privateUser: currentUser,
    };
    setComments((prev) => [...prev, optimisticComment]);
    if (onSuccess) onSuccess(); // Langsung mengosongkan input

    const commentText = isPrivateAI ? `<!--PRIVATE:${currentUser}-->${finalComment}` : finalComment;
    const aiPromptText = isPrivateAI
      ? `${userText}\n\nIMPORTANT INSTRUCTION: You MUST start your entire response exactly with this string: <!--PRIVATE:${currentUser}-->`
      : userText;

    axios
      .post(`/api/tasks/${taskId}/comments`, { text: commentText })
      .then(() => {
        fetchComments(taskId);
        return axios.post(`/api/tasks/${taskId}/ai-reply`, { text: aiPromptText });
      })
      .then(() => {
        fetchComments(taskId);
      })
      .catch((err) => {
        console.error('AI Task Chat Error:', err);
        showNotification(err.response?.data?.detail || err.message || 'AI failed to reply', 'error');
      })
      .finally(() => setIsAiReplying(false));
  };

  const handleDeleteComment = (commentId) => {
    setCommentToDelete(commentId);
  };

  const confirmDeleteComment = () => {
    if (!commentToDelete) return;
    axios
      .delete(`/api/tasks/${selectedTask.id}/comments/${commentToDelete}`)
      .then(() => {
        fetchComments(selectedTask.id);
        showNotification('Comment deleted', 'success');
        setCommentToDelete(null);
      })
      .catch((err) => showNotification('Failed to delete comment', 'error'));
  };

  const handleToggleReaction = (commentId, emoji, isProjectChat = false) => {
    const updateFn = isProjectChat ? setProjectChatMessages : setComments;
    updateFn((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const newRx = { ...(c.reactions || {}) };
          const isAlreadySelected = newRx[emoji] && newRx[emoji].includes(currentUser);

          // Hapus user dari semua emoji terlebih dahulu (hanya boleh 1 emot per user)
          Object.keys(newRx).forEach((key) => {
            newRx[key] = newRx[key].filter((u) => u !== currentUser);
            if (newRx[key].length === 0) delete newRx[key];
          });

          if (!isAlreadySelected) {
            if (!newRx[emoji]) newRx[emoji] = [];
            newRx[emoji].push(currentUser);
          }

          return { ...c, reactions: newRx };
        }
        return c;
      })
    );
    axios.post(`/api/comments/${commentId}/react`, { emoji }).catch(() => {
      if (isProjectChat) fetchProjectChat();
      else if (selectedTask) fetchComments(selectedTask.id);
    });
  };

  const fetchProjectChat = (loadMore = false) => {
    if (!selectedBoard || selectedBoard.id === 'global') return;

    let offset = loadMore ? projectChatLengthRef.current : 0;
    let limit = loadMore ? 50 : Math.max(projectChatLengthRef.current || 50, 50);
    axios
      .get(`/api/boards/${selectedBoard.id}/chat?offset=${offset}&limit=${limit}`)
      .then((res) => {
        let msgs = res.data.messages || [];
        msgs = msgs
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
          setHasMoreProjectChat(msgs.length === 50);
          setProjectChatMessages((prev) => [...msgs, ...prev]);
        } else {
          setHasMoreProjectChat(msgs.length === limit);
          setProjectChatMessages(msgs);
          if (prevChatLenRef.current !== 0 && msgs.length > prevChatLenRef.current) {
            if (!isProjectChatOpen || drawerTab !== 'team') setHasNewProjectChat(true);
          }
          prevChatLenRef.current = msgs.length;
        }
      })
      .catch(console.error);
  };

  const loadMoreProjectChat = () => {
    fetchProjectChat(true);
  };

  const sendProjectChatMessage = (e) => {
    e.preventDefault();
    if (!newProjectChatMessage.trim() || !selectedBoard || selectedBoard.id === 'global') return;
    axios
      .post(`/api/boards/${selectedBoard.id}/chat`, { text: newProjectChatMessage.trim() })
      .then(() => {
        setNewProjectChatMessage('');
        fetchProjectChat();
        setSelectedBoard((prev) => (prev ? { ...prev, deletion_date: null } : null));
      })
      .catch((err) => showNotification(err.response?.data?.detail || 'Failed to send message', 'error'));
  };

  const handleStartMeet = (boardId) => {
    if (!boardId || boardId === 'global') return;
    const targetBoard = boards.find((b) => b.id === boardId) || selectedBoard;
    if (!targetBoard) return;

    const cleanName = targetBoard.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const roomName = `project-board-${cleanName}`;
    const meetLink = `https://meet.google.com/lookup/${roomName}`;

    // Buka Google Meet dalam jendela Popup terpisah agar terasa seperti In-App
    const popupFeatures =
      'width=1000,height=700,left=100,top=100,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
    window.open(meetLink, 'GoogleMeetPopup', popupFeatures);

    axios
      .post(`/api/boards/${boardId}/chat`, {
        text: `@team 🎥 I've started a Google Meet for this project! Join here: ${meetLink}`,
      })
      .then(() => fetchProjectChat())
      .catch(console.error);
  };

  const handleChatScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setShowScrollBottom(scrollHeight - scrollTop > clientHeight + 150);
  };

  const dismissMention = (id) => {
    setDismissedMentionIds((prev) => new Set(prev).add(id));
    setLatestMentionId(null);
  };

  useEffect(() => {
    if (projectChatMessages.length > 0 && currentUser) {
      const mention = [...projectChatMessages]
        .reverse()
        .find(
          (m) => (m.text.includes(`@${currentUser}`) || m.text.includes('@team')) && !dismissedMentionIds.has(m.id)
        );
      if (mention) setLatestMentionId(mention.id);
      else setLatestMentionId(null);
    } else {
      setLatestMentionId(null);
    }
  }, [projectChatMessages, currentUser, dismissedMentionIds]);

  const handleProjectChatChange = (value) => {
    setNewProjectChatMessage(value);
    const match = value.match(/(?:^|\s)@([\w.-]*)$/);
    if (match) {
      setProjectMentionQuery(match[1].toLowerCase());
      setIsProjectMentioning(true);
      setProjectMentionIndex(0);
    } else {
      setIsProjectMentioning(false);
    }
  };

  const insertProjectMention = (username) => {
    const newVal = newProjectChatMessage.replace(/(?:^|\s)@([\w.-]*)$/, ` @${username} `);
    setNewProjectChatMessage(newVal);
    setIsProjectMentioning(false);
  };

  useEffect(() => {
    let interval;
    if (selectedBoard && selectedBoard.id !== 'global') {
      fetchProjectChat();
      interval = setInterval(
        () => {
          if (document.visibilityState === 'visible') fetchProjectChat();
        },
        isProjectChatOpen ? 10000 : 60000
      ); // Live poll 10s (open) or 60s (closed)
    }
    return () => clearInterval(interval);
  }, [isProjectChatOpen, selectedBoard]);

  useEffect(() => {
    if (isProjectChatOpen && drawerTab === 'team') setHasNewProjectChat(false);
  }, [isProjectChatOpen, drawerTab]);

  useEffect(() => {
    prevChatLenRef.current = 0;
    setHasNewProjectChat(false);
  }, [selectedBoard]);

  const onDragEnd = (result, force = false) => {
    if (!result.destination) return;
    const { source, destination, draggableId, type } = result;

    if (type === 'column') {
      if (groupBy !== 'Status' && groupBy !== 'Category') return;
      if (source.index === destination.index) return;

      if (groupBy === 'Status') {
        const newCols = Array.from(columns);
        const [removed] = newCols.splice(source.index, 1);
        newCols.splice(destination.index, 0, removed);
        setColumns(newCols);
        if (selectedBoard && selectedBoard.id !== 'global') {
          localStorage.setItem(`innocean_columns_${selectedBoard.id}`, JSON.stringify(newCols));
        }
      } else if (groupBy === 'Category') {
        const newCats = Array.from(categories);
        const [removed] = newCats.splice(source.index, 1);
        newCats.splice(destination.index, 0, removed);
        setCategories(newCats);
        if (selectedBoard && selectedBoard.id !== 'global') {
          localStorage.setItem(`innocean_categories_${selectedBoard.id}`, JSON.stringify(newCats));
        }
      }
      return;
    }

    // JIKA DIJATUHKAN KE TONG SAMPAH MENGAMBANG
    if (destination.droppableId === 'trash') {
      const draggedTask = tasks.find((t) => t.id.toString() === draggableId);
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
      return;
    }

    if (source.droppableId === destination.droppableId) return;

    const draggedTask = tasks.find((t) => t.id.toString() === draggableId);
    if (!draggedTask) return;

    // Security & Permission Check pada saat dijatuhkan
    const isTaskAdmin =
      isSuperAdmin ||
      draggedTask.owner_username === currentUser ||
      (selectedBoard && selectedBoard.owner_username === currentUser) ||
      (draggedTask.requester &&
        new RegExp(`@${currentUser.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w.-])`, 'i').test(
          draggedTask.requester
        ));

    if (!isTaskAdmin) {
      showNotification(
        tMsg(
          'Permission Denied: Only Task Admins can move this task.',
          'Izin Ditolak: Hanya Admin Tugas yang dapat memindahkannya.'
        ),
        'error'
      );
      return;
    }

    const updatedTasks = tasks.map((t) => {
      if (t.id.toString() === draggableId) {
        if (groupBy === 'Status') {
          let compTime = t.completed_time;
          if (destination.droppableId === 'Done' || destination.droppableId === 'Rejected') {
            const now = new Date();
            compTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
              now.getDate()
            ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
              2,
              '0'
            )}:${String(now.getSeconds()).padStart(2, '0')}`;
          } else {
            compTime = null;
          }
          let newRecurring = t.recurring;
          if (destination.droppableId === 'Done' && t.status !== 'Done') {
            newRecurring = 'none';
          }
          return { ...t, status: destination.droppableId, completed_time: compTime, recurring: newRecurring };
        }
        if (groupBy === 'Category') return { ...t, category: destination.droppableId };
        if (groupBy === 'Assignee')
          return { ...t, requester: destination.droppableId === 'Unassigned' ? '' : destination.droppableId };
        if (groupBy === 'Project') {
          const targetBoard = boards.find((b) => b.name === destination.droppableId);
          return {
            ...t,
            board_name: destination.droppableId,
            board_id: targetBoard ? targetBoard.id : t.board_id,
          };
        }
      }
      return t;
    });

    if (!force && groupBy === 'Status' && destination.droppableId === 'Done') {
      if (draggedTask.subtask_done < draggedTask.subtask_total) {
        setTasks(updatedTasks);
        setPendingStatusChange({ type: 'drag', payload: result, previousTasks: tasks });
        return;
      }
    }

    setTasks(updatedTasks);

    if (groupBy === 'Status') {
      axios
        .put(`/api/tasks/${draggableId}`, { status: destination.droppableId })
        .then((res) => {
          if (res.data?.cloned_task_id) {
            setClonedTaskIds((prev) => new Set(prev).add(Number(res.data.cloned_task_id)));
          }
          fetchTasks();
          if (destination.droppableId === 'Done' && draggedTask.recurring && draggedTask.recurring !== 'none') {
            // Already called fetchTasks above
          }
        })
        .catch((err) => {
          showNotification(err.response?.data?.detail || 'Failed to save status to database!', 'error');
          fetchTasks();
        });
    } else {
      const payload = {
        project_name: draggedTask.project_name,
        requester:
          groupBy === 'Assignee'
            ? destination.droppableId === 'Unassigned'
              ? ''
              : destination.droppableId
            : draggedTask.requester,
        category: groupBy === 'Category' ? destination.droppableId : draggedTask.category,
        description: draggedTask.description || '',
        supporting_access: draggedTask.supporting_access || '',
        start_date: draggedTask.start_date || '',
        deadline: draggedTask.deadline ? draggedTask.deadline.split(' ')[0] + ' 17:00:00' : '',
        impact: draggedTask.impact || 'Medium',
        etc: draggedTask.etc || 2,
        auto_nudge: draggedTask.auto_nudge || false,
        recurring: draggedTask.recurring || 'none',
        status: draggedTask.status,
      };
      if (groupBy === 'Project') {
        const targetBoard = boards.find((b) => b.name === destination.droppableId);
        if (targetBoard) {
          payload.board_id = targetBoard.id;
        }
      }
      axios
        .put(`/api/tasks/${draggableId}/details`, payload)
        .then(() => {
          if (
            payload.status === 'Done' &&
            draggedTask.status !== 'Done' &&
            draggedTask.recurring &&
            draggedTask.recurring !== 'none'
          ) {
            fetchTasks();
          }
        })
        .catch((err) => {
          showNotification(err.response?.data?.detail || 'Failed to update task details!', 'error');
          fetchTasks();
        });
    }
  };

  const handleSubtaskDragEnd = (result) => {
    if (!result.destination || accountStatus === 'suspended') return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    if (sourceIndex === destinationIndex) return;

    const newSubtasks = Array.from(subtasks);
    const [removed] = newSubtasks.splice(sourceIndex, 1);
    newSubtasks.splice(destinationIndex, 0, removed);
    setSubtasks(newSubtasks); // Optimistic UI Update

    const orderedIds = newSubtasks.map((s) => s.id);
    axios.put(`/api/tasks/${selectedTask.id}/subtasks/reorder`, { ordered_ids: orderedIds }).catch(() => {
      showNotification('Failed to save subtask order!', 'error');
      fetchSubtasks(selectedTask.id); // Revert jika gagal
    });
  };

  const handleRequesterChange = (value, setFormFn, formDataState) => {
    setFormFn({ ...formDataState, requester: value });
    const match = value.match(/(?:^|\s)@([\w.-]*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setIsMentioning(true);
      setMentionIndex(0);
    } else {
      setIsMentioning(false);
    }
  };

  const insertMention = (username, setFormFn, formDataState) => {
    const newVal = formDataState.requester.replace(/(?:^|\s)@([\w.-]*)$/, ` @${username} `);
    setFormFn({ ...formDataState, requester: newVal });
    setIsMentioning(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.project_name || !formData.requester || !formData.start_date || !formData.deadline) {
      showNotification('Project Name, Requester, Start Date, and Deadline are required!', 'error');
      return;
    }

    const startDate = parseLocalZero(formData.start_date);
    const deadlineDate = parseLocalZero(formData.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (deadlineDate < startDate) {
      showNotification(
        language === 'id'
          ? 'Tenggat Waktu tidak boleh lebih awal dari Tanggal Mulai!'
          : 'Deadline cannot be earlier than Start Date!',
        'error'
      );
      return;
    }

    if (deadlineDate < today) {
      showNotification(
        language === 'id'
          ? 'Tenggat Waktu tidak boleh lebih awal dari Hari Ini!'
          : 'Deadline cannot be earlier than Today!',
        'error'
      );
      return;
    }

    setIsSubmitting(true);
    const formattedData = {
      ...formData,
      category: formData.category || categories[0] || 'Other',
      deadline: `${formData.deadline} 17:00:00`,
      etc: formData.etc || 2,
      recurring: formData.recurring || 'none',
      subtasks: formSubtasks,
    };

    axios
      .post(`/api/boards/${selectedBoard.id}/tasks`, formattedData)
      .then(() => {
        setIsFormOpen(false);
        setFormData({
          project_name: '',
          requester: '',
          category: 'Development',
          description: '',
          supporting_access: '',
          start_date: getLocalToday(),
          deadline: getLocalToday(),
          recurring: 'none',
        });
        setFormSubtasks([]);
        setFormSubtaskInput('');
        setFormSubtaskAssignee('');
        fetchTasks();
        showNotification('New task added successfully!', 'success');
        setSelectedBoard((prev) => (prev ? { ...prev, deletion_date: null } : null));
      })
      .catch((err) => {
        console.error('Failed to create task:', err);
        showNotification(err.response?.data?.detail || 'Failed to save task to database!', 'error');
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleQuickAddTask = (taskData) => {
    if (!taskData.project_name.trim() || !selectedBoard || selectedBoard.id === 'global') return;
    const nowStr = getLocalToday();
    const deadlineStr = taskData.deadline;

    if (deadlineStr) {
      const deadlineDate = parseLocalZero(deadlineStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadlineDate < today) {
        showNotification(
          language === 'id'
            ? 'Tenggat Waktu tidak boleh lebih awal dari Hari Ini!'
            : 'Deadline cannot be earlier than Today!',
          'error'
        );
        return;
      }
    }

    const formattedData = {
      project_name: taskData.project_name.trim(),
      requester: taskData.requester || currentUser,
      category: taskData.category || categories[0] || 'Other',
      description: '',
      supporting_access: '',
      start_date: nowStr,
      deadline: deadlineStr ? `${deadlineStr} 17:00:00` : '',
      impact: taskData.impact || 'Medium',
      etc: taskData.etc || 2,
      recurring: 'none',
      subtasks: [],
    };
    // Return the promise to allow for optimistic UI updates in the calling component
    return axios.post(`/api/boards/${selectedBoard.id}/tasks`, formattedData);
  };

  const handleQuickLinkAdd = (taskId, newLink) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const currentLinks = task.supporting_access ? task.supporting_access.split('\n').filter((l) => l.trim()) : [];
    currentLinks.push(newLink.trim());
    const updatedLinks = currentLinks.join('\n');

    const payload = {
      project_name: task.project_name,
      requester: task.requester,
      category: task.category,
      description: task.description || '',
      supporting_access: updatedLinks,
      start_date: (task.start_date || task.timestamp).split(' ')[0],
      deadline: task.deadline ? task.deadline.split(' ')[0] + ' 17:00:00' : '',
      impact: task.impact || 'Medium',
      etc: task.etc || 2,
      auto_nudge: task.auto_nudge || false,
      recurring: task.recurring || 'none',
      status: task.status,
    };

    const updatedTask = { ...task, supporting_access: updatedLinks };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(updatedTask);
    }

    axios.put(`/api/tasks/${taskId}/details`, payload).catch((err) => {
      showNotification('Failed to add link', 'error');
      fetchTasks();
    });
  };

  const handleQuickLinkRemove = (taskId, linkToRemove) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const currentLinks = task.supporting_access ? task.supporting_access.split('\n').filter((l) => l.trim()) : [];
    const updatedLinks = currentLinks.filter((l) => l !== linkToRemove).join('\n');

    const payload = {
      project_name: task.project_name,
      requester: task.requester,
      category: task.category,
      description: task.description || '',
      supporting_access: updatedLinks,
      start_date: (task.start_date || task.timestamp).split(' ')[0],
      deadline: task.deadline ? task.deadline.split(' ')[0] + ' 17:00:00' : '',
      impact: task.impact || 'Medium',
      etc: task.etc || 2,
      auto_nudge: task.auto_nudge || false,
      recurring: task.recurring || 'none',
      status: task.status,
    };

    const updatedTask = { ...task, supporting_access: updatedLinks };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(updatedTask);
    }

    axios.put(`/api/tasks/${taskId}/details`, payload).catch((err) => {
      showNotification('Failed to remove link', 'error');
      fetchTasks();
    });
  };

  const handleAddFormSubtask = (e) => {
    e.preventDefault();
    if (!formSubtaskInput.trim()) return;
    setFormSubtasks([...formSubtasks, { task_name: formSubtaskInput.trim(), assignee: formSubtaskAssignee || null }]);
    setFormSubtaskInput('');
    setFormSubtaskAssignee('');
  };

  const handleRemoveFormSubtask = (index) => {
    setFormSubtasks(formSubtasks.filter((_, i) => i !== index));
  };

  const handleDelete = () => {
    setIsSubmitting(true);
    axios
      .delete(`/api/tasks/${selectedTask.id}`)
      .then(() => {
        setIsDeleteConfirmOpen(false);
        setSelectedTask(null);
        fetchTasks();
        showNotification('Task deleted successfully!', 'success');
      })
      .catch((err) => {
        console.error('Failed to delete task:', err);
        showNotification(err.response?.data?.detail || 'Failed to delete task from database!', 'error');
      })
      .finally(() => setIsSubmitting(false));
  };

  const startEditing = () => {
    setEditFormData({
      project_name: selectedTask.project_name,
      requester: selectedTask.requester,
      category: selectedTask.category,
      description: selectedTask.description || '',
      supporting_access: selectedTask.supporting_access || '',
      start_date: (selectedTask.start_date || selectedTask.timestamp).split(' ')[0],
      deadline: selectedTask.deadline ? selectedTask.deadline.split(' ')[0] : '',
      impact: selectedTask.impact || 'Medium',
      etc: selectedTask.etc || 2,
      auto_nudge: selectedTask.auto_nudge || false,
      recurring: selectedTask.recurring || 'none',
      status: selectedTask.status,
      board_id: selectedTask.board_id,
    });
    setIsEditing(true);
  };

  const handleToggleAutoNudge = (taskId, newValue) => {
    const isEnabled = !!newValue;

    // Optimistic UI Update: Ubah status di UI seketika tanpa menunggu respon backend
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, auto_nudge: isEnabled } : t)));
    setSelectedTask((prev) => (prev && prev.id === taskId ? { ...prev, auto_nudge: isEnabled } : prev));

    axios
      .put(`/api/tasks/${taskId}/auto-nudge`, { auto_nudge: isEnabled })
      .then(() => {
        showNotification(isEnabled ? 'Auto Nudge enabled for this task' : 'Auto Nudge disabled', 'success');
      })
      .catch(() => {
        // Revert (Kembalikan ke awal) jika backend ternyata gagal menyimpannya
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, auto_nudge: !isEnabled } : t)));
        setSelectedTask((prev) => (prev && prev.id === taskId ? { ...prev, auto_nudge: !isEnabled } : prev));
        showNotification('Failed to toggle Auto Nudge', 'error');
      });
  };

  const handleEditSubmit = (e, force = false) => {
    e.preventDefault();

    const startDate = parseLocalZero(editFormData.start_date);
    const deadlineDate = parseLocalZero(editFormData.deadline);
    const createdDate = parseLocalZero(selectedTask.timestamp);

    if (deadlineDate < startDate) {
      showNotification(
        language === 'id'
          ? 'Tenggat Waktu tidak boleh lebih awal dari Tanggal Mulai!'
          : 'Deadline cannot be earlier than Start Date!',
        'error'
      );
      return;
    }

    if (deadlineDate < createdDate) {
      showNotification(
        language === 'id'
          ? 'Tenggat Waktu tidak boleh lebih awal dari Tanggal Dibuat!'
          : 'Deadline cannot be earlier than Created Date!',
        'error'
      );
      return;
    }

    if (!force && editFormData.status === 'Done') {
      const freshTask = tasks.find((t) => t.id === selectedTask?.id) || selectedTask;
      const hasIncomplete = isSubtasksLoading
        ? freshTask.subtask_done < freshTask.subtask_total
        : subtasks.some((st) => st.is_done === 0);

      if (hasIncomplete) {
        setPendingStatusChange({ type: 'edit', payload: null });
        return;
      }
    }

    setIsSubmitting(true);
    const validDeadline = editFormData.deadline || getLocalToday();
    const payload = { ...editFormData, deadline: `${validDeadline.trim()} 17:00:00` };

    // Ensure etc is a number
    if (payload.etc === '' || isNaN(payload.etc)) {
      payload.etc = 2.0;
    } else {
      payload.etc = parseFloat(payload.etc);
    }

    // Optimistic UI Update
    const updatedTask = { ...selectedTask, ...payload };
    if (payload.board_id !== selectedTask.board_id) {
      const targetBoard = boards.find((b) => b.id === payload.board_id);
      if (targetBoard) updatedTask.board_name = targetBoard.name;
    }
    setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? updatedTask : t)));

    axios
      .put(`/api/tasks/${selectedTask.id}/details`, payload)
      .then((res) => {
        if (res.data?.cloned_task_id) {
          setClonedTaskIds((prev) => new Set(prev).add(res.data.cloned_task_id));
        }
        setIsEditing(false);
        setSelectedTask(updatedTask);
        fetchTasks();
        fetchComments(selectedTask.id);
        showNotification('Task details updated successfully!', 'success');
        setSelectedBoard((prev) => (prev ? { ...prev, deletion_date: null } : null));
      })
      .catch((err) => {
        showNotification(err.response?.data?.detail || 'Failed to update task!', 'error');
        fetchTasks(); // Revert on error
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleDirectStatusChange = (newStatus, force = false) => {
    if (!force && newStatus === 'Done') {
      const freshTask = tasks.find((t) => t.id === selectedTask?.id) || selectedTask;
      const hasIncomplete = isSubtasksLoading
        ? freshTask.subtask_done < freshTask.subtask_total
        : subtasks.some((st) => st.is_done === 0);

      if (hasIncomplete) {
        setPendingStatusChange({ type: 'direct', payload: newStatus });
        return;
      }
    }

    const updatedTask = { ...selectedTask, status: newStatus };
    if (newStatus === 'Done' || newStatus === 'Rejected') {
      const now = new Date();
      updatedTask.completed_time = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
        2,
        '0'
      )}:${String(now.getSeconds()).padStart(2, '0')}`;
    } else {
      updatedTask.completed_time = null;
    }
    if (newStatus === 'Done' && updatedTask.recurring !== 'none') {
      updatedTask.recurring = 'none';
    }
    setSelectedTask(updatedTask);

    setTasks(tasks.map((t) => (t.id === selectedTask.id ? updatedTask : t)));

    axios
      .put(`/api/tasks/${selectedTask.id}`, { status: newStatus })
      .then((res) => {
        if (res.data?.cloned_task_id) {
          setClonedTaskIds((prev) => new Set(prev).add(Number(res.data.cloned_task_id)));
        }
        fetchTasks();
        fetchComments(selectedTask.id);
        showNotification(`Task marked as ${newStatus}`, 'success');
        setSelectedBoard((prev) => (prev ? { ...prev, deletion_date: null } : null));
      })
      .catch((err) => {
        showNotification(err.response?.data?.detail || 'Failed to update status!', 'error');
        fetchTasks();
        setSelectedTask(tasks.find((t) => t.id === selectedTask.id) || selectedTask);
      });
  };

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (selectedBoard && selectedBoard.id !== 'global') {
        if (task.board_id !== selectedBoard.id) {
          return false;
        }
      }

      const keywords = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
      const combinedSearchText = [
        task.project_name,
        task.requester,
        task.category,
        task.description,
        task.owner_username,
      ]
        .join(' ')
        .toLowerCase();
      let matchSearch = keywords.length === 0 || keywords.every((kw) => combinedSearchText.includes(kw));

      // Batasi pencarian local untuk task Done/Rejected hanya 90 hari terakhir
      if (searchQuery && matchSearch && (task.status === 'Done' || task.status === 'Rejected')) {
        const completedTime = task.completed_time ? new Date(task.completed_time.replace(/-/g, '/')) : new Date(0);
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        if (completedTime < ninetyDaysAgo) {
          matchSearch = false; // Abaikan jika terlalu lama
        }
      }

      const matchStatus = filterStatus === 'All' || task.status === filterStatus;
      const matchCategory = filterCategory === 'All' || task.category === filterCategory;
      const matchAssignee = filterAssignee === 'All' || getTaskAssignee(task) === filterAssignee;
      const matchMyTasks = !showMyTasks || isUserAssigned(task, currentUser);
      const matchUnread =
        !showUnreadOnly ||
        (notifications || []).some(
          (n) =>
            !n.is_read &&
            n.related_task_id === task.id &&
            (n.type === 'comment' || n.type === 'mention' || n.type === 'mention_no_email')
        );
      const matchHasSubtasks = !showHasSubtasks || (task.subtask_total && task.subtask_total > 0);
      const matchHideCompleted =
        !(
          hideCompleted &&
          (viewMode === 'kanban' || viewMode === 'list' || viewMode === 'timeline' || viewMode === 'calendar')
        ) ||
        (task.status !== 'Done' && task.status !== 'Rejected');
      const matchOverdue =
        !showOverdueOnly ||
        (() => {
          if (!task.deadline) return false;
          const status = (task.status || '').toLowerCase();
          if (status === 'done' || status === 'rejected') return false;
          const end = new Date(task.deadline);
          const now = new Date();
          end.setHours(0, 0, 0, 0);
          now.setHours(0, 0, 0, 0);
          return end < now;
        })();

      return (
        matchSearch &&
        matchStatus &&
        matchCategory &&
        matchAssignee &&
        matchMyTasks &&
        matchUnread &&
        matchHasSubtasks &&
        matchHideCompleted &&
        matchOverdue
      );
    });

    const sorted = filtered.sort((a, b) => {
      let currentSort = sortBy;
      if (currentSort === 'Default') {
        const prioWeight = { critical: 1, warning: 2, normal: 3 };
        const wa = prioWeight[a.priority_lvl || 'normal'] || 3;
        const wb = prioWeight[b.priority_lvl || 'normal'] || 3;
        if (wa !== wb) return wa - wb;

        const impactWeight = { High: 1, Medium: 2, Low: 3 };
        const impA = impactWeight[a.impact || 'Medium'] || 2;
        const impB = impactWeight[b.impact || 'Medium'] || 2;
        if (impA !== impB) return impA - impB;

        const da = a.deadline
          ? new Date(a.deadline.replace(/-/g, '/')).getTime()
          : new Date(a.timestamp.replace(/-/g, '/')).getTime();
        const db = b.deadline
          ? new Date(b.deadline.replace(/-/g, '/')).getTime()
          : new Date(b.timestamp.replace(/-/g, '/')).getTime();
        if (da !== db) return da - db;
        return a.id - b.id;
      }
      if (currentSort === 'Impact') {
        const impactWeight = { High: 3, Medium: 2, Low: 1 };
        const wa = impactWeight[a.impact || 'Medium'] || 0;
        const wb = impactWeight[b.impact || 'Medium'] || 0;
        if (wa !== wb) return wb - wa;
        if (a.etc !== b.etc) return (b.etc || 2) - (a.etc || 2);
        const da = a.deadline ? new Date(a.deadline.replace(/-/g, '/')).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline.replace(/-/g, '/')).getTime() : Infinity;
        if (da !== db) return da - db;
        return a.id - b.id;
      }
      if (currentSort === 'Due Date') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        const da = new Date(a.deadline.replace(/-/g, '/')).getTime();
        const db = new Date(b.deadline.replace(/-/g, '/')).getTime();
        return da - db;
      }
      if (currentSort === 'Date Created') {
        const da = new Date(a.timestamp.replace(/-/g, '/')).getTime();
        const db = new Date(b.timestamp.replace(/-/g, '/')).getTime();
        return db - da; // Tugas terbaru di atas
      }
      return a.id - b.id;
    });

    return sorted;
  }, [
    tasks,
    searchQuery,
    filterStatus,
    filterCategory,
    filterAssignee,
    showMyTasks,
    showOverdueOnly,
    showUnreadOnly,
    showHasSubtasks,
    sortBy,
    currentUser,
    notifications,
    hideCompleted,
    viewMode,
    groupBy,
    selectedBoard,
    boards,
  ]);

  const activeColumns = useMemo(() => {
    if (groupBy === 'Status') return columns;
    if (groupBy === 'Category') return categories;
    if (groupBy === 'Assignee') return [...new Set(tasks.map((t) => getTaskAssignee(t)))];
    if (groupBy === 'Project') {
      const todoListBoard = boards.find((b) => b.name.toLowerCase() === 'to-do list' && b.is_private);
      const todoListName =
        todoListBoard && (!selectedBoard || selectedBoard.id === 'global' || selectedBoard.id === todoListBoard.id)
          ? todoListBoard.name
          : null;

      const projCols = [...new Set(tasks.map((t) => t.board_name || 'Unknown Project'))];
      const allCols = todoListName && !projCols.includes(todoListName) ? [todoListName, ...projCols] : projCols;

      return allCols.sort((a, b) => {
        const isTodoA = a.toLowerCase() === 'to-do list';
        const isTodoB = b.toLowerCase() === 'to-do list';
        if (isTodoA && !isTodoB) return -1;
        if (!isTodoA && isTodoB) return 1;
        return 0;
      });
    }
    return [];
  }, [groupBy, columns, categories, tasks, boards]);

  const assigneeOptions = useMemo(() => [...new Set(tasks.map((t) => getTaskAssignee(t)))], [tasks]);

  const handleOpenNewTaskForm = () => {
    setIsFormOpen(true);
    if (driverRef.current && driverRef.current.isAtNewTask) {
      setTimeout(() => {
        if (driverRef.current) driverRef.current.moveNext();
      }, 400);
    }
  };

  // Logika Global Search (Menunggu 300ms setelah selesai ngetik sebelum memanggil API)
  useEffect(() => {
    if (globalSearchQuery.trim().length >= 2) {
      const delayDebounceFn = setTimeout(() => {
        axios
          .get(`/api/tasks/search?q=${encodeURIComponent(globalSearchQuery)}`)
          .then((res) => {
            setGlobalSearchResults(res.data.results || []);
            setIsGlobalSearchOpen(true);
          })
          .catch((err) => console.error('Search failed:', err));
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setGlobalSearchResults([]);
      setIsGlobalSearchOpen(false);
    }
  }, [globalSearchQuery]);

  const handleGlobalSearchSelect = (task) => {
    const board = boards.find((b) => b.id === task.board_id);
    if (board) setSelectedBoard(board);
    setSelectedTask(task);
    setGlobalSearchQuery('');
    closeGlobalSearch();
  };

  const handleExportCSV = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    let tasksToExport = filteredTasks;
    let isGlobal = exportMode === 'global';

    if (isGlobal) {
      try {
        const res = await axios.get('/api/tasks/global-export');
        tasksToExport = res.data.tasks || [];

        tasksToExport = tasksToExport.filter((task) => {
          const uname = currentUser.toLowerCase();
          if (isUserAssigned(task, currentUser)) return true;
          if ((task.requester || '').toLowerCase().trim() === uname) return true;

          const isCreator = (task.owner_username || '').toLowerCase() === uname;
          const hasOtherAssignees = (task.requester || '').includes('@') || task.subtask_assignees;

          return isCreator && !hasOtherAssignees;
        });
      } catch (err) {
        setIsLoading(false);
        showNotification('Failed to fetch global tasks', 'error');
        return;
      }
    }

    if (exportStartDate || exportEndDate) {
      const start = exportStartDate ? new Date(exportStartDate) : new Date('2000-01-01');
      const end = exportEndDate ? new Date(exportEndDate) : new Date('2100-01-01');
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999); // Pastikan mencakup hingga pukul 23:59 di hari terakhir

      tasksToExport = tasksToExport.filter((t) => {
        const createdDate = new Date(t.timestamp.split(' ')[0]);
        const deadlineDate = t.deadline ? new Date(t.deadline.split(' ')[0]) : new Date('1970-01-01');
        const completedDate = t.completed_time ? new Date(t.completed_time.split(' ')[0]) : new Date('1970-01-01');

        const isCompletedInRange = completedDate >= start && completedDate <= end;
        const isDeadlineInRange = deadlineDate >= start && deadlineDate <= end;
        const isCreatedInRange = createdDate >= start && createdDate <= end;

        return isCompletedInRange || isDeadlineInRange || isCreatedInRange;
      });
    }

    if (tasksToExport.length === 0) {
      setIsLoading(false);
      showNotification('No tasks found in this period.', 'error');
      return;
    }

    const headers = isGlobal
      ? [
          'Workspace',
          'Task Name',
          'Description',
          'Task Creator',
          'Requester',
          'Subtasks',
          'Category',
          'Status',
          'Start Date',
          'Deadline',
          'Completed Time',
          'Impact',
          'ETC (Hrs)',
          'Recurring',
        ]
      : [
          'ID',
          'Task Name',
          'Description',
          'Task Creator',
          'Requester',
          'Subtasks',
          'Category',
          'Status',
          'Start Date',
          'Deadline',
          'Completed Time',
          'Impact',
          'ETC (Hrs)',
          'Recurring',
        ];

    const escapeCSV = (str) => {
      if (!str && str !== 0) return '""';
      return `"${String(str).replace(/"/g, '""')}"`;
    };

    const csvRows = [
      headers.join(','),
      ...tasksToExport.map((t) => {
        let displayedSubtasks = t.subtask_details;

        // Smart Filter untuk memisahkan Sub-task
        const escapedUname = currentUser.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const exactMentionRegex = new RegExp(`@${escapedUname}(?![\\w.-])`, 'i');

        if (
          isGlobal &&
          !exactMentionRegex.test(t.requester) &&
          (t.requester || '').toLowerCase().trim() !== currentUser.toLowerCase()
        ) {
          displayedSubtasks = (t.subtask_details || '')
            .split('\n')
            .filter((line) => exactMentionRegex.test(line))
            .join('\n');
        }

        return [
          isGlobal ? escapeCSV(t.board_name) : t.id,
          escapeCSV(t.project_name),
          escapeCSV(t.description),
          escapeCSV(t.owner_username),
          escapeCSV(t.requester),
          escapeCSV(displayedSubtasks),
          escapeCSV(t.category),
          escapeCSV(t.status),
          escapeCSV(t.start_date || (t.timestamp ? t.timestamp.split(' ')[0] : '')),
          escapeCSV(t.deadline),
          escapeCSV(t.completed_time),
          escapeCSV(t.impact || 'Medium'),
          escapeCSV(t.etc || 2),
          escapeCSV(t.recurring || 'none'),
        ].join(',');
      }),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `INNOCEAN_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setIsExportModalOpen(false);
    setIsLoading(false);
    showNotification('Data exported to CSV successfully!', 'success');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      showNotification('Username and Password are required!', 'error');
      return;
    }
    setIsLoading(true);

    const wakeTimer = setTimeout(() => {
      showNotification(
        language === 'id'
          ? 'Server sedang dibangunkan (Cold Start). Harap tunggu hingga 50 detik...'
          : 'Waking up server (Cold Start). Please wait up to 50 seconds...',
        'info'
      );
    }, 5000);

    axios
      .post('/api/login', { username: loginUsername.trim(), password: loginPassword }, { timeout: 75000 })
      .then((res) => {
        clearTimeout(wakeTimer);
        localStorage.setItem('innocean_auth', 'true');
        localStorage.setItem('innocean_token', res.data.token);
        localStorage.setItem('innocean_username', loginUsername.trim());

        sessionStorage.setItem('innocean_just_logged_in', 'true');
        // Gunakan Hard Reload agar memori React untuk Dashboard termuat dengan bersih tanpa blank screen
        window.location.href = '/';
      })
      .catch((err) => {
        clearTimeout(wakeTimer);
        setIsLoading(false);
        let errorMsg = 'Invalid username or password!';
        if (err.response?.data?.detail) {
          errorMsg = typeof err.response.data.detail === 'string' ? err.response.data.detail : errorMsg;
        } else if (err.response?.data) {
          errorMsg = typeof err.response.data === 'string' ? `Server Error: ${err.response.data}` : 'Server Error';
        } else if (err.message) {
          errorMsg = `Connection Error: ${err.message}. Is the backend running?`;
        }
        showNotification(errorMsg, 'error');
      });
  };

  const openTeamModal = (bId = null) => {
    fetchMyTeam(bId);
    setIsTeamModalOpen(true);
  };

  const handleInviteTeam = (e) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;
    setIsLoading(true);

    axios
      .post(`/api/boards/${selectedBoard.id}/invite`, { members_input: inviteInput.trim() })
      .then((res) => {
        setIsLoading(false);
        showNotification(res.data.message, 'success');
        setInviteInput('');
        setInviteSuggestions([]);
        fetchMyTeam();
      })
      .catch((err) => {
        setIsLoading(false);
        showNotification(err.response?.data?.detail || 'Failed to invite user.', 'error');
      });
  };

  const handleInviteInputChange = (e) => {
    const val = e.target.value;
    setInviteInput(val);

    const parts = val.split(',');
    const currentPart = parts[parts.length - 1].trim();

    if (currentPart.length >= 1) {
      const query = currentPart.toLowerCase();
      const suggestions = userDirectory
        .filter((u) => {
          // Privacy Lock: Cegah kebocoran data untuk user yang belum terhubung
          const isExactMatch =
            u.username.toLowerCase() === query ||
            (u.email &&
              u.email !== 'Hidden for privacy' &&
              u.email !== 'Email hidden for privacy' &&
              u.email.toLowerCase() === query);

          if (u.is_connected || isSuperAdmin) {
            return (
              u.username.toLowerCase().includes(query) ||
              (u.email &&
                u.email !== 'Hidden for privacy' &&
                u.email !== 'Email hidden for privacy' &&
                u.email.toLowerCase().includes(query))
            );
          } else {
            return isExactMatch;
          }
        })
        .filter(
          (u) => u.username !== currentUser && u.username !== 'admin' && !myTeam.some((m) => m.username === u.username)
        );
      setInviteSuggestions(suggestions);
      setInviteIndex(0);
    } else {
      setInviteSuggestions([]);
    }
  };

  const applyInviteSuggestion = (username) => {
    const parts = inviteInput.split(',');
    parts[parts.length - 1] = ` ${username}`;
    setInviteInput(parts.join(',').trim() + ', ');
    setInviteSuggestions([]);
  };

  const handleRevokeMember = (id) => {
    setMemberToRevoke(id);
  };

  const confirmRevokeMember = () => {
    if (!memberToRevoke) return;
    axios
      .delete(`/api/boards/${selectedBoard.id}/revoke/${memberToRevoke}`)
      .then(() => {
        showNotification('Access revoked successfully', 'success');

        const revokedMember = myTeam.find((m) => m.id === memberToRevoke);
        if (revokedMember && revokedMember.username === currentUser) {
          setIsTeamModalOpen(false);
          setSelectedBoard(null);
          fetchBoards();
        } else {
          fetchMyTeam();
          fetchTeamMembers();
          if (revokedMember && revokedMember.status === 'requesting') {
            setSelectedBoard((prev) =>
              prev ? { ...prev, access_requests_count: Math.max(0, (prev.access_requests_count || 1) - 1) } : prev
            );
            setBoards((prev) =>
              prev.map((b) =>
                b.id === selectedBoard.id
                  ? { ...b, access_requests_count: Math.max(0, (b.access_requests_count || 1) - 1) }
                  : b
              )
            );
            fetchBoards(); // Update badge count when declining request
          }
        }

        setMemberToRevoke(null);
      })
      .catch((err) => showNotification('Failed to revoke access', 'error'));
  };

  const handleAcceptAccessRequest = (memberId) => {
    axios
      .put(`/api/boards/${selectedBoard.id}/requests/${memberId}/accept`)
      .then((res) => {
        showNotification(res.data.message, 'success');
        fetchMyTeam();
        fetchTeamMembers();
        setSelectedBoard((prev) =>
          prev ? { ...prev, access_requests_count: Math.max(0, (prev.access_requests_count || 1) - 1) } : prev
        );
        setBoards((prev) =>
          prev.map((b) =>
            b.id === selectedBoard.id
              ? { ...b, access_requests_count: Math.max(0, (b.access_requests_count || 1) - 1) }
              : b
          )
        );
        fetchBoards(); // Update badge count
      })
      .catch((err) => showNotification(err.response?.data?.detail || 'Failed to accept request', 'error'));
  };

  const handleAcceptInvite = (id) => {
    axios
      .put(`/api/invitations/${id}/accept`)
      .then(() => {
        showNotification('Invitation accepted!', 'success');
        fetchInvitations();
        fetchBoards();
        fetchTasks();
        fetchTeamMembers();
      })
      .catch(() => showNotification('Failed to accept invitation.', 'error'));
  };

  const handleDeclineInvite = (id) => {
    axios
      .delete(`/api/invitations/${id}/decline`)
      .then(() => {
        showNotification('Invitation declined.', 'success');
        fetchInvitations();
      })
      .catch(() => showNotification('Failed to decline invitation.', 'error'));
  };

  const handleTransferToMember = (newOwnerUsername) => {
    setTransferTargetUsername(newOwnerUsername);
  };

  const confirmTransferOwnership = () => {
    if (!transferTargetUsername) return;
    setIsLoading(true);
    axios
      .put(`/api/boards/${selectedBoard.id}/transfer-member`, { new_owner: transferTargetUsername })
      .then((res) => {
        setIsLoading(false);
        if (showNotification) showNotification(res.data.message, 'success');
        setIsTeamModalOpen(false);
        setTransferTargetUsername(null);
        setSelectedBoard(null); // Keluar dari board untuk refresh status dengan bersih
        fetchBoards();
      })
      .catch((err) => {
        setIsLoading(false);
        if (showNotification) showNotification(err.response?.data?.detail || 'Failed to transfer', 'error');
        setTransferTargetUsername(null);
      });
  };

  const openSettings = () => {
    // Bersihkan form sandi dan buka modal murni dari cache lokal (0 hit API, Mencegah Re-render Blink)
    setProfileData((prev) => ({ ...prev, current_password: '', new_password: '' }));
    setIsSettingsOpen(true);
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (profileData.new_password && !profileData.current_password) {
      showNotification('Please enter your current password to change it.', 'error');
      return;
    }
    setIsLoading(true);
    const payload = {
      full_name: profileData.full_name,
      email: profileData.email,
      avatar: profileData.avatar,
      current_password: profileData.current_password,
      new_password: profileData.new_password,
    };
    axios
      .put('/api/profile', payload)
      .then((res) => {
        setIsLoading(false);
        showNotification(res.data.message || 'Profile updated successfully!', 'success');
        fetchAvatars();

        if (res.data.email_changed) {
          setTimeout(() => {
            handleLogout();
            showNotification('Session expired. Please verify your new email to login.', 'info');
          }, 2500);
        }
      })
      .catch((err) => {
        setIsLoading(false);
        showNotification(err.response?.data?.detail || 'Failed to update profile', 'error');
      });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        showNotification('Image size must be less than 1MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openAdminModal = () => {
    axios
      .get('/api/admin/users')
      .then((res) => {
        setAdminUsers(res.data.users || []);
        setIsAdminModalOpen(true);
      })
      .catch((err) => showNotification('Failed to load users or unauthorized', 'error'));
  };

  const handleToggleSuperAdmin = (username) => {
    axios
      .put(`/api/admin/users/superadmin`, { username, status: '' })
      .then((res) => {
        showNotification(res.data.message, 'success');
        openAdminModal();
      })
      .catch((err) => showNotification(err.response?.data?.detail || 'Failed to update role', 'error'));
  };

  const handleManualVerify = (username) => {
    axios
      .put(`/api/admin/users/verify`, { username, status: '' })
      .then((res) => {
        showNotification(res.data.message, 'success');
        openAdminModal();
      })
      .catch((err) => showNotification(err.response?.data?.detail || 'Failed to verify user', 'error'));
  };

  const handleUpdateUserStatus = (username, status, offboardDate = null) => {
    axios
      .put(`/api/admin/users/status`, { username, status, offboard_date: offboardDate })
      .then((res) => {
        showNotification(res.data.message, 'success');
        openAdminModal();
      })
      .catch((err) => showNotification(err.response?.data?.detail || 'Failed to update status', 'error'));
  };

  const handleAddLeave = (e) => {
    e.preventDefault();
    axios
      .post('/api/leaves', {
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        description: leaveForm.desc,
        leave_type: leaveForm.type,
      })
      .then(() => {
        showNotification('Leave added successfully!', 'success');
        setLeaveForm({ start_date: '', end_date: '', desc: '', type: 'personal' });
        fetchLeaves();
        fetchTasks();
      })
      .catch((err) => showNotification(err.response?.data?.detail || 'Error adding leave', 'error'));
  };

  const handleDeleteLeave = (id) => {
    axios
      .delete(`/api/leaves/${id}`)
      .then(() => {
        fetchLeaves();
        fetchTasks();
      })
      .catch(() => showNotification('Failed to delete', 'error'));
  };

  const handleDeleteUser = (username) => {
    axios
      .post(`/api/admin/users/delete`, { username, status: '' })
      .then(() => {
        showNotification(`User @${username} deleted`, 'success');
        openAdminModal();
      })
      .catch((err) => showNotification(err.response?.data?.detail || 'Failed to delete user', 'error'));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim() || !regFullName.trim() || !regEmail.trim()) {
      showNotification('All form fields are required!', 'error');
      return;
    }
    if (loginPassword !== regConfirmPassword) {
      showNotification('Passwords do not match!', 'error');
      return;
    }
    setIsLoading(true);

    const wakeTimer = setTimeout(() => {
      showNotification(
        language === 'id'
          ? 'Server sedang dibangunkan (Cold Start). Harap tunggu hingga 50 detik...'
          : 'Waking up server (Cold Start). Please wait up to 50 seconds...',
        'info'
      );
    }, 5000);

    axios
      .post(
        '/api/register',
        {
          full_name: regFullName.trim(),
          email: regEmail.trim(),
          username: loginUsername.trim(),
          password: loginPassword,
        },
        { timeout: 75000 }
      )
      .then(() => {
        clearTimeout(wakeTimer);
        setTimeout(() => {
          setIsLoading(false);
          showNotification(
            'Registration successful! Please check your email to verify your account before logging in.',
            'success'
          );
          setIsLoginMode(true);
          setLoginPassword('');
          setRegConfirmPassword('');
        }, 2000);
      })
      .catch((err) => {
        clearTimeout(wakeTimer);
        setTimeout(() => {
          setIsLoading(false);
          let errorMsg = 'Registration failed!';
          if (err.response?.data?.detail) {
            errorMsg =
              typeof err.response.data.detail === 'string'
                ? err.response.data.detail
                : 'Validation error, please check your input.';
          } else if (err.response?.data) {
            errorMsg = typeof err.response.data === 'string' ? `Server Error: ${err.response.data}` : 'Server Error';
          } else if (err.message) {
            errorMsg = `Connection Error: ${err.message}. Is the backend running?`;
          }
          showNotification(errorMsg, 'error');
        }, 2000);
      });
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return showNotification('Please enter your email', 'error');
    setIsLoading(true);

    const wakeTimer = setTimeout(() => {
      showNotification(
        language === 'id'
          ? 'Server sedang dibangunkan (Cold Start). Harap tunggu hingga 50 detik...'
          : 'Waking up server (Cold Start). Please wait up to 50 seconds...',
        'info'
      );
    }, 5000);

    axios
      .post('/api/forgot-password', { email: forgotEmail.trim(), origin: window.location.origin }, { timeout: 75000 })
      .then((res) => {
        clearTimeout(wakeTimer);
        setIsLoading(false);
        showNotification('If your email is registered, a reset link has been sent.', 'success');
        setIsForgotMode(false);
        setForgotEmail('');
      })
      .catch((err) => {
        clearTimeout(wakeTimer);
        setIsLoading(false);
        showNotification('Failed to send reset link', 'error');
      });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (loginPassword !== regConfirmPassword) {
      return showNotification('Passwords do not match!', 'error');
    }
    setIsLoading(true);

    const wakeTimer = setTimeout(() => {
      showNotification(
        language === 'id'
          ? 'Server sedang dibangunkan (Cold Start). Harap tunggu hingga 50 detik...'
          : 'Waking up server (Cold Start). Please wait up to 50 seconds...',
        'info'
      );
    }, 5000);

    axios
      .post('/api/reset-password', { token: resetToken, new_password: loginPassword }, { timeout: 75000 })
      .then((res) => {
        clearTimeout(wakeTimer);
        setIsLoading(false);
        showNotification('Password successfully reset! You can now login.', 'success');
        setIsResetMode(false);
        setResetToken(null);
        setLoginPassword('');
        setRegConfirmPassword('');

        const url = new URL(window.location);
        url.searchParams.delete('token');
        window.history.pushState({}, '', url);
      })
      .catch((err) => {
        clearTimeout(wakeTimer);
        setIsLoading(false);
        showNotification(err.response?.data?.detail || 'Invalid or expired token', 'error');
      });
  };

  const handleCreateBoard = (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    setIsSubmitting(true);
    axios
      .post('/api/boards', { name: newBoardName.trim(), is_private: isPrivateBoard ? 1 : 0 })
      .then(() => {
        setIsCreateBoardOpen(false);
        setNewBoardName('');
        setIsPrivateBoard(false);
        fetchBoards();
        showNotification('Project created successfully!', 'success');
      })
      .catch((err) => {
        showNotification(err.response?.data?.detail || 'Failed to create project', 'error');
      })
      .finally(() => setIsSubmitting(false));
  };

  const confirmDeleteBoard = () => {
    if (!boardToDelete) return;
    setIsSubmitting(true);
    axios
      .delete(`/api/boards/${boardToDelete.id}`)
      .then(() => {
        showNotification('Project deleted!', 'success');
        fetchBoards();
        setBoardToDelete(null);
        setDeleteBoardConfirmText('');
        if (selectedBoard?.id === boardToDelete.id) setSelectedBoard(null);
      })
      .catch((err) => showNotification(err.response?.data?.detail || 'Failed to delete project', 'error'))
      .finally(() => setIsSubmitting(false));
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setIsSubmitting(true);
    axios
      .post('/api/feedback', { text: feedbackText })
      .then((res) => {
        showNotification(res.data.message, 'success');
        setIsFeedbackOpen(false);
        setFeedbackText('');
      })
      .catch((err) => showNotification('Failed to submit feedback', 'error'))
      .finally(() => setIsSubmitting(false));
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!supportText.trim()) return;
    setIsSubmitting(true);
    axios
      .post('/api/feedback', { text: `[SUPPORT TICKET] ${supportText}` })
      .then((res) => {
        showNotification(
          language === 'id' ? 'Tiket dukungan berhasil dikirim ke tim IT!' : 'Support ticket sent to IT successfully!',
          'success'
        );
        setIsSupportOpen(false);
        setSupportText('');
      })
      .catch((err) => showNotification('Failed to submit support ticket', 'error'))
      .finally(() => setIsSubmitting(false));
  };

  // Intercept Back Button untuk pengalaman layaknya Aplikasi Mobile (PWA)
  useEffect(() => {
    const handlePopState = (e) => {
      // Prioritas 1: Tutup Layer Modal atau View yang sedang aktif
      if (
        isSettingsOpen ||
        isDocsOpen ||
        isProjectChatOpen ||
        isFormOpen ||
        selectedTask ||
        isLeaveModalOpen ||
        isAdminModalOpen ||
        isFeedbackOpen ||
        isSupportOpen ||
        isTeamModalOpen ||
        isInvitesModalOpen ||
        isLogoutConfirmOpen ||
        isDeleteConfirmOpen ||
        isCreateBoardOpen ||
        isExportModalOpen ||
        isMyTicketsOpen ||
        colModal.isOpen ||
        isChatWorkspaceOpen ||
        isMobileMenuOpen ||
        isAssistantOpen ||
        isProactiveAIOpen
      ) {
        setIsSettingsOpen(false);
        setIsDocsOpen(false);
        setIsProjectChatOpen(false);
        setIsFormOpen(false);
        setSelectedTask(null);
        setIsLeaveModalOpen(false);
        setIsAdminModalOpen(false);
        setIsFeedbackOpen(false);
        setIsSupportOpen(false);
        setIsTeamModalOpen(false);
        setIsInvitesModalOpen(false);
        setIsLogoutConfirmOpen(false);
        setIsDeleteConfirmOpen(false);
        setIsCreateBoardOpen(false);
        setIsExportModalOpen(false);
        setIsMyTicketsOpen(false);
        setIsMobileMenuOpen(false);
        setIsChatWorkspaceOpen(false);
        setIsAssistantOpen(false);
        setIsProactiveAIOpen(false);
        setColModal((prev) => ({ ...prev, isOpen: false }));
        window.history.pushState({ app_state: 'active' }, ''); // Cegah aplikasi keluar
      }
      // Prioritas 2: Keluar dari Ruang Kerja Proyek kembali ke Dashboard Utama
      else if (selectedBoard) {
        setSelectedBoard(null);
        window.history.pushState({ app_state: 'active' }, ''); // Cegah aplikasi keluar
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    isSettingsOpen,
    isDocsOpen,
    isProjectChatOpen,
    isFormOpen,
    selectedTask,
    isLeaveModalOpen,
    isAdminModalOpen,
    isFeedbackOpen,
    isSupportOpen,
    selectedBoard,
    isTeamModalOpen,
    isInvitesModalOpen,
    isLogoutConfirmOpen,
    isDeleteConfirmOpen,
    isCreateBoardOpen,
    isExportModalOpen,
    isMyTicketsOpen,
    colModal.isOpen,
    isChatWorkspaceOpen,
    isMobileMenuOpen,
    isAssistantOpen,
  ]);

  useEffect(() => {
    if (isAuthenticated) window.history.pushState({ app_state: 'active' }, '');
  }, [isAuthenticated]);

  const teamWorkloadStats = useMemo(() => {
    if (!tasks || tasks.length === 0 || !userDirectory || userDirectory.length === 0) {
      return {};
    }

    const memberDetailedStats = {};
    const currentMembersLookup = new Set((userDirectory || []).map((m) => m.username.toLowerCase()));

    tasks.forEach((t) => {
      if (t.status === 'Rejected') return;

      const involvedUsers = new Set();
      if (t.owner_username) involvedUsers.add(t.owner_username);

      if (t.requester) {
        const matches = t.requester.match(/@([\w.-]+)/g);
        if (matches) {
          matches.forEach((m) => involvedUsers.add(m.substring(1)));
        }
      }

      if (t.subtask_details) {
        const lines = t.subtask_details.split('\n');
        lines.forEach((line) => {
          const match = line.match(/\(@([\w.-]+)\)$/);
          if (match) involvedUsers.add(match[1]);
        });
      }

      const validUsers = Array.from(involvedUsers).filter(
        (p) => p && p.toLowerCase() !== 'unassigned' && currentMembersLookup.has(p.toLowerCase())
      );
      const divisor = validUsers.length > 0 ? validUsers.length : 1;
      const splitEtc = (t.etc || 2) / divisor;

      validUsers.forEach((person) => {
        if (!memberDetailedStats[person]) {
          memberDetailedStats[person] = {
            total_etc: 0,
            done_etc: 0,
            active_etc: 0,
            critical: 0,
          };
        }

        memberDetailedStats[person].total_etc += splitEtc;

        if (t.status === 'Done') {
          memberDetailedStats[person].done_etc += splitEtc;
        } else {
          if (t.status !== 'Pending') memberDetailedStats[person].active_etc += splitEtc;
          if (t.priority_lvl === 'critical') memberDetailedStats[person].critical += 1;
        }
      });
    });
    return memberDetailedStats;
  }, [tasks, userDirectory]);

  return {
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
    userDirectory,
    mentionQuery,
    isAdminModalOpen,
    adminUsers,
    comments,
    newComment,
    teamMembers,
    notifications,
    isNotifOpen,
    showTimesheets,
    setShowTimesheets,
    isNotifClosing,
    commentToDelete,
    memberToRevoke,
    transferTargetUsername,
    setTransferTargetUsername,
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
    isSupportOpen,
    supportText,
    isDocsOpen,
    isMomNotepadOpen,
    isMobileMenuOpen,
    isLogoutConfirmOpen,
    isPrivacyOpen,
    isTermsOpen,
    isSpecsOpen,
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
    showOverdueOnly,
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
    isAiReplying,
    handleAskAITaskChat,
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
    setIsSupportOpen,
    setSupportText,
    setIsDocsOpen,
    setIsMomNotepadOpen,
    setIsMobileMenuOpen,
    isMobileProfileOpen,
    setIsMobileProfileOpen,
    isMyTicketsOpen,
    setIsMyTicketsOpen,
    isChatWorkspaceOpen,
    setIsChatWorkspaceOpen,
    workspaceChatTarget,
    setWorkspaceChatTarget,
    setIsLogoutConfirmOpen,
    setIsPrivacyOpen,
    setIsTermsOpen,
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
    handleMarkAllInboxAsRead,
    handleNotificationTaskClick,
    handleOpenAddBoard,
    handleOpenRenameBoard,
    handleOpenDeleteBoard,
    handleColSubmit,
    handleAddSubtask,
    handleToggleSubtask,
    handleUpdateSubtaskAssignee,
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
    confirmTransferOwnership,
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
    closeNotif,
    closeGlobalSearch,
    handleQuickLinkAdd,
    handleQuickLinkRemove,
    handleStartMeet,
    handleChatScroll,
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
    cancelPendingStatusChange,
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
    dmConversations,
    setDmConversations,
    fetchDmConversations,
    inboxChats,
    setInboxChats,
    fetchInboxChats,
    isInboxLoading,
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
    teamWorkloadStats,
  };
}
