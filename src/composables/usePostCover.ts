import { ref, onBeforeUnmount } from 'vue'

export function usePostCover() {
  const newCoverFile = ref<File | null>(null)
  const coverPreview = ref<string | null>(null)
  const cropSrc      = ref('')
  const showCropper  = ref(false)
  const coverInput   = ref<HTMLInputElement | null>(null)

  function onCoverChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    ;(e.target as HTMLInputElement).value = ''
    if (cropSrc.value) URL.revokeObjectURL(cropSrc.value)
    cropSrc.value    = URL.createObjectURL(file)
    showCropper.value = true
  }

  function onCropConfirm(file: File) {
    if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
    newCoverFile.value = file
    coverPreview.value = URL.createObjectURL(file)
    showCropper.value  = false
  }

  onBeforeUnmount(() => {
    if (cropSrc.value)      URL.revokeObjectURL(cropSrc.value)
    if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
  })

  return { newCoverFile, coverPreview, cropSrc, showCropper, coverInput, onCoverChange, onCropConfirm }
}
