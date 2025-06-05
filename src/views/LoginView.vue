<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import googleIcon from '@/assets/google-icon.svg';
import kakaoIcon from '@/assets/kakao-icon.svg';
import { AxiosError } from 'axios';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: Record<string, unknown>;
        oauth2?: {
          initTokenClient: (config: Record<string, unknown>) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const router = useRouter();
const authStore = useAuthStore();

// Google OAuth2 팝업 로그인
function triggerGoogleLogin() {
  if (!window.google?.accounts?.oauth2) {
    alert('Google 로그인 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
    return;
  }

  const tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: googleClientId,
    scope: 'openid email profile',
    callback: async (response: { error?: string; access_token?: string }) => {
      if (response.error) {
        console.error('Google 로그인 오류:', response.error);
        alert('로그인이 취소되었거나 오류가 발생했습니다.');
        return;
      }

      if (response.access_token) {
        try {
          // Google API를 사용해 사용자 정보 가져오기
          const userInfoResponse = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`
          );

          if (!userInfoResponse.ok) {
            throw new Error('사용자 정보를 가져올 수 없습니다.');
          }

          const userInfo = await userInfoResponse.json();

          // 백엔드에 Google ID로 로그인 요청하기
          await handleGoogleLogin(userInfo.id);
        } catch (error) {
          console.error('Google 사용자 정보 가져오기 실패:', error);
          alert('로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      }
    },
  });

  // 팝업 열기
  tokenClient.requestAccessToken();
}

async function handleGoogleLogin(googleUserId: string) {
  try {
    const response = await api.post('/api/auth/login', { socialId: googleUserId });

    const accessToken = response.headers['authorization'].replace('Bearer ', '');
    const user = response.data.data;

    authStore.setAuth(user, accessToken);
    router.push('/');
  } catch (err) {
    if (err instanceof AxiosError && err.response?.status === 401) {
      authStore.setTempToken(googleUserId);
      router.push('/signup');
    } else {
      console.error('로그인 API 오류:', err);
      alert('로그인 실패: 서버 연결을 확인해주세요.');
    }
  }
}
</script>

<template>
  <div class="mx-auto flex h-full max-w-screen-xl items-center justify-center bg-gray-50 px-4 py-4">
    <div
      class="shadow-primary mx-auto flex w-full max-w-md items-center justify-center rounded-lg bg-white p-4 shadow-sm"
    >
      <div class="flex w-full flex-col items-center justify-center gap-8 p-4">
        <div class="mt-4 flex items-center justify-center">
          <img :src="logo" alt="logo" class="h-10 w-18" />
        </div>
        <div class="flex w-full flex-col items-center justify-center gap-4">
          <Button
            variant="secondary"
            class="flex w-3/4 items-center justify-center gap-2 py-6 text-gray-50"
            @click="triggerGoogleLogin"
          >
            <img :src="googleIcon" alt="Google" class="h-6 w-6" />
            구글로 로그인
          </Button>
          <Button
            variant="secondary"
            class="flex w-3/4 items-center justify-center gap-2 py-6 text-gray-50"
          >
            <img :src="kakaoIcon" alt="Kakao" class="h-6 w-6" />
            카카오로 로그인
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
