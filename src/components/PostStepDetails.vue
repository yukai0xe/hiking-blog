<template>
  <div class="space-y-4">
    <h2 class="font-heading text-xl text-ink mb-1">詳細資訊</h2>
    <p class="text-inkMuted text-sm font-body mb-6">選擇在詳細頁要顯示的區塊，關閉後資料仍保留。</p>
    <PostVisibilityToggles v-model="visibilityModel" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PostForm } from '../composables/usePostEditForm'
import PostVisibilityToggles from './PostVisibilityToggles.vue'

const model = defineModel<PostForm>({ required: true })

const visibilityModel = computed({
  get: () => ({ showGpx: model.value.showGpx, showGears: model.value.showGears, showFoods: model.value.showFoods }),
  set: (v) => { model.value.showGpx = v.showGpx; model.value.showGears = v.showGears; model.value.showFoods = v.showFoods },
})
</script>
