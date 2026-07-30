import { create } from 'zustand';
import { boardApi, taskApi } from '@/api';
import { parseJsonArray, DEFAULT_COLUMNS, DEFAULT_CATEGORIES } from '@/lib/utils';

export const useBoardStore = create((set, get) => ({
  boards: [],
  selectedBoard: null,
  tasks: [],
  columns: DEFAULT_COLUMNS,
  categories: DEFAULT_CATEGORIES,
  isLoading: false,
  isTasksLoading: false,
  avatarsMap: {},

  fetchBoards: async () => {
    set({ isLoading: true });
    try {
      const { data } = await boardApi.list();
      set({ boards: data.boards || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  selectBoard: async (board) => {
    if (!board) {
      set({ selectedBoard: null, tasks: [] });
      return;
    }
    if (board.id === 'global') {
      set({
        selectedBoard: board,
        columns: DEFAULT_COLUMNS,
        categories: DEFAULT_CATEGORIES,
      });
      await get().fetchGlobalTasks();
      return;
    }
    const columns = parseJsonArray(board.statuses, DEFAULT_COLUMNS);
    const categories = parseJsonArray(board.categories, DEFAULT_CATEGORIES);
    set({ selectedBoard: board, columns, categories });
    await get().fetchTasks(board.id);
  },

  fetchTasks: async (boardId) => {
    set({ isTasksLoading: true });
    try {
      const { data } = await boardApi.getTasks(boardId);
      set({ tasks: data.tasks || [], isTasksLoading: false });
    } catch {
      set({ isTasksLoading: false });
    }
  },

  fetchGlobalTasks: async () => {
    set({ isTasksLoading: true });
    try {
      const { data } = await taskApi.getAll();
      set({ tasks: data.tasks || [], isTasksLoading: false });
    } catch {
      set({ isTasksLoading: false });
    }
  },

  createBoard: async (name, isPrivate = 0) => {
    const { data } = await boardApi.create(name, isPrivate);
    await get().fetchBoards();
    return data;
  },

  deleteBoard: async (id) => {
    await boardApi.delete(id);
    const { selectedBoard } = get();
    if (selectedBoard?.id === id) {
      set({ selectedBoard: null, tasks: [] });
    }
    await get().fetchBoards();
  },

  updateBoardSettings: async (boardId, statuses, categories) => {
    await boardApi.updateSettings(boardId, statuses, categories);
    set({ columns: statuses, categories });
    await get().fetchBoards();
  },

  refreshTasks: async () => {
    const { selectedBoard } = get();
    if (!selectedBoard) return;
    if (selectedBoard.id === 'global') {
      await get().fetchGlobalTasks();
    } else {
      await get().fetchTasks(selectedBoard.id);
    }
  },

  updateTaskInList: (taskId, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    }));
  },

  removeTaskFromList: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    }));
  },

  addTaskToList: (task) => {
    set((state) => ({ tasks: [task, ...state.tasks] }));
  },
}));
