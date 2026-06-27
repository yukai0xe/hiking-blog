<template>
  <div class="space-y-5">
    <h2 class="font-heading text-xl text-ink mb-4">基本資訊</h2>
    <div>
      <label class="field-label">標題 *</label>
      <input v-model="model.title" type="text" class="input-field" placeholder="這次登山的名稱" />
    </div>
    <div>
      <label class="field-label">標籤</label>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="tag in model.tags" :key="tag"
          class="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-body border"
          style="background: color-mix(in srgb, var(--c-primary) 28%, transparent); border-color: var(--c-primary); color: var(--c-ink); font-weight: 600;"
        >
          <button type="button" class="cursor-pointer opacity-60 hover:opacity-100 transition-opacity" @click="model.tags.splice(model.tags.indexOf(tag), 1)">
            <XIcon :size="11" />
          </button>
          {{ tag }}
        </span>
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body cursor-pointer transition-all duration-150 border border-dashed"
          style="color: var(--c-inkMuted); border-color: color-mix(in srgb, var(--c-border) 80%, transparent);"
          @click="tagModalOpen = true"
        >
          <TagIcon :size="12" /> 選擇標籤
        </button>
      </div>
      <TagPickerModal :open="tagModalOpen" v-model="model.tags" @close="tagModalOpen = false" />
    </div>
    <div>
      <label class="field-label">描述</label>
      <textarea v-model="model.description" rows="4" class="input-field resize-none" placeholder="記錄這次登山的心得…" />
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="field-label">開始日期</label>
        <input v-model="model.dateStart" type="date" class="input-field font-mono text-sm" />
      </div>
      <div>
        <label class="field-label">結束日期</label>
        <input v-model="model.dateEnd" type="date" class="input-field font-mono text-sm" />
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="field-label">天氣</label>
        <select v-model="model.weather" class="input-field font-body">
          <option value="">— 選擇天氣 —</option>
          <option>晴天</option><option>多雲時晴</option><option>多雲</option>
          <option>陰天</option><option>小雨</option><option>雨天</option>
          <option>大雨</option><option>雷陣雨</option><option>起霧</option><option>下雪</option>
        </select>
      </div>
      <div>
        <label class="field-label">人數</label>
        <input v-model.number="model.peopleCount" type="number" min="1" max="999" class="input-field no-spinner" placeholder="隊員人數" />
      </div>
    </div>
    <div>
      <label class="field-label">難度</label>
      <div class="flex items-center gap-2 mt-1">
        <button
          v-for="n in difficultyMax" :key="n"
          type="button"
          class="text-xl leading-none transition-colors duration-100 cursor-pointer"
          :class="n <= (model.difficultyStars ?? 0) ? 'text-primary' : 'text-inkMuted opacity-30'"
          @click="model.difficultyStars = model.difficultyStars === n ? null : n"
        >★</button>
        <span v-if="model.difficultyStars && difficultyLabels[model.difficultyStars - 1]"
          class="text-xs font-body text-inkMuted ml-1">
          {{ difficultyLabels[model.difficultyStars - 1] }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { X as XIcon, Tag as TagIcon } from 'lucide-vue-next'
import type { PostForm } from '../composables/usePostEditForm'
import TagPickerModal from './TagPickerModal.vue'

defineProps<{
  difficultyMax:    number
  difficultyLabels: string[]
}>()

const model      = defineModel<PostForm>({ required: true })
const tagModalOpen = ref(false)
</script>

<style scoped>
.field-label {
  display: block; font-size: 11px; font-family: Inter, sans-serif; font-weight: 600;
  color: var(--c-inkMuted); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px;
}
.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.no-spinner { -moz-appearance: textfield; }
</style>
