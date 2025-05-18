<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { usePlaceSearch, usePlanMap } from '@/composables/plan';
import { Command, CommandInput } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { XIcon, PlusIcon } from 'lucide-vue-next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PlaceResult } from '@/composables/plan/usePlaceSearch';

// 1. 지도 초기화
const {
  initMap,
  moveToLocation,
  addMarker,
  addMarkerForDay,
  removeMarkerForDay,
  showMarkerForSearchClick,
} = usePlanMap();
onMounted(() => initMap());

// 2. 장소 검색 훅
const { query, places, isLoading, searchPlaces } = usePlaceSearch();

// 3. 검색 결과 클릭 시 지도 이동 + 마커 추가
function handlePlaceClick(place: PlaceResult) {
  moveToLocation(place.location);
  addMarker({
    position: place.location,
    label: place.name,
  });
  showMarkerForSearchClick(place, dayPlans);
}

const dayPlans = reactive<Record<number, PlaceResult[]>>({});

const selectedPlace = ref<PlaceResult | null>(null);
const isModalOpen = ref(false);
const dayLength = ref(4); // 여행 일 수 (예: day1~day3)

watch(
  dayLength,
  newLen => {
    // 기존 dayPlans에 없는 day만 초기화
    for (let day = 1; day <= newLen; day++) {
      if (!dayPlans[day]) {
        dayPlans[day] = [];
      }
    }

    // dayLength보다 긴 day는 삭제해도 된다면 이 로직도 가능
    for (const key of Object.keys(dayPlans)) {
      const day = Number(key);
      if (day > newLen) {
        delete dayPlans[day];
      }
    }
  },
  { immediate: true }
);

function removePlaceFromDay(day: number, placeId: string) {
  dayPlans[day] = dayPlans[day].filter(p => p.placeId !== placeId);
  removeMarkerForDay(day, placeId);
}

function openDaySelectModal(place: PlaceResult) {
  selectedPlace.value = place;
  isModalOpen.value = true;
}

function confirmDaySelection(day: number) {
  if (!selectedPlace.value) return;

  const place = selectedPlace.value;

  if (!dayPlans[day]) dayPlans[day] = [];
  dayPlans[day].push(place);

  addMarkerForDay(day, place, dayPlans[day].length);

  selectedPlace.value = null;
  isModalOpen.value = false;
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-start gap-4 bg-gray-100 p-6">
    <div class="flex w-full flex-col items-center gap-5">
      <div class="flex w-full items-center gap-2">
        <Command>
          <CommandInput v-model="query" placeholder="장소 검색..." @keyup.enter="searchPlaces" />
        </Command>
        <Button :disabled="isLoading" @click="searchPlaces">
          {{ isLoading ? '검색 중...' : '검색' }}
        </Button>
      </div>
      <ScrollArea class="w-full max-w-2xl">
        <div v-for="day in Object.keys(dayPlans).map(Number)" :key="day">
          <div class="text-lg font-semibold">{{ day }}일차</div>
          <ul>
            <li
              v-for="(place, index) in dayPlans[day]"
              :key="place.placeId"
              class="cursor-pointer"
              @click="() => handlePlaceClick(place)"
            >
              {{ index + 1 }}. {{ place.name }} ({{ place.address }})
              <button @click="removePlaceFromDay(Number(day), place.placeId)" class="ml-2">
                <XIcon class="h-4 w-4 text-gray-400 hover:text-red-500" />
              </button>
            </li>
          </ul>
        </div>
      </ScrollArea>

      <ScrollArea class="h-[400px] w-full">
        <div
          v-for="place in places"
          :key="place.name + place.address"
          class="mb-2 flex cursor-pointer items-center gap-4 rounded-lg border bg-white p-3 shadow hover:bg-gray-100"
          @click="handlePlaceClick(place)"
        >
          <img
            v-if="place.photoUrl"
            loading="lazy"
            :src="place.photoUrl"
            alt="장소 이미지"
            class="h-24 w-24 rounded object-cover"
          />

          <div>
            <div class="text-lg font-semibold">{{ place.name }}</div>
            <div class="text-sm text-gray-600">{{ place.address }}</div>
          </div>
          <Button size="sm" variant="outline" @click="() => openDaySelectModal(place)">
            <PlusIcon class="h-4 w-4" />
          </Button>
        </div>
      </ScrollArea>
    </div>

    <div id="map" class="mt-6 h-[400px] w-full rounded-lg shadow" />
  </div>

  <Dialog v-model:open="isModalOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>어느 Day에 추가할까요?</DialogTitle>
      </DialogHeader>

      <div class="grid grid-cols-3 gap-2">
        <Button
          v-for="day in dayLength"
          :key="day"
          variant="secondary"
          @click="() => confirmDaySelection(day)"
        >
          Day {{ day }}
        </Button>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="ghost">취소</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
