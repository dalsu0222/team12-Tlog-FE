<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card';
import FeatureCard from './FeatureCard.vue';
import { MapPin, Sparkles } from 'lucide-vue-next';

interface Feature {
  icon: any;
  title: string;
  description: string;
  details: string[];
}

const features: Feature[] = [
  {
    icon: MapPin,
    title: '여행 계획',
    description: '친구들과 함께 여행 일정을 계획하고 관리하세요',
    details: ['날짜별 여행 루트 설정', '숙소 및 장소 정보 관리'],
  },
  {
    icon: Sparkles,
    title: 'AI 여행 후기',
    description: 'AI가 여행 기록을 바탕으로 감성적인 블로그를 생성해드려요',
    details: ['여행 계획 기반 자동 생성', '감성적인 블로그 형식 여행 스토리'],
  },
];
</script>

<template>
  <div
    id="features-section"
    class="flex min-h-full flex-col justify-center bg-gray-50 py-8 sm:py-12 lg:py-16"
  >
    <div class="mx-auto max-w-5xl px-4">
      <div class="mb-6 text-center sm:mb-8 lg:mb-10">
        <h2 class="mb-2 text-xl font-bold text-gray-800 sm:mb-3 sm:text-2xl lg:text-3xl">
          Tlog의 주요 기능
        </h2>
        <p class="text-sm text-gray-600 sm:text-base lg:text-lg">
          여행의 모든 순간을 계획부터 기록까지
        </p>
      </div>

      <div class="grid gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
        <FeatureCard
          v-for="(feature, index) in features"
          :key="index"
          :feature="feature"
          :index="index"
        />
      </div>
    </div>
  </div>
</template>
