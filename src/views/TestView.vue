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
        <Step3AccommodationSetting v-else-if="planStore.currentStep === 3" />
        <Step4PlaceSearch v-else-if="planStore.currentStep === 4" />

        <!-- Day별 선택된 장소 목록 (Step 3, 4에서만 표시) -->
        <div v-if="planStore.currentStep >= 3" class="mt-6">
          <h3 class="mb-3 text-lg font-semibold">선택한 장소</h3>
          <ScrollArea class="h-[300px]">
            <div v-for="day in Object.keys(dayPlans).map(Number)" :key="day" class="mb-4">
              <div class="mb-2 text-sm font-medium">{{ day }}일차</div>
              <ul class="space-y-2">
                <li
                  v-for="(place, index) in dayPlans[day]"
                  :key="place.placeId"
                  class="flex items-center justify-between rounded-md border p-2 text-sm"
                >
                  <div @click="handlePlaceClick(place)" class="flex-1 cursor-pointer">
                    <div class="font-medium">{{ index + 1 }}. {{ place.name }}</div>
                    <div class="text-xs text-gray-500">{{ place.address }}</div>
                  </div>
                  <button
                    @click="removePlaceFromDay(day, place.placeId)"
                    class="ml-2 rounded-full p-1 hover:bg-gray-100"
                  >
                    <XIcon class="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </button>
                </li>
              </ul>
            </div>
            <div
              v-if="!Object.keys(dayPlans).length || !Object.values(dayPlans).flat().length"
              class="py-8 text-center text-gray-400"
            >
              아직 선택된 장소가 없습니다
            </div>
          </ScrollArea>
        </div>
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
            <div v-if="planStore.currentStep === 3" class="flex-1 overflow-auto p-4">
              <h3 class="text-lg font-semibold">{{ cityName }} 숙소 추천</h3>
              <p class="mb-4 text-sm text-gray-500">{{ cityName }}에서 이용할 숙소를 찾아보세요</p>

              <!-- 검색바 -->
              <div class="mb-4">
                <div class="flex gap-2">
                  <input
                    v-model="accommodationQuery"
                    type="text"
                    placeholder="숙소명, 키워드 입력..."
                    class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    @keyup.enter="searchAccommodations"
                  />
                  <Button @click="searchAccommodations" :disabled="isLoading">
                    {{ isLoading ? '검색 중...' : '검색' }}
                  </Button>
                </div>
              </div>

              <!-- 숙소 검색 결과 -->
              <ScrollArea class="h-[calc(100vh-250px)]">
                <div v-if="isLoading" class="py-8 text-center text-gray-400">검색 중입니다...</div>
                <div
                  v-else-if="accommodationPlaces.length === 0"
                  class="py-8 text-center text-gray-400"
                >
                  숙소 검색 결과가 없습니다
                </div>
                <div v-else>
                  <h4 class="mb-3 text-sm font-medium text-gray-500">
                    {{ accommodationQuery ? '검색 결과' : '추천 숙소' }}
                  </h4>
                  <div
                    v-for="place in accommodationPlaces"
                    :key="place.placeId"
                    class="mb-3 rounded-lg border p-3 hover:bg-gray-50"
                  >
                    <div class="flex items-start gap-3">
                      <img
                        v-if="place.photoUrl"
                        :src="place.photoUrl"
                        alt="숙소 이미지"
                        class="h-16 w-16 rounded object-cover"
                      />
                      <div class="flex-1">
                        <h4 class="font-medium">{{ place.name }}</h4>
                        <p class="text-xs text-gray-600">{{ place.address }}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        @click="openDaySelectModal(place)"
                        title="일정에 추가"
                      >
                        <PlusIcon class="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>

            <!-- Step 4용 Drawer 내용 (관광지 검색) -->
            <div v-if="planStore.currentStep === 4" class="flex-1 overflow-auto p-4">
              <h3 class="text-lg font-semibold">{{ cityName }} 관광 명소</h3>
              <p class="mb-4 text-sm text-gray-500">{{ cityName }}에서 방문할 장소를 찾아보세요</p>

              <!-- 검색바 -->
              <div class="mb-4">
                <div class="flex gap-2">
                  <input
                    v-model="query"
                    type="text"
                    placeholder="장소명, 키워드 입력..."
                    class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    @keyup.enter="searchPlacesWithCity"
                  />
                  <Button @click="searchPlacesWithCity" :disabled="isLoading">
                    {{ isLoading ? '검색 중...' : '검색' }}
                  </Button>
                </div>
              </div>

              <!-- 카테고리 필터 -->
              <div class="mb-4">
                <div class="grid grid-cols-4 gap-2">
                  <div
                    v-for="category in categories"
                    :key="category.value"
                    class="cursor-pointer rounded-lg border p-2 text-center text-xs transition-all hover:border-blue-300"
                    :class="{
                      'border-blue-500 bg-blue-50 text-blue-700':
                        selectedCategory === category.value,
                      'border-gray-200': selectedCategory !== category.value,
                    }"
                    @click="selectCategory(category.value)"
                  >
                    <div class="mb-1">{{ category.icon }}</div>
                    <div>{{ category.label }}</div>
                  </div>
                </div>
              </div>

              <!-- 장소 검색 결과 -->
              <ScrollArea class="h-[calc(100vh-300px)]">
                <div v-if="isLoading" class="py-8 text-center text-gray-400">검색 중입니다...</div>
                <div v-else-if="places.length === 0" class="py-8 text-center text-gray-400">
                  검색 결과가 없습니다
                </div>
                <div v-else>
                  <h4 class="mb-3 text-sm font-medium text-gray-500">
                    {{
                      query && selectedCategory
                        ? '검색 결과'
                        : selectedCategory
                          ? `${cityName} ${categories.find(c => c.value === selectedCategory)?.label}`
                          : '인기 관광지'
                    }}
                  </h4>
                  <div
                    v-for="place in places"
                    :key="place.placeId"
                    class="mb-3 rounded-lg border p-3 hover:bg-gray-50"
                  >
                    <div class="flex items-start gap-3">
                      <img
                        v-if="place.photoUrl"
                        :src="place.photoUrl"
                        alt="장소 이미지"
                        class="h-16 w-16 rounded object-cover"
                      />
                      <div class="flex-1">
                        <h4 class="font-medium">{{ place.name }}</h4>
                        <p class="text-xs text-gray-600">{{ place.address }}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        @click="openDaySelectModal(place)"
                        title="일정에 추가"
                      >
                        <PlusIcon class="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
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
          style="z-index: 51"
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
        <DialogTitle>어느 Day에 추가할까요?</DialogTitle>
      </DialogHeader>

      <div class="grid grid-cols-3 gap-2">
        <Button
          v-for="day in planStore.getTravelDays"
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

