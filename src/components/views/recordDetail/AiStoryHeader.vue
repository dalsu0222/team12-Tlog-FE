<!-- src/components/AiStoryHeader.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Trash2,
  RefreshCw,
  Sparkles,
  Edit3,
  Save,
  X,
  Copy,
  Eye,
  Code,
  SplitSquareHorizontal,
  AlertTriangle,
} from 'lucide-vue-next';

interface Props {
  isEditing: boolean;
  isGeneratingStory: boolean;
  isSavingStory: boolean;
  isDeletingStory: boolean;
  showPreview: boolean;
  editViewMode: 'split' | 'edit' | 'preview';
  hasChanges: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits([
  'startEditing',
  'saveStory',
  'cancelEditing',
  'copyToClipboard',
  'togglePreview',
  'setEditViewMode',
  'regenerateStory',
  'deleteStory',
]);

const isDeleteDialogOpen = ref(false);
const isRegenerateDialogOpen = ref(false);

const handleStartEditing = () => emit('startEditing');
const handleSaveStory = () => emit('saveStory');
const handleCancelEditing = () => emit('cancelEditing');
const handleCopyToClipboard = () => emit('copyToClipboard');
const handleTogglePreview = () => emit('togglePreview');
const handleSetEditViewMode = (mode: 'split' | 'edit' | 'preview') => emit('setEditViewMode', mode);
const handleRegenerateStory = () => {
  emit('regenerateStory');
  isRegenerateDialogOpen.value = false;
};
const handleDeleteStory = () => {
  emit('deleteStory');
  isDeleteDialogOpen.value = false;
};
</script>

<template>
  <!-- 그라데이션 헤더 with 액션 버튼들 -->
  <div class="bg-gradient-to-r from-purple-500 to-blue-600 px-6 py-4">
    <div class="flex items-center justify-between">
      <h3 class="flex items-center gap-2 text-lg font-semibold text-white">
        <Sparkles class="h-5 w-5" />
        나만의 여행 스토리
      </h3>

      <!-- 액션 버튼들 -->
      <div class="flex items-center gap-2">
        <!-- 복사 버튼 (항상 표시) -->
        <Button
          @click="handleCopyToClipboard"
          :disabled="isGeneratingStory || isDeletingStory || isSavingStory"
          size="sm"
          variant="ghost"
          class="hover:bg-opacity-20 text-white hover:bg-white"
          title="클립보드에 복사"
        >
          <Copy class="h-4 w-4" />
        </Button>

        <!-- 편집 모드가 아닐 때 -->
        <template v-if="!isEditing">
          <Button
            @click="handleStartEditing"
            :disabled="isGeneratingStory || isDeletingStory || isSavingStory"
            size="sm"
            variant="ghost"
            class="hover:bg-opacity-20 text-white hover:bg-white"
          >
            <Edit3 class="h-4 w-4" />
          </Button>

          <!-- 프리뷰/Raw 토글 버튼 -->
          <Button
            @click="handleTogglePreview"
            :disabled="isGeneratingStory || isDeletingStory || isSavingStory"
            size="sm"
            variant="ghost"
            class="hover:bg-opacity-20 text-white hover:bg-white"
            :title="showPreview ? '마크다운 원본 보기' : '마크다운 프리뷰 보기'"
          >
            <Eye v-if="!showPreview" class="h-4 w-4" />
            <Code v-else class="h-4 w-4" />
          </Button>

