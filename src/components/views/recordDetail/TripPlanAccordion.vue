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
import { Loader2, Check, Save, MapPin, ArrowRight } from 'lucide-vue-next';
import TripRecordCard from './TripRecordCard.vue';
import { toast } from 'vue-sonner';

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
  if (!hasUnsavedChanges.value) {
    toast.error('저장할 내용이 없습니다', {
      description: '변경사항이 없어 저장이 필요하지 않습니다',
    });
    return;
  }

  const recordsToSave = Object.entries(memos.value).map(([day, memo]) => ({
    day: parseInt(day),
    memo: memo,
    date: calculateDate(parseInt(day)),
  }));

  // 부모 컴포넌트에게 저장 요청이 시작됨을 알림
  // 부모는 이 시점에서 isSaving을 true로 설정할 것임
  try {
    console.log('여행 기록 저장 시작:', recordsToSave);

    // emit은 Promise를 반환하지 않기 때문에, 부모 컴포넌트에서 성공/실패 여부를
    // 다시 알려줄 필요가 있습니다. 부모 컴포넌트에서 결과를 반환할 때까지 기다립니다.
    const result = await new Promise((resolve, reject) => {
      // saveMemos 이벤트 발생 - 부모 컴포넌트에서 API 호출
      emit('saveMemos', recordsToSave, { onSuccess: resolve, onError: reject });
    });

    console.log('저장 성공:', result);

    // 저장 완료 상태로 변경
    saveComplete.value = true;

    // 성공 토스트 메시지 표시
    toast.success('여행 기록이 저장되었습니다! ✓', {
      description: '소중한 추억이 안전하게 저장되었어요',
      duration: 3000,
    });

    // 2초 후 원래 상태로 복구
    setTimeout(() => {
      saveComplete.value = false;
    }, 2000);
  } catch (error: any) {
    console.error('저장 실패:', error);

    // 에러 유형에 따른 토스트 메시지 표시
    if (error.response?.status === 401) {
      toast.error('로그인이 필요합니다', {
        description: '다시 로그인해주세요',
      });
    } else if (error.response?.status === 403) {
      toast.error('접근 권한이 없습니다', {
        description: '여행 참여자만 기록을 저장할 수 있습니다',
      });
    } else if (error.response?.status === 404) {
      toast.error('여행을 찾을 수 없습니다', {
        description: '여행 정보를 확인해주세요',
      });
    } else if (error.response?.status >= 500) {
      toast.error('서버에 일시적인 문제가 발생했습니다', {
        description: '잠시 후 다시 시도해주세요',
      });
    } else if (error.response?.data?.message) {
      toast.error('저장에 실패했습니다', {
        description: error.response.data.message,
      });
    } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      toast.error('네트워크 오류가 발생했습니다', {
        description: '인터넷 연결을 확인하고 다시 시도해주세요',
      });
    } else {
      toast.error('저장에 실패했습니다', {
        description: '여행 기록 저장 중 오류가 발생했습니다. 다시 시도해주세요.',
      });
    }
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
  <AccordionItem
    value="step1"
    class="group overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white to-gray-50 shadow-md transition-all duration-500 hover:shadow-lg"
  >
    <AccordionTrigger class="px-8 py-6 hover:no-underline">
      <div class="flex items-center gap-4">
        <div
          class="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-3 transition-transform duration-300 group-hover:scale-110"
        >
          <MapPin class="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800">여행 기록</h3>
          <div class="mt-2 flex items-center gap-2">
            <span class="text-base font-medium text-blue-600">여행 기록 작성하기</span>
            <ArrowRight
              class="h-4 w-4 text-blue-600 transition-transform duration-300 group-hover:translate-x-1"
            />
          </div>
        </div>
      </div>
    </AccordionTrigger>
    <AccordionContent class="px-8 pb-6">
      <div class="space-y-4">
        <p class="text-base leading-relaxed text-gray-600">
          소중한 여행의 순간들을 날짜별로 기록하고 추억을 남겨보세요
        </p>

        <!-- <div class="space-y-2">
          <div class="flex items-center gap-3">
            <div class="h-2 w-2 rounded-full bg-blue-600"></div>
            <span class="text-base text-gray-700">일차별 여행 일기 작성</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="h-2 w-2 rounded-full bg-blue-600"></div>
            <span class="text-base text-gray-700">특별한 순간과 감정 기록</span>
          </div>
        </div> -->
      </div>

      <div v-if="!plans || plans.length === 0" class="py-8 text-center">
        <p class="text-gray-500">아직 작성된 여행 기록이 없습니다</p>
      </div>

      <div v-else class="mt-6 space-y-6">
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
                :date="calculateDate(plan.day)"
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
          <Button
            v-if="isSaving"
            disabled
            class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-white shadow-lg"
          >
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            저장 중...
          </Button>

          <!-- 저장 완료일 때 -->
          <Button
            v-else-if="saveComplete"
            disabled
            variant="default"
            class="bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 text-white shadow-lg"
          >
            <Check class="mr-2 h-4 w-4" />
            저장 완료
          </Button>

          <!-- 일반 상태일 때 -->
          <Button
            v-else
            @click="saveAllMemos"
            size="lg"
            :disabled="!hasUnsavedChanges"
            variant="default"
            class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:opacity-60"
          >
            <Save class="mr-2 h-4 w-4" />
            <span v-if="hasUnsavedChanges">여행 일기 저장하기</span>
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
