<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { usePlanStore } from '@/stores/plan';

const planStore = usePlanStore();
const nicknameError = ref('');
const showError = ref(false);

// 닉네임 유효성 검사
const validateNickname = (nickname: string) => {
  if (!nickname.trim()) return '닉네임을 입력해주세요.';
  if (nickname.length < 2) return '닉네임은 2글자 이상이어야 합니다.';
  if (nickname.length > 20) return '닉네임은 20글자 이하여야 합니다.';
  if (planStore.invitedFriends.includes(nickname)) return '이미 초대된 친구입니다.';
  return '';
};

// 닉네임 유효성 체크
const isValidNickname = computed(() => {
  const nickname = planStore.inviteNickname?.trim() || '';
  return validateNickname(nickname) === '';
});

const addFriend = () => {
  const nickname = planStore.inviteNickname?.trim() || '';
  const error = validateNickname(nickname);

  if (error) {
    nicknameError.value = error;
    showError.value = true;
    return;
  }

  nicknameError.value = '';
  planStore.addFriend(nickname);
  planStore.inviteNickname = '';
  // 입력 필드를 비운 후 에러 상태도 초기화
  nicknameError.value = '';
  showError.value = false;
};

// 친구 초대 건너뛰기
const skipFriendInvite = () => {
  // 혼자 여행하기 선택 시 다음 단계로
  planStore.nextStep();
};
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
          v-model="planStore.inviteNickname"
          type="text"
          placeholder="친구의 닉네임을 입력하세요"
          class="focus:border-bold focus:ring-bold flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
          @keyup.enter="isValidNickname && addFriend()"
          @input="showError = true"
        />
        <Button :disabled="!isValidNickname" @click="addFriend">초대하기</Button>
      </div>
      <p v-if="showError && nicknameError" class="mt-1 text-sm text-red-500">{{ nicknameError }}</p>
    </div>

    <!-- 초대된 친구 목록 -->
    <div v-if="planStore.invitedFriends.length > 0" class="mb-6">
      <h3 class="mb-3 font-semibold">초대된 친구들 ({{ planStore.invitedFriends.length }}명)</h3>
      <div class="space-y-2">
        <div
          v-for="(friend, index) in planStore.invitedFriends"
          :key="index"
          class="flex items-center justify-between rounded-lg border bg-gray-50 p-3"
        >
          <div class="flex items-center gap-2">
            <div
              class="bg-secondary flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-gray-800"
            >
              {{ friend.charAt(0).toUpperCase() }}
            </div>
            <span class="text-sm">{{ friend }}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="text-red-500 hover:text-red-700"
            @click="planStore.removeFriend(friend)"
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
        <li>• 닉네임으로 친구들을 구분합니다</li>
        <li>• 친구들도 여행 계획에 참여하여 의견을 제시할 수 있습니다</li>
        <li>• 나중에 친구를 추가하거나 제거할 수 있습니다</li>
      </ul>
    </div>

    <!-- 혼자 여행하기 옵션 -->
    <div class="mt-6">
      <Button variant="outline" class="w-full" @click="skipFriendInvite">혼자 여행하기</Button>
    </div>
  </div>
</template>
