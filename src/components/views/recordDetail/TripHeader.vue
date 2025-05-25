<!-- src/components/TripHeader.vue -->
<script setup lang="ts">
defineProps<{
  title: string;
  startDate: string;
  endDate: string;
  participants: string[];
}>();

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date
    .toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\. /g, '.')
    .replace(/\.$/, '');
};
</script>

<template>
  <div class="mb-6 text-center sm:mb-8 lg:mb-10">
    <h2 class="mb-2 text-xl font-bold text-gray-800 sm:mb-3 sm:text-2xl lg:text-3xl">
      {{ title }}
    </h2>
    <p class="mb-4 text-sm text-gray-600 sm:text-base lg:text-lg">
      {{ formatDate(startDate) }} ~ {{ formatDate(endDate) }}
    </p>
    <div class="flex justify-center gap-2 text-xs text-gray-500 sm:text-sm">
      <span>참여 {{ participants.length }}명</span>
      <span v-if="participants.length > 0">·</span>
      <span>{{ participants.join(', ') }}</span>
    </div>
  </div>
</template>
