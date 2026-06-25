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

      <!-- Stats + Search bar -->
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

      <!-- ── Category Management ──────────────────────────── -->
      <div class="card-aged px-5 py-4 mb-6">
        <p class="text-[10px] font-body font-semibold tracking-[0.2em] uppercase text-inkMuted mb-3">自訂類別</p>
        <div class="flex flex-wrap gap-2 items-center">
          <!-- User's own (custom) categories -->
          <span
            v-for="cat in store.ownGearCategories"
            :key="cat"
            class="pl-2.5 pr-2.5 py-1 rounded-full text-xs font-body text-primary"
            style="border: 1px solid color-mix(in srgb, var(--c-primary) 30%, transparent); background: color-mix(in srgb, var(--c-primary) 8%, transparent);"
          >
            {{ cat }}
          </span>

          <!-- Add new category -->
          <template v-if="addingCat">
            <div class="flex items-center gap-1.5">
              <input
                v-model="newCatName"
                type="text"
                class="px-2.5 py-1 rounded-full text-xs font-body text-ink outline-none"
                style="border: 1px solid var(--c-primary); background: transparent; min-width: 120px;"
                placeholder="新類別名稱"
                autofocus
                @keydown.enter="confirmAddCat"
                @keydown.escape="addingCat = false; newCatName = ''"
              />
              <button
                type="button"
                class="w-6 h-6 rounded-full flex items-center justify-center btn-cta cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="!newCatName.trim() || savingCat"
                @click="confirmAddCat"
              >
                <span v-if="savingCat" class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                <CheckIcon v-else :size="11" />
              </button>
              <button
                type="button"
                class="w-6 h-6 rounded-full flex items-center justify-center card-aged text-inkMuted hover:text-ink transition-colors cursor-pointer"
                @click="addingCat = false; newCatName = ''"
              ><XIcon :size="11" /></button>
            </div>
          </template>
          <button
            v-else
            type="button"
            class="px-2.5 py-1 rounded-full text-xs font-body text-inkMuted hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
            style="border: 1px dashed var(--c-border);"
            @click="addingCat = true"
          ><PlusIcon :size="11" /> 新增類別</button>
        </div>
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
        <button class="text-sm font-body text-primary hover:opacity-70 transition-opacity cursor-pointer" @click="filterCategory = ''; filterBrand = ''">
          清除篩選
        </button>
      </div>

      <!-- Table: all items are 'owned' → single flat section -->
      <div v-else-if="!hasMultipleGroups" class="card-aged overflow-hidden">
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
              <template v-for="gear in filtered" :key="gear.id">
                <tr
                  class="group border-b border-border/20 transition-colors duration-100 cursor-pointer select-none"
                  :style="{ background: hoveredId === gear.id ? 'color-mix(in srgb, var(--c-primary) 5%, transparent)' : '' }"
                  @mouseenter="hoveredId = gear.id"
                  @mouseleave="hoveredId = null"
                  @click="router.push('/gear-library/' + gear.id)"
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
                  <td class="td text-right" @click.stop>
                    <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button class="w-7 h-7 rounded flex items-center justify-center text-inkMuted hover:text-ink hover:bg-border/30 transition-colors cursor-pointer"
                        @click="openEdit(gear)" aria-label="編輯"><PencilIcon :size="13" /></button>
                      <button class="w-7 h-7 rounded flex items-center justify-center text-inkMuted hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                        @click="confirmDelete(gear)" aria-label="刪除"><Trash2Icon :size="13" /></button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div class="px-5 py-3 border-t border-border/30 flex items-center justify-between">
          <span class="text-xs font-body text-inkMuted">顯示 <span class="text-ink font-semibold">{{ filtered.length }}</span> / {{ store.gearLibrary.length }} 件</span>
          <span class="text-xs font-mono text-inkMuted">合計 {{ filteredWeightKg }} kg</span>
        </div>
      </div>

      <!-- Tables: library has wishlist items → two separate sections -->
      <template v-else>
        <!-- 已擁有 section -->
        <div class="card-aged overflow-hidden mb-5">
          <div class="section-title-bar">
            <span>已擁有</span>
            <span class="section-title-count">{{ filteredOwned.length }} 件</span>
          </div>
          <div v-if="filteredOwned.length === 0" class="px-5 py-6 text-sm font-body italic text-inkMuted">
            無符合條件的已擁有裝備
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead style="background: color-mix(in srgb, var(--c-card) 60%, var(--c-border) 40%);">
                <tr class="border-b border-border/50">
                  <th class="th cursor-pointer select-none" @click="setGroupSort('owned', 'name')">
                    <span class="flex items-center gap-1">名稱 <component :is="groupSortIcon('owned', 'name')" :size="11" class="opacity-40 shrink-0" /></span>
                  </th>
                  <th class="th cursor-pointer select-none" @click="setGroupSort('owned', 'category')">
                    <span class="flex items-center gap-1">類別 <component :is="groupSortIcon('owned', 'category')" :size="11" class="opacity-40 shrink-0" /></span>
                  </th>
                  <th class="th text-right cursor-pointer select-none" @click="setGroupSort('owned', 'weight')">
                    <span class="flex items-center justify-end gap-1">總重 / 數量 <component :is="groupSortIcon('owned', 'weight')" :size="11" class="opacity-40 shrink-0" /></span>
                  </th>
                  <th class="th cursor-pointer select-none" @click="setGroupSort('owned', 'brand')">
                    <span class="flex items-center gap-1">品牌 <component :is="groupSortIcon('owned', 'brand')" :size="11" class="opacity-40 shrink-0" /></span>
                  </th>
                  <th class="th text-right cursor-pointer select-none" @click="setGroupSort('owned', 'price')">
                    <span class="flex items-center justify-end gap-1">價格 <component :is="groupSortIcon('owned', 'price')" :size="11" class="opacity-40 shrink-0" /></span>
                  </th>
                  <th class="th cursor-pointer select-none" @click="setGroupSort('owned', 'addedAt')">
                    <span class="flex items-center gap-1">加入時間 <component :is="groupSortIcon('owned', 'addedAt')" :size="11" class="opacity-40 shrink-0" /></span>
                  </th>
                  <th class="th">備註</th>
                  <th class="w-16" />
                </tr>
              </thead>
              <tbody>
                <template v-for="gear in filteredOwned" :key="gear.id">
                  <tr
                    class="group border-b border-border/20 transition-colors duration-100 cursor-pointer select-none"
                    :style="{ background: hoveredId === gear.id ? 'color-mix(in srgb, var(--c-primary) 5%, transparent)' : '' }"
                    @mouseenter="hoveredId = gear.id"
                    @mouseleave="hoveredId = null"
                    @click="router.push('/gear-library/' + gear.id)"
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
                    <td class="td text-right" @click.stop>
                      <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button class="w-7 h-7 rounded flex items-center justify-center text-inkMuted hover:text-ink hover:bg-border/30 transition-colors cursor-pointer"
                          @click="openEdit(gear)" aria-label="編輯"><PencilIcon :size="13" /></button>
                        <button class="w-7 h-7 rounded flex items-center justify-center text-inkMuted hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                          @click="confirmDelete(gear)" aria-label="刪除"><Trash2Icon :size="13" /></button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div v-if="filteredOwned.length > 0" class="px-5 py-3 border-t border-border/30 flex items-center justify-between">
            <span class="text-xs font-body text-inkMuted">顯示 <span class="text-ink font-semibold">{{ filteredOwned.length }}</span> / {{ ownedInLibrary.length }} 件</span>
            <span class="text-xs font-mono text-inkMuted">合計 {{ filteredWeightKg }} kg</span>
          </div>
        </div>

        <!-- 願望清單 section -->
        <div class="card-aged overflow-hidden" style="border-color: color-mix(in srgb, var(--c-primary) 25%, var(--c-border));">
          <div class="section-title-bar section-title-bar--wishlist">
            <span class="flex items-center gap-1.5"><BookmarkIcon :size="13" /> 願望清單</span>
            <span class="section-title-count">{{ filteredWishlist.length }} 件</span>
          </div>
          <div v-if="filteredWishlist.length === 0" class="px-5 py-6 text-sm font-body italic text-inkMuted">
            無符合條件的願望清單裝備
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead style="background: color-mix(in srgb, var(--c-card) 60%, var(--c-border) 40%);">
                <tr class="border-b border-border/50">
                  <th class="th cursor-pointer select-none" @click="setGroupSort('wishlist', 'name')">
                    <span class="flex items-center gap-1">名稱 <component :is="groupSortIcon('wishlist', 'name')" :size="11" class="opacity-40 shrink-0" /></span>
                  </th>
                  <th class="th cursor-pointer select-none" @click="setGroupSort('wishlist', 'category')">
                    <span class="flex items-center gap-1">類別 <component :is="groupSortIcon('wishlist', 'category')" :size="11" class="opacity-40 shrink-0" /></span>
                  </th>
                  <th class="th text-right cursor-pointer select-none" @click="setGroupSort('wishlist', 'weight')">
                    <span class="flex items-center justify-end gap-1">總重 / 數量 <component :is="groupSortIcon('wishlist', 'weight')" :size="11" class="opacity-40 shrink-0" /></span>
                  </th>
                  <th class="th cursor-pointer select-none" @click="setGroupSort('wishlist', 'brand')">
                    <span class="flex items-center gap-1">品牌 <component :is="groupSortIcon('wishlist', 'brand')" :size="11" class="opacity-40 shrink-0" /></span>
                  </th>
                  <th class="th text-right cursor-pointer select-none" @click="setGroupSort('wishlist', 'price')">
                    <span class="flex items-center justify-end gap-1">價格 <component :is="groupSortIcon('wishlist', 'price')" :size="11" class="opacity-40 shrink-0" /></span>
                  </th>
                  <th class="th cursor-pointer select-none" @click="setGroupSort('wishlist', 'addedAt')">
                    <span class="flex items-center gap-1">加入時間 <component :is="groupSortIcon('wishlist', 'addedAt')" :size="11" class="opacity-40 shrink-0" /></span>
                  </th>
                  <th class="th">備註</th>
                  <th class="w-16" />
                </tr>
              </thead>
              <tbody>
                <template v-for="gear in filteredWishlist" :key="gear.id">
                  <tr
                    class="group border-b border-border/20 transition-colors duration-100 cursor-pointer select-none"
                    :style="{ background: hoveredId === gear.id ? 'color-mix(in srgb, var(--c-primary) 5%, transparent)' : '' }"
                    @mouseenter="hoveredId = gear.id"
                    @mouseleave="hoveredId = null"
                    @click="router.push('/gear-library/' + gear.id)"
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
                    <td class="td text-right" @click.stop>
                      <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button class="w-7 h-7 rounded flex items-center justify-center text-inkMuted hover:text-ink hover:bg-border/30 transition-colors cursor-pointer"
                          @click="openEdit(gear)" aria-label="編輯"><PencilIcon :size="13" /></button>
                        <button class="w-7 h-7 rounded flex items-center justify-center text-inkMuted hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                          @click="confirmDelete(gear)" aria-label="刪除"><Trash2Icon :size="13" /></button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div v-if="filteredWishlist.length > 0" class="px-5 py-3 border-t border-border/30 flex items-center justify-between">
            <span class="text-xs font-body text-inkMuted">顯示 <span class="text-ink font-semibold">{{ filteredWishlist.length }}</span> / {{ wishlistCount }} 件</span>
          </div>
        </div>

        <!-- 已淘汰 section -->
        <div v-if="abandonCount > 0 || filteredAbandon.length > 0" class="card-aged overflow-hidden mt-5" style="border-color: color-mix(in srgb, #c47070 20%, var(--c-border));">
          <div class="section-title-bar section-title-bar--abandon">
            <span class="flex items-center gap-1.5"><Trash2Icon :size="13" /> 已淘汰</span>
            <span class="section-title-count">{{ filteredAbandon.length }} 件</span>
          </div>
          <div v-if="filteredAbandon.length === 0" class="px-5 py-6 text-sm font-body italic text-inkMuted">
            無符合條件的已淘汰裝備
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead style="background: color-mix(in srgb, var(--c-card) 60%, var(--c-border) 40%);">
                <tr class="border-b border-border/50">
                  <th class="th cursor-pointer select-none" @click="setGroupSort('abandon', 'name')"><span class="flex items-center gap-1">名稱 <component :is="groupSortIcon('abandon', 'name')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th cursor-pointer select-none" @click="setGroupSort('abandon', 'category')"><span class="flex items-center gap-1">類別 <component :is="groupSortIcon('abandon', 'category')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th text-right cursor-pointer select-none" @click="setGroupSort('abandon', 'weight')"><span class="flex items-center justify-end gap-1">總重 / 數量 <component :is="groupSortIcon('abandon', 'weight')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th cursor-pointer select-none" @click="setGroupSort('abandon', 'brand')"><span class="flex items-center gap-1">品牌 <component :is="groupSortIcon('abandon', 'brand')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th text-right cursor-pointer select-none" @click="setGroupSort('abandon', 'price')"><span class="flex items-center justify-end gap-1">價格 <component :is="groupSortIcon('abandon', 'price')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th cursor-pointer select-none" @click="setGroupSort('abandon', 'addedAt')"><span class="flex items-center gap-1">加入時間 <component :is="groupSortIcon('abandon', 'addedAt')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th">備註</th>
                  <th class="w-16" />
                </tr>
              </thead>
              <tbody>
                <template v-for="gear in filteredAbandon" :key="gear.id">
                  <tr class="group border-b border-border/20 transition-colors duration-100 cursor-pointer select-none"
                    :style="{ background: hoveredId === gear.id ? 'rgba(196,112,112,0.06)' : '' }"
                    @mouseenter="hoveredId = gear.id" @mouseleave="hoveredId = null" @click="router.push('/gear-library/' + gear.id)">
                    <td class="td font-medium" style="color: var(--c-inkMuted);">
                      <span class="flex items-center gap-1.5">
                        <span style="text-decoration: line-through; opacity: 0.7;">{{ gear.name }}</span>
                        <a v-if="gear.referenceUrl" :href="gear.referenceUrl" target="_blank" rel="noopener noreferrer" class="text-inkMuted hover:text-primary transition-colors shrink-0" @click.stop><ExternalLinkIcon :size="11" /></a>
                      </span>
                    </td>
                    <td class="td"><span class="cat-badge">{{ gear.category || '其他' }}</span></td>
                    <td class="td font-mono text-right text-inkMuted">{{ (gear.weight ?? 0) * (gear.quantity ?? 1) }} g <span class="text-[11px] opacity-50 ml-1">×{{ gear.quantity ?? 1 }}</span></td>
                    <td class="td text-inkMuted">{{ gear.brand || '—' }}</td>
                    <td class="td font-mono text-inkMuted text-right">{{ gear.price != null ? gear.price.toLocaleString() : '—' }}</td>
                    <td class="td text-inkMuted">{{ gear.addedAt || '—' }}</td>
                    <td class="td note-cell text-inkMuted/70 italic">{{ gear.note || '—' }}</td>
                    <td class="td text-right" @click.stop>
                      <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button class="w-7 h-7 rounded flex items-center justify-center text-inkMuted hover:text-ink hover:bg-border/30 transition-colors cursor-pointer" @click="openEdit(gear)" aria-label="編輯"><PencilIcon :size="13" /></button>
                        <button class="w-7 h-7 rounded flex items-center justify-center text-inkMuted hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer" @click="confirmDelete(gear)" aria-label="刪除"><Trash2Icon :size="13" /></button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div v-if="filteredAbandon.length > 0" class="px-5 py-3 border-t border-border/30 flex items-center justify-between">
            <span class="text-xs font-body text-inkMuted">顯示 <span class="text-ink font-semibold">{{ filteredAbandon.length }}</span> / {{ abandonCount }} 件</span>
          </div>
        </div>

        <!-- 未分組 section -->
        <div v-if="otherCount > 0 || filteredOther.length > 0" class="card-aged overflow-hidden mt-5">
          <div class="section-title-bar">
            <span>未分組</span>
            <span class="section-title-count">{{ filteredOther.length }} 件</span>
          </div>
          <div v-if="filteredOther.length === 0" class="px-5 py-6 text-sm font-body italic text-inkMuted">
            無符合條件的裝備
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead style="background: color-mix(in srgb, var(--c-card) 60%, var(--c-border) 40%);">
                <tr class="border-b border-border/50">
                  <th class="th cursor-pointer select-none" @click="setGroupSort('other', 'name')"><span class="flex items-center gap-1">名稱 <component :is="groupSortIcon('other', 'name')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th cursor-pointer select-none" @click="setGroupSort('other', 'category')"><span class="flex items-center gap-1">類別 <component :is="groupSortIcon('other', 'category')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th text-right cursor-pointer select-none" @click="setGroupSort('other', 'weight')"><span class="flex items-center justify-end gap-1">總重 / 數量 <component :is="groupSortIcon('other', 'weight')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th cursor-pointer select-none" @click="setGroupSort('other', 'brand')"><span class="flex items-center gap-1">品牌 <component :is="groupSortIcon('other', 'brand')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th text-right cursor-pointer select-none" @click="setGroupSort('other', 'price')"><span class="flex items-center justify-end gap-1">價格 <component :is="groupSortIcon('other', 'price')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th cursor-pointer select-none" @click="setGroupSort('other', 'addedAt')"><span class="flex items-center gap-1">加入時間 <component :is="groupSortIcon('other', 'addedAt')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th">備註</th>
                  <th class="w-16" />
                </tr>
              </thead>
              <tbody>
                <template v-for="gear in filteredOther" :key="gear.id">
                  <tr class="group border-b border-border/20 transition-colors duration-100 cursor-pointer select-none"
                    :style="{ background: hoveredId === gear.id ? 'color-mix(in srgb, var(--c-primary) 5%, transparent)' : '' }"
                    @mouseenter="hoveredId = gear.id" @mouseleave="hoveredId = null" @click="router.push('/gear-library/' + gear.id)">
                    <td class="td font-medium text-ink">
                      <span class="flex items-center gap-1.5">
                        {{ gear.name }}
                        <a v-if="gear.referenceUrl" :href="gear.referenceUrl" target="_blank" rel="noopener noreferrer" class="text-inkMuted hover:text-primary transition-colors shrink-0" @click.stop><ExternalLinkIcon :size="11" /></a>
                      </span>
                    </td>
                    <td class="td"><span class="cat-badge">{{ gear.category || '其他' }}</span></td>
                    <td class="td font-mono text-right">{{ (gear.weight ?? 0) * (gear.quantity ?? 1) }} g <span class="text-[11px] opacity-50 ml-1">×{{ gear.quantity ?? 1 }}</span></td>
                    <td class="td text-inkMuted">{{ gear.brand || '—' }}</td>
                    <td class="td font-mono text-inkMuted text-right">{{ gear.price != null ? gear.price.toLocaleString() : '—' }}</td>
                    <td class="td text-inkMuted">{{ gear.addedAt || '—' }}</td>
                    <td class="td note-cell text-inkMuted/70 italic">{{ gear.note || '—' }}</td>
                    <td class="td text-right" @click.stop>
                      <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button class="w-7 h-7 rounded flex items-center justify-center text-inkMuted hover:text-ink hover:bg-border/30 transition-colors cursor-pointer" @click="openEdit(gear)" aria-label="編輯"><PencilIcon :size="13" /></button>
                        <button class="w-7 h-7 rounded flex items-center justify-center text-inkMuted hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer" @click="confirmDelete(gear)" aria-label="刪除"><Trash2Icon :size="13" /></button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div v-if="filteredOther.length > 0" class="px-5 py-3 border-t border-border/30 flex items-center justify-between">
            <span class="text-xs font-body text-inkMuted">顯示 <span class="text-ink font-semibold">{{ filteredOther.length }}</span> / {{ otherCount }} 件</span>
          </div>
        </div>
      </template>

    </div>
  </div>

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
import { useRouter } from 'vue-router'
import {
  ArrowLeft as ArrowLeftIcon,
  Search as SearchIcon,
  X as XIcon,
  Plus as PlusIcon,
  Pencil as PencilIcon,
  Trash2 as Trash2Icon,
  ExternalLink as ExternalLinkIcon,
  Package as PackageIcon,
  AlertCircle as AlertCircleIcon,
  ChevronUp as ChevronUpIcon,
  ChevronDown as ChevronDownIcon,
  ChevronsUpDown as ChevronsUpDownIcon,
  Check as CheckIcon,
  Bookmark as BookmarkIcon,
} from 'lucide-vue-next'
import type { Gear, GearStatus } from '../types'
import { usePostStore } from '../stores/postStore'

