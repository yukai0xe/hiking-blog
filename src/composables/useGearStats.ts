import { computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { Gear, GearStatus } from '../types'

export function gearStatus(g: Gear): GearStatus {
  if (g.status) return g.status
  return g.isWishlist ? 'wishlist' : 'owned'
}

export function useGearStats(gearLibrary: Ref<Gear[]>, filteredOwned?: ComputedRef<Gear[]>) {
  function gramsOf(list: Gear[]) {
    return list.reduce((s, g) => s + (g.weight ?? 0) * (g.quantity ?? 1), 0)
  }

  const ownedInLibrary  = computed(() => gearLibrary.value.filter(g => gearStatus(g) === 'owned'))
  const wishlistCount   = computed(() => gearLibrary.value.filter(g => gearStatus(g) === 'wishlist').length)
  const abandonCount    = computed(() => gearLibrary.value.filter(g => gearStatus(g) === 'abandon').length)
  const otherCount      = computed(() => gearLibrary.value.filter(g => gearStatus(g) === 'other').length)

  const totalWeightKg    = computed(() => (gramsOf(ownedInLibrary.value) / 1000).toFixed(2))
  const filteredWeightKg = computed(() =>
    filteredOwned
      ? (gramsOf(filteredOwned.value) / 1000).toFixed(2)
      : totalWeightKg.value
  )
  const categoryCount    = computed(() => new Set(gearLibrary.value.map(g => g.category)).size)
  const hasMultipleGroups = computed(() => gearLibrary.value.some(g => gearStatus(g) !== 'other'))

  return {
    gearStatus, ownedInLibrary, wishlistCount, abandonCount, otherCount,
    totalWeightKg, filteredWeightKg, categoryCount, hasMultipleGroups, gramsOf,
  }
}
