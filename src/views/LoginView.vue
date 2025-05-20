<script setup lang="ts">
// const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  window.handleGoogleLogin = async (response: { credential: string }) => {
    const idToken = response.credential;
    // ID 토큰 디코딩
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    const googleUserId = payload.sub;

    try {
      const res = await api.post('/api/auth/login', { socialId: googleUserId });
      const accessToken = res.headers['authorization']?.replace('Bearer ', '');
      const user = res.data.data;

      if (res?.status === 200) {
        authStore.setAuth(user, accessToken);
        router.push('/');
      }
    } catch (err: unknown) {
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
  };

  // GSI 버튼 수동 렌더링
  if (window.google?.accounts?.id) {
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: window.handleGoogleLogin,
    });

    window.google.accounts.id.renderButton(document.getElementById('googleButton'), {
      theme: 'outline',
      size: 'large',
    });
  }
});
</script>

<template>
  <div class="mx-auto max-w-screen-xl bg-gray-100 px-4 py-4">
    <h1>로그인 페이지</h1>
    <div class="flex flex-col items-center justify-center">
      <div id="googleButton"></div>
    </div>
  </div>
</template>
