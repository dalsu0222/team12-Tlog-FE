<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import IncompleteStoriesSection from '@/components/views/recordList/IncompleteStoriesSection.vue';
import CompletedStoriesSection from '@/components/views/recordList/CompletedStoriesSection.vue';
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
    .map(trip => convertToTripStory(trip));
});

const completedStories = computed<TripStory[]>(() => {
  return allTripData.value
    .filter(trip => trip.hasStep1 && trip.hasStep2)
    .map(trip => convertToTripStory(trip));
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

const handleNavigate = ({ tripId }: { tripId: number }) => {
  router.push(`/records/${tripId}`);
};

const goToCreateTrip = () => {
  router.push('/');
};

// 스크롤 함수들
const scrollToCompletedStories = () => {
  const completedSection = document.getElementById('completed-stories-section');
  if (completedSection) {
    completedSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
};

const scrollToIncompleteStories = () => {
  const incompleteSection = document.getElementById('incomplete-stories-section');
  if (incompleteSection) {
    incompleteSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
};

// 기존 goToCreateTrip 함수 아래에 추가
const handleTripDeleted = ({
  tripId,
  tripTitle,
  message,
}: {
  tripId: number;
  tripTitle: string;
  message: string;
}) => {
  // 로컬 데이터에서 삭제된 여행 제거
  allTripData.value = allTripData.value.filter(trip => trip.trip.tripId !== tripId);

  // 사용자에게 성공 메시지 표시
  alert(`${message}\n\n'${tripTitle}' 여행이 처리되었습니다.`);

  console.log(`여행 삭제 완료 - ID: ${tripId}, 제목: ${tripTitle}`);
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
      <!-- 첫 번째 화면 - 작성이 필요한 여행 후기 -->
      <div class="relative">
        <IncompleteStoriesSection
          :stories="myStories"
          :has-completed-stories="completedStories.length > 0"
          @navigate="handleNavigate"
          @go-to-create-trip="goToCreateTrip"
          @scroll-to-completed="scrollToCompletedStories"
          @trip-deleted="handleTripDeleted"
          @refresh-data="loadTripData"
        />
      </div>

      <!-- 두 번째 화면 - 작성이 완료된 여행 후기 (완료된 후기가 있는 경우에만 표시) -->
      <div v-if="completedStories.length > 0" class="relative">
        <CompletedStoriesSection
          :stories="completedStories"
          @navigate="handleNavigate"
          @scroll-to-incomplete="scrollToIncompleteStories"
          @trip-deleted="handleTripDeleted"
          @refresh-data="loadTripData"
        />
      </div>
    </div>
  </div>
</template>
