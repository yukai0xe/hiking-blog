<template>
  <!-- ── Desktop: side panel ─────────────────────────────────── -->
  <Transition name="gear-panel">
    <div v-if="panelOpen && !isMobile" class="w-[460px] shrink-0 card-aged p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-heading text-base text-ink">{{ editingId ? '編輯路線' : '新增 GPX' }}</h2>
        <button class="text-inkMuted hover:text-ink cursor-pointer transition-colors" @click="closePanel"><XIcon :size="16" /></button>
      </div>
      <GpxEditorForm
        :form="form"
        :editing-id="editingId"
        :saving="saving"
        :file-input-el="fileInputEl"
        :tag-modal-open="tagModalOpen"
        @update:tag-modal-open="tagModalOpen = $event"
        @file-change="onFileChange"
        @submit="submitForm"
        @cancel="closePanel"
      />
    </div>
  </Transition>

  <!-- ── Mobile: bottom sheet ────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="editor-sheet">
      <div v-if="panelOpen && isMobile" class="editor-backdrop" @click.self="closePanel">
        <div class="editor-sheet-box">
          <div class="editor-handle" />
          <div class="flex items-center justify-between px-5 pt-3 pb-1">
            <h2 class="font-heading text-base text-ink">{{ editingId ? '編輯路線' : '新增 GPX' }}</h2>
            <button class="text-inkMuted hover:text-ink cursor-pointer transition-colors" @click="closePanel"><XIcon :size="16" /></button>
          </div>
          <div class="px-5 pb-4 overflow-y-auto flex-1">
            <GpxEditorForm
              :form="form"
              :editing-id="editingId"
              :saving="saving"
              :file-input-el="fileInputEl"
              :tag-modal-open="tagModalOpen"
              @update:tag-modal-open="tagModalOpen = $event"
              @file-change="onFileChange"
              @submit="submitForm"
              @cancel="closePanel"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { X as XIcon } from 'lucide-vue-next'
import { useProfileStore } from '../stores/profileStore'
import { useGpxEditor } from '../composables/useGpxEditor'
import type { GpxLibraryEntry } from '../types'
import type { Reactive } from 'vue'
import GpxEditorForm from './GpxEditorForm.vue'

const props = defineProps<{
  cardElevations: Reactive<Record<string, number[] | null>>
  loadCardGpx: (entry: GpxLibraryEntry) => void
}>()

useProfileStore()

const {
  form, panelOpen, editingId, saving, apiError, fileInputEl, tagModalOpen,
  openCreate, openEdit, closePanel, onFileChange, submitForm,
} = useGpxEditor(props.cardElevations, props.loadCardGpx)

const isMobile = ref(typeof window !== 'undefined' && window.innerWidth < 640)
function onResize() { isMobile.value = window.innerWidth < 640 }
onMounted(() => window.addEventListener('resize', onResize, { passive: true }))
onUnmounted(() => window.removeEventListener('resize', onResize))

defineExpose({ openCreate, openEdit, panelOpen, apiError })
</script>

<style scoped>
.gear-panel-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.gear-panel-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.gear-panel-enter-from, .gear-panel-leave-to { opacity: 0; transform: translateX(20px); }

.editor-backdrop {
  position: fixed; inset: 0; z-index: 300;
  display: flex; align-items: flex-end;
  background: rgba(0, 0, 0, 0.55);
}
.editor-sheet-box {
  width: 100%;
  background: var(--c-card);
  border-top: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  box-shadow: 0 -8px 48px rgba(0, 0, 0, 0.4);
  max-height: 92dvh;
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.editor-handle {
  width: 36px; height: 4px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--c-border) 70%, transparent);
  margin: 12px auto 0;
  flex-shrink: 0;
}

.editor-sheet-enter-active { transition: opacity 0.2s ease, transform 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
.editor-sheet-leave-active { transition: opacity 0.16s ease, transform 0.2s ease; }
.editor-sheet-enter-from, .editor-sheet-leave-to { opacity: 0; transform: translateY(60%); }
</style>
