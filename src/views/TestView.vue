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
            <div v-if="planStore.currentStep === 3" class="flex-1 overflow-auto p-4">
              <h3 class="text-lg font-semibold">{{ cityName }} 숙소 추천</h3>
              <p class="mb-4 text-sm text-gray-500">{{ cityName }}에서 이용할 숙소를 찾아보세요</p>

              <!-- 검색바 -->
              <div class="mb-4">
                <div class="flex gap-2">
                  <input
                    v-model="accommodationQuery"
                    type="text"
                    placeholder="지역명, 숙소명 입력..."
                    class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    @keyup.enter="searchAccommodations"
                  />
                  <Button @click="searchAccommodations" :disabled="isLoading">
                    {{ isLoading ? '검색 중...' : '검색' }}
                  </Button>
                </div>
              </div>

              <!-- 숙소 타입 필터 -->
              <div class="mb-4">
                <label class="mb-2 block text-sm font-medium">숙소 타입</label>
                <div class="grid grid-cols-2 gap-2">
                  <div
                    v-for="accommodationType in accommodationTypes"
                    :key="accommodationType.value"
                    class="cursor-pointer rounded-lg border p-2 text-center text-xs transition-all hover:border-blue-300"
                    :class="{
                      'border-blue-500 bg-blue-50 text-blue-700':
                        selectedAccommodationType === accommodationType.value,
                      'border-gray-200': selectedAccommodationType !== accommodationType.value,
                    }"
                    @click="selectAccommodationType(accommodationType.value)"
                  >
                    <div class="mb-1">{{ accommodationType.icon }}</div>
                    <div>{{ accommodationType.label }}</div>
                  </div>
                </div>
              </div>

              <!-- 숙소 검색 결과 -->
              <ScrollArea class="h-[calc(100vh-350px)]">
                <div v-if="isLoading" class="py-8 text-center text-gray-400">검색 중입니다...</div>
                <div
                  v-else-if="accommodationPlaces.length === 0"
                  class="py-8 text-center text-gray-400"
                >
                  숙소 검색 결과가 없습니다
                </div>
                <div v-else>
                  <h4 class="mb-3 text-sm font-medium text-gray-500">
                    {{ getAccommodationResultTitle() }}
                  </h4>
                  <div
                    v-for="place in accommodationPlaces"
                    :key="place.placeId"
                    class="mb-3 cursor-pointer rounded-lg border p-3 hover:bg-gray-50"
                    @click="handlePlaceClick(place)"
                  >
                    <div class="flex items-start gap-3">
                      <img
                        v-if="place.photoUrl"
                        :src="place.photoUrl"
                        alt="숙소 이미지"
                        class="h-16 w-16 rounded object-cover"
                      />
                      <div class="flex-1 cursor-pointer">
                        <h4 class="font-medium">{{ place.name }}</h4>
                        <p class="text-xs text-gray-600">{{ place.address }}</p>
                        <!-- 평점 정보 추가 -->
                        <div v-if="place.rating" class="mt-1 flex items-center gap-2 text-xs">
                          <span class="flex items-center gap-1 text-yellow-500">
                            <span>⭐</span>
                            <span>{{ place.rating.toFixed(1) }}</span>
                          </span>
                          <span v-if="place.userRatingsTotal" class="text-gray-400">
                            ({{ place.userRatingsTotal }}개 리뷰)
                          </span>
                          <span
                            v-if="place.priceLevel !== undefined"
                            class="font-medium text-blue-600"
                          >
                            {{ getPriceLevelText(place.priceLevel) }}
                          </span>
                        </div>
                      </div>
                      <div class="flex h-full items-center self-center">
                        <Button
                          size="sm"
                          variant="outline"
                          @click="openDaySelectModal(place)"
                          title="일정에 추가"
                          class="px-2 py-8"
                        >
                          <PlusIcon class="h-4 w-4" />
                        </Button>
                      </div>
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
                    placeholder="장소명, 지역명, 키워드 입력..."
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
                    {{ getAttractionResultTitle() }}
                  </h4>
                  <div
                    v-for="place in places"
                    :key="place.placeId"
                    class="mb-3 cursor-pointer rounded-lg border p-3 hover:bg-gray-50"
                    @click="handlePlaceClick(place)"
                  >
                    <div class="flex items-start gap-3">
                      <img
                        v-if="place.photoUrl"
                        :src="place.photoUrl"
                        alt="장소 이미지"
                        class="h-16 w-16 rounded object-cover"
                      />
                      <div class="flex-1 cursor-pointer">
                        <h4 class="font-medium">{{ place.name }}</h4>
                        <p class="text-xs text-gray-600">{{ place.address }}</p>
                        <!-- 평점 정보 추가 -->
                        <div v-if="place.rating" class="mt-1 flex items-center gap-2 text-xs">
                          <span class="flex items-center gap-1 text-yellow-500">
                            <span>⭐</span>
                            <span>{{ place.rating.toFixed(1) }}</span>
                          </span>
                          <span v-if="place.userRatingsTotal" class="text-gray-400">
                            ({{ place.userRatingsTotal }}개 리뷰)
                          </span>
                          <span
                            v-if="place.priceLevel !== undefined"
                            class="font-medium text-blue-600"
                          >
                            {{ getPriceLevelText(place.priceLevel) }}
                          </span>
                        </div>
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
import { ChevronLeft, ChevronRight, PlusIcon } from 'lucide-vue-next';
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
const cityName = ref((route.params.cityName as string) || '서울');

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

