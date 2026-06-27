import { ref } from 'vue'
import type { Ref } from 'vue'
import type { Waypoint, WaypointOverride } from '../types'
import type GpxViewer from '../components/GpxViewer.vue'
import { parseDate } from '../utils/gpxHelpers'

export function useWaypointAdd(
  gpxViewerRef: Ref<InstanceType<typeof GpxViewer> | null>,
  gpxWaypoints: Ref<Waypoint[]>,
  activeOverrides: Ref<WaypointOverride[]>,
  waypointApiUrl: (segment: string) => string,
) {
  const addingWpt       = ref(false)
  const showAddWptModal = ref(false)
  const newWptDraft     = ref({ lat: '', lng: '', name: '', desc: '', wptDate: '' })
  const addWptSaving    = ref(false)
  const addWptError     = ref<string | null>(null)

  function toggleAddMode() {
    addingWpt.value = !addingWpt.value
    if (addingWpt.value) {
      const mapEl = document.querySelector('[data-gpx-map]') as HTMLElement | null
      mapEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  function onMapClick(pos: { lat: number; lng: number }) {
    newWptDraft.value     = { lat: pos.lat.toFixed(6), lng: pos.lng.toFixed(6), name: '', desc: '', wptDate: '' }
    addWptError.value     = null
    showAddWptModal.value = true
    addingWpt.value       = false
  }

  async function createWpt() {
    if (addWptSaving.value) return
    const lat = parseFloat(newWptDraft.value.lat)
    const lng = parseFloat(newWptDraft.value.lng)
    if (isNaN(lat) || isNaN(lng)) { addWptError.value = '請輸入有效的座標'; return }
    const name = newWptDraft.value.name
    const desc = newWptDraft.value.desc
    const { date: time, iso: timeIso } = parseDate(newWptDraft.value.wptDate)
    addWptSaving.value    = true
    addWptError.value     = null

    const newWpt: Waypoint = { name, desc, lat, lng, ele: null, time }
    const ovList = activeOverrides.value
    gpxWaypoints.value.push(newWpt)
    ovList.push({ lat, lng, name, description: desc, isCustom: true, hidden: false, time: timeIso })
    gpxViewerRef.value?.addWaypointMarker(lat, lng, name, desc)
    showAddWptModal.value = false

    try {
      const res = await fetch(waypointApiUrl(''), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ lat, lng, name, desc, time: timeIso }),
      })
      if (!res.ok) throw new Error(`伺服器錯誤 (${res.status})`)
    } catch (e) {
      gpxWaypoints.value = gpxWaypoints.value.filter(
        w => !(Math.abs(w.lat - lat) < 1e-5 && Math.abs(w.lng - lng) < 1e-5)
      )
      const idx = ovList.findIndex(o => Math.abs(o.lat - lat) < 1e-5 && Math.abs(o.lng - lng) < 1e-5)
      if (idx !== -1) ovList.splice(idx, 1)
      gpxViewerRef.value?.removeWaypointMarker(lat, lng)
      addWptError.value     = (e as Error).message
      showAddWptModal.value = true
    } finally {
      addWptSaving.value = false
    }
  }

  return {
    addingWpt, showAddWptModal, newWptDraft, addWptSaving, addWptError,
    toggleAddMode, onMapClick, createWpt,
  }
}
