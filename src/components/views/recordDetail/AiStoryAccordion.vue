<!-- src/components/AiStoryAccordion.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sparkles, AlertTriangle, ArrowRight } from 'lucide-vue-next';
import { PenTool } from 'lucide-vue-next';
import api from '@/services/api/api';
import { toast } from 'vue-sonner';

// 분리된 컴포넌트들 import
import AiStoryEmpty from './AiStoryEmpty.vue';
import AiStoryHeader from './AiStoryHeader.vue';
import AiStoryContent from './AiStoryContent.vue';

interface Props {
  tripId: number | string;
  aiStoryContent: string | null;
  hasStory: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['storyGenerated', 'storyDeleted', 'storySaved']);

const isGeneratingStory = ref(false);
const isDeletingStory = ref(false);
const isSavingStory = ref(false);
const isEditing = ref(false);
const errorMessage = ref<string | null>(null); // 지속적인 에러만 표시 (예: 타임아웃)
const showPreview = ref(false); // 읽기 모드에서 마크다운 프리뷰 토글
const editViewMode = ref<'split' | 'edit' | 'preview'>('split'); // 편집 모드에서 뷰 모드

// 편집용 텍스트
const editableContent = ref('');

// props가 변경될 때 편집 가능한 콘텐츠 업데이트
watch(
  () => props.aiStoryContent,
  newContent => {
    if (newContent && !isEditing.value) {
      editableContent.value = newContent;
    }
  },
  { immediate: true }
);

const generateAiStory = async () => {
  if (!props.tripId) {
    console.error('tripId가 없습니다:', props.tripId);
    return;
  }

  try {
    console.log('AI 스토리 생성 시작 - tripId:', props.tripId);
    isGeneratingStory.value = true;
    errorMessage.value = null;

    const url = `/api/trips/${props.tripId}/ai-story`;
    console.log('요청 URL:', url);

    // 타임아웃을 5분(300초)으로 설정
    const response = await api.post(
      url,
      {},
      {
        timeout: 300000, // 5분 = 300,000ms
      }
    );

    console.log('AI 스토리 생성 응답:', response);

    if (response.data && response.data.data) {
      console.log('AI 스토리 내용:', response.data.data.aiStory);
      editableContent.value = response.data.data.aiStory;
      emit('storyGenerated', response.data.data.aiStory);

      // Sonner Toast로 성공 메시지 표시
      toast.success('AI 스토리가 성공적으로 생성되었습니다! ✨', {
        description: '멋진 여행 스토리가 완성되었어요',
        duration: 4000,
      });
    } else {
      console.error('응답 데이터 구조가 예상과 다릅니다:', response.data);
      toast.error('스토리 생성에 실패했습니다', {
        description: '다시 시도해주세요',
      });
    }
  } catch (err: any) {
    console.error('AI 스토리 생성 실패:', err);

    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      console.warn('요청 타임아웃 발생');
      errorMessage.value = '생성 시간이 너무 오래 걸리고 있습니다. 잠시 후 다시 시도해주세요.';
    } else if (err.response?.status === 401) {
      toast.error('로그인이 필요합니다', {
        description: '다시 로그인해주세요',
      });
    } else if (err.response?.status === 403) {
      toast.error('접근 권한이 없습니다', {
        description: '여행 참여자만 이용할 수 있습니다',
      });
    } else if (err.response?.status === 404) {
      toast.error('여행 기록이 부족합니다', {
        description: '먼저 여행 기록을 작성해주세요',
      });
    } else if (err.response?.status >= 500) {
      toast.error('서버에 일시적인 문제가 발생했습니다', {
        description: '잠시 후 다시 시도해주세요',
      });
    } else if (err.response?.data?.message) {
      toast.error('오류가 발생했습니다', {
        description: err.response.data.message,
      });
    } else {
      toast.error('스토리 생성에 실패했습니다', {
        description: '다시 시도해주세요',
      });
    }
  } finally {
    isGeneratingStory.value = false;
  }
};