const store  = usePostStore()
const router = useRouter()
onMounted(() => Promise.all([store.fetchGearLibrary(), store.fetchGearCategories()]))

// ── Category management block ─────────────────────────────
const addingCat = ref(false)
const newCatName = ref('')
const savingCat = ref(false)


async function confirmAddCat() {
  const name = newCatName.value.trim()
  if (!name || savingCat.value) return
  savingCat.value = true
  try {
    await store.addGearCategory(name)
    addingCat.value = false
    newCatName.value = ''
  } catch {
    // keep input open on error
  } finally {
    savingCat.value = false
  }
}


// ── Table state ──────────────────────────────────────────
const filterCategories = computed(() => {
  const all = new Set([
    ...store.gearCategories,
    ...store.gearLibrary.map(g => g.category).filter(Boolean),
  ])
  return [...all].sort((a, b) => a.localeCompare(b, 'zh-TW'))
})

const filterCategory = ref('')
const filterBrand    = ref('')
const hoveredId      = ref<string | null>(null)

const filterBrands = computed(() => {
  const brands = store.gearLibrary
    .map(g => g.brand)
    .filter((b): b is string => !!b)
  return [...new Set(brands)].sort((a, b) => a.localeCompare(b, 'zh-TW'))
})

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

const filteredBase = computed(() => {
  const cat   = filterCategory.value
  const brand = filterBrand.value
  return store.gearLibrary.filter(g => {
    if (cat && g.category !== cat) return false
    if (brand && g.brand !== brand) return false
    return true
  })
})

