<template>
  <div>
    <div v-if="gears.length === 0" class="text-center text-inkMuted py-16 font-body italic">
      — 尚無裝備資料 —
    </div>
    <div v-else class="card-aged overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border text-left">
            <th class="th">名稱</th>
            <th class="th">品牌</th>
            <th class="th">類別</th>
            <th class="th text-right">數量</th>
            <th class="th text-right">重量 (g)</th>
            <th class="th text-right">價格</th>
            <th class="th">備注</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="gear in gears"
            :key="gear.id"
            class="border-b border-border/50 hover:bg-surface/60 transition-colors duration-150"
          >
            <td class="td font-medium text-ink font-body">
              <span class="flex items-center gap-1.5">
                {{ gear.name }}
                <a
                  v-if="gear.referenceUrl"
                  :href="gear.referenceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-inkMuted hover:text-primary transition-colors duration-150 shrink-0"
                  @click.stop
                  aria-label="參考連結"
                ><ExternalLinkIcon :size="11" /></a>
              </span>
            </td>
            <td class="td text-inkMuted font-body">{{ gear.brand || '—' }}</td>
            <td class="td">
              <span class="px-2 py-0.5 rounded text-[11px] font-body"
                style="background: color-mix(in srgb, var(--c-primary) 12%, transparent); color: var(--c-primary);">
                {{ gear.category || '其他' }}
              </span>
            </td>
            <td class="td text-inkMuted font-mono text-right">{{ gear.quantity ?? 1 }}</td>
            <td class="td text-inkMuted font-mono text-right">{{ gear.weight }}</td>
            <td class="td text-inkMuted font-mono text-right">{{ gear.price != null ? gear.price.toLocaleString() : '—' }}</td>
            <td class="td text-inkMuted/70 italic font-body">{{ gear.note || '—' }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="background: color-mix(in srgb, var(--c-primary) 10%, transparent);">
            <td class="py-3 px-4 font-semibold text-primary font-body tracking-wide" colspan="4">Total</td>
            <td class="py-3 px-4 font-semibold text-primary font-mono text-right">{{ totalWeight }} g</td>
            <td colspan="2" />
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ExternalLink as ExternalLinkIcon } from 'lucide-vue-next'
import type { Gear } from '../types'

const props = defineProps<{ gears: Gear[] }>()

const totalWeight = computed(() =>
  props.gears.reduce((sum, g) => sum + (g.weight ?? 0) * (g.quantity ?? 1), 0)
)
</script>

<style scoped>
.th {
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 600;
  color: var(--c-inkMuted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
}
.td {
  padding: 10px 16px;
  white-space: nowrap;
}
</style>
