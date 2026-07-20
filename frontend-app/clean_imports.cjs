const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(file, 'utf8');

// The block to remove
const blockToRemove = `import {
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
import SystemSpecsModal from './SystemSpecsModal';`;

const replacement = `import AppThemes from './ThemeStyles';`;

content = content.replace(blockToRemove, replacement);
fs.writeFileSync(file, content);
console.log('Removed unused modal imports.');
