<template>
  <div class="relative h-screen w-screen overflow-hidden">
    <!-- 로딩 상태 -->
    <div
      v-if="loading"
      class="bg-opacity-90 absolute inset-0 z-50 flex items-center justify-center bg-white"
    >
      <div class="flex flex-col items-center gap-3">
        <div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p class="text-gray-600">여행 계획을 불러오는 중...</p>
      </div>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="absolute inset-0 z-50 flex items-center justify-center bg-white">
      <div class="text-center">
        <div class="mb-2 font-semibold text-red-600">오류가 발생했습니다</div>
        <p class="mb-4 text-sm text-gray-600">{{ error }}</p>
        <button
          @click="$router.go(-1)"
          class="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
        >
          이전으로 돌아가기
        </button>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div v-else class="flex h-full">
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
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted, ref, nextTick, computed, onUnmounted } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { usePlanStore } from '@/stores/plan';
import { useRoute } from 'vue-router';
import { usePlanMap } from '@/composables/plan';
import { getCityMapConfig, defaultMapConfig } from '@/constants/cityMapConfig';
import type { PlaceResult } from '@/composables/plan/usePlaceSearch';
import { api } from '@/services/api';
import type { ApiResponse } from '@/services/api/types';

// 컴포넌트들 import (PlanView.vue와 동일)
import {
  CustomStepper,
  Step1DateSetting,
  Step2FriendInvite,
  Step3AccommodationSetting,
  Step4PlaceSearch,
} from '@/components/plan';

import Step3AccommodationDrawer from '@/components/plan/Step3AccommodationDrawer.vue';
import Step4PlaceDrawer from '@/components/plan/Step4PlaceDrawer.vue';
import AccommodationDaySelectModal from '@/components/plan/AccommodationDaySelectModal.vue';
import PlaceDaySelectModal from '@/components/plan/PlaceDaySelectModal.vue';
import { useAuthStore } from '@/stores/auth';
import { AxiosError } from 'axios';

const planStore = usePlanStore();
const route = useRoute();

// 로딩 및 에러 상태
const loading = ref(true);
const error = ref('');

// Trip Detail 인터페이스 (PlanDetail.vue와 동일)
interface Participant {
  userId: number;
  nickname: string;
}

interface Plan {
  planId: number;
  placeId: string;
  placeName: string;
  latitude: number;
  longitude: number;
  day: number;
  planOrder: number;
  placeTypeId: number;
  memo: string | null;
}

interface TripDetail {
  tripId: number;
  cityId: number;
  title: string;
  createAt: string;
  startDate: string;
  endDate: string;
  plans: Plan[];
  participants: Participant[];
}

// 라우트 파라미터에서 tripId 가져오기
const tripId = computed(() => route.params.id as string);

// 지도 관련
const {
  initMap,
  moveToLocation,
  addMarkerForDay,
  removeMarkerForDay,
  showMarkerForSearchClick,
  updateMarkersForDayPlan,
} = usePlanMap();

// 모달 관련 상태
const selectedAccommodationPlace = ref<PlaceResult | null>(null);
const selectedPlace = ref<PlaceResult | null>(null);
const isAccommodationModalOpen = ref(false);
const isPlaceModalOpen = ref(false);

// Drawer 컴포넌트 ref
const accommodationDrawerRef = ref<InstanceType<typeof Step3AccommodationDrawer>>();
const placeDrawerRef = ref<InstanceType<typeof Step4PlaceDrawer>>();

// 현재 도시의 지도 설정 (동적으로 설정됨)
const currentCityConfig = ref(defaultMapConfig);

// 여행 계획 데이터 로드
const loadTripData = async () => {
  try {
    loading.value = true;
    error.value = '';

    const response = await api.get<ApiResponse<TripDetail>>(`/api/trips/${tripId.value}/plan`);

    if (response.status === 200 && response.data.statusCode === 200) {
      if ('data' in response.data) {
        const tripDetail = response.data.data;
        const cityConfig = getCityMapConfig(tripDetail.cityId);
        const cityName = cityConfig?.cityKo || '알 수 없는 도시';

        // 1. planStore 초기화 (기존 데이터 제거)
        planStore.resetStore();

        // 2. 편집 모드 설정
        planStore.setEditMode(tripDetail.tripId, tripDetail.cityId, cityName);

        // 3. 도시 정보 설정
        if (cityConfig) {
          currentCityConfig.value = cityConfig;
        } else {
          currentCityConfig.value = {
            ...defaultMapConfig,
            cityId: tripDetail.cityId,
          };
        }

        // 4. 날짜 정보 설정
        planStore.setDateRange({
          start: new Date(tripDetail.startDate),
          end: new Date(tripDetail.endDate),
        });

        // 🆕 5. 참가자(친구) 정보 설정 - 본인 제외
        await loadExistingParticipants(tripDetail.participants);

        // 6. dayPlans 초기화
        planStore.initializeDayPlans();

        // 7. 기존 계획 데이터를 planStore에 설정
        await loadExistingPlans(tripDetail.plans);

        // 8. Step 4로 이동 (편집 모드이므로)
        planStore.setCurrentStep(4);

        console.log('여행 계획 데이터 로드 완료:', tripDetail);
        console.log('planStore.dayPlans:', planStore.dayPlans);
      }
    } else {
      error.value = response.data.message || '데이터를 불러올 수 없습니다.';
    }
  } catch (err) {
    console.error('여행 계획 로드 실패:', err);
    if (err instanceof AxiosError && err.response?.data?.message) {
      error.value = err.response.data.message;
    } else if (err instanceof AxiosError && err.response?.status === 401) {
      error.value = '로그인이 필요합니다.';
    } else if (err instanceof AxiosError && err.response?.status === 404) {
      error.value = '여행 계획을 찾을 수 없습니다.';
    } else {
      error.value = '네트워크 오류가 발생했습니다.';
    }
  } finally {
    loading.value = false;
  }
};

