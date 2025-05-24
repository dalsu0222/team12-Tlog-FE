<template>
  <div class="flex-1 overflow-auto p-4">
    <h3 class="text-lg font-semibold">{{ cityName }} 숙소 추천</h3>
    <p class="mb-4 text-sm text-gray-500">{{ cityName }}에서 이용할 숙소를 찾아보세요</p>

    <!-- 검색바 -->
    <div class="mb-4">
      <div class="flex gap-2">
        <input
          v-model="accommodationQuery"
          type="text"
          placeholder="지역명, 숙소명 입력..."
          class="focus:border-bold-500 focus:ring-bold-500 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
          @keyup.enter="searchAccommodations"
        />
        <Button :disabled="isLoading" @click="searchAccommodations">
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
          class="hover:border-bold-300 cursor-pointer rounded-lg border p-2 text-center text-xs transition-all"
          :class="{
            'border-bold bg-primary text-bold':
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
      <div v-else-if="accommodationPlaces.length === 0" class="py-8 text-center text-gray-400">
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
                <span v-if="place.priceLevel !== undefined" class="text-bold-600 font-medium">
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { PlusIcon } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PlaceResult } from '@/composables/plan/usePlaceSearch';

interface Props {
  cityName: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  placeClick: [place: PlaceResult];
  openDaySelectModal: [place: PlaceResult];
}>();

// State
const accommodationQuery = ref('');
const accommodationPlaces = ref<PlaceResult[]>([]);
const isLoading = ref(false);
const selectedAccommodationType = ref('');

// 숙소 타입 필터링
const accommodationTypes = [
  { value: '', label: '전체', icon: '🏨' },
  { value: 'hotel', label: '호텔', icon: '🏨' },
  { value: 'motel', label: '모텔', icon: '🏩' },
  { value: 'pension', label: '펜션', icon: '🏡' },
  { value: 'guesthouse', label: '게스트하우스', icon: '🏠' },
  { value: 'resort', label: '리조트', icon: '🏖️' },
  { value: 'hostel', label: '호스텔', icon: '🛏️' },
];

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
    const baseQuery = searchQuery ? `${props.cityName} ${searchQuery}` : `${props.cityName}`;

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
      description: p.editorialSummary || '',
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

// 기본 검색 결과 로드
async function loadDefaultAccommodations() {
  await searchAccommodationsOnly('', selectedAccommodationType.value);
}

// 숙소 타입 선택
async function selectAccommodationType(type: string) {
  selectedAccommodationType.value = type;
  if (accommodationQuery.value.trim()) {
    await searchAccommodations();
  } else {
    await searchAccommodationsOnly('', type);
  }
}

// 검색 함수
async function searchAccommodations() {
  if (!accommodationQuery.value.trim()) {
    await loadDefaultAccommodations();
    return;
  }
  await searchAccommodationsOnly(accommodationQuery.value, selectedAccommodationType.value);
}

// 결과 제목 생성
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
    return `${props.cityName} ${typeLabel}`;
  } else {
    return '추천 숙소';
  }
}

// 이벤트 핸들러들
function handlePlaceClick(place: PlaceResult) {
  emit('placeClick', place);
}

function openDaySelectModal(place: PlaceResult) {
  emit('openDaySelectModal', place);
}

// 초기 로드
onMounted(() => {
  loadDefaultAccommodations();
});

// 외부에서 호출할 수 있는 함수들 노출
defineExpose({
  loadDefaultAccommodations,
});
</script>
