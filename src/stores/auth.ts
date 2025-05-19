// stores/auth.ts
import type { User } from '@/services/api';
import { defineStore } from 'pinia';

interface AuthState {
  user: User | null;
  accessToken: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')!) : null,
    accessToken: sessionStorage.getItem('accessToken'),
  }),

  getters: {
    isAuthenticated: state => !!state.accessToken,
    getUser: state => state.user,
    getAccessToken: state => state.accessToken,
  },

  actions: {
    setAuth(user: User, accessToken: string) {
      this.user = user;
      this.accessToken = accessToken;
      sessionStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('user', JSON.stringify(user));
    },

    clearAuth() {
      this.user = null;
      this.accessToken = null;
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('user');
    },

    updateAccessToken(newAccessToken: string) {
      this.accessToken = newAccessToken;
      sessionStorage.setItem('accessToken', newAccessToken);
    },
  },
});