// 5. 숙소 타입 필터링 (Step 3용)
const selectedAccommodationType = ref('');
const accommodationTypes = [
  { value: '', label: '전체', icon: '🏨' },
  { value: 'hotel', label: '호텔', icon: '🏨' },
  { value: 'motel', label: '모텔', icon: '🏩' },
  { value: 'pension', label: '펜션', icon: '🏡' },
  { value: 'guesthouse', label: '게스트하우스', icon: '🏠' },
  { value: 'resort', label: '리조트', icon: '🏖️' },
  { value: 'hostel', label: '호스텔', icon: '🛏️' },
];

// 6. 모달 관련 상태
const selectedPlace = ref<PlaceResult | null>(null);
const isModalOpen = ref(false);

// 숙소인지 확인하는 함수
function isAccommodationPlace(place: PlaceResult): boolean {
  if (!place.types) return false;
  const accommodationTypes = ['lodging', 'hotel', 'motel', 'resort', 'campground', 'rv_park'];
  return place.types.some(type => accommodationTypes.includes(type));
}

// 가격 레벨을 텍스트로 변환
function getPriceLevelText(priceLevel?: number): string {
  if (priceLevel === undefined) return '';
  switch (priceLevel) {
    case 0:
      return '무료';
    case 1:
      return '₩';
    case 2:
      return '₩₩';
    case 3:
      return '₩₩₩';
    case 4:
      return '₩₩₩₩';
    default:
      return '';
  }
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

        loadDefaultAccommodations();
        loadDefaultAttractions();
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

// 카테고리에 따른 검색 키워드 매핑
function getCategorySearchKeywords(category: string): string {
  const keywordMap: Record<string, string> = {
    tourist: '관광지 명소',
    restaurant: '맛집 음식점',
    cafe: '카페',
    shopping: '쇼핑 쇼핑몰',
    culture: '문화시설 박물관',
    nature: '자연 공원',
    activity: '액티비티 놀거리',
  };
  return keywordMap[category] || '인기 관광지';
}

// 관광지 전용 검색 함수
async function searchPlacesOnly(searchQuery = '', category = '') {
  isLoading.value = true;
  try {
    const { Place } = (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary;
    const categoryKeywords = category ? getCategorySearchKeywords(category) : '인기 관광지';
    const baseQuery = searchQuery ? `${cityName.value} ${searchQuery}` : `${cityName.value}`;

    const request = {
      textQuery: `${baseQuery} ${categoryKeywords}`,
      fields: [
        'displayName',
        'location',
        'formattedAddress',
        'photos',
        'rating',
        'userRatingCount',
        'priceLevel',
        'businessStatus',
        'types',
        'editorialSummary',
        'nationalPhoneNumber',
        'websiteURI',
        'regularOpeningHours',
      ],
      region: 'kr',
      maxResultCount: 20,
      language: 'ko',
    };

    const response = await Place.searchByText(request);
    places.value = (response?.places || []).map(p => ({
      placeId: p.id ?? '',
      name: p.displayName ?? '',
      address: p.formattedAddress ?? '',
      photoUrl: p.photos?.[0]?.getURI?.() ?? '',
      location: p.location ?? new google.maps.LatLng(0, 0),
      rating: p.rating || undefined,
      userRatingsTotal: p.userRatingCount || undefined,
      priceLevel: p.priceLevel ? Number(p.priceLevel) : undefined,
      businessStatus: p.businessStatus || undefined,
      types: p.types || undefined,
      description:
        p.editorialSummary || `${cityName.value}에서 꼭 방문해보시길 추천하는 장소입니다.`,
      phoneNumber: p.nationalPhoneNumber || undefined,
      website: p.websiteURI || undefined,
      openingHours: p.regularOpeningHours
        ? {
            isOpen: p.regularOpeningHours.periods ? true : false,
            periods: p.regularOpeningHours.periods || undefined,
          }
        : undefined,
    }));
  } catch (error) {
    console.error('장소 검색 오류:', error);
    places.value = [];
  } finally {
    isLoading.value = false;
  }
}

function getAccommodationSearchKeywords(type: string): string {
  const keywordMap: Record<string, string> = {
    hotel: '호텔',
    motel: '모텔',
    pension: '펜션',
    guesthouse: '게스트하우스 민박',
    resort: '리조트',
    hostel: '호스텔',
  };
  return keywordMap[type] || '숙박 숙소';
}

// 숙소 전용 검색 함수
async function searchAccommodationsOnly(searchQuery = '', accommodationType = '') {
  isLoading.value = true;
  try {
    const { Place } = (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary;
    const typeKeywords = accommodationType
      ? getAccommodationSearchKeywords(accommodationType)
      : '숙박 숙소';
    const baseQuery = searchQuery ? `${cityName.value} ${searchQuery}` : `${cityName.value}`;

    const request = {
      textQuery: `${baseQuery} ${typeKeywords}`,
      fields: [
        'displayName',
        'location',
        'formattedAddress',
        'photos',
        'rating',
        'userRatingCount',
        'priceLevel',
        'businessStatus',
        'types',
        'editorialSummary',
        'nationalPhoneNumber',
        'websiteURI',
        'regularOpeningHours',
      ],
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
      rating: p.rating || undefined,
      userRatingsTotal: p.userRatingCount || undefined,
      priceLevel: p.priceLevel ? Number(p.priceLevel) : undefined,
      businessStatus: p.businessStatus || undefined,
      types: p.types || undefined,
      description: p.editorialSummary || '편안한 숙박을 위한 최적의 장소입니다.',
      phoneNumber: p.nationalPhoneNumber || undefined,
      website: p.websiteURI || undefined,
      openingHours: p.regularOpeningHours
        ? {
            isOpen: p.regularOpeningHours.periods ? true : false,
            periods: p.regularOpeningHours.periods || undefined,
          }
        : undefined,
    }));
  } catch (error) {
    console.error('숙소 검색 오류:', error);
    accommodationPlaces.value = [];
  } finally {
    isLoading.value = false;
  }
}

// 기본 검색 결과 로드 함수들
async function loadDefaultAccommodations() {
  await searchAccommodationsOnly('', selectedAccommodationType.value);
}

async function loadDefaultAttractions() {
  await searchPlacesOnly('', selectedCategory.value);
}

// 숙소 타입/카테고리 선택 함수들
async function selectAccommodationType(type: string) {
  selectedAccommodationType.value = type;
  if (accommodationQuery.value.trim()) {
    await searchAccommodations();
  } else {
    await searchAccommodationsOnly('', type);
  }
}

async function selectCategory(category: string) {
  selectedCategory.value = category;
  if (query.value.trim()) {
    await searchPlacesWithCity();
  } else {
    await searchPlacesOnly('', category);
  }
}

// 검색 함수들
async function searchAccommodations() {
  if (!accommodationQuery.value.trim()) {
    await loadDefaultAccommodations();
    return;
  }
  hasSearched.value = true;
  await searchAccommodationsOnly(accommodationQuery.value, selectedAccommodationType.value);
}

async function searchPlacesWithCity() {
  if (!query.value.trim()) {
    await loadDefaultAttractions();
    return;
  }
  hasSearched.value = true;
  await searchPlacesOnly(query.value, selectedCategory.value);
}

// 결과 제목 생성 함수들
function getAccommodationResultTitle(): string {
  if (accommodationQuery.value.trim() && selectedAccommodationType.value) {
    const typeLabel = accommodationTypes.find(
      t => t.value === selectedAccommodationType.value
    )?.label;
    return `${typeLabel} 검색 결과`;
  } else if (accommodationQuery.value.trim()) {
    return '검색 결과';
  } else if (selectedAccommodationType.value) {
    const typeLabel = accommodationTypes.find(
      t => t.value === selectedAccommodationType.value
    )?.label;
    return `${cityName.value} ${typeLabel}`;
  } else {
    return '추천 숙소';
  }
}

function getAttractionResultTitle(): string {
  if (query.value.trim() && selectedCategory.value) {
    const categoryLabel = categories.find(c => c.value === selectedCategory.value)?.label;
    return `${categoryLabel} 검색 결과`;
  } else if (query.value.trim()) {
    return '검색 결과';
  } else if (selectedCategory.value) {
    const categoryLabel = categories.find(c => c.value === selectedCategory.value)?.label;
    return `${cityName.value} ${categoryLabel}`;
  } else {
    return '인기 관광지';
  }
}

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

    if (newStep === 3 && accommodationPlaces.value.length === 0) {
      loadDefaultAccommodations();
    }

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
