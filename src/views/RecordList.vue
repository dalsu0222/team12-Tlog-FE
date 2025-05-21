<!-- views/RecordList.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TripStorySection from '@/components/views/recordList/TripStorySection.vue';
import {
  fetchAllTripRecords,
  convertToTripStory,
  type TripStory,
  type TripInfoDto,
} from '@/services/api/tripService';
import { Button } from '@/components/ui/button';

// 상태 관리
const allTripData = ref<TripInfoDto[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const router = useRouter();

// 데이터 필터링: 필터 기준에 따라 처리 필요한 여행 (hasStep1 또는 hasStep2가 false인 경우)
const myStories = computed<TripStory[]>(() => {
  return allTripData.value
    .filter(trip => !trip.hasStep1 || !trip.hasStep2) // 처리 필요한 여행만 필터링
    .map((trip, index) => convertToTripStory(trip, index));
});

// 데이터 필터링: 완료된 여행 (hasStep1과 hasStep2가 모두 true인 경우)
const completedStories = computed<TripStory[]>(() => {
  return allTripData.value
    .filter(trip => trip.hasStep1 && trip.hasStep2) // 완료된 여행만 필터링
    .map((trip, index) => convertToTripStory(trip, index + 100)); // ID 충돌 방지를 위해 index에 100 추가
});

// 여행 데이터 로드
const loadTripData = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    // API 호출 - 모든 데이터를 한 번에 가져옴
    const trips = await fetchAllTripRecords();
    allTripData.value = trips;
  } catch (err) {
    console.error('여행 기록 목록 로드 실패:', err);
    error.value = '여행 기록을 불러오는데 실패했습니다. 다시 시도해주세요.';
  } finally {
    isLoading.value = false;
  }
};

// 페이지 이동 핸들러
const handleNavigate = ({ tripId, isCompleted }: { tripId: number; isCompleted: boolean }) => {
  if (isCompleted) {
    // 보기 모드 - 기록 상세보기
    router.push(`/records/${tripId}`);
  } else {
    // 후기 작성 모드 - 작성 페이지
    router.push(`/records/${tripId}`);
  }
};

// 새 여행 생성 페이지로 이동
const goToCreateTrip = () => {
  router.push('/');
};

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  loadTripData();
});
</script>

<template>
  <div class="mx-auto max-w-screen-xl bg-gray-50 px-4 py-8">
    <!-- 헤더 -->
    <div class="mb-8 text-center">
      <h1 class="mb-2 text-3xl font-bold text-gray-800">AI 후기 리스트</h1>
      <p class="text-gray-600">AI가 생성해주는 블로그 초안을 만나보세요~~~~</p>
    </div>

    <!-- 로딩 상태 - 전체 페이지에 대한 로딩 -->
    <div v-if="isLoading" class="flex h-64 items-center justify-center">
      <div
        class="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
      ></div>
    </div>

    <!-- 에러 메시지 - 전체 페이지에 대한 에러 -->
    <div v-else-if="error" class="rounded-md bg-red-50 p-4 text-center text-red-600">
      {{ error }}
      <Button class="ml-4" @click="loadTripData">다시 시도</Button>
    </div>

    <!-- 데이터가 있는 경우 -->
    <div v-else>
      <!-- 내 여행 후기 섹션 (처리 필요한 여행) -->
      <div class="mb-12">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-800">작성이 필요한 여행 후기</h2>
        </div>

        <!-- 데이터가 없는 경우 -->
        <div
          v-if="myStories.length === 0"
          class="rounded-lg border border-dashed border-gray-300 p-8 text-center"
        >
          <p class="text-gray-500">작성이 필요한 여행 후기가 없습니다.</p>
          <Button class="mt-4" @click="goToCreateTrip">새 여행 만들러 가기</Button>
        </div>

        <!-- 데이터가 있는 경우 -->
        <TripStorySection v-else :stories="myStories" @navigate="handleNavigate" />
      </div>

      <!-- 완료된 여행 후기 섹션 -->
      <div>
        <h2 class="mb-4 text-xl font-semibold text-gray-800">작성이 완료된 여행 후기</h2>

        <!-- 데이터가 없는 경우 -->
        <div
          v-if="completedStories.length === 0"
          class="rounded-lg border border-dashed border-gray-300 p-8 text-center"
        >
          <p class="text-gray-500">작성이 완료된 여행 후기가 없습니다.</p>
        </div>

        <!-- 데이터가 있는 경우 -->
        <TripStorySection v-else :stories="completedStories" @navigate="handleNavigate" />
      </div>
    </div>
  </div>
</template>
