<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="modal-backdrop"
        @click.self="$emit('close')"
      >
        <div class="modal-box">

          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-heading text-lg font-bold text-ink">選擇標籤</h3>
            <button class="lb-icon-btn" @click="$emit('close')">
              <XIcon :size="16" />
            </button>
          </div>

          <!-- Search -->
          <div class="relative mb-4">
            <input
              ref="searchInput"
              v-model="search"
              type="text"
              class="input-field pr-8 text-sm"
              placeholder="搜尋或新增標籤…"
              @keydown.enter.prevent="onEnter"
            />
            <SearchIcon :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-inkMuted opacity-50" />
          </div>

          <!-- Selected tags -->
          <div v-if="localSelected.length" class="flex flex-wrap gap-1.5 mb-4 pb-4"
            style="border-bottom: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);">
            <span
              v-for="tag in localSelected"
              :key="tag"
              class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body border"
              style="background: color-mix(in srgb, var(--c-primary) 28%, transparent); border-color: var(--c-primary); color: var(--c-ink); font-weight: 600;"
            >
              <button type="button" class="cursor-pointer opacity-60 hover:opacity-100 transition-opacity" @click="toggle(tag)">
                <XIcon :size="10" />
              </button>
              {{ tag }}
            </span>
          </div>

          <!-- Tag list -->
          <div class="tag-list">
            <button
              v-for="tag in filteredTags"
              :key="tag"
              type="button"
              class="tag-row"
              @click="toggle(tag)"
            >
              <span
                class="tag-check"
                :style="localSelected.includes(tag)
                  ? 'background: var(--c-primary); border-color: var(--c-primary);'
                  : ''"
              >
                <CheckIcon v-if="localSelected.includes(tag)" :size="10" style="color: var(--c-base);" />
              </span>
              <span
                class="text-sm font-body"
                :style="localSelected.includes(tag) ? 'color: var(--c-ink); font-weight: 600;' : 'color: var(--c-inkMuted);'"
              >{{ tag }}</span>
            </button>

            <!-- Add new tag option -->
            <button
              v-if="canAddNew"
              type="button"
              class="tag-row text-primary"
              @click="addNew"
            >
              <span class="tag-check" style="border-style: dashed;">
                <PlusIcon :size="10" style="color: var(--c-primary);" />
              </span>
              <span class="text-sm font-body font-medium">新增「{{ search.trim() }}」</span>
            </button>

            <p v-if="filteredTags.length === 0 && !canAddNew" class="text-center text-inkMuted text-xs font-body py-4 italic">
              — 無符合的標籤 —
            </p>
          </div>

          <!-- Footer -->
          <div class="mt-4 pt-4 flex justify-end"
            style="border-top: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);">
            <button
              class="btn-cta px-5 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer"
              @click="$emit('close')"
            >
              完成
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import {
  X as XIcon,
  Check as CheckIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
} from 'lucide-vue-next'
import { usePostStore } from '../stores/postStore'

const props = defineProps<{
  open: boolean
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [tags: string[]]
  'close': []
}>()

const store = usePostStore()
const search        = ref('')
const searchInput   = ref<HTMLInputElement | null>(null)
const localSelected = ref<string[]>([...props.modelValue])

watch(() => props.open, async (val) => {
  if (val) {
    localSelected.value = [...props.modelValue]
    search.value = ''
    if (!store.availableTags.length) await store.fetchTags()
    await nextTick()
    searchInput.value?.focus()
  }
})

watch(localSelected, (val) => emit('update:modelValue', [...val]), { deep: true })

const allTags = computed(() => {
  const fromDb = store.availableTags
  const custom = localSelected.value.filter(t => !fromDb.includes(t))
  return [...fromDb, ...custom]
})

const filteredTags = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return allTags.value
  return allTags.value.filter(t => t.toLowerCase().includes(q))
})

const canAddNew = computed(() => {
  const q = search.value.trim()
  if (!q) return false
  return !allTags.value.some(t => t.toLowerCase() === q.toLowerCase())
})

function toggle(tag: string) {
  const idx = localSelected.value.indexOf(tag)
  if (idx === -1) localSelected.value.push(tag)
  else localSelected.value.splice(idx, 1)
}

async function addNew() {
  const tag = search.value.trim()
  if (!tag || localSelected.value.includes(tag)) return
  await store.createTag(tag)
  localSelected.value.push(tag)
  search.value = ''
}

function onEnter() {
  if (canAddNew.value) addNew()
  else if (filteredTags.value.length === 1) toggle(filteredTags.value[0])
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(10, 9, 8, 0.72);
  backdrop-filter: blur(4px);
}
.modal-box {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
  padding: 24px;
  background: var(--c-card);
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}
.tag-list {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  max-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tag-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
  text-align: left;
}
.tag-row:hover {
  background: color-mix(in srgb, var(--c-border) 30%, transparent);
}
.tag-check {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid var(--c-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.12s, border-color 0.12s;
}
.lb-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-inkMuted);
  cursor: pointer;
  transition: background 0.15s;
}
.lb-icon-btn:hover { background: color-mix(in srgb, var(--c-border) 40%, transparent); }

.modal-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.modal-leave-active { transition: opacity 0.14s ease, transform 0.12s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.96); }
</style>
