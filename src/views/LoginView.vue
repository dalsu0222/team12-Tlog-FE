<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import googleIcon from '@/assets/google-icon.svg';
import kakaoIcon from '@/assets/kakao-icon.svg';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const router = useRouter();
const authStore = useAuthStore();

function triggerGoogleLogin() {
  window.google?.accounts?.id?.prompt(); // 수동으로 One Tap 실행
}

async function handleGoogleLogin({ credential }: { credential: string }) {
  const idToken = credential;
  const payload = JSON.parse(atob(idToken.split('.')[1]));
  const googleUserId = payload.sub;

  try {
    const response = await api.post('/api/auth/login', { socialId: googleUserId });

    const accessToken = response.headers['authorization'].replace('Bearer ', '');
    const user = response.data.data;

    authStore.setAuth(user, accessToken);
    router.push('/');
  } catch (err) {
    if (
      err instanceof Error &&
      'response' in err &&
      typeof err.response === 'object' &&
      err.response !== null &&
      'status' in err.response &&
      err.response.status === 401
    ) {
      authStore.setTempToken(googleUserId);
      router.push('/signup');
    } else {
      alert('로그인 실패: 다시 시도해주세요');
    }
  }
}

onMounted(() => {
  window.handleGoogleLogin = handleGoogleLogin;

  window.google?.accounts?.id?.initialize({
    client_id: googleClientId,
    callback: (res: { credential: string }) => {
      if (res.credential) {
        window.handleGoogleLogin(res);
      }
    },
  });
});
</script>

<template>
  <div
    class="mx-auto flex h-full max-w-screen-xl items-center justify-center bg-gray-100 px-4 py-4"
  >
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
          <div id="googleButton"></div>
        </div>
      </div>
    </div>
  </div>
</template>
