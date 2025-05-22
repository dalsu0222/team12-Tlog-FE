<template>
  <div class="relative h-screen w-screen overflow-hidden">
    <!-- 전체 레이아웃 -->
    <div class="flex h-full">
      <!-- Stepper 영역 -->
      <div class="flex w-22 flex-col items-center justify-between py-4">
        <Stepper
          v-model="currentStep"
          orientation="vertical"
          :allow-step-click="true"
          class="flex w-full flex-col gap-10"
        >
          <StepperItem
            v-for="step in steps"
            :key="step.step"
            v-slot="{ state }"
            :step="step.step"
            :disabled="false"
            class="relative flex w-full items-start gap-4"
          >
            <StepperTrigger as-child>
              <div
                class="cursor-pointer pl-4 text-center text-sm leading-5 font-semibold whitespace-pre-line transition"
                :class="{
                  'text-bold': state === 'active',
                  'text-muted-foreground': state !== 'active',
                }"
                @click="currentStep = step.step"
              >
                {{ step.label }}
              </div>
            </StepperTrigger>
          </StepperItem>
        </Stepper>
        <Button
          v-if="currentStep <= steps.length"
          class="mb-4 bg-black p-6 text-white hover:bg-black/80"
          @click="currentStep++"
        >
          {{ currentStep === 4 ? '완료' : '다음' }}
        </Button>
      </div>

      <!-- 내용 영역 -->
      <div class="relative w-[400px] overflow-y-auto bg-white p-4">
        <div v-if="currentStep === 1">
          <h2 class="mb-4 text-2xl font-bold">Step 1 내용</h2>
          <p>사용자 정보 입력 폼이 들어갈 자리입니다.</p>
        </div>
        <div v-else-if="currentStep === 2">
          <h2 class="mb-4 text-2xl font-bold">Step 2 내용</h2>
          <p>회사 정보 입력 섹션입니다.</p>
        </div>
        <div v-else-if="currentStep === 3">
          <h2 class="mb-4 text-2xl font-bold">Step 3 내용</h2>
          <p>팀원 초대 관련 폼이 여기에 들어갑니다.</p>
        </div>
        <div v-else-if="currentStep === 4">
          <h2 class="mb-4 text-2xl font-bold">Step 4 내용</h2>
          <p>최종 확인 폼이 여기에 들어갑니다.</p>
        </div>
      </div>

      <!-- Drawer + 토글 버튼 (사이에 끼워넣기) -->
      <div
        class="flex items-center transition-all duration-400 ease-in-out"
        :style="{
          width: drawerOpen ? '300px' : '0px',
          minWidth: drawerOpen ? '300px' : '0px',
          overflow: 'hidden',
        }"
      >
        <div
          class="h-full w-[300px] bg-white shadow-lg transition-all duration-400 ease-in-out"
          :style="{
            opacity: drawerOpen && showDrawerContent ? 1 : 0,
            transform: drawerOpen ? 'translateX(0)' : 'translateX(-30px)',
            pointerEvents: drawerOpen ? 'auto' : 'none',
          }"
        >
          <div v-if="showDrawerContent" class="p-4">
            <h3 class="text-lg font-semibold">Drawer 내용</h3>
            <p>여기에 drawer 내용이 들어갑니다.</p>
          </div>
        </div>
      </div>
      <div class="bg-bold relative flex flex-col items-center justify-center">
        <button
          class="absolute left-0 h-10 rounded-r-md bg-white px-2 py-2 text-gray-400"
          @click="toggleDrawer"
          style="z-index: 51"
        >
          <ChevronLeft v-if="drawerOpen" class="h-5 w-5" />
          <ChevronRight v-else class="h-5 w-5" />
        </button>
      </div>

      <!-- 지도 영역 -->
      <div class="flex-1 bg-blue-100 p-4 transition-all duration-300">지도 영역</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Button } from '@/components/ui/button';
import { Stepper, StepperItem, StepperTrigger } from '@/components/ui/stepper';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const currentStep = ref(1);
const drawerOpen = ref(true);
const showDrawerContent = ref(true);

watch(drawerOpen, val => {
  if (val) {
    setTimeout(() => {
      showDrawerContent.value = true;
    }, 200); // transition 시간과 맞추기
  } else {
    showDrawerContent.value = false;
  }
});

const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value;
};

const steps = [
  { step: 1, label: 'STEP 1\n친구 초대' },
  { step: 2, label: 'STEP 2\n날짜 설정' },
  { step: 3, label: 'STEP 3\n숙소 설정' },
  { step: 4, label: 'STEP 4\n장소 검색' },
];
</script>

<style scoped>
.whitespace-pre-line {
  white-space: pre-line;
}
</style>
