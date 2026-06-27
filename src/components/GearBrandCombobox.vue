<template>
  <div class="relative" ref="wrapRef">
    <input
      v-model="model"
      type="text"
      class="input-field text-sm"
      placeholder="品牌名稱"
      autocomplete="off"
      @focus="showDropdown = true"
    />
    <Transition name="brand-drop">
      <div v-if="showDropdown && suggestions.length" class="brand-dropdown">
        <button
          v-for="b in suggestions" :key="b"
          type="button"
          class="brand-option"
          :class="{ 'brand-option--active': model === b }"
          @mousedown.prevent="model = b; showDropdown = false"
        >{{ b }}</button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'

const props = defineProps<{ existingBrands: string[] }>()
const model = defineModel<string>({ required: true })

const showDropdown = ref(false)
const wrapRef = ref<HTMLElement | null>(null)

const suggestions = computed(() => {
  const q = model.value.trim().toLowerCase()
  if (!q) return props.existingBrands
  return props.existingBrands.filter(b => b.toLowerCase().includes(q))
})

function onClickOutside(e: MouseEvent) {
  if (!wrapRef.value?.contains(e.target as Node)) showDropdown.value = false
}

watch(showDropdown, (val) => {
  if (val) document.addEventListener('mousedown', onClickOutside)
  else document.removeEventListener('mousedown', onClickOutside)
})

onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.brand-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0; right: 0;
  z-index: 50;
  background: var(--c-card);
  border: 1px solid color-mix(in srgb, var(--c-border) 70%, transparent);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.35);
  overflow: hidden;
  max-height: 200px;
  overflow-y: auto;
}
.brand-option {
  display: block; width: 100%; text-align: left;
  padding: 8px 12px; font-size: 13px;
  font-family: var(--font-body, sans-serif);
  color: var(--c-inkMuted); cursor: pointer;
  transition: background 0.1s, color 0.1s;
}
.brand-option:hover { background: color-mix(in srgb, var(--c-primary) 10%, transparent); color: var(--c-ink); }
.brand-option--active { background: color-mix(in srgb, var(--c-primary) 14%, transparent); color: var(--c-primary); font-weight: 600; }
.brand-drop-enter-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.brand-drop-leave-active { transition: opacity 0.08s ease, transform 0.08s ease; }
.brand-drop-enter-from, .brand-drop-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
