<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  CheckCircle, 
  Sparkles, 
  Plus, 
  PenTool, 
  Settings,
  Calendar,
  Users
} from 'lucide-vue-next';

// 사용자 정보와 통계 데이터 타입
interface UserStats {
  totalTrips: number;
  completedRecords: number;
  aiStories: number;
}

interface RecentTrip {
  id: number;
  title: string;
  date: string;
  status: 'planning' | 'recording' | 'completed';
  participants: string[];
}

const router = useRouter();
const authStore = useAuthStore();

// 상태 관리
const userStats = ref<UserStats>({
  totalTrips: 12,
  completedRecords: 8,
  aiStories: 5
});

const recentTrips = ref<RecentTrip[]>([
  {
    id: 1,
    title: '제주도 힐링 3일 여행',
    date: '2025-07-14',
    status: 'recording',
    participants: ['아진짱승윤', 'world_explorer']
  },
  {
    id: 2,
    title: '베트남 5일 문화탐방',
    date: '2025-10-04',
    status: 'planning',
    participants: ['tlog_admin']
  },
  {
    id: 3,
    title: '오사카 맛집 투어',
    date: '2025-05-27',
    status: 'completed',
    participants: []
  }
]);

const isLoading = ref(false);

// 현재 사용자 정보 (authStore에서 가져오기)
const currentUser = authStore.user;

// 상태별 스타일
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'planning':
      return 'bg-blue-100 text-blue-700';
    case 'recording':
      return 'bg-yellow-100 text-yellow-700';
    case 'completed':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'planning':
      return '계획 중';
    case 'recording':
      return '기록 작성 중';
    case 'completed':
      return '완료';
    default:
      return '알 수 없음';
  }
};

// 네비게이션 함수들
const goToHome = () => router.push('/');
const goToRecords = () => router.push('/records');
const goToTripDetail = (tripId: number) => router.push(`/records/${tripId}`);

// 프로필 수정 모달 (임시)
const editProfile = () => {
  alert('프로필 수정 기능은 곧 출시됩니다!');
};

onMounted(() => {
  // 실제로는 여기서 사용자 통계 및 최근 여행 데이터를 API로 가져옴
  // loadUserStats();
  // loadRecentTrips();
});
</script>

<template>
  <div class="mx-auto h-full max-w-screen-xl px-4 py-8">
    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="flex h-64 items-center justify-center">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
    </div>

    <div v-else class="space-y-8">
      <!-- 1. 프로필 헤더 영역 -->
      <Card class="bg-gradient-to-r from-blue-50 to-white">
        <CardContent class="p-8">
          <div class="flex items-center space-x-6">
            <Avatar class="h-20 w-20">
              <AvatarImage :src="currentUser?.profileImage" :alt="currentUser?.nickname" />
              <AvatarFallback class="text-xl font-bold">
                {{ currentUser?.nickname?.charAt(0) || 'U' }}
              </AvatarFallback>
            </Avatar>
            
            <div class="flex-1">
              <h1 class="text-2xl font-bold text-gray-800">{{ currentUser?.nickname || '여행러' }}</h1>
              <p class="text-gray-600">2024년 3월부터 함께</p>
              <p class="text-sm text-gray-500 mt-1">여행의 모든 순간을 함께하는 Tlog 멤버</p>
            </div>

            <Button variant="outline" @click="editProfile" class="flex items-center space-x-2">
              <Settings class="h-4 w-4" />
              <span>프로필 수정</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- 2. 여행 통계 카드들 -->
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <!-- 총 여행 수 -->
        <Card class="transition-all hover:shadow-lg">
          <CardContent class="p-6 text-center">
            <div class="mx-auto mb-4 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <MapPin class="h-6 w-6 text-blue-600" />
            </div>
            <h3 class="text-2xl font-bold text-gray-800">{{ userStats.totalTrips }}개</h3>
            <p class="text-gray-600">총 여행</p>
          </CardContent>
        </Card>

        <!-- 완료된 기록 -->
        <Card class="transition-all hover:shadow-lg">
          <CardContent class="p-6 text-center">
            <div class="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle class="h-6 w-6 text-green-600" />
            </div>
            <h3 class="text-2xl font-bold text-gray-800">{{ userStats.completedRecords }}개</h3>
            <p class="text-gray-600">완료된 기록</p>
          </CardContent>
        </Card>

        <!-- AI 후기 -->
        <Card class="transition-all hover:shadow-lg">
          <CardContent class="p-6 text-center">
            <div class="mx-auto mb-4 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Sparkles class="h-6 w-6 text-purple-600" />
            </div>
            <h3 class="text-2xl font-bold text-gray-800">{{ userStats.aiStories }}개</h3>
            <p class="text-gray-600">AI 후기</p>
          </CardContent>
        </Card>
      </div>

      <!-- 3. 최근 여행 활동 섹션 -->
      <Card>
        <CardContent class="p-8">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-800">최근 여행 활동</h2>
            <Button variant="ghost" size="sm" @click="goToRecords">
              전체 보기 →
            </Button>
          </div>

          <div class="space-y-4">
            <div 
              v-for="trip in recentTrips" 
              :key="trip.id"
              class="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              @click="goToTripDetail(trip.id)"
            >
              <div class="flex-1">
                <h3 class="font-medium text-gray-800">{{ trip.title }}</h3>
                <div class="flex items-center space-x-4 mt-1">
                  <div class="flex items-center text-sm text-gray-500">
                    <Calendar class="h-4 w-4 mr-1" />
                    {{ trip.date }}
                  </div>
                  <div v-if="trip.participants.length > 0" class="flex items-center text-sm text-gray-500">
                    <Users class="h-4 w-4 mr-1" />
                    {{ trip.participants.length }}명과 함께
                  </div>
                </div>
              </div>
              
              <span :class="['px-3 py-1 rounded-full text-xs font-medium', getStatusStyle(trip.status)]">
                {{ getStatusText(trip.status) }}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 4. 빠른 액션 버튼들 -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Button 
          @click="goToHome"
          class="h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
        >
          <div class="flex items-center space-x-3">
            <Plus class="h-5 w-5" />
            <span class="font-medium">새 여행 만들기</span>
          </div>
        </Button>

        <Button 
          @click="goToRecords"
          variant="outline"
          class="h-16 border-2 hover:border-blue-300 hover:bg-blue-50"
        >
          <div class="flex items-center space-x-3">
            <PenTool class="h-5 w-5" />
            <span class="font-medium">기록 작성하기</span>
          </div>
        </Button>

        <Button 
          @click="editProfile"
          variant="outline"
          class="h-16 border-2 hover:border-gray-300 hover:bg-gray-50"
        >
          <div class="flex items-center space-x-3">
            <Settings class="h-5 w-5" />
            <span class="font-medium">계정 설정</span>
          </div>
        </Button>
      </div>
    </div>
  </div>
</template>