function applySort(list: Gear[], field: SortField, asc: boolean): Gear[] {
  return [...list].sort((a, b) => {
    let va: string | number
    let vb: string | number
    switch (field) {
      case 'name':     va = a.name.toLowerCase();          vb = b.name.toLowerCase();          break
      case 'category': va = a.category.toLowerCase();      vb = b.category.toLowerCase();      break
      case 'weight':   va = (a.weight ?? 0) * (a.quantity ?? 1); vb = (b.weight ?? 0) * (b.quantity ?? 1); break
      case 'brand':    va = (a.brand ?? '').toLowerCase(); vb = (b.brand ?? '').toLowerCase(); break
      case 'price':    va = a.price ?? -1;                 vb = b.price ?? -1;                 break
      case 'addedAt':  va = a.addedAt ?? '';               vb = b.addedAt ?? '';               break
    }
    if (va! < vb!) return asc ? -1 : 1
    if (va! > vb!) return asc ? 1 : -1
    return 0
  })
}

const filtered = computed(() => applySort(filteredBase.value, sortField.value, sortAsc.value))

type GroupKey = 'owned' | 'wishlist' | 'abandon' | 'other'
const groupSort = ref<Record<GroupKey, { field: SortField; asc: boolean }>>({
  owned:    { field: 'name', asc: true },
  wishlist: { field: 'name', asc: true },
  abandon:  { field: 'name', asc: true },
  other:    { field: 'name', asc: true },
})

