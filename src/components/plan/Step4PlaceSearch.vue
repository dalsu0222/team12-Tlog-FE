<template>
  <div>
    <h2 class="mb-4 text-2xl font-bold">장소 검색</h2>
    <p class="mb-6 text-gray-600">우측에서 방문하고 싶은 장소를 검색하고 일정에 추가해보세요.</p>

    <!-- 선택한 장소 목록 -->
    <div class="mt-6">
      <h3 class="mb-3 text-lg font-semibold">선택한 장소</h3>
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
          <div class="text-xs text-gray-400">{{ dayPlans[day].places.length }}개 장소</div>
        </div>

        <!-- 숙소 표시 -->
        <div v-if="dayPlans[day].accommodation" class="mb-3">
          <div class="rounded-lg border border-gray-200 bg-white p-4">
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
        </div>

        <!-- 드래그 가능한 장소 목록 -->
        <div class="rounded-lg border border-gray-200 bg-white">
          <draggable
            v-model="dayPlans[day].places"
            group="places"
            item-key="placeId"
            :animation="200"
            ghost-class="ghost-card"
            chosen-class="chosen-card"
            drag-class="drag-card"
            @start="onDragStart"
            @end="onDragEnd"
            class="min-h-[60px]"
          >
            <template #item="{ element: place, index }">
              <div
                class="group relative flex items-center gap-2 border-b border-gray-100 p-3 transition-all duration-200 last:border-b-0 hover:bg-gray-50"
                :class="{ 'cursor-move': !isDragging }"
              >
                <!-- 드래그 핸들과 순서 번호 -->
                <div class="flex items-center gap-1">
                  <div class="cursor-move opacity-0 transition-opacity group-hover:opacity-100">
                    <GripVertical class="h-4 w-4 text-gray-400" />
                  </div>
                  <div
                    class="flex h-6 w-6 items-center justify-center rounded border-2 border-gray-300 bg-white text-xs font-bold text-gray-600"
                  >
                    {{ index + 1 }}
                  </div>
                </div>

                <!-- 장소 정보 -->
                <div @click="handlePlaceClick(place)" class="flex-1 cursor-pointer pl-2">
                  <div class="font-semibold text-gray-800">{{ place.name }}</div>
                  <div class="text-sm text-gray-500">{{ place.address }}</div>
                </div>

                <!-- 삭제 버튼 -->
                <button
                  class="rounded-full p-2 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50"
                  @click="removePlace(day, place.placeId)"
                >
                  <XIcon class="h-4 w-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            </template>

            <!-- 빈 상태 표시 -->
            <template #footer>
              <div
                v-if="dayPlans[day].places.length === 0"
                class="flex flex-col items-center justify-center py-4 text-gray-400"
              >
                <MapPin class="mb-2 h-8 w-8" />
                <div class="text-sm">선택된 장소가 없습니다</div>
                <div class="text-xs">우측에서 장소를 검색해서 추가해보세요</div>
              </div>
            </template>
          </draggable>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { XIcon, GripVertical, MapPin, Calendar } from 'lucide-vue-next';
import { usePlanStore } from '@/stores/plan';
import { dayColors } from '@/composables/plan/usePlanMap';
import type { PlaceResult } from '@/composables/plan/usePlaceSearch';
import draggable from 'vuedraggable';

const planStore = usePlanStore();

const isDragging = ref(false);

const dayPlans = computed(() => planStore.dayPlans);

const emit = defineEmits<{
  placeClick: [place: PlaceResult];
  removePlace: [day: number, placeId: string];
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

function handlePlaceClick(place: PlaceResult) {
  emit('placeClick', place);
}

function handleAccommodationClick(place: PlaceResult) {
  emit('placeClick', place);
}

function removePlace(day: number, placeId: string) {
  emit('removePlace', day, placeId);
}

function removeAccommodation(day: number, placeId: string) {
  emit('removePlace', day, placeId);
}

// 드래그 이벤트 핸들러
function onDragStart() {
  isDragging.value = true;
}

function onDragEnd() {
  isDragging.value = false;
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
</script>

<style scoped>
.ghost-card {
  opacity: 0.5;
  background: #e3f2fd;
  border: 2px dashed #2196f3;
  transform: rotate(2deg);
}

.chosen-card {
  opacity: 0.9;
}

.drag-card {
  opacity: 0.8;
  transform: rotate(-2deg);
  z-index: 1000;
}

/* 드래그 중일 때 부드러운 트랜지션 */
.sortable-ghost {
  opacity: 0.4;
}

.sortable-chosen {
  opacity: 0.9;
}

.sortable-drag {
  opacity: 0.8;
}
</style>
