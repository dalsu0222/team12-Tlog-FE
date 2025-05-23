<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ArrowRight,
  MapPin,
  PenTool,
  Sparkles,
  Users,
  Calendar,
  Camera,
  Share2,
  Search,
  ChevronDown,
} from 'lucide-vue-next';

const isSearchOpen = ref(false);
const selectedCity = ref('');

// 인기 도시 목록 (실제로는 API에서 가져올 데이터)
const popularCities = [
  { name: '서울', country: '대한민국', emoji: '🇰🇷' },
  { name: '도쿄', country: '일본', emoji: '🇯🇵' },
  { name: '파리', country: '프랑스', emoji: '🇫🇷' },
  { name: '뉴욕', country: '미국', emoji: '🇺🇸' },
  { name: '런던', country: '영국', emoji: '🇬🇧' },
  { name: '바르셀로나', country: '스페인', emoji: '🇪🇸' },
  { name: '로마', country: '이탈리아', emoji: '🇮🇹' },
  { name: '방콕', country: '태국', emoji: '🇹🇭' },
];

const handleStartTrip = () => {
  isSearchOpen.value = true;
};

const handleCitySelect = (city: string) => {
  selectedCity.value = city;
  isSearchOpen.value = false;
  console.log('선택된 도시:', city);
  // 여기서 여행 계획 페이지로 이동하거나 다음 단계 진행
};

const handleCreatePlan = () => {
  console.log('여행 계획 생성하기:', selectedCity.value);
  // router.push('/plan') 등으로 여행 계획 페이지로 이동
};

const features = [
  {
    icon: MapPin,
    title: '여행 계획',
    description: '친구들과 함께 여행 일정을 계획하고 관리하세요',
    details: ['날짜별 여행 루트 설정', '숙소 및 장소 정보 관리', '협업 계획 수립'],
  },
  {
    icon: Sparkles,
    title: 'AI 여행 후기',
    description: 'AI가 여행 기록을 바탕으로 감성적인 블로그를 생성해드려요',
    details: ['여행 계획 기반 자동 생성', '감성적인 블로그 형식', '개인 맞춤 여행 스토리'],
  },
];

const highlights = [
  { icon: Users, text: '친구들과 함께 계획' },
  { icon: Calendar, text: '날짜별 일정 관리' },
  { icon: Camera, text: '추억 기록 & 공유' },
  { icon: Share2, text: '블로그 공유 가능' },
];
</script>

