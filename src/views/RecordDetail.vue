<!-- src/views/RecordDetail.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Accordion } from '@/components/ui/accordion';
import TripHeader from '@/components/views/recordDetail/TripHeader.vue';
import TripPlanAccordion from '@/components/views/recordDetail/TripPlanAccordion.vue';
import AiStoryAccordion from '@/components/views/recordDetail/AiStoryAccordion.vue';
import api from '@/services/api/api';

interface TripRecordDetail {
  trip: {
    tripId: number;
    title: string;
    createdAt: string;
    startDate: string;
    endDate: string;
  };
  tripParticipant: string[];
  hasStep1: boolean;
  hasStep2: boolean;
  tripPlans: {
    day: number;
    plans: { memo: string }[];
  }[];
  tripRecords: {
    recordId: number;
    day: number;
    date: string;
    memo: string;
    imageUrl?: string; // 이미지 URL 추가
    originalName?: string; // 원본 파일명 추가
  }[];
  aiStoryContent: string | null;
}

interface MemoRecord {
  day: number;
  memo: string;
  date: Date;
  imageUrl?: string; // 이미지 URL 추가
  originalName?: string; // 원본 파일명 추가
}

interface SaveCallbacks {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

const route = useRoute();
const tripId = computed(() => route.params.id as string);
const tripDetail = ref<TripRecordDetail | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const isSavingMemos = ref(false);

// Step1은 항상 열려있게 설정
const initialStep1Value = 'step1';

// Step2는 hasStep2에 따라 결정
const initialStep2Value = computed(() => {
  if (!tripDetail.value) return undefined;
  return tripDetail.value.hasStep2 ? 'step2' : undefined;
});

const loadTripDetail = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    const response = await api.get(`/api/trips/${tripId.value}/record`);
    tripDetail.value = response.data.data;

    console.log('로드된 여행 상세:', tripDetail.value);
  } catch (err) {
    console.error('여행 기록 상세 조회 실패:', err);
    error.value = '여행 기록을 불러오는데 실패했습니다. 다시 시도해주세요.';
  } finally {
    isLoading.value = false;
  }
};

const handleStoryGenerated = (content: string) => {
  if (tripDetail.value) {
    tripDetail.value.aiStoryContent = content;
    tripDetail.value.hasStep2 = true;
  }
  console.log('AI 스토리가 생성되었습니다.');
};

const handleStoryDeleted = () => {
  if (tripDetail.value) {
    tripDetail.value.aiStoryContent = null;
    tripDetail.value.hasStep2 = false;
  }
  console.log('AI 스토리가 삭제되었습니다.');
};

const handleStorySaved = (content: string) => {
  if (tripDetail.value) {
    tripDetail.value.aiStoryContent = content;
  }
  console.log('AI 스토리가 저장되었습니다.');
};

const handleSaveMemos = async (memoRecords: MemoRecord[], callbacks?: SaveCallbacks) => {
  if (!tripDetail.value) return;

  try {
    isSavingMemos.value = true;

    // API 형식에 맞게 데이터 변환 (이미지 정보 포함)
    const requestData = {
      records: memoRecords.map(record => ({
        day: record.day,
        date: record.date.toISOString().split('T')[0], // YYYY-MM-DD 형식
        memo: record.memo,
        imageUrl: record.imageUrl || null, // 이미지 URL 추가
        originalName: record.originalName || null, // 원본 파일명 추가
      })),
    };

    console.log('저장할 데이터:', requestData);

    const response = await api.post(`/api/trips/${tripId.value}/record/save`, requestData);

    // 성공시 로컬 데이터 업데이트
    if (tripDetail.value) {
      memoRecords.forEach(newRecord => {
        const existingRecordIndex = tripDetail.value!.tripRecords.findIndex(
          record => record.day === newRecord.day
        );

        if (existingRecordIndex >= 0) {
          // 기존 기록 업데이트 (이미지 정보 포함)
          tripDetail.value!.tripRecords[existingRecordIndex].memo = newRecord.memo;
          tripDetail.value!.tripRecords[existingRecordIndex].imageUrl = newRecord.imageUrl;
          tripDetail.value!.tripRecords[existingRecordIndex].originalName = newRecord.originalName;
        } else {
          // 새 기록 추가 (이미지 정보 포함)
          tripDetail.value!.tripRecords.push({
            recordId: 0, // 임시 ID
            day: newRecord.day,
            date: newRecord.date.toISOString(),
            memo: newRecord.memo,
            imageUrl: newRecord.imageUrl,
            originalName: newRecord.originalName,
          });
        }
      });

      // hasStep1 상태 업데이트
      tripDetail.value.hasStep1 = true;
    }

    console.log('여행 기록 저장 완료');

    // 성공 콜백 호출
    if (callbacks?.onSuccess) {
      callbacks.onSuccess(response.data);
    }
  } catch (err) {
    console.error('여행 기록 저장 실패:', err);

    // 에러 콜백 호출
    if (callbacks?.onError) {
      callbacks.onError(err);
    } else {
      throw err;
    }
  } finally {
    isSavingMemos.value = false;
  }
};

onMounted(() => {
  loadTripDetail();
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
      <button class="ml-4 rounded bg-blue-500 px-4 py-2 text-white" @click="loadTripDetail">
        다시 시도
      </button>
    </div>

    <!-- Trip Detail -->
    <div v-else-if="tripDetail" class="px-4 py-6">
      <!-- Trip Info -->
      <TripHeader
        :title="tripDetail.trip.title"
        :startDate="tripDetail.trip.startDate"
        :endDate="tripDetail.trip.endDate"
        :participants="tripDetail.tripParticipant"
      />

      <!-- Accordion Steps -->
      <div class="space-y-4">
        <!-- Step 1 Accordion - 항상 열려있음 -->
        <Accordion type="single" collapsible :default-value="initialStep1Value">
          <TripPlanAccordion
            :plans="tripDetail.tripPlans"
            :trip-records="tripDetail.tripRecords"
            :trip-start-date="tripDetail.trip.startDate"
            :is-saving="isSavingMemos"
            @saveMemos="handleSaveMemos"
          />
        </Accordion>

        <!-- Step 2 Accordion -->
        <Accordion type="single" collapsible :default-value="initialStep2Value">
          <AiStoryAccordion
            :trip-id="tripDetail.trip.tripId"
            :ai-story-content="tripDetail.aiStoryContent"
            :has-story="tripDetail.hasStep2"
            @storyGenerated="handleStoryGenerated"
            @storyDeleted="handleStoryDeleted"
            @storySaved="handleStorySaved"
          />
        </Accordion>
      </div>
    </div>
  </div>
</template>
