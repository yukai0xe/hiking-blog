import { ref } from 'vue'
import type { ComputedRef } from 'vue'
import type { Waypoint } from '../types'

export function useWaypointBatch(
  sortedWaypoints: ComputedRef<Waypoint[]>,
  toggleWptHidden: (wpt: Waypoint) => Promise<void>,
) {
  const showBatchHideModal = ref(false)
  const batchHideSelected  = ref<Set<string>>(new Set())
  const batchHideSaving    = ref(false)

  function openBatchHide() {
    batchHideSelected.value  = new Set()
    showBatchHideModal.value = true
  }

  function toggleBatchItem(key: string) {
    const s = new Set(batchHideSelected.value)
    if (s.has(key)) s.delete(key)
    else s.add(key)
    batchHideSelected.value = s
  }

  function toggleBatchSelectAll() {
    const all = sortedWaypoints.value
    if (batchHideSelected.value.size === all.length) {
      batchHideSelected.value = new Set()
    } else {
      batchHideSelected.value = new Set(all.map(w => `${w.lat},${w.lng}`))
    }
  }

  async function confirmBatchHide() {
    if (batchHideSaving.value || batchHideSelected.value.size === 0) return
    batchHideSaving.value = true
    const targets = sortedWaypoints.value.filter(w => batchHideSelected.value.has(`${w.lat},${w.lng}`))
    for (const wpt of targets) {
      await toggleWptHidden(wpt)
    }
    batchHideSaving.value    = false
    showBatchHideModal.value = false
  }

  return {
    showBatchHideModal, batchHideSelected, batchHideSaving,
    openBatchHide, toggleBatchItem, toggleBatchSelectAll, confirmBatchHide,
  }
}
