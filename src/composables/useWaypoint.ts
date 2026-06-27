import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'
import type { Waypoint, WaypointOverride } from '../types'
import type GpxViewer from '../components/GpxViewer.vue'
import { toDateInput, parseDate } from '../utils/gpxHelpers'
import { useAuthStore } from '../stores/authStore'

export function useWaypoint(
  gpxViewerRef: Ref<InstanceType<typeof GpxViewer> | null>,
  activeOverrides: Ref<WaypointOverride[]>,
  waypointApiUrl: (segment: string) => string,
) {
  const auth = useAuthStore()

  const gpxWaypoints = ref<Waypoint[]>([])
  const selectedWpt  = ref<Waypoint | null>(null)
  const hintWpt      = ref<Waypoint | null>(null)
  let   hintTimer:   ReturnType<typeof setTimeout> | null = null
  const editingWpt   = ref<Waypoint | null>(null)
  const wptDraft     = ref({ name: '', desc: '', wptDate: '' })
  const wptSaving    = ref(false)
  const wptError     = ref<string | null>(null)

  watch(gpxWaypoints, () => {
    selectedWpt.value = null
    hintWpt.value     = null
    if (hintTimer) { clearTimeout(hintTimer); hintTimer = null }
  })

  function isCustomWpt(wpt: Waypoint): boolean {
    return activeOverrides.value.some(
      o => Math.abs(o.lat - wpt.lat) < 1e-5 && Math.abs(o.lng - wpt.lng) < 1e-5 && o.isCustom
    )
  }

  function onWptClick(wpt: Waypoint) {
    selectedWpt.value = wpt
    gpxViewerRef.value?.selectWaypoint(wpt.lat, wpt.lng)
    if (hintTimer) clearTimeout(hintTimer)
    hintWpt.value = wpt
    hintTimer = setTimeout(() => { hintWpt.value = null; hintTimer = null }, 3000)
  }

  function onWptDblClick(wpt: Waypoint) {
    if (!auth.user) return
    openWptEdit(wpt)
  }

  function openWptEdit(wpt: Waypoint) {
    editingWpt.value = wpt
    wptDraft.value   = { name: wpt.name, desc: wpt.desc, wptDate: toDateInput(wpt.time) }
    wptError.value   = null
  }

  async function saveWptEdit() {
    if (!editingWpt.value || wptSaving.value) return
    const wpt  = editingWpt.value
    const name = wptDraft.value.name
    const desc = wptDraft.value.desc
    const { date: time, iso: timeIso } = parseDate(wptDraft.value.wptDate)
    wptSaving.value = true
    wptError.value  = null

    wpt.name = name
    wpt.desc = desc
    wpt.time = time
    gpxViewerRef.value?.updateWaypoint(wpt.lat, wpt.lng, name, desc, time)
    const ovList   = activeOverrides.value
    const existing = ovList.find(o => Math.abs(o.lat - wpt.lat) < 1e-5 && Math.abs(o.lng - wpt.lng) < 1e-5)
    if (existing) { existing.name = name; existing.description = desc; existing.time = timeIso }
    else ovList.push({ lat: wpt.lat, lng: wpt.lng, name, description: desc, isCustom: false, hidden: false, time: timeIso })
    editingWpt.value = null

    try {
      const res = await fetch(waypointApiUrl(''), {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ lat: wpt.lat, lng: wpt.lng, name, desc, time: timeIso }),
      })
      if (!res.ok) throw new Error(`伺服器錯誤 (${res.status})`)
    } catch (e) {
      wptError.value = (e as Error).message
    } finally {
      wptSaving.value = false
    }
  }

  async function toggleWptHidden(wpt: Waypoint) {
    const newHidden = !wpt.hidden
    const ovList    = activeOverrides.value

    wpt.hidden = newHidden
    const ov = ovList.find(o => Math.abs(o.lat - wpt.lat) < 1e-5 && Math.abs(o.lng - wpt.lng) < 1e-5)
    if (ov) ov.hidden = newHidden
    else ovList.push({ lat: wpt.lat, lng: wpt.lng, name: wpt.name, description: wpt.desc, isCustom: false, hidden: newHidden })
    if (newHidden) {
      gpxViewerRef.value?.removeWaypointMarker(wpt.lat, wpt.lng)
    } else {
      gpxViewerRef.value?.addWaypointMarker(wpt.lat, wpt.lng, wpt.name, wpt.desc, isCustomWpt(wpt))
    }

    try {
      const res = await fetch(waypointApiUrl(''), {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ lat: wpt.lat, lng: wpt.lng, name: wpt.name, desc: wpt.desc, hidden: newHidden }),
      })
      if (!res.ok) throw new Error(`伺服器錯誤 (${res.status})`)
    } catch (e) { console.error(e) }
  }

  async function deleteWpt(wpt: Waypoint) {
    const ovList = activeOverrides.value

    gpxWaypoints.value = gpxWaypoints.value.filter(
      w => !(Math.abs(w.lat - wpt.lat) < 1e-5 && Math.abs(w.lng - wpt.lng) < 1e-5)
    )
    const idx = ovList.findIndex(o => Math.abs(o.lat - wpt.lat) < 1e-5 && Math.abs(o.lng - wpt.lng) < 1e-5)
    if (idx !== -1) ovList.splice(idx, 1)
    gpxViewerRef.value?.removeWaypointMarker(wpt.lat, wpt.lng)

    try {
      const res = await fetch(waypointApiUrl(''), {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ lat: wpt.lat, lng: wpt.lng }),
      })
      if (!res.ok) throw new Error(`伺服器錯誤 (${res.status})`)
    } catch (e) { console.error(e) }
  }

  const sortedWaypoints = computed(() =>
    [...gpxWaypoints.value].sort((a, b) => {
      if (!a.time && !b.time) return 0
      if (!a.time) return 1
      if (!b.time) return -1
      return a.time.getTime() - b.time.getTime()
    })
  )

  const groupedWaypoints = computed(() => {
    const map = new Map<string, Waypoint[]>()
    for (const wpt of sortedWaypoints.value) {
      const key = wpt.time
        ? wpt.time.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
        : '未知日期'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(wpt)
    }
    return [...map.entries()]
  })

  function clearHintTimer() {
    if (hintTimer) { clearTimeout(hintTimer); hintTimer = null }
  }

  return {
    gpxWaypoints, selectedWpt, hintWpt, editingWpt, wptDraft, wptSaving, wptError,
    isCustomWpt, onWptClick, onWptDblClick, openWptEdit, saveWptEdit,
    toggleWptHidden, deleteWpt, sortedWaypoints, groupedWaypoints, clearHintTimer,
  }
}
