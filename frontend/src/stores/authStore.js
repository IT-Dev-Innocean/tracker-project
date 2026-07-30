import { create } from 'zustand';
import { authApi, userApi } from '@/api';

function getApiErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail;
  const message = error.response?.data?.message;

  if (typeof detail === 'string') return detail;
  if (typeof message === 'string') return message;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item.msg === 'string') {
          const field = Array.isArray(item.loc) ? item.loc.at(-1) : null;
          return field && field !== 'body' ? `${field}: ${item.msg}` : item.msg;
        }
        return null;
      })
      .filter(Boolean)
      .join(', ') || fallback;
  }

  return fallback;
}

export const useAuthStore = create((set, get) => ({
  isAuthenticated: localStorage.getItem('innocean_auth') === 'true',
  username: localStorage.getItem('innocean_username') || '',
  profile: null,
  isProfileLoading: localStorage.getItem('innocean_auth') === 'true',
  isProfileInitialized: false,
  isLoading: false,
  error: null,

  init: async () => {
    if (!get().isAuthenticated) {
      set({ isProfileLoading: false, isProfileInitialized: true });
      return;
    }
    set({ isProfileLoading: true });
    try {
      const { data } = await userApi.getProfile();
      set({
        profile: data,
        username: data.username,
        isProfileLoading: false,
        isProfileInitialized: true,
      });
    } catch {
      get().logout();
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.login(username, password);
      localStorage.setItem('innocean_auth', 'true');
      localStorage.setItem('innocean_token', data.token);
      localStorage.setItem('innocean_username', username);
      set({ isAuthenticated: true, username, isLoading: false });
      await get().init();
      return true;
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Login failed');
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  googleLogin: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.googleLogin(token);
      localStorage.setItem('innocean_auth', 'true');
      localStorage.setItem('innocean_token', data.token);
      localStorage.setItem('innocean_username', data.username);
      set({ isAuthenticated: true, username: data.username, isLoading: false });
      await get().init();
      return true;
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Google login failed');
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  register: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.register(formData);
      set({ isLoading: false });
      return true;
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Registration failed');
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('innocean_auth');
    localStorage.removeItem('innocean_token');
    localStorage.removeItem('innocean_username');
    set({
      isAuthenticated: false,
      username: '',
      profile: null,
      isProfileLoading: false,
      isProfileInitialized: true,
    });
  },

  clearError: () => set({ error: null }),
}));
