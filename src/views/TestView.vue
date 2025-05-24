<template>
  <div class="relative h-screen w-screen overflow-hidden">
    <!-- 전체 레이아웃 -->
    <div class="flex h-full">
      <!-- Stepper 영역 -->
      <CustomStepper />

      <!-- 내용 영역 -->
      <div class="relative w-[400px] overflow-y-auto bg-white p-8">
        <Step1DateSetting v-if="planStore.currentStep === 1" />
        <Step2FriendInvite v-else-if="planStore.currentStep === 2" />
        <Step3AccommodationSetting
          v-else-if="planStore.currentStep === 3"
          @accommodation-click="handlePlaceClick"
          @remove-accommodation="handleRemovePlace"
        />
        <Step4PlaceSearch
          v-else-if="planStore.currentStep === 4"
          @place-click="handlePlaceClick"
          @remove-place="handleRemovePlace"
        />
      </div>

      <!-- Drawer + 토글 버튼 (Step 3, 4에서만 표시) -->
      <div
        v-if="planStore.isDrawerVisible"
        class="flex items-center transition-all duration-400 ease-in-out"
        :style="{
          width: planStore.drawerOpen ? '350px' : '0px',
          minWidth: planStore.drawerOpen ? '350px' : '0px',
          overflow: 'hidden',
        }"
      >
        <div
          class="h-full w-[350px] bg-white shadow-lg transition-all duration-400 ease-in-out"
          :style="{
            opacity: planStore.drawerOpen && planStore.showDrawerContent ? 1 : 0,
            transform: planStore.drawerOpen ? 'translateX(0)' : 'translateX(-30px)',
            pointerEvents: planStore.drawerOpen ? 'auto' : 'none',
          }"
        >
          <div v-if="planStore.showDrawerContent" class="flex h-full flex-col">
            <!-- Step 3용 Drawer 내용 (숙소 검색) -->
            <Step3AccommodationDrawer
              v-if="planStore.currentStep === 3"
              ref="accommodationDrawerRef"
              :city-name="cityName"
              @place-click="handlePlaceClick"
              @open-day-select-modal="openDaySelectModal"
            />

            <!-- Step 4용 Drawer 내용 (관광지 검색) -->
            <Step4PlaceDrawer
              v-if="planStore.currentStep === 4"
              ref="placeDrawerRef"
              :city-name="cityName"
              @place-click="handlePlaceClick"
              @open-day-select-modal="openDaySelectModal"
            />
          </div>
        </div>
      </div>

      <!-- 토글 버튼 (Step 3, 4에서만 표시) -->
      <div
        v-if="planStore.isDrawerVisible"
        class="bg-bold relative flex flex-col items-center justify-center"
      >
        <button
          class="absolute left-0 h-10 rounded-r-md bg-white px-2 py-2 text-gray-400"
          @click="planStore.toggleDrawer()"
          style="z-index: 11"
        >
          <ChevronLeft v-if="planStore.drawerOpen" class="h-5 w-5" />
          <ChevronRight v-else class="h-5 w-5" />
        </button>
      </div>

      <!-- 지도 영역 -->
      <div id="map" class="flex-1 transition-all duration-300">
        <!-- 지도가 여기에 렌더링됩니다 -->
      </div>
    </div>
  </div>

  <!-- 일차 선택 모달 -->
  <Dialog v-model:open="isModalOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {{
            selectedPlace && isAccommodationPlace(selectedPlace)
              ? '숙소를 어느 Day에 추가할까요?'
              : '어느 Day에 추가할까요?'
          }}
        </DialogTitle>
        <p
          v-if="selectedPlace && isAccommodationPlace(selectedPlace)"
          class="text-sm text-orange-600"
        >
          ⚠️ 각 일차별로 숙소는 최대 1개만 선택할 수 있습니다.
        </p>
      </DialogHeader>

      <div class="grid grid-cols-3 gap-2">
        <Button
          v-for="day in planStore.getTravelDays"
          :key="day"
          :variant="
            planStore.hasAccommodationForDay(day) &&
            selectedPlace &&
            isAccommodationPlace(selectedPlace)
              ? 'outline'
              : 'secondary'
          "
          :disabled="
            planStore.hasAccommodationForDay(day) &&
            selectedPlace &&
            isAccommodationPlace(selectedPlace)
          "
          @click="() => confirmDaySelection(day)"
          class="relative"
        >
          Day {{ day }}
          <span
            v-if="
              planStore.hasAccommodationForDay(day) &&
              selectedPlace &&
              isAccommodationPlace(selectedPlace)
            "
            class="absolute -top-1 -right-1 text-xs"
          >
            🏨
          </span>
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

<script setup lang="ts">
import { watch, onMounted, ref } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { usePlanStore } from '@/stores/plan';
import { useRoute } from 'vue-router';
import { usePlanMap } from '@/composables/plan';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import type { PlaceResult } from '@/composables/plan/usePlaceSearch';

