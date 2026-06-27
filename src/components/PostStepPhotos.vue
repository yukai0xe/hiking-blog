<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between mb-2">
      <h2 class="font-heading text-xl text-ink">照片集</h2>
      <button
        class="flex items-center gap-1.5 btn-cta text-xs font-semibold font-body px-3 py-1.5 rounded-lg cursor-pointer"
        @click="photosInput?.click()"
      >
        <PlusIcon :size="13" /> 新增照片
      </button>
    </div>
    <input ref="photosInput" type="file" accept="image/*" multiple class="hidden" @change="handlePhotosInput" />

    <div v-if="visiblePhotos.length > 0 || newPhotoPreviews.length > 0" class="grid grid-cols-3 gap-2">
      <div v-for="photo in visiblePhotos" :key="photo.id"
        class="relative aspect-square overflow-hidden rounded-lg group/photo">
        <img :src="photo.url" class="w-full h-full object-cover opacity-90" alt="" />
        <button
          class="absolute top-1 right-1 w-6 h-6 rounded-full bg-base/80 text-inkMuted hover:text-red-400 hover:bg-base flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all duration-150 cursor-pointer"
          @click="$emit('markDelete', photo.id)"
        ><XIcon :size="12" /></button>
      </div>
      <div v-for="(src, i) in newPhotoPreviews" :key="`new-${i}`"
        class="relative aspect-square overflow-hidden rounded-lg group/photo">
        <img :src="src" class="w-full h-full object-cover opacity-90" alt="" />
        <div class="absolute top-1 left-1 bg-primary text-[var(--c-cta-text)] text-[10px] font-mono px-1.5 py-0.5 rounded">NEW</div>
        <button
          class="absolute top-1 right-1 w-6 h-6 rounded-full bg-base/80 text-inkMuted hover:text-red-400 hover:bg-base flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all duration-150 cursor-pointer"
          @click="removeNewPhoto(i)"
        ><XIcon :size="12" /></button>
      </div>
    </div>
    <div v-else class="text-center text-inkMuted text-sm font-body italic py-8">
      — 尚無照片，點擊「新增照片」上傳 —
    </div>

    <div v-if="pendingDeletes.length > 0" class="mt-2 pt-4 border-t border-border/40">
      <p class="text-xs text-inkMuted font-body mb-2 flex items-center gap-1">
        <AlertCircleIcon :size="12" /> 以下照片將於儲存時刪除（點擊可復原）
      </p>
      <div class="flex gap-2 flex-wrap">
        <div v-for="photo in deletedPhotos" :key="photo.id"
          class="relative w-16 h-16 overflow-hidden rounded-lg cursor-pointer opacity-40 hover:opacity-70 transition-opacity"
          @click="$emit('undoDelete', photo.id)">
          <img :src="photo.url" class="w-full h-full object-cover" alt="" />
          <div class="absolute inset-0 flex items-center justify-center bg-base/60">
            <RotateCcwIcon :size="14" class="text-ink" />
          </div>
        </div>
      </div>
    </div>

    <CropModal v-if="showCropper" :src="cropSrc" @confirm="onPhotoCropConfirm" @cancel="showCropper = false" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Plus as PlusIcon, X as XIcon, AlertCircle as AlertCircleIcon, RotateCcw as RotateCcwIcon } from 'lucide-vue-next'
import type { Photo } from '../types'
import { usePostCover } from '../composables/usePostCover'
import { usePostPhotos } from '../composables/usePostPhotos'
import CropModal from './CropModal.vue'

const props = defineProps<{
  existingPhotos: Photo[]
  pendingDeletes:  string[]
}>()

const emit = defineEmits<{
  markDelete: [photoId: string]
  undoDelete: [photoId: string]
}>()

const { cropSrc, showCropper } = usePostCover()
const { newPhotoFiles, newPhotoPreviews, photosInput, removeNewPhoto } = usePostPhotos()

const visiblePhotos = computed(() =>
  props.existingPhotos.filter(p => !props.pendingDeletes.includes(p.id))
)
const deletedPhotos = computed(() =>
  props.existingPhotos.filter(p => props.pendingDeletes.includes(p.id))
)

function handlePhotosInput(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  ;(e.target as HTMLInputElement).value = ''
  if (files.length === 0) return
  if (files.length === 1) {
    if (cropSrc.value) URL.revokeObjectURL(cropSrc.value)
    cropSrc.value     = URL.createObjectURL(files[0])
    showCropper.value = true
  } else {
    newPhotoFiles.value.push(...files)
    newPhotoPreviews.value.push(...files.map(f => URL.createObjectURL(f)))
  }
}

function onPhotoCropConfirm(file: File) {
  newPhotoFiles.value.push(file)
  newPhotoPreviews.value.push(URL.createObjectURL(file))
  showCropper.value = false
}

defineExpose({
  getNewFiles: () => newPhotoFiles.value,
  photosInput,
})
</script>
