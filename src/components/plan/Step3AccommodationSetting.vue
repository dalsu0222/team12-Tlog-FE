<template>
  <div>
    <h2 class="mb-4 text-2xl font-bold">숙소 선택</h2>
    <p class="mb-6 text-gray-600">우측에서 해당 도시의 숙소를 선택해주세요.</p>

    <!-- 선택한 숙소 목록 -->
    <div class="mt-6">
      <h3 class="mb-3 text-lg font-semibold">선택한 숙소</h3>
      <ScrollArea class="h-[calc(100vh-200px)]">
        <div v-for="day in Object.keys(dayPlans).map(Number)" :key="day" class="mb-6">
          <div class="mb-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-20 items-center justify-center rounded-lg text-lg font-bold text-white shadow-md"
                :style="{ backgroundColor: getDayColor(day) }"
              >
                Day {{ day }}
              </div>
              <div class="text-sm text-gray-500">
                {{ getDateForDay(day) }}
              </div>
            </div>
            <div class="text-xs text-gray-400">
              {{ dayPlans[day].accommodation ? '숙소 선택됨' : '숙소 없음' }}
            </div>
          </div>

          <!-- 숙소 표시 -->
          <div class="rounded-lg border border-gray-200 bg-white">
            <div v-if="dayPlans[day].accommodation" class="p-4">
              <div
                class="group -m-2 flex items-center gap-3 rounded-lg p-2 transition-all duration-200 hover:bg-gray-50"
              >
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <span class="text-xl">
                    {{ getAccommodationIcon(dayPlans[day].accommodation) }}
                  </span>
                </div>
                <div
                  class="flex-1 cursor-pointer"
                  @click="handleAccommodationClick(dayPlans[day].accommodation)"
                >
                  <div class="font-semibold text-gray-800">
                    {{ dayPlans[day].accommodation.name }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ dayPlans[day].accommodation.address }}
                  </div>
                </div>
                <button
                  class="rounded-full p-2 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50"
                  @click="removeAccommodation(day, dayPlans[day].accommodation!.placeId)"
                >
                  <XIcon class="h-4 w-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            </div>

            <!-- 빈 상태 표시 -->
            <div
              v-if="!dayPlans[day].accommodation"
              class="flex flex-col items-center justify-center py-4 text-gray-400"
            >
              <span class="mb-2 text-2xl">🏨</span>
              <div class="text-sm">선택된 숙소가 없습니다</div>
              <div class="text-xs">우측에서 숙소를 검색해서 추가해보세요</div>
            </div>
          </div>
        </div>

        <div
          v-if="!Object.keys(dayPlans).length"
          class="flex flex-col items-center py-12 text-gray-400"
        >
          <Calendar class="mb-3 h-12 w-12" />
          <div class="text-lg font-medium">여행 일정을 설정해주세요</div>
          <div class="text-sm">Step 1에서 날짜를 먼저 선택해주세요</div>
        </div>
      </ScrollArea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { XIcon, Calendar } from 'lucide-vue-next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlanStore } from '@/stores/plan';
import { dayColors } from '@/composables/plan/usePlanMap';
import type { PlaceResult } from '@/composables/plan/usePlaceSearch';

const planStore = usePlanStore();

const dayPlans = computed(() => planStore.dayPlans);

const emit = defineEmits<{
  accommodationClick: [place: PlaceResult];
  removeAccommodation: [day: number, placeId: string];
}>();

function getDayColor(day: number): string {
  return dayColors[day - 1] ?? '#888';
}

function getDateForDay(day: number): string {
  if (!planStore.selectedDateRange.start) return '';

  const startDate = new Date(planStore.selectedDateRange.start);
  const targetDate = new Date(startDate);
  targetDate.setDate(startDate.getDate() + day - 1);

  return targetDate.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

function getAccommodationIcon(place: PlaceResult): string {
  if (!place.types) return '🏨';

  // 숙소 유형별 아이콘 매핑
  for (const type of place.types) {
    switch (type.toLowerCase()) {
      case 'hotel':
      case 'lodging':
        return '🏨'; // 호텔
      case 'motel':
        return '🏩'; // 모텔
      case 'resort':
        return '🏖️'; // 리조트
      case 'campground':
      case 'rv_park':
        return '🏕️'; // 캠핑장
      case 'spa':
        return '♨️'; // 스파
      case 'guest_house':
        return '🏠'; // 게스트하우스
      case 'hostel':
        return '🛏️'; // 호스텔
      case 'apartment':
      case 'real_estate_agency':
        return '🏢'; // 아파트/숙박업소
      default:
        continue;
    }
  }

  // 숙소 이름으로 추가 판단
  const name = place.name.toLowerCase();
  if (name.includes('펜션')) return '🏡';
  if (name.includes('리조트')) return '🏖️';
  if (name.includes('모텔')) return '🏩';
  if (name.includes('게스트하우스') || name.includes('민박')) return '🏠';
  if (name.includes('호스텔')) return '🛏️';
  if (name.includes('캠핑') || name.includes('글램핑')) return '🏕️';
  if (name.includes('스파') || name.includes('온천')) return '♨️';

  return '🏨';
}

function handleAccommodationClick(place: PlaceResult) {
  emit('accommodationClick', place);
}

function removeAccommodation(day: number, placeId: string) {
  emit('removeAccommodation', day, placeId);
}
</script>
