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
      class="mb-4 bg-black p-6 text-white hover:bg-black/80"
      @click="planStore.nextStep()"
    >
      {{ planStore.currentStep === 4 ? '완료' : '다음' }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Stepper, StepperItem, StepperTrigger } from '@/components/ui/stepper';
import { usePlanStore } from '@/stores/plan';

const planStore = usePlanStore();
</script>

<style scoped>
.whitespace-pre-line {
  white-space: pre-line;
}
</style>
