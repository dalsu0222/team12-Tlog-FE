// stores/auth.ts
import { defineStore } from 'pinia';
import type { User } from '@/services/api';
interface AuthState {
  user: User | null;
  accessToken: string | null;
  tempToken: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    tempToken: null, // 회원가입용 id_token (구글)
  }),

  getters: {
    isAuthenticated: state => !!state.accessToken,
    getUser: state => state.user,
    getAccessToken: state => state.accessToken,
    getTempToken: state => state.tempToken,
  },

  actions: {
    setAuth(user: User, accessToken: string) {
      this.user = user;
      this.accessToken = accessToken;
    },

    clearAuth() {
      this.user = null;
      this.accessToken = null;
    },

    updateAccessToken(newAccessToken: string) {
      this.accessToken = newAccessToken;
    },

    setTempToken(token: string) {
      this.tempToken = token;
    },

    clearTempToken() {
      this.tempToken = '';
    },
  },

  // accessToken만 sessionStorage에 자동 저장
  persist: {
    key: 'auth',
    storage: sessionStorage,
    paths: ['accessToken', 'tempToken'],
  },
});
