<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-backdrop" @click.self="$emit('cancel')">
        <div class="modal-box">
          <div class="modal-icon-wrap"><Trash2Icon :size="26" /></div>
          <h2 class="font-heading text-xl font-bold text-ink mb-1">刪除這筆記錄？</h2>
          <p class="font-body text-sm text-inkMuted leading-relaxed mb-6">
            「{{ postTitle }}」將永久刪除，包含所有照片與裝備資料，無法復原。
          </p>
          <p v-if="error" class="text-red-400 text-xs font-body mb-4 flex items-center gap-1">
            <AlertCircleIcon :size="13" /> {{ error }}
          </p>
          <div class="flex gap-3">
            <button
              class="flex-1 py-2.5 rounded-lg font-semibold font-body text-sm cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors duration-200"
              :disabled="loading"
              @click="$emit('cancel')"
            >取消</button>
            <button
              class="flex-1 py-2.5 rounded-lg font-semibold font-body text-sm cursor-pointer delete-confirm-btn flex items-center justify-center gap-1.5 transition-all duration-200"
              :disabled="loading"
              @click="$emit('confirm')"
            >
              <span v-if="loading" class="w-3.5 h-3.5 border-2 rounded-full animate-spin border-current border-t-transparent" />
              <Trash2Icon v-else :size="13" />
              {{ loading ? '刪除中…' : '確認刪除' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Trash2 as Trash2Icon, AlertCircle as AlertCircleIcon } from 'lucide-vue-next'

defineProps<{
  open:      boolean
  postTitle: string
  loading:   boolean
  error:     string | null
}>()

defineEmits<{
  confirm: []
  cancel:  []
}>()
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center; padding: 24px;
  background: rgba(10, 9, 8, 0.72); backdrop-filter: blur(4px);
}
.modal-box {
  width: 100%; max-width: 380px; border-radius: 16px;
  padding: 32px 28px 28px; background: var(--c-card);
  border: 1px solid rgba(220, 60, 60, 0.25);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.04) inset;
  text-align: center;
}
.modal-icon-wrap {
  width: 56px; height: 56px; border-radius: 50%;
  background: rgba(220, 60, 60, 0.12); border: 1px solid rgba(220, 60, 60, 0.3);
  color: #e07070; display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}
.delete-confirm-btn {
  background: rgba(220, 60, 60, 0.15); color: #e07070;
  border: 1px solid rgba(220, 60, 60, 0.4);
}
.delete-confirm-btn:hover:not(:disabled) {
  background: rgba(220, 60, 60, 0.28); border-color: rgba(220, 60, 60, 0.65);
}
.modal-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.modal-leave-active { transition: opacity 0.14s ease, transform 0.12s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.96); }
</style>
