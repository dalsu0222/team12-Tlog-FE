<script setup lang="ts">
import { ref } from 'vue';
import HeroSection from '@/components/views/home/HeroSection.vue';
import FeaturesSection from '@/components/views/home/FeaturesSection.vue';

// 홈페이지 상태 관리
const selectedCity = ref('');

const handleCitySelect = (city: string) => {
  selectedCity.value = city;
  console.log('선택된 도시:', city);
  // 여기서 여행 계획 페이지로 이동하거나 다음 단계 진행
};

const handleCreatePlan = () => {
  console.log('여행 계획 생성하기:', selectedCity.value);
  // router.push('/plan') 등으로 여행 계획 페이지로 이동
};
</script>

<template>
  <div class="from-primary to-secondary min-h-screen bg-gradient-to-br via-white">
    <!-- Hero Section -->
    <HeroSection
      :selected-city="selectedCity"
      @city-select="handleCitySelect"
      @create-plan="handleCreatePlan"
    />

    <!-- Features Section -->
    <FeaturesSection />
  </div>
</template>
