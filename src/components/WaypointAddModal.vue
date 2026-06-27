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
        <div class="card-aged rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4">

          <div class="flex items-center gap-2.5">
            <PlusIcon :size="15" class="text-primary opacity-80" />
            <span class="font-heading text-lg text-ink tracking-wide">新增記錄點</span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">緯度</label>
              <input
                v-model="draft.lat"
                type="number"
                step="0.000001"
                class="w-full rounded-lg px-3 py-2 text-sm font-mono text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
                style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                placeholder="24.123456"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">經度</label>
              <input
                v-model="draft.lng"
                type="number"
                step="0.000001"
                class="w-full rounded-lg px-3 py-2 text-sm font-mono text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
                style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                placeholder="121.123456"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">名稱</label>
            <input
              v-model="draft.name"
              class="w-full rounded-lg px-3 py-2 text-sm font-body text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
              style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
              placeholder="記錄點名稱"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">描述</label>
            <textarea
              v-model="draft.desc"
              rows="2"
              class="w-full rounded-lg px-3 py-2 text-sm font-body text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150 resize-none"
              style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
              placeholder="備註說明"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">日期</label>
            <input
              :value="draft.wptDate"
              type="date"
              class="w-full rounded-lg px-3 py-2 text-sm font-mono text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
              :style="`border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent); color-scheme: ${isDark ? 'dark' : 'light'};`"
              @change="draft.wptDate = ($event.target as HTMLInputElement).value"
            />
          </div>

          <p v-if="error" class="text-xs font-body text-red-400">{{ error }}</p>

          <div class="flex gap-2 pt-1">
            <button
              class="flex-1 py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-150 border"
              style="color: var(--c-inkMuted); border-color: var(--c-border);"
              :disabled="saving"
              @click="$emit('close')"
            >取消</button>
            <button
              class="flex-1 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer btn-cta transition-colors duration-150 flex items-center justify-center gap-2"
              :disabled="saving"
              @click="$emit('create')"
            >
              <div v-if="saving" class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {{ saving ? '新增中…' : '新增' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Plus as PlusIcon } from 'lucide-vue-next'

defineProps<{
  open:   boolean
  draft:  { lat: string; lng: string; name: string; desc: string; wptDate: string }
  saving: boolean
  error:  string | null
  isDark: boolean
}>()

defineEmits<{
  close:  []
  create: []
}>()
</script>

<style scoped>
.export-fade-enter-active,
.export-fade-leave-active { transition: opacity 0.15s ease; }
.export-fade-enter-from,
.export-fade-leave-to    { opacity: 0; }
</style>
