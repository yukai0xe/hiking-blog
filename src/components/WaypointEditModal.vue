<template>
  <Teleport to="body">
    <Transition name="export-fade">
      <div
        v-if="editingWpt"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: color-mix(in srgb, var(--c-base) 60%, transparent); backdrop-filter: blur(4px);"
        @click.self="$emit('close')"
        @keydown.esc="$emit('close')"
      >
        <div class="card-aged rounded-xl shadow-xl overflow-hidden flex w-full" style="max-width: 26rem;">

          <!-- Main form area -->
          <div class="flex-1 p-6 space-y-4 min-w-0">

            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <MapPinIcon :size="15" class="text-primary opacity-80 shrink-0" />
                <span class="font-heading text-lg text-ink tracking-wide truncate">編輯記錄點</span>
              </div>
              <button class="wpt-close-btn shrink-0" @click="$emit('close')">
                <XIcon :size="12" />
              </button>
            </div>

            <!-- Read-only info chips -->
            <div class="flex flex-wrap gap-1.5">
              <span v-if="editingWpt.ele !== null"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px]"
                style="background: color-mix(in srgb, var(--c-primary) 10%, transparent); color: var(--c-primary);">
                {{ editingWpt.ele }} m
              </span>
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] text-inkMuted"
                style="background: color-mix(in srgb, var(--c-surface) 60%, transparent);">
                {{ editingWpt.lat.toFixed(5) }}, {{ editingWpt.lng.toFixed(5) }}
              </span>
              <span v-if="editingWpt.time"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] text-inkMuted"
                style="background: color-mix(in srgb, var(--c-surface) 60%, transparent);">
                {{ formatWptTime(editingWpt.time) }}
              </span>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">名稱</label>
              <input
                v-model="draft.name"
                class="w-full rounded-lg px-3 py-2 text-sm font-body text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
                style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                placeholder="記錄點名稱"
                @keydown.enter="$emit('save')"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">描述</label>
              <textarea
                v-model="draft.desc"
                rows="3"
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

            <button
              class="w-full py-2 rounded-lg text-sm font-semibold font-body cursor-pointer btn-cta transition-colors duration-150 flex items-center justify-center gap-2"
              :disabled="saving"
              @click="$emit('save')"
            >
              <div v-if="saving" class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {{ saving ? '儲存中…' : '儲存' }}
            </button>
          </div>

          <!-- Right action strip -->
          <div
            class="shrink-0 flex flex-col items-center gap-3 py-6 px-3"
            style="border-left: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);"
          >
            <button
              class="wpt-action-btn"
              :title="editingWpt.hidden ? '顯示記錄點' : '隱藏記錄點'"
              :disabled="saving"
              @click="$emit('toggleHidden')"
            >
              <EyeIcon v-if="editingWpt.hidden" :size="16" />
              <EyeOffIcon v-else :size="16" />
            </button>
            <button
              v-if="isCustomWpt"
              class="wpt-action-btn danger"
              title="刪除記錄點"
              :disabled="saving"
              @click="$emit('delete')"
            >
              <Trash2Icon :size="16" />
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { MapPin as MapPinIcon, X as XIcon, Eye as EyeIcon, EyeOff as EyeOffIcon, Trash2 as Trash2Icon } from 'lucide-vue-next'
import type { Waypoint } from '../types'
import { formatWptTime } from '../utils/gpxHelpers'

defineProps<{
  editingWpt: Waypoint | null
  draft:      { name: string; desc: string; wptDate: string }
  saving:     boolean
  error:      string | null
  isDark:     boolean
  isCustomWpt: boolean
}>()

defineEmits<{
  close:        []
  save:         []
  toggleHidden: []
  delete:       []
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
.wpt-action-btn {
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  border: 1px solid var(--c-border);
  color: var(--c-inkMuted);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.wpt-action-btn:hover {
  transform: scale(1.18);
  background: color-mix(in srgb, var(--c-primary) 12%, transparent);
  border-color: var(--c-primary);
  color: var(--c-primary);
}
.wpt-action-btn.danger {
  border-color: rgba(224, 112, 112, 0.35);
  color: #e07070;
}
.wpt-action-btn.danger:hover {
  transform: scale(1.18);
  background: rgba(224, 112, 112, 0.12);
  border-color: #e07070;
  color: #ff8a8a;
}
.export-fade-enter-active,
.export-fade-leave-active { transition: opacity 0.15s ease; }
.export-fade-enter-from,
.export-fade-leave-to    { opacity: 0; }
</style>
