<script setup lang="ts">
const props = defineProps<{ id: string }>();
console.log(props.id);
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50">계획 디테일 페이지</div>
</template>
