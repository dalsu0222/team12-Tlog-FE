<template>
  <div>
    <h2 class="mb-4 text-2xl font-bold">장소 검색</h2>
    <p class="mb-6 text-gray-600">방문하고 싶은 장소를 검색하고 필터를 설정해보세요.</p>

    <!-- 검색바 -->
    <div class="mb-6">
      <label class="mb-2 block text-sm font-medium">장소 검색</label>
      <div class="flex gap-2">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="장소명, 주소, 키워드 입력..."
          class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          @keyup.enter="searchPlaces"
        />
        <Button @click="searchPlaces" :disabled="!searchQuery.trim()">검색</Button>
      </div>
    </div>

    <!-- 카테고리 필터 -->
    <div class="mb-6">
      <label class="mb-3 block text-sm font-medium">카테고리</label>
      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="category in categories"
          :key="category.value"
          class="cursor-pointer rounded-lg border p-3 text-center text-sm transition-all hover:border-blue-300"
          :class="{
            'border-blue-500 bg-blue-50 text-blue-700':
              planStore.searchFilters.category === category.value,
            'border-gray-200': planStore.searchFilters.category !== category.value,
          }"
          @click="selectCategory(category.value)"
        >
          <div class="mb-1">{{ category.icon }}</div>
          <div>{{ category.label }}</div>
        </div>
      </div>
    </div>

    <!-- 거리 설정 -->
    <div class="mb-6">
      <label class="mb-3 block text-sm font-medium">검색 반경 (km)</label>
      <div class="space-y-2">
        <input
          v-model.number="planStore.searchFilters.distance"
          type="range"
          min="1"
          max="50"
          step="1"
          class="w-full"
        />
        <div class="flex justify-between text-xs text-gray-500">
          <span>1km</span>
          <span class="font-medium">{{ planStore.searchFilters.distance }}km</span>
          <span>50km</span>
        </div>
      </div>
    </div>

    <!-- 평점 필터 -->
    <div class="mb-6">
      <label class="mb-3 block text-sm font-medium">최소 평점</label>
      <div class="flex gap-2">
        <div
          v-for="rating in [1, 2, 3, 4, 5]"
          :key="rating"
          class="cursor-pointer rounded-lg border p-2 text-center transition-all hover:border-yellow-300"
          :class="{
            'border-yellow-500 bg-yellow-50': planStore.searchFilters.rating >= rating,
            'border-gray-200': planStore.searchFilters.rating < rating,
          }"
          @click="setRating(rating)"
        >
          <div class="text-lg">
            {{ planStore.searchFilters.rating >= rating ? '⭐' : '☆' }}
          </div>
          <div class="text-xs">{{ rating }}점</div>
        </div>
      </div>
    </div>

    <!-- 검색 결과 -->
    <div v-if="planStore.searchResults.length > 0" class="mb-6">
      <h3 class="mb-3 font-semibold">검색 결과 ({{ planStore.searchResults.length }}개)</h3>
      <div class="space-y-2">
        <div
          v-for="(place, index) in planStore.searchResults"
          :key="index"
          class="rounded-lg border p-3 hover:bg-gray-50"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-medium">{{ place.name }}</h4>
              <p class="text-sm text-gray-600">{{ place.address }}</p>
              <div class="mt-1 flex items-center gap-2 text-sm">
                <span class="text-yellow-500">⭐ {{ place.rating }}</span>
                <span class="text-gray-400">•</span>
                <span class="text-blue-600">{{ place.distance }}km</span>
              </div>
            </div>
            <Button size="sm" variant="outline">추가</Button>
          </div>
        </div>
      </div>
    </div>

    <!-- 검색 결과 없음 -->
    <div v-else-if="hasSearched" class="rounded-lg bg-gray-50 p-6 text-center">
      <div class="mb-2 text-2xl">🔍</div>
      <p class="text-gray-600">검색 결과가 없습니다.</p>
      <p class="text-sm text-gray-500">다른 키워드로 검색해보세요.</p>
    </div>

    <!-- 초기 상태 -->
    <div v-else class="rounded-lg bg-blue-50 p-6 text-center">
      <div class="mb-2 text-2xl">📍</div>
      <p class="text-blue-800">장소를 검색해보세요!</p>
      <p class="text-sm text-blue-600">관광지, 맛집, 카페 등을 찾을 수 있습니다.</p>
    </div>

    <!-- 필터 초기화 -->
    <div class="mt-6">
      <Button variant="outline" class="w-full" @click="resetFilters">필터 초기화</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { usePlanStore } from '@/stores/plan';

const planStore = usePlanStore();
const searchQuery = ref('');
const hasSearched = ref(false);

const categories = [
  { value: '', label: '전체', icon: '🌟' },
  { value: 'tourist', label: '관광지', icon: '🏛️' },
  { value: 'restaurant', label: '맛집', icon: '🍽️' },
  { value: 'cafe', label: '카페', icon: '☕' },
  { value: 'shopping', label: '쇼핑', icon: '🛍️' },
  { value: 'culture', label: '문화시설', icon: '🎭' },
  { value: 'nature', label: '자연', icon: '🌲' },
  { value: 'activity', label: '액티비티', icon: '🎢' },
  { value: 'accommodation', label: '숙박', icon: '🏨' },
];

// 카테고리 선택
const selectCategory = (category: string) => {
  planStore.updateSearchFilters({ category });
  if (hasSearched.value) {
    searchPlaces();
  }
};

// 평점 설정
const setRating = (rating: number) => {
  planStore.updateSearchFilters({
    rating: planStore.searchFilters.rating === rating ? 0 : rating,
  });
  if (hasSearched.value) {
    searchPlaces();
  }
};

// 장소 검색 (모의 데이터)
const searchPlaces = () => {
  hasSearched.value = true;

  // 실제로는 API 호출
  const mockResults = [
    {
      name: '경복궁',
      address: '서울특별시 종로구 사직로 161',
      rating: 4.5,
      distance: 2.3,
      category: 'tourist',
    },
    {
      name: '명동성당',
      address: '서울특별시 중구 명동길 74',
      rating: 4.2,
      distance: 1.8,
      category: 'culture',
    },
    {
      name: '남산타워',
      address: '서울특별시 용산구 남산공원길 105',
      rating: 4.1,
      distance: 3.5,
      category: 'tourist',
    },
    {
      name: '이태원 맛집거리',
      address: '서울특별시 용산구 이태원로',
      rating: 4.3,
      distance: 4.2,
      category: 'restaurant',
    },
    {
      name: '홍대 카페거리',
      address: '서울특별시 마포구 홍익로',
      rating: 4.0,
      distance: 5.1,
      category: 'cafe',
    },
  ];

  // 필터 적용
  let filteredResults = mockResults.filter(place => {
    if (planStore.searchFilters.category && place.category !== planStore.searchFilters.category) {
      return false;
    }
    if (planStore.searchFilters.rating && place.rating < planStore.searchFilters.rating) {
      return false;
    }
    if (planStore.searchFilters.distance && place.distance > planStore.searchFilters.distance) {
      return false;
    }
    if (searchQuery.value.trim() && !place.name.includes(searchQuery.value.trim())) {
      return false;
    }
    return true;
  });

  planStore.searchResults = filteredResults;
};

// 필터 초기화
const resetFilters = () => {
  planStore.updateSearchFilters({
    category: '',
    distance: 10,
    rating: 0,
  });
  searchQuery.value = '';
  hasSearched.value = false;
  planStore.searchResults = [];
};
</script>
