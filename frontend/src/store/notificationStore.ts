import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'recruit-application' | 'recruit-approval' | 'recruit-rejection';
  recruitId: string;
  recruitTitle: string;
  applicantId?: string;
  applicantUsername?: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `${notification.recruitId}-${notification.applicantId}-${Date.now()}`,
      read: false,
      createdAt: new Date(notification.createdAt),
    };

    set((state) => {
      
      const isDuplicate = state.notifications.some(
        (n) =>
          n.type === notification.type &&
          n.recruitId === notification.recruitId &&
          (notification.applicantId 
            ? n.applicantId === notification.applicantId 
            : true) &&
          !n.read
      );

      if (isDuplicate) {
        return state;
      }

      return {
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id) => {
    set((state) => {
      const removed = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: removed && !removed.read
          ? state.unreadCount - 1
          : state.unreadCount,
      };
    });
  },

  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },
}));

