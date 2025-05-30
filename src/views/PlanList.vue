<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PlanListSection from '@/components/views/planList/PlanListSection.vue';
import {
  fetchAllTripRecords, // 같은 API 사용
  convertToTripStory,
  type TripStory,
  type TripInfoDto,
} from '@/services/api/tripService';
import { Button } from '@/components/ui/button';

const allTripData = ref<TripInfoDto[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const router = useRouter();

// 모든 여행 계획 (기록 완료 여부 상관없이)
const allPlans = computed<TripStory[]>(() => {
  return allTripData.value.map(trip => convertToTripStory(trip));
});

const loadTripData = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    const trips = await fetchAllTripRecords();
    allTripData.value = trips;
  } catch (err) {
    console.error('여행 계획 목록 로드 실패:', err);
    error.value = '여행 계획을 불러오는데 실패했습니다. 다시 시도해주세요.';
  } finally {
    isLoading.value = false;
  }
};

const handleNavigate = ({ tripId }: { tripId: number }) => {
  // 계획 상세 페이지로 이동 (예: /plans/123)
  router.push(`/plan/${tripId}`);
};

const goToCreateTrip = () => {
  router.push('/');
};

onMounted(() => {
  loadTripData();
});
</script>

<template>
  <div>
    <!-- Loading 상태 - 전체 화면 중앙 -->
    <div v-if="isLoading" class="flex h-screen items-center justify-center">
      <div
        class="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
      ></div>
    </div>

    <!-- Error 상태 - 전체 화면 중앙 -->
    <div v-else-if="error" class="flex h-screen items-center justify-center">
      <div class="rounded-md bg-red-50 p-8 text-center text-red-600">
        {{ error }}
        <Button class="mt-4" @click="loadTripData">다시 시도</Button>
      </div>
    </div>

    <!-- 메인 컨텐츠 -->
    <div v-else>
      <div class="relative">
        <PlanListSection
          :stories="allPlans"
          @navigate="handleNavigate"
          @go-to-create-trip="goToCreateTrip"
        />
      </div>
    </div>
  </div>
</template>
