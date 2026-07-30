import { create } from 'zustand';
import { teamApi } from '@/api';

const unpack = (data, key) => data?.[key] || data?.items || (Array.isArray(data) ? data : []);

export const useTeamStore = create((set, get) => ({
  teams: [],
  members: [],
  isLoading: false,
  error: null,

  fetchDirectory: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const [teamsResponse, membersResponse] = await Promise.all([
        teamApi.getTeams(),
        teamApi.getDirectory(filters),
      ]);
      set({
        teams: unpack(teamsResponse.data, 'teams'),
        members: unpack(membersResponse.data, 'members'),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to load team directory',
        isLoading: false,
      });
    }
  },

  createTeam: async (data) => {
    await teamApi.create(data);
    await get().fetchDirectory();
  },

  addMember: async (teamId, data) => {
    await teamApi.addMember(teamId, data);
    await get().fetchDirectory();
  },

  updateMember: async (teamId, memberId, data) => {
    await teamApi.updateMember(teamId, memberId, data);
    await get().fetchDirectory();
  },

  removeMember: async (teamId, memberId) => {
    await teamApi.removeMember(teamId, memberId);
    await get().fetchDirectory();
  },
}));
