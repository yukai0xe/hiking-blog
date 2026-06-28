<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open && link" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-box">

          <!-- Cover image -->
          <div class="modal-cover">
            <img
              v-if="link.coverImageUrl && !imgError"
              :src="link.coverImageUrl"
              :alt="link.title"
              class="w-full h-full object-cover"
              @error="imgError = true"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <LinkIcon :size="40" class="text-inkMuted opacity-25" />
            </div>
            <button class="close-btn" aria-label="關閉" @click="emit('close')">
              <XIcon :size="15" />
            </button>
          </div>

          <!-- Content -->
          <div class="px-5 py-4 space-y-4">

            <!-- Editable title -->
            <div>
              <label class="text-[11px] font-mono tracking-wider uppercase text-inkMuted mb-1.5 block">連結名稱</label>
              <div class="flex gap-2">
                <input
                  v-model="titleEdit"
                  class="input-field flex-1 text-sm font-body"
                  placeholder="連結名稱"
                  @keydown.enter.prevent="saveTitle"
                  @keydown.esc.prevent="resetTitle"
                />
                <button
                  v-if="titleDirty"
                  class="btn-cta px-3 py-1.5 rounded-lg text-xs font-body font-semibold cursor-pointer"
                  @click="saveTitle"
                >儲存</button>
              </div>
            </div>

            <!-- URL display -->
            <div>
              <label class="text-[11px] font-mono tracking-wider uppercase text-inkMuted mb-1.5 block">連結網址</label>
              <p class="text-xs font-mono break-all leading-relaxed" style="color: var(--c-inkMuted);">{{ link.url }}</p>
            </div>

            <!-- Divider -->
            <div style="border-top: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);" />

            <!-- Action buttons -->
            <div class="space-y-2">
              <button class="action-row-btn" @click="openLink">
                <ExternalLinkIcon :size="15" class="shrink-0" />
                <span>開啟連結</span>
              </button>
              <button class="action-row-btn" @click="copyLink">
                <CheckIcon v-if="copied" :size="15" class="shrink-0 text-primary" />
                <CopyIcon  v-else        :size="15" class="shrink-0" />
                <span>{{ copied ? '已複製' : '複製連結' }}</span>
              </button>
              <button class="action-row-btn action-row-btn--delete" @click="emit('delete')">
                <Trash2Icon :size="15" class="shrink-0" />
                <span>刪除連結</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  X as XIcon,
  Link as LinkIcon,
  ExternalLink as ExternalLinkIcon,
  Copy as CopyIcon,
  Check as CheckIcon,
  Trash2 as Trash2Icon,
} from 'lucide-vue-next'
import type { NoteLink } from '../types'
import { useNotesStore } from '../stores/notesStore'
import { useToast } from '../composables/useToast'

const props = defineProps<{ open: boolean; link: NoteLink | null }>()
const emit  = defineEmits<{ close: []; delete: [] }>()

const store           = useNotesStore()
const { show: toast } = useToast()

const titleEdit = ref('')
const imgError  = ref(false)
const copied    = ref(false)
let   copyTimer: ReturnType<typeof setTimeout> | null = null

const titleDirty = computed(() => !!props.link && titleEdit.value.trim() !== props.link.title)

watch(() => props.link, (l) => {
  titleEdit.value = l?.title ?? ''
  imgError.value  = false
})

function resetTitle() {
  titleEdit.value = props.link?.title ?? ''
}

async function saveTitle() {
  if (!props.link || !titleDirty.value) return
  const t = titleEdit.value.trim()
  if (!t) return
  await store.updateLinkTitle(props.link.id, t)
  toast('已儲存名稱')
}

function openLink() {
  if (!props.link) return
  window.open(props.link.url, '_blank', 'noopener,noreferrer')
}

function copyLink() {
  if (!props.link) return
  navigator.clipboard.writeText(props.link.url)
  copied.value = true
  toast(`已複製：${props.link.title}`)
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copied.value = false }, 2000)
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
  width: 100%; max-width: 420px;
  background: var(--c-card);
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
}
.modal-cover {
  position: relative;
  width: 100%;
  height: 180px;
  background: color-mix(in srgb, var(--c-border) 30%, transparent);
  overflow: hidden;
}
.close-btn {
  position: absolute; top: 10px; right: 10px;
  width: 28px; height: 28px;
  border-radius: 50%;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #fff; border: none;
  transition: background 0.15s;
}
.close-btn:hover { background: rgba(0,0,0,0.65); }

.action-row-btn {
  width: 100%;
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  font-family: var(--font-body, sans-serif);
  font-size: 0.875rem;
  cursor: pointer;
  text-align: left;
  background: color-mix(in srgb, var(--c-border) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);
  color: var(--c-ink);
  transition: background 0.12s, border-color 0.12s;
}
.action-row-btn:hover {
  background: color-mix(in srgb, var(--c-primary) 10%, transparent);
  border-color: color-mix(in srgb, var(--c-primary) 30%, transparent);
}
.action-row-btn--delete {
  color: #e07070;
  background: color-mix(in srgb, #e07070 6%, transparent);
  border-color: color-mix(in srgb, #e07070 20%, transparent);
}
.action-row-btn--delete:hover {
  background: color-mix(in srgb, #e07070 15%, transparent);
  border-color: color-mix(in srgb, #e07070 40%, transparent);
}

.modal-fade-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.modal-fade-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.97); }
</style>
