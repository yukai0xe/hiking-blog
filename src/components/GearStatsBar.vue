<template>
  <div class="card-aged mb-6">

    <!-- ── Mobile layout ───────────────────────────────────────── -->
    <div class="sm:hidden px-4 pt-4 pb-3 space-y-3">
      <!-- Primary stats row: always-visible -->
      <div class="grid grid-cols-2 gap-2">
        <div class="stat-tile">
          <p class="stat-num text-ink">{{ ownedInLibrary.length }}</p>
          <p class="stat-lbl">件裝備</p>
        </div>
        <div class="stat-tile" :class="abandonCount > 0 ? 'stat-tile--abandon' : ''">
          <p class="stat-num" :style="abandonCount > 0 ? 'color: #c47070;' : ''">{{ abandonCount }}</p>
          <p class="stat-lbl">已淘汰</p>
        </div>
      </div>

      <!-- Secondary stats row: wishlist + total weight -->
      <div class="grid gap-2"
        :class="wishlistCount > 0 ? 'grid-cols-2' : 'grid-cols-1'">
        <div v-if="wishlistCount > 0" class="stat-tile stat-tile--wishlist">
          <p class="stat-num" style="color: var(--c-primary);">{{ wishlistCount }}</p>
          <p class="stat-lbl">願望清單</p>
        </div>
        <div class="stat-tile">
          <p class="stat-num text-ink">{{ totalWeightKg }}</p>
          <p class="stat-lbl">kg 總重</p>
        </div>
      </div>

      <!-- Mobile filter buttons -->
      <div class="grid grid-cols-2 gap-2">
        <button class="filter-btn" :class="filterCategory ? 'filter-btn--active' : ''" @click="openSheet = 'category'">
          <span class="truncate">{{ filterCategory || '所有類別' }}</span>
          <ChevronUpIcon :size="13" class="shrink-0 opacity-50" />
        </button>
        <button class="filter-btn" :class="filterBrand ? 'filter-btn--active' : ''" @click="openSheet = 'brand'">
          <span class="truncate">{{ filterBrand || '所有品牌' }}</span>
          <ChevronUpIcon :size="13" class="shrink-0 opacity-50" />
        </button>
      </div>
    </div>

    <!-- ── Desktop layout ──────────────────────────────────────── -->
    <div class="hidden sm:flex flex-wrap items-center gap-4 px-5 py-4">
      <div class="flex items-center gap-5 mr-auto">
        <div class="text-center">
          <p class="font-heading text-2xl font-bold text-ink leading-none mb-0.5">{{ ownedInLibrary.length }}</p>
          <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">件裝備</p>
        </div>
        <template v-if="wishlistCount > 0">
          <div class="w-px h-8 bg-border/40" />
          <div class="text-center">
            <p class="font-heading text-2xl font-bold leading-none mb-0.5" style="color: var(--c-primary);">{{ wishlistCount }}</p>
            <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">願望清單</p>
          </div>
        </template>
        <template v-if="abandonCount > 0">
          <div class="w-px h-8 bg-border/40" />
          <div class="text-center">
            <p class="font-heading text-2xl font-bold leading-none mb-0.5" style="color: #c47070;">{{ abandonCount }}</p>
            <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">已淘汰</p>
          </div>
        </template>
        <template v-if="otherCount > 0">
          <div class="w-px h-8 bg-border/40" />
          <div class="text-center">
            <p class="font-heading text-2xl font-bold leading-none mb-0.5" style="color: var(--c-inkMuted);">{{ otherCount }}</p>
            <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">其他</p>
          </div>
        </template>
        <div class="w-px h-8 bg-border/40" />
        <div class="text-center">
          <p class="font-heading text-2xl font-bold text-ink leading-none mb-0.5">{{ totalWeightKg }}</p>
          <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">kg 總重</p>
        </div>
      </div>

      <select v-model="filterCategory" class="filter-select">
        <option value="">所有類別</option>
        <option v-for="cat in filterCategories" :key="cat" :value="cat">{{ cat }}</option>
      </select>

      <select v-model="filterBrand" class="filter-select">
        <option value="">所有品牌</option>
        <option v-for="brand in filterBrands" :key="brand" :value="brand">{{ brand }}</option>
      </select>
    </div>

  </div>

  <!-- ── Bottom sheet picker ─────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="picker-sheet">
      <div v-if="openSheet" class="picker-backdrop" @click.self="openSheet = null">
        <div class="picker-box">
          <div class="picker-handle" />
          <p class="picker-title">
            {{ openSheet === 'category' ? '篩選類別' : '篩選品牌' }}
          </p>
          <div class="picker-list">
            <!-- All option -->
            <button
              class="picker-item"
              :class="openSheet === 'category' ? (filterCategory === '' ? 'picker-item--active' : '') : (filterBrand === '' ? 'picker-item--active' : '')"
              @click="selectOption('')"
            >
              {{ openSheet === 'category' ? '所有類別' : '所有品牌' }}
              <CheckIcon v-if="openSheet === 'category' ? filterCategory === '' : filterBrand === ''" :size="14" class="shrink-0" style="color: var(--c-primary);" />
            </button>
            <div class="picker-divider" />
            <!-- Options -->
            <button
              v-for="opt in (openSheet === 'category' ? filterCategories : filterBrands)"
              :key="opt"
              class="picker-item"
              :class="openSheet === 'category' ? (filterCategory === opt ? 'picker-item--active' : '') : (filterBrand === opt ? 'picker-item--active' : '')"
              @click="selectOption(opt)"
            >
              {{ opt }}
              <CheckIcon v-if="openSheet === 'category' ? filterCategory === opt : filterBrand === opt" :size="14" class="shrink-0" style="color: var(--c-primary);" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronUp as ChevronUpIcon, Check as CheckIcon } from 'lucide-vue-next'
