<template>
  <div>
    <h2 class="mb-4 text-2xl font-bold">숙소 설정</h2>
    <p class="mb-6 text-gray-600">선호하는 숙소 타입과 조건을 선택해주세요.</p>

    <!-- 숙소 타입 선택 -->
    <div class="mb-6">
      <label class="mb-3 block text-sm font-medium">숙소 타입</label>
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="type in accommodationTypes"
          :key="type.value"
          class="cursor-pointer rounded-lg border p-4 transition-all hover:border-blue-300"
          :class="{
            'border-blue-500 bg-blue-50': planStore.accommodationSettings.type === type.value,
            'border-gray-200': planStore.accommodationSettings.type !== type.value,
          }"
          @click="selectAccommodationType(type.value)"
        >
          <div class="text-center">
            <div class="mb-2 text-2xl">{{ type.icon }}</div>
            <div class="font-medium">{{ type.label }}</div>
            <div class="text-xs text-gray-500">{{ type.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 가격 범위 -->
    <div class="mb-6">
      <label class="mb-3 block text-sm font-medium">1박 가격 범위</label>
      <div class="space-y-3">
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <label class="block text-xs text-gray-500">최소 금액</label>
            <input
              v-model.number="planStore.accommodationSettings.priceRange.min"
              type="number"
              placeholder="0"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div class="text-gray-400">~</div>
          <div class="flex-1">
            <label class="block text-xs text-gray-500">최대 금액</label>
            <input
              v-model.number="planStore.accommodationSettings.priceRange.max"
              type="number"
              placeholder="500000"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <div class="text-center text-sm text-gray-500">
          {{ formatPriceRange() }}
        </div>
      </div>
    </div>

    <!-- 편의시설 -->
    <div class="mb-6">
      <label class="mb-3 block text-sm font-medium">원하는 편의시설</label>
      <div class="grid grid-cols-2 gap-2">
        <div
          v-for="amenity in amenitiesList"
          :key="amenity"
          class="cursor-pointer rounded-lg border p-3 text-center text-sm transition-all hover:border-blue-300"
          :class="{
            'border-blue-500 bg-blue-50 text-blue-700':
              planStore.accommodationSettings.amenities.includes(amenity),
            'border-gray-200': !planStore.accommodationSettings.amenities.includes(amenity),
          }"
          @click="toggleAmenity(amenity)"
        >
          {{ amenity }}
        </div>
      </div>
    </div>

    <!-- 설정 요약 -->
    <div class="rounded-lg bg-gray-50 p-4">
      <h4 class="mb-2 font-medium">설정 요약</h4>
      <div class="space-y-1 text-sm text-gray-600">
        <p>숙소 타입: {{ getSelectedTypeLabel() }}</p>
        <p>가격 범위: {{ formatPriceRange() }}</p>
        <p>편의시설: {{ planStore.accommodationSettings.amenities.join(', ') || '선택 안함' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlanStore } from '@/stores/plan';

const planStore = usePlanStore();

const accommodationTypes = [
  {
    value: 'hotel',
    label: '호텔',
    icon: '🏨',
    description: '서비스가 포함된 숙박',
  },
  {
    value: 'motel',
    label: '모텔',
    icon: '🏩',
    description: '간편한 숙박',
  },
  {
    value: 'pension',
    label: '펜션',
    icon: '🏡',
    description: '독채 형태의 숙박',
  },
  {
    value: 'guesthouse',
    label: '게스트하우스',
    icon: '🏠',
    description: '저렴한 공용 숙박',
  },
];

const amenitiesList = [
  '무료 Wi-Fi',
  '주차장',
  '수영장',
  '조식 포함',
  '헬스장',
  '스파/사우나',
  '비즈니스센터',
  '애완동물 동반',
  '금연실',
  '바다뷰',
  '산뷰',
  '도심 접근성',
];

// 숙소 타입 선택
const selectAccommodationType = (type: string) => {
  planStore.updateAccommodationSettings({ type });
};

// 편의시설 토글
const toggleAmenity = (amenity: string) => {
  const currentAmenities = [...planStore.accommodationSettings.amenities];
  const index = currentAmenities.indexOf(amenity);

  if (index > -1) {
    currentAmenities.splice(index, 1);
  } else {
    currentAmenities.push(amenity);
  }

  planStore.updateAccommodationSettings({ amenities: currentAmenities });
};

// 선택된 타입 라벨 가져오기
const getSelectedTypeLabel = () => {
  const selectedType = accommodationTypes.find(
    type => type.value === planStore.accommodationSettings.type
  );
  return selectedType ? selectedType.label : '선택 안함';
};

// 가격 범위 포맷팅
const formatPriceRange = () => {
  const { min, max } = planStore.accommodationSettings.priceRange;

  if (!min && !max) return '가격 제한 없음';
  if (!min) return `최대 ${max?.toLocaleString()}원`;
  if (!max) return `최소 ${min?.toLocaleString()}원`;

  return `${min?.toLocaleString()}원 ~ ${max?.toLocaleString()}원`;
};
</script>