<template>
  <div class="from-primary to-secondary min-h-screen bg-gradient-to-br via-white">
    <!-- Hero Section -->
    <div class="mx-auto max-w-screen-xl px-4 py-12">
      <div class="grid min-h-[80vh] items-center gap-12 lg:grid-cols-2">
        <!-- Left Content -->
        <div class="space-y-8">
          <div class="space-y-4">
            <h1 class="text-5xl leading-tight font-bold text-gray-800 lg:text-6xl">
              여행의 시작과 끝을
              <br />
              <span class="from-bold bg-gradient-to-r to-blue-600 bg-clip-text text-transparent">
                함께하는
              </span>
              <br />
              새로운 여행 플래너
            </h1>
            <p class="text-xl leading-relaxed text-gray-600">
              친구들과의 여행을 계획하고, 기록하며, AI가 생성하는
              <br />
              감성적인 여행 스토리까지 경험해보세요
            </p>
          </div>

          <!-- Highlights -->
          <div class="grid grid-cols-2 gap-4">
            <div
              v-for="(highlight, index) in highlights"
              :key="index"
              class="flex items-center gap-3 rounded-lg bg-white/50 p-3 backdrop-blur-sm"
            >
              <div class="rounded-full bg-blue-50 p-2">
                <component :is="highlight.icon" class="h-6 w-6 text-blue-600" />
              </div>
              <span class="font-medium text-gray-700">{{ highlight.text }}</span>
            </div>
          </div>
        </div>

        <!-- Right Content - Button Section -->
        <div class="flex flex-col items-center justify-center space-y-6">
          <!-- 도시 선택 버튼 -->
          <div class="w-full max-w-sm">
            <Popover v-model:open="isSearchOpen">
              <PopoverTrigger asChild>
                <Button
                  @click="handleStartTrip"
                  size="lg"
                  variant="outline"
                  class="h-16 w-full rounded-xl px-6 text-base font-medium shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <Search class="mr-2 h-5 w-5" />
                  <div class="flex flex-col items-center">
                    <span>{{ selectedCity ? `${selectedCity} 선택됨` : '여행지 선택하기' }}</span>
                    <span class="mt-1 text-xs text-gray-500">어디로 떠나볼까요?</span>
                  </div>
                  <ChevronDown class="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-80 p-0" align="center">
                <Command>
                  <CommandInput placeholder="도시를 검색하세요..." />
                  <CommandList>
                    <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                    <CommandGroup heading="인기 여행지">
                      <CommandItem
                        v-for="city in popularCities"
                        :key="city.name"
                        :value="city.name"
                        @select="handleCitySelect(city.name)"
                        class="cursor-pointer"
                      >
                        <span class="mr-3 text-lg">{{ city.emoji }}</span>
                        <div class="flex flex-col">
                          <span class="font-medium">{{ city.name }}</span>
                          <span class="text-sm text-gray-500">{{ city.country }}</span>
                        </div>
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <!-- 도시 선택 후 나타나는 메인 CTA 버튼 -->
          <div v-if="selectedCity" class="w-full max-w-sm">
            <Button
              @click="handleCreatePlan"
              size="lg"
              class="bg-bold text-bold-foreground hover:bg-bold/90 animate-in fade-in-0 slide-in-from-bottom-4 h-20 w-full rounded-xl px-6 text-lg font-semibold shadow-lg transition-all duration-300 duration-500 hover:scale-105 hover:shadow-xl"
            >
              <div class="flex flex-col items-center">
                <div class="flex items-center">
                  <MapPin class="mr-2 h-5 w-5" />
                  <span>{{ selectedCity }}로 여행 계획 생성하기</span>
                  <ArrowRight class="ml-2 h-5 w-5" />
                </div>
                <span class="text-bold-foreground/80 mt-1 text-sm">친구들과 함께 계획해보세요</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="bg-white py-20">
      <div class="mx-auto max-w-screen-xl px-4">
        <div class="mb-16 text-center">
          <h2 class="mb-4 text-4xl font-bold text-gray-800">Tlog의 주요 기능</h2>
          <p class="text-xl text-gray-600">여행의 모든 순간을 계획부터 기록까지</p>
        </div>

        <div class="grid gap-12 lg:grid-cols-2">
          <Card
            v-for="(feature, index) in features"
            :key="index"
            class="group overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 shadow-md transition-all duration-500 hover:shadow-lg"
          >
            <CardContent class="p-8">
              <div class="space-y-6">
                <!-- Icon & Title -->
                <div class="flex items-center gap-4">
                  <div
                    class="to-secondary rounded-2xl bg-gradient-to-br from-blue-50 p-3 transition-transform duration-300 group-hover:scale-110"
                  >
                    <component :is="feature.icon" class="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 class="text-2xl font-bold text-gray-800">{{ feature.title }}</h3>
                    <div class="mt-2 flex items-center gap-2">
                      <span class="font-medium text-blue-600">자세히 보기</span>
                      <ArrowRight
                        class="h-4 w-4 text-blue-600 transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </div>

                <!-- Description -->
                <p class="text-lg leading-relaxed text-gray-600">
                  {{ feature.description }}
                </p>

                <!-- Feature Details -->
                <div class="space-y-3">
                  <div
                    v-for="(detail, detailIndex) in feature.details"
                    :key="detailIndex"
                    class="flex items-center gap-3"
                  >
                    <div class="bg-bold h-2 w-2 rounded-full"></div>
                    <span class="text-gray-700">{{ detail }}</span>
                  </div>
                </div>

                <!-- Mock Interface Preview -->
                <div
                  class="mt-8 rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-blue-50 p-6"
                >
                  <!-- 여행 계획 미리보기 -->
                  <div v-if="index === 0" class="space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="font-semibold text-gray-800">파리 여행 계획</span>
                      <span class="text-sm text-gray-500">2024.03.15 - 2024.03.20</span>
                    </div>
                    <div class="space-y-2">
                      <div class="flex items-center gap-3 rounded-lg bg-white p-2">
                        <div
                          class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white"
                        >
                          1
                        </div>
                        <span class="text-sm">에펠탑 & 샹젤리제 거리</span>
                      </div>
                      <div class="flex items-center gap-3 rounded-lg bg-white p-2">
                        <div
                          class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white"
                        >
                          2
                        </div>
                        <span class="text-sm">루브르 박물관</span>
                      </div>
                    </div>
                  </div>

                  <!-- AI 스토리 미리보기 -->
                  <div v-else class="space-y-3">
                    <div class="flex items-center gap-2">
                      <Sparkles class="h-5 w-5 text-blue-600" />
                      <span class="font-semibold text-gray-800">AI가 생성한 여행 스토리</span>
                    </div>
                    <div class="text-sm leading-relaxed text-gray-600 italic">
                      "파리의 첫 날, 에펠탑을 바라보며 느꼈던 그 설렘을 잊을 수가 없다. 친구들과
                      함께한 이 순간이..."
                    </div>
                    <div class="flex items-center gap-2 text-xs text-blue-600">
                      <PenTool class="h-4 w-4" />
                      <span>편집 가능한 마크다운 형식</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
