<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';
import { AxiosError } from 'axios';
import { useNicknameCheck } from '@/composables/user';
import { Button } from '@/components/ui/button';

const router = useRouter();
const authStore = useAuthStore();
const nickname = ref('');

const { checkNickname, message, isAvailable, loading, resetStatus } = useNicknameCheck();

const submit = async () => {
  const token = authStore.getTempToken;

  if (!token) {
    alert('소셜 인증 정보가 없습니다.');
    return router.push('/login');
  }

  if (!nickname.value.trim()) {
    alert('닉네임을 입력해주세요.');
    return;
  }

  if (isAvailable.value !== true) {
    alert('닉네임 중복 확인을 완료해주세요.');
    return;
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
  } catch (err) {
    if (err instanceof AxiosError) {
      alert(err.response?.data?.message || '회원가입 실패');
    } else {
      alert('회원가입 실패');
    }
  }
};
</script>

<template>
  <div
    class="mx-auto flex h-full max-w-screen-xl items-center justify-center bg-gray-100 px-4 py-4"
  >
    <div
      class="shadow-primary mx-auto flex w-full max-w-md items-center justify-center rounded-lg bg-white p-4 shadow-sm"
    >
      <div class="flex w-full flex-col items-center justify-center gap-8 p-4">
        <h1 class="text-xl font-bold">회원가입</h1>
        <div class="h-full w-3/4 space-y-2">
          <div class="flex items-center space-x-2">
            <input
              v-model="nickname"
              type="text"
              class="focus:border-bold w-full rounded-md border px-3 py-3 text-sm shadow-sm focus:outline-none"
              placeholder="닉네임을 입력하세요"
              @input="resetStatus"
            />
            <Button
              :disabled="loading"
              variant="secondary"
              class="hover:bg-bold h-full rounded-md px-3 py-3 text-sm font-semibold text-white disabled:opacity-50"
              @click="checkNickname(nickname)"
            >
              중복 확인
            </Button>
          </div>
          <p
            v-if="message"
            :class="
              isAvailable === false
                ? 'text-red-500'
                : isAvailable === true
                  ? 'text-green-600'
                  : 'text-gray-500'
            "
            class="text-sm"
          >
            {{ message }}
          </p>
        </div>
        <Button
          variant="default"
          class="bg-bold flex w-3/4 items-center justify-center gap-2 py-6 text-gray-50"
          @click="submit"
        >
          가입하기
        </Button>
      </div>
    </div>
  </div>
</template>
