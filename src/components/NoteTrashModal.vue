<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-box">

          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <Trash2Icon :size="15" class="text-inkMuted" />
              <h3 class="font-heading text-base font-semibold text-ink">垃圾桶</h3>
              <span v-if="store.trashLinks.length > 0"
                class="font-mono text-xs px-1.5 py-0.5 rounded"
                style="background: color-mix(in srgb, var(--c-border) 50%, transparent); color: var(--c-inkMuted);"
              >{{ store.trashLinks.length }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="store.trashLinks.length > 0"
                class="text-xs font-body px-3 py-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-70"
                style="background: color-mix(in srgb, #e07070 15%, transparent); color: #e07070;"
                @click="askEmptyTrash"
              >清空垃圾桶</button>
              <button class="text-inkMuted hover:text-ink cursor-pointer" @click="emit('close')">
                <XIcon :size="16" />
              </button>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="py-10 flex flex-col items-center gap-3 text-inkMuted font-body text-sm">
            <div class="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
            載入中…
          </div>

          <!-- Empty state -->
          <div v-else-if="store.trashLinks.length === 0"
               class="py-10 flex flex-col items-center gap-2 text-inkMuted">
            <Trash2Icon :size="32" class="opacity-20" />
            <p class="font-body text-sm">垃圾桶是空的</p>
          </div>

          <!-- Trash list -->
          <div v-else class="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            <div
              v-for="link in store.trashLinks"
              :key="link.id"
              class="trash-row group"
            >
              <!-- Cover -->
              <div class="trash-cover shrink-0">
                <img
                  v-if="link.coverImageUrl && !imgErrors[link.id]"
                  :src="link.coverImageUrl"
                  :alt="link.title"
                  class="w-full h-full object-cover"
                  @error="imgErrors[link.id] = true"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <LinkIcon :size="16" class="text-inkMuted opacity-30" />
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0 flex flex-col justify-center">
                <p class="text-sm font-body font-semibold text-ink line-clamp-1">{{ link.title }}</p>
                <p class="text-[11px] font-mono text-inkMuted mt-0.5 truncate">{{ hostname(link.url) }}</p>
              </div>

              <!-- Actions -->
              <div class="shrink-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  class="text-xs font-body px-2.5 py-1 rounded-lg cursor-pointer transition-opacity hover:opacity-80"
                  style="background: color-mix(in srgb, var(--c-primary) 15%, transparent); color: var(--c-primary);"
                  @click="doRestore(link.id)"
                >還原</button>
                <button
                  class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  style="background: color-mix(in srgb, #e07070 15%, transparent); color: #e07070;"
                  aria-label="永久刪除"
                  @click="askPermanentDelete(link.id)"
                >
                  <XIcon :size="13" />
                </button>
              </div>
            </div>
          </div>

          <!-- Error -->
          <p v-if="actionError" class="mt-3 text-xs font-body" style="color: #e07070;">{{ actionError }}</p>

        </div>
      </div>
    </Transition>
  </Teleport>

  <ConfirmDialog
    :open="confirmOpen"
    :title="confirmTitle"
    :message="confirmMessage"
    @confirm="onConfirmed"
    @close="confirmOpen = false"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Trash2 as Trash2Icon, X as XIcon, Link as LinkIcon } from 'lucide-vue-next'
import { useNotesStore } from '../stores/notesStore'
import ConfirmDialog from './ConfirmDialog.vue'

const props = defineProps<{ open: boolean }>()
const emit  = defineEmits<{ close: [] }>()

const store       = useNotesStore()
const loading     = ref(false)
const actionError = ref<string | null>(null)
const imgErrors   = ref<Record<string, boolean>>({})

watch(() => props.open, async (v) => {
  if (!v) return
  loading.value     = true
  actionError.value = null
  try { await store.fetchTrash() }
  finally { loading.value = false }
})

function hostname(url: string) {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return url }
}

async function doRestore(id: string) {
  actionError.value = null
  try { await store.restoreLink(id) }
  catch (e) { actionError.value = (e as Error).message }
}

const confirmOpen    = ref(false)
const confirmTitle   = ref('')
const confirmMessage = ref('')
let   pendingAction: (() => Promise<void>) | null = null

function askPermanentDelete(id: string) {
  confirmTitle.value   = '永久刪除連結'
  confirmMessage.value = '此連結將被永久刪除，無法復原。'
  pendingAction        = async () => {
    actionError.value = null
    try { await store.permanentDeleteLink(id) }
    catch (e) { actionError.value = (e as Error).message }
  }
  confirmOpen.value = true
}

function askEmptyTrash() {
  confirmTitle.value   = '清空垃圾桶'
  confirmMessage.value = '所有垃圾桶內的連結將被永久刪除，此操作無法復原。'
  pendingAction        = async () => {
    actionError.value = null
    try { await store.emptyTrash() }
    catch (e) { actionError.value = (e as Error).message }
  }
  confirmOpen.value = true
}

async function onConfirmed() {
  confirmOpen.value = false
  if (pendingAction) {
    await pendingAction()
    pendingAction = null
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
  width: 100%; max-width: 520px;
  background: var(--c-card);
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
}
.trash-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);
  background: color-mix(in srgb, var(--c-border) 10%, transparent);
}
.trash-cover {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  background: color-mix(in srgb, var(--c-border) 30%, transparent);
}
.modal-fade-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.modal-fade-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.97); }
</style>
