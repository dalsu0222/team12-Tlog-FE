<!-- src/components/views/recordList/CompletedStoriesSection.vue -->
<script setup lang="ts">
import TripHeader from '@/components/views/recordList/TripHeader.vue';
import TripStorySection from '@/components/views/recordList/TripStorySection.vue';
import { ChevronUp } from 'lucide-vue-next';
import type { TripStory } from '@/services/api/tripService';

defineProps<{
  stories: TripStory[];
}>();

const emit = defineEmits<{
  'navigate': [{ tripId: number; isCompleted: boolean }];
  'scroll-to-incomplete': [];
}>();

const handleNavigate = (data: { tripId: number; isCompleted: boolean }) => {
  emit('navigate', data);
};

const scrollToIncomplete = () => {
  emit('scroll-to-incomplete');
};
</script>

<template>
  <div id="completed-stories-section" class="h-[calc(100vh-4rem)]">
    <div class="flex min-h-full flex-col justify-center bg-gray-50 py-8 sm:py-12 lg:py-16">
      <div class="mx-auto max-w-screen-xl px-4">
        <!-- Trip Header -->
        <TripHeader
          title="작성이 완료된 여행 후기"
          description="AI가 생성해준 블로그 초안을 만나보세요"
        />

        <!-- 컨텐츠 -->
        <div class="flex flex-1 items-center justify-center">
          <!-- 데이터가 없는 경우 -->
          <div
            v-if="stories.length === 0"
            class="rounded-lg border border-dashed border-gray-300 bg-white/80 p-8 text-center backdrop-blur-sm"
          >
            <div class="space-y-4">
              <div class="text-6xl">✨</div>
              <div>
                <h3 class="text-lg font-semibold text-gray-800">
                  작성이 완료된 여행 후기가 없습니다
                </h3>
                <p class="mt-2 text-gray-600">먼저 여행 기록을 작성하고 AI 후기를 생성해보세요</p>
              </div>
            </div>
          </div>

          <!-- 데이터가 있는 경우 -->
          <div v-else class="w-full">
            <TripStorySection :stories="stories" @navigate="handleNavigate" />
          </div>
        </div>
      </div>
    </div>

    <!-- 위로 스크롤 버튼 -->
    <div class="absolute inset-x-0 bottom-1 flex justify-center sm:bottom-2 lg:bottom-3">
      <button
        @click="scrollToIncomplete"
        class="group flex flex-col items-center gap-1 rounded-full px-4 py-3 text-gray-600 transition-all duration-300 hover:text-blue-600 sm:gap-2 sm:px-6 sm:py-4"
      >
        <span class="text-xs font-medium sm:text-sm">작성이 필요한 후기 보기</span>
        <div
          class="rounded-full bg-white/80 p-1.5 shadow-sm transition-colors duration-300 group-hover:bg-blue-50 sm:p-2"
        >
          <ChevronUp class="h-4 w-4 animate-bounce sm:h-5 sm:w-5" />
        </div>
      </button>
    </div>
  </div>
</template>
