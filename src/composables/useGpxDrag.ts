import { ref } from 'vue'
import type { ComputedRef } from 'vue'
import { useGpxLibraryStore } from '../stores/gpxLibraryStore'
import type { GpxLibraryEntry } from '../types'

export function useGpxDrag(
  filtered: ComputedRef<GpxLibraryEntry[]>,
  onError: (msg: string) => void,
) {
  const store = useGpxLibraryStore()

  const draggingId = ref<string | null>(null)
  const dragOverId = ref<string | null>(null)

  function onDragStart(entry: GpxLibraryEntry) {
    draggingId.value = entry.id
  }

  function onDragOver(entry: GpxLibraryEntry) {
    if (draggingId.value && draggingId.value !== entry.id) {
      dragOverId.value = entry.id
    }
  }

  function onDragEnd() {
    draggingId.value = null
    dragOverId.value = null
  }

  async function onDrop(target: GpxLibraryEntry) {
    const fromId = draggingId.value
    draggingId.value = null
    dragOverId.value = null
    if (!fromId || fromId === target.id) return

    const ids = filtered.value.map(e => e.id)
    const fromIdx = ids.indexOf(fromId)
    const toIdx   = ids.indexOf(target.id)
    if (fromIdx === -1 || toIdx === -1) return

    ids.splice(fromIdx, 1)
    ids.splice(toIdx, 0, fromId)

    try {
      await store.reorderRoutes(ids.map((id, order) => ({ id, order })))
    } catch (e) {
      onError((e as Error).message)
    }
  }

  return { draggingId, dragOverId, onDragStart, onDragOver, onDrop, onDragEnd }
}
