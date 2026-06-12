<template>
  <div>

    <!-- ── EDITING: two-column (cards | form) ──────────────────── -->
    <div
      v-if="editing"
      class="grid gap-5"
      :style="formOpen
        ? 'grid-template-columns: 1fr 420px; align-items: start;'
        : 'grid-template-columns: 1fr;'"
    >

      <!-- Left: gear cards -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <span class="text-[11px] font-mono text-inkMuted opacity-50">
            {{ gears.length }} 件裝備 · {{ totalWeight }} g
          </span>
          <div v-if="!formOpen" class="flex items-center gap-2">
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
              style="color: var(--c-inkMuted); border: 1px solid var(--c-border);"
              @click="openLibraryModal"
            >
              <LibraryIcon :size="12" />
              裝備庫
            </button>
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
              style="color: var(--c-inkMuted); border: 1px solid var(--c-border);"
              @click="openAddForm"
            >
              <PlusIcon :size="12" />
              新增裝備
            </button>
          </div>
        </div>

        <div v-if="gears.length === 0"
          class="text-center text-inkMuted py-16 font-body italic text-sm opacity-50">
          — 尚無裝備，請填寫右側表單新增 —
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="(gear, gi) in gears" :key="gear.id"
            class="gear-card card-aged rounded-xl p-4 transition-all duration-150"
            :style="gearCardStyle(gi)"
          >
            <!-- Row 1: name + category + actions -->
            <div class="flex items-center gap-2">
              <div class="flex-1 min-w-0 flex items-center gap-2 overflow-hidden" :class="editingGearIndex === gi ? '' : ''">
                <span class="font-body font-semibold text-sm text-ink truncate">{{ gear.name }}</span>
                <span
                  class="shrink-0 text-[10px] font-body px-2 py-0.5 rounded-full"
                  style="background: color-mix(in srgb, var(--c-primary) 12%, transparent); color: var(--c-primary);"
                >{{ gear.category || '其他' }}</span>
              </div>
              <div class="flex items-center gap-0.5 shrink-0">
                <button
                  class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors duration-150 cursor-pointer"
                  :style="editingGearIndex === gi ? 'color: var(--c-primary);' : 'color: var(--c-inkMuted);'"
                  :disabled="saving"
                  @click.stop="startEdit(gi)"
                ><Pencil2Icon :size="13" /></button>
                <button
                  class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors duration-150 cursor-pointer hover:text-red-400"
                  style="color: var(--c-inkMuted);"
                  :disabled="saving"
                  @click.stop="deleteGear(gi)"
                ><Trash2Icon :size="13" /></button>
              </div>
            </div>

            <!-- Row 2: weight + brand + price + link -->
            <div class="mt-2 flex items-center gap-3 flex-wrap">
              <span class="text-[12px] font-mono text-inkMuted">
                {{ gear.weight }} g × {{ gear.quantity }} =
                <span class="text-ink font-semibold">{{ gear.weight * gear.quantity }} g</span>
              </span>
              <span v-if="gear.brand" class="text-[11px] font-body text-inkMuted opacity-70">{{ gear.brand }}</span>
              <span v-if="gear.price != null" class="text-[11px] font-mono text-inkMuted opacity-70">
                ${{ gear.price.toLocaleString() }}
              </span>
              <a
                v-if="gear.referenceUrl"
                :href="gear.referenceUrl"
                target="_blank" rel="noopener noreferrer"
                class="text-inkMuted hover:text-primary transition-colors"
                @click.stop
              ><ExternalLinkIcon :size="11" /></a>
            </div>

            <!-- Row 3: note -->
            <p v-if="gear.note" class="mt-1.5 text-[11px] font-body italic text-inkMuted/60 truncate">
              {{ gear.note }}
            </p>
          </div>
        </div>
      </div>

      <!-- Right: add/edit form (sticky) -->
      <div
        v-if="formOpen"
        class="card-aged rounded-xl p-5 space-y-3 sticky top-4"
        :style="editingGearIndex !== null
          ? 'border: 1px solid color-mix(in srgb, var(--c-primary) 40%, transparent);'
          : 'border: 1px solid var(--c-border);'"
      >
        <p class="text-[10px] font-body font-semibold tracking-[0.14em] uppercase"
          :style="editingGearIndex !== null ? 'color: var(--c-primary);' : 'color: var(--c-inkMuted);'">
          {{ editingGearIndex !== null ? '編輯裝備' : '新增裝備' }}
        </p>

        <!-- Name + Category -->
        <div class="grid gap-2" style="grid-template-columns: 1fr 130px;">
          <div class="space-y-1">
            <label class="field-label">裝備名稱</label>
            <input v-model="gearForm.name" class="field-input" placeholder="例：登山杖" />
          </div>
          <div class="space-y-1">
            <label class="field-label">類別</label>
            <select v-model="gearForm.category" class="field-input font-body">
              <option v-for="cat in store.gearCategories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
        </div>

        <!-- Weight + Quantity + Brand -->
        <div class="grid gap-2" style="grid-template-columns: 80px 70px 1fr;">
          <div class="space-y-1">
            <label class="field-label">重量 (g)</label>
            <input v-model.number="gearForm.weight" type="number" min="0" class="field-input" placeholder="0" />
          </div>
          <div class="space-y-1">
            <label class="field-label">數量</label>
            <input v-model.number="gearForm.quantity" type="number" min="1" class="field-input" placeholder="1" />
          </div>
          <div class="space-y-1">
            <label class="field-label">品牌</label>
            <input v-model="gearForm.brand" class="field-input" placeholder="選填" />
          </div>
        </div>

        <!-- Price + AddedAt -->
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <label class="field-label">價格</label>
            <input v-model.number="gearForm.price" type="number" min="0" class="field-input" placeholder="選填" />
          </div>
          <div class="space-y-1">
            <label class="field-label">加入時間</label>
            <input v-model="gearForm.addedAt" type="date" class="field-input font-mono text-xs" />
          </div>
        </div>

        <!-- Note -->
        <div class="space-y-1">
          <label class="field-label">備註</label>
          <input v-model="gearForm.note" class="field-input" placeholder="選填" />
        </div>

        <!-- Reference URL -->
        <div class="space-y-1">
          <label class="field-label">參考連結</label>
          <input v-model="gearForm.referenceUrl" type="url" class="field-input" placeholder="https://" />
        </div>

        <p v-if="saveError" class="text-[11px] font-body text-red-400 break-all">{{ saveError }}</p>

        <div class="flex gap-2 pt-1">
          <button
            v-if="editingGearIndex !== null"
            class="flex-1 py-2 rounded-lg text-xs font-body cursor-pointer border transition-colors duration-150"
            style="color: var(--c-inkMuted); border-color: var(--c-border);"
            :disabled="saving"
            @click="cancelEdit"
          >取消</button>
          <button
            class="flex-1 py-2 rounded-lg text-xs font-semibold font-body cursor-pointer btn-cta transition-colors duration-150 flex items-center justify-center gap-1.5"
            :disabled="saving || !gearForm.name.trim()"
            @click="submitGear"
          >
            <div v-if="saving" class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {{ editingGearIndex !== null ? '更新' : '新增' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── VIEW mode: read-only table ──────────────────────────── -->
    <template v-else>
      <div v-if="gears.length === 0" class="text-center text-inkMuted py-10 font-body italic">
        — 尚無裝備資料，點擊「編輯裝備」新增 —
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
              <th class="th">備註</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="gear in gears" :key="gear.id" class="border-b border-border/50 hover:bg-surface/60 transition-colors duration-150">
              <td class="td font-medium text-ink font-body">
                <span class="flex items-center gap-1.5">
                  {{ gear.name }}
                  <a v-if="gear.referenceUrl" :href="gear.referenceUrl" target="_blank" rel="noopener noreferrer"
                    class="text-inkMuted hover:text-primary transition-colors shrink-0">
                    <ExternalLinkIcon :size="11" />
                  </a>
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
    </template>

  </div>

  <!-- ── 裝備庫 Modal ──────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="lib-modal">
      <div v-if="showLibrary" class="lib-backdrop" @click.self="showLibrary = false">
        <div class="lib-modal">

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <div class="flex items-center gap-2">
              <LibraryIcon :size="16" class="text-primary" />
              <span class="font-heading text-lg text-ink tracking-wide">裝備庫</span>
              <span class="font-mono text-xs text-inkMuted ml-1">{{ store.gearLibrary.length }} 件</span>
            </div>
            <button class="text-inkMuted hover:text-ink transition-colors cursor-pointer" @click="showLibrary = false">
              <XIcon :size="18" />
            </button>
          </div>

          <!-- Search -->
          <div class="px-5 py-3 border-b border-border/30">
            <div class="relative">
              <SearchIcon :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-inkMuted pointer-events-none" />
              <input
                v-model="librarySearch"
                type="text"
                placeholder="搜尋名稱、品牌、類別…"
                class="w-full pl-8 pr-3 py-2 rounded-lg bg-surface border border-border/50 text-sm font-body text-ink placeholder:text-inkMuted/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-auto flex-1 min-h-0">
            <table v-if="filteredLibrary.length > 0" class="w-full">
              <thead class="sticky top-0" style="background: var(--c-card);">
                <tr class="border-b border-border/50">
                  <th class="lib-th w-10 text-center">
                    <input
                      type="checkbox"
                      class="lib-checkbox cursor-pointer"
                      :checked="isAllFilteredSelected"
                      :indeterminate="isSomeSelected && !isAllFilteredSelected"
                      @change="toggleAllFiltered"
                    />
                  </th>
                  <th class="lib-th">名稱</th>
                  <th class="lib-th">類別</th>
                  <th class="lib-th text-right">總重 / 數量</th>
                  <th class="lib-th">品牌</th>
                  <th class="lib-th text-right">價格</th>
                  <th class="lib-th">備註</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="gear in filteredLibrary" :key="gear.id"
                  class="border-b border-border/20"
                  :class="addedGearIds.has(gear.id)
                    ? 'lib-row-added'
                    : librarySelected.includes(gear.id) ? 'lib-row-selected cursor-pointer' : 'lib-row cursor-pointer'"
                  @click="toggleLibraryGear(gear.id)"
                >
                  <td class="lib-td text-center">
                    <input
                      type="checkbox"
                      class="lib-checkbox"
                      :class="addedGearIds.has(gear.id) ? 'cursor-not-allowed' : 'cursor-pointer'"
                      :checked="librarySelected.includes(gear.id)"
                      :disabled="addedGearIds.has(gear.id)"
                      @click.stop="toggleLibraryGear(gear.id)"
                    />
                  </td>
                  <td class="lib-td font-medium">
                    <span class="flex items-center gap-1.5" :class="addedGearIds.has(gear.id) ? 'text-inkMuted' : 'text-ink'">
                      {{ gear.name }}
                      <a v-if="gear.referenceUrl" :href="gear.referenceUrl" target="_blank" rel="noopener noreferrer"
                        class="text-inkMuted hover:text-primary transition-colors shrink-0" @click.stop>
                        <ExternalLinkIcon :size="10" />
                      </a>
                      <span v-if="addedGearIds.has(gear.id)" class="added-badge">已加入</span>
                    </span>
                  </td>
                  <td class="lib-td"><span class="cat-badge">{{ gear.category || '其他' }}</span></td>
                  <td class="lib-td font-mono text-inkMuted text-right">
                    {{ (gear.weight ?? 0) * (gear.quantity ?? 1) }} g
                    <span class="text-[11px] opacity-60 ml-1">×{{ gear.quantity ?? 1 }}</span>
                  </td>
                  <td class="lib-td text-inkMuted">{{ gear.brand || '—' }}</td>
                  <td class="lib-td font-mono text-inkMuted text-right">{{ gear.price != null ? gear.price.toLocaleString() : '—' }}</td>
                  <td class="lib-td note-cell text-inkMuted/70 italic">{{ gear.note || '—' }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="text-center text-inkMuted text-sm font-body italic py-10">
              {{ store.gearLibrary.length === 0 ? '— 裝備庫為空 —' : '— 無符合結果 —' }}
            </p>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-5 py-3 border-t border-border/50">
            <span class="text-sm font-body text-inkMuted">
              <template v-if="librarySelected.length > 0">
                已選 <span class="font-semibold text-primary">{{ librarySelected.length }}</span> 件
              </template>
              <template v-else>尚未選取</template>
            </span>
            <div class="flex gap-2">
              <button
                class="px-4 py-2 rounded-lg text-sm font-body font-medium cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors"
                @click="showLibrary = false"
              >取消</button>
              <button
                class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-body font-semibold btn-cta cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="librarySelected.length === 0 || librarySaving"
                @click="confirmLibrarySelection"
              >
                <div v-if="librarySaving" class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <PlusCircleIcon v-else :size="14" />
                {{ librarySaving ? '加入中…' : '加入清單' }}
              </button>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>

</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  ExternalLink as ExternalLinkIcon,
  Pencil as Pencil2Icon,
  Trash2 as Trash2Icon,
  Plus as PlusIcon,
  Library as LibraryIcon,
  Search as SearchIcon,
  PlusCircle as PlusCircleIcon,
  X as XIcon,
} from 'lucide-vue-next'
import type { Gear } from '../types'
import { usePostStore } from '../stores/postStore'

const props = defineProps<{
  gears:   Gear[]
  postId:  string
  editing?: boolean
}>()

const emit = defineEmits<{ 'update:editing': [boolean] }>()

const store = usePostStore()

onMounted(() => {
  store.fetchGearCategories()
  store.fetchGearLibrary()
})

const totalWeight = computed(() =>
  props.gears.reduce((s, g) => s + g.weight * (g.quantity ?? 1), 0)
)

// ── Form state ────────────────────────────────────────────────
const saving           = ref(false)
const saveError        = ref<string | null>(null)
const formOpen         = ref(false)
const editingGearIndex = ref<number | null>(null)

type GearFormData = {
  name: string; weight: number; note: string; category: string
  quantity: number; brand: string; referenceUrl: string
  price: number | null; addedAt: string
}

const blankForm = (): GearFormData => ({
  name: '', weight: 0, note: '', category: store.gearCategories[0] ?? '其他',
  quantity: 1, brand: '', referenceUrl: '', price: null, addedAt: '',
})

const gearForm = ref<GearFormData>(blankForm())

function closeForm() {
  formOpen.value         = false
  gearForm.value         = blankForm()
  editingGearIndex.value = null
}

watch(() => props.editing, (val) => {
  if (!val) closeForm()
})

function openAddForm() {
  editingGearIndex.value = null
  gearForm.value         = blankForm()
  formOpen.value         = true
}

function startEdit(index: number) {
  const g = props.gears[index]
  editingGearIndex.value = index
  gearForm.value = {
    name:         g.name,
    weight:       g.weight,
    note:         g.note,
    category:     g.category,
    quantity:     g.quantity ?? 1,
    brand:        g.brand        ?? '',
    referenceUrl: g.referenceUrl ?? '',
    price:        g.price        ?? null,
    addedAt:      g.addedAt      ?? '',
  }
  formOpen.value = true
}

function cancelEdit() {
  closeForm()
}

async function submitGear() {
  if (saving.value || !gearForm.value.name.trim()) return
  saving.value   = true
  saveError.value = null
  try {
    const f = gearForm.value
    const payload = {
      name:         f.name,
      weight:       Number(f.weight)   || 0,
      quantity:     Number(f.quantity) || 1,
      note:         f.note,
      category:     f.category,
      brand:        f.brand,
      referenceUrl: f.referenceUrl,
      price:        typeof f.price === 'number' ? f.price : null,
      addedAt:      f.addedAt || '',
    }
    if (editingGearIndex.value !== null) {
      const id = props.gears[editingGearIndex.value].id
      await store.saveGearsInPlace(props.postId, {
        gearsToAdd:      [],
        gearsToUpdate:   [{ id, ...payload }],
        gearIdsToDelete: [],
      })
    } else {
      // Create in library first, then link to this post
      const libraryId = await store.createLibraryGear(payload)
      await store.saveGearsInPlace(props.postId, {
        gearsToAdd:           [],
        gearsToUpdate:        [],
        gearIdsToDelete:      [],
        libraryGearIdsToLink: [libraryId],
      })
    }
    gearForm.value         = blankForm()
    editingGearIndex.value = null
  } catch (e) {
    saveError.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

async function deleteGear(index: number) {
  if (saving.value) return
  saving.value = true
  try {
    const id = props.gears[index].id
    await store.saveGearsInPlace(props.postId, {
      gearsToAdd:      [],
      gearsToUpdate:   [],
      gearIdsToDelete: [id],
    })
    if (editingGearIndex.value === index) closeForm()
    else if (editingGearIndex.value !== null && editingGearIndex.value > index)
      editingGearIndex.value--
  } finally {
    saving.value = false
  }
}

// ── Library modal ─────────────────────────────────────────────
const showLibrary    = ref(false)
const librarySearch  = ref('')
const librarySelected = ref<string[]>([])
const librarySaving  = ref(false)

const addedGearIds = computed(() => {
  const ids = new Set<string>()
  props.gears.forEach(g => { if (g.gearId) ids.add(g.gearId) })
  return ids
})

const filteredLibrary = computed(() => {
  const q = librarySearch.value.trim().toLowerCase()
  if (!q) return store.gearLibrary
  return store.gearLibrary.filter(g =>
    g.name.toLowerCase().includes(q) ||
    (g.brand ?? '').toLowerCase().includes(q) ||
    (g.category ?? '').toLowerCase().includes(q)
  )
})

const selectableLibrary = computed(() =>
  filteredLibrary.value.filter(g => !addedGearIds.value.has(g.id))
)
const isAllFilteredSelected = computed(() =>
  selectableLibrary.value.length > 0 &&
  selectableLibrary.value.every(g => librarySelected.value.includes(g.id))
)
const isSomeSelected = computed(() => librarySelected.value.length > 0)

function openLibraryModal() {
  librarySearch.value   = ''
  librarySelected.value = []
  showLibrary.value     = true
}

function toggleLibraryGear(id: string) {
  if (addedGearIds.value.has(id)) return
  const idx = librarySelected.value.indexOf(id)
  if (idx >= 0) librarySelected.value.splice(idx, 1)
  else librarySelected.value.push(id)
}

function toggleAllFiltered() {
  if (isAllFilteredSelected.value) {
    const ids = filteredLibrary.value.map(g => g.id)
    librarySelected.value = librarySelected.value.filter(id => !ids.includes(id))
  } else {
    const toAdd = selectableLibrary.value.map(g => g.id).filter(id => !librarySelected.value.includes(id))
    librarySelected.value.push(...toAdd)
  }
}

async function confirmLibrarySelection() {
  if (librarySaving.value || librarySelected.value.length === 0) return
  librarySaving.value = true
  try {
    await store.saveGearsInPlace(props.postId, {
      gearsToAdd:           [],
      gearsToUpdate:        [],
      gearIdsToDelete:      [],
      libraryGearIdsToLink: librarySelected.value,
    })
    showLibrary.value = false
  } catch (e) {
    saveError.value = (e as Error).message
  } finally {
    librarySaving.value = false
  }
}

function gearCardStyle(gi: number): string {
  if (editingGearIndex.value === gi) {
    return 'border: 2px solid var(--c-primary); background: color-mix(in srgb, var(--c-primary) 12%, transparent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-primary) 18%, transparent);'
  }
  return 'border: 1px solid var(--c-border);'
}
</script>

<style scoped>
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
.gear-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--c-ink) 14%, transparent);
}

/* ── Library modal ──────────────────────────────────────────── */
.lib-modal-enter-active { transition: opacity 0.2s ease; }
.lib-modal-leave-active { transition: opacity 0.15s ease; }
.lib-modal-enter-from, .lib-modal-leave-to { opacity: 0; }
.lib-modal-enter-active .lib-modal,
.lib-modal-leave-active .lib-modal { transition: transform 0.2s ease; }
.lib-modal-enter-from .lib-modal, .lib-modal-leave-to .lib-modal { transform: translateY(16px) scale(0.98); }

.lib-backdrop {
  position: fixed; inset: 0; z-index: 9000;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
}
.lib-modal {
  display: flex; flex-direction: column;
  width: 100%; max-width: 820px; max-height: 80vh;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  background: var(--c-card);
  box-shadow: 0 24px 60px rgba(0,0,0,0.4);
  overflow: hidden;
}
.lib-th {
  padding: 6px 12px 8px;
  font-size: 11px; font-family: Inter, sans-serif; font-weight: 600;
  color: var(--c-inkMuted); letter-spacing: 0.08em; text-transform: uppercase;
  white-space: nowrap;
}
.lib-td {
  padding: 9px 12px;
  font-size: 13px; font-family: Inter, sans-serif; color: var(--c-inkMuted);
  white-space: nowrap;
}
.note-cell { max-width: 150px; overflow: hidden; text-overflow: ellipsis; }
.cat-badge {
  display: inline-block; font-size: 11px; font-family: Inter, sans-serif;
  color: var(--c-primary);
  background: color-mix(in srgb, var(--c-primary) 10%, transparent);
  padding: 1px 6px; border-radius: 4px; white-space: nowrap;
}
.lib-row:hover td { background: color-mix(in srgb, var(--c-primary) 7%, transparent); }
.lib-row-selected td { background: color-mix(in srgb, var(--c-primary) 14%, transparent); }
.lib-row-selected:hover td { background: color-mix(in srgb, var(--c-primary) 18%, transparent); }
.lib-row-added td { opacity: 0.45; }
.added-badge {
  font-size: 10px; font-family: 'Space Mono', monospace;
  color: var(--c-primary);
  border: 1px solid color-mix(in srgb, var(--c-primary) 40%, transparent);
  padding: 0 5px; border-radius: 4px; flex-shrink: 0;
}
.lib-checkbox { width: 15px; height: 15px; accent-color: var(--c-primary); }
</style>
