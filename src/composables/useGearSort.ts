import { ref } from 'vue'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-vue-next'
import type { Gear } from '../types'

export type SortField = 'name' | 'category' | 'weight' | 'brand' | 'price' | 'addedAt'
export type GroupKey  = 'owned' | 'wishlist' | 'abandon' | 'other'

const sortField = ref<SortField>('name')
const sortAsc   = ref(true)

const groupSort = ref<Record<GroupKey, { field: SortField; asc: boolean }>>({
  owned:    { field: 'name', asc: true },
  wishlist: { field: 'name', asc: true },
  abandon:  { field: 'name', asc: true },
  other:    { field: 'name', asc: true },
})

export function applySort(list: Gear[], field: SortField, asc: boolean): Gear[] {
  return [...list].sort((a, b) => {
    let va: string | number
    let vb: string | number
    switch (field) {
      case 'name':     va = a.name.toLowerCase();                    vb = b.name.toLowerCase();                    break
      case 'category': va = a.category.toLowerCase();                vb = b.category.toLowerCase();                break
      case 'weight':   va = (a.weight ?? 0) * (a.quantity ?? 1);    vb = (b.weight ?? 0) * (b.quantity ?? 1);    break
      case 'brand':    va = (a.brand ?? '').toLowerCase();           vb = (b.brand ?? '').toLowerCase();           break
      case 'price':    va = a.price ?? -1;                           vb = b.price ?? -1;                           break
      case 'addedAt':  va = a.addedAt ?? '';                         vb = b.addedAt ?? '';                         break
    }
    if (va! < vb!) return asc ? -1 : 1
    if (va! > vb!) return asc ? 1 : -1
    return 0
  })
}

export function useGearSort() {
  function setSort(field: SortField) {
    if (sortField.value === field) sortAsc.value = !sortAsc.value
    else { sortField.value = field; sortAsc.value = true }
  }

  function setGroupSort(group: GroupKey, field: SortField) {
    const s = groupSort.value[group]
    if (s.field === field) s.asc = !s.asc
    else { s.field = field; s.asc = true }
  }

  function sortIcon(field: SortField) {
    if (sortField.value !== field) return ChevronsUpDown
    return sortAsc.value ? ChevronUp : ChevronDown
  }

  function groupSortIcon(group: GroupKey, field: SortField) {
    const s = groupSort.value[group]
    if (s.field !== field) return ChevronsUpDown
    return s.asc ? ChevronUp : ChevronDown
  }

  return { sortField, sortAsc, groupSort, setSort, setGroupSort, sortIcon, groupSortIcon, applySort }
}
