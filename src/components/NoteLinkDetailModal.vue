<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open && link" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-box" :class="{ 'browser-open': showBrowser }">

          <!-- Bottom sheet drag handle (mobile only) -->
          <div class="sheet-handle" />

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
          <div class="modal-content px-5 py-4 space-y-4">

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

            <!-- Action buttons / group picker -->
            <div class="space-y-2">

              <!-- Group picker panel -->
              <template v-if="showGroupPicker">
                <div class="flex items-center gap-2 mb-3">
                  <button
                    class="flex items-center gap-1.5 text-xs font-body text-inkMuted hover:text-ink transition-colors cursor-pointer"
                    @click="showGroupPicker = false"
                  >
                    <ArrowLeftIcon :size="13" /> 返回
                  </button>
                  <span class="text-[11px] font-mono tracking-wider uppercase text-inkMuted">移至分組</span>
                </div>

                <!-- Ungrouped option -->
                <button
                  class="action-row-btn"
                  :class="{ 'action-row-btn--active': !link.groupId }"
                  @click="moveToGroup(null)"
                >
                  <CheckIcon v-if="!link.groupId" :size="15" class="shrink-0 text-primary" />
                  <InboxIcon v-else                :size="15" class="shrink-0 opacity-60" />
                  <span>未分組</span>
                </button>

                <!-- All groups -->
                <button
                  v-for="g in store.groups"
                  :key="g.id"
                  class="action-row-btn"
                  :class="{ 'action-row-btn--active': link.groupId === g.id }"
                  @click="moveToGroup(g.id)"
                >
                  <CheckIcon  v-if="link.groupId === g.id" :size="15" class="shrink-0 text-primary" />
                  <FolderIcon v-else                        :size="15" class="shrink-0 opacity-60" />
                  <span>{{ g.name }}</span>
                </button>
              </template>

              <!-- Normal actions -->
              <template v-else>
                <button class="action-row-btn" @click="openLink">
                  <ExternalLinkIcon :size="15" class="shrink-0" />
                  <span>開啟連結</span>
                </button>
                <button class="action-row-btn" @click="copyLink">
                  <CheckIcon v-if="copied" :size="15" class="shrink-0 text-primary" />
                  <CopyIcon  v-else        :size="15" class="shrink-0" />
                  <span>{{ copied ? '已複製' : '複製連結' }}</span>
                </button>
                <button
                  class="action-row-btn"
                  :class="{ 'action-row-btn--active': showBrowser }"
                  @click="toggleBrowser"
                >
                  <GlobeIcon :size="15" class="shrink-0" />
                  <span>{{ showBrowser ? '關閉瀏覽' : '在此瀏覽' }}</span>
                </button>
                <button class="action-row-btn" @click="showGroupPicker = true">
                  <FolderInputIcon :size="15" class="shrink-0" />
                  <span>移至分組</span>
                  <span class="ml-auto text-[11px] font-mono text-inkMuted opacity-60 truncate max-w-[140px]">
                    {{ currentGroupName }}
                  </span>
                </button>
                <button class="action-row-btn action-row-btn--delete" @click="emit('delete')">
                  <Trash2Icon :size="15" class="shrink-0" />
                  <span>刪除連結</span>
                </button>
              </template>

            </div>

          </div>

          <!-- Inline browser panel -->
          <div v-if="showBrowser" class="browser-section">
            <div v-if="browserLoading" class="browser-loading-state">
              <div class="browser-spinner" />
              <span class="text-xs font-body text-inkMuted">載入中…</span>
            </div>
            <iframe
              v-show="!browserLoading"
              :src="link!.url"
              class="browser-iframe"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              referrerpolicy="no-referrer"
              @load="browserLoading = false"
            />
            <div class="browser-bar">
              <span class="text-[10px] font-mono text-inkMuted opacity-60 truncate flex-1">{{ link!.url }}</span>
              <button class="text-[10px] font-body font-semibold shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      style="color: var(--c-primary);"
                      @click="openLink">在外部開啟</button>
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
  ArrowLeft as ArrowLeftIcon,
  Folder as FolderIcon,
  FolderInput as FolderInputIcon,
  Inbox as InboxIcon,
  Globe as GlobeIcon,
} from 'lucide-vue-next'
import type { NoteLink } from '../types'
import { useNotesStore } from '../stores/notesStore'
import { useToast } from '../composables/useToast'
import { useBrowserPanel } from '../composables/useBrowserPanel'

const props = defineProps<{ open: boolean; link: NoteLink | null }>()
const emit  = defineEmits<{ close: []; delete: [] }>()

const store              = useNotesStore()
const { show: toast }    = useToast()
const { browserOpen }    = useBrowserPanel()

