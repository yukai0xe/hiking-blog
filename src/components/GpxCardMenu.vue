<template>
  <Teleport to="body">
    <div v-if="entry" class="fixed inset-0 z-40" @click="emit('close')" />
    <Transition name="card-menu-pop">
      <div
        v-if="entry"
        class="card-menu fixed z-50"
        :style="{ top: position.top + 'px', right: position.right + 'px' }"
      >
        <button class="card-menu-item" @click.stop="emit('download'); emit('close')">
          <DownloadIcon :size="13" /> 下載 GPX
        </button>
        <button class="card-menu-item" @click.stop="emit('edit'); emit('close')">
          <PencilIcon :size="13" /> 編輯
        </button>
        <div class="card-menu-divider" />
        <button class="card-menu-item card-menu-item-del" @click.stop="emit('delete'); emit('close')">
          <Trash2Icon :size="13" /> 刪除
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Download as DownloadIcon, Pencil as PencilIcon, Trash2 as Trash2Icon } from 'lucide-vue-next'
import type { GpxLibraryEntry } from '../types'

defineProps<{
  entry: GpxLibraryEntry | null
  position: { top: number; right: number }
}>()

const emit = defineEmits<{
  download: []
  edit: []
  delete: []
  close: []
}>()
</script>

<style scoped>
.card-menu-pop-enter-active {
  transition: opacity 0.18s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.card-menu-pop-leave-active {
  transition: opacity 0.13s ease, transform 0.13s ease;
}
.card-menu-pop-enter-from,
.card-menu-pop-leave-to {
  opacity: 0;
  transform: scale(0.85) translateY(-6px);
  transform-origin: top right;
}

.card-menu {
  min-width: 130px; border-radius: 8px; padding: 4px;
  background: color-mix(in srgb, var(--c-card) 95%, black);
  border: 1px solid color-mix(in srgb, var(--c-border) 70%, transparent);
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.card-menu-item {
  display: flex; align-items: center; gap: 7px;
  width: 100%; padding: 6px 10px; border-radius: 5px;
  font-size: 12px; font-family: Inter, sans-serif;
  color: var(--c-inkMuted); cursor: pointer;
  transition: background 0.1s, color 0.1s;
}
.card-menu-item:hover { background: color-mix(in srgb, var(--c-primary) 10%, transparent); color: var(--c-ink); }
.card-menu-item-del { color: #8a4444; }
.card-menu-item-del:hover { background: rgba(220,60,60,0.1); color: #e07070; }
.card-menu-divider { height: 1px; background: var(--c-border); opacity: 0.4; margin: 3px 6px; }
</style>
