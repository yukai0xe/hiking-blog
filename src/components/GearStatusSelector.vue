<template>
  <div class="flex gap-2 flex-wrap mt-1">
    <button
      v-for="s in statusOptions" :key="s.value"
      type="button"
      class="status-btn"
      :class="[`status-btn--${s.value}`, { 'status-btn--active': model === s.value }]"
      @click="model = s.value"
    >{{ s.label }}</button>
  </div>
</template>

<script setup lang="ts">
import type { GearStatus } from '../types'
import { statusOptions } from '../composables/useGearForm'

const model = defineModel<GearStatus>({ required: true })
</script>

<style scoped>
.status-btn {
  padding: 5px 12px; border-radius: 20px;
  font-size: 12px; font-family: Inter, sans-serif; font-weight: 600;
  cursor: pointer; border: 1px solid var(--c-border);
  color: var(--c-inkMuted); background: transparent;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.status-btn:hover { color: var(--c-ink); border-color: var(--c-ink); }
.status-btn--owned.status-btn--active    { color: var(--c-ink);      border-color: var(--c-ink);      background: color-mix(in srgb, var(--c-ink) 10%, transparent); }
.status-btn--wishlist.status-btn--active { color: var(--c-primary);  border-color: var(--c-primary);  background: color-mix(in srgb, var(--c-primary) 12%, transparent); }
.status-btn--abandon.status-btn--active  { color: #c47070;           border-color: #c47070;           background: rgba(196,112,112,0.1); }
.status-btn--other.status-btn--active    { color: var(--c-inkMuted); border-color: var(--c-inkMuted); background: color-mix(in srgb, var(--c-inkMuted) 10%, transparent); }
</style>