<script setup lang="ts">
import { watch, onMounted, ref, reactive } from 'vue';
import { ChevronLeft, ChevronRight, XIcon, PlusIcon } from 'lucide-vue-next';
import { usePlanStore } from '@/stores/plan';
import { useRoute } from 'vue-router';
import { usePlanMap, usePlaceSearch } from '@/composables/plan';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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

const planStore = usePlanStore();
const route = useRoute();

// 라우트 파라미터에서 cityId와 cityName 가져오기
const cityId = ref((route.params.cityId as string) || '');
const cityName = ref((route.params.cityName as string) || '서울'); // 기본값은 서울

// 1. 지도 초기화
const { initMap, moveToLocation, addMarkerForDay, removeMarkerForDay, showMarkerForSearchClick } =
  usePlanMap();

// 2. 장소 검색 훅
const { query, places, isLoading, searchPlaces } = usePlaceSearch();

// 3. 숙소 검색을 위한 추가 상태
const accommodationQuery = ref('');
const accommodationPlaces = ref<PlaceResult[]>([]);
const hasSearched = ref(false);

// 4. 카테고리 필터링
const selectedCategory = ref('');
const categories = [
  { value: '', label: '전체', icon: '🌟' },
  { value: 'tourist', label: '관광지', icon: '🏛️' },
  { value: 'restaurant', label: '맛집', icon: '🍽️' },
  { value: 'cafe', label: '카페', icon: '☕' },
  { value: 'shopping', label: '쇼핑', icon: '🛍️' },
  { value: 'culture', label: '문화', icon: '🎭' },
  { value: 'nature', label: '자연', icon: '🌲' },
  { value: 'activity', label: '액티비티', icon: '🎢' },
];

