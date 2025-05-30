<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MapPin,
  CheckCircle,
  Sparkles,
  Plus,
  Calendar,
  Users,
  Edit,
  FileText,
} from 'lucide-vue-next';
import api from '@/services/api/api';

// 사용자 정보와 통계 데이터 타입
interface UserStats {
  totalTrips: number;
  completedRecords: number;
  aiStories: number;
}

interface TripData {
  trip: {
    tripId: number;
    title: string;
    startDate: string;
    endDate: string;
    createdAt: string;
  };
  hasStep1: boolean;
  hasStep2: boolean;
  tripParticipant?: number[];
}

interface RecentTrip {
  tripId: number;
  title: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'recording' | 'completed';
  participants: number[];
  hasStep1: boolean;
  hasStep2: boolean;
}

const router = useRouter();
const authStore = useAuthStore();

// 상태 관리
const userStats = ref<UserStats>({
  totalTrips: 0,
  completedRecords: 0,
  aiStories: 0,
});

const recentTrips = ref<RecentTrip[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// 현재 사용자 정보 (authStore에서 가져오기)
const currentUser = authStore.user;

// 여행 상태 판단 함수
const getTripStatus = (
  hasStep1: boolean,
  hasStep2: boolean
): 'planning' | 'recording' | 'completed' => {
  if (hasStep2) return 'completed';
  if (hasStep1) return 'recording';
  return 'planning';
};

// 데이터 로드 함수들
const loadUserStats = async () => {
  try {
    // 여행 목록 조회로 통계 계산
    const response = await api.get('/api/trips/record');
    const trips = response.data.data.trips as TripData[];

    userStats.value = {
      totalTrips: trips.length,
      completedRecords: trips.filter(trip => trip.hasStep1).length,
      aiStories: trips.filter(trip => trip.hasStep2).length,
    };
  } catch (err) {
    console.error('사용자 통계 로드 실패:', err);
  }
};

const loadRecentTrips = async () => {
  try {
    const response = await api.get('/api/trips/record');
    const trips = response.data.data.trips as TripData[];

    // 최근 3개 여행만 가져오기 (생성일 기준 내림차순)
    recentTrips.value = trips
      .sort((a, b) => new Date(b.trip.createdAt).getTime() - new Date(a.trip.createdAt).getTime())
      .slice(0, 3)
      .map(tripData => ({
        tripId: tripData.trip.tripId,
        title: tripData.trip.title,
        startDate: tripData.trip.startDate,
        endDate: tripData.trip.endDate,
        status: getTripStatus(tripData.hasStep1, tripData.hasStep2),
        participants: tripData.tripParticipant || [],
        hasStep1: tripData.hasStep1,
        hasStep2: tripData.hasStep2,
      }));
  } catch (err) {
    console.error('최근 여행 로드 실패:', err);
    error.value = '여행 정보를 불러오는데 실패했습니다.';
  }
};

// 네비게이션 함수들
const goToHome = () => router.push('/');
const goToPlanDetail = (tripId: number) => {
  router.push(`/plan/${tripId}`);
};
const goToRecordDetail = (tripId: number) => router.push(`/records/${tripId}`);

// 날짜 포맷팅 함수
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getDate()}일`;
  }

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

onMounted(async () => {
  try {
    isLoading.value = true;
    await Promise.all([loadUserStats(), loadRecentTrips()]);
  } catch (err) {
    console.error('마이페이지 데이터 로드 실패:', err);
    error.value = '페이지를 불러오는데 실패했습니다.';
  } finally {
    isLoading.value = false;
  }
});

const getTravelEmoji = (nickname?: string) => {
  const emojis = ['🧳', '✈️', '🗺️', '🌍', '📸', '🎒', '🏖️', '🏔️'];
  const index = nickname ? nickname.charCodeAt(0) % emojis.length : 0;
  return emojis[index];
};
</script>

<template>
  <div class="mx-auto h-full max-w-screen-xl px-4 py-8">
    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="flex h-64 items-center justify-center">
      <div
        class="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
      ></div>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="rounded-md bg-red-50 p-4 text-center text-red-600">
      {{ error }}
      <Button
        class="ml-4"
        @click="
          () => {
            error = null;
            $router.go(0);
          }
        "
      >
        다시 시도
      </Button>
    </div>

    <div v-else class="space-y-8">
      <!-- 1. 프로필 헤더 + 여행 통계 통합 -->
      <Card class="bg-gradient-to-r from-blue-50 to-white">
        <CardContent class="p-8">
          <!-- 프로필 정보 -->
          <div class="mb-8 flex items-center justify-center space-x-6">
            <Avatar class="h-20 w-20">
              <AvatarFallback class="text-3xl">
                {{ getTravelEmoji(currentUser?.nickname) }}
              </AvatarFallback>
            </Avatar>

            <div>
              <h1 class="text-2xl font-bold text-gray-800">
                {{ currentUser?.nickname || '여행러' }}
              </h1>
            </div>
          </div>

          <!-- 여행 통계 카드들 -->
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <!-- 총 여행 수 -->
            <div class="rounded-lg bg-white p-6 text-center shadow-sm">
              <div
                class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
              >
                <MapPin class="h-6 w-6 text-blue-600" />
              </div>
              <h3 class="text-2xl font-bold text-gray-800">{{ userStats.totalTrips }}개</h3>
              <p class="text-gray-600">총 여행</p>
            </div>

            <!-- 완료된 기록 -->
            <div class="rounded-lg bg-white p-6 text-center shadow-sm">
              <div
                class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100"
              >
                <CheckCircle class="h-6 w-6 text-green-600" />
              </div>
              <h3 class="text-2xl font-bold text-gray-800">{{ userStats.completedRecords }}개</h3>
              <p class="text-gray-600">완료된 기록</p>
            </div>

            <!-- AI 후기 -->
            <div class="rounded-lg bg-white p-6 text-center shadow-sm">
              <div
                class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100"
              >
                <Sparkles class="h-6 w-6 text-purple-600" />
              </div>
              <h3 class="text-2xl font-bold text-gray-800">{{ userStats.aiStories }}개</h3>
              <p class="text-gray-600">AI 후기</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 2. 최근 여행 활동 섹션 -->
      <Card>
        <CardContent class="p-8">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="mx-4 text-xl font-semibold text-gray-800">최근 여행 활동</h2>
          </div>

          <div v-if="recentTrips.length === 0" class="py-8 text-center">
            <p class="mb-4 text-gray-500">아직 여행 기록이 없습니다.</p>
            <Button @click="goToHome">첫 여행 만들기</Button>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="trip in recentTrips"
              :key="trip.tripId"
              class="rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
            >
              <div class="flex items-start justify-between">
                <!-- 여행 정보 -->
                <div class="flex-1">
                  <h3 class="font-medium text-gray-800">{{ trip.title }}</h3>
                  <div class="mt-1 flex items-center space-x-4">
                    <div class="flex items-center text-sm text-gray-500">
                      <Calendar class="mr-1 h-4 w-4" />
                      {{ formatDateRange(trip.startDate, trip.endDate) }}
                    </div>
                    <div
                      v-if="trip.participants.length > 0"
                      class="flex items-center text-sm text-gray-500"
                    >
                      <Users class="mr-1 h-4 w-4" />
                      {{ trip.participants.length }}명과 함께
                    </div>
                  </div>
                </div>

                <!-- 액션 버튼들 -->
                <div class="flex space-x-2">
                  <!-- 계획 버튼 -->
                  <Button
                    variant="outline"
                    size="sm"
                    @click="goToPlanDetail(trip.tripId)"
                    class="flex items-center space-x-1"
                  >
                    <Edit class="h-4 w-4" />
                    <span>계획</span>
                  </Button>

                  <!-- 후기 버튼 -->
                  <Button
                    variant="outline"
                    size="sm"
                    @click="goToRecordDetail(trip.tripId)"
                    class="flex items-center space-x-1"
                  >
                    <FileText class="h-4 w-4" />
                    <span>후기</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 3. 빠른 액션 버튼들 -->
      <div class="grid gap-4 sm:grid-cols-1">
        <Button
          @click="goToHome"
          class="bg-primary hover:bg-secondary h-16 w-full border border-gray-200 text-gray-700 transition-colors"
        >
          <div class="flex items-center space-x-3">
            <Plus class="h-5 w-5" />
            <span class="font-medium">새 여행 만들기</span>
          </div>
        </Button>
      </div>
    </div>
  </div>
</template>
