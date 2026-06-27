<template>
  <section class="card-aged p-5 space-y-4">
    <!-- Group header -->
    <div class="flex items-start gap-2">
      <div class="flex-1 min-w-0">
        <h3 class="font-heading text-base font-semibold text-ink">{{ group.name }}</h3>
        <p v-if="group.description" class="text-xs font-body text-inkMuted mt-0.5">{{ group.description }}</p>
      </div>
      <button
        class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer text-inkMuted hover:text-ink transition-colors"
        style="border: 1px solid var(--c-border);"
        @click="emit('edit-group')"
        aria-label="編輯分組"
      >
        <PencilIcon :size="13" />
      </button>
      <div class="relative shrink-0">
        <button
          class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
          style="border: 1px solid var(--c-border);"
          :style="confirming ? { color: '#e07070', borderColor: '#e07070' } : { color: 'var(--c-inkMuted)' }"
          @click="handleDelete"
          :aria-label="confirming ? '確定刪除' : '刪除分組'"
        >
          <Trash2Icon :size="13" />
        </button>
        <span
          v-if="confirming"
          class="absolute right-0 top-8 whitespace-nowrap text-[11px] font-body px-2 py-1 rounded-lg z-10"
          style="background: var(--c-card); border: 1px solid color-mix(in srgb, #e07070 50%, transparent); color: #e07070;"
        >再按一次確認刪除</span>
      </div>
    </div>

    <!-- Link grid -->
    <div v-if="links.length > 0" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <NoteLinkCard
        v-for="link in links"
        :key="link.id"
        :link="link"
        @delete="emit('delete-link', link.id)"
      />
    </div>
    <p v-else class="text-xs font-body italic text-inkMuted">此分組尚無連結</p>

    <!-- Add link button -->
    <button
      class="flex items-center gap-1.5 text-xs font-body text-inkMuted hover:text-primary transition-colors cursor-pointer"
      @click="emit('add-link')"
    >
      <PlusIcon :size="13" /> 新增連結
    </button>
  </section>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { Pencil as PencilIcon, Trash2 as Trash2Icon, Plus as PlusIcon } from 'lucide-vue-next'
import type { NoteGroup, NoteLink } from '../types'
import NoteLinkCard from './NoteLinkCard.vue'

defineProps<{ group: NoteGroup; links: NoteLink[] }>()
const emit = defineEmits<{
  'add-link':    []
  'edit-group':  []
  'delete-group': []
  'delete-link': [id: string]
}>()

const confirming = ref(false)
let confirmTimer: ReturnType<typeof setTimeout> | null = null

function handleDelete() {
  if (!confirming.value) {
    if (confirmTimer) clearTimeout(confirmTimer)
    confirming.value = true
    confirmTimer = setTimeout(() => { confirming.value = false }, 3000)
  } else {
    if (confirmTimer) clearTimeout(confirmTimer)
    confirming.value = false
    emit('delete-group')
  }
}

onBeforeUnmount(() => {
  if (confirmTimer) clearTimeout(confirmTimer)
})
</script>
