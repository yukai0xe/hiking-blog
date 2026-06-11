<template>
  <div class="space-y-6">

    <!-- Day planning blocks -->
    <div>
      <p class="label-title mb-3">行程規劃</p>
      <div class="flex gap-3 overflow-x-auto pb-3">
        <div
          v-for="(label, i) in dayLabels" :key="i"
          class="flex-none w-48 rounded-xl p-3 space-y-2 transition-all duration-150 border"
          :style="dragOverDay === i
            ? 'background: color-mix(in srgb, var(--c-primary) 14%, transparent); border-color: var(--c-primary);'
            : 'background: color-mix(in srgb, var(--c-surface) 50%, transparent); border-color: var(--c-border);'"
          @dragover.prevent="dragOverDay = i"
          @dragleave="dragOverDay = null"
          @drop.prevent="dropOnDay(i)"
        >
          <!-- Day header -->
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-body font-semibold text-inkMuted uppercase tracking-wide">{{ label }}</span>
            <span
              class="text-[11px] font-mono font-semibold"
              :style="dayTotals[i] > 0 ? 'color: var(--c-primary)' : 'color: var(--c-inkMuted); opacity: 0.4'"
            >{{ dayTotals[i] }} g</span>
          </div>

          <!-- Empty drop hint -->
          <div
            v-if="!dayPlans[i] || dayPlans[i].length === 0"
            class="text-[11px] font-body italic text-center py-4 rounded-lg border border-dashed"
            style="color: var(--c-inkMuted); opacity: 0.5; border-color: color-mix(in srgb, var(--c-border) 60%, transparent);"
          >
            拖曳糧食至此
          </div>

          <!-- Assigned food entries -->
          <div
            v-for="(foodId, j) in dayPlans[i]" :key="`${i}-${j}`"
            class="flex items-center gap-1.5 group/item"
          >
            <span class="flex-1 text-[12px] font-body text-ink truncate">
              {{ foodMap[foodId]?.name ?? '—' }}
            </span>
            <span class="text-[11px] font-mono text-inkMuted shrink-0">
              {{ entryWeight(foodId) }} g
            </span>
            <button
              class="opacity-0 group-hover/item:opacity-100 text-inkMuted/60 hover:text-red-400 transition-all duration-150 shrink-0 cursor-pointer"
              @click="removeFromDay(i, j)"
            >
              <XIcon :size="10" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div style="border-top: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);" />

    <!-- Master food list (drag sources) -->
    <div>
      <p class="label-title mb-3">糧食總表</p>

      <div v-if="foods.length === 0" class="text-center text-inkMuted py-10 font-body italic">
        — 尚無糧食資料 —
      </div>

      <div v-else class="card-aged overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border text-left">
              <th class="th w-5" />
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
              draggable="true"
              class="border-b border-border/50 transition-colors duration-150 cursor-grab active:cursor-grabbing"
              :class="draggingId === food.id ? 'opacity-50' : 'hover:bg-surface/60'"
              @dragstart="dragStart(food.id)"
              @dragend="draggingId = null"
            >
              <td class="td text-center">
                <GripVerticalIcon :size="12" class="text-inkMuted/40" />
              </td>
              <td class="td font-medium text-ink font-body">
                <span class="flex items-center gap-1.5">
                  {{ food.name }}
                  <a
                    v-if="food.referenceUrl"
                    :href="food.referenceUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-inkMuted hover:text-primary transition-colors shrink-0"
                    @click.stop
                  ><ExternalLinkIcon :size="11" /></a>
                </span>
              </td>
              <td class="td text-inkMuted font-mono text-right">{{ food.weight }}</td>
              <td class="td text-inkMuted font-mono text-right">{{ food.quantity }}</td>
              <td class="td text-inkMuted font-mono text-right">{{ food.weight * food.quantity }}</td>
              <td class="td text-inkMuted font-mono text-right">
                {{ food.price != null ? food.price.toLocaleString() : '—' }}
              </td>
              <td class="td text-inkMuted/70 italic font-body">{{ food.note || '—' }}</td>
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

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { X as XIcon, GripVertical as GripVerticalIcon, ExternalLink as ExternalLinkIcon } from 'lucide-vue-next'
import type { Food } from '../types'

const props = defineProps<{
  foods:      Food[]
  postId:     string
  dateStart?: string | null
  dateEnd?:   string | null
}>()

// ── Days ──────────────────────────────────────────────────────
const numDays = computed(() => {
  if (!props.dateStart || !props.dateEnd) return 1
  const diff = Math.round(
    (new Date(props.dateEnd).getTime() - new Date(props.dateStart).getTime()) / 86400000
  ) + 1
  return Math.max(1, diff)
})

const dayLabels = computed(() =>
  Array.from({ length: numDays.value }, (_, i) => {
    if (!props.dateStart) return `第 ${i + 1} 天`
    const d = new Date(props.dateStart)
    d.setDate(d.getDate() + i)
    return `第 ${i + 1} 天 (${d.getMonth() + 1}/${d.getDate()})`
  })
)

// ── Food map ──────────────────────────────────────────────────
const foodMap = computed<Record<string, Food>>(() =>
  Object.fromEntries(props.foods.map(f => [f.id, f]))
)

const totalWeight = computed(() =>
  props.foods.reduce((s, f) => s + f.weight * f.quantity, 0)
)

function entryWeight(foodId: string): number {
  const f = foodMap.value[foodId]
  return f ? f.weight * f.quantity : 0
}

// ── Persistent day plans (localStorage) ──────────────────────
const storageKey = computed(() => `fdp-${props.postId}`)

const dayPlans = ref<string[][]>([])

function initPlans() {
  try {
    const raw = localStorage.getItem(storageKey.value)
    const saved: string[][] = raw ? JSON.parse(raw) : []
    dayPlans.value = Array.from({ length: numDays.value }, (_, i) =>
      (saved[i] ?? []).filter(id => !!foodMap.value[id])
    )
  } catch {
    dayPlans.value = Array.from({ length: numDays.value }, () => [])
  }
}

function save() {
  localStorage.setItem(storageKey.value, JSON.stringify(dayPlans.value))
}

onMounted(initPlans)
watch([storageKey, () => props.foods.length], initPlans)
watch(numDays, () => {
  dayPlans.value = Array.from({ length: numDays.value }, (_, i) => dayPlans.value[i] ?? [])
  save()
})

// ── Day totals ────────────────────────────────────────────────
const dayTotals = computed(() =>
  dayPlans.value.map(ids => ids.reduce((s, id) => s + entryWeight(id), 0))
)

// ── Drag & Drop ───────────────────────────────────────────────
const draggingId  = ref<string | null>(null)
const dragOverDay = ref<number | null>(null)

function dragStart(foodId: string) {
  draggingId.value = foodId
}

function dropOnDay(dayIndex: number) {
  dragOverDay.value = null
  if (!draggingId.value || !foodMap.value[draggingId.value]) return
  dayPlans.value[dayIndex] = [...(dayPlans.value[dayIndex] ?? []), draggingId.value]
  save()
}

function removeFromDay(dayIndex: number, itemIndex: number) {
  dayPlans.value[dayIndex].splice(itemIndex, 1)
  save()
}
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
