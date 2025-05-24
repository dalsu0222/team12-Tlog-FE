<template>
  <Dialog v-model:open="isOpen">
    <DialogContent :class="getDialogClass()">
      <DialogHeader>
        <DialogTitle class="text-center text-lg font-bold">
          숙박하실 날짜를 선택해주세요.
        </DialogTitle>
        <p v-if="place" class="text-center text-sm">
          {{ place.name }}
        </p>
      </DialogHeader>

      <div class="space-y-4">
        <!-- 날짜 선택 영역 -->
        <div class="grid gap-3" :class="getGridClass()">
          <div
            v-for="day in travelDays"
            :key="day"
            class="relative cursor-pointer"
            @click="() => toggleDaySelection(day)"
          >
            <!-- 날짜 표시 -->
            <div
              class="bg-bold mb-2 rounded-full px-3 py-1 text-center text-sm font-medium text-white"
            >
              {{ formatDayLabel(day) }}
            </div>

            <!-- 카드 영역 -->
            <div
              class="relative rounded-lg border-2 transition-all"
              :class="[
                getCardSizeClass(),
                isDaySelected(day)
                  ? 'border-bold bg-secondary'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300',
              ]"
            >
              <!-- 숙소가 이미 선택된 경우 -->
              <div v-if="shouldShowAccommodationPreview(day)" class="h-full w-full">
                <img
                  v-if="getPreviewImageForDay(day)"
                  :src="getPreviewImageForDay(day)"
                  alt="숙소 이미지"
                  class="h-full w-full object-cover"
                />
                <div class="bg-opacity-50 absolute right-0 bottom-0 left-0 bg-black p-1">
                  <p class="truncate text-xs text-white">
                    {{ getPreviewNameForDay(day) }}
                  </p>
                </div>
              </div>

              <!-- 빈 상태 -->
              <div v-else class="flex h-full items-center justify-center">
                <div class="text-center">
                  <div class="text-2xl">+</div>
                  <div class="text-xs text-gray-400">숙박 선택</div>
                </div>
              </div>

              <!-- 선택됨 표시 -->
              <div
                v-if="isDaySelected(day)"
                class="bg-bold absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs text-white shadow-lg"
              >
                ✓
              </div>
            </div>
          </div>
        </div>

        <!-- 전체 선택 버튼 -->
        <Button
          variant="outline"
          class="border-bold text-bold hover:bg-secondary w-full"
          @click="selectAllDays"
        >
          전체 선택
        </Button>

        <!-- 확인 버튼 -->
        <Button
          class="bg-bold hover:bg-bold w-full text-white"
          @click="confirmSelection"
          :disabled="selectedDays.length === 0"
        >
          완료 ({{ selectedDays.length }}일 선택됨)
        </Button>
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
  'confirm': [days: number[], place: PlaceResult];
}>();

const planStore = usePlanStore();

// Local state
const isOpen = ref(props.open);
const selectedDays = ref<number[]>([]);

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
      selectedDays.value = []; // 모달이 열릴 때마다 선택 초기화
    }
  }
);

watch(isOpen, newValue => {
  emit('update:open', newValue);
});

// Methods
function isDaySelected(day: number): boolean {
  return selectedDays.value.includes(day);
}

function toggleDaySelection(day: number): void {
  if (isDaySelected(day)) {
    selectedDays.value = selectedDays.value.filter(d => d !== day);
  } else {
    selectedDays.value.push(day);
  }
}

function selectAllDays(): void {
  if (selectedDays.value.length === travelDays.value.length) {
    // 전체 선택 해제
    selectedDays.value = [];
  } else {
    // 전체 선택
    selectedDays.value = [...travelDays.value];
  }
}

function getPreviewImageForDay(day: number): string {
  // 현재 선택하려는 숙소가 해당 일차에 선택되었다면 그 숙소의 이미지
  if (props.place && isDaySelected(day)) {
    return props.place.photoUrl || '';
  }

  // 아니면 기존에 배정된 숙소의 이미지
  const accommodation = planStore.dayPlans[day]?.accommodation;
  return accommodation?.photoUrl || '';
}

function getPreviewNameForDay(day: number): string {
  // 현재 선택하려는 숙소가 해당 일차에 선택되었다면 그 숙소의 이름
  if (props.place && isDaySelected(day)) {
    const name = props.place.name;
    return name.length > 12 ? name.substring(0, 12) + '...' : name;
  }

  // 아니면 기존에 배정된 숙소의 이름
  const accommodation = planStore.dayPlans[day]?.accommodation;
  if (!accommodation) return '';

  return accommodation.name.length > 12
    ? accommodation.name.substring(0, 12) + '...'
    : accommodation.name;
}

function shouldShowAccommodationPreview(day: number): boolean {
  // 현재 선택하려는 숙소가 해당 일차에 선택되었다면 그 숙소의 이미지를 보여줌
  if (props.place && isDaySelected(day)) {
    return true;
  }

  // 아니면 기존에 배정된 숙소가 있다면 그 숙소의 이미지를 보여줌
  return planStore.hasAccommodationForDay(day);
}

function getCardSizeClass(): string {
  const dayCount = travelDays.value.length;

  if (dayCount <= 6) {
    return 'aspect-square';
  } else if (dayCount <= 8) {
    return 'aspect-[4/3]';
  } else {
    return 'aspect-[3/2]';
  }
}

function getDialogClass(): string {
  const dayCount = travelDays.value.length;

  if (dayCount <= 6) {
    return 'max-w-lg';
  } else if (dayCount <= 8) {
    return 'max-w-xl';
  } else {
    return 'max-w-2xl';
  }
}

function getGridClass(): string {
  const dayCount = travelDays.value.length;

  if (dayCount <= 3) {
    return 'grid-cols-3';
  } else if (dayCount <= 6) {
    return 'grid-cols-3';
  } else if (dayCount <= 8) {
    return 'grid-cols-4';
  } else {
    return 'grid-cols-5';
  }
}

function formatDayLabel(day: number): string {
  if (planStore.selectedDateRange.start) {
    const startDate = new Date(planStore.selectedDateRange.start);
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + (day - 1));

    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const date = String(targetDate.getDate()).padStart(2, '0');
    return `${month}.${date}`;
  }
  return `Day ${day}`;
}

function confirmSelection(): void {
  if (selectedDays.value.length > 0 && props.place) {
    emit('confirm', selectedDays.value, props.place);
    closeModal();
  }
}

function closeModal(): void {
  isOpen.value = false;
  selectedDays.value = [];
}
</script>
