<template>
  <div class="min-h-screen textured-bg vignette py-8">
    <div class="relative z-10 max-w-6xl mx-auto px-4">

      <!-- Header -->
      <div class="flex items-center gap-3 mb-8">
        <button
          class="card-aged w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
          @click="$router.back()" aria-label="返回"
        >
          <ArrowLeftIcon :size="17" />
        </button>
        <div class="flex-1">
          <p class="text-xs font-body tracking-[0.25em] uppercase text-primary opacity-60">Gear Library</p>
          <h1 class="font-heading text-xl font-bold text-ink">裝備庫</h1>
        </div>
        <button
          class="btn-cta flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer"
          @click="openCreate"
        >
          <PlusIcon :size="15" />
          新增裝備
        </button>
      </div>

      <!-- Stats + Search bar -->
      <div class="card-aged px-5 py-4 mb-6 flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-5 mr-auto">
          <div class="text-center">
            <p class="font-heading text-2xl font-bold text-ink leading-none mb-0.5">{{ store.gearLibrary.length }}</p>
            <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">件裝備</p>
          </div>
          <div class="w-px h-8 bg-border/40" />
          <div class="text-center">
            <p class="font-heading text-2xl font-bold text-ink leading-none mb-0.5">{{ totalWeightKg }}</p>
            <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">kg 總重</p>
          </div>
          <div class="w-px h-8 bg-border/40" />
          <div class="text-center">
            <p class="font-heading text-2xl font-bold text-ink leading-none mb-0.5">{{ categoryCount }}</p>
            <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">種類別</p>
          </div>
        </div>

        <div class="relative flex-1 min-w-[180px]">
          <SearchIcon :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-inkMuted pointer-events-none" />
          <input
            v-model="search"
            type="text"
            placeholder="搜尋名稱、品牌…"
            class="w-full pl-8 pr-8 py-2 rounded-lg text-sm font-body text-ink focus:outline-none focus:border-primary transition-colors"
            style="background: transparent; border: 1px solid var(--c-border);"
          />
          <button v-if="search" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-inkMuted hover:text-ink cursor-pointer" @click="search = ''">
            <XIcon :size="13" />
          </button>
        </div>

        <select v-model="filterCategory" class="filter-select">
          <option value="">所有類別</option>
          <option v-for="cat in store.gearCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <!-- Error banner -->
      <div v-if="apiError"
        class="mb-4 px-4 py-2.5 rounded-lg flex items-center gap-2 font-body text-sm"
        style="background: rgba(220,60,60,0.12); border: 1px solid rgba(220,60,60,0.35); color: #e07070;"
      >
        <AlertCircleIcon :size="14" class="shrink-0" />
        {{ apiError }}
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="card-aged p-10 text-center text-inkMuted font-body">
        <div class="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
        載入中…
      </div>

      <!-- Empty library -->
      <div v-else-if="store.gearLibrary.length === 0" class="card-aged p-16 text-center">
        <PackageIcon :size="44" class="mx-auto mb-4 text-primary opacity-30" />
        <p class="font-heading text-xl text-ink mb-2">裝備庫為空</p>
        <p class="text-sm font-body italic text-inkMuted mb-6">在新增或編輯記錄時加入裝備，即可自動建立裝備庫</p>
        <button class="btn-cta inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer" @click="openCreate">
          <PlusIcon :size="14" /> 新增第一件裝備
        </button>
      </div>

      <!-- No results -->
      <div v-else-if="filtered.length === 0" class="card-aged p-12 text-center">
        <SearchIcon :size="36" class="mx-auto mb-4 text-primary opacity-30" />
        <p class="font-heading text-lg text-ink mb-2">無符合結果</p>
        <button class="text-sm font-body text-primary hover:opacity-70 transition-opacity cursor-pointer" @click="search = ''; filterCategory = ''">
          清除篩選
        </button>
      </div>

      <!-- Table -->
      <div v-else class="card-aged overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead style="background: color-mix(in srgb, var(--c-card) 60%, var(--c-border) 40%);">
              <tr class="border-b border-border/50">
                <th class="th cursor-pointer select-none" @click="setSort('name')">
                  <span class="flex items-center gap-1">名稱 <component :is="sortIcon('name')" :size="11" class="opacity-40 shrink-0" /></span>
                </th>
                <th class="th cursor-pointer select-none" @click="setSort('category')">
                  <span class="flex items-center gap-1">類別 <component :is="sortIcon('category')" :size="11" class="opacity-40 shrink-0" /></span>
                </th>
                <th class="th text-right cursor-pointer select-none" @click="setSort('weight')">
                  <span class="flex items-center justify-end gap-1">總重 / 數量 <component :is="sortIcon('weight')" :size="11" class="opacity-40 shrink-0" /></span>
                </th>
                <th class="th cursor-pointer select-none" @click="setSort('brand')">
                  <span class="flex items-center gap-1">品牌 <component :is="sortIcon('brand')" :size="11" class="opacity-40 shrink-0" /></span>
                </th>
                <th class="th text-right cursor-pointer select-none" @click="setSort('price')">
                  <span class="flex items-center justify-end gap-1">價格 <component :is="sortIcon('price')" :size="11" class="opacity-40 shrink-0" /></span>
                </th>
                <th class="th cursor-pointer select-none" @click="setSort('addedAt')">
                  <span class="flex items-center gap-1">加入時間 <component :is="sortIcon('addedAt')" :size="11" class="opacity-40 shrink-0" /></span>
                </th>
                <th class="th">備註</th>
                <th class="w-16" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="gear in filtered" :key="gear.id"
                class="group border-b border-border/20 transition-colors duration-100"
                style="--hover-bg: color-mix(in srgb, var(--c-primary) 5%, transparent);"
                :style="{ background: hoveredId === gear.id ? 'color-mix(in srgb, var(--c-primary) 5%, transparent)' : '' }"
                @mouseenter="hoveredId = gear.id"
                @mouseleave="hoveredId = null"
              >
                <td class="td font-medium text-ink">
                  <span class="flex items-center gap-1.5">
                    {{ gear.name }}
                    <a v-if="gear.referenceUrl" :href="gear.referenceUrl" target="_blank" rel="noopener noreferrer"
                      class="text-inkMuted hover:text-primary transition-colors shrink-0" @click.stop>
                      <ExternalLinkIcon :size="11" />
                    </a>
                  </span>
                </td>
                <td class="td"><span class="cat-badge">{{ gear.category || '其他' }}</span></td>
                <td class="td font-mono text-right">
                  {{ (gear.weight ?? 0) * (gear.quantity ?? 1) }} g
                  <span class="text-[11px] opacity-50 ml-1">×{{ gear.quantity ?? 1 }}</span>
                </td>
                <td class="td text-inkMuted">{{ gear.brand || '—' }}</td>
                <td class="td font-mono text-inkMuted text-right">{{ gear.price != null ? gear.price.toLocaleString() : '—' }}</td>
                <td class="td text-inkMuted">{{ gear.addedAt || '—' }}</td>
                <td class="td note-cell text-inkMuted/70 italic">{{ gear.note || '—' }}</td>
                <td class="td text-right">
                  <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      class="w-7 h-7 rounded flex items-center justify-center text-inkMuted hover:text-ink hover:bg-border/30 transition-colors cursor-pointer"
                      @click="openEdit(gear)"
                      aria-label="編輯"
                    ><PencilIcon :size="13" /></button>
                    <button
                      class="w-7 h-7 rounded flex items-center justify-center text-inkMuted hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                      @click="confirmDelete(gear)"
                      aria-label="刪除"
                    ><Trash2Icon :size="13" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="px-5 py-3 border-t border-border/30 flex items-center justify-between">
          <span class="text-xs font-body text-inkMuted">
            顯示 <span class="text-ink font-semibold">{{ filtered.length }}</span> / {{ store.gearLibrary.length }} 件
          </span>
          <span class="text-xs font-mono text-inkMuted">合計 {{ filteredWeightKg }} kg</span>
        </div>
      </div>

    </div>
  </div>

  <!-- ── Add / Edit Modal ───────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false">
        <div class="form-modal">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <h2 class="font-heading text-lg text-ink tracking-wide">{{ editingId ? '編輯裝備' : '新增裝備' }}</h2>
            <button class="text-inkMuted hover:text-ink transition-colors cursor-pointer" @click="showForm = false">
              <XIcon :size="18" />
            </button>
          </div>

          <div class="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            <!-- 名稱 + 類別 -->
            <div class="grid grid-cols-[1fr_130px] gap-3">
              <div>
                <label class="field-label">名稱 *</label>
                <input v-model="form.name" type="text" class="input-field text-sm" placeholder="裝備名稱" />
              </div>
              <div>
                <label class="field-label">類別</label>
                <select v-model="form.category" class="input-field text-sm font-body">
                  <option v-for="cat in store.gearCategories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>
            </div>

            <!-- 品牌 + 價格 + 加入時間 -->
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="field-label">品牌</label>
                <input v-model="form.brand" type="text" class="input-field text-sm" placeholder="品牌" />
              </div>
              <div>
                <label class="field-label">價格</label>
                <input v-model.number="form.price" type="number" min="0" class="input-field text-sm font-mono no-spinner" placeholder="0" />
              </div>
              <div>
                <label class="field-label">加入時間</label>
                <input v-model="form.addedAt" type="date" class="input-field text-sm font-mono" />
              </div>
            </div>

            <!-- 重量 + 數量 + 備註 -->
            <div class="grid grid-cols-[80px_70px_1fr] gap-3">
              <div>
                <label class="field-label">重量 (g)</label>
                <input v-model.number="form.weight" type="number" min="0" class="input-field text-sm font-mono no-spinner" placeholder="0" />
              </div>
              <div>
                <label class="field-label">數量</label>
                <input v-model.number="form.quantity" type="number" min="1" class="input-field text-sm font-mono no-spinner" placeholder="1" />
              </div>
              <div>
                <label class="field-label">備註</label>
                <input v-model="form.note" type="text" class="input-field text-sm" placeholder="選填" />
              </div>
            </div>

            <!-- 參考連結 -->
            <div>
              <label class="field-label">參考連結</label>
              <input v-model="form.referenceUrl" type="url" class="input-field text-sm font-mono" placeholder="https://…" />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50">
            <button
              class="px-4 py-2 rounded-lg text-sm font-body font-medium cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors"
              @click="showForm = false"
            >取消</button>
            <button
              class="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-body font-semibold btn-cta cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="!form.name.trim() || saving"
              @click="submitForm"
            >
              <span v-if="saving" class="w-3.5 h-3.5 border-2 rounded-full animate-spin border-current border-t-transparent" />
              <SaveIcon v-else :size="14" />
              {{ saving ? '儲存中…' : (editingId ? '更新' : '新增') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Delete Confirm Modal ───────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="deletingGear" class="modal-backdrop" @click.self="deletingGear = null">
        <div class="delete-modal">
          <div class="modal-icon-wrap"><Trash2Icon :size="24" /></div>
          <h2 class="font-heading text-xl font-bold text-ink mb-1">刪除這件裝備？</h2>
          <p class="font-body text-sm text-inkMuted leading-relaxed mb-2">
            「{{ deletingGear.name }}」將從裝備庫中移除，已連結至登山記錄的資料不受影響。
          </p>
          <p v-if="apiError" class="text-red-400 text-xs font-body mb-3 flex items-center gap-1">
            <AlertCircleIcon :size="12" /> {{ apiError }}
          </p>
          <div class="flex gap-3 mt-5">
            <button
              class="flex-1 py-2.5 rounded-lg font-semibold font-body text-sm cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors"
              :disabled="saving"
              @click="deletingGear = null"
            >取消</button>
            <button
              class="flex-1 py-2.5 rounded-lg font-semibold font-body text-sm cursor-pointer delete-confirm-btn flex items-center justify-center gap-1.5"
              :disabled="saving"
              @click="executeDelete"
            >
              <span v-if="saving" class="w-3.5 h-3.5 border-2 rounded-full animate-spin border-current border-t-transparent" />
              <Trash2Icon v-else :size="13" />
              {{ saving ? '刪除中…' : '確認刪除' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ArrowLeft as ArrowLeftIcon,
  Search as SearchIcon,
  X as XIcon,
  Plus as PlusIcon,
  Pencil as PencilIcon,
  Trash2 as Trash2Icon,
  Save as SaveIcon,
  ExternalLink as ExternalLinkIcon,
  Package as PackageIcon,
  AlertCircle as AlertCircleIcon,
  ChevronUp as ChevronUpIcon,
  ChevronDown as ChevronDownIcon,
  ChevronsUpDown as ChevronsUpDownIcon,
} from 'lucide-vue-next'
import type { Gear } from '../types'
import { usePostStore } from '../stores/postStore'

const store = usePostStore()
onMounted(() => Promise.all([store.fetchGearLibrary(), store.fetchGearCategories()]))

// ── Table state ──────────────────────────────────────────
const search         = ref('')
const filterCategory = ref('')
const hoveredId      = ref<string | null>(null)

type SortField = 'name' | 'category' | 'weight' | 'brand' | 'price' | 'addedAt'
const sortField = ref<SortField>('name')
const sortAsc   = ref(true)

function setSort(field: SortField) {
  if (sortField.value === field) sortAsc.value = !sortAsc.value
  else { sortField.value = field; sortAsc.value = true }
}

function sortIcon(field: SortField) {
  if (sortField.value !== field) return ChevronsUpDownIcon
  return sortAsc.value ? ChevronUpIcon : ChevronDownIcon
}

const filtered = computed(() => {
  const q   = search.value.trim().toLowerCase()
  const cat = filterCategory.value

  const list = store.gearLibrary.filter(g => {
    if (cat && g.category !== cat) return false
    if (q && !g.name.toLowerCase().includes(q) && !(g.brand ?? '').toLowerCase().includes(q)) return false
    return true
  })

  return [...list].sort((a, b) => {
    let va: string | number
    let vb: string | number
    switch (sortField.value) {
      case 'name':     va = a.name.toLowerCase();        vb = b.name.toLowerCase();        break
      case 'category': va = a.category.toLowerCase();    vb = b.category.toLowerCase();    break
      case 'weight':   va = (a.weight ?? 0) * (a.quantity ?? 1); vb = (b.weight ?? 0) * (b.quantity ?? 1); break
      case 'brand':    va = (a.brand ?? '').toLowerCase(); vb = (b.brand ?? '').toLowerCase(); break
      case 'price':    va = a.price ?? -1;               vb = b.price ?? -1;               break
      case 'addedAt':  va = a.addedAt ?? '';             vb = b.addedAt ?? '';             break
    }
    if (va! < vb!) return sortAsc.value ? -1 : 1
    if (va! > vb!) return sortAsc.value ?  1 : -1
    return 0
  })
})

function gramsOf(list: Gear[]) {
  return list.reduce((s, g) => s + (g.weight ?? 0) * (g.quantity ?? 1), 0)
}
const totalWeightKg    = computed(() => (gramsOf(store.gearLibrary) / 1000).toFixed(2))
const filteredWeightKg = computed(() => (gramsOf(filtered.value) / 1000).toFixed(2))
const categoryCount    = computed(() => new Set(store.gearLibrary.map(g => g.category)).size)

// ── Form modal ───────────────────────────────────────────
type GearForm = {
  name: string; weight: number; note: string; category: string
  quantity: number; brand: string; referenceUrl: string; price: number | null; addedAt: string
}

const showForm  = ref(false)
const editingId = ref<string | null>(null)
const saving    = ref(false)
const apiError  = ref<string | null>(null)

const blankForm = (): GearForm => ({
  name: '', weight: 0, note: '', category: '其他',
  quantity: 1, brand: '', referenceUrl: '', price: null, addedAt: '',
})
const form = ref<GearForm>(blankForm())

function openCreate() {
  editingId.value = null
  form.value      = blankForm()
  apiError.value  = null
  showForm.value  = true
}

function openEdit(gear: Gear) {
  editingId.value = gear.id
  form.value = {
    name:         gear.name,
    weight:       gear.weight ?? 0,
    note:         gear.note ?? '',
    category:     gear.category,
    quantity:     gear.quantity ?? 1,
    brand:        gear.brand ?? '',
    referenceUrl: gear.referenceUrl ?? '',
    price:        gear.price ?? null,
    addedAt:      gear.addedAt ?? '',
  }
  apiError.value = null
  showForm.value = true
}

async function submitForm() {
  if (!form.value.name.trim()) return
  saving.value   = true
  apiError.value = null
  try {
    const payload = {
      name:         form.value.name.trim(),
      weight:       form.value.weight ?? 0,
      note:         form.value.note,
      category:     form.value.category,
      quantity:     form.value.quantity ?? 1,
      brand:        form.value.brand || null,
      referenceUrl: form.value.referenceUrl || null,
      price:        form.value.price ?? null,
      addedAt:      form.value.addedAt || null,
    }
    if (editingId.value) {
      await store.updateLibraryGear(editingId.value, payload)
    } else {
      await store.createLibraryGear(payload)
    }
    showForm.value = false
  } catch (e) {
    apiError.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

// ── Delete confirm ───────────────────────────────────────
const deletingGear = ref<Gear | null>(null)

function confirmDelete(gear: Gear) {
  deletingGear.value = gear
  apiError.value     = null
}

async function executeDelete() {
  if (!deletingGear.value) return
  saving.value   = true
  apiError.value = null
  try {
    await store.deleteLibraryGear(deletingGear.value.id)
    deletingGear.value = null
  } catch (e) {
    apiError.value = (e as Error).message
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.field-label {
  display: block;
  font-size: 11px;
  font-family: Inter, sans-serif;
  font-weight: 600;
  color: var(--c-inkMuted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 5px;
}

.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.no-spinner { -moz-appearance: textfield; }

/* ── Filter select ───────────────────────────────────── */
.filter-select {
  padding: 7px 10px;
  background: transparent;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  font-family: Inter, sans-serif;
  font-size: 13px;
  color: var(--c-ink);
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
  min-width: 120px;
}
.filter-select:focus { border-color: var(--c-primary); }
.filter-select option { background: var(--c-card); color: var(--c-ink); }

/* ── Table ───────────────────────────────────────────── */
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

/* ── Modals ──────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

.form-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  background: var(--c-card);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.delete-modal {
  width: 100%;
  max-width: 360px;
  border-radius: 16px;
  padding: 32px 28px 28px;
  background: var(--c-card);
  border: 1px solid rgba(220, 60, 60, 0.25);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
  text-align: center;
}

.modal-icon-wrap {
  width: 52px; height: 52px;
  border-radius: 50%;
  background: rgba(220, 60, 60, 0.12);
  border: 1px solid rgba(220, 60, 60, 0.3);
  color: #e07070;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 18px;
}

.delete-confirm-btn {
  background: rgba(220, 60, 60, 0.15);
  color: #e07070;
  border: 1px solid rgba(220, 60, 60, 0.4);
}
.delete-confirm-btn:hover:not(:disabled) {
  background: rgba(220, 60, 60, 0.28);
  border-color: rgba(220, 60, 60, 0.65);
}

.modal-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.modal-leave-active { transition: opacity 0.14s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .form-modal,
.modal-enter-from .delete-modal { transform: translateY(12px) scale(0.98); }
</style>
