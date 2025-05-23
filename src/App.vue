<script setup lang="ts">
// 필요한 컴포넌트들을 여기에 import
import { Toaster } from '@/components/ui/sonner';
import 'vue-sonner/style.css';
</script>

<template>
  <router-view />
  <Toaster />
</template>
