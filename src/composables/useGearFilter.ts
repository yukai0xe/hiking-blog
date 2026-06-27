import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { Gear } from '../types'

const filterCategory = ref('')
const filterBrand    = ref('')

export function useGearFilter(gearLibrary: Ref<Gear[]>, gearCategories: Ref<string[]>) {
  const filterCategories = computed(() => {
    const all = new Set([
      ...gearCategories.value,
      ...gearLibrary.value.map(g => g.category).filter(Boolean),
    ])
    return [...all].sort((a, b) => a.localeCompare(b, 'zh-TW'))
  })

  const filterBrands = computed(() => {
    const brands = gearLibrary.value.map(g => g.brand).filter((b): b is string => !!b)
    return [...new Set(brands)].sort((a, b) => a.localeCompare(b, 'zh-TW'))
  })

  const filteredBase = computed(() => {
    const cat   = filterCategory.value
    const brand = filterBrand.value
    return gearLibrary.value.filter(g => {
      if (cat && g.category !== cat) return false
      if (brand && g.brand !== brand) return false
      return true
    })
  })

  return { filterCategory, filterBrand, filterCategories, filterBrands, filteredBase }
}
