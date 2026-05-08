<template>
  <div>
    <div v-if="gears.length === 0" class="text-center text-inkMuted py-16 font-body italic">
      — 尚無裝備資料 —
    </div>
    <div v-else class="card-aged overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border text-left">
            <th class="py-3 px-4 font-semibold text-inkMuted tracking-widest text-xs uppercase">名稱</th>
            <th class="py-3 px-4 font-semibold text-inkMuted tracking-widest text-xs uppercase">類別</th>
            <th class="py-3 px-4 font-semibold text-inkMuted tracking-widest text-xs uppercase text-right">數量</th>
            <th class="py-3 px-4 font-semibold text-inkMuted tracking-widest text-xs uppercase text-right">重量 (g)</th>
            <th class="py-3 px-4 font-semibold text-inkMuted tracking-widest text-xs uppercase">備注</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="gear in gears"
            :key="gear.id"
            class="border-b border-border/50 hover:bg-surface/60 transition-colors duration-150"
          >
            <td class="py-3 px-4 font-medium text-ink font-body">{{ gear.name }}</td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 rounded text-[11px] font-body"
                style="background: color-mix(in srgb, var(--c-primary) 12%, transparent); color: var(--c-primary);">
                {{ gear.category || '其他' }}
              </span>
            </td>
            <td class="py-3 px-4 text-inkMuted font-mono text-right">{{ gear.quantity ?? 1 }}</td>
            <td class="py-3 px-4 text-inkMuted font-mono text-right">{{ gear.weight }}</td>
            <td class="py-3 px-4 text-inkMuted/70 italic font-body">{{ gear.note || '—' }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="bg-primary/10">
            <td class="py-3 px-4 font-semibold text-primary font-body tracking-wide" colspan="3">Total</td>
            <td class="py-3 px-4 font-semibold text-primary font-mono text-right">{{ totalWeight }} g</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Gear } from '../types'

const props = defineProps<{ gears: Gear[] }>()

const totalWeight = computed(() =>
  props.gears.reduce((sum, g) => sum + (g.weight ?? 0) * (g.quantity ?? 1), 0)
)
</script>
