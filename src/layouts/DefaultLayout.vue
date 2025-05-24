<!-- <script setup lang="ts">
import { Header } from '@/components/common';

// 레이아웃 관련 로직
</script>

<template>
  <div class="flex h-screen flex-col">
    <Header />

    <main class="mt-16 flex-1 overflow-y-auto bg-gray-50">
      <router-view></router-view>
    </main>
  </div>
</template> -->

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Header } from '@/components/common';

const route = useRoute();

// 홈페이지인지 확인
const isHomePage = computed(() => route.path === '/');
</script>

<template>
  <div class="flex h-screen flex-col">
    <Header />

    <!-- 홈페이지가 아닌 경우 기존 레이아웃 -->
    <main v-if="!isHomePage" class="mt-16 flex-1 overflow-y-auto bg-gray-50">
      <router-view />
    </main>

    <!-- 홈페이지인 경우 전체 화면 사용 -->
    <div v-else class="fixed inset-0 top-16 overflow-y-auto">
      <router-view />
    </div>
  </div>
</template>