// 기존 계획을 planStore에 로드하는 함수
const loadExistingPlans = async (plans: Plan[]) => {
  // plans를 day별로 그룹핑
  const plansByDay: Record<number, Plan[]> = {};

  plans.forEach(plan => {
    if (!plansByDay[plan.day]) {
      plansByDay[plan.day] = [];
    }
    plansByDay[plan.day].push(plan);
  });

  // 각 일차별로 데이터 변환하여 설정
  for (const [day, dayPlans] of Object.entries(plansByDay)) {
    const dayNumber = Number(day);

    // planOrder 순서대로 정렬
    const sortedPlans = dayPlans.sort((a, b) => a.planOrder - b.planOrder);

    for (const plan of sortedPlans) {
      // Google Places API를 통해 상세 정보 가져오기 (옵션)
      const address = plan.memo || ''; // memo를 임시 주소로 사용하거나

      const placeResult: PlaceResult = {
        placeId: plan.placeId,
        name: plan.placeName,
        address: address,
        location: new google.maps.LatLng(plan.latitude, plan.longitude),
        types: getPlaceTypesFromId(plan.placeTypeId),
        rating: 0,
        userRatingsTotal: 0,
        // 편집 모드임을 표시하는 플래그 추가 (옵션)
        isFromExistingPlan: true,
      };

      // 중복 체크 - 이미 같은 placeId가 있는지 확인
      const existingAccommodation = planStore.dayPlans[dayNumber]?.accommodation;
      const existingPlaces = planStore.dayPlans[dayNumber]?.places || [];

      if (plan.placeTypeId === 1) {
        // 숙박시설 - 중복이 아닌 경우만 추가
        if (!existingAccommodation || existingAccommodation.placeId !== plan.placeId) {
          planStore.addAccommodationToDay(dayNumber, placeResult);
        }
      } else {
        // 일반 장소 - 중복이 아닌 경우만 추가
        const isDuplicate = existingPlaces.some(p => p.placeId === plan.placeId);
        if (!isDuplicate) {
          planStore.addPlaceToDay(dayNumber, placeResult);
        }
      }
    }
  }
};

// 🆕 기존 참가자 정보를 planStore에 로드하는 함수 추가
const loadExistingParticipants = async (participants: Participant[]) => {
  // 현재 로그인한 사용자 정보 가져오기 (authStore 사용)
  const authStore = useAuthStore();
  const currentUserId = Number(authStore.user?.userId);

  // 본인을 제외한 참가자들만 초대된 친구로 설정
  const invitedFriends = participants.filter(participant => participant.userId !== currentUserId);

  // planStore에 친구 정보 설정
  invitedFriends.forEach(participant => {
    planStore.addFriendWithId({
      userId: participant.userId,
      nickname: participant.nickname,
    });
  });

  console.log('기존 참가자 로드 완료:', invitedFriends);
};

// placeTypeId를 Google Maps types 배열로 변환하는 함수 (PlanDetail.vue와 동일)
const getPlaceTypesFromId = (placeTypeId: number): string[] => {
  const typeMap: Record<number, string[]> = {
    1: ['lodging'], // 숙박시설
    2: ['tourist_attraction'], // 관광지
    3: ['restaurant'], // 음식점
    4: ['cafe'], // 카페
    5: ['shopping_mall'], // 쇼핑
    6: ['establishment'], // 기타
  };
  return typeMap[placeTypeId] || ['establishment'];
};

// 지도 초기화 함수 (PlanView.vue와 동일하지만 currentCityConfig 사용)
const initializeMapForCity = async () => {
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

    // 3. 잠시 대기 후 기존 계획의 마커들을 지도에 표시
    // planStore 데이터가 완전히 로드된 후 마커 추가
    await nextTick(); // Vue의 DOM 업데이트 대기
    if (Object.keys(planStore.dayPlans).length > 0) {
      await addExistingMarkersToMap();
    }
  } catch (error) {
    console.error('지도 초기화 오류:', error);
  }
};

