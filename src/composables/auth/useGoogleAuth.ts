import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/services/api';
import GoogleAuthService from '@/services/auth/googleAuth';
import { AxiosError } from 'axios';

export function useGoogleAuth() {
  const router = useRouter();
  const authStore = useAuthStore();
  const isLoading = ref(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleAuthService = new GoogleAuthService(googleClientId);

  /**
   * 백엔드 로그인 API 호출
   */
  async function loginToBackend(googleUserId: string): Promise<void> {
    const response = await api.post('/api/auth/login', {
      socialId: googleUserId,
    });

    const accessToken = response.headers['authorization']?.replace('Bearer ', '');
    if (!accessToken) {
      throw new Error('No access token received from server');
    }

    const user = response.data.data;
    authStore.setAuth(user, accessToken);
  }

  /**
   * Google 로그인 처리
   */
  async function handleGoogleLogin(): Promise<void> {
    if (isLoading.value) return;
    let userInfo: GoogleUserInfo | undefined;

    try {
      isLoading.value = true;

      // Google 서비스 로드 확인
      if (!googleAuthService.isGoogleLoaded()) {
        await googleAuthService.waitForGoogleLoad();
      }

      // Google 팝업 로그인
      userInfo = await googleAuthService.loginWithPopup();

      // 백엔드 로그인
      await loginToBackend(userInfo.id);

      // 성공 시 홈으로 이동
      router.push('/');
    } catch (error) {
      console.error('Google 로그인 오류:', error);

      if (error instanceof AxiosError && error.response?.status === 401) {
        // 신규 사용자인 경우 회원가입으로 이동
        try {
          if (userInfo) {
            authStore.setTempToken(userInfo.id);
            router.push('/signup');
          }
        } catch (signupError) {
          console.error('회원가입 처리 오류:', signupError);
          alert('회원가입 처리 중 오류가 발생했습니다.');
        }
      } else {
        // 기타 오류 처리
        const errorMessage = getErrorMessage(error);
        alert(errorMessage);
      }
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 에러 메시지 추출
   */
  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('popup_blocked')) {
        return '팝업이 차단되었습니다. 팝업을 허용한 후 다시 시도해주세요.';
      }
      if (error.message.includes('access_denied')) {
        return '로그인이 취소되었습니다.';
      }
      if (error.message.includes('timeout')) {
        return 'Google 서비스 연결에 시간이 오래 걸리고 있습니다. 페이지를 새로고침 후 다시 시도해주세요.';
      }
      return error.message;
    }

    return '로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.';
  }

  return {
    isLoading,
    handleGoogleLogin,
  };
}
