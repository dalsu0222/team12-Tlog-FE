<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.svg';
import router from '@/router';

const isLoggedIn = ref(false); // 전역으로 관리

const handleLogin = () => {
  if (!isLoggedIn.value) {
    router.push('/login');
    isLoggedIn.value = true;
  }
};

const handleLogout = () => {
  isLoggedIn.value = false;
  router.push('/login');
};
</script>

<template>
  <header class="fixed z-[12] h-16 w-full bg-white">
    <nav class="relative container mx-auto flex h-full items-center justify-between">
      <div class="flex items-center">
        <router-link to="/">
          <img :src="logo" alt="logo" class="h-12 w-12" />
        </router-link>
      </div>
      <ul class="flex min-h-full items-center gap-8 text-sm">
        <li class="hover:text-bold cursor-pointer">
          <router-link to="/" class="px-4 py-5">홈</router-link>
        </li>
        <li class="hover:text-bold cursor-pointer">
          <router-link to="/plans" class="px-4 py-5">계획 리스트</router-link>
        </li>
        <li class="hover:text-bold cursor-pointer">
          <router-link to="/records" class="px-4 py-5">AI 후기 리스트</router-link>
        </li>
      </ul>
      <div class="flex items-center">
        <Button
          v-if="!isLoggedIn"
          class="bg-secondary hover:bg-bold text-white"
          @click="handleLogin"
        >
          로그인
        </Button>
        <Button v-else class="bg-secondary hover:bg-bold text-white" @click="handleLogout">
          로그아웃
        </Button>
      </div>
    </nav>
  </header>
</template>
