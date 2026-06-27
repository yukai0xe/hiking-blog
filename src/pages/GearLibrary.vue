<template>
  <div class="min-h-screen textured-bg vignette py-8">
    <div class="relative z-10 max-w-6xl mx-auto px-4">

      <!-- Header -->
      <div class="flex items-center gap-3 mb-8">
        <button
          class="card-aged w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
          @click="$router.push('/')" aria-label="返回"
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

      <!-- Stats + filter bar -->
      <GearStatsBar />

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

      <!-- No results after filter -->
      <div v-else-if="filteredBase.length === 0" class="card-aged p-12 text-center">
        <SearchIcon :size="36" class="mx-auto mb-4 text-primary opacity-30" />
        <p class="font-heading text-lg text-ink mb-2">無符合結果</p>
        <button class="text-sm font-body text-primary hover:opacity-70 transition-opacity cursor-pointer" @click="filterCategory = ''; filterBrand = ''">
          清除篩選
        </button>
      </div>

      <!-- Single flat table (all items are non-'other' → rare edge case) -->
      <template v-else-if="!hasMultipleGroups">
        <GearTableSection
          :items="filteredSorted"
          group="owned"
          title="裝備"
          title-variant="default"
          :total-count="store.gearLibrary.length"
          :footer-weight="filteredWeightKg"
          @delete="confirmDelete"
          @sort="setGroupSort"
        />
      </template>

      <!-- Multi-group sections -->
      <template v-else>
        <!-- 已擁有 -->
        <GearTableSection
          :items="filteredOwned"
          group="owned"
          title="已擁有"
          title-variant="default"
          :total-count="ownedInLibrary.length"
          :footer-weight="filteredWeightKg"
          @delete="confirmDelete"
          @sort="setGroupSort"
        />

        <!-- 願望清單 -->
        <GearTableSection
          class="mt-5"
          :items="filteredWishlist"
          group="wishlist"
          title="願望清單"
          title-variant="wishlist"
          :total-count="wishlistCount"
          @delete="confirmDelete"
          @sort="setGroupSort"
        />

        <!-- 已淘汰 -->
        <GearTableSection
          v-if="abandonCount > 0 || filteredAbandon.length > 0"
          class="mt-5"
          :items="filteredAbandon"
          group="abandon"
          title="已淘汰"
          title-variant="abandon"
          :total-count="abandonCount"
          @delete="confirmDelete"
          @sort="setGroupSort"
        />

        <!-- 未分組 -->
        <GearTableSection
          v-if="otherCount > 0 || filteredOther.length > 0"
          class="mt-5"
          :items="filteredOther"
          group="other"
          title="未分組"
          title-variant="default"
          :total-count="otherCount"
          @delete="confirmDelete"
          @sort="setGroupSort"
        />
      </template>

    </div>
  </div>

  <GearDeleteModal
    :deleting-gear="deletingGear"
    :saving="saving"
    :api-error="apiError"
    @confirm="executeDelete"
    @cancel="deletingGear = null"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft as ArrowLeftIcon, Plus as PlusIcon, Search as SearchIcon,
  Package as PackageIcon, AlertCircle as AlertCircleIcon,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import type { Gear } from '../types'
import { usePostStore } from '../stores/postStore'
import { useGearSort, applySort } from '../composables/useGearSort'
import { useGearFilter } from '../composables/useGearFilter'
import { useGearStats, gearStatus } from '../composables/useGearStats'
import GearStatsBar from '../components/GearStatsBar.vue'
import GearTableSection from '../components/GearTableSection.vue'
import GearDeleteModal from '../components/GearDeleteModal.vue'

const store  = usePostStore()
const router = useRouter()
onMounted(() => Promise.all([store.fetchGearLibrary(), store.fetchGearCategories()]))

const { gearLibrary, gearCategories } = storeToRefs(store)
const { filterCategory, filterBrand, filteredBase } = useGearFilter(gearLibrary, gearCategories)
const { sortField, sortAsc, groupSort, setGroupSort } = useGearSort()

