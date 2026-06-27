<template>
  <div class="flex items-center gap-2 mt-1">
    <button
      v-for="n in max"
      :key="n"
      type="button"
      class="text-xl leading-none transition-colors duration-100 cursor-pointer"
      :class="n <= (model ?? 0) ? 'text-primary' : 'text-inkMuted opacity-30'"
      @click="model = model === n ? null : n"
    >★</button>
    <span v-if="model && labels[model - 1]" class="text-xs font-body text-inkMuted ml-1">
      {{ labels[model - 1] }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  max:    number
  labels: string[]
}>()

const model = defineModel<number | null>({ default: null })
</script>