function setGroupSort(group: GroupKey, field: SortField) {
  const s = groupSort.value[group]
  if (s.field === field) s.asc = !s.asc
  else { s.field = field; s.asc = true }
}

function groupSortIcon(group: GroupKey, field: SortField) {
  const s = groupSort.value[group]
  if (s.field !== field) return ChevronsUpDownIcon
  return s.asc ? ChevronUpIcon : ChevronDownIcon
}

function gramsOf(list: Gear[]) {
  return list.reduce((s, g) => s + (g.weight ?? 0) * (g.quantity ?? 1), 0)
}

function gearStatus(g: Gear): GearStatus {
  if (g.status) return g.status
  return g.isWishlist ? 'wishlist' : 'owned'
}

const hasMultipleGroups = computed(() => store.gearLibrary.some(g => gearStatus(g) !== 'other'))
const filteredOwned    = computed(() => applySort(filteredBase.value.filter(g => gearStatus(g) === 'owned'),    groupSort.value.owned.field,    groupSort.value.owned.asc))
const filteredWishlist = computed(() => applySort(filteredBase.value.filter(g => gearStatus(g) === 'wishlist'), groupSort.value.wishlist.field, groupSort.value.wishlist.asc))
const filteredAbandon  = computed(() => applySort(filteredBase.value.filter(g => gearStatus(g) === 'abandon'),  groupSort.value.abandon.field,  groupSort.value.abandon.asc))
const filteredOther    = computed(() => applySort(filteredBase.value.filter(g => gearStatus(g) === 'other'),    groupSort.value.other.field,    groupSort.value.other.asc))
const ownedInLibrary    = computed(() => store.gearLibrary.filter(g => gearStatus(g) === 'owned'))
const wishlistCount     = computed(() => store.gearLibrary.filter(g => gearStatus(g) === 'wishlist').length)
const abandonCount      = computed(() => store.gearLibrary.filter(g => gearStatus(g) === 'abandon').length)
const otherCount        = computed(() => store.gearLibrary.filter(g => gearStatus(g) === 'other').length)


