<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { Button } from '@/components/ui/button';
import { usePlanStore } from '@/stores/plan';
import { checkUserByNickname } from '@/services/api';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth';

const planStore = usePlanStore();
const authStore = useAuthStore();
const nicknameError = ref('');
const showError = ref(false);
const isCheckingUser = ref(false);
const nicknameInput = ref<HTMLInputElement | null>(null);

// 닉네임 유효성 검사 (기본 검사만)
const validateNickname = (nickname: string) => {
  if (!nickname.trim()) return '닉네임을 입력해주세요.';
  if (nickname.length < 2) return '닉네임은 2글자 이상이어야 합니다.';
  if (nickname.length > 20) return '닉네임은 20글자 이하여야 합니다.';
  if (nickname === authStore.user?.nickname) return '본인은 초대할 수 없습니다.';
  if (planStore.invitedFriends.some(friend => friend.nickname === nickname)) {
    return '이미 초대된 친구입니다.';
  }
  return '';
};

const addFriend = async () => {
  const nickname = planStore.inviteNickname?.trim() || '';
  const error = validateNickname(nickname);

  if (error) {
    nicknameError.value = error;
    showError.value = true;
    await nextTick();
    nicknameInput.value?.focus();
    return;
  }

  // API 호출로 사용자 존재 확인
  try {
    isCheckingUser.value = true;
    nicknameError.value = '';
    showError.value = false;

    const response = await checkUserByNickname(nickname);

    if (response.statusCode === 200 && 'data' in response) {
      if (response.data.exists && response.data.userId) {
        // 사용자가 존재하는 경우 - 친구 목록에 추가
        const newFriend = {
          userId: response.data.userId,
          nickname: response.data.nickname || nickname,
        };

        planStore.addFriendWithId(newFriend);
        planStore.inviteNickname = '';
        showError.value = false;
      } else {
        // 사용자가 존재하지 않는 경우
        nicknameError.value = '존재하지 않는 사용자입니다.';
        showError.value = true;
      }
    } else {
      nicknameError.value = response.message || '사용자 확인 중 오류가 발생했습니다.';
      showError.value = true;
    }
  } catch (error) {
    console.error('사용자 확인 API 오류:', error);

    if (error instanceof AxiosError) {
      if (error.response?.status === 400) {
        nicknameError.value = error.response.data?.message || '잘못된 요청입니다.';
      } else if (error.response && error.response.status >= 500) {
        nicknameError.value = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else {
        nicknameError.value = '네트워크 오류가 발생했습니다.';
      }
    } else {
      nicknameError.value = '예상치 못한 오류가 발생했습니다.';
    }

    showError.value = true;
  } finally {
    isCheckingUser.value = false;
    if (showError.value) {
      await nextTick();
      nicknameInput.value?.focus();
    }
  }
};

// 친구 삭제
const removeFriend = (userId: number) => {
  planStore.removeFriendById(userId);
};

// 친구 초대 건너뛰기
const skipFriendInvite = () => {
  // 혼자 여행하기 선택 시 다음 단계로
  planStore.nextStep();
};

// planStore에 초대된 친구들의 userId 배열을 제공하는 함수
const getInvitedFriendIds = (): number[] => {
  return planStore.invitedFriends.map(friend => friend.userId).filter(id => id > 0);
};

// 부모 컴포넌트에서 사용할 수 있도록 노출
defineExpose({
  getInvitedFriendIds,
});
</script>

<template>
  <div>
    <h2 class="mb-4 text-2xl font-bold">함께 갈 친구들을 초대해보세요</h2>
    <p class="mb-6 text-gray-600">닉네임을 입력해서 친구들을 초대하고 함께 여행을 계획해보세요.</p>

    <!-- 친구 초대 폼 -->
    <div class="mb-6">
      <label class="mb-2 block text-sm font-medium">친구 닉네임</label>
      <div class="flex gap-2">
        <input
          ref="nicknameInput"
          v-model="planStore.inviteNickname"
          type="text"
          placeholder="친구의 닉네임을 입력하세요"
          class="focus:border-bold focus:ring-bold flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
          :disabled="isCheckingUser"
          @keyup.enter="addFriend"
          @input="
            () => {
              showError = false;
              nicknameError = '';
            }
          "
        />
        <Button @click="addFriend" class="hover:bg-secondary bg-primary">
          <span v-if="isCheckingUser" class="flex items-center gap-2">
            <div class="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
            확인중...
          </span>
          <span v-else>초대하기</span>
        </Button>
      </div>
      <p v-if="showError && nicknameError" class="mt-1 text-sm text-red-500">{{ nicknameError }}</p>
    </div>

    <!-- 초대된 친구 목록 -->
    <div v-if="planStore.invitedFriends.length > 0" class="mb-6">
      <h3 class="mb-3 font-semibold">초대된 친구들 ({{ planStore.invitedFriends.length }}명)</h3>
      <div class="space-y-2">
        <div
          v-for="friend in planStore.invitedFriends"
          :key="friend.userId"
          class="flex items-center justify-between rounded-lg border bg-gray-50 p-3"
        >
          <div class="flex items-center gap-2">
            <div
              class="bg-secondary flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-gray-800"
            >
              {{ friend.nickname.charAt(0).toUpperCase() }}
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-medium">{{ friend.nickname }}</span>
              <!-- <span class="text-xs text-gray-500">ID: {{ friend.userId }}</span> -->
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="text-red-500 hover:text-red-700"
            @click="removeFriend(friend.userId)"
          >
            삭제
          </Button>
        </div>
      </div>
    </div>

    <!-- 안내 메시지 -->
    <div class="bg-primary rounded-lg p-4">
      <h4 class="mb-2 font-medium text-gray-800">💡 알아두세요</h4>
      <ul class="space-y-1 text-sm text-gray-800">
        <li>• 등록된 사용자만 초대할 수 있습니다</li>
        <li>• 초대된 친구들도 여행 계획에 참여하여 의견을 제시할 수 있습니다</li>
        <li>• 나중에 친구를 추가하거나 제거할 수 있습니다</li>
      </ul>
    </div>

    <!-- 계속하기 및 혼자 여행하기 버튼 -->
    <div class="mt-6 space-y-3">
      <Button class="w-full" @click="planStore.nextStep()" :disabled="isCheckingUser">
        다음 단계로
      </Button>
      <Button variant="outline" class="w-full" @click="skipFriendInvite" :disabled="isCheckingUser">
        혼자 여행하기
      </Button>
    </div>
  </div>
</template>
