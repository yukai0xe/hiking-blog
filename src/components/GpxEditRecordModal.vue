<template>
  <Teleport to="body">
    <Transition name="export-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: color-mix(in srgb, var(--c-base) 60%, transparent); backdrop-filter: blur(4px);"
        @click.self="$emit('close')"
        @keydown.esc="$emit('close')"
      >
        <div class="card-aged rounded-xl p-6 w-full max-w-lg shadow-xl space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <PencilIcon :size="15" class="text-primary opacity-80" />
              <span class="font-heading text-lg text-ink tracking-wide">編輯路線</span>
            </div>
            <button class="wpt-close-btn" @click="$emit('close')">
              <XIcon :size="12" />
            </button>
          </div>
          <div v-if="!editingMainRoute" class="space-y-1.5">
            <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">路線名稱</label>
            <input
              :value="name"
              class="w-full rounded-lg px-3 py-2 text-sm font-body text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
              style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
              placeholder="路線名稱"
              @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">說明</label>
            <textarea
              :value="description"
              rows="10"
              class="w-full rounded-lg px-3 py-2 text-sm font-body text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150 resize-none"
              style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
              placeholder="路線說明（選填）"
              @input="$emit('update:description', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
          <p v-if="error" class="text-xs font-body text-red-400">{{ error }}</p>
          <div class="flex gap-2">
            <button
              class="flex-1 py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-150 border"
              style="color: var(--c-inkMuted); border-color: var(--c-border);"
              :disabled="saving"
              @click="$emit('close')"
            >取消</button>
            <button
              class="flex-1 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer btn-cta transition-colors duration-150 flex items-center justify-center gap-2"
              :disabled="saving"
              @click="$emit('save')"
            >
              <div v-if="saving" class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {{ saving ? '儲存中…' : '儲存' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Pencil as PencilIcon, X as XIcon } from 'lucide-vue-next'

defineProps<{
  open:             boolean
  editingMainRoute: boolean
  name:             string
  description:      string
  saving:           boolean
  error:            string | null
}>()

defineEmits<{
  close:                []
  save:                 []
  'update:name':        [string]
  'update:description': [string]
}>()
</script>

<style scoped>
.wpt-close-btn {
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--c-border);
  color: var(--c-inkMuted);
  cursor: pointer;
  transition: all 0.15s ease;
}
.wpt-close-btn:hover {
  background: color-mix(in srgb, var(--c-border) 60%, transparent);
  color: var(--c-ink);
  transform: scale(1.1);
}
.export-fade-enter-active,
.export-fade-leave-active { transition: opacity 0.15s ease; }
.export-fade-enter-from,
.export-fade-leave-to    { opacity: 0; }
</style>
