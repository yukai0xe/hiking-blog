<template>
  <div class="flex flex-col">
    <p class="label-title mb-2">
      糧食清單
      <span v-if="newFoods.length > 0" class="font-mono normal-case opacity-50 ml-1">— 點選帶入</span>
    </p>

    <div v-if="newFoods.length > 0" class="overflow-auto max-h-[420px]">
      <table class="w-full">
        <thead>
          <tr class="border-b border-border/60">
            <th class="th">名稱</th>
            <th class="th text-right">總重 / 數量</th>
            <th class="th text-right">價格</th>
            <th class="th">備註</th>
            <th class="w-6" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(food, i) in newFoods" :key="`nf-${i}`"
            class="group/row data-row new-row border-b border-border/30 cursor-pointer"
            :class="{ 'is-active': activeNewIndex === i }"
            @click="emit('selectNew', food, i)"
          >
            <td class="td font-medium text-ink">
              <span class="flex items-center gap-1">
                {{ food.name }}
                <a v-if="food.referenceUrl" :href="food.referenceUrl" target="_blank" rel="noopener noreferrer"
                  class="text-inkMuted hover:text-primary transition-colors shrink-0" @click.stop>
                  <ExternalLinkIcon :size="11" />
                </a>
                <span v-if="showBadge" class="new-badge">NEW</span>
              </span>
            </td>
            <td class="td font-mono text-inkMuted text-right">
              {{ food.weight * food.quantity }} g
              <span class="text-[11px] opacity-60 ml-1">×{{ food.quantity }}</span>
            </td>
            <td class="td font-mono text-inkMuted text-right">{{ food.price != null ? food.price.toLocaleString() : '—' }}</td>
            <td class="td note-cell text-inkMuted/70 italic">{{ food.note || '—' }}</td>
            <td class="td text-center">
              <button
                class="opacity-0 group-hover/row:opacity-100 text-inkMuted hover:text-red-400 transition-all duration-150 cursor-pointer"
                @click.stop="emit('removeNew', i)"
                aria-label="取消新增"
              ><XIcon :size="12" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else class="text-center text-inkMuted text-xs font-body italic py-6">— 尚無糧食 —</p>
  </div>
</template>

<script setup lang="ts">
import { X as XIcon, ExternalLink as ExternalLinkIcon } from 'lucide-vue-next'
import type { FoodDraft } from '../types'

withDefaults(defineProps<{
  newFoods: FoodDraft[]
  activeNewIndex: number | null
  showBadge?: boolean
}>(), { showBadge: true })

const emit = defineEmits<{
  selectNew: [food: FoodDraft, index: number]
  removeNew: [index: number]
}>()
</script>

<style scoped>
.label-title {
  display: block;
  font-size: 11px;
  font-family: Inter, sans-serif;
  font-weight: 600;
  color: var(--c-inkMuted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.th {
  padding: 6px 10px 8px;
  font-size: 11px;
  font-family: Inter, sans-serif;
  font-weight: 600;
  color: var(--c-inkMuted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}
.td {
  padding: 8px 10px;
  font-size: 13px;
  font-family: Inter, sans-serif;
  color: var(--c-inkMuted);
  white-space: nowrap;
}
.note-cell {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
}
.new-badge {
  font-size: 9px;
  font-family: 'Space Mono', monospace;
  background: var(--c-primary);
  color: var(--c-cta-text, #1a1410);
  padding: 1px 4px;
  border-radius: 3px;
  flex-shrink: 0;
}
.data-row:hover td { background: color-mix(in srgb, var(--c-primary) 8%, transparent); }
.new-row td { background: color-mix(in srgb, var(--c-primary) 4%, transparent); }
.new-row:hover td { background: color-mix(in srgb, var(--c-primary) 12%, transparent); }
.is-active td { background: color-mix(in srgb, var(--c-primary) 16%, transparent) !important; }
.is-active td:first-child { border-left: 2px solid var(--c-primary); padding-left: 6px; }
</style>
