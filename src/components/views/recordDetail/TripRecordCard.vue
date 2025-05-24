<!-- src/components/TripRecordCard.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface TripPlan {
  day: number;
  plans: {
    memo: string;
    [key: string]: any;
  }[];
}

interface Props {
  plan: TripPlan;
  memo: string;
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
  { immediate: true } // 컴포넌트 생성 시 즉시 실행
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
</script>

<template>
  <Card class="h-full min-h-96 bg-white shadow-md transition-all hover:shadow-lg">
    <CardContent class="flex h-full flex-col p-4">
      <!-- Day Header -->
      <div class="mb-3 text-center">
        <h3 class="text-lg font-semibold text-blue-600">Day {{ plan.day }}</h3>
      </div>

      <!-- Plans List -->
      <div
        v-if="plan.plans && plan.plans.length > 0"
        class="mb-4 max-h-50 space-y-2 overflow-y-auto"
      >
        <div
          v-for="(item, index) in plan.plans"
          :key="index"
          class="flex items-start rounded-lg bg-gray-50 p-2"
        >
          <div
            class="text-md mr-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 font-medium text-white"
          >
            {{ index + 1 }}
          </div>
          <div class="text-md flex-1 leading-relaxed">
            {{ item.memo || '장소 정보가 없습니다' }}
          </div>
        </div>
      </div>
      <div v-else class="mb-4 py-4 text-center text-sm text-gray-500">일정이 없습니다</div>

      <!-- Memo Section -->
      <div class="mt-auto flex-1 space-y-2">
        <label class="block text-sm font-medium text-gray-700">Day {{ plan.day }} 여행 기록</label>
        <Textarea
          v-model="cardMemo"
          placeholder="이 날의 여행 경험과 느낌을 자유롭게 기록해보세요...&#10;&#10;예시:&#10;- 오늘 방문한 장소들의 인상&#10;- 맛있었던 음식이나 특별한 경험&#10;- 함께한 사람들과의 추억"
          class="h-full min-h-32 resize-none text-sm leading-relaxed"
          @input="handleMemoUpdate"
        />
      </div>
    </CardContent>
  </Card>
</template>
