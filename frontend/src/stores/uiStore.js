import { create } from 'zustand';

export const useUIStore = create((set) => ({
  viewMode: localStorage.getItem('innocean_view_mode') || 'board',
  searchQuery: '',
  filterStatus: '',
  filterCategory: '',
  showMyTasks: false,
  showOverdueOnly: false,
  sidebarCollapsed: localStorage.getItem('innocean_sidebar_collapsed') === 'true',
  isCreateBoardOpen: false,
  isCreateTaskOpen: false,
  selectedTaskId: null,
  isTeamModalOpen: false,
  isInvitesModalOpen: false,
  isSettingsOpen: false,
  isLeaveModalOpen: false,
  isExportModalOpen: false,
  toast: null,

  setViewMode: (mode) => {
    localStorage.setItem('innocean_view_mode', mode);
    set({ viewMode: mode });
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterStatus: (s) => set({ filterStatus: s }),
  setFilterCategory: (c) => set({ filterCategory: c }),
  setShowMyTasks: (v) => set({ showMyTasks: v }),
  setShowOverdueOnly: (v) => set({ showOverdueOnly: v }),

  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      localStorage.setItem('innocean_sidebar_collapsed', String(next));
      return { sidebarCollapsed: next };
    }),

  openCreateBoard: () => set({ isCreateBoardOpen: true }),
  closeCreateBoard: () => set({ isCreateBoardOpen: false }),
  openCreateTask: () => set({ isCreateTaskOpen: true }),
  closeCreateTask: () => set({ isCreateTaskOpen: false }),
  openTask: (taskId) => set({ selectedTaskId: taskId }),
  closeTask: () => set({ selectedTaskId: null }),
  openTeamModal: () => set({ isTeamModalOpen: true }),
  closeTeamModal: () => set({ isTeamModalOpen: false }),
  openInvitesModal: () => set({ isInvitesModalOpen: true }),
  closeInvitesModal: () => set({ isInvitesModalOpen: false }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  openLeaveModal: () => set({ isLeaveModalOpen: true }),
  closeLeaveModal: () => set({ isLeaveModalOpen: false }),
  openExportModal: () => set({ isExportModalOpen: true }),
  closeExportModal: () => set({ isExportModalOpen: false }),

  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3000);
  },
}));
