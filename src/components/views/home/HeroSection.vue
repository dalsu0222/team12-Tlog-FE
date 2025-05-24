<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import CitySelector from './CitySelector.vue';
import { Users, Calendar, Camera, Share2, MapPin, ArrowRight, ChevronDown } from 'lucide-vue-next';

interface Props {
  selectedCity: CityDto | null;
}

// CityDto 타입 추가
interface CityDto {
  cityId: number;
  cityEn: string;
  cityKo: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'city-select': [cityInfo: CityDto | null]; // 타입 수정
  'create-plan': [];
}>();

const highlights = [
  { icon: Users, text: '친구들과 함께 계획' },
  { icon: Calendar, text: '날짜별 일정 관리' },
  { icon: Camera, text: '추억 기록 & 공유' },
  { icon: Share2, text: '블로그 공유 가능' },
];

// CityDto 전체를 받아서 부모로 전달
const handleCitySelect = (cityInfo: CityDto) => {
  emit('city-select', cityInfo);
};

const handleCreatePlan = () => {
  emit('create-plan');
};

const scrollToFeatures = () => {
  const featuresSection = document.getElementById('features-section');
  if (featuresSection) {
    featuresSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
};
</script>

<template>
  <div class="flex min-h-full flex-col justify-between py-4 sm:py-6 lg:py-8">
    <div class="mx-auto flex max-w-screen-xl flex-1 items-center px-4">
      <div class="grid w-full items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
        <!-- Left Content -->
        <div class="space-y-4 sm:space-y-6 lg:space-y-8">
          <div class="space-y-2 sm:space-y-3">
            <h1
              class="text-2xl leading-tight font-bold text-gray-800 sm:text-3xl lg:text-4xl xl:text-5xl"
            >
              여행의 시작과 끝을
              <br />
              <span class="from-bold bg-gradient-to-r to-blue-600 bg-clip-text text-transparent">
                함께하는
              </span>
              <br />
              여행 플래너
            </h1>
            <p class="text-sm leading-relaxed text-gray-600 sm:text-base lg:text-lg">
              친구들과의 여행을 계획하고, 기록하며, AI가 생성하는
              <br class="hidden sm:block" />
              감성적인 여행 스토리까지 경험해보세요
            </p>
          </div>

          <!-- Highlights -->
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div
              v-for="(highlight, index) in highlights"
              :key="index"
              class="flex items-center gap-2 rounded-lg bg-white/50 p-2 backdrop-blur-sm sm:gap-3 sm:p-3"
            >
              <div class="rounded-full bg-blue-50 p-1.5 sm:p-2">
                <component :is="highlight.icon" class="h-4 w-4 text-blue-600 sm:h-6 sm:w-6" />
              </div>
              <span class="text-sm font-medium text-gray-700 sm:text-base">
                {{ highlight.text }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right Content - Button Section -->
        <div class="flex flex-col items-start justify-start space-y-4 pt-4 sm:space-y-6 lg:pt-8">
          <!-- 도시 선택 컴포넌트 - 고정 위치 -->
          <CitySelector :selected-city="selectedCity" @city-select="handleCitySelect" />

          <!-- 버튼 공간 - 항상 동일한 높이 유지 -->
          <div class="min-h-[64px] w-full max-w-sm sm:min-h-[80px]">
            <!-- 도시 선택 후 나타나는 메인 CTA 버튼 -->
            <Transition
              enter-active-class="transition-all duration-500 ease-out"
              enter-from-class="opacity-0 transform translate-y-4"
              enter-to-class="opacity-100 transform translate-y-0"
              leave-active-class="transition-all duration-300 ease-in"
              leave-from-class="opacity-100 transform translate-y-0"
              leave-to-class="opacity-0 transform translate-y-4"
            >
              <Button
                v-if="selectedCity"
                @click="handleCreatePlan"
                size="lg"
                class="to-secondary text-bold-foreground hover:bg-bold/80 h-16 w-full rounded-2xl bg-gradient-to-br from-blue-50 px-4 text-base font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl sm:h-20 sm:px-6 sm:text-lg"
              >
                <div class="flex w-full items-center justify-center">
                  <MapPin class="mr-2 h-5 w-5 flex-shrink-0" />
                  <div class="flex flex-1 flex-col items-center">
                    <span class="text-sm font-medium sm:text-base">
                      {{ selectedCity.cityKo }}(으)로 여행 계획 생성하기
                    </span>
                    <span class="mt-1 text-xs text-gray-500">친구들과 함께 계획해보세요</span>
                  </div>
                  <ArrowRight class="ml-2 h-5 w-5 flex-shrink-0 opacity-50" />
                </div>
              </Button>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <!-- 아래로 스크롤 버튼 - 화면 하단에 고정 -->
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 transform sm:bottom-6 lg:bottom-3">
      <button
        @click="scrollToFeatures"
        size="lg"
        class="group flex flex-col items-center gap-1 rounded-full px-4 py-3 text-gray-600 transition-all duration-300 hover:text-blue-600 sm:gap-2 sm:px-6 sm:py-4"
      >
        <span class="text-xs font-medium sm:text-sm">더 자세히 알아보기</span>
        <div class="duration-300sm:p-2 rounded-full bg-white/80 p-1.5 shadow-sm transition-all">
          <ChevronDown class="h-4 w-4 animate-bounce sm:h-5 sm:w-5" />
        </div>
      </button>
    </div>
  </div>
</template>
