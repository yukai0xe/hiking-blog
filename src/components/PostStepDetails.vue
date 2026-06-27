<template>
  <div class="space-y-4">
    <h2 class="font-heading text-xl text-ink mb-1">詳細資訊</h2>
    <p class="text-inkMuted text-sm font-body mb-6">選擇在詳細頁要顯示的區塊，關閉後資料仍保留。</p>

    <div class="space-y-3">
      <div
        class="flex items-center justify-between p-4 rounded-xl"
        style="border: 1px solid var(--c-border); background: color-mix(in srgb, var(--c-card) 50%, transparent);"
      >
        <div>
          <p class="text-sm font-body font-semibold text-ink">GPX 路線</p>
          <p class="text-xs font-body text-inkMuted mt-0.5">在詳細頁顯示地圖與記錄點</p>
        </div>
        <button type="button" class="toggle-btn shrink-0"
          :class="model.showGpx ? 'toggle-on' : 'toggle-off'"
          @click="model.showGpx = !model.showGpx">
          <span class="toggle-thumb" :class="model.showGpx ? 'translate-x-5' : 'translate-x-0'" />
        </button>
      </div>

      <div
        class="flex items-center justify-between p-4 rounded-xl"
        style="border: 1px solid var(--c-border); background: color-mix(in srgb, var(--c-card) 50%, transparent);"
      >
        <div>
          <p class="text-sm font-body font-semibold text-ink">裝備清單</p>
          <p class="text-xs font-body text-inkMuted mt-0.5">在詳細頁顯示裝備列表與重量統計</p>
        </div>
        <button type="button" class="toggle-btn shrink-0"
          :class="model.showGears ? 'toggle-on' : 'toggle-off'"
          @click="model.showGears = !model.showGears">
          <span class="toggle-thumb" :class="model.showGears ? 'translate-x-5' : 'translate-x-0'" />
        </button>
      </div>

      <div
        class="flex items-center justify-between p-4 rounded-xl"
        style="border: 1px solid var(--c-border); background: color-mix(in srgb, var(--c-card) 50%, transparent);"
      >
        <div>
          <p class="text-sm font-body font-semibold text-ink">糧食清單</p>
          <p class="text-xs font-body text-inkMuted mt-0.5">在詳細頁顯示糧食規劃</p>
        </div>
        <button type="button" class="toggle-btn shrink-0"
          :class="model.showFoods ? 'toggle-on' : 'toggle-off'"
          @click="model.showFoods = !model.showFoods">
          <span class="toggle-thumb" :class="model.showFoods ? 'translate-x-5' : 'translate-x-0'" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostForm } from '../composables/usePostEditForm'

const model = defineModel<PostForm>({ required: true })
</script>

<style scoped>
.toggle-btn {
  position: relative; width: 44px; height: 24px; border-radius: 12px;
  cursor: pointer; border: none; transition: background 0.2s ease;
}
.toggle-on  { background: var(--c-primary); }
.toggle-off { background: color-mix(in srgb, var(--c-border) 120%, transparent); }
.toggle-thumb {
  position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
  border-radius: 50%; background: white; transition: transform 0.2s ease; display: block;
}
</style>
