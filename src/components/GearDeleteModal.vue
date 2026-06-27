<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="deletingGear" class="modal-backdrop" @click.self="emit('cancel')">
        <div class="delete-modal">
          <div class="modal-icon-wrap"><Trash2Icon :size="24" /></div>
          <h2 class="font-heading text-xl font-bold text-ink mb-1">刪除這件裝備？</h2>
          <p class="font-body text-sm text-inkMuted leading-relaxed mb-2">
            「{{ deletingGear.name }}」將從裝備庫中移除，已連結至登山記錄的資料不受影響。
          </p>
          <p v-if="apiError" class="text-red-400 text-xs font-body mb-3 flex items-center gap-1">
            <AlertCircleIcon :size="12" /> {{ apiError }}
          </p>
          <div class="flex gap-3 mt-5">
            <button
              class="flex-1 py-2.5 rounded-lg font-semibold font-body text-sm cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors"
              :disabled="saving"
              @click="emit('cancel')"
            >取消</button>
            <button
              class="flex-1 py-2.5 rounded-lg font-semibold font-body text-sm cursor-pointer delete-confirm-btn flex items-center justify-center gap-1.5"
              :disabled="saving"
              @click="emit('confirm')"
            >
              <span v-if="saving" class="w-3.5 h-3.5 border-2 rounded-full animate-spin border-current border-t-transparent" />
              <Trash2Icon v-else :size="13" />
              {{ saving ? '刪除中…' : '確認刪除' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Trash2 as Trash2Icon, AlertCircle as AlertCircleIcon } from 'lucide-vue-next'
import type { Gear } from '../types'

defineProps<{
  deletingGear: Gear | null
  saving: boolean
  apiError: string | null
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; z-index: 9000;
  display: flex; align-items: center; justify-content: center; padding: 24px;
  background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(4px);
}
.delete-modal {
  width: 100%; max-width: 360px; border-radius: 16px;
  padding: 32px 28px 28px; background: var(--c-card);
  border: 1px solid rgba(220, 60, 60, 0.25);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5); text-align: center;
}
.modal-icon-wrap {
  width: 52px; height: 52px; border-radius: 50%;
  background: rgba(220, 60, 60, 0.12); border: 1px solid rgba(220, 60, 60, 0.3);
  color: #e07070; display: flex; align-items: center; justify-content: center;
  margin: 0 auto 18px;
}
.delete-confirm-btn {
  background: rgba(220, 60, 60, 0.15); color: #e07070;
  border: 1px solid rgba(220, 60, 60, 0.4);
}
.delete-confirm-btn:hover:not(:disabled) {
  background: rgba(220, 60, 60, 0.28); border-color: rgba(220, 60, 60, 0.65);
}
.modal-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.modal-leave-active { transition: opacity 0.14s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .delete-modal { transform: translateY(12px) scale(0.98); }
</style>