// 5. 여행 일 수 관리 - 각 일차별로 방문할 장소들을 저장하는 반응형 객체
const dayPlans = reactive<Record<number, PlaceResult[]>>({});
const selectedPlace = ref<PlaceResult | null>(null);
const isModalOpen = ref(false);

// 지도 초기화 및 도시 위치로 이동
onMounted(async () => {
  const map = await initMap();

  // 초기 dayPlans 객체 설정 - 여행 일수에 맞게
  watch(
    () => planStore.getTravelDays,
    newLen => {
      // 기존 dayPlans에 없는 day만 초기화
      for (let day = 1; day <= newLen; day++) {
        if (!dayPlans[day]) {
          dayPlans[day] = [];
        }
      }

      // getTravelDays보다 긴 day는 삭제
      for (const key of Object.keys(dayPlans)) {
        const day = Number(key);
        if (day > newLen) {
          delete dayPlans[day];
        }
      }
    },
    { immediate: true }
  );

  // cityName을 기반으로 위치 검색 및 이동
  if (cityName.value) {
    try {
      // Geocoder 로드
      const { Geocoder } = (await google.maps.importLibrary(
        'geocoding'
      )) as google.maps.GeocodingLibrary;
      const geocoder = new Geocoder();

      // cityName을 좌표로 변환
      const response = await geocoder.geocode({
        address: cityName.value + ', South Korea', // 한국 내 도시로 가정
        region: 'kr',
      });

      if (response.results.length > 0) {
        const location = response.results[0].geometry.location;
        moveToLocation(location);

        // 지도 줌 레벨 설정
        if (map) {
          map.setZoom(12); // 도시 레벨 줌
        }

        // 기본 검색 결과 로드 (숙소와 관광지)
        loadDefaultAccommodations();
        loadDefaultAttractions();
      }
    } catch (error) {
      console.error('도시 위치 검색 오류:', error);
    }
  }
});

