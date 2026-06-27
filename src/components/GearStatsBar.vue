<template>
  <div class="card-aged px-5 py-4 mb-6 flex flex-wrap items-center gap-4">
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
      <div class="w-px h-8 bg-border/40" />
      <div class="text-center">
        <p class="font-heading text-2xl font-bold text-ink leading-none mb-0.5">{{ categoryCount }}</p>
        <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">種類別</p>
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
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePostStore } from '../stores/postStore'
import { useGearFilter } from '../composables/useGearFilter'
import { useGearStats } from '../composables/useGearStats'

const store = usePostStore()
const { gearLibrary, gearCategories } = storeToRefs(store)

const { filterCategory, filterBrand, filterCategories, filterBrands } = useGearFilter(gearLibrary, gearCategories)
const { ownedInLibrary, wishlistCount, abandonCount, otherCount, totalWeightKg, categoryCount } = useGearStats(gearLibrary)
</script>

<style scoped>
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