import { usePostStore } from '../stores/postStore'
import { useGearFilter } from '../composables/useGearFilter'
import { useGearStats } from '../composables/useGearStats'

const store = usePostStore()
const { gearLibrary, gearCategories } = storeToRefs(store)

const { filterCategory, filterBrand, filterCategories, filterBrands } = useGearFilter(gearLibrary, gearCategories)
const { ownedInLibrary, wishlistCount, abandonCount, otherCount, totalWeightKg } = useGearStats(gearLibrary)

const openSheet = ref<'category' | 'brand' | null>(null)

function selectOption(val: string) {
  if (openSheet.value === 'category') filterCategory.value = val
  else if (openSheet.value === 'brand') filterBrand.value = val
  openSheet.value = null
}
</script>

<style scoped>
.stat-tile {
  padding: 10px 8px;
  border-radius: 10px;
  text-align: center;
  background: color-mix(in srgb, var(--c-border) 30%, transparent);
}
.stat-tile--wishlist {
  background: color-mix(in srgb, var(--c-primary) 10%, transparent);
}
.stat-tile--abandon {
  background: rgba(196, 112, 112, 0.10);
}
.stat-num {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 3px;
}
.stat-lbl {
  font-family: Inter, sans-serif;
  font-size: 10px;
  color: var(--c-inkMuted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* Mobile filter trigger button */
.filter-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--c-border);
  background: transparent;
  font-family: Inter, sans-serif;
  font-size: 13px;
  color: var(--c-inkMuted);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.filter-btn--active {
  border-color: var(--c-primary);
  color: var(--c-ink);
}

/* Bottom sheet */
.picker-backdrop {
  position: fixed; inset: 0; z-index: 500;
  display: flex; align-items: flex-end; justify-content: center;
  background: rgba(0, 0, 0, 0.55);
}
.picker-box {
  width: 100%;
  background: var(--c-card);
  border-top: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  box-shadow: 0 -8px 48px rgba(0, 0, 0, 0.4);
  border-radius: 0;
  max-height: 70dvh;
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.picker-handle {
  width: 36px; height: 4px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--c-border) 70%, transparent);
  margin: 12px auto 0;
  flex-shrink: 0;
}
.picker-title {
  padding: 12px 20px 8px;
  font-family: Inter, sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--c-inkMuted);
  flex-shrink: 0;
}
.picker-list {
  overflow-y: auto;
  flex: 1;
  padding: 0 0 8px;
}
.picker-divider {
  height: 1px;
  background: color-mix(in srgb, var(--c-border) 40%, transparent);
  margin: 4px 0;
}
.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 13px 20px;
  font-family: Inter, sans-serif;
  font-size: 15px;
  color: var(--c-ink);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
}
.picker-item:active { background: color-mix(in srgb, var(--c-primary) 8%, transparent); }
.picker-item--active { color: var(--c-primary); font-weight: 600; }

/* Animation */
.picker-sheet-enter-active { transition: opacity 0.2s ease, transform 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
.picker-sheet-leave-active { transition: opacity 0.16s ease, transform 0.2s ease; }
.picker-sheet-enter-from, .picker-sheet-leave-to { opacity: 0; transform: translateY(60%); }

/* Desktop select */
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
</style>
