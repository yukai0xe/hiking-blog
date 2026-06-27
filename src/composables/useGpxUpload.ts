import { ref } from 'vue'
import type { Ref } from 'vue'
import type { GpxLibraryEntry } from '../types'
import { usePostStore } from '../stores/postStore'
import { useGpxLibraryStore } from '../stores/gpxLibraryStore'
import { useAuthStore } from '../stores/authStore'

export function useGpxUpload(activeGpxRecordId: Ref<string | null>) {
  const store       = usePostStore()
  const gpxLibStore = useGpxLibraryStore()
  const auth        = useAuthStore()

  const showGpxUploadModal = ref(false)
  const gpxUploadTab       = ref<'upload' | 'import'>('upload')
  const gpxUploading       = ref(false)
  const gpxUploadError     = ref<string | null>(null)
  const gpxUploadFile      = ref<File | null>(null)
  const syncToLibrary      = ref(false)
  const gpxImporting       = ref(false)
  const gpxImportError     = ref<string | null>(null)

  const gpxModalIsNewRecord     = ref(false)
  const gpxModalRerouteRecordId = ref<string | null>(null)
  const gpxRecordName           = ref('')

  function openGpxModal() {
    gpxModalIsNewRecord.value     = false
    gpxModalRerouteRecordId.value = null
    gpxRecordName.value           = ''
    gpxUploadTab.value            = 'upload'
    gpxUploadFile.value           = null
    gpxUploadError.value          = null
    gpxImportError.value          = null
    syncToLibrary.value           = false
    showGpxUploadModal.value      = true
  }

  function openNewRecordModal() {
    gpxModalIsNewRecord.value     = true
    gpxModalRerouteRecordId.value = null
    gpxRecordName.value           = ''
    gpxUploadTab.value            = 'upload'
    gpxUploadFile.value           = null
    gpxUploadError.value          = null
    syncToLibrary.value           = false
    showGpxUploadModal.value      = true
  }

  function openRerouteModal() {
    gpxModalIsNewRecord.value     = false
    gpxModalRerouteRecordId.value = activeGpxRecordId.value
    gpxRecordName.value           = ''
    gpxUploadTab.value            = 'upload'
    gpxUploadFile.value           = null
    gpxUploadError.value          = null
    syncToLibrary.value           = false
    showGpxUploadModal.value      = true
  }

  async function uploadGpx() {
    if (!gpxUploadFile.value || gpxUploading.value) return
    gpxUploading.value   = true
    gpxUploadError.value = null
    try {
      const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
      const fd = new FormData()
      fd.append('gpxFile', gpxUploadFile.value)
      const headers: Record<string, string> = {}
      if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`
      const res = await fetch(`${apiBase}/api/Gpx/${store.currentPost!.id}`, { method: 'POST', body: fd, headers })
      if (!res.ok) throw new Error(`伺服器錯誤 (${res.status})`)
      if (syncToLibrary.value) {
        await gpxLibStore.createGpxRoute({
          name: store.currentPost!.title,
          gpxFile: gpxUploadFile.value,
          difficultyStars: store.currentPost!.difficultyStars ?? null,
          tags: store.currentPost!.tags ?? [],
        })
      }
      await store.fetchPostDetail(store.currentPost!.id)
      showGpxUploadModal.value = false
      gpxUploadFile.value      = null
      syncToLibrary.value      = false
    } catch (e) {
      gpxUploadError.value = (e as Error).message
    } finally {
      gpxUploading.value = false
    }
  }

  async function addGpxRecord() {
    if (!gpxUploadFile.value || gpxUploading.value) return
    gpxUploading.value   = true
    gpxUploadError.value = null
    const file = gpxUploadFile.value
    const name = gpxRecordName.value.trim() || '新路線'
    try {
      const newId = await store.createGpxRecord(store.currentPost!.id, name, file)
      if (syncToLibrary.value) {
        await gpxLibStore.createGpxRoute({
          name,
          gpxFile: file,
          difficultyStars: store.currentPost!.difficultyStars ?? null,
          tags: store.currentPost!.tags ?? [],
        })
      }
      activeGpxRecordId.value  = newId
      showGpxUploadModal.value = false
      gpxUploadFile.value      = null
      gpxRecordName.value      = ''
      syncToLibrary.value      = false
    } catch (e) {
      gpxUploadError.value = (e as Error).message
    } finally {
      gpxUploading.value = false
    }
  }

  async function rerouteRecord() {
    if (!gpxUploadFile.value || gpxUploading.value || !gpxModalRerouteRecordId.value) return
    gpxUploading.value   = true
    gpxUploadError.value = null
    const file     = gpxUploadFile.value
    const recordId = gpxModalRerouteRecordId.value
    try {
      await store.rerouteGpxRecord(store.currentPost!.id, recordId, file)
      if (syncToLibrary.value) {
        const rec = store.currentGpxRecords.find(r => r.id === recordId)
        await gpxLibStore.createGpxRoute({
          name: rec?.name ?? '新路線',
          gpxFile: file,
          difficultyStars: store.currentPost!.difficultyStars ?? null,
          tags: store.currentPost!.tags ?? [],
        })
      }
      showGpxUploadModal.value = false
      gpxUploadFile.value      = null
      syncToLibrary.value      = false
    } catch (e) {
      gpxUploadError.value = (e as Error).message
    } finally {
      gpxUploading.value = false
    }
  }

  async function importRecordFromLibrary(entry: GpxLibraryEntry) {
    gpxImporting.value   = true
    gpxImportError.value = null
    try {
      if (gpxModalRerouteRecordId.value) {
        await store.linkGpxRecord(store.currentPost!.id, gpxModalRerouteRecordId.value, entry.gpxFileUrl)
      } else {
        const name  = gpxRecordName.value.trim() || entry.name
        const newId = await store.createGpxRecordFromUrl(store.currentPost!.id, name, entry.gpxFileUrl)
        activeGpxRecordId.value = newId
        gpxRecordName.value     = ''
      }
      showGpxUploadModal.value = false
      gpxUploadTab.value       = 'upload'
    } catch (e) {
      gpxImportError.value = (e as Error).message
    } finally {
      gpxImporting.value = false
    }
  }

  async function importGpxFromLibrary(entry: GpxLibraryEntry) {
    gpxImporting.value   = true
    gpxImportError.value = null
    try {
      const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
      const res = await fetch(`${apiBase}/api/Gpx/${store.currentPost!.id}/link`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url: entry.gpxFileUrl }),
      })
      if (!res.ok) throw new Error(`伺服器錯誤 (${res.status})`)
      await store.fetchPostDetail(store.currentPost!.id)
      showGpxUploadModal.value = false
      gpxUploadTab.value       = 'upload'
    } catch (e) {
      gpxImportError.value = (e as Error).message
    } finally {
      gpxImporting.value = false
    }
  }

  return {
    showGpxUploadModal, gpxUploadTab, gpxUploading, gpxUploadError, gpxUploadFile,
    syncToLibrary, gpxImporting, gpxImportError,
    gpxModalIsNewRecord, gpxModalRerouteRecordId, gpxRecordName,
    openGpxModal, openNewRecordModal, openRerouteModal,
    uploadGpx, addGpxRecord, rerouteRecord, importRecordFromLibrary, importGpxFromLibrary,
  }
}
