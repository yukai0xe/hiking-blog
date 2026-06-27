import { ref, onBeforeUnmount } from 'vue'
import type { GearImage } from '../types'

export function useGearImages() {
  const editingImages    = ref<GearImage[]>([])
  const deletingImageIds = ref<string[]>([])
  const newImageFiles    = ref<File[]>([])
  const newImagePreviews = ref<string[]>([])
  const newImageProgress = ref<number[]>([])
  const loadingImages    = ref(false)
  const imageInputRef    = ref<HTMLInputElement | null>(null)

  function triggerImageInput() { imageInputRef.value?.click() }

  function onImagesSelected(e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files ?? [])
    for (const file of files) {
      newImageFiles.value.push(file)
      newImagePreviews.value.push(URL.createObjectURL(file))
      newImageProgress.value.push(0)
    }
    if (imageInputRef.value) imageInputRef.value.value = ''
  }

  function removeExistingImage(imgId: string) {
    deletingImageIds.value.push(imgId)
    editingImages.value = editingImages.value.filter(img => img.id !== imgId)
  }

  function removeNewImage(index: number) {
    URL.revokeObjectURL(newImagePreviews.value[index])
    newImageFiles.value.splice(index, 1)
    newImagePreviews.value.splice(index, 1)
    newImageProgress.value.splice(index, 1)
  }

  onBeforeUnmount(() => {
    newImagePreviews.value.forEach(u => URL.revokeObjectURL(u))
  })

  return {
    editingImages, deletingImageIds, newImageFiles, newImagePreviews,
    newImageProgress, loadingImages, imageInputRef,
    triggerImageInput, onImagesSelected, removeExistingImage, removeNewImage,
  }
}
