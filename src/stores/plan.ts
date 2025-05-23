import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface DateRange {
  start: Date | null;
  end: Date | null;
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
  const inviteEmail = ref('');
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

  // Computed
  const isDrawerVisible = computed(() => currentStep.value >= 3);

  const getTravelDays = computed(() => {
    if (!selectedDateRange.value.start || !selectedDateRange.value.end) return 0;
    const timeDiff =
      selectedDateRange.value.end.getTime() - selectedDateRange.value.start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
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

  const addFriend = (email: string) => {
    if (email && !invitedFriends.value.includes(email)) {
      invitedFriends.value.push(email);
    }
  };

  const removeFriend = (email: string) => {
    const index = invitedFriends.value.indexOf(email);
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
    selectedDateRange,
    tempDateRange,
    showDatePicker,
    invitedFriends,
    inviteEmail,
    inviteNickname,
    accommodationSettings,
    searchResults,
    searchFilters,

    // Computed
    isDrawerVisible,
    getTravelDays,

    // Actions
    setCurrentStep,
    nextStep,
    toggleDrawer,
    setDateRange,
    addFriend,
    removeFriend,
    updateAccommodationSettings,
    updateSearchFilters,
    formatDate,
  };
});
