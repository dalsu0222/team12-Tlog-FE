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
  tripId?: number;
  title: string;
  content: string; // 여행 기간으로 사용
  createdAt: string;
  isStep1Completed: boolean;
  isStep2Completed: boolean;
  participants?: number[]; // 참여자 ID 목록 (옵션)
}

// 버튼 설정 타입 정의
interface ButtonConfig {
  completedText: string; // 완료된 경우 버튼 텍스트
  incompleteText: string; // 미완료인 경우 버튼 텍스트
  useStep2Status?: boolean; // Step2 상태를 기준으로 할지 여부 (기본값: true)
  sameButton?: boolean;
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
  buttonConfig: {
    type: Object as PropType<ButtonConfig>,
    default: () => ({
      completedText: '후기 보기',
      incompleteText: '후기 작성',
      useStep2Status: true,
      sameButton: false,
    }),
  },
});

const emit = defineEmits(['navigate']);

// 페이지 이동 핸들러
const handleNavigate = (tripId: number, isCompleted: boolean) => {
  emit('navigate', { tripId, isCompleted });
};

// 완료 상태 확인 함수
const getCompletionStatus = (story: TripStory, buttonConfig: ButtonConfig) => {
  return buttonConfig.useStep2Status ? story.isStep2Completed : story.isStep1Completed;
};
</script>

<template>
  <div>
    <!-- 제목이 있는 경우에만 표시 -->
    <h2 v-if="title" class="mb-4 text-xl font-semibold text-gray-800">{{ title }}</h2>

    <!-- Carousel 컴포넌트 사용 - 패딩 추가로 그림자 잘림 방지 -->
    <div class="px-2 py-4 sm:px-4 lg:px-8">
      <Carousel
        class="relative w-full"
        :opts="{
          align: 'start',
          loop: false,
          containScroll: 'trimSnaps',
          skipSnaps: true,
        }"
      >
        <CarouselContent class="-ml-4">
          <CarouselItem
            v-for="story in stories"
            :key="story.id"
            class="pl-4"
            style="flex: 0 0 400px"
          >
            <!-- 카드 주변에 여백 추가로 그림자가 잘리지 않도록 설정 -->
            <div class="p-1">
              <Card class="h-full w-full bg-white shadow-md transition-all hover:shadow-lg">
                <CardContent class="flex h-full flex-col p-6">
                  <!-- 제목 영역 - 고정 높이 -->
                  <div class="mb-4 flex h-12 items-start justify-between">
                    <h3 class="line-clamp-2 text-lg leading-tight font-semibold">
                      {{ story.title }}
                    </h3>
                    <span class="ml-2 text-sm whitespace-nowrap text-gray-500">
                      {{ story.createdAt }}
                    </span>
                  </div>

                  <!-- 여행 기간 표시 - 고정 높이 -->
                  <p class="mb-4 flex h-6 items-center text-gray-600">
                    <span class="mr-2 flex-shrink-0">🗓️</span>
                    <span class="truncate">{{ story.content }}</span>
                  </p>

                  <!-- 참여자 정보 표시 - 고정 높이 -->
                  <div class="mb-2 h-14">
                    <!-- 함께하는 친구들이 있는 경우 -->
                    <div v-if="story.participants && story.participants.length > 0">
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

                    <!-- 혼자 여행하는 경우 -->
                    <div v-else>
                      <p class="mb-1 text-sm text-gray-700">여행 스타일:</p>
                      <div class="flex flex-wrap gap-1">
                        <span
                          class="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800"
                        >
                          나혼자 여행하기
                        </span>
                      </div>
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
                        기록 작성 {{ story.isStep1Completed ? '완료' : '미완료' }}
                      </span>
                      <span
                        :class="[
                          'rounded px-2 py-1 text-xs font-medium',
                          story.isStep2Completed
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600',
                        ]"
                      >
                        AI 후기 {{ story.isStep2Completed ? '완료' : '미완료' }}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      @click="
                        handleNavigate(
                          story.tripId || story.id,
                          getCompletionStatus(story, buttonConfig)
                        )
                      "
                      :variant="
                        buttonConfig.sameButton
                          ? 'default'
                          : getCompletionStatus(story, buttonConfig)
                            ? 'outline'
                            : 'default'
                      "
                    >
                      {{
                        buttonConfig.sameButton
                          ? buttonConfig.completedText
                          : getCompletionStatus(story, buttonConfig)
                            ? buttonConfig.completedText
                            : buttonConfig.incompleteText
                      }}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        </CarouselContent>

        <!-- 이전/다음 버튼 - 위치 조정 -->
        <CarouselPrevious class="-left-12" />
        <CarouselNext class="-right-12" />
      </Carousel>
    </div>
  </div>
</template>
