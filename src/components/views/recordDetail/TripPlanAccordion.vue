<!-- src/components/TripPlanAccordion.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { type CarouselApi } from '@/components/ui/carousel';
import { Loader2, Check, Save } from 'lucide-vue-next';
import TripRecordCard from './TripRecordCard.vue';

interface TripPlan {
  day: number;
  plans: {
    memo: string;
    [key: string]: any;
  }[];
}

interface TripRecord {
  day: number;
  memo: string;
}

interface Props {
  plans: TripPlan[];
  tripRecords?: TripRecord[];
  tripStartDate: string;
  isSaving: boolean; // 부모 컴포넌트의 저장 상태
}

const props = defineProps<Props>();
const emit = defineEmits(['saveMemos']);

// 저장 상태 관리
const saveComplete = ref(false);

// 메모 데이터 관리
const memos = ref<{ [day: number]: string }>({});

// Carousel API
const emblaMainApi = ref<CarouselApi>();

// 현재 보이는 day 범위 추적
const currentVisibleRange = ref({ start: 1, end: 1 });

// Carousel API 설정
function setApi(val: CarouselApi) {
  emblaMainApi.value = val;
  if (val) {
    val.on('scroll', updateVisibleRange);
    val.on('select', updateVisibleRange);
    nextTick(() => {
      updateVisibleRange();
    });
  }
}

// props 변경 시 범위 업데이트
watch(
  () => props.plans,
  newPlans => {
    if (newPlans && newPlans.length > 0) {
      const visibleCount = Math.min(3, newPlans.length);
      currentVisibleRange.value = {
        start: 1,
        end: visibleCount,
      };
    }
  },
  { immediate: true }
);

// 메모 초기화
const initializeMemos = () => {
  console.log('메모 초기화 시작', { tripRecords: props.tripRecords, plans: props.plans });

  const newMemos: { [day: number]: string } = {};

  // 모든 plan day에 대해 빈 문자열로 초기화
  if (props.plans && props.plans.length > 0) {
    props.plans.forEach(plan => {
      newMemos[plan.day] = '';
    });
  }

  // tripRecords가 있으면 해당 메모로 덮어쓰기
  if (props.tripRecords && props.tripRecords.length > 0) {
    props.tripRecords.forEach(record => {
      newMemos[record.day] = record.memo || '';
    });
  }

  console.log('초기화된 메모:', newMemos);
  memos.value = newMemos;
};

// props 변경 감지
watch(
  [() => props.plans, () => props.tripRecords],
  () => {
    console.log('Props 변경 감지');
    initializeMemos();
  },
  { immediate: true, deep: true }
);

// 메모 업데이트
const updateMemo = (day: number, value: string) => {
  console.log('메모 업데이트:', { day, value });
  memos.value[day] = value;
};

// 날짜 계산
const calculateDate = (day: number): Date => {
  const startDate = new Date(props.tripStartDate);
  const targetDate = new Date(startDate);
  targetDate.setDate(startDate.getDate() + (day - 1));
  return targetDate;
};

// 모든 메모 저장
const saveAllMemos = async () => {
  const recordsToSave = Object.entries(memos.value).map(([day, memo]) => ({
    day: parseInt(day),
    memo: memo,
    date: calculateDate(parseInt(day)),
  }));

  try {
    await emit('saveMemos', recordsToSave);

    // 저장 완료 상태로 변경
    saveComplete.value = true;

    // 2초 후 원래 상태로 복구
    setTimeout(() => {
      saveComplete.value = false;
    }, 2000);
  } catch (error) {
    console.error('저장 실패:', error);
  }
};

// 저장이 필요한지 확인
const hasUnsavedChanges = computed(() => {
  if (!props.tripRecords || props.tripRecords.length === 0) {
    return Object.values(memos.value).some(memo => memo.trim() !== '');
  }

  return props.tripRecords.some(record => memos.value[record.day] !== (record.memo || ''));
});

// Carousel 스크롤 이벤트 처리
const updateVisibleRange = () => {
  if (!emblaMainApi.value || !props.plans || props.plans.length === 0) {
    return;
  }

  const api = emblaMainApi.value;
  const totalSlides = props.plans.length;

  try {
    const selectedIndex = api.selectedScrollSnap();
    const maxVisibleCount = 3;
    const visibleCount = Math.min(maxVisibleCount, totalSlides - selectedIndex);
    const start = selectedIndex + 1;
    const end = start + visibleCount - 1;

    currentVisibleRange.value = { start, end };
  } catch (error) {
    console.error('범위 계산 오류:', error);
    const visibleCount = Math.min(3, totalSlides);
    currentVisibleRange.value = { start: 1, end: visibleCount };
  }
};

onMounted(() => {
  nextTick(() => {
    if (emblaMainApi.value) {
      updateVisibleRange();
    }
  });
});
</script>

<template>
  <AccordionItem value="step1" class="mb-4 overflow-hidden rounded-lg bg-blue-50">
    <AccordionTrigger class="px-4 py-3 hover:no-underline">
      <div class="flex items-center">
        <span class="font-medium text-blue-800">Step 1</span>
        <span class="ml-4 font-medium">여행 리마인드</span>
      </div>
    </AccordionTrigger>
    <AccordionContent class="px-4 pb-4">
      <div class="mb-4 text-sm text-gray-600">여행 계획을 바탕으로 여행 기록을 가져왔습니다.</div>

      <div v-if="!plans || plans.length === 0" class="py-8 text-center">
        <p class="text-gray-500">아직 여행 계획이 없습니다.</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Progress Indicator -->
        <div class="mb-4 flex items-center justify-center space-x-4">
          <div class="text-sm text-gray-500">
            Day {{ currentVisibleRange.start
            }}{{
              currentVisibleRange.end > currentVisibleRange.start
                ? ` - ${currentVisibleRange.end}`
                : ''
            }}
            / {{ plans.length }}
          </div>
        </div>

        <!-- Carousel Component -->
        <Carousel
          class="relative w-full"
          :opts="{
            align: 'start',
            loop: false,
          }"
          @init-api="setApi"
        >
          <CarouselContent class="-ml-2 md:-ml-4">
            <CarouselItem
              v-for="plan in plans"
              :key="plan.day"
              class="pl-2 md:basis-1/2 md:pl-4 lg:basis-1/3"
            >
              <TripRecordCard
                :plan="plan"
                :memo="memos[plan.day] || ''"
                @update-memo="updateMemo"
              />
            </CarouselItem>
          </CarouselContent>

          <!-- 이전/다음 버튼 -->
          <CarouselPrevious class="left-1" />
          <CarouselNext class="right-1" />
        </Carousel>

        <!-- Save Button -->
        <div class="flex justify-center pt-4">
          <!-- 저장 중일 때 -->
          <Button v-if="isSaving" disabled class="px-6 py-2">
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            저장 중...
          </Button>

          <!-- 저장 완료일 때 -->
          <Button v-else-if="saveComplete" disabled variant="default" class="px-6 py-2">
            <Check class="mr-2 h-4 w-4" />
            저장 완료
          </Button>

          <!-- 일반 상태일 때 -->
          <Button
            v-else
            @click="saveAllMemos"
            :disabled="!hasUnsavedChanges"
            variant="default"
            class="px-6 py-2"
          >
            <Save class="mr-2 h-4 w-4" />
            <span v-if="hasUnsavedChanges">여행 기록 저장하기</span>
            <span v-else>저장할 내용이 없습니다</span>
          </Button>
        </div>
      </div>
    </AccordionContent>
  </AccordionItem>
</template>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