const filteredSorted   = computed(() => applySort(filteredBase.value, sortField.value, sortAsc.value))
const filteredOwned    = computed(() => applySort(filteredBase.value.filter(g => gearStatus(g) === 'owned'),    groupSort.value.owned.field,    groupSort.value.owned.asc))
const filteredWishlist = computed(() => applySort(filteredBase.value.filter(g => gearStatus(g) === 'wishlist'), groupSort.value.wishlist.field, groupSort.value.wishlist.asc))
const filteredAbandon  = computed(() => applySort(filteredBase.value.filter(g => gearStatus(g) === 'abandon'),  groupSort.value.abandon.field,  groupSort.value.abandon.asc))
const filteredOther    = computed(() => applySort(filteredBase.value.filter(g => gearStatus(g) === 'other'),    groupSort.value.other.field,    groupSort.value.other.asc))

const {
  ownedInLibrary, wishlistCount, abandonCount, otherCount,
  hasMultipleGroups, filteredWeightKg,
} = useGearStats(gearLibrary, filteredOwned)

// ── Navigation ─────────────────────────────────────────
const saving   = ref(false)
const apiError = ref<string | null>(null)

function openCreate() { router.push('/gear-library/edit/new') }

// ── Delete confirm ─────────────────────────────────────
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
  display: block; font-size: 11px; font-family: Inter, sans-serif;
  font-weight: 600; color: var(--c-inkMuted);
  letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 5px;
}
.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.no-spinner { -moz-appearance: textfield; }
.gear-img-thumb {
  position: relative; width: 64px; height: 64px;
  border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 1px solid var(--c-border);
}
.gear-img-remove {
  position: absolute; top: 3px; right: 3px; width: 18px; height: 18px;
  border-radius: 50%; background: rgba(0,0,0,0.60); color: #fff;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: background 0.12s ease;
}
.gear-img-remove:hover { background: rgba(0,0,0,0.85); }
.wishlist-toggle {
  position: relative; width: 40px; height: 22px; border-radius: 11px;
  background: color-mix(in srgb, var(--c-border) 80%, transparent); border: 1px solid var(--c-border);
  cursor: pointer; transition: background 0.2s ease, border-color 0.2s ease; flex-shrink: 0;
}
.wishlist-toggle--on { background: color-mix(in srgb, var(--c-primary) 70%, transparent); border-color: var(--c-primary); }
.wishlist-toggle-thumb {
  position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;
  border-radius: 50%; background: var(--c-inkMuted); transition: transform 0.18s ease, background 0.2s ease;
}
.wishlist-toggle--on .wishlist-toggle-thumb { transform: translateX(18px); background: var(--c-primary); }
.status-btn {
  padding: 5px 12px; border-radius: 20px; font-size: 12px; font-family: Inter, sans-serif;
  font-weight: 600; cursor: pointer; border: 1px solid var(--c-border);
  color: var(--c-inkMuted); background: transparent; transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.status-btn:hover { color: var(--c-ink); border-color: var(--c-ink); }
.status-btn--owned.status-btn--active    { color: var(--c-ink);     border-color: var(--c-ink);     background: color-mix(in srgb, var(--c-ink) 10%, transparent); }
.status-btn--wishlist.status-btn--active { color: var(--c-primary); border-color: var(--c-primary); background: color-mix(in srgb, var(--c-primary) 12%, transparent); }
.status-btn--abandon.status-btn--active  { color: #c47070;          border-color: #c47070;          background: rgba(196,112,112,0.1); }
.status-btn--other.status-btn--active    { color: var(--c-inkMuted); border-color: var(--c-inkMuted); background: color-mix(in srgb, var(--c-inkMuted) 10%, transparent); }
.form-modal {
  display: flex; flex-direction: column; width: 100%; max-width: 720px; max-height: 90vh;
  border-radius: 16px; border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  background: var(--c-card); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4); overflow: hidden;
}
</style>