const totalWeightKg    = computed(() => (gramsOf(ownedInLibrary.value) / 1000).toFixed(2))
const filteredWeightKg = computed(() => (gramsOf(filteredOwned.value) / 1000).toFixed(2))
const categoryCount    = computed(() => new Set(store.gearLibrary.map(g => g.category)).size)

// ── Navigation ───────────────────────────────────────────
const saving   = ref(false)
const apiError = ref<string | null>(null)

function openCreate() { router.push('/gear-library/edit/new') }
function openEdit(gear: Gear) { router.push(`/gear-library/edit/${gear.id}`) }

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
  max-width: 720px;
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

/* ── Image thumbnails ────────────────────────────────── */
.gear-img-thumb {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--c-border);
}
.gear-img-remove {
  position: absolute;
  top: 3px; right: 3px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: rgba(0,0,0,0.60);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background 0.12s ease;
}
.gear-img-remove:hover { background: rgba(0,0,0,0.85); }

/* ── Wishlist toggle switch ──────────────────────────── */
.wishlist-toggle {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: color-mix(in srgb, var(--c-border) 80%, transparent);
  border: 1px solid var(--c-border);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
  flex-shrink: 0;
}
.wishlist-toggle--on {
  background: color-mix(in srgb, var(--c-primary) 70%, transparent);
  border-color: var(--c-primary);
}
.wishlist-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--c-inkMuted);
  transition: transform 0.18s ease, background 0.2s ease;
}
.wishlist-toggle--on .wishlist-toggle-thumb {
  transform: translateX(18px);
  background: var(--c-primary);
}

