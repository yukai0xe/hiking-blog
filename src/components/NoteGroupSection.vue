<template>
  <section
    class="card-aged p-5 space-y-4 transition-colors duration-150"
    :style="isDragOver ? { borderColor: 'var(--c-primary)', background: 'color-mix(in srgb, var(--c-primary) 5%, var(--c-card))' } : {}"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- Group header -->
    <div class="flex items-start gap-2">
      <div class="flex-1 min-w-0">
        <h3 class="font-heading text-base font-semibold text-ink">{{ group.name }}</h3>
        <p v-if="group.description" class="text-xs font-body text-inkMuted mt-0.5">{{ group.description }}</p>
      </div>
      <button
        class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
        style="border: 1px solid var(--c-border);"
        :style="copied ? { color: 'var(--c-primary)', borderColor: 'var(--c-primary)' } : { color: 'var(--c-inkMuted)' }"
        @click="copyGroup"
        :aria-label="copied ? '已複製' : '複製分組'"
      >
        <CheckIcon v-if="copied" :size="13" />
        <LinkIcon  v-else        :size="13" />
      </button>
      <button
        class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer text-inkMuted hover:text-ink transition-colors"
        style="border: 1px solid var(--c-border);"
        @click="emit('edit-group')"
        aria-label="編輯分組"
      >
        <PencilIcon :size="13" />
      </button>
      <button
        class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer text-inkMuted hover:text-red-400 transition-colors"
        style="border: 1px solid var(--c-border);"
        @click="emit('delete-group')"
        aria-label="刪除分組"
      >
        <Trash2Icon :size="13" />
      </button>
    </div>

    <!-- Link list -->
    <div v-if="links.length > 0" class="space-y-2">
      <NoteLinkCard
        v-for="link in links"
        :key="link.id"
        :link="link"
        @open-detail="emit('open-detail-link', link)"
      />
    </div>
    <p v-else class="text-xs font-body italic text-inkMuted">此分組尚無連結</p>

    <!-- Add link button -->
    <button
      class="btn-cta flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium cursor-pointer"
      @click="emit('add-link')"
    >
      <PlusIcon :size="13" /> 新增連結
    </button>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Pencil as PencilIcon, Trash2 as Trash2Icon, Plus as PlusIcon, Link as LinkIcon, Check as CheckIcon } from 'lucide-vue-next'
import type { NoteGroup, NoteLink } from '../types'
import NoteLinkCard from './NoteLinkCard.vue'
import { useToast } from '../composables/useToast'

const props = defineProps<{ group: NoteGroup; links: NoteLink[] }>()
const emit = defineEmits<{
  'add-link':        []
  'edit-group':      []
  'delete-group':    []
  'open-detail-link': [link: NoteLink]
  'move-link':        [id: string]
}>()

const { show: showToast } = useToast()
const isDragOver = ref(false)
const copied     = ref(false)
let   copyTimer: ReturnType<typeof setTimeout> | null = null

function copyGroup() {
  const lines: string[] = []
  lines.push(props.group.name)
  if (props.group.description) lines.push(props.group.description)
  if (props.links.length > 0) {
    lines.push('')
    props.links.forEach((l, i) => {
      lines.push(`${i + 1}. ${l.title}`)
      lines.push(`   ${l.url}`)
    })
  }
  navigator.clipboard.writeText(lines.join('\n'))
  copied.value = true
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copied.value = false }, 2000)
  showToast(`已複製分組：${props.group.name}`)
}

function onDragOver(e: DragEvent) {
  e.dataTransfer!.dropEffect = 'move'
  isDragOver.value = true
}

function onDragLeave(e: DragEvent) {
  if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node))
    isDragOver.value = false
}

function onDrop(e: DragEvent) {
  isDragOver.value = false
  const id = e.dataTransfer?.getData('text/plain')
  if (id) emit('move-link', id)
}

</script>
