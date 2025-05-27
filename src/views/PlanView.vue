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
          @order-changed="handleOrderChanged"
        />
        <Step4PlaceSearch
          v-else-if="planStore.currentStep === 4"
          @place-click="handlePlaceClick"
          @remove-place="handleRemovePlace"
          @order-changed="handleOrderChanged"
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
              :city-name="currentCityConfig.cityKo"
              @place-click="handlePlaceClick"
              @open-day-select-modal="openAccommodationModal"
            />

            <!-- Step 4용 Drawer 내용 (관광지 검색) -->
            <Step4PlaceDrawer
              v-if="planStore.currentStep === 4"
              ref="placeDrawerRef"
              :city-name="currentCityConfig.cityKo"
              @place-click="handlePlaceClick"
              @open-day-select-modal="openPlaceModal"
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
          style="z-index: 11"
          @click="planStore.toggleDrawer()"
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

  <!-- Step 3용 숙소 선택 모달 -->
  <AccommodationDaySelectModal
    v-model:open="isAccommodationModalOpen"
    :place="selectedAccommodationPlace"
    @confirm="handleAccommodationConfirm"
  />

  <!-- Step 4용 장소 선택 모달 -->
  <PlaceDaySelectModal
    v-model:open="isPlaceModalOpen"
    :place="selectedPlace"
    @confirm="handlePlaceConfirm"
  />
</template>

<script setup lang="ts">
import { watch, onMounted, ref, nextTick, computed } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { usePlanStore } from '@/stores/plan';
import { useRoute } from 'vue-router';
import { usePlanMap } from '@/composables/plan';
import { getCityMapConfig, defaultMapConfig } from '@/constants/cityMapConfig';
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

// 분리된 모달 컴포넌트들 import
import AccommodationDaySelectModal from '@/components/plan/AccommodationDaySelectModal.vue';
import PlaceDaySelectModal from '@/components/plan/PlaceDaySelectModal.vue';

const planStore = usePlanStore();
const route = useRoute();

// 라우트 파라미터에서 도시 정보 가져오기
const cityId = ref<number>(parseInt(route.params.cityId as string) || 1);
const cityKo = ref<string>((route.params.cityKo as string) || '서울');
const cityEn = ref<string>((route.params.cityEn as string) || 'Seoul');

// 현재 도시의 지도 설정 가져오기
const currentCityConfig = computed(() => {
  const config = getCityMapConfig(cityId.value);
  if (config) {
    return config;
  }

  // cityId에 해당하는 설정이 없으면 라우트 파라미터 정보로 기본 설정 생성
  return {
    ...defaultMapConfig,
    cityId: cityId.value,
    cityKo: cityKo.value,
    cityEn: cityEn.value,
    searchKeyword: `${cityEn.value}, South Korea`,
  };
});

// 지도 초기화
const {
  initMap,
  moveToLocation,
  addMarkerForDay,
  removeMarkerForDay,
  showMarkerForSearchClick,
  updateMarkersForDayPlan,
} = usePlanMap();

// 모달 관련 상태 - 분리됨
const selectedAccommodationPlace = ref<PlaceResult | null>(null);
const selectedPlace = ref<PlaceResult | null>(null);
const isAccommodationModalOpen = ref(false);
const isPlaceModalOpen = ref(false);

// Drawer 컴포넌트 ref
const accommodationDrawerRef = ref<InstanceType<typeof Step3AccommodationDrawer>>();
const placeDrawerRef = ref<InstanceType<typeof Step4PlaceDrawer>>();

// 지도를 특정 도시로 초기화하는 함수
async function initializeMapForCity() {
  try {
    const map = await initMap();
    if (!map) return;

    // 1. 미리 설정된 좌표가 있으면 바로 이동
    if (currentCityConfig.value.center) {
      const location = new google.maps.LatLng(
        currentCityConfig.value.center.lat,
        currentCityConfig.value.center.lng
      );
      moveToLocation(location);
      map.setZoom(currentCityConfig.value.zoom);
    }

    // 2. 미리 설정된 좌표가 없으면 지오코딩으로 검색
    await geocodeAndMoveToCity(map);
  } catch (error) {
    console.error('지도 초기화 오류:', error);
  }
}

