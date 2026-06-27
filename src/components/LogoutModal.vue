<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: color-mix(in srgb, var(--c-base) 60%, transparent); backdrop-filter: blur(4px);"
        @click.self="show = false"
        @keydown.esc="show = false"
      >
        <div class="card-aged rounded-xl shadow-xl p-6 w-full max-w-xs space-y-5">
          <div class="space-y-1">
            <p class="font-heading text-base text-ink tracking-wide">確認登出</p>
            <p class="font-body text-sm text-inkMuted">確定要登出帳號嗎？</p>
          </div>
          <div class="flex items-center justify-end gap-2">
            <button
              class="card-aged px-4 py-2 rounded-lg text-sm font-body text-inkMuted hover:text-ink cursor-pointer transition-colors duration-150"
              @click="show = false"
            >取消</button>
            <button
              class="px-4 py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-150"
              style="background: var(--c-primary); color: var(--c-base);"
              @click="emit('confirm')"
            >登出</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const show = defineModel<boolean>({ required: true })
const emit = defineEmits<{ confirm: [] }>()
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to    { opacity: 0; }
</style>
