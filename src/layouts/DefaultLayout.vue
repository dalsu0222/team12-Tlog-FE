<script setup lang="ts">
import { Header } from '@/components/common';

// 레이아웃 관련 로직
</script>

<template>
  <div class="flex h-screen flex-col">
    <Header />

    <main class="mt-16 flex-1 overflow-y-auto bg-gray-100">
      <router-view></router-view>
    </main>
  </div>
</template>
