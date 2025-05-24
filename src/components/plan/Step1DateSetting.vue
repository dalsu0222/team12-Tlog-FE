<template>
  <div>
    <h2 class="mb-4 text-2xl font-bold">여행 기간이 어떻게 되시나요?</h2>
    <p class="mb-6 text-gray-600">출발과 도착일을 정해서 숙박 일정을 짜보세요.</p>

    <!-- 선택된 날짜 표시 -->
    <div
      v-if="planStore.selectedDateRange.start && planStore.selectedDateRange.end"
      class="bg-primary mb-6 rounded-lg p-4"
    >
      <h3 class="mb-2 font-semibold">선택된 여행 기간</h3>
      <div class="text-sm">
        <p>출발일: {{ planStore.formatDate(planStore.selectedDateRange.start) }}</p>
        <p>도착일: {{ planStore.formatDate(planStore.selectedDateRange.end) }}</p>
        <p class="text-bold-dark font-medium">총 {{ planStore.getTravelDays }}일</p>
      </div>
    </div>

    <!-- 날짜 선택 버튼 -->
    <Button
      v-if="planStore.selectedDateRange.start && planStore.selectedDateRange.end"
      @click="planStore.showDatePicker = true"
      class="mb-4 w-full"
      variant="outline"
    >
      날짜 변경하기
    </Button>

    <!-- 캐러셀 날짜 피커 모달 -->
    <div
      v-if="planStore.showDatePicker"
      class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
      @click.self="handleOutsideClick"
    >
      <div class="relative mx-4 w-full max-w-4xl rounded-lg bg-white p-6" @click.stop>
        <div class="mb-4 flex items-center justify-between">
          <div class="flex w-full flex-col items-center justify-center">
            <h3 class="text-lg font-semibold">여행 기간 선택</h3>
            <!-- 안내 메시지 -->
            <div class="mt-2 text-center text-sm text-gray-500">
              💡 여행 기간은 최대 10일까지 선택 가능합니다
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="absolute top-4 right-4"
            @click="planStore.showDatePicker = false"
          >
            ✕
          </Button>
        </div>

        <Carousel
          v-model="carouselApi"
          class="w-full"
          :opts="{
            align: 'start',
            containScroll: 'trimSnaps',
          }"
        >
          <CarouselContent>
            <CarouselItem
              v-for="(monthData, index) in calendarMonths"
              :key="index"
              class="basis-1/2 pl-4"
            >
              <div class="p-1">
                <div class="calendar-container">
                  <div class="mb-2 text-center font-semibold">
                    {{ monthData.year }}년 {{ monthData.month + 1 }}월
                  </div>
                  <div class="mb-2 grid grid-cols-7 gap-1 text-center text-xs">
                    <div class="font-medium text-red-500">일</div>
                    <div class="font-medium">월</div>
                    <div class="font-medium">화</div>
                    <div class="font-medium">수</div>
                    <div class="font-medium">목</div>
                    <div class="font-medium">금</div>
                    <div class="font-medium text-blue-500">토</div>
                  </div>
                  <div class="grid grid-cols-7 gap-1">
                    <div
                      v-for="day in getCalendarDays(monthData.year, monthData.month)"
                      :key="day.key"
                      class="flex aspect-square cursor-pointer items-center justify-center rounded text-sm hover:bg-gray-100"
                      :class="getDayClass(day)"
                      @click="selectDate(day.date)"
                    >
                      {{ day.day }}
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        <div class="mt-4 flex justify-end gap-2">
          <Button variant="outline" @click="planStore.showDatePicker = false">취소</Button>
          <Button
            :disabled="!planStore.tempDateRange.start || !planStore.tempDateRange.end"
            class="bg-secondary hover:bg-bold"
            @click="confirmDateSelection"
          >
            확인
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { usePlanStore } from '@/stores/plan';

interface CalendarDay {
  date: Date | null;
  day: number | string;
  key: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
}

// 컴포넌트 마운트 시 날짜 선택이 없으면 자동으로 모달 열기
onMounted(() => {
  // 이미 날짜가 선택되어 있지 않은 경우에만 모달 자동 열기
  if (!planStore.selectedDateRange.start || !planStore.selectedDateRange.end) {
    setTimeout(() => {
      planStore.showDatePicker = true;
    }, 500); // 페이지 로딩 후 약간의 딜레이
  }
});

const planStore = usePlanStore();
const carouselApi = ref();

// 캐러셀에 표시할 월들 생성 (현재월부터 12개월)
const calendarMonths = computed(() => {
  const months = [];
  const today = new Date();

  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    months.push({
      month: date.getMonth(),
      year: date.getFullYear(),
    });
  }

  return months;
});

