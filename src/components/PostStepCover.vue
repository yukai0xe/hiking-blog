<template>
  <div class="space-y-4">
    <h2 class="font-heading text-xl text-ink mb-4">封面圖片</h2>
    <div
      class="relative overflow-hidden cursor-pointer group/cover border-2 border-dashed rounded-xl transition-all duration-200"
      :class="coverPreview ? 'border-primary/50' : 'border-border/40 hover:border-primary/40'"
      @click="coverInput?.click()"
    >
      <img
        :src="coverPreview ?? currentCoverUrl ?? undefined"
        alt="封面"
        class="w-full h-auto block transition-all duration-300 group-hover/cover:brightness-75"
      />
      <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity duration-200">
        <div class="flex items-center gap-2 bg-base/80 text-ink px-4 py-2 rounded-lg text-sm font-body font-medium">
          <ImageIcon :size="15" /> 更換封面
        </div>
      </div>
      <div v-if="coverPreview" class="absolute top-2 right-2 bg-primary text-[var(--c-cta-text)] text-[10px] font-mono px-2 py-0.5 rounded">
        NEW
      </div>
    </div>
    <input ref="coverInput" type="file" accept="image/*" class="hidden" @change="onCoverChange" />

    <CropModal v-if="showCropper" :src="cropSrc" @confirm="onCropConfirm" @cancel="showCropper = false" />
  </div>
</template>

<script setup lang="ts">
import { Image as ImageIcon } from 'lucide-vue-next'
import { usePostCover } from '../composables/usePostCover'
import CropModal from './CropModal.vue'

defineProps<{ currentCoverUrl: string | null }>()

const {
  newCoverFile, coverPreview, cropSrc, showCropper,
  coverInput, onCoverChange, onCropConfirm,
} = usePostCover()

defineExpose({
  getCoverFile: () => newCoverFile.value,
  coverInput,
})
</script>
