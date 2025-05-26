<!-- src/components/AiStoryEmpty.vue -->
<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-vue-next';

interface Props {
  isGeneratingStory: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['generate']);

const handleGenerate = () => {
  emit('generate');
};
</script>

<template>
  <!-- 그라데이션 배경 컨테이너 -->
  <div
    class="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-purple-50 p-8 text-center"
  >
    <div class="mb-6">
      <!-- 그라데이션 아이콘 컨테이너 -->
      <div
        class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100"
      >
        <Sparkles class="h-8 w-8 text-purple-600" />
      </div>

      <!-- 상태에 따른 메시지 표시 -->
      <div v-if="isGeneratingStory">
        <p class="text-gray-700">AI가 여행 기록을 분석하고 있어요... 잠시만 기다려주세요</p>
        <p class="mt-1 text-sm text-gray-600">멋진 스토리를 만들어드릴게요</p>
      </div>
      <div v-else>
        <p class="text-gray-700">아직 생성된 여행 스토리가 없습니다.</p>
        <p class="mt-1 text-sm text-gray-600">AI가 당신의 여행을 감동적인 이야기로 만들어드려요</p>
      </div>
    </div>

    <!-- 그라데이션 생성 버튼 -->
    <Button
      @click="handleGenerate"
      :disabled="isGeneratingStory"
      class="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-white shadow-lg transition-all hover:from-purple-700 hover:to-blue-700 hover:shadow-xl disabled:opacity-50"
      size="lg"
    >
      <Sparkles class="h-5 w-5" :class="{ 'animate-spin': isGeneratingStory }" />
      <span v-if="isGeneratingStory" class="font-medium">마법을 부리는 중...</span>
      <span v-else class="font-medium">AI 스토리 생성하기</span>
    </Button>

    <!-- 진행 상황 표시 (생성 중일 때) -->
    <div v-if="isGeneratingStory" class="mt-4 text-sm text-gray-600">
      <div class="flex items-center justify-center gap-2">
        <div class="h-2 w-2 animate-pulse rounded-full bg-purple-400"></div>
        <div
          class="h-2 w-2 animate-pulse rounded-full bg-purple-400"
          style="animation-delay: 0.2s"
        ></div>
        <div
          class="h-2 w-2 animate-pulse rounded-full bg-purple-400"
          style="animation-delay: 0.4s"
        ></div>
      </div>
    </div>
  </div>
</template>