const regenerateStory = async () => {
  if (!props.tripId) return;

  try {
    console.log('AI 스토리 재생성 시작 - tripId:', props.tripId);
    isGeneratingStory.value = true;
    errorMessage.value = null;

    // 재생성도 같은 타임아웃 적용
    const response = await api.post(
      `/api/trips/${props.tripId}/ai-story`,
      {},
      {
        timeout: 300000, // 5분
      }
    );

    console.log('AI 스토리 재생성 응답:', response);

    if (response.data && response.data.data) {
      editableContent.value = response.data.data.aiStory;
      emit('storyGenerated', response.data.data.aiStory);

      // 편집 모드 해제
      isEditing.value = false;

      // Sonner Toast로 성공 메시지 표시
      toast.success('AI 스토리가 성공적으로 재생성되었습니다! 🔄', {
        description: '새로운 스토리로 업데이트되었어요',
        duration: 4000,
      });
    } else {
      toast.error('재생성에 실패했습니다', {
        description: '다시 시도해주세요',
      });
    }
  } catch (err: any) {
    console.error('AI 스토리 재생성 실패:', err);

    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      toast.error('재생성 시간이 너무 오래 걸리고 있습니다', {
        description: '잠시 후 다시 시도해주세요',
      });
    } else if (err.response?.data?.message) {
      toast.error('재생성에 실패했습니다', {
        description: err.response.data.message,
      });
    } else {
      toast.error('재생성에 실패했습니다', {
        description: '다시 시도해주세요',
      });
    }
  } finally {
    isGeneratingStory.value = false;
  }
};

const deleteStory = async () => {
  if (!props.tripId) return;

  try {
    isDeletingStory.value = true;
    errorMessage.value = null;

    // TODO: API 구현 후 실제 삭제 엔드포인트 호출
    await api.delete(`/api/trips/${props.tripId}/ai-story`);

    emit('storyDeleted');
    isEditing.value = false;

    // Sonner Toast로 성공 메시지 표시
    toast.success('AI 스토리가 삭제되었습니다 🗑️', {
      description: '스토리가 완전히 제거되었어요',
      duration: 3000,
    });
  } catch (err: any) {
    console.error('AI 스토리 삭제 실패:', err);
    toast.error('삭제에 실패했습니다', {
      description: 'AI 스토리 삭제에 실패했습니다. 다시 시도해주세요.',
    });
  } finally {
    isDeletingStory.value = false;
  }
};

