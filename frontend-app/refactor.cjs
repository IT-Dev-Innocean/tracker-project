const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'useAppLogic.js');
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
if (!content.includes("import { useAuth }")) {
  content = content.replace(
    "import { useModals } from './hooks/useModals';",
    "import { useModals } from './hooks/useModals';\nimport { useAuth } from './hooks/useAuth';\nimport { useTask } from './hooks/useTask';\nimport { useBoard } from './hooks/useBoard';\nimport { useUISettings } from './hooks/useUISettings';"
  );
}

// 2. Replace the massive state block with hook calls
const startStateRegex = /const \[isAuthenticated[\s\S]*?const \[memberToRevoke, setMemberToRevoke\] = useState\(null\);\n/;

const hookCalls = `  const ui = useUISettings();
  const { showNotification, isLoading, setIsLoading } = ui;

  const boardLogic = useBoard({ 
    isAuthenticated: true, // will be overridden below, just for initialization order
    currentUser: '', 
    showNotification, 
    setIsLoading 
  });
  const { selectedBoard, setSelectedBoard } = boardLogic;

  const authLogic = useAuth({
    showNotification,
    setIsLoading,
    language,
    onClearSession: () => setSelectedBoard(null)
  });
  const { isAuthenticated, currentUser } = authLogic;

  // Fix board logic dependency
  boardLogic.isAuthenticated = isAuthenticated;
  boardLogic.currentUser = currentUser;

  const taskLogic = useTask({
    isAuthenticated,
    selectedBoard,
    setSelectedBoard,
    currentUser,
    showNotification,
    setIsLoading
  });
  const { tasks, setTasks, colModal, setColModal, selectedTask, setSelectedTask } = taskLogic;

  const isInitialTasksLoad = useRef(true);
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
  const [userDirectory, setUserDirectory] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [profileData, setProfileData] = useState({ username: '', email: '', full_name: '' });
  const [adminUsers, setAdminUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotifClosing, setIsNotifClosing] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [avatarsMap, setAvatarsMap] = useState({});
  const [newBoardName, setNewBoardName] = useState('');
  const [isPrivateBoard, setIsPrivateBoard] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
`;

content = content.replace(startStateRegex, hookCalls);

// 3. Remove the exact function blocks
// We will use a regex to match from `const functionName =` up to the end of the block.
// This requires a helper that matches balanced braces, but for simplicity we can just match specific known patterns or use simple string replacements if possible.
// Actually, simple string replacement or regex with careful boundaries is better.

const functionsToRemove = [
  /const loginWithGoogle = useGoogleLogin\(\{[\s\S]*?onError: \(\) => showNotification\('Google Login failed or cancelled', 'error'\),\n  \}\);/g,
  /const handleLogout = \(\) => \{[\s\S]*?\}, 1000\);\n  \};/g,
  /useEffect\(\(\) => \{\n    const handleAuthError = \(\) => \{[\s\S]*?window\.removeEventListener\('auth_error', handleAuthError\);\n  \}, \[\]\);/g, // verifyToken equivalent
  /const fetchBoards = \(\) => \{[\s\S]*?finally\(\(\) => setIsBoardsLoading\(false\)\);\n  \};/g,
  /const fetchTasks = \(\) => \{[\s\S]*?finally\(\(\) => setIsTasksLoading\(false\)\);\n  \};/g,
  /const fetchMyTeam = \(\(bId = null\) => \{[\s\S]*?err\)\);\n  \};/g,
  /const handleTaskSubmit = \(e, taskData = null, onSuccess = null\) => \{[\s\S]*?Failed to create task\.', 'error'\);\n      \}\);\n  \};/g,
  /const handleTaskUpdate = \(id, updatedFields\) => \{[\s\S]*?Failed to update task\.', 'error'\);\n      \}\);\n  \};/g,
  /const handleTaskDelete = \(id, onSuccess = null\) => \{[\s\S]*?Failed to delete task', 'error'\);\n      \}\);\n  \};/g,
  /const handleCreateBoard = \(boardName, onSuccess = null\) => \{[\s\S]*?Failed to create project\.', 'error'\);\n      \}\);\n  \};/g,
  /const handleUpdateBoard = \(boardId, boardName, onSuccess = null\) => \{[\s\S]*?Failed to update project\.', 'error'\);\n      \}\);\n  \};/g,
  /const handleDeleteBoard = \(boardId, onSuccess = null\) => \{[\s\S]*?Failed to delete project\.', 'error'\);\n      \}\);\n  \};/g,
  /const handleLogin = \(e\) => \{[\s\S]*?showNotification\(errorMsg, 'error'\);\n      \}\);\n  \};/g,
  /const handleRegister = \(e\) => \{[\s\S]*?Registration failed!', 'error'\);\n      \}\);\n  \};/g,
  /const handleForgotPassword = \(e\) => \{[\s\S]*?Failed to send reset link\.', 'error'\);\n      \}\);\n  \};/g,
  /const handleResetPassword = \(e\) => \{[\s\S]*?Link may be expired\.', 'error'\);\n      \}\);\n  \};/g,
];

functionsToRemove.forEach(regex => {
  content = content.replace(regex, '');
});

// 4. Update the return object to spread the hook returns
// Replace everything at the bottom of the return statement
content = content.replace(/isAuthenticated,\n[\s\S]*?loginWithGoogle,\n/g, '...authLogic,\n    ...taskLogic,\n    ...boardLogic,\n    ...ui,\n');

fs.writeFileSync(file, content);
console.log('useAppLogic.js successfully refactored');
