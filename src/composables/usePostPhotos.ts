import { ref, onBeforeUnmount } from 'vue'

export function usePostPhotos() {
  const newPhotoFiles    = ref<File[]>([])
  const newPhotoPreviews = ref<string[]>([])
  const photosInput      = ref<HTMLInputElement | null>(null)

  function onAddPhotos(e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files ?? [])
    newPhotoFiles.value.push(...files)
    newPhotoPreviews.value.push(...files.map(f => URL.createObjectURL(f)))
    ;(e.target as HTMLInputElement).value = ''
  }

  function removeNewPhoto(i: number) {
    URL.revokeObjectURL(newPhotoPreviews.value[i])
    newPhotoFiles.value.splice(i, 1)
    newPhotoPreviews.value.splice(i, 1)
  }

  onBeforeUnmount(() => {
    newPhotoPreviews.value.forEach(u => URL.revokeObjectURL(u))
  })

  return { newPhotoFiles, newPhotoPreviews, photosInput, onAddPhotos, removeNewPhoto }
}
