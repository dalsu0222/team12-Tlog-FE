<!-- components/views/recordList/TripStorySection.vue -->
<script setup lang="ts">
import { type PropType } from 'vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

// 여행 후기 타입 정의
interface TripStory {
  id: number;
  title: string;
  content: string; // 여행 기간으로 사용
  createdAt: string;
  isStep1Completed: boolean;
  isStep2Completed: boolean;
  participants?: number[]; // 참여자 ID 목록 (옵션)
}

defineProps({
  stories: {
    type: Array as PropType<TripStory[]>,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['navigate']);

// 페이지 이동 핸들러
const handleNavigate = (tripId: number, isCompleted: boolean) => {
  emit('navigate', { tripId, isCompleted });
};
</script>

<template>
  <div>
    <!-- 제목이 있는 경우에만 표시 -->
    <h2 v-if="title" class="mb-4 text-xl font-semibold text-gray-800">{{ title }}</h2>

    <!-- Carousel 컴포넌트 사용 -->
    <Carousel
      class="relative w-full"
      :opts="{
        align: 'start',
        loop: false,
      }"
    >
      <CarouselContent>
        <CarouselItem
          v-for="story in stories"
          :key="story.id"
          class="p-2 md:basis-1/2 lg:basis-1/3"
        >
          <Card class="h-full bg-white shadow-md transition-all hover:shadow-lg">
            <CardContent class="flex h-full flex-col p-6">
              <div class="mb-4 flex justify-between">
                <h3 class="truncate text-lg font-semibold">{{ story.title }}</h3>
                <span class="ml-2 text-sm whitespace-nowrap text-gray-500">
                  {{ story.createdAt }}
                </span>
              </div>

              <!-- 여행 기간 표시 -->
              <p class="mb-4 flex items-center text-gray-600">
                <span class="mr-2 flex-shrink-0">🗓️</span>
                <span class="truncate">{{ story.content }}</span>
              </p>

              <!-- 참여자 정보 표시 -->
              <div v-if="story.participants && story.participants.length > 0" class="mb-4">
                <p class="mb-1 text-sm text-gray-700">함께하는 친구들:</p>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="participant in story.participants.slice(0, 5)"
                    :key="participant"
                    class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                  >
                    {{ participant }}
                  </span>
                  <!-- 많은 경우 축약 -->
                  <span
                    v-if="story.participants.length > 5"
                    class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                  >
                    외 {{ story.participants.length - 5 }}명
                  </span>
                </div>
              </div>

              <!-- 스페이서로 버튼을 아래로 밀기 -->
              <div class="flex-grow"></div>

              <div class="mt-auto flex items-center justify-between">
                <div class="flex space-x-2">
                  <span
                    :class="[
                      'rounded px-2 py-1 text-xs font-medium',
                      story.isStep1Completed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600',
                    ]"
                  >
                    step1 {{ story.isStep1Completed ? '완료' : '미완료' }}
                  </span>
                  <span
                    :class="[
                      'rounded px-2 py-1 text-xs font-medium',
                      story.isStep2Completed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600',
                    ]"
                  >
                    step2 {{ story.isStep2Completed ? '완료' : '미완료' }}
                  </span>
                </div>

                <Button
                  size="sm"
                  @click="handleNavigate(story.id, story.isStep2Completed)"
                  :variant="story.isStep2Completed ? 'outline' : 'default'"
                >
                  {{ story.isStep2Completed ? '후기 보기' : '후기 작성' }}
                </Button>
              </div>
            </CardContent>
          </Card>
        </CarouselItem>
      </CarouselContent>

      <!-- 이전/다음 버튼 -->
      <CarouselPrevious class="left-1" />
      <CarouselNext class="right-1" />
    </Carousel>
  </div>
</template>
