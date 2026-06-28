<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-box">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-heading text-base font-semibold text-ink">新增連結</h3>
            <button class="text-inkMuted hover:text-ink cursor-pointer" @click="emit('close')">
              <XIcon :size="16" />
            </button>
          </div>

          <!-- URL input -->
          <div class="flex gap-2 mb-3">
            <input
              v-model="url"
              type="url"
              class="input-field flex-1 text-sm"
              placeholder="https://example.com"
              @keydown.enter="fetchPreview"
              @blur="onUrlBlur"
            />
            <button
              class="btn-cta px-3 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer disabled:opacity-40"
              :disabled="!url.trim() || previewing"
              @click="fetchPreview"
            >
              <span v-if="previewing" class="w-4 h-4 border-2 rounded-full animate-spin border-current border-t-transparent inline-block" />
              <span v-else>預覽</span>
            </button>
          </div>

          <!-- Preview warning -->
          <p v-if="previewError" class="text-xs font-body mb-3" style="color: #e07070;">
            無法取得預覽，仍可新增連結
          </p>

          <!-- Preview card with editable title -->
          <div
            v-if="preview"
            class="flex gap-3 p-3 rounded-xl mb-4"
            style="border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent); background: color-mix(in srgb, var(--c-card) 60%, transparent);"
          >
            <div class="w-20 h-14 rounded-lg overflow-hidden shrink-0"
                 style="background: color-mix(in srgb, var(--c-border) 30%, transparent);">
              <img v-if="preview.coverImageUrl" :src="preview.coverImageUrl" class="w-full h-full object-cover" alt="" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <LinkIcon :size="18" class="text-inkMuted opacity-30" />
              </div>
            </div>
            <div class="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
              <input
                v-model="titleEdit"
                class="input-field text-sm font-body font-semibold w-full"
                placeholder="連結名稱"
              />
              <p class="text-[11px] font-mono text-inkMuted truncate">{{ hostname }}</p>
            </div>
          </div>

          <!-- Error -->
          <p v-if="addError" class="text-xs font-body mb-3" style="color: #e07070;">{{ addError }}</p>

          <!-- Actions -->
          <div class="flex justify-end gap-2">
            <button
              class="px-4 py-2 rounded-lg text-sm font-body text-inkMuted cursor-pointer hover:text-ink transition-colors"
              @click="emit('close')"
            >取消</button>
            <button
              class="btn-cta px-4 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer disabled:opacity-40"
              :disabled="!canAdd || adding"
              @click="doAdd"
            >
              <span v-if="adding" class="w-4 h-4 border-2 rounded-full animate-spin border-current border-t-transparent inline-block mr-1" />
              新增
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X as XIcon, Link as LinkIcon } from 'lucide-vue-next'
import { useNotesStore } from '../stores/notesStore'

const props = defineProps<{ open: boolean; groupId: string | null }>()
const emit  = defineEmits<{ close: []; added: [] }>()

const store        = useNotesStore()
const url          = ref('')
const titleEdit    = ref('')
const previewing   = ref(false)
const previewError = ref(false)
const preview      = ref<{ title: string; coverImageUrl: string | null } | null>(null)
const adding       = ref(false)
const addError     = ref<string | null>(null)

const hostname = computed(() => {
  try { return new URL(url.value).hostname.replace('www.', '') }
  catch { return url.value }
})

const canAdd = computed(() => url.value.trim().length > 0)

watch(() => props.open, (v) => {
  if (!v) {
    url.value          = ''
    titleEdit.value    = ''
    preview.value      = null
    previewError.value = false
    addError.value     = null
  }
})

async function onUrlBlur() {
  if (url.value.trim() && !preview.value) await fetchPreview()
}

async function fetchPreview() {
  if (!url.value.trim()) return
  previewing.value   = true
  previewError.value = false
  preview.value      = null
  try {
    const p       = await store.fetchPreview(url.value.trim())
    preview.value = p
    titleEdit.value = p.title
  } catch {
    previewError.value = true
    titleEdit.value    = hostname.value
    preview.value      = { title: hostname.value, coverImageUrl: null }
  } finally {
    previewing.value = false
  }
}

async function doAdd() {
  if (!canAdd.value) return
  adding.value   = true
  addError.value = null
  const title    = titleEdit.value.trim() || hostname.value
  const cover    = preview.value?.coverImageUrl ?? null
  try {
    await store.addLink(url.value.trim(), title, cover, props.groupId)
    emit('added')
    emit('close')
  } catch (e) {
    addError.value = (e as Error).message
  } finally {
    adding.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.modal-box {
  width: 100%; max-width: 460px;
  background: var(--c-card);
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
}
.modal-fade-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.modal-fade-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.97); }
</style>
