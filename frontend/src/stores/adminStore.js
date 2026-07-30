import { create } from 'zustand';
import { adminApi } from '@/api';

const sectionLoaders = {
  overview: adminApi.getOverview,
  users: adminApi.getUsers,
  teams: adminApi.getTeams,
  projects: adminApi.getProjects,
  aiCredits: adminApi.getAiCredits,
  storage: adminApi.getStorage,
};

const extract = (section, data) => {
  if (section === 'overview') return data || {};
  if (section === 'aiCredits') return data?.users || [];
  if (section === 'storage') return data?.resources || [];
  const keys = {
    users: 'users',
    teams: 'teams',
    projects: 'projects',
  };
  return data?.[keys[section]] || data?.items || (Array.isArray(data) ? data : []);
};

export const useAdminStore = create((set, get) => ({
  data: {
    overview: {},
    users: [],
    teams: [],
    projects: [],
    aiCredits: [],
    storage: [],
  },
  loadingSections: {},
  errors: {},

  fetchSection: async (section, params) => {
    const loader = sectionLoaders[section];
    if (!loader) return;
    set((state) => ({
      loadingSections: { ...state.loadingSections, [section]: true },
      errors: { ...state.errors, [section]: null },
    }));
    try {
      const { data } = await loader(params);
      set((state) => ({
        data: { ...state.data, [section]: extract(section, data) },
        loadingSections: { ...state.loadingSections, [section]: false },
      }));
    } catch (error) {
      set((state) => ({
        loadingSections: { ...state.loadingSections, [section]: false },
        errors: {
          ...state.errors,
          [section]: error.response?.data?.detail || `Failed to load ${section}`,
        },
      }));
    }
  },

  updateUser: async (userId, changes) => {
    if (Object.prototype.hasOwnProperty.call(changes, 'system_role')) {
      await adminApi.updateUserRole(userId, changes.system_role);
    } else if (Object.prototype.hasOwnProperty.call(changes, 'status')) {
      await adminApi.updateUserStatus(userId, changes.status, changes.offboard_date);
    }
    await get().fetchSection('users');
  },

  createTeam: async (data) => {
    const { manager_username, ...teamData } = data;
    const response = await adminApi.createTeam(teamData);
    if (manager_username) {
      await adminApi.assignTeamMember(response.data.team.id, {
        username: manager_username,
        membership_role: 'manager',
      });
    }
    await get().fetchSection('teams');
  },

  updateTeam: async (teamId, data) => {
    const { manager_username, existing_managers = [], ...teamData } = data;
    await adminApi.updateTeam(teamId, teamData);
    await Promise.all(
      existing_managers
        .filter((username) => username !== manager_username)
        .map((username) => adminApi.removeTeamMember(teamId, username))
    );
    if (manager_username) {
      await adminApi.assignTeamMember(teamId, {
        username: manager_username,
        membership_role: 'manager',
      });
    }
    await get().fetchSection('teams');
  },

  deleteTeam: async (teamId) => {
    await adminApi.deleteTeam(teamId);
    await get().fetchSection('teams');
  },

  updateProject: async (projectId, data) => {
    await adminApi.updateProject(projectId, data);
    await get().fetchSection('projects');
  },

  updateCredits: async (userId, data) => {
    await adminApi.updateAiCredits(userId, data);
    await get().fetchSection('aiCredits');
  },
}));
