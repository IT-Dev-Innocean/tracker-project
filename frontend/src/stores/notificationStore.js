import { create } from 'zustand';
import { userApi, inviteApi } from '@/api';

export const useNotificationStore = create((set) => ({
  notifications: [],
  invitations: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const { data } = await userApi.getNotifications();
      const notifs = data.notifications || [];
      set({
        notifications: notifs,
        unreadCount: notifs.filter((n) => !n.is_read).length,
      });
    } catch {
      /* ignore */
    }
  },

  fetchInvitations: async () => {
    try {
      const { data } = await inviteApi.list();
      set({ invitations: data.invitations || [] });
    } catch {
      /* ignore */
    }
  },

  markRead: async (id) => {
    await userApi.readNotification(id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await userApi.readAllNotifications();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
  },

  acceptInvitation: async (id) => {
    await inviteApi.accept(id);
    set((state) => ({
      invitations: state.invitations.filter((i) => i.id !== id),
    }));
  },

  declineInvitation: async (id) => {
    await inviteApi.decline(id);
    set((state) => ({
      invitations: state.invitations.filter((i) => i.id !== id),
    }));
  },
}));