// 숙소 전용 검색 함수
async function searchAccommodationsOnly(searchQuery = '') {
  isLoading.value = true;

  try {
    const { Place } = (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary;

    // 숙소 관련 키워드 추가
    const baseQuery = searchQuery ? `${cityName.value} ${searchQuery}` : `${cityName.value}`;

    const request = {
      textQuery: `${baseQuery} 숙박 호텔 숙소`,
      fields: ['displayName', 'location', 'formattedAddress', 'photos'],
      region: 'kr',
      maxResultCount: 20,
      language: 'ko',
    };

    const response = await Place.searchByText(request);

    accommodationPlaces.value = (response?.places || []).map(p => ({
      placeId: p.id ?? '',
      name: p.displayName ?? '',
      address: p.formattedAddress ?? '',
      photoUrl: p.photos?.[0]?.getURI?.() ?? '',
      location: p.location ?? new google.maps.LatLng(0, 0),
    }));
  } catch (error) {
    console.error('숙소 검색 오류:', error);
    accommodationPlaces.value = [];
  } finally {
    isLoading.value = false;
  }
}

// 기본 숙소 검색 결과 로드
async function loadDefaultAccommodations() {
  await searchAccommodationsOnly();
}

// 기본 관광지 검색 결과 로드
async function loadDefaultAttractions() {
  // 기본 관광지 검색
  const searchText = `${cityName.value} 인기 관광지`;
  query.value = searchText;
  await searchPlaces();
}

// 숙소 검색 - 지정된 도시로 쿼리 보강
async function searchAccommodations() {
  if (!accommodationQuery.value.trim()) {
    // 빈 검색어인 경우 기본 검색 결과 다시 로드
    await loadDefaultAccommodations();
    return;
  }

  hasSearched.value = true;
  await searchAccommodationsOnly(accommodationQuery.value);
}

// 장소 검색 - 지정된 도시로 쿼리 보강
async function searchPlacesWithCity() {
  if (!query.value.trim()) {
    // 빈 검색어인 경우 카테고리 기반 검색
    if (selectedCategory.value) {
      const category = categories.find(c => c.value === selectedCategory.value)?.label || '';
      query.value = `${cityName.value} ${category}`;
      await searchPlaces();
    } else {
      // 카테고리도 없는 경우 기본 검색 결과 다시 로드
      loadDefaultAttractions();
    }
    return;
  }

  hasSearched.value = true;

  // 카테고리가 있으면 쿼리에 추가
  const category = selectedCategory.value
    ? categories.find(c => c.value === selectedCategory.value)?.label
    : '';

  // query에 도시명 추가
  const searchText = `${cityName.value} ${query.value} ${category || ''}`.trim();

  // 원래 query 값 저장
  const originalQuery = query.value;

  // 임시로 query 값 변경하고 검색
  query.value = searchText;
  await searchPlaces();

  // 원래 query 값 복원
  query.value = originalQuery;
}

// 카테고리 선택
async function selectCategory(category: string) {
  selectedCategory.value = category;

  if (!category) {
    // 전체 카테고리 선택 시 기본 검색 결과 로드
    loadDefaultAttractions();
    return;
  }

  // 카테고리만으로 검색
  const categoryLabel = categories.find(c => c.value === category)?.label || '';
  query.value = `${cityName.value} ${categoryLabel}`;
  await searchPlaces();
}

// 사용자가 장소를 클릭하면 해당 위치로 지도를 이동하고 마커를 표시
function handlePlaceClick(place: PlaceResult) {
  moveToLocation(place.location);
  showMarkerForSearchClick(place, dayPlans);
}

// 장소 삭제 - 특정 일차에서 선택한 장소를 삭제하고 해당 마커도 지도에서 제거
function removePlaceFromDay(day: number, placeId: string) {
  dayPlans[day] = dayPlans[day].filter(p => p.placeId !== placeId);
  removeMarkerForDay(day, placeId);
}

// 장소 추가 - 선택한 장소를 어느 일차에 추가할지 선택하는 모달 열기
function openDaySelectModal(place: PlaceResult) {
  selectedPlace.value = place;
  isModalOpen.value = true;
}

// 장소 추가 확정 - 선택한 장소를 지정된 일차에 추가하고 지도에 마커를 표시
function confirmDaySelection(day: number) {
  if (!selectedPlace.value) return;

  const place = selectedPlace.value;

  if (!dayPlans[day]) dayPlans[day] = [];
  dayPlans[day].push(place);

  addMarkerForDay(day, place, dayPlans[day].length);

  selectedPlace.value = null;
  isModalOpen.value = false;
}

// Step 변경 시 drawer 상태 관리와 기본 검색 결과 로드
watch(
  () => planStore.currentStep,
  (newStep, oldStep) => {
    if (newStep >= 3 && oldStep < 3) {
      // Step 3 이상으로 진입할 때 drawer 열기
      planStore.drawerOpen = true;
    } else if (newStep < 3) {
      // Step 1, 2로 돌아갈 때 drawer 닫기
      planStore.drawerOpen = false;
      planStore.showDrawerContent = false;
    }

    // Step 3으로 진입 시 숙소 검색 결과 로드
    if (newStep === 3 && accommodationPlaces.value.length === 0) {
      loadDefaultAccommodations();
    }

    // Step 4로 진입 시 관광지 검색 결과 로드
    if (newStep === 4 && places.value.length === 0) {
      loadDefaultAttractions();
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
