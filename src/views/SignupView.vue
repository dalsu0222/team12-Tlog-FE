<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';

const router = useRouter();
const authStore = useAuthStore();
const nickname = ref('');

const submit = async () => {
  const token = authStore.getTempToken;

  if (!token) {
    alert('소셜 인증 정보가 없습니다.');
    return router.push('/login');
  }

  try {
    const res = await api.post('/api/auth/signup', {
      socialId: token,
      nickname: nickname.value,
    });

    const accessToken = res.headers.authorization?.replace('Bearer ', '');
    const user = res.data.data;

    if (res?.status === 201) {
      authStore.setAuth(user, accessToken);
      authStore.clearTempToken();
      router.push('/');
    }
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'response' in err &&
      typeof err.response === 'object' &&
      err.response !== null &&
      'data' in err.response &&
      typeof err.response.data === 'object' &&
      err.response.data !== null &&
      'message' in err.response.data
    ) {
      alert(err.response.data.message || '회원가입 실패');
    } else {
      alert('회원가입 실패');
    }
  }
};
</script>

<template>
  <div class="mx-auto max-w-screen-xl bg-gray-100 px-4 py-4">
    <h1>회원가입 페이지</h1>
    <div>
      <input v-model="nickname" placeholder="닉네임을 입력하세요" />
      <button @click="submit">회원가입</button>
    </div>
  </div>
</template>