/* ── Section title bars ──────────────────────────────── */
.section-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px 7px;
  font-size: 11px;
  font-family: Inter, sans-serif;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--c-inkMuted);
  background: color-mix(in srgb, var(--c-card) 70%, var(--c-border) 30%);
  border-bottom: 1px solid var(--c-border);
}
.section-title-bar--wishlist {
  color: var(--c-primary);
  background: color-mix(in srgb, var(--c-primary) 6%, var(--c-card));
  border-bottom-color: color-mix(in srgb, var(--c-primary) 20%, transparent);
}
.section-title-bar--abandon {
  color: #c47070;
  background: color-mix(in srgb, #c47070 6%, var(--c-card));
  border-bottom-color: color-mix(in srgb, #c47070 20%, transparent);
}

/* ── Status selector (form) ──────────────────────────── */
.status-btn {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-family: Inter, sans-serif;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--c-border);
  color: var(--c-inkMuted);
  background: transparent;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.status-btn:hover { color: var(--c-ink); border-color: var(--c-ink); }
.status-btn--owned.status-btn--active    { color: var(--c-ink);     border-color: var(--c-ink);    background: color-mix(in srgb, var(--c-ink) 10%, transparent); }
.status-btn--wishlist.status-btn--active { color: var(--c-primary); border-color: var(--c-primary); background: color-mix(in srgb, var(--c-primary) 12%, transparent); }
.status-btn--abandon.status-btn--active  { color: #c47070;           border-color: #c47070;          background: rgba(196,112,112,0.1); }
.status-btn--other.status-btn--active    { color: var(--c-inkMuted); border-color: var(--c-inkMuted); background: color-mix(in srgb, var(--c-inkMuted) 10%, transparent); }
.section-title-count {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.6;
  letter-spacing: 0.05em;
  text-transform: none;
}
</style>
