// stores/plan.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { PlaceResult } from '@/composables/plan/usePlaceSearch';
import { createTripPlan, updateTripPlan, type CreateTripPlanRequest } from '@/services/api';

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

  // 편집 모드 관련 상태 추가
  const isEditMode = ref(false);
  const originalTripId = ref<number | null>(null);
  const editModeData = ref<{ cityId: number; cityName: string } | null>(null);

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

  const isSubmitting = ref(false);

  // 여행 계획 제출 함수
  const submitTripPlan = async (cityId: number, cityName: string) => {
    if (isSubmitting.value) return;

    try {
      isSubmitting.value = true;

      // 데이터 변환
      const planData = convertToPlanData(cityId, cityName);

      // 편집 모드인지 확인
      if (isEditMode.value && originalTripId.value) {
        // 편집 모드: 업데이트 API 호출
        const response = await updateTripPlan(originalTripId.value, planData);

        if ('data' in response) {
          console.log('여행 계획 수정 성공:', response.data.tripId);
          return response.data.tripId;
        } else {
          throw new Error(response.message);
        }
      } else {
        // 생성 모드: 기존 생성 API 호출
        const response = await createTripPlan(planData);

        if ('data' in response) {
          console.log('여행 계획 생성 성공:', response.data.tripId);
          return response.data.tripId;
        } else {
          throw new Error(response.message);
        }
      }
    } catch (error) {
      console.error('여행 계획 처리 실패:', error);
      throw error;
    } finally {
      isSubmitting.value = false;
    }
  };

  // store 데이터를 API 형식으로 변환
  const convertToPlanData = (cityId: number, cityName: string): CreateTripPlanRequest => {
    const places: CreateTripPlanRequest['places'] = [];
    let globalOrder = 1;

    // 각 일차별로 순서대로 처리
    for (let day = 1; day <= getTravelDays.value; day++) {
      const dayPlan = dayPlans.value[day];
      if (!dayPlan) continue;

      // 숙소 먼저 추가 (있는 경우)
      if (dayPlan.accommodation) {
        places.push({
          placeId: dayPlan.accommodation.placeId,
          name: dayPlan.accommodation.name,
          latitude: dayPlan.accommodation.location.lat(),
          longitude: dayPlan.accommodation.location.lng(),
          day: day,
          order: globalOrder++,
          placeType: 1, // 숙소
        });
      }

      // 일반 장소들 추가
      dayPlan.places.forEach(place => {
        places.push({
          placeId: place.placeId,
          name: place.name,
          latitude: place.location.lat(),
          longitude: place.location.lng(),
          day: day,
          order: globalOrder++,
          placeType: 2, // 명소
        });
      });
    }
    return {
      friendUserIds: [], // TODO: 실제 친구 ID로 변환 필요
      cityId: cityId,
      startDate: selectedDateRange.value.start?.toISOString() || '',
      endDate: selectedDateRange.value.end?.toISOString() || '',
      title: `${cityName} 여행`,
      places: places,
    };
  };

  // 편집 모드 설정 함수
  // 편집 모드 설정 함수 (디버깅 로그 추가)
  const setEditMode = (tripId: number, cityId: number, cityName: string) => {
    console.log('🔧 setEditMode 호출됨');
    console.log('🔧 tripId:', tripId);
    console.log('🔧 cityId:', cityId);
    console.log('🔧 cityName:', cityName);

    console.log('🔧 설정 전 - isEditMode:', isEditMode.value);
    console.log('🔧 설정 전 - originalTripId:', originalTripId.value);
    console.log('🔧 설정 전 - editModeData:', editModeData.value);

    isEditMode.value = true;
    originalTripId.value = tripId;
    editModeData.value = { cityId, cityName };

    console.log('🔧 설정 후 - isEditMode:', isEditMode.value);
    console.log('🔧 설정 후 - originalTripId:', originalTripId.value);
    console.log('🔧 설정 후 - editModeData:', editModeData.value);
  };

  // 편집 모드 해제 함수
  const clearEditMode = () => {
    isEditMode.value = false;
    originalTripId.value = null;
    editModeData.value = null;
  };

  // planStore 초기화 함수 (편집 모드에서 나갈 때 사용)
  const resetStore = () => {
    // 모든 상태를 초기값으로 리셋
    currentStep.value = 1;
    drawerOpen.value = true;
    showDrawerContent.value = true;
    dayPlans.value = {};
    selectedDateRange.value = { start: null, end: null };
    tempDateRange.value = { start: null, end: null };
    showDatePicker.value = true;
    invitedFriends.value = [];
    inviteNickname.value = '';
    accommodationSettings.value = {
      type: '',
      priceRange: { min: 0, max: 0 },
      amenities: [],
    };
    searchResults.value = [];
    searchFilters.value = {
      category: '',
      distance: 0,
      rating: 0,
    };
    isSubmitting.value = false;
    clearEditMode();
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

    // 편집 모드 관련 상태
    isEditMode,
    originalTripId,
    editModeData,

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
    isSubmitting,
    submitTripPlan,

    // 편집 모드 관련 액션
    setEditMode,
    clearEditMode,
    resetStore,
  };
});
