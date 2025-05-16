<script setup lang="ts">
import { onMounted } from 'vue';
import { usePlanMap } from '@/composables/plan/usePlanMap';

const { initMap } = usePlanMap();

onMounted(() => {
  initMap();
});
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100">
    <div id="map" style="width: 100%; height: 500px"></div>
  </div>
</template>
