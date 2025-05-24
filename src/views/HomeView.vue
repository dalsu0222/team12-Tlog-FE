<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import HeroSection from '@/components/views/home/HeroSection.vue';
import FeaturesSection from '@/components/views/home/FeaturesSection.vue';

// 도시 정보 타입 정의
interface CityDto {
  cityId: number;
  cityEn: string;
  cityKo: string;
}

const router = useRouter();

// 홈페이지 상태 관리 - 초기값을 null로 설정
const selectedCity = ref<string | null>(null); // 타입 명시
const selectedCityDto = ref<CityDto | null>(null); // null로 초기화

// 파라미터 타입을 CityDto | null로 수정
const handleCitySelect = (cityDto: CityDto | null) => {
  if (cityDto) {
    // null 체크 추가
    selectedCity.value = cityDto.cityKo;
    selectedCityDto.value = cityDto;
    console.log('선택된 도시:', cityDto);
  }
};

const handleCreatePlan = () => {
  if (!selectedCityDto.value) {
    console.error('선택된 도시 정보가 없습니다.');
    return;
  }

  console.log('여행 계획 생성하기:', selectedCityDto.value);

  // PlanView로 도시 정보와 함께 이동
  router.push({
    name: 'plan-with-city',
    params: {
      cityId: selectedCityDto.value.cityId.toString(),
      cityEn: selectedCityDto.value.cityEn,
      cityKo: selectedCityDto.value.cityKo,
    },
  });
};
</script>

<template>
  <div class="from-primary to-secondary bg-gradient-to-br via-white">
    <!-- Hero Section - 첫 번째 화면 (헤더 높이 제외) -->
    <div class="h-[calc(100vh-4rem)]">
      <HeroSection
        :selected-city="selectedCityDto"
        @city-select="handleCitySelect"
        @create-plan="handleCreatePlan"
      />
    </div>

    <!-- Features Section - 두 번째 화면 (헤더 높이 제외) -->
    <div class="h-[calc(100vh-4rem)]">
      <FeaturesSection />
    </div>
  </div>
</template>
