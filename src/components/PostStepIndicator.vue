<template>
  <div class="flex items-center mb-6 card-aged p-4">
    <template v-for="(label, i) in stepLabels" :key="i">
      <div class="flex flex-col items-center gap-1 cursor-pointer" @click="step = i + 1">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200"
          :class="
            step > i + 1   ? 'bg-secondary text-ink opacity-80' :
            step === i + 1 ? 'bg-primary text-[var(--c-cta-text)] shadow-md' :
                             'bg-border/40 text-inkMuted hover:bg-border/70'
          "
        >
          <CheckIcon v-if="step > i + 1" :size="14" />
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span
          class="text-[10px] tracking-wide hidden sm:block font-body"
          :class="
            step === i + 1 ? 'text-primary' :
            step > i + 1   ? 'text-inkMuted' :
                             'text-inkMuted opacity-40'
          "
        >{{ label }}</span>
      </div>
      <div v-if="i < stepLabels.length - 1"
        class="flex-1 h-px mx-2 transition-colors duration-300"
        :class="step > i + 1 ? 'bg-secondary opacity-60' : 'bg-border opacity-40'"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { Check as CheckIcon } from 'lucide-vue-next'

defineProps<{
  totalSteps: number
  stepLabels: string[]
}>()

const step = defineModel<number>('step', { required: true })
</script>