// 컴포넌트들 import
import {
  CustomStepper,
  Step1DateSetting,
  Step2FriendInvite,
  Step3AccommodationSetting,
  Step4PlaceSearch,
} from '@/components/plan';

// 새로 분리한 Drawer 컴포넌트들 import
import Step3AccommodationDrawer from '@/components/plan/Step3AccommodationDrawer.vue';
import Step4PlaceDrawer from '@/components/plan/Step4PlaceDrawer.vue';

const planStore = usePlanStore();
const route = useRoute();

// 라우트 파라미터에서 cityId와 cityName 가져오기
const cityName = ref((route.params.cityName as string) || '서울');

// 지도 초기화
const { initMap, moveToLocation, addMarkerForDay, removeMarkerForDay, showMarkerForSearchClick } =
  usePlanMap();

// 모달 관련 상태
const selectedPlace = ref<PlaceResult | null>(null);
const isModalOpen = ref(false);

// Drawer 컴포넌트 ref
const accommodationDrawerRef = ref<InstanceType<typeof Step3AccommodationDrawer>>();
const placeDrawerRef = ref<InstanceType<typeof Step4PlaceDrawer>>();

// 숙소인지 확인하는 함수
function isAccommodationPlace(place: PlaceResult): boolean {
  if (!place.types) return false;
  const accommodationTypes = ['lodging', 'hotel', 'motel', 'resort', 'campground', 'rv_park'];
  return place.types.some(type => accommodationTypes.includes(type));
}

// 지도 초기화 및 도시 위치로 이동
onMounted(async () => {
  const map = await initMap();

  // cityName을 기반으로 위치 검색 및 이동
  if (cityName.value) {
    try {
      const { Geocoder } = (await google.maps.importLibrary(
        'geocoding'
      )) as google.maps.GeocodingLibrary;
      const geocoder = new Geocoder();

      const response = await geocoder.geocode({
        address: cityName.value + ', South Korea',
        region: 'kr',
      });

      if (response.results.length > 0) {
        const location = response.results[0].geometry.location;
        moveToLocation(location);
        if (map) map.setZoom(12);
      }
    } catch (error) {
      console.error('도시 위치 검색 오류:', error);
    }
  }
});

// Watch for travel days changes to initialize dayPlans
watch(
  () => planStore.getTravelDays,
  () => {
    planStore.initializeDayPlans();
  },
  { immediate: true }
);

// 이벤트 핸들러들
function handlePlaceClick(place: PlaceResult) {
  moveToLocation(place.location);
  showMarkerForSearchClick(place, planStore.dayPlans);
}

function handleRemovePlace(day: number, placeId: string) {
  planStore.removePlaceFromDay(day, placeId);
  removeMarkerForDay(day, placeId);
}

function openDaySelectModal(place: PlaceResult) {
  selectedPlace.value = place;
  isModalOpen.value = true;
}

function confirmDaySelection(day: number) {
  if (!selectedPlace.value) return;

  const place = selectedPlace.value;

  if (isAccommodationPlace(place)) {
    if (planStore.hasAccommodationForDay(day)) {
      if (confirm(`${day}일차에 이미 숙소가 있습니다. 교체하시겠습니까?`)) {
        const existingAccommodation = planStore.dayPlans[day].accommodation;
        if (existingAccommodation) {
          removeMarkerForDay(day, existingAccommodation.placeId);
        }
        planStore.addAccommodationToDay(day, place);
        addMarkerForDay(day, place, 'accommodation');
      }
    } else {
      planStore.addAccommodationToDay(day, place);
      addMarkerForDay(day, place, 'accommodation');
    }
  } else {
    planStore.addPlaceToDay(day, place);
    addMarkerForDay(day, place, planStore.dayPlans[day].places.length);
  }

  selectedPlace.value = null;
  isModalOpen.value = false;
}

// Step 변경 감지
watch(
  () => planStore.currentStep,
  (newStep, oldStep) => {
    if (newStep >= 3 && oldStep < 3) {
      planStore.drawerOpen = true;
    } else if (newStep < 3) {
      planStore.drawerOpen = false;
      planStore.showDrawerContent = false;
    }

    // Drawer 컴포넌트의 초기 데이터 로드
    if (newStep === 3) {
      setTimeout(() => {
        accommodationDrawerRef.value?.loadDefaultAccommodations();
      }, 300);
    }

    if (newStep === 4) {
      setTimeout(() => {
        placeDrawerRef.value?.loadDefaultAttractions();
      }, 300);
    }
  }
);

// drawer 상태 변경 시 애니메이션 처리
watch(
  () => planStore.drawerOpen,
  val => {
    if (val) {
      setTimeout(() => {
        planStore.showDrawerContent = true;
      }, 200);
    } else {
      planStore.showDrawerContent = false;
    }
  }
);
</script>

<style scoped>
.whitespace-pre-line {
  white-space: pre-line;
}
</style>
