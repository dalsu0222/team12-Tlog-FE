<template>
  <div class="flex w-22 flex-col items-center justify-between py-4">
    <Stepper
      :model-value="planStore.currentStep"
      orientation="vertical"
      :allow-step-click="true"
      class="flex w-full flex-col gap-10"
    >
      <StepperItem
        v-for="step in planStore.steps"
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
            @click="planStore.setCurrentStep(step.step)"
          >
            {{ step.label }}
          </div>
        </StepperTrigger>
      </StepperItem>
    </Stepper>

    <Button
      v-if="planStore.currentStep <= planStore.steps.length"
      :disabled="planStore.isSubmitting"
      class="mb-4 bg-black p-6 text-white hover:bg-black/80"
      @click="handleStepAction"
    >
      {{ planStore.isSubmitting ? '⏳' : planStore.currentStep === 4 ? '완료' : '다음' }}
    </Button>
  </div>
</template>
<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Stepper, StepperItem, StepperTrigger } from '@/components/ui/stepper';
import { usePlanStore } from '@/stores/plan';
import { useRoute, useRouter } from 'vue-router';

const planStore = usePlanStore();
const route = useRoute();
const router = useRouter();

const handleStepAction = async () => {
  if (planStore.currentStep === 4) {
    // Step 4에서 완료 버튼 클릭 시
    try {
      let cityId: number;
      let cityName: string;

      if (planStore.isEditMode && planStore.editModeData) {
        // 편집 모드: 저장된 데이터에서 가져오기
        cityId = planStore.editModeData.cityId;
        cityName = planStore.editModeData.cityName;
      } else {
        // 생성 모드: route params에서 가져오기
        cityId = parseInt(route.params.cityId as string) || 1;
        cityName = (route.params.cityKo as string) || '서울';
      }
      const tripId = await planStore.submitTripPlan(cityId, cityName);

      if (planStore.isEditMode) {
        // 편집 완료 시
        alert('여행 계획이 성공적으로 수정되었습니다!');

        // 디테일 페이지로 이동
        await router.push({
          path: `/plan/${tripId}`,
        });
      } else {
        // 생성 완료 시
        alert(`여행 계획이 성공적으로 생성되었습니다! (Trip ID: ${tripId})`);

        // 디테일 페이지로 이동
        await router.push({
          path: `/plan/${tripId}`,
        });
      }
    } catch (error) {
      console.error('여행 계획 처리 실패:', error);

      const action = planStore.isEditMode ? '수정' : '생성';
      alert(`여행 계획 ${action}에 실패했습니다. 다시 시도해주세요.`);
    }
  } else {
    // 다른 Step에서는 기존대로 다음 단계로
    planStore.nextStep();
  }
};
</script>

<style scoped>
.whitespace-pre-line {
  white-space: pre-line;
}
</style>
