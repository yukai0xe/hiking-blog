<template>
  <div>
    <div v-if="loadingImages" class="text-xs font-body text-inkMuted flex items-center gap-1.5 mb-3">
      <span class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> 載入圖片中…
    </div>
    <div class="flex flex-wrap gap-2">
      <div v-for="img in editingImages" :key="img.id" class="gear-img-thumb">
        <img :src="img.url" class="w-full h-full object-cover" />
        <button type="button" class="gear-img-remove" @click="removeExistingImage(img.id)">
          <XIcon :size="10" />
        </button>
      </div>
      <div v-for="(preview, i) in newImagePreviews" :key="preview" class="gear-img-thumb">
        <img :src="preview" class="w-full h-full object-cover" :class="saving ? 'opacity-50' : 'opacity-75'" />
        <button type="button" class="gear-img-remove" :disabled="saving" @click="removeNewImage(i)">
          <XIcon :size="10" />
        </button>
        <div v-if="saving" class="absolute inset-0 flex flex-col items-center justify-center gap-1"
          style="background: rgba(0,0,0,0.45);">
          <template v-if="newImageProgress[i] >= 100">
            <CheckIcon :size="16" class="text-green-400" />
          </template>
          <template v-else>
            <span class="text-white text-[10px] font-mono font-bold leading-none">{{ newImageProgress[i] }}%</span>
            <div class="w-10 h-0.5 rounded-full overflow-hidden" style="background: rgba(255,255,255,0.25);">
              <div class="h-full rounded-full transition-all duration-100" style="background: white;"
                :style="{ width: `${newImageProgress[i]}%` }" />
            </div>
          </template>
        </div>
      </div>
      <button
        type="button"
        class="w-16 h-16 rounded-lg flex flex-col items-center justify-center gap-1 text-inkMuted hover:text-primary hover:border-primary transition-colors cursor-pointer"
        style="border: 1px dashed var(--c-border);"
        @click="triggerImageInput"
      >
        <ImageIcon :size="18" class="opacity-50" />
        <span class="text-[10px] font-body">上傳</span>
      </button>
    </div>
    <input ref="imageInputRef" type="file" accept="image/*" multiple class="hidden" @change="onImagesSelected" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { X as XIcon, Check as CheckIcon, Image as ImageIcon } from 'lucide-vue-next'
import { usePostStore } from '../stores/postStore'
import { useGearImages } from '../composables/useGearImages'
import type { Ref } from 'vue'

const props = defineProps<{
  gearId: string | null
  saving: boolean
}>()

const store = usePostStore()
const {
  editingImages, deletingImageIds, newImageFiles, newImagePreviews,
  newImageProgress, loadingImages, imageInputRef,
  triggerImageInput, onImagesSelected, removeExistingImage, removeNewImage,
} = useGearImages()

onMounted(async () => {
  if (!props.gearId) return
  loadingImages.value = true
  try { editingImages.value = await store.fetchGearImages(props.gearId) }
  catch { /* ignore */ }
  finally { loadingImages.value = false }
})

defineExpose({
  getDeletedIds: (): string[] => deletingImageIds.value,
  getNewFiles:   (): File[]   => newImageFiles.value,
  getProgress:   (): Ref<number[]> => newImageProgress,
  imageInputRef,
})
</script>

<style scoped>
.gear-img-thumb {
  position: relative; width: 64px; height: 64px;
  border-radius: 8px; overflow: hidden; flex-shrink: 0;
  border: 1px solid var(--c-border);
}
.gear-img-remove {
  position: absolute; top: 3px; right: 3px;
  width: 18px; height: 18px; border-radius: 50%;
  background: rgba(0,0,0,0.60); color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.12s;
}
.gear-img-remove:hover { background: rgba(0,0,0,0.85); }
</style>
