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

      <!-- Image Upload Section -->
      <div class="space-y-2">
        <!-- <label class="block text-center text-sm font-medium text-gray-700">
          Day {{ plan.day }} 대표 사진
        </label> -->

        <!-- Image Preview -->
        <div v-if="imageUrl" class="relative">
          <img
            :src="imageUrl"
            :alt="`Day ${plan.day} 사진`"
            class="h-64 w-full cursor-pointer rounded-lg border-2 border-gray-200 object-cover transition-opacity hover:opacity-90"
            @click="triggerFileUpload"
          />
          <button
            @click="removeImage"
            class="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow-md transition-colors hover:bg-red-600"
            title="사진 삭제"
          >
            ×
          </button>
          <!-- <div
            class="bg-opacity-50 absolute bottom-2 left-2 rounded bg-black px-2 py-1 text-xs text-white"
          >
            클릭하여 변경
          </div> -->
        </div>

        <!-- Upload Button -->
        <div v-else class="relative">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="handleFileUpload"
            class="hidden"
          />
          <button
            @click="triggerFileUpload"
            :disabled="uploading"
            class="flex h-64 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-500 transition-all hover:border-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div v-if="uploading" class="flex flex-col items-center">
              <div class="mb-2 h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500"></div>
              <span class="text-sm">업로드 중...</span>
            </div>
            <div v-else class="flex flex-col items-center">
              <svg class="mb-2 h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
              <span class="text-sm font-medium">사진 추가</span>
              <span class="mt-1 text-xs text-gray-400">JPG, PNG, GIF (최대 10MB)</span>
            </div>
          </button>
        </div>

        <!-- Upload Error Message -->
        <div v-if="uploadError" class="rounded bg-red-50 p-2 text-center text-xs text-red-500">
          {{ uploadError }}
        </div>
      </div>

      <!-- Plans List -->
      <div v-if="plan.plans && plan.plans.length > 0" class="max-h-64 space-y-2 overflow-y-auto">
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
          <span class="text-sm">{{ item.placeName || item.memo || '장소 정보가 없습니다' }}</span>
        </div>
      </div>
      <div v-else class="py-2 text-center text-sm text-gray-500">일정이 없습니다</div>

      <!-- Memo Section -->
      <div class="mt-auto flex flex-col space-y-2">
        <label class="block text-center text-sm font-medium text-gray-700">
          Day {{ plan.day }} 여행 기록
        </label>
        <Textarea
          v-model="cardMemo"
          placeholder="이 날의 여행 경험과 느낌을 기록해보세요...&#10;&#10;- 오늘 방문한 장소들의 인상&#10;- 맛있었던 음식이나 특별한 경험&#10;- 함께한 사람들과의 추억"
          class="h-32 resize-none rounded-lg border-0 bg-gray-50 text-sm leading-relaxed focus:border-transparent focus:ring-2 focus:ring-blue-500"
          @input="handleMemoUpdate"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Textarea } from '@/components/ui/textarea';
import api from '@/services/api/api';
import { toast } from 'vue-sonner';

interface TripPlan {
  day: number;
  plans: {
    placeName?: string;
    memo?: string;
    [key: string]: any;
  }[];
}

interface Props {
  plan: TripPlan;
  memo: string;
  imageUrl?: string;
  originalName?: string;
  date?: Date;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update-memo': [day: number, value: string];
  'update-image': [day: number, imageUrl: string | null, originalName: string | null];
}>();

// 로컬 상태
const cardMemo = ref('');
const imageUrl = ref(props.imageUrl || '');
const originalName = ref(props.originalName || '');
const uploading = ref(false);
const uploadError = ref('');
const fileInput = ref<HTMLInputElement>();

// Props 변경 감지
watch(
  () => props.memo,
  newMemo => {
    cardMemo.value = newMemo;
  },
  { immediate: true }
);

watch(
  () => props.imageUrl,
  newImageUrl => {
    imageUrl.value = newImageUrl || '';
  },
  { immediate: true }
);

watch(
  () => props.originalName,
  newOriginalName => {
    originalName.value = newOriginalName || '';
  },
  { immediate: true }
);

// 메모 업데이트 처리
const handleMemoUpdate = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  const newValue = target.value;
  cardMemo.value = newValue;
  emit('update-memo', props.plan.day, newValue);
};

// 파일 업로드 트리거
const triggerFileUpload = () => {
  uploadError.value = '';
  fileInput.value?.click();
};

// 파일 검증
const validateFile = (file: File): string | null => {
  // 파일 크기 검증 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    return '파일 크기는 10MB를 초과할 수 없습니다.';
  }

  // 파일 타입 검증
  if (!file.type.startsWith('image/')) {
    return '이미지 파일만 업로드 가능합니다.';
  }

  // 허용되는 확장자 검증
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return '지원하지 않는 파일 형식입니다. (JPG, PNG, GIF만 가능)';
  }

  return null;
};

// 파일 업로드 처리
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  // 파일 검증
  const validationError = validateFile(file);
  if (validationError) {
    uploadError.value = validationError;
    target.value = ''; // 파일 입력 초기화
    return;
  }

  try {
    uploading.value = true;
    uploadError.value = '';

    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/trips/image/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data?.data) {
      const { imageUrl: newImageUrl, originalName: newOriginalName } = response.data.data;

      // 로컬 상태 업데이트
      imageUrl.value = newImageUrl;
      originalName.value = newOriginalName;

      // 부모 컴포넌트에 변경사항 전달
      emit('update-image', props.plan.day, newImageUrl, newOriginalName);

      // 성공 토스트
      toast.success('사진이 업로드되었습니다!', {
        description: `Day ${props.plan.day} 사진이 추가되었어요`,
        duration: 2000,
      });
    }
  } catch (error: any) {
    console.error('이미지 업로드 실패:', error);

    // 에러 타입별 메시지 처리
    if (error.response?.status === 400) {
      uploadError.value = error.response.data?.message || '파일 업로드 조건을 확인해주세요.';
    } else if (error.response?.status === 401) {
      uploadError.value = '로그인이 필요합니다.';
    } else if (error.response?.status === 413) {
      uploadError.value = '파일 크기가 너무 큽니다.';
    } else if (error.code === 'ERR_NETWORK') {
      uploadError.value = '네트워크 연결을 확인해주세요.';
    } else {
      uploadError.value = '이미지 업로드에 실패했습니다. 다시 시도해주세요.';
    }

    // 에러 토스트
    toast.error('사진 업로드 실패', {
      description: uploadError.value,
      duration: 3000,
    });
  } finally {
    uploading.value = false;
    // 파일 입력 초기화
    if (target) target.value = '';
  }
};

// 이미지 제거
const removeImage = () => {
  if (confirm('이미지를 삭제하시겠습니까?')) {
    imageUrl.value = '';
    originalName.value = '';
    uploadError.value = '';
    emit('update-image', props.plan.day, null, null);

    toast.success('사진이 삭제되었습니다', {
      description: `Day ${props.plan.day} 사진이 제거되었어요`,
      duration: 2000,
    });
  }
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
