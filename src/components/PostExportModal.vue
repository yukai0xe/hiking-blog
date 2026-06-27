<template>
  <Teleport to="body">
    <Transition name="export-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: color-mix(in srgb, var(--c-base) 60%, transparent); backdrop-filter: blur(4px);"
        @click.self="!exporting && $emit('close')"
        @keydown.esc="!exporting && $emit('close')"
      >
        <div class="card-aged rounded-xl p-6 w-full max-w-sm shadow-xl relative overflow-hidden">

          <div class="flex items-center gap-2.5 mb-5">
            <DownloadIcon :size="16" class="text-primary" />
            <span class="font-heading text-lg text-ink tracking-wide">匯出記錄</span>
          </div>

          <p class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted mb-2.5">匯出格式</p>
          <div class="flex gap-2 mb-5">
            <button
              v-for="fmt in (['json', 'pdf'] as const)"
              :key="fmt"
              class="flex-1 py-2 rounded-lg text-sm font-mono font-semibold border cursor-pointer transition-all duration-150"
              :style="format === fmt
                ? 'background: var(--c-primary); color: var(--c-base); border-color: var(--c-primary);'
                : 'background: transparent; color: var(--c-inkMuted); border-color: var(--c-border);'"
              @click="$emit('update:format', fmt)"
            >
              .{{ fmt }}
            </button>
          </div>

          <p class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted mb-2.5">包含內容</p>
          <div class="flex flex-col gap-3 mb-6">
            <label class="flex items-center gap-3 cursor-pointer select-none">
              <div
                class="w-10 h-5 rounded-full relative transition-colors duration-200 shrink-0"
                :style="includeGears ? 'background: var(--c-primary);' : 'background: color-mix(in srgb, var(--c-border) 80%, transparent);'"
                @click="$emit('update:includeGears', !includeGears)"
              >
                <div
                  class="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
                  :style="`background: var(--c-base); box-shadow: 0 1px 3px rgba(0,0,0,0.3); transform: translateX(${includeGears ? 20 : 2}px);`"
                />
              </div>
              <span class="text-sm font-body text-ink">裝備清單</span>
            </label>

            <label class="flex items-center gap-3 cursor-pointer select-none">
              <div
                class="w-10 h-5 rounded-full relative transition-colors duration-200 shrink-0"
                :style="includeFoods ? 'background: var(--c-primary);' : 'background: color-mix(in srgb, var(--c-border) 80%, transparent);'"
                @click="$emit('update:includeFoods', !includeFoods)"
              >
                <div
                  class="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
                  :style="`background: var(--c-base); box-shadow: 0 1px 3px rgba(0,0,0,0.3); transform: translateX(${includeFoods ? 20 : 2}px);`"
                />
              </div>
              <span class="text-sm font-body text-ink">糧食清單</span>
            </label>

            <label class="flex items-center gap-3 cursor-pointer select-none" :style="!includeFoods ? 'opacity: 0.4; pointer-events: none;' : ''">
              <div
                class="w-10 h-5 rounded-full relative transition-colors duration-200 shrink-0"
                :style="includeFoodDayAssignments ? 'background: var(--c-primary);' : 'background: color-mix(in srgb, var(--c-border) 80%, transparent);'"
                @click="$emit('update:includeFoodDayAssignments', !includeFoodDayAssignments)"
              >
                <div
                  class="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
                  :style="`background: var(--c-base); box-shadow: 0 1px 3px rgba(0,0,0,0.3); transform: translateX(${includeFoodDayAssignments ? 20 : 2}px);`"
                />
              </div>
              <span class="text-sm font-body text-ink pl-1">↳ 糧食日程分配</span>
            </label>

            <label class="flex items-center gap-3 cursor-pointer select-none">
              <div
                class="w-10 h-5 rounded-full relative transition-colors duration-200 shrink-0"
                :style="includeGpx ? 'background: var(--c-primary);' : 'background: color-mix(in srgb, var(--c-border) 80%, transparent);'"
                @click="$emit('update:includeGpx', !includeGpx)"
              >
                <div
                  class="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
                  :style="`background: var(--c-base); box-shadow: 0 1px 3px rgba(0,0,0,0.3); transform: translateX(${includeGpx ? 20 : 2}px);`"
                />
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-body text-ink">GPX 路線檔</span>
                <span v-if="includeGpx" class="text-[10px] font-body text-inkMuted">匯出為 .zip</span>
              </div>
            </label>
          </div>

          <p v-if="error" class="text-xs font-body text-red-400 mb-3 break-all">{{ error }}</p>

          <div class="flex gap-2">
            <button
              class="flex-1 py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-150 border"
              style="color: var(--c-inkMuted); border-color: var(--c-border);"
              :disabled="exporting"
              @click="$emit('close')"
            >取消</button>
            <button
              class="flex-1 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer btn-cta transition-colors duration-150"
              :disabled="exporting"
              @click="$emit('export')"
            >匯出</button>
          </div>

          <Transition name="export-fade">
            <div
              v-if="exporting"
              class="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl"
              style="background: color-mix(in srgb, var(--c-base) 88%, transparent); backdrop-filter: blur(2px);"
            >
              <div class="export-spinner" />
              <span class="text-sm font-body text-inkMuted">匯出中...</span>
            </div>
          </Transition>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Download as DownloadIcon } from 'lucide-vue-next'

defineProps<{
  open:                   boolean
  format:                 'json' | 'pdf'
  includeGears:           boolean
  includeFoods:           boolean
  includeFoodDayAssignments: boolean
  includeGpx:             boolean
  exporting:              boolean
  error:                  string | null
}>()

defineEmits<{
  close:                           []
  export:                          []
  'update:format':                 ['json' | 'pdf']
  'update:includeGears':           [boolean]
  'update:includeFoods':           [boolean]
  'update:includeFoodDayAssignments': [boolean]
  'update:includeGpx':             [boolean]
}>()
</script>

<style scoped>
.export-fade-enter-active,
.export-fade-leave-active { transition: opacity 0.15s ease; }
.export-fade-enter-from,
.export-fade-leave-to    { opacity: 0; }
.export-spinner {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 3px solid color-mix(in srgb, var(--c-primary) 25%, transparent);
  border-top-color: var(--c-primary);
  animation: export-spin 0.7s linear infinite;
}
@keyframes export-spin { to { transform: rotate(360deg); } }
</style>
