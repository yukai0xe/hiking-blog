<template>
  <div
    class="card-aged overflow-hidden"
    :style="containerBorderStyle"
  >
    <!-- Section title bar -->
    <div class="section-title-bar" :class="titleBarClass">
      <span class="flex items-center gap-1.5">
        <BookmarkIcon v-if="titleVariant === 'wishlist'" :size="13" />
        <Trash2Icon   v-else-if="titleVariant === 'abandon'" :size="13" />
        {{ title }}
      </span>
      <span class="section-title-count">{{ items.length }} 件</span>
    </div>

    <!-- Empty within section -->
    <div v-if="items.length === 0" class="px-5 py-6 text-sm font-body italic text-inkMuted">
      無符合條件的裝備
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead style="background: color-mix(in srgb, var(--c-card) 60%, var(--c-border) 40%);">
          <tr class="border-b border-border/50">
            <th class="th cursor-pointer select-none" @click="emit('sort', group, 'name')">
              <span class="flex items-center gap-1">名稱 <component :is="groupSortIcon(group, 'name')" :size="11" class="opacity-40 shrink-0" /></span>
            </th>
            <th class="th cursor-pointer select-none" @click="emit('sort', group, 'category')">
              <span class="flex items-center gap-1">類別 <component :is="groupSortIcon(group, 'category')" :size="11" class="opacity-40 shrink-0" /></span>
            </th>
            <th class="th text-right cursor-pointer select-none" @click="emit('sort', group, 'weight')">
              <span class="flex items-center justify-end gap-1">總重 / 數量 <component :is="groupSortIcon(group, 'weight')" :size="11" class="opacity-40 shrink-0" /></span>
            </th>
            <th class="th cursor-pointer select-none" @click="emit('sort', group, 'brand')">
              <span class="flex items-center gap-1">品牌 <component :is="groupSortIcon(group, 'brand')" :size="11" class="opacity-40 shrink-0" /></span>
            </th>
            <th class="th text-right cursor-pointer select-none" @click="emit('sort', group, 'price')">
              <span class="flex items-center justify-end gap-1">價格 <component :is="groupSortIcon(group, 'price')" :size="11" class="opacity-40 shrink-0" /></span>
            </th>
            <th class="th cursor-pointer select-none" @click="emit('sort', group, 'addedAt')">
              <span class="flex items-center gap-1">加入時間 <component :is="groupSortIcon(group, 'addedAt')" :size="11" class="opacity-40 shrink-0" /></span>
            </th>
            <th class="th">備註</th>
            <th class="w-16" />
          </tr>
        </thead>
        <tbody>
          <template v-for="gear in items" :key="gear.id">
            <tr
              class="group border-b border-border/20 transition-colors duration-100 cursor-pointer select-none"
              :style="{ background: hoveredId === gear.id ? rowHoverBg : '' }"
              @mouseenter="hoveredId = gear.id"
              @mouseleave="hoveredId = null"
              @click="router.push('/gear-library/' + gear.id)"
            >
              <td class="td font-medium" :class="titleVariant === 'abandon' ? '' : 'text-ink'" :style="titleVariant === 'abandon' ? 'color: var(--c-inkMuted);' : ''">
                <span class="flex items-center gap-1.5">
                  <span v-if="titleVariant === 'abandon'" style="text-decoration: line-through; opacity: 0.7;">{{ gear.name }}</span>
                  <span v-else>{{ gear.name }}</span>
                  <a v-if="gear.referenceUrl" :href="gear.referenceUrl" target="_blank" rel="noopener noreferrer"
                    class="text-inkMuted hover:text-primary transition-colors shrink-0" @click.stop>
                    <ExternalLinkIcon :size="11" />
                  </a>
                </span>
              </td>
              <td class="td"><span class="cat-badge">{{ gear.category || '其他' }}</span></td>
              <td class="td font-mono text-right" :class="titleVariant === 'abandon' ? 'text-inkMuted' : ''">
                {{ (gear.weight ?? 0) * (gear.quantity ?? 1) }} g
                <span class="text-[11px] opacity-50 ml-1">×{{ gear.quantity ?? 1 }}</span>
              </td>
              <td class="td text-inkMuted">{{ gear.brand || '—' }}</td>
              <td class="td font-mono text-inkMuted text-right">{{ gear.price != null ? gear.price.toLocaleString() : '—' }}</td>
              <td class="td text-inkMuted">{{ gear.addedAt || '—' }}</td>
              <td class="td note-cell text-inkMuted/70 italic">{{ gear.note || '—' }}</td>
              <td class="td text-right" @click.stop>
                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    class="w-7 h-7 rounded flex items-center justify-center text-inkMuted hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                    @click="emit('delete', gear)" aria-label="刪除"
                  ><Trash2Icon :size="13" /></button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div v-if="items.length > 0" class="px-5 py-3 border-t border-border/30 flex items-center justify-between">
      <span class="text-xs font-body text-inkMuted">顯示 <span class="text-ink font-semibold">{{ items.length }}</span> / {{ totalCount }} 件</span>
      <span v-if="footerWeight" class="text-xs font-mono text-inkMuted">合計 {{ footerWeight }} kg</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Trash2 as Trash2Icon, ExternalLink as ExternalLinkIcon, Bookmark as BookmarkIcon } from 'lucide-vue-next'
