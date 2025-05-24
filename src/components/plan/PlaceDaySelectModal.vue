<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle class="text-center text-lg font-bold">어느 Day에 추가할까요?</DialogTitle>
        <p v-if="place" class="text-center text-sm text-gray-500">
          {{ place.name }}
        </p>
      </DialogHeader>

      <div class="space-y-3">
        <!-- 일차 선택 버튼들 -->
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="day in travelDays"
            :key="day"
            class="hover:border-secondary flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all"
            :class="{
              'border-bold bg-primary text-bold': selectedDay === day,
              'border-gray-200': selectedDay !== day,
            }"
            @click="selectedDay = day"
          >
            <div class="text-lg font-bold">{{ day }}일차</div>
            <div class="text-xs text-gray-500">{{ formatDayDate(day) }}</div>
            <div class="mt-1 text-xs text-gray-400">{{ getPlaceCountForDay(day) }}개 장소</div>
          </button>
        </div>

        <!-- 확인/취소 버튼 -->
        <div class="flex gap-2 pt-2">
          <Button variant="outline" class="flex-1" @click="closeModal">취소</Button>
          <Button
            class="bg-bold hover:bg-bold flex-1 text-white"
            :disabled="selectedDay === null"
            @click="confirmSelection"
          >
            추가
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePlanStore } from '@/stores/plan';
import type { PlaceResult } from '@/composables/plan/usePlaceSearch';

interface Props {
  open: boolean;
  place: PlaceResult | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'confirm': [day: number, place: PlaceResult];
}>();

const planStore = usePlanStore();

// Local state
const isOpen = ref(props.open);
const selectedDay = ref<number | null>(null);

// Computed
const travelDays = computed(() => {
  return Array.from({ length: planStore.getTravelDays }, (_, i) => i + 1);
});

// Watch props
watch(
  () => props.open,
  newValue => {
    isOpen.value = newValue;
    if (newValue) {
      selectedDay.value = null; // 모달이 열릴 때마다 선택 초기화
    }
  }
);

watch(isOpen, newValue => {
  emit('update:open', newValue);
});

// Methods
function formatDayDate(day: number): string {
  if (planStore.selectedDateRange.start) {
    const startDate = new Date(planStore.selectedDateRange.start);
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + (day - 1));

    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const date = String(targetDate.getDate()).padStart(2, '0');
    return `${month}.${date}`;
  }
  return '';
}

function getPlaceCountForDay(day: number): number {
  return planStore.dayPlans[day]?.places?.length || 0;
}

function confirmSelection() {
  if (selectedDay.value !== null && props.place) {
    emit('confirm', selectedDay.value, props.place);
    closeModal();
  }
}

function closeModal() {
  isOpen.value = false;
  selectedDay.value = null;
}
</script>
