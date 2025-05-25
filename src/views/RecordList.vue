<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TripHeader from '@/components/views/recordList/TripHeader.vue';
import TripStorySection from '@/components/views/recordList/TripStorySection.vue';
import {
  fetchAllTripRecords,
  convertToTripStory,
  type TripStory,
  type TripInfoDto,
} from '@/services/api/tripService';
import { Button } from '@/components/ui/button';

const allTripData = ref<TripInfoDto[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const router = useRouter();

const myStories = computed<TripStory[]>(() => {
  return allTripData.value
    .filter(trip => !trip.hasStep1 || !trip.hasStep2)
    .map((trip, index) => convertToTripStory(trip, index));
});

const completedStories = computed<TripStory[]>(() => {
  return allTripData.value
    .filter(trip => trip.hasStep1 && trip.hasStep2)
    .map((trip, index) => convertToTripStory(trip, index));
});

const loadTripData = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    const trips = await fetchAllTripRecords();
    allTripData.value = trips;
  } catch (err) {
    console.error('여행 기록 목록 로드 실패:', err);
    error.value = '여행 기록을 불러오는데 실패했습니다. 다시 시도해주세요.';
  } finally {
    isLoading.value = false;
  }
};

const handleNavigate = ({ tripId, isCompleted }: { tripId: number; isCompleted: boolean }) => {
  router.push(`/records/${tripId}`);
};

const goToCreateTrip = () => {
  router.push('/');
};

onMounted(() => {
  loadTripData();
});
</script>

<template>
  <div class="mx-auto h-full max-w-screen-xl px-4 py-8">
    <!-- Loading -->
    <div v-if="isLoading" class="flex h-64 items-center justify-center">
      <div
        class="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
      ></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 p-4 text-center text-red-600">
      {{ error }}
      <Button class="ml-4" @click="loadTripData">다시 시도</Button>
    </div>

    <!-- Trip List -->
    <div v-else class="px-4 py-6">
      <!-- Trip Header -->
      <TripHeader
        title="AI 후기 리스트"
        description="AI가 생성해주는 블로그 초안을 만나보세요~~~~"
      />

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
