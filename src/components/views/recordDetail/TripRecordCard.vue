<!-- src/components/TripRecordCard.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue';
import { Textarea } from '@/components/ui/textarea';

interface TripPlan {
  day: number;
  plans: {
    placeName: string; // placeName 추가
    [key: string]: any;
  }[];
}

interface Props {
  plan: TripPlan;
  memo: string;
  date?: Date;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update-memo': [day: number, value: string];
}>();

// 로컬 메모 상태
const cardMemo = ref('');

// props.memo 변경을 감지하여 cardMemo 업데이트
watch(
  () => props.memo,
  newMemo => {
    cardMemo.value = newMemo;
  },
  { immediate: true }
);

// 사용자 입력 처리
const handleMemoUpdate = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  const newValue = target.value;

  // 로컬 상태 업데이트
  cardMemo.value = newValue;

  // 부모 컴포넌트에 변경사항 전달
  emit('update-memo', props.plan.day, newValue);
};

// 날짜 포맷팅 함수
const formatDate = (date: Date): string => {
  return date
    .toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\. /g, '.')
    .replace(/\.$/, '');
};
</script>

<template>
  <div
    class="h-full min-h-96 rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-blue-50 p-6"
  >
    <div class="flex h-full flex-col space-y-3">
      <!-- Day Header with Date -->
      <div class="flex items-center justify-between">
        <span class="text-lg font-semibold text-gray-800">Day {{ plan.day }}</span>
        <span v-if="date" class="text-base text-gray-500">{{ formatDate(date) }}</span>
      </div>

      <!-- Plans List -->
      <div v-if="plan.plans && plan.plans.length > 0" class="max-h-40 space-y-2 overflow-y-auto">
        <div
          v-for="(item, index) in plan.plans"
          :key="index"
          class="flex items-center gap-3 rounded-lg bg-white p-2"
        >
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white"
          >
            {{ index + 1 }}
          </div>
          <!-- placeName을 사용하도록 변경 -->
          <span class="text-sm">{{ item.placeName || '장소 정보가 없습니다' }}</span>
        </div>
      </div>
      <div v-else class="py-4 text-center text-sm text-gray-500">일정이 없습니다</div>

      <!-- Memo Section -->
      <div class="mt-auto flex flex-col space-y-2">
        <label class="block text-center text-sm font-medium text-gray-700">
          Day {{ plan.day }} 여행 기록
        </label>
        <Textarea
          v-model="cardMemo"
          placeholder="이 날의 여행 경험과 느낌을 기록해보세요...&#10;&#10;예시:&#10;- 오늘 방문한 장소들의 인상&#10;- 맛있었던 음식이나 특별한 경험&#10;- 함께한 사람들과의 추억"
          class="h-32 resize-none rounded-lg border-0 bg-gray-50 text-sm leading-relaxed"
          @input="handleMemoUpdate"
        />
      </div>
    </div>
  </div>
</template>
