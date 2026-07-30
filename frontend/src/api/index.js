import api from './client';

export const authApi = {
  login: (username, password) => api.post('/api/login', { username, password }),
  register: (data) => api.post('/api/register', data),
  googleLogin: (token) => api.post('/api/google-login', { token }),
  forgotPassword: (email) => api.post('/api/forgot-password', { email }),
  resetPassword: (token, new_password) => api.post('/api/reset-password', { token, new_password }),
  verifyEmail: (token) => api.post('/api/verify-email', { token }),
};

export const boardApi = {
  list: () => api.get('/api/boards'),
  create: (name, is_private = 0) => api.post('/api/boards', { name, is_private }),
  delete: (id) => api.delete(`/api/boards/${id}`),
  updateSettings: (id, statuses, categories) =>
    api.put(`/api/boards/${id}/settings`, { statuses: JSON.stringify(statuses), categories: JSON.stringify(categories) }),
  getTasks: (id) => api.get(`/api/boards/${id}/tasks`),
  createTask: (boardId, data) => api.post(`/api/boards/${boardId}/tasks`, data),
  getMembers: (id) => api.get(`/api/boards/${id}/members`),
  getTeam: (id) => api.get(`/api/boards/${id}/manage`),
  invite: (id, members_input) => api.post(`/api/boards/${id}/invite`, { members_input }),
  revokeMember: (boardId, memberId) => api.delete(`/api/boards/${boardId}/revoke/${memberId}`),
  transferOwnership: (boardId, new_owner) => api.put(`/api/boards/${boardId}/transfer-member`, { new_owner }),
  requestAccess: (boardId, taskId) =>
    api.post(`/api/boards/${boardId}/request-access`, null, { params: { task_id: taskId } }),
  getChat: (id, offset = 0, limit = 50) => api.get(`/api/boards/${id}/chat`, { params: { offset, limit } }),
  sendChat: (id, text) => api.post(`/api/boards/${id}/chat`, { text }),
};

export const taskApi = {
  getAll: () => api.get('/api/tasks/all'),
  get: (id) => api.get(`/api/tasks/${id}`),
  preview: (id) => api.get(`/api/tasks/preview/${id}`),
  search: (q) => api.get('/api/tasks/search', { params: { q } }),
  updateStatus: (id, status) => api.put(`/api/tasks/${id}`, { status }),
  updateDetails: (id, data) => api.put(`/api/tasks/${id}/details`, data),
  delete: (id) => api.delete(`/api/tasks/${id}`),
  toggleAutoNudge: (id, auto_nudge) => api.put(`/api/tasks/${id}/auto-nudge`, { auto_nudge }),
  getSubtasks: (id) => api.get(`/api/tasks/${id}/subtasks`),
  addSubtask: (id, task_name, assignee) => api.post(`/api/tasks/${id}/subtasks`, { task_name, assignee }),
  updateSubtask: (id, data) => api.put(`/api/subtasks/${id}`, data),
  deleteSubtask: (id) => api.delete(`/api/subtasks/${id}`),
  getComments: (id, offset = 0, limit = 50) => api.get(`/api/tasks/${id}/comments`, { params: { offset, limit } }),
  addComment: (id, text) => api.post(`/api/tasks/${id}/comments`, { text }),
  deleteComment: (taskId, commentId) => api.delete(`/api/tasks/${taskId}/comments/${commentId}`),
  reactComment: (commentId, emoji) => api.post(`/api/comments/${commentId}/react`, { emoji }),
  globalExport: () => api.get('/api/tasks/global-export'),
};

export const userApi = {
  getProfile: () => api.get('/api/profile'),
  updateProfile: (data) => api.put('/api/profile', data),
  getAvatars: () => api.get('/api/users/avatars'),
  getNotifications: () => api.get('/api/notifications'),
  readNotification: (id) => api.put(`/api/notifications/${id}/read`),
  readAllNotifications: () => api.put('/api/notifications/read_all'),
  getMyTickets: () => api.get('/api/my-tickets'),
};

