<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { api } from '@/services/api';
import type { ApiResponse } from '@/services/api/types';
import { AxiosError } from 'axios';
import { usePlanMap } from '@/composables/plan';
import { useEditLock } from '@/composables/plan';
import { getCityMapConfig, defaultMapConfig, calculateDynamicZoom } from '@/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DayPlan } from '@/stores/plan';
import type { PlaceResult } from '@/composables/plan/usePlaceSearch';

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { CalendarDays, MapPin, Users } from 'lucide-vue-next';
import { dayColors } from '@/composables/plan/usePlanMap';

import { Edit } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const props = defineProps<{ id: string }>();

// 편집 락 관리
const { checkEditStatus, currentOwner } = useEditLock();

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

const tripDetail = ref<TripDetail | null>(null);
const loading = ref(false);
const error = ref<string>('');
const editLoading = ref(false);

const router = useRouter();

// 편집 페이지로 이동하는 함수 (락 확인 포함)
const goToEditPage = async () => {
  if (!tripDetail.value) return;

  editLoading.value = true;

  try {
    // 편집 상태 확인
    const editStatus = await checkEditStatus(tripDetail.value.tripId);

    if (editStatus?.locked) {
      // 다른 사용자가 편집 중인 경우
      return;
    }
    // 편집 가능한 경우 편집 페이지로 이동
    router.push(`/plan/${tripDetail.value.tripId}/edit`);
  } catch (error) {
    console.error('편집 상태 확인 실패:', error);

    // 409 에러인 경우 편집 중이므로 페이지 이동하지 않음
    if (error instanceof AxiosError && error.response?.status === 409) {
      alert('다른 사용자가 편집 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 기타 오류가 발생한 경우에만 편집 페이지로 이동 (편집 페이지에서 다시 확인)
    router.push(`/plan/${tripDetail.value.tripId}/edit`);
  } finally {
    editLoading.value = false;
  }
};

// 편집 가능 여부
const canEdit = computed(() => {
  return currentOwner.value === null;
});

// 지도 관련 - 포커싱 옵션 추가
const { initMap, addMarkerForDay, moveToLocation, showMarkerForSearchClick } = usePlanMap();

// 현재 도시의 지도 설정 가져오기
const currentCityConfig = computed(() => {
  if (!tripDetail.value) return defaultMapConfig;

  const config = getCityMapConfig(tripDetail.value.cityId);
  if (config) {
    return config;
  }

  // cityId에 해당하는 설정이 없으면 기본 설정 반환
  return defaultMapConfig;
});

// 계산된 속성들
const totalDays = computed(() => {
  if (!tripDetail.value) return 0;
  const start = new Date(tripDetail.value.startDate);
  const end = new Date(tripDetail.value.endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
});

const plansByDay = computed(() => {
  if (!tripDetail.value?.plans) return {};

  const grouped: Record<number, Plan[]> = {};

  tripDetail.value.plans.forEach(plan => {
    if (!grouped[plan.day]) {
      grouped[plan.day] = [];
    }
    grouped[plan.day].push(plan);
  });

  // 각 일자별로 planOrder 순서대로 정렬
  Object.keys(grouped).forEach(day => {
    grouped[Number(day)] = grouped[Number(day)].sort((a, b) => a.planOrder - b.planOrder);
  });

  return grouped;
});

// 유틸리티 함수들
const convertPlanToPlaceResult = (plan: Plan): PlaceResult => ({
  placeId: plan.placeId,
  name: plan.placeName,
  location: new google.maps.LatLng(plan.latitude, plan.longitude),
  address: '',
  types: getPlaceTypesFromId(plan.placeTypeId),
  rating: 0,
  userRatingsTotal: 0,
  description: plan.memo || getDefaultDescriptionForType(plan.placeTypeId),
});

const convertPlansToDayPlan = (plans: Plan[]): DayPlan => {
  const accommodations = plans.filter(p => p.placeTypeId === 1);
  const regularPlaces = plans.filter(p => p.placeTypeId !== 1);

  return {
    accommodation:
      accommodations.length > 0 ? convertPlanToPlaceResult(accommodations[0]) : undefined,
    places: regularPlaces.map(convertPlanToPlaceResult),
  };
};

const formatDateWithOptions = (date: Date, options: Intl.DateTimeFormatOptions) => {
  return date.toLocaleDateString('ko-KR', options);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return formatDateWithOptions(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
};

const getDateForDay = (day: number) => {
  if (!tripDetail.value) return '';

  const startDate = new Date(tripDetail.value.startDate);
  const targetDate = new Date(startDate);
  targetDate.setDate(startDate.getDate() + day - 1);

  return formatDateWithOptions(targetDate, {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
};

const getPlaceTypeText = (placeTypeId: number) => {
  const typeMap: Record<number, string> = {
    1: '숙박시설',
    2: '관광지',
    3: '음식점',
    4: '카페',
    5: '쇼핑',
    6: '기타',
  };
  return typeMap[placeTypeId] || '기타';
};

const getPlaceTypeColor = (placeTypeId: number) => {
  const colorMap: Record<number, string> = {
    1: 'bg-blue-100 text-blue-800',
    2: 'bg-green-100 text-green-800',
    3: 'bg-orange-100 text-orange-800',
    4: 'bg-purple-100 text-purple-800',
    5: 'bg-pink-100 text-pink-800',
    6: 'bg-gray-100 text-gray-800',
  };
  return colorMap[placeTypeId] || 'bg-gray-100 text-gray-800';
};

const getDayColor = (day: number) => {
  return dayColors[day - 1] || '#888';
};

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

const getDefaultDescriptionForType = (placeTypeId: number): string => {
  const descriptionMap: Record<number, string> = {
    1: '편안한 숙박을 위한 최적의 장소입니다.',
    2: '꼭 방문해보시길 추천하는 명소입니다.',
    3: '맛있는 음식을 즐길 수 있는 곳입니다.',
    4: '좋은 분위기에서 커피를 즐길 수 있습니다.',
    5: '다양한 쇼핑을 즐길 수 있는 장소입니다.',
    6: '방문할 만한 가치가 있는 장소입니다.',
  };
  return descriptionMap[placeTypeId] || '방문할 만한 가치가 있는 장소입니다.';
};

const focusOnPlace = (plan: Plan) => {
  const place = convertPlanToPlaceResult(plan);

  // plansByDay를 DayPlan 형식으로 변환
  const dayPlans: Record<number, DayPlan> = {};
  Object.entries(plansByDay.value).forEach(([day, plans]) => {
    dayPlans[Number(day)] = convertPlansToDayPlan(plans);
  });

  showMarkerForSearchClick(place, dayPlans, true);
};

// 여행 계획 조회 함수
const fetchTripDetail = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await api.get<ApiResponse<TripDetail>>(`/api/trips/${props.id}/plan`);

    if (response.status === 200 && response.data.statusCode === 200) {
      if ('data' in response.data) {
        tripDetail.value = response.data.data;
        console.log('여행 계획 데이터:', tripDetail.value);
      }
    } else {
      error.value = response.data.message || '데이터를 불러올 수 없습니다.';
    }
  } catch (err) {
    console.error('API 호출 실패:', err);

    if (err instanceof AxiosError && err.response?.data?.message) {
      error.value = err.response.data.message;
    } else if (err instanceof AxiosError && err.response?.status === 401) {
      error.value = '로그인이 필요합니다.';
    } else if (err instanceof AxiosError && err.response?.status === 400) {
      error.value = '잘못된 요청입니다.';
    } else {
      error.value = '네트워크 오류가 발생했습니다.';
    }
  } finally {
    loading.value = false;
  }
};

// 지도를 특정 도시로 초기화하는 함수 (PlanView.vue 참고)
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
      map.setZoom(calculateDynamicZoom(currentCityConfig.value));
    }

    // 2. 미리 설정된 좌표가 없으면 지오코딩으로 검색
    await geocodeAndMoveToCity(map);

    // 지도 초기화가 완료된 후 마커 추가
    await addMarkersToMap();
  } catch (error) {
    console.error('지도 초기화 오류:', error);
  }
};

// 지오코딩을 통해 도시 위치 검색하고 이동하는 함수 (PlanView.vue 참고)
const geocodeAndMoveToCity = async (map: google.maps.Map) => {
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
      map.setZoom(calculateDynamicZoom(currentCityConfig.value));
    } else {
      console.warn('지오코딩 결과가 없습니다. 기본 위치(서울)로 설정합니다.');
      // 기본값으로 서울 설정
      const defaultLocation = new google.maps.LatLng(37.5665, 126.978);
      moveToLocation(defaultLocation);
      map.setZoom(calculateDynamicZoom(defaultMapConfig));
    }
  } catch (error) {
    console.error('지오코딩 오류:', error);
    // 오류 발생시 기본값으로 서울 설정
    const defaultLocation = new google.maps.LatLng(37.5665, 126.978);
    moveToLocation(defaultLocation);
    map.setZoom(calculateDynamicZoom(defaultMapConfig));
  }
};

