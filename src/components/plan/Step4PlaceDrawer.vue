<template>
  <div class="flex-1 overflow-auto p-4">
    <h3 class="text-lg font-semibold">{{ cityName }} 관광 명소</h3>
    <p class="mb-4 text-sm text-gray-500">{{ cityName }}에서 방문할 장소를 찾아보세요</p>

    <!-- 검색바 -->
    <div class="mb-4">
      <div class="flex gap-2">
        <input
          v-model="query"
          type="text"
          placeholder="장소명, 지역명, 키워드 입력..."
          class="focus:border-bold focus:ring-bold flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
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
          class="hover:border-bold/50 cursor-pointer rounded-lg border p-2 text-center text-xs transition-all"
          :class="{
            'border-bold bg-primary text-bold': selectedCategory === category.value,
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
                <span v-if="place.priceLevel !== undefined" class="text-bold font-medium">
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
import { usePlaceSearch } from '@/composables/plan/usePlaceSearch';

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
const query = ref('');
const places = ref<PlaceResult[]>([]);
const isLoading = ref(false);
const selectedCategory = ref('');

// 카테고리 필터링
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

const { getPriceLevelText } = usePlaceSearch();

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
    const baseQuery = searchQuery ? `${props.cityName} ${searchQuery}` : `${props.cityName}`;

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
        p.editorialSummary || `${props.cityName}에서 꼭 방문해보시길 추천하는 장소입니다.`,
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

// 기본 검색 결과 로드
async function loadDefaultAttractions() {
  await searchPlacesOnly('', selectedCategory.value);
}

// 카테고리 선택
async function selectCategory(category: string) {
  selectedCategory.value = category;
  if (query.value.trim()) {
    await searchPlacesWithCity();
  } else {
    await searchPlacesOnly('', category);
  }
}

// 검색 함수
async function searchPlacesWithCity() {
  if (!query.value.trim()) {
    await loadDefaultAttractions();
    return;
  }
  await searchPlacesOnly(query.value, selectedCategory.value);
}

// 결과 제목 생성
function getAttractionResultTitle(): string {
  if (query.value.trim() && selectedCategory.value) {
    const categoryLabel = categories.find(c => c.value === selectedCategory.value)?.label;
    return `${categoryLabel} 검색 결과`;
  } else if (query.value.trim()) {
    return '검색 결과';
  } else if (selectedCategory.value) {
    const categoryLabel = categories.find(c => c.value === selectedCategory.value)?.label;
    return `${props.cityName} ${categoryLabel}`;
  } else {
    return '인기 관광지';
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
  loadDefaultAttractions();
});

// 외부에서 호출할 수 있는 함수들 노출
defineExpose({
  loadDefaultAttractions,
});
</script>
