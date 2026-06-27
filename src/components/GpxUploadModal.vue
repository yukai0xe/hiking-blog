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

          <!-- Header: tabs + close -->
          <div class="flex items-center justify-between">
            <div class="flex gap-1 p-0.5 rounded-lg" style="background: color-mix(in srgb, var(--c-border) 40%, transparent);">
              <button
                class="px-3 py-1 rounded-md text-xs font-body transition-colors duration-150 cursor-pointer"
                :class="tab === 'upload' ? 'btn-cta' : 'text-inkMuted hover:text-ink'"
                @click="$emit('update:tab', 'upload')"
              ><UploadIcon :size="11" class="inline mr-1" />上傳檔案</button>
              <button
                class="px-3 py-1 rounded-md text-xs font-body transition-colors duration-150 cursor-pointer"
                :class="tab === 'import' ? 'btn-cta' : 'text-inkMuted hover:text-ink'"
                @click="$emit('update:tab', 'import'); $emit('fetchLibrary')"
              ><BookOpenIcon :size="11" class="inline mr-1" />從 GPX 收藏匯入</button>
            </div>
            <button class="wpt-close-btn" @click="$emit('close')">
              <XIcon :size="12" />
            </button>
          </div>

          <!-- ── Upload tab ── -->
          <template v-if="tab === 'upload'">
            <div v-if="isNewRecord" class="space-y-1.5">
              <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">路線名稱</label>
              <input
                :value="recordName"
                class="w-full rounded-lg px-3 py-2 text-sm font-body text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
                style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                placeholder="留空預設為「新路線」"
                @input="$emit('update:recordName', ($event.target as HTMLInputElement).value)"
              />
            </div>
            <label
              class="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors duration-150 py-10"
              :style="file
                ? 'border-color: var(--c-primary); background: color-mix(in srgb, var(--c-primary) 6%, transparent);'
                : 'border-color: var(--c-border); background: transparent;'"
            >
              <UploadIcon
                :size="28"
                :style="file ? 'color: var(--c-primary);' : 'color: var(--c-inkMuted); opacity: 0.4;'"
              />
              <div class="text-center">
                <p class="text-sm font-body" :style="file ? 'color: var(--c-primary);' : 'color: var(--c-inkMuted);'">
                  {{ file ? file.name : '點擊選擇 .gpx 檔案' }}
                </p>
                <p v-if="!file" class="text-[11px] font-body text-inkMuted opacity-50 mt-1">或拖曳至此</p>
              </div>
              <input
                type="file"
                accept=".gpx,application/gpx+xml"
                class="hidden"
                @change="$emit('update:file', ($event.target as HTMLInputElement).files?.[0] ?? null)"
              />
            </label>
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                :checked="syncToLibrary"
                class="rounded accent-primary"
                @change="$emit('update:syncToLibrary', ($event.target as HTMLInputElement).checked)"
              />
              <span class="text-xs font-body text-inkMuted">同步加入到 GPX 收藏</span>
            </label>
            <p v-if="uploadError" class="text-xs font-body text-red-400 break-all">{{ uploadError }}</p>
            <div class="flex gap-2">
              <button
                class="flex-1 py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-150 border"
                style="color: var(--c-inkMuted); border-color: var(--c-border);"
                :disabled="uploading"
                @click="$emit('close')"
              >取消</button>
              <button
                class="flex-1 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer btn-cta transition-colors duration-150 flex items-center justify-center gap-2"
                :disabled="!file || uploading"
                @click="isNewRecord ? $emit('addRecord') : rerouteRecordId ? $emit('reroute') : $emit('upload')"
              >
                <div v-if="uploading" class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {{ uploading ? '上傳中…' : (isNewRecord ? '新增' : '上傳') }}
              </button>
            </div>
          </template>

          <!-- ── Import tab ── -->
          <template v-else>
            <div v-if="isNewRecord" class="space-y-1.5">
              <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">紀錄名稱</label>
              <input
                :value="recordName"
                class="w-full rounded-lg px-3 py-2 text-sm font-body text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
                style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                placeholder="留空預設為「新路線」"
                @input="$emit('update:recordName', ($event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              <div v-if="gpxLibLoading" class="py-8 text-center text-inkMuted font-body text-sm">載入中…</div>
              <div v-else-if="gpxLibrary.length === 0" class="py-8 text-center text-inkMuted font-body text-sm">GPX 收藏為空</div>
              <button
                v-for="entry in gpxLibrary"
                :key="entry.id"
                class="w-full text-left px-3 py-2.5 rounded-lg card-aged cursor-pointer transition-colors duration-150 hover:border-primary disabled:opacity-50"
                :disabled="importing"
                @click="$emit('importFromLibrary', entry)"
              >
                <p class="font-body text-sm text-ink leading-snug">{{ entry.name }}</p>
                <p class="font-mono text-[10px] text-inkMuted mt-0.5">{{ entry.date ?? '—' }}</p>
              </button>
            </div>
            <p v-if="importError" class="text-xs font-body text-red-400 break-all">{{ importError }}</p>
            <button
              class="w-full py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-150 border"
              style="color: var(--c-inkMuted); border-color: var(--c-border);"
              :disabled="importing"
              @click="$emit('close')"
            >取消</button>
          </template>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Upload as UploadIcon, X as XIcon, BookOpen as BookOpenIcon } from 'lucide-vue-next'
import type { GpxLibraryEntry } from '../types'

defineProps<{
  open:           boolean
  tab:            'upload' | 'import'
  isNewRecord:    boolean
  rerouteRecordId: string | null
  recordName:     string
  file:           File | null
  gpxLibrary:     GpxLibraryEntry[]
  gpxLibLoading:  boolean
  uploading:      boolean
  importing:      boolean
  uploadError:    string | null
  importError:    string | null
  syncToLibrary:  boolean
}>()

defineEmits<{
  close:             []
  'update:tab':      ['upload' | 'import']
  'update:recordName': [string]
  'update:file':     [File | null]
  'update:syncToLibrary': [boolean]
  upload:            []
  addRecord:         []
  reroute:           []
  importFromLibrary: [entry: GpxLibraryEntry]
  fetchLibrary:      []
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