const saveStory = async () => {
  if (!props.tripId) return;

  try {
    isSavingStory.value = true;
    errorMessage.value = null;

    console.log('AI 스토리 저장 시작 - tripId:', props.tripId);
    console.log('저장할 내용:', editableContent.value);

    const requestData = {
      aiStory: editableContent.value,
    };

    console.log('요청 데이터:', requestData);

    const response = await api.post(`/api/trips/${props.tripId}/ai-story/save`, requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('저장 응답:', response);

    if (response.data && response.data.statusCode === 200) {
      // 성공적으로 저장됨
      emit('storySaved', editableContent.value);
      isEditing.value = false;

      // Sonner Toast로 성공 메시지 표시
      toast.success('AI 스토리가 성공적으로 저장되었습니다! 💾', {
        description: '변경사항이 안전하게 저장되었어요',
        duration: 3000,
      });

      console.log('AI 스토리가 성공적으로 저장되었습니다.');
    } else {
      throw new Error('예상하지 못한 응답 구조');
    }
  } catch (err: any) {
    console.error('AI 스토리 저장 실패:', err);
    console.error('에러 상세:', {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
    });

    if (err.response?.status === 400) {
      toast.error('잘못된 요청입니다', {
        description: '입력 내용을 확인해주세요',
      });
    } else if (err.response?.status === 401) {
      toast.error('로그인이 필요합니다', {
        description: '다시 로그인해주세요',
      });
    } else if (err.response?.status === 403) {
      toast.error('저장 권한이 없습니다', {
        description: '여행 참여자만 저장할 수 있습니다',
      });
    } else if (err.response?.status === 404) {
      toast.error('여행을 찾을 수 없습니다', {
        description: '여행 정보를 확인해주세요',
      });
    } else if (err.response?.data?.message) {
      toast.error('저장에 실패했습니다', {
        description: err.response.data.message,
      });
    } else {
      toast.error('저장에 실패했습니다', {
        description: 'AI 스토리 저장에 실패했습니다. 다시 시도해주세요.',
      });
    }
  } finally {
    isSavingStory.value = false;
  }
};

const startEditing = () => {
  isEditing.value = true;
  editableContent.value = props.aiStoryContent || '';
  errorMessage.value = null;
  editViewMode.value = 'split';
};

const cancelEditing = () => {
  isEditing.value = false;
  editableContent.value = props.aiStoryContent || '';
  errorMessage.value = null;
};

// 편집 모드에서 변경사항이 있는지 확인
const hasChanges = computed(() => {
  return editableContent.value !== props.aiStoryContent;
});

// 복사 함수
const copyToClipboard = async () => {
  const textToCopy = isEditing.value ? editableContent.value : props.aiStoryContent || '';

  try {
    await navigator.clipboard.writeText(textToCopy);
    toast.success('클립보드에 복사되었습니다! 📋', {
      description: '다른 곳에 붙여넣기 할 수 있어요',
      duration: 2000,
    });
  } catch (err) {
    console.error('복사 실패:', err);
    toast.error('복사에 실패했습니다', {
      description: '다시 시도해주세요',
    });
  }
};

// 이벤트 핸들러들
const handleGenerate = () => generateAiStory();
const handleStartEditing = () => startEditing();
const handleSaveStory = () => saveStory();
const handleCancelEditing = () => cancelEditing();
const handleCopyToClipboard = () => copyToClipboard();
const handleTogglePreview = () => {
  showPreview.value = !showPreview.value;
};
const handleSetEditViewMode = (mode: 'split' | 'edit' | 'preview') => {
  editViewMode.value = mode;
};
const handleRegenerateStory = () => regenerateStory();
const handleDeleteStory = () => deleteStory();
const handleUpdateEditableContent = (value: string) => {
  editableContent.value = value;
};
</script>

<template>
  <AccordionItem
    value="step2"
    class="group mb-4 overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white to-gray-50 shadow-md transition-all duration-500 hover:shadow-lg"
  >
    <AccordionTrigger class="px-8 py-6 hover:no-underline">
      <div class="flex items-center gap-4">
        <div
          class="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-3 transition-transform duration-300 group-hover:scale-110"
        >
          <Sparkles class="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800">AI 여행 후기</h3>
          <div class="mt-2 flex items-center gap-2">
            <span class="text-base font-medium text-purple-600">AI 스토리 생성하기</span>
            <ArrowRight
              class="h-4 w-4 text-purple-600 transition-transform duration-300 group-hover:translate-x-1"
            />
          </div>
        </div>
      </div>
    </AccordionTrigger>
    <AccordionContent class="px-8 pb-6">
      <div class="space-y-4">
        <!-- Description -->
        <p class="text-base leading-relaxed text-gray-600">
          AI가 여행 기록을 바탕으로 감성적인 블로그를 생성해드려요
        </p>

        <!-- Feature Details -->
        <div class="flex items-center gap-2 p-0 text-xs text-purple-600">
          <PenTool class="h-4 w-4" />
          <span class="text-base">편집 가능한 마크다운 형식</span>
        </div>
      </div>

      <!-- 지속적인 에러 메시지만 표시 (예: 타임아웃 등) -->
      <div v-if="errorMessage" class="mt-6 mb-4">
        <div class="rounded-lg border border-red-200 bg-red-50 p-3">
          <div class="flex items-center gap-2">
            <AlertTriangle class="h-4 w-4 text-red-500" />
            <span class="text-sm text-red-700">{{ errorMessage }}</span>
          </div>
        </div>
      </div>

      <!-- 스토리가 없는 경우 -->
      <div v-if="!hasStory" class="mt-6">
        <AiStoryEmpty :is-generating-story="isGeneratingStory" @generate="handleGenerate" />
      </div>

      <!-- 스토리가 있는 경우 -->
      <div v-else class="mt-6">
        <!-- 스토리 컨텐츠 -->
        <div
          class="prose prose-blue max-w-none overflow-hidden rounded-xl border bg-white shadow-sm"
        >
          <!-- 헤더 컴포넌트 -->
          <AiStoryHeader
            :is-editing="isEditing"
            :is-generating-story="isGeneratingStory"
            :is-saving-story="isSavingStory"
            :is-deleting-story="isDeletingStory"
            :show-preview="showPreview"
            :edit-view-mode="editViewMode"
            :has-changes="hasChanges"
            @start-editing="handleStartEditing"
            @save-story="handleSaveStory"
            @cancel-editing="handleCancelEditing"
            @copy-to-clipboard="handleCopyToClipboard"
            @toggle-preview="handleTogglePreview"
            @set-edit-view-mode="handleSetEditViewMode"
            @regenerate-story="handleRegenerateStory"
            @delete-story="handleDeleteStory"
          />

          <!-- 컨텐츠 컴포넌트 -->
          <AiStoryContent
            :is-editing="isEditing"
            :editable-content="editableContent"
            :ai-story-content="aiStoryContent"
            :show-preview="showPreview"
            :edit-view-mode="editViewMode"
            :is-saving-story="isSavingStory"
            :has-changes="hasChanges"
            @update:editable-content="handleUpdateEditableContent"
          />
        </div>
      </div>
    </AccordionContent>
  </AccordionItem>
</template>

<style scoped>
/* 애니메이션 추가 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
