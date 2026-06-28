<template>
  <div class="num-wrap" :class="{ 'num-wrap--on': focused }">
    <button
      type="button"
      class="num-btn"
      :disabled="min !== undefined && (modelValue ?? 0) <= min"
      tabindex="-1"
      @mousedown.prevent
      @click="decrement"
    >
      <MinusIcon :size="10" />
    </button>
    <input
      type="number"
      :value="modelValue ?? ''"
      :min="min"
      :max="max"
      :placeholder="placeholder"
      class="num-field"
      @focus="focused = true"
      @blur="focused = false"
      @input="onInput"
    />
    <button
      type="button"
      class="num-btn num-btn--right"
      :disabled="max !== undefined && (modelValue ?? 0) >= max"
      tabindex="-1"
      @mousedown.prevent
      @click="increment"
    >
      <PlusIcon :size="10" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Minus as MinusIcon, Plus as PlusIcon } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue: number | null
  min?: number
  max?: number
  step?: number
  placeholder?: string
}>(), { step: 1 })

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

const focused = ref(false)

function decrement() {
  const cur = props.modelValue ?? (props.min ?? 0)
  const next = cur - props.step
  if (props.min !== undefined && next < props.min) return
  emit('update:modelValue', next)
}

function increment() {
  const cur = props.modelValue ?? (props.min ?? 0)
  const next = cur + props.step
  if (props.max !== undefined && next > props.max) return
  emit('update:modelValue', next)
}

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  emit('update:modelValue', val === '' ? null : +val)
}
</script>

<style scoped>
.num-wrap {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  overflow: hidden;
  background: transparent;
  transition: box-shadow 0.15s;
}
.num-wrap--on {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--c-primary) 35%, transparent);
}
.num-btn {
  flex-shrink: 0;
  min-width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-inkMuted);
  background: color-mix(in srgb, var(--c-border) 35%, transparent);
  border: none;
  border-right: 1px solid var(--c-border);
  cursor: pointer;
  padding: 0 6px;
  transition: background 0.12s, color 0.12s;
}
.num-btn--right {
  border-right: none;
  border-left: 1px solid var(--c-border);
}
.num-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--c-primary) 15%, transparent);
  color: var(--c-primary);
}
.num-btn:active:not(:disabled) {
  background: color-mix(in srgb, var(--c-primary) 25%, transparent);
}
.num-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.num-field {
  flex: 1;
  min-width: 0;
  text-align: center;
  padding: 6px 2px;
  font-size: 13px;
  font-family: 'Space Mono', monospace;
  color: var(--c-ink);
  background: transparent;
  border: none;
  outline: none;
  -moz-appearance: textfield;
}
.num-field::-webkit-outer-spin-button,
.num-field::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
