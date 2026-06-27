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
        <div class="card-aged rounded-xl shadow-xl overflow-hidden flex flex-col w-full" style="max-width: 26rem; max-height: 80vh;">

          <div class="flex items-center justify-between gap-2 px-6 py-4" style="border-bottom: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);">
            <div class="flex items-center gap-2">
              <EyeOffIcon :size="15" class="text-primary opacity-70" />
              <span class="font-heading text-base text-ink tracking-wide">批次顯示/隱藏</span>
            </div>
            <button
              class="w-6 h-6 rounded-full flex items-center justify-center text-inkMuted hover:text-ink transition-colors cursor-pointer"
              style="border: 1px solid var(--c-border);"
              @click="$emit('close')"
            >
              <XIcon :size="12" />
            </button>
          </div>

          <div class="px-6 py-3 flex items-center gap-3" style="border-bottom: 1px solid color-mix(in srgb, var(--c-border) 30%, transparent);">
            <input
              id="batch-select-all"
              type="checkbox"
              class="w-4 h-4 cursor-pointer accent-primary"
              :checked="selected.size === waypoints.length && waypoints.length > 0"
              :indeterminate="selected.size > 0 && selected.size < waypoints.length"
              @change="$emit('toggleAll')"
            />
            <label for="batch-select-all" class="text-xs font-body text-inkMuted cursor-pointer select-none">全選</label>
            <span class="ml-auto font-mono text-[10px] text-inkMuted opacity-50">
              已選 {{ selected.size }} / {{ waypoints.length }}
            </span>
          </div>

          <div class="overflow-y-auto flex-1 px-6 py-3 space-y-1">
            <label
              v-for="wpt in waypoints"
              :key="`${wpt.lat},${wpt.lng}`"
              class="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer select-none transition-colors duration-100"
              :style="selected.has(`${wpt.lat},${wpt.lng}`)
                ? 'background: color-mix(in srgb, var(--c-primary) 8%, transparent);'
                : 'background: transparent;'"
            >
              <input
                type="checkbox"
                class="w-4 h-4 cursor-pointer accent-primary shrink-0"
                :checked="selected.has(`${wpt.lat},${wpt.lng}`)"
                @change="$emit('toggleItem', `${wpt.lat},${wpt.lng}`)"
              />
              <div class="min-w-0 flex-1">
                <p class="font-heading text-sm leading-snug truncate" :class="wpt.hidden ? 'text-inkMuted line-through' : 'text-ink'">{{ wpt.name || '未命名' }}</p>
                <p class="font-mono text-[10px] text-inkMuted opacity-60">{{ wpt.lat.toFixed(5) }}, {{ wpt.lng.toFixed(5) }}</p>
              </div>
              <component
                :is="wpt.hidden ? EyeOffIcon : EyeIcon"
                :size="13"
                class="shrink-0 opacity-40"
                :class="wpt.hidden ? 'text-inkMuted' : 'text-primary'"
              />
            </label>
          </div>

          <div class="flex gap-2 px-6 py-4" style="border-top: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);">
            <button
              class="flex-1 py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-150 border"
              style="color: var(--c-inkMuted); border-color: var(--c-border);"
              @click="$emit('close')"
            >取消</button>
            <button
              class="flex-1 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer btn-cta transition-colors duration-150 flex items-center justify-center gap-2"
              :disabled="selected.size === 0 || saving"
              @click="$emit('confirm')"
            >
              <div v-if="saving" class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {{ saving ? '處理中…' : `切換 ${selected.size} 個記錄點` }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Eye as EyeIcon, EyeOff as EyeOffIcon, X as XIcon } from 'lucide-vue-next'
import type { Waypoint } from '../types'

defineProps<{
  open:      boolean
  waypoints: Waypoint[]
  selected:  Set<string>
  saving:    boolean
}>()

defineEmits<{
  close:      []
  toggleItem: [key: string]
  toggleAll:  []
  confirm:    []
}>()
</script>

<style scoped>
.export-fade-enter-active,
.export-fade-leave-active { transition: opacity 0.15s ease; }
.export-fade-enter-from,
.export-fade-leave-to    { opacity: 0; }
</style>
