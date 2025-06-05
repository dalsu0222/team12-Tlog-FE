<script setup lang="ts">
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import googleIcon from '@/assets/google-icon.svg';
import kakaoIcon from '@/assets/kakao-icon.svg';
import { useGoogleAuth } from '@/composables/auth';

const { isLoading, handleGoogleLogin } = useGoogleAuth();
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
            :disabled="isLoading"
            @click="handleGoogleLogin"
          >
            <img :src="googleIcon" alt="Google" class="h-6 w-6" />
            {{ isLoading ? '로그인 중...' : '구글로 로그인' }}
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
