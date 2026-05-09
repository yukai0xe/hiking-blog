<template>
  <div class="flex flex-col">
    <p class="label-title mb-2">
      現有裝備
      <span v-if="gears.length + newGears.length > 0" class="font-mono normal-case opacity-50 ml-1">— 點選帶入</span>
    </p>

    <div v-if="gears.length > 0 || newGears.length > 0" class="overflow-auto max-h-[420px]">
      <table class="w-full">
        <thead>
          <tr class="border-b border-border/60">
            <th class="th">名稱</th>
            <th class="th">類別</th>
            <th class="th text-right">總重 / 數量</th>
            <th class="th">品牌</th>
            <th class="th text-right">價格</th>
            <th class="th">加入時間</th>
            <th class="th">備註</th>
            <th class="w-6" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="gear in gears" :key="gear.id"
            class="group/row data-row border-b border-border/30 cursor-pointer"
            :class="{ 'is-active': activeGearId === gear.id }"
            @click="emit('selectExisting', { name: gear.name, weight: gear.weight, note: gear.note, category: gear.category, quantity: gear.quantity ?? 1, brand: gear.brand ?? '', referenceUrl: gear.referenceUrl ?? '', price: gear.price ?? null, addedAt: gear.addedAt ?? '' }, gear.id)"
          >
            <td class="td font-medium text-ink">
              <span class="flex items-center gap-1">
                {{ gear.name }}
                <a v-if="gear.referenceUrl" :href="gear.referenceUrl" target="_blank" rel="noopener noreferrer"
                  class="text-inkMuted hover:text-primary transition-colors shrink-0" @click.stop>
                  <ExternalLinkIcon :size="11" />
                </a>
              </span>
            </td>
            <td class="td"><span class="cat-badge">{{ gear.category || '其他' }}</span></td>
            <td class="td font-mono text-inkMuted text-right">
              {{ (gear.weight ?? 0) * (gear.quantity ?? 1) }} g
              <span class="text-[11px] opacity-60 ml-1">×{{ gear.quantity ?? 1 }}</span>
            </td>
            <td class="td text-inkMuted">{{ gear.brand || '—' }}</td>
            <td class="td font-mono text-inkMuted text-right">{{ gear.price != null ? gear.price.toLocaleString() : '—' }}</td>
            <td class="td text-inkMuted">{{ gear.addedAt || '—' }}</td>
            <td class="td note-cell text-inkMuted/70 italic">{{ gear.note || '—' }}</td>
            <td class="td text-center">
              <button
                class="opacity-0 group-hover/row:opacity-100 text-inkMuted hover:text-red-400 transition-all duration-150 cursor-pointer"
                @click.stop="emit('markDelete', gear.id)"
                aria-label="刪除裝備"
              ><XIcon :size="12" /></button>
            </td>
          </tr>

          <tr
            v-for="(gear, i) in newGears" :key="`ng-${i}`"
            class="group/row data-row new-row border-b border-border/30 cursor-pointer"
            :class="{ 'is-active': activeNewIndex === i }"
            @click="emit('selectNew', gear, i)"
          >
            <td class="td font-medium text-ink">
              <span class="flex items-center gap-1">
                {{ gear.name }}
                <a v-if="gear.referenceUrl" :href="gear.referenceUrl" target="_blank" rel="noopener noreferrer"
                  class="text-inkMuted hover:text-primary transition-colors shrink-0" @click.stop>
                  <ExternalLinkIcon :size="11" />
                </a>
                <span class="new-badge">NEW</span>
              </span>
            </td>
            <td class="td"><span class="cat-badge">{{ gear.category }}</span></td>
            <td class="td font-mono text-inkMuted text-right">
              {{ gear.weight * gear.quantity }} g
              <span class="text-[11px] opacity-60 ml-1">×{{ gear.quantity }}</span>
            </td>
            <td class="td text-inkMuted">{{ gear.brand || '—' }}</td>
            <td class="td font-mono text-inkMuted text-right">{{ gear.price != null ? gear.price.toLocaleString() : '—' }}</td>
            <td class="td text-inkMuted">{{ gear.addedAt || '—' }}</td>
            <td class="td note-cell text-inkMuted/70 italic">{{ gear.note || '—' }}</td>
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

    <p v-else class="text-center text-inkMuted text-xs font-body italic py-6">— 尚無裝備 —</p>

    <!-- Pending deletes undo -->
    <div v-if="deletedGears.length > 0" class="mt-3 pt-3 border-t border-border/40">
      <p class="text-[10px] text-inkMuted font-body mb-1.5 flex items-center gap-1">
        <AlertCircleIcon :size="11" /> 即將刪除（點擊復原）
      </p>
      <div class="flex flex-wrap gap-1.5">
        <div
          v-for="gear in deletedGears" :key="gear.id"
          class="flex items-center gap-1 px-2 py-1 rounded cursor-pointer opacity-40 hover:opacity-70 transition-opacity border border-border/50 font-body text-[11px] text-inkMuted"
          @click="emit('undoDelete', gear.id)"
        >
          <RotateCcwIcon :size="10" /> {{ gear.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X as XIcon, RotateCcw as RotateCcwIcon, AlertCircle as AlertCircleIcon, ExternalLink as ExternalLinkIcon } from 'lucide-vue-next'
import type { Gear } from '../types'

type GearDraft = {
  name: string; weight: number; note: string; category: string; quantity: number
  brand: string; referenceUrl: string; price: number | null; addedAt: string
}

defineProps<{
  gears: Gear[]
  newGears: GearDraft[]
  deletedGears: Gear[]
  activeGearId: string | null
  activeNewIndex: number | null
}>()

const emit = defineEmits<{
  selectExisting: [gear: GearDraft, id: string]
  selectNew: [gear: GearDraft, index: number]
  markDelete: [id: string]
  removeNew: [index: number]
  undoDelete: [id: string]
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

.cat-badge {
  display: inline-block;
  font-size: 11px;
  font-family: Inter, sans-serif;
  color: var(--c-primary);
  background: color-mix(in srgb, var(--c-primary) 10%, transparent);
  padding: 1px 5px;
  border-radius: 4px;
  white-space: nowrap;
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

.data-row:hover td {
  background: color-mix(in srgb, var(--c-primary) 8%, transparent);
}

.new-row td {
  background: color-mix(in srgb, var(--c-primary) 4%, transparent);
}
.new-row:hover td {
  background: color-mix(in srgb, var(--c-primary) 12%, transparent);
}

.is-active td {
  background: color-mix(in srgb, var(--c-primary) 16%, transparent) !important;
}
.is-active td:first-child {
  border-left: 2px solid var(--c-primary);
  padding-left: 6px;
}
</style>