// 캘린더 날짜 생성
const getCalendarDays = (year: number, month: number): CalendarDay[] => {
  const days: CalendarDay[] = [];
  const firstDay = new Date(year, month, 1);
  const today = new Date();

  // 이전 달의 마지막 날들
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  // 42일 (6주) 생성
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    const isCurrentMonth = currentDate.getMonth() === month;
    const isToday = currentDate.toDateString() === today.toDateString();
    const isPast = currentDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());

    days.push({
      date: isCurrentMonth ? currentDate : null,
      day: isCurrentMonth ? currentDate.getDate() : '',
      key: `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`,
      isCurrentMonth,
      isToday,
      isPast: isPast && isCurrentMonth,
    });
  }

  return days;
};

// 날짜 클릭 핸들러
const selectDate = (date: Date | null) => {
  if (!date) return;

  // 과거 날짜는 선택 불가
  const today = new Date();
  if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    return;
  }

  if (!planStore.tempDateRange.start || planStore.tempDateRange.end) {
    // 첫 번째 날짜 선택 또는 리셋
    planStore.tempDateRange = {
      start: date,
      end: null,
    };
  } else {
    // 두 번째 날짜 선택
    if (date >= planStore.tempDateRange.start) {
      // 10일 초과 체크
      const dayDiff =
        Math.ceil((date.getTime() - planStore.tempDateRange.start.getTime()) / (1000 * 3600 * 24)) +
        1;
      if (dayDiff > 10) {
        // 10일 초과 시 경고 메시지
        alert('여행 기간은 최대 10일까지 선택 가능합니다.');
        return;
      }
      planStore.tempDateRange.end = date;
    } else {
      planStore.tempDateRange = {
        start: date,
        end: null,
      };
    }
  }
};

// 날짜 스타일 클래스
const getDayClass = (day: CalendarDay) => {
  const classes = [];

  if (!day.isCurrentMonth) {
    classes.push('text-gray-300');
  } else if (day.isPast) {
    classes.push('text-gray-400', 'cursor-not-allowed');
  } else {
    classes.push('text-gray-900');
  }

  if (day.isToday) {
    classes.push('bg-primary', 'font-bold');
  }

  // 10일 초과 날짜 비활성화
  if (day.date && planStore.tempDateRange.start && !planStore.tempDateRange.end) {
    const dayDiff =
      Math.ceil(
        (day.date.getTime() - planStore.tempDateRange.start.getTime()) / (1000 * 3600 * 24)
      ) + 1;
    if (dayDiff > 10 && day.date > planStore.tempDateRange.start) {
      classes.push('text-gray-300', 'cursor-not-allowed', 'opacity-50');
    }
  }

  // 선택된 범위 스타일
  if (day.date && planStore.tempDateRange.start && planStore.tempDateRange.end) {
    const date = day.date;
    if (date >= planStore.tempDateRange.start && date <= planStore.tempDateRange.end) {
      if (date.getTime() === planStore.tempDateRange.start.getTime()) {
        classes.push('bg-bold', 'text-white', 'rounded-l');
      } else if (date.getTime() === planStore.tempDateRange.end.getTime()) {
        classes.push('bg-bold', 'text-white', 'rounded-r');
      } else {
        classes.push('bg-primary');
      }
    }
  } else if (
    day.date &&
    planStore.tempDateRange.start &&
    day.date.getTime() === planStore.tempDateRange.start.getTime()
  ) {
    classes.push('bg-bold', 'text-white', 'rounded');
  }

  return classes.join(' ');
};

// 날짜 선택 확인
const confirmDateSelection = () => {
  if (planStore.tempDateRange.start && planStore.tempDateRange.end) {
    planStore.setDateRange({
      start: planStore.tempDateRange.start,
      end: planStore.tempDateRange.end,
    });
    // 백엔드에 전송할 수 있는 형태로 변환
    const startDate = planStore.selectedDateRange.start?.toISOString();
    const endDate = planStore.selectedDateRange.end?.toISOString();

    console.log('선택된 여행 기간:', {
      startDate,
      endDate,
    });

    // 단계 이동을 먼저 하고 모달을 닫음
    planStore.nextStep();
    planStore.showDatePicker = false;
  }
};

// 외부 클릭 처리 (아무것도 하지 않음 - 모달이 닫히지 않게)
const handleOutsideClick = () => {
  // 캐러셀 바깥 클릭 시 아무것도 하지 않음
};

// 날짜 피커 열 때 임시 범위 초기화
watch(
  () => planStore.showDatePicker,
  newVal => {
    if (newVal) {
      planStore.tempDateRange = {
        start: planStore.selectedDateRange.start,
        end: planStore.selectedDateRange.end,
      };
    }
  }
);
</script>

<style scoped>
.calendar-container {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: white;
}
</style>
