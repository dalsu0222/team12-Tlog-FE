// src/service/api/interceptors.ts
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth';
import type { ApiFailure } from './types';
import router from '@/router';

export const setupInterceptors = (api: AxiosInstance): void => {
  /**
   * 요청 인터셉터: accessToken 자동 삽입
   */
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const authStore = useAuthStore();
      const token = authStore.getAccessToken;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  /**
   * 응답 인터셉터: 에러 처리 및 인증 상태 초기화
   */
  api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      const authStore = useAuthStore();

      if (error.response?.status === 401) {
        // access token이 만료되었거나 유효하지 않음
        authStore.clearAuth();
        // Vue Router를 사용하여 로그인 페이지로 리다이렉트
        router.push('/login');
      }

      // 서버에서 내려준 에러 메시지 출력 (fallback 대응 가능)
      const message =
        (error.response?.data as ApiFailure)?.message ||
        error.message ||
        '예기치 못한 오류가 발생했습니다.';

      console.error('API 요청 오류:', message);

      return Promise.reject(error);
    }
  );
};

export default setupInterceptors;
