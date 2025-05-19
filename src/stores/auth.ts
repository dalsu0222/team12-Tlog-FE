// stores/auth.ts
import type { User } from '@/services/api';
import { defineStore } from 'pinia';

interface AuthState {
  user: User | null;
  accessToken: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: (() => {
      try {
        const userStr = sessionStorage.getItem('user');
        if (!userStr) return null;
        const user = JSON.parse(userStr);
        // 간단한 타입 검증 추가
        if (
          user &&
          typeof user === 'object' &&
          'userId' in user &&
          'nickname' in user &&
          'role' in user
        ) {
          return user as User;
        }
        return null;
      } catch (e) {
        console.error('사용자 데이터 파싱 오류:', e);
        sessionStorage.removeItem('user'); // 손상된 데이터 제거
        return null;
      }
    })(),
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
