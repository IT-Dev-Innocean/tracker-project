import { useState, useCallback } from 'react';
import axios from 'axios';

const DEFAULT_COLUMNS = ['Pending', 'In Progress', 'Done', 'Rejected'];
const DEFAULT_CATEGORIES = ['Development', 'Design', 'Marketing', 'Research', 'Maintenance', 'Consulting', 'Other'];

export function useTask({ isAuthenticated, selectedBoard, setSelectedBoard, currentUser, showNotification, setIsLoading }) {
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
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [isSubtasksLoading, setIsSubtasksLoading] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    status: 'Pending',
    category: 'Development',
    requester: '',
    etc: 0,
    impact: 'Medium',
    start_date: '',
    deadline: '',
    owner_username: '',
    auto_nudge: false,
    nudge_interval_hours: 24,
  });
  const [formSubtasks, setFormSubtasks] = useState([]);
  const [formSubtaskInput, setFormSubtaskInput] = useState('');
  const [formSubtaskAssignee, setFormSubtaskAssignee] = useState('');

  const fetchTasks = useCallback(() => {
    if (!isAuthenticated) return;
    setIsTasksLoading(true);

    if (!selectedBoard || selectedBoard.id === 'global') {
      axios
        .get('/api/tasks/all')
        .then((res) => setTasks(res.data.tasks || []))
        .catch((err) => {
          if (err.response?.status !== 401) console.error(err);
        })
        .finally(() => setIsTasksLoading(false));
      return;
    }

    axios
      .get(`/api/boards/${selectedBoard.id}/tasks`)
      .then((res) => setTasks(res.data.tasks || []))
      .catch((err) => {
        if (err.response?.status === 403 || err.response?.status === 404) {
          if (setSelectedBoard) setSelectedBoard(null);
        }
        if (err.response?.status !== 401) console.error(err);
      })
      .finally(() => setIsTasksLoading(false));
  }, [isAuthenticated, selectedBoard, setSelectedBoard]);

  const handleTaskSubmit = (e, taskData, onSuccess) => {
    if (e) e.preventDefault();
    if (!selectedBoard || selectedBoard.id === 'global') {
      showNotification('Please select a specific project workspace first.', 'error');
      return;
    }

    const newDate = new Date();
    const utcDate = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000);

    const taskPayload = {
      description: taskData.description.trim(),
      status: taskData.status || 'Pending',
      category: taskData.category || 'Development',
      requester: taskData.requester.trim(),
      etc: Number(taskData.etc) || 0,
      impact: taskData.impact || 'Medium',
      deadline: taskData.deadline || null,
      start_date: taskData.start_date || null,
      auto_nudge: taskData.auto_nudge || false,
      nudge_interval_hours: Number(taskData.nudge_interval_hours) || 24,
      board_id: selectedBoard.id,
      date: utcDate.toISOString().split('T')[0],
      subtasks: taskData.subtasks || [],
    };

    setIsLoading(true);
    axios
      .post('/api/tasks', taskPayload)
      .then((res) => {
        setIsLoading(false);
        showNotification(res.data.message, 'success');
        fetchTasks();
        if (onSuccess) onSuccess();
      })
      .catch((err) => {
        setIsLoading(false);
        showNotification(err.response?.data?.detail || 'Failed to create task.', 'error');
      });
  };

  const handleTaskUpdate = (id, updatedFields) => {
    if (!selectedBoard || selectedBoard.id === 'global') return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const payload = { ...task, ...updatedFields };
    setIsLoading(true);

    axios
      .put(`/api/tasks/${id}`, payload)
      .then((res) => {
        setIsLoading(false);
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updatedFields } : t));
        if (selectedTask?.id === id) {
          setSelectedTask(prev => ({ ...prev, ...updatedFields }));
        }
      })
      .catch((err) => {
        setIsLoading(false);
        showNotification(err.response?.data?.detail || 'Failed to update task.', 'error');
      });
  };

  const handleTaskDelete = (id, onSuccess) => {
    setIsLoading(true);
    axios
      .delete(`/api/tasks/${id}`)
      .then(() => {
        setIsLoading(false);
        showNotification('Task deleted successfully', 'success');
        fetchTasks();
        if (selectedTask?.id === id) setSelectedTask(null);
        if (onSuccess) onSuccess();
      })
      .catch((err) => {
        setIsLoading(false);
        showNotification(err.response?.data?.detail || 'Failed to delete task', 'error');
      });
  };

  return {
    tasks, setTasks,
    columns, setColumns,
    categories, setCategories,
    colModal, setColModal,
    viewMode, setViewMode,
    selectedTask, setSelectedTask,
    isEditing, setIsEditing,
    editFormData, setEditFormData,
    filterStatus, setFilterStatus,
    filterCategory, setFilterCategory,
    filterAssignee, setFilterAssignee,
    showMyTasks, setShowMyTasks,
    showOverdueOnly, setShowOverdueOnly,
    showUnreadOnly, setShowUnreadOnly,
    showHasSubtasks, setShowHasSubtasks,
    hideCompleted, setHideCompleted,
    calDate, setCalDate,
    subtasks, setSubtasks,
    clonedTaskIds, setClonedTaskIds,
    isTasksLoading, setIsTasksLoading,
    isSubtasksLoading, setIsSubtasksLoading,
    newSubtaskName, setNewSubtaskName,
    newSubtaskAssignee, setNewSubtaskAssignee,
    formData, setFormData,
    formSubtasks, setFormSubtasks,
    formSubtaskInput, setFormSubtaskInput,
    formSubtaskAssignee, setFormSubtaskAssignee,
    fetchTasks,
    handleTaskSubmit,
    handleTaskUpdate,
    handleTaskDelete,
  };
}
