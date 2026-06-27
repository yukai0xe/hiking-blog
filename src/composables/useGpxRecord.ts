import { ref, computed, watch } from 'vue'
import type { PostGpxRecord } from '../types'
import { usePostStore } from '../stores/postStore'

export function useGpxRecord() {
  const store = usePostStore()

  const activeGpxRecordId    = ref<string | null>(null)
  const showEditRecordModal  = ref(false)
  const editRecordName       = ref('')
  const editRecordDescription = ref('')
  const editingMainRoute     = ref(false)
  const editRecordSaving     = ref(false)
  const editRecordError      = ref<string | null>(null)

  const activeGpxUrl = computed(() => {
    if (!activeGpxRecordId.value) return store.currentPost?.gpxFile ?? ''
    const rec = store.currentGpxRecords.find((r: PostGpxRecord) => r.id === activeGpxRecordId.value)
    return rec?.gpxFileUrl ?? ''
  })

  const activeOverrides = computed(() =>
    activeGpxRecordId.value
      ? store.currentRecordWaypointOverrides
      : store.currentWaypointOverrides
  )

  const activeRouteDescription = computed(() => {
    if (!activeGpxRecordId.value) return store.currentPost?.gpxDescription ?? ''
    const rec = store.currentGpxRecords.find((r: PostGpxRecord) => r.id === activeGpxRecordId.value)
    return rec?.description ?? ''
  })

  function waypointApiUrl(segment: string): string {
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
    const postId  = store.currentPost!.id
    if (activeGpxRecordId.value)
      return `${apiBase}/api/Gpx/${postId}/records/${activeGpxRecordId.value}/waypoint${segment}`
    return `${apiBase}/api/Gpx/${postId}/waypoint${segment}`
  }

  watch(activeGpxRecordId, async (id) => {
    if (id && store.currentPost)
      await store.fetchRecordWaypointOverrides(store.currentPost.id, id)
  })

  function openEditRecordModal() {
    if (activeGpxRecordId.value === null) {
      editRecordName.value        = ''
      editRecordDescription.value = store.currentPost?.gpxDescription ?? ''
      editingMainRoute.value      = true
    } else {
      const rec = store.currentGpxRecords.find((r: PostGpxRecord) => r.id === activeGpxRecordId.value)
      editRecordName.value        = rec?.name ?? ''
      editRecordDescription.value = rec?.description ?? ''
      editingMainRoute.value      = false
    }
    editRecordError.value     = null
    showEditRecordModal.value = true
  }

  async function saveRecordEdit() {
    if (editRecordSaving.value) return
    editRecordSaving.value = true
    editRecordError.value  = null
    const description = editRecordDescription.value.trim()
    try {
      if (editingMainRoute.value) {
        await store.updateMainRouteDescription(store.currentPost!.id, description)
      } else {
        const recordId = activeGpxRecordId.value!
        const name     = editRecordName.value.trim()
        if (!name) { editRecordError.value = '請輸入路線名稱'; editRecordSaving.value = false; return }
        await store.renameGpxRecord(store.currentPost!.id, recordId, name)
        await store.updateGpxRecordDescription(store.currentPost!.id, recordId, description)
      }
      showEditRecordModal.value = false
    } catch (e) {
      editRecordError.value = (e as Error).message
    } finally {
      editRecordSaving.value = false
    }
  }

  return {
    activeGpxRecordId,
    showEditRecordModal, editRecordName, editRecordDescription, editingMainRoute,
    editRecordSaving, editRecordError,
    activeGpxUrl, activeOverrides, activeRouteDescription,
    waypointApiUrl, openEditRecordModal, saveRecordEdit,
  }
}
