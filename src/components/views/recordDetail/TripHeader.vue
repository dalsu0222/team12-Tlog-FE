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
  <div>
    <h1 class="mb-2 text-2xl font-bold">{{ title }}</h1>
    <p class="mb-4 text-gray-600">{{ formatDate(startDate) }} ~ {{ formatDate(endDate) }}</p>
    <div class="mb-6 flex gap-2 text-sm text-gray-500">
      <span>참여 {{ participants.length }}명</span>
      <span v-if="participants.length > 0">·</span>
      <span>{{ participants.join(', ') }}</span>
    </div>
  </div>
</template>
