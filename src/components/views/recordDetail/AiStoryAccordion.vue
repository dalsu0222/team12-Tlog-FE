<!-- src/components/AiStoryAccordion.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Trash2, RefreshCw, Sparkles, AlertTriangle, Edit3, Save, X } from 'lucide-vue-next';
import api from '@/services/api/api';

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
const errorMessage = ref<string | null>(null);
const isDeleteDialogOpen = ref(false);

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
    } else {
      console.error('응답 데이터 구조가 예상과 다릅니다:', response.data);
      errorMessage.value = '생성에 실패했습니다';
    }
  } catch (err: any) {
    console.error('AI 스토리 생성 실패:', err);

    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      console.warn('요청 타임아웃 발생');
      errorMessage.value = '생성 시간이 너무 오래 걸리고 있습니다';
    } else if (err.response?.status === 401) {
      errorMessage.value = '로그인이 필요합니다';
    } else if (err.response?.status === 403) {
      errorMessage.value = '접근 권한이 없습니다';
    } else if (err.response?.status === 404) {
      errorMessage.value = '여행 기록이 부족합니다';
    } else if (err.response?.status >= 500) {
      errorMessage.value = '서버에 일시적인 문제가 발생했습니다';
    } else if (err.response?.data?.message) {
      errorMessage.value = err.response.data.message;
    } else {
      errorMessage.value = '생성에 실패했습니다';
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
    } else {
      errorMessage.value = '재생성에 실패했습니다';
    }
  } catch (err: any) {
    console.error('AI 스토리 재생성 실패:', err);

    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      errorMessage.value = '재생성 시간이 너무 오래 걸리고 있습니다';
    } else if (err.response?.data?.message) {
      errorMessage.value = err.response.data.message;
    } else {
      errorMessage.value = '재생성에 실패했습니다';
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
    // await api.delete(`/api/trips/${props.tripId}/ai-story`);
    console.log('AI 스토리 삭제 (API 미구현)');

    emit('storyDeleted');
    isDeleteDialogOpen.value = false;
    isEditing.value = false;
  } catch (err: any) {
    console.error('AI 스토리 삭제 실패:', err);
    errorMessage.value = 'AI 스토리 삭제에 실패했습니다. 다시 시도해주세요.';
  } finally {
    isDeletingStory.value = false;
  }
};

const saveStory = async () => {
  if (!props.tripId) return;

  try {
    isSavingStory.value = true;
    errorMessage.value = null;

    // TODO: API 구현 후 실제 저장 엔드포인트 호출
    // await api.put(`/api/trips/${props.tripId}/ai-story`, { content: editableContent.value });
    console.log('AI 스토리 저장 (API 미구현):', editableContent.value);

    // 임시로 로컬에서 저장 처리
    emit('storySaved', editableContent.value);
    isEditing.value = false;

    console.log('AI 스토리가 저장되었습니다.');
  } catch (err: any) {
    console.error('AI 스토리 저장 실패:', err);

    if (err.response?.data?.message) {
      errorMessage.value = err.response.data.message;
    } else {
      errorMessage.value = 'AI 스토리 저장에 실패했습니다. 다시 시도해주세요.';
    }
  } finally {
    isSavingStory.value = false;
  }
};

