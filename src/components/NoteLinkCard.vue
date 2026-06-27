<template>
  <div class="note-link-card group relative" @click="openLink">
    <!-- Cover image -->
    <div class="note-link-cover">
      <img
        v-if="link.coverImageUrl && !imgError"
        :src="link.coverImageUrl"
        :alt="link.title"
        class="w-full h-full object-cover"
        @error="imgError = true"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <LinkIcon :size="24" class="text-inkMuted opacity-30" />
      </div>
    </div>

    <!-- Info -->
    <div class="px-3 py-2.5">
      <p class="text-sm font-body font-semibold text-ink line-clamp-2 leading-snug">{{ link.title }}</p>
      <p class="text-[11px] font-mono text-inkMuted mt-1 truncate">{{ hostname }}</p>
    </div>

    <!-- Delete button (visible on hover) -->
    <button
      class="note-link-delete opacity-0 group-hover:opacity-100"
      @click.stop="emit('delete')"
      aria-label="刪除連結"
    >
      <XIcon :size="12" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Link as LinkIcon, X as XIcon } from 'lucide-vue-next'
import type { NoteLink } from '../types'

const props = defineProps<{ link: NoteLink }>()
const emit  = defineEmits<{ delete: [] }>()

const imgError = ref(false)

const hostname = computed(() => {
  try { return new URL(props.link.url).hostname.replace('www.', '') }
  catch { return props.link.url }
})

function openLink() {
  window.open(props.link.url, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.note-link-card {
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background: var(--c-card);
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  transition: box-shadow 0.15s, transform 0.15s;
}
.note-link-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  transform: translateY(-2px);
}
.note-link-cover {
  width: 100%;
  height: 100px;
  background: color-mix(in srgb, var(--c-border) 30%, transparent);
  overflow: hidden;
}
.note-link-delete {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: color-mix(in srgb, #e07070 80%, transparent);
  color: white;
  border: none;
  transition: opacity 0.15s;
}
</style>