export const inviteApi = {
  list: () => api.get('/api/invitations'),
  accept: (id) => api.put(`/api/invitations/${id}/accept`),
  decline: (id) => api.delete(`/api/invitations/${id}/decline`),
};

export const leaveApi = {
  list: () => api.get('/api/leaves'),
  create: (data) => api.post('/api/leaves', data),
  delete: (id) => api.delete(`/api/leaves/${id}`),
};

export const timesheetApi = {
  getEntries: () => api.get('/api/timesheets/entries'),
  createEntry: (data) => api.post('/api/timesheets/entry', data),
  updateEntry: (id, data) => api.put(`/api/timesheets/entry/${id}`, data),
  deleteEntry: (id) => api.delete(`/api/timesheets/entry/${id}`),
  submit: (entry_ids) => api.post('/api/timesheets/submit', { entry_ids }),
  getApprovals: () => api.get('/api/timesheets/approvals'),
  approve: (entry_ids, status) => api.patch('/api/timesheets/approve', { entry_ids, status }),
};

export const aiApi = {
  generate: (prompt, provider = 'auto') => api.post('/api/ai/generate', { prompt, provider }),
};

export const feedbackApi = {
  submit: (text) => api.post('/api/feedback', { text }),
};

export const adminApi = {
  getOverview: () => api.get('/api/admin/dashboard/stats'),
  getUsers: (params) => api.get('/api/admin/users', { params }),
  updateUserRole: (userId, system_role) =>
    api.put(`/api/admin/users/${userId}/role`, { system_role }),
  updateUserStatus: (userId, status, offboard_date) =>
    api.put('/api/admin/users/status', { username: userId, status, offboard_date }),
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}`),
  getTeams: (params) => api.get('/api/teams', { params }),
  createTeam: (data) => api.post('/api/teams', data),
  updateTeam: (teamId, data) => api.put(`/api/teams/${teamId}`, data),
  deleteTeam: (teamId) => api.delete(`/api/teams/${teamId}`),
  assignTeamMember: (teamId, data) =>
    api.post(`/api/teams/${teamId}/assignments`, data),
  removeTeamMember: (teamId, username) =>
    api.delete(`/api/teams/${teamId}/assignments/${encodeURIComponent(username)}`),
  getProjects: (params) => api.get('/api/admin/projects', { params }),
  updateProject: (projectId, data) => api.put(`/api/admin/projects/${projectId}`, data),
  getAiCredits: (params) => api.get('/api/admin/groq-usage', { params }),
  updateAiCredits: (userId, data) =>
    api.put(`/api/admin/users/${userId}/groq-credit`, data),
  getStorage: (params) => api.get('/api/admin/storage', { params }),
};

export const teamApi = {
  getDirectory: (params) => api.get('/api/teams/directory', { params }),
  getTeams: () => api.get('/api/teams'),
  create: (data) => api.post('/api/teams', data),
  update: (teamId, data) => api.put(`/api/teams/${teamId}`, data),
  addMember: (teamId, data) => api.post(`/api/teams/${teamId}/assignments`, data),
  updateMember: (teamId, username, data) =>
    api.post(`/api/teams/${teamId}/assignments`, { username, ...data }),
  removeMember: (teamId, username) =>
    api.delete(`/api/teams/${teamId}/assignments/${encodeURIComponent(username)}`),
};

export const chatApi = {
  getMyChats: () => api.get('/api/my-chats'),
  getConversations: () => api.get('/api/dm/conversations'),
  getMessages: (username, offset = 0, limit = 50) =>
    api.get(`/api/dm/${username}`, { params: { offset, limit } }),
  sendMessage: (username, text) => api.post(`/api/dm/${username}`, { text }),
  markRead: (username) => api.put(`/api/dm/${username}/read`),
};
