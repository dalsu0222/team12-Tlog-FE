// stores/plan.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { PlaceResult } from '@/composables/plan/usePlaceSearch';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

// DayPlan 타입 정의를 store로 이동
export interface DayPlan {
  accommodation?: PlaceResult;
  places: PlaceResult[];
}

export const usePlanStore = defineStore('plan', () => {
  // Step 관리
  const currentStep = ref(1);
  const steps = [
    { step: 1, label: 'STEP 1\n날짜 설정' },
    { step: 2, label: 'STEP 2\n친구 초대' },
    { step: 3, label: 'STEP 3\n숙소 설정' },
    { step: 4, label: 'STEP 4\n장소 검색' },
  ];

  // Drawer 관리
  const drawerOpen = ref(true);
  const showDrawerContent = ref(true);

  // 여행 계획 데이터 - 각 일차별 장소들
  const dayPlans = ref<Record<number, DayPlan>>({});

  // Step 1: 날짜 설정
  const selectedDateRange = ref<DateRange>({
    start: null,
    end: null,
  });
  const tempDateRange = ref<DateRange>({
    start: null,
    end: null,
  });
  const showDatePicker = ref(true);

  // Step 2: 친구 초대
  const invitedFriends = ref<string[]>([]);
  const inviteNickname = ref('');

  // Step 3: 숙소 설정
  const accommodationSettings = ref({
    type: '',
    priceRange: { min: 0, max: 0 },
    amenities: [] as string[],
  });

  // Step 4: 장소 검색
  const searchResults = ref([]);
  const searchFilters = ref({
    category: '',
    distance: 0,
    rating: 0,
  });

  const isDrawerVisible = computed(() => currentStep.value >= 3);

  const getTravelDays = computed(() => {
    if (!selectedDateRange.value.start || !selectedDateRange.value.end) return 0;
    const start = new Date(selectedDateRange.value.start);
    const end = new Date(selectedDateRange.value.end);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const timeDiff = end.getTime() - start.getTime();
    return Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;
  });

  // 숙소만 있는 일차들
  const accommodationDays = computed(() => {
    return Object.entries(dayPlans.value)
      .filter(([, plan]) => plan.accommodation)
      .map(([day, plan]) => ({
        day: Number(day),
        accommodation: plan.accommodation!,
      }));
  });

  // 일반 장소들이 있는 일차들
  const placeDays = computed(() => {
    return Object.entries(dayPlans.value)
      .filter(([, plan]) => plan.places.length > 0)
      .map(([day, plan]) => ({
        day: Number(day),
        places: plan.places,
      }));
  });

  // Actions
  const setCurrentStep = (step: number) => {
    currentStep.value = step;
  };

  const nextStep = () => {
    if (currentStep.value < steps.length) {
      currentStep.value++;
    }
  };

  const toggleDrawer = () => {
    drawerOpen.value = !drawerOpen.value;
  };

  const setDateRange = (range: DateRange) => {
    selectedDateRange.value = range;
  };

  // DayPlans 관련 액션들
  const initializeDayPlans = () => {
    const travelDays = getTravelDays.value;
    for (let day = 1; day <= travelDays; day++) {
      if (!dayPlans.value[day]) {
        dayPlans.value[day] = {
          accommodation: undefined,
          places: [],
        };
      }
    }

    // 여행 일수보다 긴 day는 삭제
    for (const key of Object.keys(dayPlans.value)) {
      const day = Number(key);
      if (day > travelDays) {
        delete dayPlans.value[day];
      }
    }
  };

  const addAccommodationToDay = (day: number, place: PlaceResult) => {
    if (!dayPlans.value[day]) {
      dayPlans.value[day] = { accommodation: undefined, places: [] };
    }
    dayPlans.value[day].accommodation = place;
  };

  const addPlaceToDay = (day: number, place: PlaceResult) => {
    if (!dayPlans.value[day]) {
      dayPlans.value[day] = { accommodation: undefined, places: [] };
    }
    dayPlans.value[day].places.push(place);
  };

  const removePlaceFromDay = (day: number, placeId: string) => {
    if (!dayPlans.value[day]) return;

    // 숙소 삭제 확인
    if (dayPlans.value[day].accommodation?.placeId === placeId) {
      dayPlans.value[day].accommodation = undefined;
      return;
    }

    // 일반 장소 삭제
    dayPlans.value[day].places = dayPlans.value[day].places.filter(p => p.placeId !== placeId);
  };

  const hasAccommodationForDay = (day: number): boolean => {
    return dayPlans.value[day]?.accommodation !== undefined;
  };

  const isPlaceAlreadyPlanned = (placeId: string): boolean => {
    return Object.values(dayPlans.value).some(
      dayPlan =>
        dayPlan.accommodation?.placeId === placeId ||
        dayPlan.places.some(p => p.placeId === placeId)
    );
  };

  const addFriend = (nickname: string) => {
    if (nickname && !invitedFriends.value.includes(nickname)) {
      invitedFriends.value.push(nickname);
    }
  };

  const removeFriend = (nickname: string) => {
    const index = invitedFriends.value.indexOf(nickname);
    if (index > -1) {
      invitedFriends.value.splice(index, 1);
    }
  };

  const updateAccommodationSettings = (settings: Partial<typeof accommodationSettings.value>) => {
    accommodationSettings.value = { ...accommodationSettings.value, ...settings };
  };

  const updateSearchFilters = (filters: Partial<typeof searchFilters.value>) => {
    searchFilters.value = { ...searchFilters.value, ...filters };
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return {
    // State
    currentStep,
    steps,
    drawerOpen,
    showDrawerContent,
    dayPlans,
    selectedDateRange,
    tempDateRange,
    showDatePicker,
    invitedFriends,
    inviteNickname,
    accommodationSettings,
    searchResults,
    searchFilters,

    // Computed
    isDrawerVisible,
    getTravelDays,
    accommodationDays,
    placeDays,

    // Actions
    setCurrentStep,
    nextStep,
    toggleDrawer,
    setDateRange,
    initializeDayPlans,
    addAccommodationToDay,
    addPlaceToDay,
    removePlaceFromDay,
    hasAccommodationForDay,
    isPlaceAlreadyPlanned,
    addFriend,
    removeFriend,
    updateAccommodationSettings,
    updateSearchFilters,
    formatDate,
  };
});
