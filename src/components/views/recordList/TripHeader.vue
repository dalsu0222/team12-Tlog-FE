<!-- src/components/views/recordList/TripHeader.vue -->
<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
}>();
</script>

<template>
  <div class="mb-6 text-center sm:mb-8 lg:mb-10">
    <h2 class="mb-2 text-xl font-bold text-gray-800 sm:mb-3 sm:text-2xl lg:text-3xl">
      {{ title }}
    </h2>
    <p class="text-sm text-gray-600 sm:text-base lg:text-lg">
      {{ description }}
    </p>
  </div>
</template>
