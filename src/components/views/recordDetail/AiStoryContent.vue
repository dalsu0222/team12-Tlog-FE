<!-- src/components/AiStoryContent.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Code } from 'lucide-vue-next';

interface Props {
  isEditing: boolean;
  editableContent: string;
  aiStoryContent: string | null;
  showPreview: boolean;
  editViewMode: 'split' | 'edit' | 'preview';
  isSavingStory: boolean;
  hasChanges: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:editableContent']);

// 마크다운을 HTML로 변환하는 함수
const convertMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';

  return (
    markdown
      // 헤더 변환
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-gray-800 mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-800 mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-800 mt-8 mb-6">$1</h1>')

      // 볼드/이탤릭
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')

      // 리스트
      .replace(/^\- (.*$)/gim, '<li class="ml-4 text-gray-700">• $1</li>')

      // 줄바꿈
      .replace(/\n\n/g, '</p><p class="text-gray-700 leading-relaxed mb-4">')
      .replace(/\n/g, '<br>')

      // 전체를 p 태그로 감싸기
      .replace(/^(.*)$/, '<p class="text-gray-700 leading-relaxed mb-4">$1</p>')
  );
};

const previewHtml = computed(() => {
  const content = props.isEditing ? props.editableContent : props.aiStoryContent || '';
  return convertMarkdownToHtml(content);
});

const updateEditableContent = (value: string | number) => {
  emit('update:editableContent', String(value));
};
</script>

<template>
  <!-- 컨텐츠 영역 -->
  <div class="bg-gradient-to-br from-gray-50 to-purple-50 p-6">
    <!-- 편집 모드 -->
    <div v-if="isEditing">
      <!-- Split View -->
      <div v-if="editViewMode === 'split'" class="grid grid-cols-2 gap-4">
        <!-- 편집 패널 -->
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Code class="h-4 w-4" />
            마크다운 편집
          </div>
          <Textarea
            :model-value="editableContent"
            @update:model-value="updateEditableContent"
            :disabled="isSavingStory"
            class="min-h-96 w-full resize-none border-gray-200 focus:border-purple-500 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="여행 스토리를 입력하세요..."
          />
        </div>

        <!-- 프리뷰 패널 -->
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Eye class="h-4 w-4" />
            실시간 프리뷰
          </div>
          <div class="min-h-96 overflow-y-auto rounded-md border border-gray-200 bg-white p-4">
            <div
              v-if="editableContent.trim()"
              v-html="previewHtml"
              class="prose prose-sm max-w-none"
            ></div>
            <div v-else class="flex h-full items-center justify-center text-gray-400">
              <div class="text-center">
                <Eye class="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>마크다운을 입력하면 실시간으로 프리뷰가 표시됩니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Only View -->
      <div v-else-if="editViewMode === 'edit'">
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Code class="h-4 w-4" />
            마크다운 편집
          </div>
          <Textarea
            :model-value="editableContent"
            @update:model-value="updateEditableContent"
            :disabled="isSavingStory"
            class="min-h-96 w-full resize-none border-gray-200 focus:border-purple-500 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="여행 스토리를 입력하세요..."
          />
        </div>
      </div>

      <!-- Preview Only View -->
      <div v-else-if="editViewMode === 'preview'">
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Eye class="h-4 w-4" />
            프리뷰
          </div>
          <div class="min-h-96 overflow-y-auto rounded-md border border-gray-200 bg-white p-6">
            <div v-if="editableContent.trim()" v-html="previewHtml" class="prose max-w-none"></div>
            <div v-else class="flex h-full items-center justify-center text-gray-400">
              <div class="text-center">
                <Eye class="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>입력된 마크다운이 없습니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 편집 모드 상태 표시 -->
      <div class="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div class="flex items-center gap-4">
          <span>{{ editableContent.length }} 글자</span>
          <span v-if="hasChanges && !isSavingStory" class="text-purple-600">
            • 변경사항이 있습니다
          </span>
          <span v-if="isSavingStory" class="text-orange-600">• 저장 중...</span>
        </div>

        <!-- 저장 진행률 표시 -->
        <div v-if="isSavingStory" class="flex items-center gap-2 text-purple-600">
          <div class="flex space-x-1">
            <div class="h-2 w-2 animate-pulse rounded-full bg-purple-600"></div>
            <div
              class="h-2 w-2 animate-pulse rounded-full bg-purple-600"
              style="animation-delay: 0.2s"
            ></div>
            <div
              class="h-2 w-2 animate-pulse rounded-full bg-purple-600"
              style="animation-delay: 0.4s"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 읽기 모드 -->
    <div v-else>
      <!-- Raw/Preview 토글 표시 -->
      <div class="mb-4 flex items-center gap-2 text-sm font-medium text-gray-700">
        <component :is="showPreview ? Eye : Code" class="h-4 w-4" />
        <span>{{ showPreview ? '마크다운 프리뷰' : '마크다운 원본' }}</span>
      </div>

      <!-- 원본 마크다운 표시 -->
      <div
        v-if="!showPreview"
        class="rounded-md border border-gray-200 bg-white p-4 leading-relaxed whitespace-pre-wrap text-gray-700"
      >
        {{ editableContent }}
      </div>

      <!-- 프리뷰 표시 -->
      <div v-else class="rounded-md border border-gray-200 bg-white p-6">
        <div v-html="previewHtml" class="prose max-w-none"></div>
      </div>
    </div>
  </div>
</template>