const startEditing = () => {
  isEditing.value = true;
  editableContent.value = props.aiStoryContent || '';
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
</script>

<template>
  <AccordionItem value="step2" class="mb-4 overflow-hidden rounded-lg bg-blue-50">
    <AccordionTrigger class="px-4 py-3 hover:no-underline">
      <div class="flex items-center">
        <span class="font-medium text-blue-800">Step 2</span>
        <span class="ml-4 font-medium">AI 여행 스토리 요약</span>
      </div>
    </AccordionTrigger>
    <AccordionContent class="px-4 pb-4">
      <div class="mb-4 text-sm text-gray-600">
        AI가 여행 스토리를 바탕으로 여행 기록을 생성합니다.
      </div>

      <!-- 스토리가 없는 경우 -->
      <div v-if="!hasStory" class="py-8 text-center">
        <div class="mb-6">
          <div
            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100"
          >
            <Sparkles class="h-8 w-8 text-purple-600" />
          </div>

          <!-- 에러가 있을 때와 없을 때 다른 메시지 표시 -->
          <div v-if="errorMessage">
            <p class="font-medium text-red-600">{{ errorMessage }}</p>
            <p class="mt-1 text-sm text-gray-500">다시 시도해보시거나 잠시 후에 시도해주세요</p>
          </div>
          <div v-else-if="isGeneratingStory">
            <p class="text-gray-600">AI가 여행 기록을 분석하고 있어요... 잠시만 기다려주세요</p>
            <p class="mt-1 text-sm text-gray-500">멋진 스토리를 만들어드릴게요</p>
          </div>
          <div v-else>
            <p class="text-gray-600">아직 생성된 여행 스토리가 없습니다.</p>
            <p class="mt-1 text-sm text-gray-500">
              AI가 당신의 여행을 감동적인 이야기로 만들어드려요
            </p>
          </div>
        </div>

        <Button
          @click="generateAiStory"
          :disabled="isGeneratingStory"
          class="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-white shadow-lg transition-all hover:from-purple-700 hover:to-blue-700 hover:shadow-xl disabled:opacity-50"
          size="lg"
        >
          <Sparkles class="h-5 w-5" :class="{ 'animate-spin': isGeneratingStory }" />
          <span v-if="isGeneratingStory" class="font-medium">마법을 부리는 중...</span>
          <span v-else-if="errorMessage" class="font-medium">다시 시도하기</span>
          <span v-else class="font-medium">AI 스토리 생성하기</span>
        </Button>

        <!-- 진행 상황 표시 (생성 중일 때) -->
        <div v-if="isGeneratingStory" class="mt-4 text-sm text-gray-500">
          <div class="flex items-center justify-center gap-2">
            <div class="h-2 w-2 animate-pulse rounded-full bg-purple-400"></div>
            <div
              class="h-2 w-2 animate-pulse rounded-full bg-purple-400"
              style="animation-delay: 0.2s"
            ></div>
            <div
              class="h-2 w-2 animate-pulse rounded-full bg-purple-400"
              style="animation-delay: 0.4s"
            ></div>
          </div>
        </div>
      </div>

      <!-- 스토리가 있는 경우 -->
      <div v-else>
        <!-- 스토리 컨텐츠 -->
        <div
          class="prose prose-blue max-w-none overflow-hidden rounded-xl border bg-white shadow-sm"
        >
          <!-- 헤더 with 액션 버튼들 -->
          <div class="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
            <div class="flex items-center justify-between">
              <h3 class="flex items-center gap-2 text-lg font-semibold text-white">
                <Sparkles class="h-5 w-5" />
                나만의 여행 스토리
              </h3>

              <!-- 액션 버튼들 -->
              <div class="flex items-center gap-2">
                <!-- 편집 모드가 아닐 때 -->
                <template v-if="!isEditing">
                  <Button
                    @click="startEditing"
                    :disabled="isGeneratingStory || isDeletingStory"
                    size="sm"
                    variant="ghost"
                    class="hover:bg-opacity-20 text-white hover:bg-white"
                  >
                    <Edit3 class="h-4 w-4" />
                  </Button>

                  <Button
                    @click="regenerateStory"
                    :disabled="isGeneratingStory || isDeletingStory"
                    size="sm"
                    variant="ghost"
                    class="hover:bg-opacity-20 text-white hover:bg-white"
                  >
                    <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isGeneratingStory }" />
                  </Button>

                  <!-- 삭제 Dialog -->
                  <Dialog v-model:open="isDeleteDialogOpen">
                    <DialogTrigger asChild>
                      <Button
                        :disabled="isGeneratingStory || isDeletingStory"
                        size="sm"
                        variant="ghost"
                        class="hover:bg-opacity-20 text-white hover:bg-red-500"
                      >
                        <Trash2 class="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent class="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle class="flex items-center gap-2">
                          <AlertTriangle class="h-5 w-5 text-red-500" />
                          스토리를 삭제하시겠어요?
                        </DialogTitle>
                        <DialogDescription class="text-gray-600">
                          이 작업은 되돌릴 수 없습니다. 소중한 여행 스토리가 영원히 삭제됩니다.
                          정말로 삭제하시겠어요?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter class="flex-col-reverse gap-2 sm:flex-row">
                        <Button
                          variant="outline"
                          @click="isDeleteDialogOpen = false"
                          :disabled="isDeletingStory"
                          class="w-full sm:w-auto"
                        >
                          취소
                        </Button>
                        <Button
                          variant="destructive"
                          @click="deleteStory"
                          :disabled="isDeletingStory"
                          class="w-full sm:w-auto"
                        >
                          <Trash2
                            class="mr-2 h-4 w-4"
                            :class="{ 'animate-bounce': isDeletingStory }"
                          />
                          <span v-if="isDeletingStory">삭제 중...</span>
                          <span v-else>삭제</span>
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </template>

                <!-- 편집 모드일 때 -->
                <template v-else>
                  <Button
                    @click="saveStory"
                    :disabled="isSavingStory || !hasChanges"
                    size="sm"
                    variant="ghost"
                    class="hover:bg-opacity-20 text-white hover:bg-green-500 disabled:opacity-50"
                  >
                    <Save class="h-4 w-4" :class="{ 'animate-pulse': isSavingStory }" />
                  </Button>

                  <Button
                    @click="cancelEditing"
                    :disabled="isSavingStory"
                    size="sm"
                    variant="ghost"
                    class="hover:bg-opacity-20 text-white hover:bg-red-500"
                  >
                    <X class="h-4 w-4" />
                  </Button>
                </template>
              </div>
            </div>

            <!-- 편집 모드일 때 상태 표시 -->
            <div
              v-if="isEditing"
              class="text-opacity-90 mt-2 flex items-center gap-2 text-sm text-white"
            >
              <Edit3 class="h-4 w-4" />
              <span>편집 모드</span>
              <span v-if="hasChanges" class="bg-opacity-20 rounded-full bg-white px-2 py-1 text-xs">
                변경사항 있음
              </span>
            </div>
          </div>

          <!-- 컨텐츠 영역 -->
          <div class="p-6">
            <!-- 편집 모드 -->
            <div v-if="isEditing">
              <Textarea
                v-model="editableContent"
                class="min-h-96 w-full resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                placeholder="여행 스토리를 입력하세요..."
              />

              <div class="mt-4 flex items-center justify-end text-sm text-gray-500">
                <div class="flex items-center gap-4">
                  <div>
                    <span>{{ editableContent.length }} 글자</span>
                    <span v-if="hasChanges" class="ml-2 text-blue-600">• 변경사항이 있습니다</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 읽기 모드 -->
            <div v-else>
              <div
                v-html="editableContent?.replace(/\n/g, '<br>')"
                class="leading-relaxed text-gray-700"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </AccordionContent>
  </AccordionItem>
</template>
