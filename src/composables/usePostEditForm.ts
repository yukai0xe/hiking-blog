import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { Photo } from '../types'

export type PostForm = {
  title:           string
  description:     string
  dateStart:       string
  dateEnd:         string
  weather:         string
  peopleCount:     number | null
  difficultyStars: number | null
  tags:            string[]
  showGpx:         boolean
  showGears:       boolean
  showFoods:       boolean
}

export function usePostEditForm(currentPhotos: Ref<Photo[]>) {
  const form = ref<PostForm>({
    title:           '',
    description:     '',
    dateStart:       '',
    dateEnd:         '',
    weather:         '',
    peopleCount:     null,
    difficultyStars: null,
    tags:            [],
    showGpx:         true,
    showGears:       true,
    showFoods:       true,
  })

  const pendingDeletes = ref<string[]>([])

  const visiblePhotos = computed<Photo[]>(() =>
    currentPhotos.value.filter(p => !pendingDeletes.value.includes(p.id))
  )
  const deletedPhotos = computed<Photo[]>(() =>
    currentPhotos.value.filter(p => pendingDeletes.value.includes(p.id))
  )

  function toDateInput(val: string | null | undefined) {
    return val ? val.slice(0, 10) : ''
  }

  function markDelete(photoId: string) { pendingDeletes.value.push(photoId) }
  function undoDelete(photoId: string) {
    pendingDeletes.value = pendingDeletes.value.filter(x => x !== photoId)
  }

  return {
    form, pendingDeletes,
    visiblePhotos, deletedPhotos,
    toDateInput, markDelete, undoDelete,
  }
}
