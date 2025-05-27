<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, Search, ChevronDown } from 'lucide-vue-next';
import api from '@/services/api/api';

interface Props {
  selectedCity: CityDto | null; // null 허용하도록 수정
}

interface CityDto {
  cityId: number;
  cityEn: string;
  cityKo: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'city-select': [cityInfo: CityDto];
}>();

const isOpen = ref(false);
const allCities = ref<CityDto[]>([]);
const isLoading = ref(false);
const isInitialized = ref(false);

// 전체 도시 목록 조회
const fetchAllCities = async () => {
  if (isInitialized.value) return;

  try {
    isLoading.value = true;
    const response = await api.get('/api/home/cities');

    if (response.data?.data?.cities) {
      allCities.value = response.data.data.cities;
      isInitialized.value = true;
      console.log('도시 데이터 로드 완료:', allCities.value.length, '개 도시');
    }
  } catch (error) {
    console.error('도시 목록 조회 실패:', error);
    allCities.value = [];
  } finally {
    isLoading.value = false;
  }
};

// 초기 로드
onMounted(() => {
  fetchAllCities();
});

const handleCitySelect = (city: CityDto) => {
  emit('city-select', city);
  isOpen.value = false;
};
</script>

<template>
  <div class="w-full max-w-sm">
    <Popover v-model:open="isOpen">
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="isOpen"
          @click="
            () => {
              if (!isInitialized) fetchAllCities();
              isOpen = true;
            }
          "
          class="h-16 w-full justify-center rounded-xl text-base font-medium shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          <div class="flex items-center">
            <Search class="mr-2 h-5 w-5" />
            <div class="flex flex-col items-center">
              <span v-if="props.selectedCity" class="font-medium">
                {{ props.selectedCity.cityKo }}
              </span>
              <span v-else class="text-gray-600">여행지 선택하기</span>
              <span class="mt-1 text-xs text-gray-500">어디로 떠나볼까요?</span>
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        class="w-[380px] rounded-xl border-none p-0 shadow-lg"
        align="center"
        side="bottom"
        :sideOffset="4"
      >
        <Command class="w-full rounded-xl border border-gray-200 p-1 shadow-none">
          <CommandInput placeholder="도시를 검색하세요... (한글/영문 모두 가능)" />
          <CommandList class="max-h-[300px]">
            <CommandEmpty>
              <div v-if="isLoading" class="py-6 text-center text-sm text-gray-500">
                <div class="flex items-center justify-center gap-2">
                  <div
                    class="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
                  ></div>
                  도시 데이터를 불러오는 중...
                </div>
              </div>
              <div v-else class="py-6 text-center text-sm text-gray-500">검색 결과가 없습니다.</div>
            </CommandEmpty>
            <CommandGroup heading="도시 목록">
              <CommandItem
                v-for="city in allCities"
                :key="city.cityId"
                :value="`${city.cityKo} ${city.cityEn}`"
                @select="handleCitySelect(city)"
                class="cursor-pointer px-4 py-3 transition-colors duration-150 hover:bg-blue-50"
              >
                <div class="flex w-full items-center justify-between">
                  <div class="flex flex-col">
                    <span class="font-medium text-gray-900">{{ city.cityKo }}</span>
                    <span class="text-sm text-gray-500">{{ city.cityEn }}</span>
                  </div>
                  <MapPin class="h-4 w-4 text-gray-400" />
                </div>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  </div>
</template>
