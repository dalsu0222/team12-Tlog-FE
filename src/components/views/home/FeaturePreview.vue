<script setup lang="ts">
import { Sparkles, PenTool } from 'lucide-vue-next';
import { computed } from 'vue';

interface Props {
  index: number;
}

const props = defineProps<Props>();

// 인덱스에 따른 색상 및 배경 설정
const colorClasses = computed(() => {
  if (props.index === 0) {
    // 첫 번째 카드 (여행 계획) - 블루 계열
    return {
      containerBg: 'bg-gradient-to-br from-gray-50 to-blue-50',
      numberBg: 'bg-blue-500',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-600',
    };
  } else {
    // 두 번째 카드 (AI 여행 후기) - 퍼플 계열
    return {
      containerBg: 'bg-gradient-to-br from-gray-50 to-purple-50',
      numberBg: 'bg-purple-500',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-600',
    };
  }
});
</script>

<template>
  <div :class="[colorClasses.containerBg, 'mt-4 rounded-2xl border border-gray-100 p-6']">
    <!-- 여행 계획 미리보기 -->
    <div v-if="index === 0" class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="font-semibold text-gray-800">파리 여행 계획</span>
        <span class="text-sm text-gray-500">2024.03.15 - 2024.03.20</span>
      </div>
      <div class="space-y-2">
        <div class="flex items-center gap-3 rounded-lg bg-white p-2">
          <div
            :class="[
              colorClasses.numberBg,
              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white',
            ]"
          >
            1
          </div>
          <span class="text-sm">에펠탑 & 샹젤리제 거리</span>
        </div>
        <div class="flex items-center gap-3 rounded-lg bg-white p-2">
          <div
            :class="[
              colorClasses.numberBg,
              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white',
            ]"
          >
            2
          </div>
          <span class="text-sm">루브르 박물관</span>
        </div>
      </div>
    </div>

    <!-- AI 스토리 미리보기 -->
    <div v-else class="space-y-3">
      <div class="flex items-center gap-2">
        <Sparkles :class="[colorClasses.iconColor, 'h-5 w-5']" />
        <span class="font-semibold text-gray-800">AI가 생성한 여행 스토리</span>
      </div>
      <div class="text-sm leading-relaxed text-gray-600 italic">
        "파리의 첫 날, 에펠탑을 바라보며 느꼈던 그 설렘을 잊을 수가 없다.
        <br />
        친구들과 함께한 이 순간이..."
      </div>
      <div :class="[colorClasses.textColor, 'flex items-center gap-2 text-xs']">
        <PenTool class="h-4 w-4" />
        <span>편집 가능한 마크다운 형식</span>
      </div>
    </div>
  </div>
</template>
