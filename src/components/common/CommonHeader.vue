<script setup lang="ts">
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.svg';
import myIcon from '@/assets/my.svg';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const handleLogin = () => {
  router.push('/login');
};

const handleLogout = () => {
  authStore.clearAuth();
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
        <div v-if="authStore.isAuthenticated">
          <div class="flex items-center gap-4">
            <router-link to="/my">
              <img :src="myIcon" alt="my page" class="h-6 w-6" />
            </router-link>
            <Button class="bg-secondary hover:bg-bold text-white" @click="handleLogout">
              로그아웃
            </Button>
          </div>
        </div>
        <div v-else>
          <Button class="bg-secondary hover:bg-bold text-white" @click="handleLogin">로그인</Button>
        </div>
      </div>
    </nav>
  </header>
</template>
