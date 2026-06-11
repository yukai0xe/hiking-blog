<template>
  <div>
    <div v-if="foods.length === 0" class="text-center text-inkMuted py-10 font-body italic">
      — 尚無糧食資料 —
    </div>
    <div v-else class="card-aged overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border text-left">
            <th class="th">名稱</th>
            <th class="th text-right">重量 (g)</th>
            <th class="th text-right">數量</th>
            <th class="th text-right">總重 (g)</th>
            <th class="th text-right">價格</th>
            <th class="th">備註</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="food in foods" :key="food.id"
            class="border-b border-border/50 hover:bg-surface/60 transition-colors duration-150"
          >
            <td class="td font-medium text-ink font-body">
              <span class="flex items-center gap-1.5">
                {{ food.name }}
                <a
                  v-if="food.referenceUrl"
                  :href="food.referenceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-inkMuted hover:text-primary transition-colors duration-150 shrink-0"
                  @click.stop
                  aria-label="參考連結"
                ><ExternalLinkIcon :size="11" /></a>
              </span>
            </td>
            <td class="td text-inkMuted font-mono text-right">{{ food.weight }}</td>
            <td class="td text-inkMuted font-mono text-right">{{ food.quantity }}</td>
            <td class="td text-inkMuted font-mono text-right">{{ food.weight * food.quantity }}</td>
            <td class="td text-inkMuted font-mono text-right">{{ food.price != null ? food.price.toLocaleString() : '—' }}</td>
            <td class="td text-inkMuted/70 italic font-body">{{ food.note || '—' }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="background: color-mix(in srgb, var(--c-primary) 10%, transparent);">
            <td class="py-3 px-4 font-semibold text-primary font-body tracking-wide" colspan="3">Total</td>
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
import type { Food } from '../types'

const props = defineProps<{ foods: Food[] }>()

const totalWeight = computed(() =>
  props.foods.reduce((sum, f) => sum + f.weight * f.quantity, 0)
)
</script>

<style scoped>
.th {
  padding: 10px 16px 8px;
  font-size: 11px;
  font-family: Inter, sans-serif;
  font-weight: 600;
  color: var(--c-inkMuted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}
.td {
  padding: 10px 16px;
  font-size: 13px;
  font-family: Inter, sans-serif;
  color: var(--c-inkMuted);
}
</style>