const titleEdit       = ref('')
const imgError        = ref(false)
const copied          = ref(false)
const showGroupPicker = ref(false)
const showBrowser     = ref(false)
const browserLoading  = ref(true)
let   copyTimer: ReturnType<typeof setTimeout> | null = null

const titleDirty = computed(() => !!props.link && titleEdit.value.trim() !== props.link.title)

const currentGroupName = computed(() => {
  if (!props.link?.groupId) return '未分組'
  return store.groups.find(g => g.id === props.link!.groupId)?.name ?? '未分組'
})

watch(() => props.link, (l) => {
  titleEdit.value      = l?.title ?? ''
  imgError.value       = false
  showBrowser.value    = false
  browserLoading.value = true
  browserOpen.value    = false
})

watch(() => props.open, (v) => {
  if (!v) {
    showGroupPicker.value = false
    showBrowser.value     = false
    browserLoading.value  = true
    browserOpen.value     = false
  }
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

function toggleBrowser() {
  if (!showBrowser.value) {
    browserLoading.value = true
    showBrowser.value    = true
    browserOpen.value    = true
  } else {
    showBrowser.value    = false
    browserLoading.value = true
    browserOpen.value    = false
  }
}

function copyLink() {
  if (!props.link) return
  navigator.clipboard.writeText(props.link.url)
  copied.value = true
  toast(`已複製：${props.link.title}`)
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copied.value = false }, 2000)
}

async function moveToGroup(groupId: string | null) {
  if (!props.link) return
  await store.moveLink(props.link.id, groupId)
  showGroupPicker.value = false
  const name = groupId ? (store.groups.find(g => g.id === groupId)?.name ?? '分組') : '未分組'
  toast(`已移至：${name}`)
}
</script>

<style scoped>
/* ── backdrop ─────────────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: flex-end; justify-content: center;
  padding: 0;
}

/* ── box: bottom sheet on mobile, centered card on sm+ ───────────────────── */
.modal-box {
  width: 100%;
  background: var(--c-card);
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  border-radius: 0;
  overflow: hidden;
  box-shadow: 0 -8px 48px rgba(0,0,0,0.45);
  max-height: 88vh;
  overflow-y: auto;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* ── drag handle (mobile only) ───────────────────────────────────────────── */
.sheet-handle {
  width: 36px; height: 4px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--c-border) 70%, transparent);
  margin: 12px auto 4px;
}

/* ── cover ────────────────────────────────────────────────────────────────── */
.modal-cover {
  position: relative;
  width: 100%;
  height: 200px;
  background: color-mix(in srgb, var(--c-border) 30%, transparent);
  overflow: hidden;
}

.close-btn {
  position: absolute; top: 10px; right: 10px;
  width: 30px; height: 30px;
  border-radius: 50%;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #fff; border: none;
  transition: background 0.15s;
}
.close-btn:hover { background: rgba(0,0,0,0.65); }

/* ── action buttons ───────────────────────────────────────────────────────── */
.action-row-btn {
  width: 100%;
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
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
.action-row-btn--active {
  background: color-mix(in srgb, var(--c-primary) 12%, transparent);
  border-color: color-mix(in srgb, var(--c-primary) 35%, transparent);
  color: var(--c-primary);
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

/* ── transitions: slide-up on mobile ─────────────────────────────────────── */
.modal-fade-enter-active { transition: opacity 0.2s ease, transform 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
.modal-fade-leave-active { transition: opacity 0.16s ease, transform 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: translateY(60%); }

/* ── inline browser panel ─────────────────────────────────────────────────── */

/* When browser open: full flex-column layout, fixed viewport height */
.modal-box.browser-open {
  height: 97dvh;
  max-height: 97dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-box.browser-open .modal-cover {
  height: 120px;
  flex-shrink: 0;
}
.modal-box.browser-open .modal-content {
  flex-shrink: 0;
  overflow-y: auto;
}

.browser-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);
}

.browser-loading-state {
  flex: 1;
  min-height: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 10px;
}

.browser-spinner {
  width: 22px; height: 22px;
  border: 2px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  border-top-color: var(--c-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.browser-iframe {
  flex: 1;
  min-height: 0;
  width: 100%;
  border: none;
  display: block;
  background: #fff;
}

.browser-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 14px;
  border-top: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);
  flex-shrink: 0;
}

/* ── sm+ (≥ 640px): centered floating card ───────────────────────────────── */
@media (min-width: 640px) {
  .modal-backdrop {
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .modal-box {
    max-width: 420px;
    border-radius: 16px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
    max-height: 90vh;
    padding-bottom: 0;
  }
  .modal-box.browser-open { height: 92vh; max-height: 92vh; }
  .sheet-handle { display: none; }
  .modal-cover { height: 180px; }

  .modal-fade-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
  .modal-fade-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
  .modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.97); }
}
</style>
