<!-- src/components/views/planList/PlanListSection.vue -->
<script setup lang="ts">
import TripHeader from '@/components/views/recordList/TripHeader.vue';
import TripStorySection from '@/components/views/recordList/TripStorySection.vue';
import { Button } from '@/components/ui/button';
import type { TripStory } from '@/services/api/tripService';

defineProps<{
  stories: TripStory[];
}>();

const emit = defineEmits<{
  'navigate': [{ tripId: number; isCompleted: boolean }];
  'go-to-create-trip': [];
}>();

// 계획 리스트용 버튼 설정
const planButtonConfig = {
  completedText: '계획 보기',
  incompleteText: '계획 보기', // 동일한 텍스트로 변경
  useStep2Status: false,
  sameButton: true, // 동일한 버튼 스타일 사용
};

const handleNavigate = (data: { tripId: number; isCompleted: boolean }) => {
  emit('navigate', data);
};

const goToCreateTrip = () => {
  emit('go-to-create-trip');
};
</script>

<template>
  <div id="plan-list-section" class="h-[calc(100vh-4rem)]">
    <div class="flex min-h-full flex-col justify-center bg-gray-50 py-8 sm:py-12 lg:py-16">
      <div class="mx-auto max-w-screen-xl px-4">
        <!-- Trip Header -->
        <TripHeader
          title="내 여행 계획"
          description="친구들과 함께 계획한 여행들을 확인하고 관리하세요"
        />

        <!-- 컨텐츠 -->
        <div class="flex flex-1 items-center justify-center">
          <!-- 데이터가 없는 경우 -->
          <div
            v-if="stories.length === 0"
            class="rounded-lg border border-dashed border-gray-300 bg-white/80 p-8 text-center backdrop-blur-sm"
          >
            <div class="space-y-4">
              <div class="text-6xl">🗺️</div>
              <div>
                <h3 class="text-lg font-semibold text-gray-800">아직 계획된 여행이 없습니다</h3>
                <p class="mt-2 text-gray-600">새로운 여행을 계획해보세요</p>
              </div>
              <Button class="mt-4" @click="goToCreateTrip">새 여행 계획 만들기</Button>
            </div>
          </div>

          <!-- 데이터가 있는 경우 -->
          <div v-else class="w-full">
            <TripStorySection
              :stories="stories"
              :button-config="planButtonConfig"
              @navigate="handleNavigate"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
