<script setup lang="ts">
import { Sparkles, PenTool } from 'lucide-vue-next';

interface Props {
  index: number;
}

const props = defineProps<Props>();
</script>

<template>
  <div
    class="mt-4 rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-blue-50 p-6"
  >
    <!-- 여행 계획 미리보기 -->
    <div v-if="index === 0" class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="font-semibold text-gray-800">파리 여행 계획</span>
        <span class="text-sm text-gray-500">2024.03.15 - 2024.03.20</span>
      </div>
      <div class="space-y-2">
        <div class="flex items-center gap-3 rounded-lg bg-white p-2">
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white"
          >
            1
          </div>
          <span class="text-sm">에펠탑 & 샹젤리제 거리</span>
        </div>
        <div class="flex items-center gap-3 rounded-lg bg-white p-2">
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white"
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
        <Sparkles class="h-5 w-5 text-blue-600" />
        <span class="font-semibold text-gray-800">AI가 생성한 여행 스토리</span>
      </div>
      <div class="text-sm leading-relaxed text-gray-600 italic">
        "파리의 첫 날, 에펠탑을 바라보며 느꼈던 그 설렘을 잊을 수가 없다.
        <br />
        친구들과 함께한 이 순간이..."
      </div>
      <div class="flex items-center gap-2 text-xs text-blue-600">
        <PenTool class="h-4 w-4" />
        <span>편집 가능한 마크다운 형식</span>
      </div>
    </div>
  </div>
</template>