          <Button
            @click="isRegenerateDialogOpen = true"
            :disabled="isGeneratingStory || isDeletingStory || isSavingStory"
            size="sm"
            variant="ghost"
            class="hover:bg-opacity-20 text-white hover:bg-white"
          >
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isGeneratingStory }" />
          </Button>

          <!-- 재생성 Dialog -->
          <Dialog v-model:open="isRegenerateDialogOpen">
            <DialogContent class="sm:max-w-md">
              <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                  <RefreshCw class="h-5 w-5 text-blue-500" />
                  스토리를 재생성하시겠어요?
                </DialogTitle>
                <DialogDescription class="text-gray-600">
                  이전 기록이 삭제되고 AI가 새로운 스토리를 생성합니다.
                  <br />
                  현재 스토리는 복구할 수 없습니다. 정말로 재생성하시겠어요?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter class="flex-col-reverse gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  @click="isRegenerateDialogOpen = false"
                  :disabled="isGeneratingStory"
                  class="w-full sm:w-auto"
                >
                  취소
                </Button>
                <Button
                  @click="handleRegenerateStory"
                  :disabled="isGeneratingStory"
                  class="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                >
                  <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': isGeneratingStory }" />
                  <span v-if="isGeneratingStory">재생성 중...</span>
                  <span v-else>재생성하기</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <!-- 삭제 Dialog -->
          <Dialog v-model:open="isDeleteDialogOpen">
            <DialogTrigger asChild>
              <Button
                :disabled="isGeneratingStory || isDeletingStory || isSavingStory"
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
                  이 작업은 되돌릴 수 없습니다.
                  <br />
                  소중한 여행 스토리가 영원히 삭제됩니다. 정말로 삭제하시겠어요?
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
                  @click="handleDeleteStory"
                  :disabled="isDeletingStory"
                  class="w-full sm:w-auto"
                >
                  <Trash2 class="mr-2 h-4 w-4" :class="{ 'animate-bounce': isDeletingStory }" />
                  <span v-if="isDeletingStory">삭제 중...</span>
                  <span v-else>삭제</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </template>

        <!-- 편집 모드일 때 -->
        <template v-else>
          <!-- 편집 뷰 모드 토글 버튼들 -->
          <div class="flex rounded-md bg-white/20 p-1">
            <Button
              @click="handleSetEditViewMode('edit')"
              :variant="editViewMode === 'edit' ? 'default' : 'ghost'"
              size="sm"
              class="h-8 px-2 text-xs"
              :class="
                editViewMode === 'edit'
                  ? 'bg-white text-purple-600'
                  : 'text-white hover:bg-white/20'
              "
            >
              <Code class="h-3 w-3" />
            </Button>
            <Button
              @click="handleSetEditViewMode('split')"
              :variant="editViewMode === 'split' ? 'default' : 'ghost'"
              size="sm"
              class="h-8 px-2 text-xs"
              :class="
                editViewMode === 'split'
                  ? 'bg-white text-purple-600'
                  : 'text-white hover:bg-white/20'
              "
            >
              <SplitSquareHorizontal class="h-3 w-3" />
            </Button>
            <Button
              @click="handleSetEditViewMode('preview')"
              :variant="editViewMode === 'preview' ? 'default' : 'ghost'"
              size="sm"
              class="h-8 px-2 text-xs"
              :class="
                editViewMode === 'preview'
                  ? 'bg-white text-purple-600'
                  : 'text-white hover:bg-white/20'
              "
            >
              <Eye class="h-3 w-3" />
            </Button>
          </div>

          <Button
            @click="handleSaveStory"
            :disabled="isSavingStory || !hasChanges"
            size="sm"
            variant="ghost"
            class="hover:bg-opacity-20 text-white hover:bg-green-500 disabled:opacity-50"
          >
            <Save class="h-4 w-4" :class="{ 'animate-pulse': isSavingStory }" />
          </Button>

          <Button
            @click="handleCancelEditing"
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

    <!-- 편집/저장 모드 상태 표시 -->
    <div
      v-if="isEditing || isSavingStory"
      class="text-opacity-90 mt-2 flex items-center gap-2 text-sm text-white"
    >
      <Edit3 v-if="isEditing && !isSavingStory" class="h-4 w-4" />
      <div
        v-if="isSavingStory"
        class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
      ></div>
      <span v-if="isSavingStory">저장 중...</span>
      <span v-else-if="isEditing">
        편집 모드 -
        <span v-if="editViewMode === 'edit'">마크다운 편집</span>
        <span v-else-if="editViewMode === 'split'">분할 뷰</span>
        <span v-else>프리뷰 모드</span>
      </span>
    </div>
  </div>
</template>
