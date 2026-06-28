<template>
  <div
    class="note-link-card group relative flex"
    draggable="true"
    @click="!editing && openLink()"
    @dragstart="onDragStart"
  >
    <!-- Cover image -->
    <div class="note-link-cover shrink-0">
      <img
        v-if="link.coverImageUrl && !imgError"
        :src="link.coverImageUrl"
        :alt="link.title"
        class="w-full h-full object-cover"
        @error="imgError = true"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <LinkIcon :size="28" class="text-inkMuted opacity-30" />
      </div>
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-center">
      <!-- Title: normal or inline-edit -->
      <input
        v-if="editing"
        ref="titleInput"
        v-model="editTitle"
        class="note-link-title-input"
        @keydown.enter.prevent="confirmEdit"
        @keydown.esc.prevent="cancelEdit"
        @blur="confirmEdit"
        @click.stop
      />
      <p v-else class="text-sm font-body font-semibold text-ink line-clamp-2 leading-snug">{{ link.title }}</p>
      <p class="text-[11px] font-mono text-inkMuted mt-0.5 truncate">{{ link.url }}</p>
    </div>

    <!-- Hover actions -->
    <div class="note-link-actions opacity-0 group-hover:opacity-100 flex flex-col gap-2">
      <button
        class="note-link-action-btn"
        @click.stop="copyLink"
        :aria-label="copied ? '已複製' : '複製連結'"
      >
        <CheckIcon v-if="copied" :size="11" />
        <LinkIcon  v-else        :size="11" />
      </button>
      <button
        class="note-link-action-btn"
        @click.stop="startEdit"
        aria-label="編輯名稱"
      >
        <PencilIcon :size="11" />
      </button>
      <button
        class="note-link-action-btn note-link-action-btn--delete"
        @click.stop="emit('delete')"
        aria-label="刪除連結"
      >
        <XIcon :size="11" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Link as LinkIcon, X as XIcon, Check as CheckIcon, Pencil as PencilIcon } from 'lucide-vue-next'
import type { NoteLink } from '../types'
import { useToast } from '../composables/useToast'

const props = defineProps<{ link: NoteLink }>()
const emit  = defineEmits<{ delete: []; rename: [title: string] }>()

const { show: showToast } = useToast()
const imgError   = ref(false)
const copied     = ref(false)
const editing    = ref(false)
const editTitle  = ref('')
const titleInput = ref<HTMLInputElement | null>(null)
let   copyTimer: ReturnType<typeof setTimeout> | null = null

function openLink() {
  window.open(props.link.url, '_blank', 'noopener,noreferrer')
}

function copyLink() {
  navigator.clipboard.writeText(props.link.url)
  copied.value = true
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copied.value = false }, 2000)
  showToast(`已複製：${props.link.title}`)
}

async function startEdit() {
  editTitle.value = props.link.title
  editing.value   = true
  await nextTick()
  titleInput.value?.focus()
  titleInput.value?.select()
}

function confirmEdit() {
  if (!editing.value) return
  editing.value = false
  const t = editTitle.value.trim()
  if (t && t !== props.link.title) emit('rename', t)
}

function cancelEdit() {
  editing.value = false
}

function onDragStart(e: DragEvent) {
  if (editing.value) { e.preventDefault(); return }
  e.dataTransfer!.setData('text/plain', props.link.id)
  e.dataTransfer!.effectAllowed = 'move'
}
</script>

<style scoped>
.note-link-card {
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background: var(--c-card);
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  transition: box-shadow 0.15s, border-color 0.15s;
}
.note-link-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
  border-color: color-mix(in srgb, var(--c-primary) 30%, transparent);
}
.note-link-cover {
  width: 240px;
  height: 110px;
  background: color-mix(in srgb, var(--c-border) 30%, transparent);
  overflow: hidden;
}
.note-link-title-input {
  width: 100%;
  font-size: 0.875rem;
  font-family: var(--font-body, inherit);
  font-weight: 600;
  color: var(--c-ink);
  background: color-mix(in srgb, var(--c-primary) 8%, transparent);
  border: 1px solid var(--c-primary);
  border-radius: 6px;
  padding: 2px 6px;
  outline: none;
}
.note-link-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  transition: opacity 0.15s;
}
.note-link-action-btn {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  background: color-mix(in srgb, var(--c-primary) 75%, transparent);
  color: white;
}
.note-link-action-btn--delete {
  background: color-mix(in srgb, #e07070 80%, transparent);
}
</style>
