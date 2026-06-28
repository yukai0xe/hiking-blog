<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-box">
          <div class="modal-handle" aria-hidden="true" />

          <div class="flex items-center justify-between mb-4">
            <h3 class="font-heading text-base font-semibold text-ink">
              {{ group ? '編輯分組' : '新增分組' }}
            </h3>
            <button class="text-inkMuted hover:text-ink cursor-pointer" @click="emit('close')">
              <XIcon :size="16" />
            </button>
          </div>

          <div class="space-y-3 mb-5">
            <div>
              <label class="field-label">分組名稱 *</label>
              <input
                v-model="draft.name"
                type="text"
                class="input-field text-sm"
                placeholder="例：設計參考、技術文章"
              />
            </div>
            <div>
              <label class="field-label">說明（選填）</label>
              <textarea
                v-model="draft.description"
                rows="2"
                class="input-field text-sm resize-none"
                placeholder="這個分組的用途…"
              />
            </div>
          </div>

          <p v-if="saveError" class="text-xs font-body mb-3" style="color: #e07070;">{{ saveError }}</p>

          <div class="flex justify-end gap-2">
            <button
              class="px-4 py-2 rounded-lg text-sm font-body text-inkMuted cursor-pointer hover:text-ink transition-colors"
              @click="emit('close')"
            >取消</button>
            <button
              class="btn-cta px-4 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer disabled:opacity-40"
              :disabled="!draft.name.trim() || saving"
              @click="doSave"
            >
              <span v-if="saving" class="w-4 h-4 border-2 rounded-full animate-spin border-current border-t-transparent inline-block mr-1" />
              {{ group ? '儲存' : '建立' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X as XIcon } from 'lucide-vue-next'
import { useNotesStore } from '../stores/notesStore'
import type { NoteGroup } from '../types'

const props = defineProps<{ open: boolean; group: NoteGroup | null }>()
const emit  = defineEmits<{ close: []; saved: [] }>()

const store     = useNotesStore()
const saving    = ref(false)
const saveError = ref<string | null>(null)
const draft     = ref({ name: '', description: '' })

watch(() => props.open, (v) => {
  if (v) {
    draft.value = {
      name:        props.group?.name        ?? '',
      description: props.group?.description ?? '',
    }
    saveError.value = null
  }
})

async function doSave() {
  if (!draft.value.name.trim()) return
  saving.value    = true
  saveError.value = null
  try {
    if (props.group) {
      await store.updateGroup(props.group.id, draft.value.name.trim(), draft.value.description.trim() || undefined)
    } else {
      await store.createGroup(draft.value.name.trim(), draft.value.description.trim() || undefined)
    }
    emit('saved')
    emit('close')
  } catch (e) {
    saveError.value = (e as Error).message
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.field-label {
  display: block; font-size: 11px; font-family: Inter, sans-serif; font-weight: 600;
  color: var(--c-inkMuted); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px;
}

.modal-handle {
  display: none;
  width: 36px; height: 4px; border-radius: 2px;
  background: color-mix(in srgb, var(--c-border) 70%, transparent);
  margin: 0 auto 16px;
}

.modal-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.modal-box {
  width: 100%; max-width: 400px;
  background: var(--c-card);
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
}

/* Desktop animation */
.modal-fade-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.modal-fade-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.97); }

/* Mobile: bottom sheet */
@media (max-width: 639px) {
  .modal-handle { display: block; }
  .modal-backdrop {
    align-items: flex-end;
    padding: 0;
  }
  .modal-box {
    max-width: 100%;
    border-radius: 0;
    border-bottom: none;
    padding-bottom: max(20px, env(safe-area-inset-bottom));
  }
  .modal-fade-enter-active { transition: opacity 0.2s ease, transform 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
  .modal-fade-leave-active { transition: opacity 0.16s ease, transform 0.2s ease; }
  .modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: translateY(60%); }
}
</style>
