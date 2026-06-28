<template>
  <div class="space-y-3 pt-3">
    <!-- 路線名稱 -->
    <div>
      <label class="field-label">路線名稱 *</label>
      <input :value="form.name" type="text" class="input-field text-sm" placeholder="路線名稱"
        @input="form.name = ($event.target as HTMLInputElement).value" />
    </div>

    <!-- 日期 / 人數 / 星等 -->
    <div class="grid grid-cols-3 gap-3">
      <div>
        <label class="field-label">日期</label>
        <input :value="form.date" type="date" class="input-field text-sm font-mono"
          @input="form.date = ($event.target as HTMLInputElement).value" />
      </div>
      <div>
        <label class="field-label">人數</label>
        <input :value="form.peopleCount ?? ''" type="number" min="1" class="input-field text-sm font-mono no-spinner" placeholder="1"
          @input="form.peopleCount = Number(($event.target as HTMLInputElement).value) || null" />
      </div>
      <div>
        <label class="field-label">難度 (1–{{ profile.difficultyMax }})</label>
        <input :value="form.difficultyStars ?? ''" type="number" min="1" :max="profile.difficultyMax" class="input-field text-sm font-mono no-spinner" :placeholder="`1–${profile.difficultyMax}`"
          @input="form.difficultyStars = Number(($event.target as HTMLInputElement).value) || null" />
      </div>
    </div>

    <!-- 參考連結 -->
    <div>
      <label class="field-label">參考連結</label>
      <input :value="form.referenceUrl" type="url" class="input-field text-sm font-mono" placeholder="https://..."
        @input="form.referenceUrl = ($event.target as HTMLInputElement).value" />
    </div>

    <!-- 標籤 -->
    <div>
      <label class="field-label">標籤</label>
      <div class="flex flex-wrap gap-1.5 mb-1.5">
        <span
          v-for="tag in form.tags" :key="tag"
          class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body border"
          style="background: color-mix(in srgb, var(--c-primary) 28%, transparent); border-color: var(--c-primary); color: var(--c-ink); font-weight: 600;"
        >
          <button type="button" class="cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
            @click="form.tags.splice(form.tags.indexOf(tag), 1)">
            <XIcon :size="10" />
          </button>
          {{ tag }}
        </span>
        <button
          type="button"
          class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body cursor-pointer transition-all duration-150 border border-dashed"
          style="color: var(--c-inkMuted); border-color: color-mix(in srgb, var(--c-border) 80%, transparent);"
          @click="emit('update:tagModalOpen', true)"
        >
          <TagIcon :size="11" /> 選擇標籤
        </button>
      </div>
      <TagPickerModal :open="tagModalOpen" v-model="form.tags" @close="emit('update:tagModalOpen', false)" />
    </div>

    <!-- GPX 檔案 -->
    <div>
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
        <input ref="fileInputEl" type="file" accept=".gpx" class="hidden" @change="emit('fileChange', $event)" />
      </div>
    </div>

    <!-- Buttons -->
    <div class="flex items-center gap-2 pt-1">
      <button
        class="px-3 py-1.5 rounded-lg text-xs font-body font-medium cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors"
        @click="emit('cancel')"
      >取消</button>
      <button
        class="flex items-center gap-1.5 btn-cta text-xs font-semibold font-body px-4 py-1.5 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="!form.name.trim() || (!editingId && !form.gpxFile) || saving"
        @click="emit('submit')"
      >
        <span v-if="saving" class="w-3 h-3 border-2 rounded-full animate-spin border-current border-t-transparent" />
        <SaveIcon v-else :size="13" />
        {{ saving ? '儲存中…' : (editingId ? '儲存更新' : '確認新增') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X as XIcon, Save as SaveIcon, Upload as UploadIcon, Tag as TagIcon } from 'lucide-vue-next'
import TagPickerModal from './TagPickerModal.vue'
import { useProfileStore } from '../stores/profileStore'
import type { GpxForm } from '../composables/useGpxEditor'

defineProps<{
  form: GpxForm
  editingId: string | null
  saving: boolean
  fileInputEl: HTMLInputElement | null
  tagModalOpen: boolean
}>()

const emit = defineEmits<{
  'update:tagModalOpen': [value: boolean]
  fileChange: [event: Event]
  submit: []
  cancel: []
}>()

const profile = useProfileStore()
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
</style>
