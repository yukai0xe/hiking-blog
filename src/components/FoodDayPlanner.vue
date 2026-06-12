<template>
  <div class="space-y-6">

    <!-- ── Day assignment blocks ────────────────────────────── -->
    <div>
      <p class="label-title mb-4">糧食分配</p>
      <div class="flex gap-3 overflow-x-auto pb-3">
        <div
          v-for="(_, i) in dayLabels" :key="i"
          class="flex-none w-52 rounded-2xl overflow-hidden transition-all duration-200"
          :style="editing && dragOverDay === i
            ? 'border: 1.5px solid var(--c-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-primary) 15%, transparent); background: color-mix(in srgb, var(--c-primary) 6%, var(--c-surface));'
            : 'border: 1px solid var(--c-border); background: color-mix(in srgb, var(--c-surface) 40%, transparent);'"
          @dragover.prevent="editing && (dragOverDay = i)"
          @dragleave="editing && (dragOverDay = null)"
          @drop.prevent="editing && dropOnDay(i)"
        >
          <!-- Card header -->
          <div class="px-4 pt-4 pb-3" style="border-bottom: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-[10px] font-body font-bold uppercase tracking-[0.14em]" style="color: var(--c-inkMuted);">
                  第 {{ i + 1 }} 天
                </p>
                <p v-if="dayDates[i]" class="text-[12px] font-mono mt-0.5" style="color: var(--c-ink); opacity: 0.65;">
                  {{ dayDates[i] }}
                </p>
              </div>
              <div class="text-right shrink-0">
                <span
                  class="font-mono font-bold leading-none"
                  :style="dayTotals[i] > 0
                    ? 'font-size: 16px; color: var(--c-primary);'
                    : 'font-size: 16px; color: var(--c-inkMuted); opacity: 0.25;'"
                >{{ dayTotals[i] }}</span>
                <span class="text-[10px] font-mono ml-0.5" style="color: var(--c-inkMuted); opacity: 0.5;">g</span>
              </div>
            </div>
            <p class="mt-2 text-[10px] font-body" style="color: var(--c-inkMuted); opacity: 0.45;">
              {{ dayPlans[i]?.length ?? 0 }} 項糧食
            </p>
          </div>

          <!-- Card body -->
          <div class="p-3 space-y-1.5" style="min-height: 80px;">
            <div
              v-if="!dayPlans[i] || dayPlans[i].length === 0"
              class="flex items-center justify-center rounded-xl border border-dashed h-16 text-[11px] font-body italic"
              style="color: var(--c-inkMuted); opacity: 0.4; border-color: color-mix(in srgb, var(--c-border) 55%, transparent);"
            >{{ editing ? '拖曳至此' : '—' }}</div>

            <div
              v-for="(foodId, j) in dayPlans[i]" :key="`${i}-${j}`"
              class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg group/item transition-colors duration-150"
              style="background: color-mix(in srgb, var(--c-surface) 65%, transparent);"
            >
              <span class="flex-1 text-[12px] font-body text-ink truncate">{{ foodMap[foodId]?.name ?? '—' }}</span>
              <span class="text-[11px] font-mono shrink-0" style="color: var(--c-inkMuted);">{{ foodMap[foodId]?.weight ?? 0 }}g</span>
              <button
                v-if="editing"
                class="opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 shrink-0 cursor-pointer hover:text-red-400"
                style="color: var(--c-inkMuted);"
                @click="removeFromDay(i, j)"
              ><XIcon :size="10" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Divider ────────────────────────────────────────────── -->
    <div style="border-top: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);" />

    <!-- ── Food master list ───────────────────────────────────── -->
    <div>
      <p class="label-title mb-3">糧食總表</p>

      <!-- ── EDITING: two-column (form | cards) ──────────────── -->
      <div v-if="editing" class="grid gap-5" :style="formOpen ? 'grid-template-columns: 1fr 420px; align-items: start;' : 'grid-template-columns: 1fr;'">

        <!-- Left: food cards -->
        <div>
          <!-- Header: count + add button -->
          <div class="flex items-center justify-between mb-3">
            <span class="text-[11px] font-mono text-inkMuted opacity-50">
              {{ foods.length }} 項糧食 · {{ totalWeight }} g
            </span>
            <button
              v-if="!formOpen"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
              style="color: var(--c-inkMuted); border: 1px solid var(--c-border);"
              @click="openAddForm"
            >
              <PlusIcon :size="12" />
              新增糧食
            </button>
          </div>

          <div v-if="foods.length === 0"
            class="text-center text-inkMuted py-16 font-body italic text-sm opacity-50">
            — 尚無糧食，請填寫右側表單新增 —
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(food, fi) in foods" :key="food.id"
              :draggable="remainingQty[food.id] > 0"
              class="food-card card-aged rounded-xl p-4 transition-all duration-150"
              :class="remainingQty[food.id] === 0
                ? 'cursor-not-allowed'
                : draggingId === food.id
                  ? 'opacity-50 cursor-grabbing'
                  : 'cursor-grab'"
              :style="cardStyle(food, fi)"
              @dragstart="remainingQty[food.id] > 0 && dragStart(food.id)"
              @dragend="draggingId = null"
            >
              <!-- Row 1: grip + name + remaining badge + actions -->
              <div class="flex items-center gap-2">
                <!-- Faded when all assigned -->
                <div class="flex items-center gap-2 flex-1 min-w-0" :class="remainingQty[food.id] === 0 ? 'opacity-35' : ''">
                  <GripVerticalIcon
                    :size="14"
                    :class="remainingQty[food.id] === 0 ? 'text-inkMuted/20 shrink-0' : 'text-inkMuted/40 shrink-0'"
                  />
                  <span class="flex-1 font-body font-semibold text-sm text-ink truncate">{{ food.name }}</span>

                  <!-- remaining badge -->
                  <span
                    class="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full"
                    :style="remainingQty[food.id] === 0
                      ? 'background: color-mix(in srgb, var(--c-border) 60%, transparent); color: var(--c-inkMuted);'
                      : remainingQty[food.id] < food.quantity
                        ? 'background: color-mix(in srgb, var(--c-primary) 15%, transparent); color: var(--c-primary);'
                        : 'background: color-mix(in srgb, var(--c-border) 60%, transparent); color: var(--c-inkMuted);'"
                  >{{ remainingQty[food.id] }}/{{ food.quantity }}</span>
                </div>

                <!-- edit / delete (always full opacity) -->
                <div class="flex items-center gap-0.5 shrink-0" @dragstart.stop>
                  <button
                    class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors duration-150 cursor-pointer"
                    :style="editingFoodIndex === fi ? 'color: var(--c-primary);' : 'color: var(--c-inkMuted);'"
                    :disabled="saving"
                    @click.stop="startEdit(fi)"
                  ><Pencil2Icon :size="13" /></button>
                  <button
                    class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors duration-150 cursor-pointer hover:text-red-400"
                    style="color: var(--c-inkMuted);"
                    :disabled="saving"
                    @click.stop="deleteFood(fi)"
                  ><Trash2Icon :size="13" /></button>
                </div>
              </div>

              <!-- Row 2: weight info + price -->
              <div class="mt-2 flex items-center gap-3 flex-wrap" :class="remainingQty[food.id] === 0 ? 'opacity-35' : ''">
                <span class="text-[12px] font-mono text-inkMuted">
                  {{ food.weight }} g × {{ food.quantity }} =
                  <span class="text-ink font-semibold">{{ food.weight * food.quantity }} g</span>
                </span>
                <span v-if="food.price != null" class="text-[11px] font-mono text-inkMuted opacity-70">
                  ${{ food.price.toLocaleString() }}
                </span>
                <a
                  v-if="food.referenceUrl"
                  :href="food.referenceUrl"
                  target="_blank" rel="noopener noreferrer"
                  class="text-inkMuted hover:text-primary transition-colors"
                  @click.stop
                ><ExternalLinkIcon :size="11" /></a>
              </div>

              <!-- Row 3: note (optional) -->
              <p v-if="food.note" class="mt-1.5 text-[11px] font-body italic text-inkMuted/60 truncate" :class="remainingQty[food.id] === 0 ? 'opacity-35' : ''">
                {{ food.note }}
              </p>
            </div>
          </div>
        </div>

        <!-- Right: add/edit form (sticky, only when formOpen) -->
        <div
          v-if="formOpen"
          class="card-aged rounded-xl p-5 space-y-3 sticky top-4"
          :style="editingFoodIndex !== null
            ? 'border: 1px solid color-mix(in srgb, var(--c-primary) 40%, transparent);'
            : 'border: 1px solid var(--c-border);'"
        >
          <p class="text-[10px] font-body font-semibold tracking-[0.14em] uppercase"
            :style="editingFoodIndex !== null ? 'color: var(--c-primary);' : 'color: var(--c-inkMuted);'">
            {{ editingFoodIndex !== null ? '編輯糧食' : '新增糧食' }}
          </p>
          <div class="space-y-1">
            <label class="field-label">食物名稱</label>
            <input v-model="foodForm.name" class="field-input" placeholder="例：牛肉乾"
              @keydown.enter.prevent="submitFood" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <label class="field-label">重量 (g)</label>
              <input v-model.number="foodForm.weight" type="number" min="0" class="field-input" placeholder="0" />
            </div>
            <div class="space-y-1">
              <label class="field-label">數量</label>
              <input v-model.number="foodForm.quantity" type="number" min="1" class="field-input" placeholder="1" />
            </div>
          </div>
          <div class="space-y-1">
            <label class="field-label">備註</label>
            <input v-model="foodForm.note" class="field-input" placeholder="選填" />
          </div>
          <div class="space-y-1">
            <label class="field-label">參考連結</label>
            <input v-model="foodForm.referenceUrl" type="url" class="field-input" placeholder="https://" />
          </div>
          <div class="space-y-1">
            <label class="field-label">價格</label>
            <input v-model.number="foodForm.price" type="number" min="0" class="field-input" placeholder="選填" />
          </div>
          <p v-if="saveError" class="text-[11px] font-body text-red-400 break-all">{{ saveError }}</p>
          <div class="flex gap-2 pt-1">
            <button
              v-if="editingFoodIndex !== null"
              class="flex-1 py-2 rounded-lg text-xs font-body cursor-pointer border transition-colors duration-150"
              style="color: var(--c-inkMuted); border-color: var(--c-border);"
              :disabled="saving"
              @click="cancelEdit"
            >取消</button>
            <button
              class="flex-1 py-2 rounded-lg text-xs font-semibold font-body cursor-pointer btn-cta transition-colors duration-150 flex items-center justify-center gap-1.5"
              :disabled="saving || !foodForm.name.trim()"
              @click="submitFood"
            >
              <div v-if="saving" class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {{ editingFoodIndex !== null ? '更新' : '新增' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── VIEW MODE: read-only table ──────────────────────── -->
      <template v-else>
        <div v-if="foods.length === 0" class="text-center text-inkMuted py-10 font-body italic">
          — 尚無糧食資料，點擊「編輯糧食」新增 —
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
              <tr v-for="food in foods" :key="food.id" class="border-b border-border/50">
                <td class="td font-medium font-body text-ink">
                  <span class="flex items-center gap-1.5">
                    {{ food.name }}
                    <a
                      v-if="food.referenceUrl"
                      :href="food.referenceUrl"
                      target="_blank" rel="noopener noreferrer"
                      class="text-inkMuted hover:text-primary transition-colors shrink-0"
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
                <td class="py-3 px-4 font-semibold text-primary font-body tracking-wide" colspan="3">Total</td>
                <td class="py-3 px-4 font-semibold text-primary font-mono text-right">{{ totalWeight }} g</td>
                <td colspan="2" />
              </tr>
            </tfoot>
          </table>
        </div>
      </template>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  X as XIcon,
  GripVertical as GripVerticalIcon,
  ExternalLink as ExternalLinkIcon,
  Pencil as Pencil2Icon,
  Trash2 as Trash2Icon,
  Plus as PlusIcon,
} from 'lucide-vue-next'
import type { Food, FoodDraft } from '../types'
import { usePostStore } from '../stores/postStore'

const props = defineProps<{
  foods:      Food[]
  postId:     string
  dateStart?: string | null
  dateEnd?:   string | null
  editing?:   boolean
}>()

const emit = defineEmits<{ 'update:editing': [boolean] }>()

const store = usePostStore()

// ── Days ──────────────────────────────────────────────────────
const numDays = computed(() => {
  if (!props.dateStart || !props.dateEnd) return 1
  const diff = Math.round(
    (new Date(props.dateEnd).getTime() - new Date(props.dateStart).getTime()) / 86400000
  ) + 1
  return Math.max(1, diff)
})

const dayLabels = computed(() =>
  Array.from({ length: numDays.value }, (_, i) => `第 ${i + 1} 天`)
)

const dayDates = computed(() =>
  Array.from({ length: numDays.value }, (_, i) => {
    if (!props.dateStart) return null
    const d = new Date(props.dateStart)
    d.setDate(d.getDate() + i)
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
)

// ── Food map & totals ─────────────────────────────────────────
const foodMap = computed<Record<string, Food>>(() =>
  Object.fromEntries(props.foods.map(f => [f.id, f]))
)

const totalWeight = computed(() =>
  props.foods.reduce((s, f) => s + f.weight * f.quantity, 0)
)

// ── Day plans (backed by DB) ──────────────────────────────────
const dayPlans = ref<string[][]>([])

function initPlans() {
  const assignments = store.currentFoodDayAssignments
  const rebuilt = Array.from({ length: numDays.value }, () => [] as string[])
  for (const a of assignments) {
    if (a.dayIndex >= 0 && a.dayIndex < rebuilt.length && foodMap.value[a.foodId])
      rebuilt[a.dayIndex].push(a.foodId)
  }
  dayPlans.value = rebuilt
}

async function save() {
  const flat: { foodId: string; dayIndex: number }[] = []
  dayPlans.value.forEach((ids, i) => ids.forEach(id => flat.push({ foodId: id, dayIndex: i })))
  await store.saveFoodDayAssignments(props.postId, flat)
}

onMounted(initPlans)
watch(() => store.currentFoodDayAssignments, initPlans)
watch([() => props.foods.length, numDays], initPlans)

// ── Remaining quantity per food ───────────────────────────────
const remainingQty = computed<Record<string, number>>(() => {
  const used: Record<string, number> = {}
  for (const day of dayPlans.value)
    for (const id of day)
      used[id] = (used[id] ?? 0) + 1
  return Object.fromEntries(
    props.foods.map(f => [f.id, Math.max(0, f.quantity - (used[f.id] ?? 0))])
  )
})

// ── Day totals ────────────────────────────────────────────────
const dayTotals = computed(() =>
  dayPlans.value.map(ids =>
    ids.reduce((s, id) => s + (foodMap.value[id]?.weight ?? 0), 0)
  )
)

// ── Drag & Drop ───────────────────────────────────────────────
const draggingId  = ref<string | null>(null)
const dragOverDay = ref<number | null>(null)

function dragStart(foodId: string) {
  draggingId.value = foodId
}

async function dropOnDay(dayIndex: number) {
  dragOverDay.value = null
  const id = draggingId.value
  if (!id || !foodMap.value[id] || remainingQty.value[id] <= 0) return
  dayPlans.value[dayIndex] = [...(dayPlans.value[dayIndex] ?? []), id]
  await save()
}

async function removeFromDay(dayIndex: number, itemIndex: number) {
  dayPlans.value[dayIndex].splice(itemIndex, 1)
  await save()
}

// ── Edit mode ─────────────────────────────────────────────────
const saving           = ref(false)
const saveError        = ref<string | null>(null)
const formOpen         = ref(false)
const draftFoods       = ref<FoodDraft[]>([])
const editingFoodIndex = ref<number | null>(null)

const blankForm = (): FoodDraft => ({
  name: '', weight: 0, quantity: 1, note: '', referenceUrl: '', price: null,
})
const foodForm = ref<FoodDraft>(blankForm())

function closeForm() {
  formOpen.value         = false
  foodForm.value         = blankForm()
  editingFoodIndex.value = null
}

watch(() => props.editing, (val) => {
  if (val) syncDraft()
  closeForm()
})

function syncDraft() {
  draftFoods.value = props.foods.map(f => ({
    id: f.id, name: f.name, weight: f.weight, quantity: f.quantity,
    note: f.note, referenceUrl: f.referenceUrl ?? '', price: f.price ?? null,
  }))
}

function openAddForm() {
  editingFoodIndex.value = null
  foodForm.value         = blankForm()
  formOpen.value         = true
}

function startEdit(index: number) {
  editingFoodIndex.value = index
  foodForm.value         = { ...draftFoods.value[index] }
  formOpen.value         = true
}

function cancelEdit() {
  closeForm()
}

async function submitFood() {
  if (saving.value || !foodForm.value.name.trim()) return
  saving.value  = true
  saveError.value = null
  try {
    if (editingFoodIndex.value !== null) {
      draftFoods.value[editingFoodIndex.value] = { ...foodForm.value }
    } else {
      draftFoods.value = [...draftFoods.value, { ...foodForm.value, id: undefined }]
    }
    await store.saveFoods(props.postId, draftFoods.value)
    syncDraft()
    foodForm.value         = blankForm()
    editingFoodIndex.value = null
  } catch (e) {
    saveError.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

function cardStyle(food: Food, fi: number): string {
  if (editingFoodIndex.value === fi) {
    return 'border: 2px solid var(--c-primary); background: color-mix(in srgb, var(--c-primary) 12%, transparent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-primary) 18%, transparent);'
  }
  const assigned = food.quantity - (remainingQty.value[food.id] ?? food.quantity)
  const pct = food.quantity > 0 ? Math.round((assigned / food.quantity) * 100) : 0
  const filled = '#bbf7d0'
  const empty  = 'var(--c-surface)'
  const bg = pct <= 0   ? empty
           : pct >= 100 ? filled
           : `linear-gradient(to right, ${filled} ${pct}%, ${empty} ${pct}%)`
  return `border: 1px solid var(--c-border); background: ${bg};`
}

async function deleteFood(index: number) {
  if (saving.value) return
  saving.value = true
  try {
    const next = draftFoods.value.filter((_, i) => i !== index)
    await store.saveFoods(props.postId, next)
    syncDraft()
    if (editingFoodIndex.value === index) closeForm()
    else if (editingFoodIndex.value !== null && editingFoodIndex.value > index)
      editingFoodIndex.value--
  } finally {
    saving.value = false
  }
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
.field-label {
  display: block;
  font-size: 10px;
  font-family: Inter, sans-serif;
  font-weight: 600;
  color: var(--c-inkMuted);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
.field-input {
  width: 100%;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-family: Inter, sans-serif;
  color: var(--c-ink);
  background: transparent;
  border: 1px solid var(--c-border);
  outline: none;
  transition: box-shadow 0.15s;
}
.field-input:focus {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--c-primary) 35%, transparent);
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

.food-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--c-ink) 14%, transparent);
}

.form-slide-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.form-slide-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.form-slide-enter-from,
.form-slide-leave-to     { opacity: 0; transform: translateY(-6px); }
</style>
