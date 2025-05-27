<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'vue-router';
import FeaturePreview from './FeaturePreview.vue';
import { ArrowRight } from 'lucide-vue-next';
import type { Component } from 'vue';
import { computed } from 'vue';

interface Feature {
  icon: Component;
  title: string;
  description: string;
  details: string[];
}

interface Props {
  feature: Feature;
  index: number;
}

const props = defineProps<Props>();
const router = useRouter();

// 기능별 라우팅 맵
const featureRoutes: Record<string, string> = {
  '여행 계획': '/plans',
  'AI 여행 후기': '/records',
};

// 클릭 핸들러 함수
const handleFeatureClick = () => {
  const route = featureRoutes[props.feature.title];
  if (route) {
    router.push(route);
  }
};

// 인덱스에 따른 색상 설정
const colorClasses = computed(() => {
  if (props.index === 0) {
    // 첫 번째 카드 (여행 계획) - 블루 계열
    return {
      iconBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-600',
      dotColor: 'bg-blue-600',
    };
  } else {
    // 두 번째 카드 (AI 여행 후기) - 퍼플 계열
    return {
      iconBg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-600',
      dotColor: 'bg-purple-600',
    };
  }
});
</script>

<template>
  <Card
    class="group overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 shadow-md transition-all duration-500 hover:shadow-lg"
    @click="handleFeatureClick"
  >
    <CardContent class="px-8 py-2">
      <div class="space-y-4">
        <!-- Icon & Title -->
        <div class="flex items-center gap-4">
          <div
            :class="[
              colorClasses.iconBg,
              'rounded-2xl p-3 transition-transform duration-300 group-hover:scale-110',
            ]"
          >
            <component :is="feature.icon" :class="[colorClasses.iconColor, 'h-6 w-6']" />
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-800">{{ feature.title }}</h3>
            <div class="mt-2 flex items-center gap-2">
              <span :class="[colorClasses.textColor, 'font-medium']">리스트 보기</span>
              <ArrowRight
                :class="[
                  colorClasses.textColor,
                  'h-4 w-4 transition-transform duration-300 group-hover:translate-x-1',
                ]"
              />
            </div>
          </div>
        </div>

        <!-- Description -->
        <p class="leading-relaxed text-gray-600">
          {{ feature.description }}
        </p>

        <!-- Feature Details -->
        <div class="space-y-2">
          <div
            v-for="(detail, detailIndex) in feature.details"
            :key="detailIndex"
            class="flex items-center gap-3"
          >
            <div :class="[colorClasses.dotColor, 'h-2 w-2 rounded-full']"></div>
            <span class="text-gray-700">{{ detail }}</span>
          </div>
        </div>

        <!-- Mock Interface Preview -->
        <FeaturePreview :index="index" />
      </div>
    </CardContent>
  </Card>
</template>