import { useGearSort } from '../composables/useGearSort'
import type { SortField, GroupKey } from '../composables/useGearSort'
import type { Gear } from '../types'

const props = defineProps<{
  items: Gear[]
  group: GroupKey
  title: string
  titleVariant: 'default' | 'wishlist' | 'abandon'
  totalCount: number
  footerWeight?: string
}>()

const emit = defineEmits<{
  delete: [gear: Gear]
  sort:   [group: GroupKey, field: SortField]
}>()

const router   = useRouter()
const hoveredId = ref<string | null>(null)

const { groupSortIcon } = useGearSort()

const titleBarClass = computed(() => ({
  'section-title-bar--wishlist': props.titleVariant === 'wishlist',
  'section-title-bar--abandon':  props.titleVariant === 'abandon',
}))

const containerBorderStyle = computed(() => {
  if (props.titleVariant === 'wishlist') return 'border-color: color-mix(in srgb, var(--c-primary) 25%, var(--c-border));'
  if (props.titleVariant === 'abandon')  return 'border-color: color-mix(in srgb, #c47070 20%, var(--c-border));'
  return ''
})

const rowHoverBg = computed(() =>
  props.titleVariant === 'abandon'
    ? 'rgba(196,112,112,0.06)'
    : 'color-mix(in srgb, var(--c-primary) 5%, transparent)'
)
</script>

<style scoped>
.th {
  padding: 9px 14px 11px;
  font-size: 11px;
  font-family: Inter, sans-serif;
  font-weight: 600;
  color: var(--c-inkMuted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  text-align: left;
  user-select: none;
}
.th:hover { color: var(--c-ink); }

.td {
  padding: 10px 14px;
  font-size: 13px;
  font-family: Inter, sans-serif;
  color: var(--c-inkMuted);
  white-space: nowrap;
}

.note-cell {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
}

.cat-badge {
  display: inline-block;
  font-size: 11px;
  font-family: Inter, sans-serif;
  color: var(--c-primary);
  background: color-mix(in srgb, var(--c-primary) 10%, transparent);
  padding: 2px 7px;
  border-radius: 4px;
  white-space: nowrap;
}

.section-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px 7px;
  font-size: 11px;
  font-family: Inter, sans-serif;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--c-inkMuted);
  background: color-mix(in srgb, var(--c-card) 70%, var(--c-border) 30%);
  border-bottom: 1px solid var(--c-border);
}
.section-title-bar--wishlist {
  color: var(--c-primary);
  background: color-mix(in srgb, var(--c-primary) 6%, var(--c-card));
  border-bottom-color: color-mix(in srgb, var(--c-primary) 20%, transparent);
}
.section-title-bar--abandon {
  color: #c47070;
  background: color-mix(in srgb, #c47070 6%, var(--c-card));
  border-bottom-color: color-mix(in srgb, #c47070 20%, transparent);
}
.section-title-count {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.6;
  letter-spacing: 0.05em;
  text-transform: none;
}
</style>
