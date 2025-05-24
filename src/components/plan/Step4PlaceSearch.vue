<template>
  <div>
    <h2 class="mb-4 text-2xl font-bold">장소 검색</h2>
    <p class="mb-6 text-gray-600">우측에서 방문하고 싶은 장소를 검색하고 일정에 추가해보세요.</p>

    <!-- 선택한 장소 목록 -->
    <div class="mt-6">
      <h3 class="mb-3 text-lg font-semibold">선택한 장소</h3>
      <ScrollArea>
        <div v-for="day in Object.keys(dayPlans).map(Number)" :key="day" class="mb-4">
          <div class="mb-2 text-sm font-medium">{{ day }}일차</div>

          <!-- 일반 장소들 표시 -->
          <ul v-if="dayPlans[day].places.length > 0" class="space-y-2">
            <li
              v-for="(place, index) in dayPlans[day].places"
              :key="place.placeId"
              class="flex items-center justify-between rounded-md border p-2 text-sm"
            >
              <div @click="handlePlaceClick(place)" class="flex-1 cursor-pointer">
                <div class="font-medium">{{ index + 1 }}. {{ place.name }}</div>
                <div class="text-xs text-gray-500">{{ place.address }}</div>
                <div v-if="place.rating" class="flex items-center gap-1 text-xs text-yellow-600">
                  <span>⭐</span>
                  <span>{{ place.rating.toFixed(1) }}</span>
                  <span v-if="place.userRatingsTotal" class="text-gray-400">
                    ({{ place.userRatingsTotal }}개 리뷰)
                  </span>
                </div>
              </div>
              <button
                @click="removePlace(day, place.placeId)"
                class="ml-2 rounded-full p-1 hover:bg-gray-100"
              >
                <XIcon class="h-4 w-4 text-gray-400 hover:text-red-500" />
              </button>
            </li>
          </ul>

          <!-- 빈 상태 표시 -->
          <div
            v-if="dayPlans[day].places.length === 0"
            class="py-4 text-center text-xs text-gray-400"
          >
            선택된 장소가 없습니다
          </div>
        </div>
        <div v-if="!Object.keys(dayPlans).length" class="py-8 text-center text-gray-400">
          아직 선택된 장소가 없습니다
        </div>
      </ScrollArea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { XIcon } from 'lucide-vue-next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlanStore } from '@/stores/plan';
import type { PlaceResult } from '@/composables/plan/usePlaceSearch';

const planStore = usePlanStore();

// Computed
const dayPlans = computed(() => planStore.dayPlans);

// Emits
const emit = defineEmits<{
  placeClick: [place: PlaceResult];
  removePlace: [day: number, placeId: string];
}>();

// Methods
function handlePlaceClick(place: PlaceResult) {
  emit('placeClick', place);
}

function removePlace(day: number, placeId: string) {
  emit('removePlace', day, placeId);
}
</script>