// 지오코딩을 통해 도시 위치 검색하고 이동하는 함수
async function geocodeAndMoveToCity(map: google.maps.Map) {
  try {
    const { Geocoder } = (await google.maps.importLibrary(
      'geocoding'
    )) as google.maps.GeocodingLibrary;
    const geocoder = new Geocoder();

    const searchKeyword =
      currentCityConfig.value.searchKeyword || `${currentCityConfig.value.cityEn}, South Korea`;

    // 지오코드 이용
    const response = await geocoder.geocode({
      address: searchKeyword,
      region: 'kr',
    });

    if (response.results.length > 0) {
      const location = response.results[0].geometry.location;
      moveToLocation(location);
      map.setZoom(currentCityConfig.value.zoom || 12);
    } else {
      console.warn('지오코딩 결과가 없습니다. 기본 위치(서울)로 설정합니다.');
      // 기본값으로 서울 설정
      const defaultLocation = new google.maps.LatLng(37.5665, 126.978);
      moveToLocation(defaultLocation);
      map.setZoom(12);
    }
  } catch (error) {
    console.error('지오코딩 오류:', error);
    // 오류 발생시 기본값으로 서울 설정
    const defaultLocation = new google.maps.LatLng(37.5665, 126.978);
    moveToLocation(defaultLocation);
    map.setZoom(12);
  }
}

// 컴포넌트 마운트시 지도 초기화
onMounted(async () => {
  await initializeMapForCity();
});

// 라우트 파라미터 변경 감지 (도시 변경시)
watch(
  () => route.params,
  newParams => {
    if (newParams.cityId) {
      cityId.value = parseInt(newParams.cityId as string) || 1;
      cityKo.value = (newParams.cityKo as string) || '서울';
      cityEn.value = (newParams.cityEn as string) || 'Seoul';

      // 도시가 변경되면 지도를 새로운 도시로 이동
      initializeMapForCity();
    }
  },
  { deep: true }
);

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
  // dayPlan 전달 추가
  removeMarkerForDay(day, placeId, planStore.dayPlans[day]);
}

// 🆕 순서 변경 핸들러 - 드래그 앤 드롭으로 순서가 바뀔 때 호출
function handleOrderChanged(day: number) {
  // 해당 일차의 DayPlan을 가져와서 지도 업데이트
  const dayPlan = planStore.dayPlans[day];
  if (dayPlan) {
    // setTimeout 사용 지양하고 Vue의 nextTick을 사용
    // 반응성 업데이트가 완료된 후 실행
    nextTick(() => {
      updateMarkersForDayPlan(day, planStore.dayPlans[day]);
    });
  }
}

// Step 3용 숙소 모달 열기
function openAccommodationModal(place: PlaceResult) {
  selectedAccommodationPlace.value = place;
  isAccommodationModalOpen.value = true;
}

// Step 4용 장소 모달 열기
function openPlaceModal(place: PlaceResult) {
  selectedPlace.value = place;
  isPlaceModalOpen.value = true;
}

// Step 3용 숙소 확인 핸들러
function handleAccommodationConfirm(days: number[], place: PlaceResult) {
  const hasExistingAccommodations = days.some(day => planStore.hasAccommodationForDay(day));

  if (hasExistingAccommodations) {
    if (!confirm('기존에 선택된 숙소들이 교체됩니다. 계속하시겠습니까?')) {
      return;
    }
  }

  // 선택된 모든 일차에 숙소 배정
  days.forEach(day => {
    // 기존 숙소가 있다면 마커 제거
    const existingAccommodation = planStore.dayPlans[day]?.accommodation;
    if (existingAccommodation) {
      removeMarkerForDay(day, existingAccommodation.placeId, planStore.dayPlans[day]);
    }

    // 새 숙소 추가
    planStore.addAccommodationToDay(day, place);
    // dayPlan 전달 추가
    addMarkerForDay(day, place, 'accommodation', planStore.dayPlans[day]);
  });

  selectedAccommodationPlace.value = null;
}

// Step 4용 장소 확인 핸들러
function handlePlaceConfirm(day: number, place: PlaceResult) {
  planStore.addPlaceToDay(day, place);
  // dayPlan 전달 추가
  addMarkerForDay(day, place, planStore.dayPlans[day].places.length, planStore.dayPlans[day]);
  selectedPlace.value = null;
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
