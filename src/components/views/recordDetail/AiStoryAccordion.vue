<!-- src/components/AiStoryAccordion.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import api from '@/services/api/api';

interface Props {
  tripId: number | string;
  aiStoryContent: string | null;
  hasStory: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['storyGenerated']);

const isGeneratingStory = ref(false);
const errorMessage = ref<string | null>(null);

const generateAiStory = async () => {
  if (!props.tripId) return;

  try {
    isGeneratingStory.value = true;
    errorMessage.value = null;

    const response = await api.post(`/api/trips/${props.tripId}/ai-story`);

    if (response.data.data) {
      emit('storyGenerated', response.data.data.aiStory);
    }
  } catch (err) {
    console.error('AI 스토리 생성 실패:', err);
    errorMessage.value = 'AI 스토리 생성에 실패했습니다. 다시 시도해주세요.';
  } finally {
    isGeneratingStory.value = false;
  }
};
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

      <div v-if="errorMessage" class="mb-4 rounded-lg bg-red-50 p-4 text-red-600">
        {{ errorMessage }}
      </div>

      <div v-if="!hasStory" class="py-8 text-center">
        <p class="mb-4 text-gray-500">아직 생성된 여행 스토리가 없습니다.</p>
        <Button @click="generateAiStory" :disabled="isGeneratingStory">
          <span v-if="isGeneratingStory">생성 중...</span>
          <span v-else>AI 스토리 생성하기</span>
        </Button>
      </div>

      <div v-else class="prose prose-blue max-w-none rounded-lg border bg-white p-6 shadow-sm">
        <div v-html="aiStoryContent?.replace(/\n/g, '<br>')"></div>
      </div>
    </AccordionContent>
  </AccordionItem>
</template>