// 지오코딩 함수 (PlanView.vue와 동일)
const geocodeAndMoveToCity = async (map: google.maps.Map) => {
  try {
    const { Geocoder } = (await google.maps.importLibrary(
      'geocoding'
    )) as google.maps.GeocodingLibrary;
    const geocoder = new Geocoder();

    const searchKeyword =
      currentCityConfig.value.searchKeyword || `${currentCityConfig.value.cityEn}, South Korea`;

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
      const defaultLocation = new google.maps.LatLng(37.5665, 126.978);
      moveToLocation(defaultLocation);
      map.setZoom(12);
    }
  } catch (error) {
    console.error('지오코딩 오류:', error);
    const defaultLocation = new google.maps.LatLng(37.5665, 126.978);
    moveToLocation(defaultLocation);
    map.setZoom(12);
  }
};

// 기존 계획의 마커들을 지도에 추가하는 함수 (편집 모드용 - 간소화된 infoWindow)
const addExistingMarkersToMap = async () => {
  console.log('기존 마커 추가 시작, dayPlans:', planStore.dayPlans);

  // 기존 마커들을 모두 제거 (중복 방지)
  // 이 부분은 usePlanMap에서 clearAllMarkers 함수가 필요할 수 있음

  // planStore의 dayPlans를 순회하며 마커 추가
  for (const [day, dayPlan] of Object.entries(planStore.dayPlans)) {
    const dayNumber = Number(day);

    console.log(`Day ${dayNumber} 마커 추가:`, dayPlan);

    // 숙소 마커 추가 (간소화된 infoWindow 사용)
    if (dayPlan.accommodation) {
      console.log(`Day ${dayNumber} 숙소 마커 추가:`, dayPlan.accommodation.name);
      await addMarkerForDay(dayNumber, dayPlan.accommodation, 'accommodation', dayPlan, true);
    }

    // 일반 장소 마커들 추가 (간소화된 infoWindow 사용)
    for (let i = 0; i < dayPlan.places.length; i++) {
      const place = dayPlan.places[i];
      console.log(`Day ${dayNumber} 장소 ${i + 1} 마커 추가:`, place.name);
      await addMarkerForDay(dayNumber, place, i + 1, dayPlan, true);
    }
  }
};

// 이벤트 핸들러들 (편집 모드용 - 간소화된 infoWindow 사용)
function handlePlaceClick(place: PlaceResult) {
  moveToLocation(place.location);
  showMarkerForSearchClick(place, planStore.dayPlans, true); // useSimpleInfo = true
}

function handleRemovePlace(day: number, placeId: string) {
  planStore.removePlaceFromDay(day, placeId);
  removeMarkerForDay(day, placeId, planStore.dayPlans[day], true); // useSimpleInfo = true
}

function handleOrderChanged(day: number) {
  const dayPlan = planStore.dayPlans[day];
  if (dayPlan) {
    nextTick(() => {
      updateMarkersForDayPlan(day, planStore.dayPlans[day], true); // useSimpleInfo = true
    });
  }
}

function openAccommodationModal(place: PlaceResult) {
  selectedAccommodationPlace.value = place;
  isAccommodationModalOpen.value = true;
}

function openPlaceModal(place: PlaceResult) {
  selectedPlace.value = place;
  isPlaceModalOpen.value = true;
}

function handleAccommodationConfirm(days: number[], place: PlaceResult) {
  const hasExistingAccommodations = days.some(day => planStore.hasAccommodationForDay(day));

  if (hasExistingAccommodations) {
    if (!confirm('기존에 선택된 숙소들이 교체됩니다. 계속하시겠습니까?')) {
      return;
    }
  }

  days.forEach(day => {
    const existingAccommodation = planStore.dayPlans[day]?.accommodation;
    if (existingAccommodation) {
      removeMarkerForDay(day, existingAccommodation.placeId, planStore.dayPlans[day], true); // useSimpleInfo = true
    }

    planStore.addAccommodationToDay(day, place);
    addMarkerForDay(day, place, 'accommodation', planStore.dayPlans[day], true); // useSimpleInfo = true
  });

  selectedAccommodationPlace.value = null;
}

function handlePlaceConfirm(day: number, place: PlaceResult) {
  planStore.addPlaceToDay(day, place);
  addMarkerForDay(day, place, planStore.dayPlans[day].places.length, planStore.dayPlans[day], true); // useSimpleInfo = true
  selectedPlace.value = null;
}

// 컴포넌트 라이프사이클
onMounted(async () => {
  // 1. 여행 계획 데이터 로드
  await loadTripData();

  // 2. 로딩이 완료되면 지도 초기화
  if (!error.value) {
    await initializeMapForCity();
  }
});

// planStore 상태가 변경될 때 drawer 처리
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

// 컴포넌트 언마운트 시 planStore 초기화
onUnmounted(() => {
  // 편집 모드에서 나갈 때 상태 초기화
  planStore.resetStore();
});
</script>

<style scoped>
.whitespace-pre-line {
  white-space: pre-line;
}
</style>