const addMarkersToMap = async () => {
  if (!tripDetail.value?.plans) return;

  // 각 day별로 마커 추가
  Object.entries(plansByDay.value).forEach(([day, plans]) => {
    const dayPlan = convertPlansToDayPlan(plans);

    // 숙소 마커 추가 (있는 경우)
    if (dayPlan.accommodation) {
      addMarkerForDay(Number(day), dayPlan.accommodation, 'accommodation', dayPlan, true);
    }

    // 일반 장소 마커들을 순서대로 추가
    dayPlan.places.forEach((place, index) => {
      addMarkerForDay(Number(day), place, index + 1, dayPlan, true);
    });
  });
};

// 컴포넌트 마운트 시 데이터 조회
onMounted(async () => {
  await fetchTripDetail();

  // 편집 상태 확인
  if (tripDetail.value) {
    await checkEditStatus(tripDetail.value.tripId);
  }
});

// tripDetail이 업데이트될 때 지도 초기화 및 마커 추가
watch(tripDetail, async newDetail => {
  if (newDetail) {
    // 도시별 지도 초기화
    await initializeMapForCity();
  }
});
</script>

<template>
  <div class="relative h-full w-screen overflow-hidden">
    <!-- Resizable 레이아웃 -->
    <ResizablePanelGroup direction="horizontal" class="h-full">
      <!-- 왼쪽 패널 - 여행 정보 -->
      <ResizablePanel :default-size="20" :min-size="20" :max-size="40">
        <div class="relative h-full overflow-y-auto bg-white">
          <!-- 헤더 -->
          <div class="border-b bg-white p-6">
            <div v-if="tripDetail" class="space-y-3">
              <!-- 제목과 편집 버튼을 한 줄에 배치 -->
              <div class="flex items-center justify-between">
                <h1 class="text-2xl font-bold text-gray-900">{{ tripDetail.title }}</h1>

                <!-- 편집 버튼 -->
                <Button
                  @click="goToEditPage"
                  :disabled="!canEdit || editLoading"
                  class="bg-bold hover:bg-bold-dark focus:ring-bold-dark flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <Edit class="h-4 w-4" />
                  <span v-if="editLoading">확인 중...</span>
                  <span v-else-if="!canEdit">편집 중</span>
                  <span v-else>편집</span>
                </Button>
              </div>

              <!-- 편집 상태 알림 -->
              <div
                v-if="!canEdit"
                class="flex items-center gap-2 rounded bg-amber-50 px-3 py-2 text-sm text-amber-600"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z"
                  ></path>
                </svg>
                <span>다른 사용자가 편집 중입니다</span>
              </div>

              <!-- 여행 기간 -->
              <div class="flex items-center gap-1 text-sm text-gray-500">
                <CalendarDays class="h-4 w-4" />
                <span>
                  {{ formatDate(tripDetail.startDate) }} - {{ formatDate(tripDetail.endDate) }}
                </span>
                <span class="ml-2 font-medium">{{ totalDays }}일</span>
              </div>

              <!-- 여행 참가자 -->
              <div v-if="tripDetail.participants?.length" class="flex items-center gap-2">
                <Users class="h-4 w-4 text-gray-500" />
                <div class="flex flex-wrap gap-1">
                  <Badge
                    v-for="participant in tripDetail.participants"
                    :key="participant.userId"
                    variant="secondary"
                    class="bg-blue-100 text-xs text-blue-800"
                  >
                    {{ participant.nickname }}
                  </Badge>
                </div>
                <span
                  v-if="tripDetail.participants.length === 1"
                  class="ml-1 text-xs text-gray-400"
                >
                  혼자 여행
                </span>
              </div>
            </div>

            <!-- 로딩 상태 -->
            <div v-else-if="loading" class="animate-pulse">
              <div class="mb-3 h-8 rounded bg-gray-200"></div>
              <div class="h-4 w-3/4 rounded bg-gray-200"></div>
            </div>
          </div>

          <!-- 콘텐츠 영역 -->
          <div class="p-6">
            <!-- 로딩 상태 -->
            <div v-if="loading" class="flex items-center justify-center py-12">
              <div class="flex flex-col items-center gap-3">
                <div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <p class="text-gray-600">여행 계획을 불러오는 중...</p>
              </div>
            </div>

            <!-- 에러 상태 -->
            <div v-else-if="error" class="flex items-center justify-center py-12">
              <div class="text-center">
                <div class="mb-2 font-semibold text-red-600">오류가 발생했습니다</div>
                <p class="text-sm text-gray-600">{{ error }}</p>
              </div>
            </div>

            <!-- 여행 일정 -->
            <div v-else-if="tripDetail">
              <div class="space-y-6">
                <div v-for="day in totalDays" :key="day">
                  <!-- Day 헤더 -->
                  <div class="mb-4 flex items-center justify-between">
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
                      {{ plansByDay[day]?.length || 0 }}개 장소
                    </div>
                  </div>

                  <!-- 장소 목록 -->
                  <div class="rounded-lg border border-gray-200 bg-white">
                    <div v-if="plansByDay[day]?.length" class="divide-y divide-gray-100">
                      <div
                        v-for="(plan, index) in plansByDay[day]"
                        :key="plan.planId"
                        class="group flex cursor-pointer items-center gap-3 p-4 transition-all duration-200 hover:bg-gray-50"
                        @click="focusOnPlace(plan)"
                      >
                        <!-- 순서 번호 -->
                        <div class="flex items-center">
                          <div
                            class="flex h-6 w-6 items-center justify-center rounded border-2 border-gray-300 bg-white text-xs font-bold text-gray-600"
                          >
                            {{ index + 1 }}
                          </div>
                        </div>

                        <!-- 장소 정보 -->
                        <div class="min-w-0 flex-1">
                          <div class="truncate font-semibold text-gray-900">
                            {{ plan.placeName }}
                          </div>
                          <div class="mt-1 flex items-center gap-2">
                            <Badge
                              :class="getPlaceTypeColor(plan.placeTypeId)"
                              variant="secondary"
                              class="text-xs"
                            >
                              {{ getPlaceTypeText(plan.placeTypeId) }}
                            </Badge>
                          </div>
                          <div
                            v-if="plan.memo"
                            class="mt-2 rounded bg-gray-50 p-2 text-sm text-gray-600"
                          >
                            {{ plan.memo }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 빈 상태 -->
                    <div
                      v-else
                      class="flex flex-col items-center justify-center py-8 text-gray-400"
                    >
                      <MapPin class="mb-2 h-8 w-8" />
                      <div class="text-sm">선택된 장소가 없습니다</div>
                    </div>
                  </div>
                </div>

                <div
                  v-if="!Object.keys(plansByDay).length"
                  class="flex flex-col items-center py-12 text-gray-400"
                >
                  <CalendarDays class="mb-3 h-12 w-12" />
                  <div class="text-lg font-medium">여행 계획이 없습니다</div>
                  <div class="text-sm">아직 등록된 여행 일정이 없어요</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ResizablePanel>

      <!-- 리사이즈 핸들 -->
      <ResizableHandle />

      <!-- 오른쪽 패널 - 지도 영역 -->
      <ResizablePanel :default-size="70" :min-size="50" :max-size="75">
        <div class="relative h-full">
          <div id="map" class="h-full w-full">
            <!-- 지도 로딩 오버레이 -->
            <div
              v-if="loading"
              class="bg-opacity-90 absolute inset-0 flex items-center justify-center bg-white"
            >
              <div class="flex flex-col items-center gap-3">
                <div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <p class="text-gray-600">지도를 불러오는 중...</p>
              </div>
            </div>
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</template>
