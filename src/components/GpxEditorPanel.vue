<template>
  <Transition name="gear-panel">
    <div v-if="panelOpen" class="w-[460px] shrink-0 card-aged p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-heading text-base text-ink">{{ editingId ? '編輯路線' : '新增 GPX' }}</h2>
        <button class="text-inkMuted hover:text-ink cursor-pointer transition-colors" @click="closePanel"><XIcon :size="16" /></button>
      </div>

      <!-- 路線名稱 -->
      <div class="mb-3">
        <label class="field-label">路線名稱 *</label>
        <input v-model="form.name" type="text" class="input-field text-sm" placeholder="路線名稱" />
      </div>

      <!-- 日期 / 人數 / 星等 -->
      <div class="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label class="field-label">日期</label>
          <input v-model="form.date" type="date" class="input-field text-sm font-mono" />
        </div>
        <div>
          <label class="field-label">人數</label>
          <input v-model.number="form.peopleCount" type="number" min="1" class="input-field text-sm font-mono no-spinner" placeholder="1" />
        </div>
        <div>
          <label class="field-label">難度星等 (1–{{ profile.difficultyMax }})</label>
          <input v-model.number="form.difficultyStars" type="number" min="1" :max="profile.difficultyMax" class="input-field text-sm font-mono no-spinner" :placeholder="`1–${profile.difficultyMax}`" />
        </div>
      </div>

      <!-- 參考連結 -->
      <div class="mb-3">
        <label class="field-label">參考連結</label>
        <input v-model="form.referenceUrl" type="url" class="input-field text-sm font-mono" placeholder="https://..." />
      </div>

      <!-- 標籤 -->
      <div class="mb-3">
        <label class="field-label">標籤</label>
        <div class="flex flex-wrap gap-1.5 mb-1.5">
          <span
            v-for="tag in form.tags" :key="tag"
            class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body border"
            style="background: color-mix(in srgb, var(--c-primary) 28%, transparent); border-color: var(--c-primary); color: var(--c-ink); font-weight: 600;"
          >
            <button type="button" class="cursor-pointer opacity-60 hover:opacity-100 transition-opacity" @click="form.tags.splice(form.tags.indexOf(tag), 1)">
              <XIcon :size="10" />
            </button>
            {{ tag }}
          </span>
          <button
            type="button"
            class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body cursor-pointer transition-all duration-150 border border-dashed"
            style="color: var(--c-inkMuted); border-color: color-mix(in srgb, var(--c-border) 80%, transparent);"
            @click="tagModalOpen = true"
          >
            <TagIcon :size="11" /> 選擇標籤
          </button>
        </div>
        <TagPickerModal :open="tagModalOpen" v-model="form.tags" @close="tagModalOpen = false" />
      </div>

      <!-- GPX 檔案 -->
      <div class="mb-4">
        <label class="field-label">GPX 檔案{{ editingId ? '（選填，重新上傳才更新）' : ' *' }}</label>
        <div
          class="relative flex flex-col items-center justify-center gap-1 rounded-lg cursor-pointer transition-colors duration-150"
          style="height: 56px; border: 1px dashed rgba(198,172,143,0.3); background: rgba(198,172,143,0.04);"
          @click="fileInputEl?.click()"
        >
          <UploadIcon :size="15" class="text-inkMuted opacity-60" />
          <span class="text-[11px] font-body text-inkMuted">
            {{ form.gpxFile ? form.gpxFile.name : '選擇 .gpx 檔案' }}
          </span>
          <input ref="fileInputEl" type="file" accept=".gpx" class="hidden" @change="onFileChange" />
        </div>
      </div>

      <!-- Buttons -->
      <div class="flex items-center gap-2">
        <button
          class="px-3 py-1.5 rounded-lg text-xs font-body font-medium cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors"
          @click="closePanel"
        >取消</button>
        <button
          class="flex items-center gap-1.5 btn-cta text-xs font-semibold font-body px-4 py-1.5 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!form.name.trim() || (!editingId && !form.gpxFile) || saving"
          @click="submitForm"
        >
          <span v-if="saving" class="w-3 h-3 border-2 rounded-full animate-spin border-current border-t-transparent" />
          <SaveIcon v-else :size="13" />
          {{ saving ? '儲存中…' : (editingId ? '儲存更新' : '確認新增') }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { X as XIcon, Save as SaveIcon, Upload as UploadIcon, Tag as TagIcon } from 'lucide-vue-next'
import TagPickerModal from './TagPickerModal.vue'
import { useProfileStore } from '../stores/profileStore'
import { useGpxEditor } from '../composables/useGpxEditor'
import type { GpxLibraryEntry } from '../types'
import type { Reactive } from 'vue'

const props = defineProps<{
  cardElevations: Reactive<Record<string, number[] | null>>
  loadCardGpx: (entry: GpxLibraryEntry) => void
}>()

const profile = useProfileStore()

const {
  form, panelOpen, editingId, saving, apiError, fileInputEl, tagModalOpen,
  openCreate, openEdit, closePanel, onFileChange, submitForm,
} = useGpxEditor(props.cardElevations, props.loadCardGpx)

defineExpose({ openCreate, openEdit, panelOpen, apiError })
</script>

<style scoped>
.field-label {
  display: block; font-size: 11px; font-family: Inter, sans-serif;
  font-weight: 600; color: var(--c-inkMuted);
  letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 5px;
}
.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.no-spinner { -moz-appearance: textfield; }

.gear-panel-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.gear-panel-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.gear-panel-enter-from, .gear-panel-leave-to { opacity: 0; transform: translateX(20px); }
</style>
