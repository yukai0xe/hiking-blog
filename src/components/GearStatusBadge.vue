<template>
  <span class="status-badge" :class="`status-badge--${status}`">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GearStatus } from '../types'

const props = defineProps<{ status: GearStatus }>()

const label = computed(() => ({
  owned:    '已擁有',
  wishlist: '願望清單',
  abandon:  '已淘汰',
  other:    '未分組',
}[props.status]))
</script>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-family: Inter, sans-serif;
  font-weight: 600;
  border: 1px solid var(--c-border);
  color: var(--c-inkMuted);
}
.status-badge--owned    { color: var(--c-ink);     border-color: var(--c-ink);     background: color-mix(in srgb, var(--c-ink) 10%, transparent); }
.status-badge--wishlist { color: var(--c-primary); border-color: var(--c-primary); background: color-mix(in srgb, var(--c-primary) 12%, transparent); }
.status-badge--abandon  { color: #c47070;           border-color: #c47070;          background: rgba(196,112,112,0.1); }
.status-badge--other    { color: var(--c-inkMuted); border-color: var(--c-border);  background: transparent; }
</style>
