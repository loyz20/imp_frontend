import { create } from 'zustand';

const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,

  /**
   * Toggle notification panel
   */
  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),

  /**
   * Add a new notification
   */
  addNotification: ({ id, title, message, type = 'info', read = false }) => {
    const notification = {
      id: id || Date.now().toString(),
      title,
      message,
      type,
      read,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      notifications: [notification, ...s.notifications],
      unreadCount: s.unreadCount + (read ? 0 : 1),
    }));
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: (id) => {
    set((s) => {
      const updated = s.notifications.map((n) =>
        n.id === id && !n.read ? { ...n, read: true } : n
      );
      const wasUnread = s.notifications.find((n) => n.id === id && !n.read);
      return {
        notifications: updated,
        unreadCount: wasUnread ? s.unreadCount - 1 : s.unreadCount,
      };
    });
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  /**
   * Remove a notification
   */
  removeNotification: (id) => {
    set((s) => {
      const target = s.notifications.find((n) => n.id === id);
      return {
        notifications: s.notifications.filter((n) => n.id !== id),
        unreadCount: target && !target.read ? s.unreadCount - 1 : s.unreadCount,
      };
    });
  },

  /**
   * Clear all notifications
   */
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));

export default useNotificationStore;
