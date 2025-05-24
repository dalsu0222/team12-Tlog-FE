<template>
  <div>
    <h2 class="mb-4 text-2xl font-bold">숙소 선택</h2>
    <p class="mb-6 text-gray-600">우측에서 해당 도시의 숙소를 선택해주세요.</p>

    <!-- 선택한 숙소 목록 -->
    <div class="mt-6">
      <h3 class="mb-3 text-lg font-semibold">선택한 숙소</h3>
      <ScrollArea>
        <div v-for="day in Object.keys(dayPlans).map(Number)" :key="day" class="mb-4">
          <div class="mb-2 text-sm font-medium">{{ day }}일차</div>

          <!-- 숙소 표시 -->
          <div v-if="dayPlans[day].accommodation" class="mb-2">
            <div
              class="border-secondary bg-secondary/10 flex items-center justify-between rounded-md border p-2 text-sm"
            >
              <div
                class="flex-1 cursor-pointer"
                @click="handleAccommodationClick(dayPlans[day].accommodation)"
              >
                <div class="font-bold text-gray-800">🏨 {{ dayPlans[day].accommodation.name }}</div>
                <div class="text-xs font-bold text-gray-800">
                  {{ dayPlans[day].accommodation.address }}
                </div>
                <div
                  v-if="dayPlans[day].accommodation!.rating"
                  class="flex items-center gap-1 text-xs text-yellow-600"
                >
                  <span>⭐</span>
                  <span>{{ dayPlans[day].accommodation!.rating.toFixed(1) }}</span>
                  <span v-if="dayPlans[day].accommodation!.userRatingsTotal" class="text-gray-400">
                    ({{ dayPlans[day].accommodation!.userRatingsTotal }}개 리뷰)
                  </span>
                </div>
              </div>
              <button
                class="hover:bg-secondary/20 ml-2 rounded-full p-1"
                @click="removeAccommodation(day, dayPlans[day].accommodation!.placeId)"
              >
                <XIcon class="text-secondary h-4 w-4 hover:text-red-500" />
              </button>
            </div>
          </div>

          <!-- 빈 상태 표시 -->
          <div v-if="!dayPlans[day].accommodation" class="py-4 text-center text-xs text-gray-400">
            선택된 숙소가 없습니다
          </div>
        </div>
        <div v-if="!Object.keys(dayPlans).length" class="py-8 text-center text-gray-400">
          아직 선택된 숙소가 없습니다
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
  accommodationClick: [place: PlaceResult];
  removeAccommodation: [day: number, placeId: string];
}>();

// Methods
function handleAccommodationClick(place: PlaceResult) {
  emit('accommodationClick', place);
}

function removeAccommodation(day: number, placeId: string) {
  emit('removeAccommodation', day, placeId);
}
</script>
