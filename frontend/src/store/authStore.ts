import { create } from 'zustand';
import { authService, User } from '../services/auth.service';
import { socketService } from '../services/socket.service';
import { useNotificationStore } from './notificationStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: authService.getStoredUser(),
  isAuthenticated: !!authService.getToken(),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await authService.login({ email, password });
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      
      const token = authService.getToken();
      if (token) {
        socketService.connect(token, () => {
          setupNotificationListener();
        });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      await authService.register({ username, email, password });
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    socketService.disconnect();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: () => {
    const user = authService.getStoredUser();
    const token = authService.getToken();
    set({ user, isAuthenticated: !!token });
    
    if (token) {
      socketService.connect(token, () => {
        setupNotificationListener();
      });
    }
  },
}));

let applicationListener: ((notification: any) => void) | null = null;
let approvalListener: ((notification: any) => void) | null = null;

function setupNotificationListener() {
  console.log('🔔 Setting up notification listeners...');
  console.log('Socket connected:', socketService.isConnected());
  
  if (applicationListener) {
    socketService.offRecruitApplication(applicationListener);
  }
  if (approvalListener) {
    socketService.offRecruitApproval(approvalListener);
  }

  applicationListener = (notification: any) => {
    console.log('📨 [Frontend] Received recruit application notification:', notification);
    try {
      useNotificationStore.getState().addNotification(notification);
      console.log('✅ Notification added to store');
    } catch (error) {
      console.error('❌ Error adding notification:', error);
    }
  };

  approvalListener = (notification: any) => {
    console.log('📨 [Frontend] Received recruit approval notification:', notification);
    try {
      useNotificationStore.getState().addNotification(notification);
      console.log('✅ Notification added to store');
    } catch (error) {
      console.error('❌ Error adding notification:', error);
    }
  };

  socketService.onRecruitApplication(applicationListener);
  socketService.onRecruitApproval(approvalListener);
  console.log('✅ Notification listeners registered');
}

