<template>
  <div class="flex justify-between mt-8 pt-6 border-t border-border/40">
    <button v-if="step > 1"
      class="flex items-center gap-1.5 px-5 py-2.5 rounded-lg card-aged text-inkMuted font-body font-medium cursor-pointer hover:text-ink transition-colors duration-200"
      @click="$emit('prev')"
    >
      <ArrowLeftIcon :size="14" /> 上一步
    </button>
    <div v-else />
    <button v-if="step < totalSteps"
      class="btn-cta flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-semibold font-body cursor-pointer"
      @click="$emit('next')"
    >
      下一步 <ArrowRightIcon :size="14" />
    </button>
    <button v-else
      class="btn-cta flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold font-body cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      :disabled="loading || !canSave"
      @click="$emit('save')"
    >
      <span v-if="loading" class="w-4 h-4 border-2 rounded-full animate-spin border-current border-t-transparent" />
      <SaveIcon v-else :size="15" />
      {{ loading ? '儲存中…' : '儲存' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon, Save as SaveIcon } from 'lucide-vue-next'

defineProps<{
  step:       number
  totalSteps: number
  loading:    boolean
  canSave:    boolean
}>()

defineEmits<{
  prev: []
  next: []
  save: []
}>()
</script>
