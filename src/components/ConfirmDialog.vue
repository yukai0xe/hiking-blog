<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-box">
          <div class="flex items-start gap-3 mb-4">
            <div class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                 style="background: color-mix(in srgb, #e07070 15%, transparent);">
              <AlertTriangleIcon :size="17" style="color: #e07070;" />
            </div>
            <div class="flex-1 min-w-0 pt-1">
              <h3 class="font-heading text-base font-semibold text-ink">{{ title }}</h3>
              <p v-if="message" class="text-sm font-body text-inkMuted mt-1 leading-relaxed">{{ message }}</p>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-5">
            <button
              class="px-4 py-2 rounded-lg text-sm font-body text-inkMuted cursor-pointer hover:text-ink transition-colors"
              @click="emit('close')"
            >取消</button>
            <button
              class="px-4 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer transition-opacity hover:opacity-80"
              style="background: color-mix(in srgb, #e07070 85%, transparent); color: #fff;"
              @click="emit('confirm')"
            >刪除</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { AlertTriangle as AlertTriangleIcon } from 'lucide-vue-next'

defineProps<{ open: boolean; title: string; message?: string }>()
const emit = defineEmits<{ confirm: []; close: [] }>()
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.modal-box {
  width: 100%; max-width: 360px;
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
