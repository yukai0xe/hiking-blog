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
          <option v-for="cat in filterCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <!-- ── Category Management ──────────────────────────── -->
      <div class="card-aged px-5 py-4 mb-6">
        <p class="text-[10px] font-body font-semibold tracking-[0.2em] uppercase text-inkMuted mb-3">自訂類別</p>
        <div class="flex flex-wrap gap-2 items-center">
          <!-- User's own (custom) categories — deletable chips -->
          <span
            v-for="cat in store.ownGearCategories"
            :key="cat"
            class="flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-body text-primary"
            style="border: 1px solid color-mix(in srgb, var(--c-primary) 30%, transparent); background: color-mix(in srgb, var(--c-primary) 8%, transparent);"
          >
            {{ cat }}
            <button
              type="button"
              class="w-4 h-4 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              @click="removeCat(cat)"
            ><XIcon :size="9" /></button>
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
        <button class="text-sm font-body text-primary hover:opacity-70 transition-opacity cursor-pointer" @click="search = ''; filterCategory = ''">
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
                  :class="{ 'border-border/0': expandedIds.has(gear.id) }"
                  :style="{ background: hoveredId === gear.id ? 'color-mix(in srgb, var(--c-primary) 5%, transparent)' : '' }"
                  @mouseenter="hoveredId = gear.id"
                  @mouseleave="hoveredId = null"
                  @click="toggleExpand(gear.id)"
                >
                  <td class="td font-medium text-ink">
                    <span class="flex items-center gap-1.5">
                      <ChevronRightIcon :size="13" class="text-inkMuted transition-transform duration-150 shrink-0"
                        :class="{ 'rotate-90': expandedIds.has(gear.id) }" />
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
                <tr v-if="expandedIds.has(gear.id)" class="border-b border-border/20">
                  <td colspan="8" class="px-5 py-3" style="background: color-mix(in srgb, var(--c-primary) 4%, var(--c-card));">
                    <div v-if="gearImages[gear.id] === null" class="flex items-center gap-2 text-xs font-body text-inkMuted py-1">
                      <span class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> 載入中…
                    </div>
                    <div v-else-if="!gearImages[gear.id]?.length" class="text-xs font-body italic text-inkMuted py-1">此裝備無圖片</div>
                    <div v-else class="flex flex-wrap gap-2">
                      <img v-for="(img, i) in gearImages[gear.id]" :key="img.id" :src="img.url"
                        class="h-24 w-24 object-cover rounded cursor-pointer opacity-90 hover:opacity-100 hover:scale-[1.03] transition-all duration-200"
                        @click.stop="openGearLightbox(gear.id, i)" />
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
                <template v-for="gear in filteredOwned" :key="gear.id">
                  <tr
                    class="group border-b border-border/20 transition-colors duration-100 cursor-pointer select-none"
                    :class="{ 'border-border/0': expandedIds.has(gear.id) }"
                    :style="{ background: hoveredId === gear.id ? 'color-mix(in srgb, var(--c-primary) 5%, transparent)' : '' }"
                    @mouseenter="hoveredId = gear.id"
                    @mouseleave="hoveredId = null"
                    @click="toggleExpand(gear.id)"
                  >
                    <td class="td font-medium text-ink">
                      <span class="flex items-center gap-1.5">
                        <ChevronRightIcon :size="13" class="text-inkMuted transition-transform duration-150 shrink-0"
                          :class="{ 'rotate-90': expandedIds.has(gear.id) }" />
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
                  <tr v-if="expandedIds.has(gear.id)" class="border-b border-border/20">
                    <td colspan="8" class="px-5 py-3" style="background: color-mix(in srgb, var(--c-primary) 4%, var(--c-card));">
                      <div v-if="gearImages[gear.id] === null" class="flex items-center gap-2 text-xs font-body text-inkMuted py-1">
                        <span class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> 載入中…
                      </div>
                      <div v-else-if="!gearImages[gear.id]?.length" class="text-xs font-body italic text-inkMuted py-1">此裝備無圖片</div>
                      <div v-else class="flex flex-wrap gap-2">
                        <img v-for="(img, i) in gearImages[gear.id]" :key="img.id" :src="img.url"
                          class="h-24 w-24 object-cover rounded cursor-pointer opacity-90 hover:opacity-100 hover:scale-[1.03] transition-all duration-200"
                          @click.stop="openGearLightbox(gear.id, i)" />
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
                <template v-for="gear in filteredWishlist" :key="gear.id">
                  <tr
                    class="group border-b border-border/20 transition-colors duration-100 cursor-pointer select-none"
                    :class="{ 'border-border/0': expandedIds.has(gear.id) }"
                    :style="{ background: hoveredId === gear.id ? 'color-mix(in srgb, var(--c-primary) 5%, transparent)' : '' }"
                    @mouseenter="hoveredId = gear.id"
                    @mouseleave="hoveredId = null"
                    @click="toggleExpand(gear.id)"
                  >
                    <td class="td font-medium text-ink">
                      <span class="flex items-center gap-1.5">
                        <ChevronRightIcon :size="13" class="text-inkMuted transition-transform duration-150 shrink-0"
                          :class="{ 'rotate-90': expandedIds.has(gear.id) }" />
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
                  <tr v-if="expandedIds.has(gear.id)" class="border-b border-border/20">
                    <td colspan="8" class="px-5 py-3" style="background: color-mix(in srgb, var(--c-primary) 4%, var(--c-card));">
                      <div v-if="gearImages[gear.id] === null" class="flex items-center gap-2 text-xs font-body text-inkMuted py-1">
                        <span class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> 載入中…
                      </div>
                      <div v-else-if="!gearImages[gear.id]?.length" class="text-xs font-body italic text-inkMuted py-1">此裝備無圖片</div>
                      <div v-else class="flex flex-wrap gap-2">
                        <img v-for="(img, i) in gearImages[gear.id]" :key="img.id" :src="img.url"
                          class="h-24 w-24 object-cover rounded cursor-pointer opacity-90 hover:opacity-100 hover:scale-[1.03] transition-all duration-200"
                          @click.stop="openGearLightbox(gear.id, i)" />
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
                  <th class="th cursor-pointer select-none" @click="setSort('name')"><span class="flex items-center gap-1">名稱 <component :is="sortIcon('name')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th cursor-pointer select-none" @click="setSort('category')"><span class="flex items-center gap-1">類別 <component :is="sortIcon('category')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th text-right cursor-pointer select-none" @click="setSort('weight')"><span class="flex items-center justify-end gap-1">總重 / 數量 <component :is="sortIcon('weight')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th cursor-pointer select-none" @click="setSort('brand')"><span class="flex items-center gap-1">品牌 <component :is="sortIcon('brand')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th text-right cursor-pointer select-none" @click="setSort('price')"><span class="flex items-center justify-end gap-1">價格 <component :is="sortIcon('price')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th cursor-pointer select-none" @click="setSort('addedAt')"><span class="flex items-center gap-1">加入時間 <component :is="sortIcon('addedAt')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th">備註</th>
                  <th class="w-16" />
                </tr>
              </thead>
              <tbody>
                <template v-for="gear in filteredAbandon" :key="gear.id">
                  <tr class="group border-b border-border/20 transition-colors duration-100 cursor-pointer select-none"
                    :class="{ 'border-border/0': expandedIds.has(gear.id) }"
                    :style="{ background: hoveredId === gear.id ? 'rgba(196,112,112,0.06)' : '' }"
                    @mouseenter="hoveredId = gear.id" @mouseleave="hoveredId = null" @click="toggleExpand(gear.id)">
                    <td class="td font-medium" style="color: var(--c-inkMuted);">
                      <span class="flex items-center gap-1.5">
                        <ChevronRightIcon :size="13" class="text-inkMuted transition-transform duration-150 shrink-0" :class="{ 'rotate-90': expandedIds.has(gear.id) }" />
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
                  <tr v-if="expandedIds.has(gear.id)" class="border-b border-border/20">
                    <td colspan="8" class="px-5 py-3" style="background: color-mix(in srgb, var(--c-primary) 4%, var(--c-card));">
                      <div v-if="gearImages[gear.id] === null" class="flex items-center gap-2 text-xs font-body text-inkMuted py-1"><span class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> 載入中…</div>
                      <div v-else-if="!gearImages[gear.id]?.length" class="text-xs font-body italic text-inkMuted py-1">此裝備無圖片</div>
                      <div v-else class="flex flex-wrap gap-2"><img v-for="(img, i) in gearImages[gear.id]" :key="img.id" :src="img.url" class="h-24 w-24 object-cover rounded cursor-pointer opacity-90 hover:opacity-100 hover:scale-[1.03] transition-all duration-200" @click.stop="openGearLightbox(gear.id, i)" /></div>
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
                  <th class="th cursor-pointer select-none" @click="setSort('name')"><span class="flex items-center gap-1">名稱 <component :is="sortIcon('name')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th cursor-pointer select-none" @click="setSort('category')"><span class="flex items-center gap-1">類別 <component :is="sortIcon('category')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th text-right cursor-pointer select-none" @click="setSort('weight')"><span class="flex items-center justify-end gap-1">總重 / 數量 <component :is="sortIcon('weight')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th cursor-pointer select-none" @click="setSort('brand')"><span class="flex items-center gap-1">品牌 <component :is="sortIcon('brand')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th text-right cursor-pointer select-none" @click="setSort('price')"><span class="flex items-center justify-end gap-1">價格 <component :is="sortIcon('price')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th cursor-pointer select-none" @click="setSort('addedAt')"><span class="flex items-center gap-1">加入時間 <component :is="sortIcon('addedAt')" :size="11" class="opacity-40 shrink-0" /></span></th>
                  <th class="th">備註</th>
                  <th class="w-16" />
                </tr>
              </thead>
              <tbody>
                <template v-for="gear in filteredOther" :key="gear.id">
                  <tr class="group border-b border-border/20 transition-colors duration-100 cursor-pointer select-none"
                    :class="{ 'border-border/0': expandedIds.has(gear.id) }"
                    :style="{ background: hoveredId === gear.id ? 'color-mix(in srgb, var(--c-primary) 5%, transparent)' : '' }"
                    @mouseenter="hoveredId = gear.id" @mouseleave="hoveredId = null" @click="toggleExpand(gear.id)">
                    <td class="td font-medium text-ink">
                      <span class="flex items-center gap-1.5">
                        <ChevronRightIcon :size="13" class="text-inkMuted transition-transform duration-150 shrink-0" :class="{ 'rotate-90': expandedIds.has(gear.id) }" />
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
                  <tr v-if="expandedIds.has(gear.id)" class="border-b border-border/20">
                    <td colspan="8" class="px-5 py-3" style="background: color-mix(in srgb, var(--c-primary) 4%, var(--c-card));">
                      <div v-if="gearImages[gear.id] === null" class="flex items-center gap-2 text-xs font-body text-inkMuted py-1"><span class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> 載入中…</div>
                      <div v-else-if="!gearImages[gear.id]?.length" class="text-xs font-body italic text-inkMuted py-1">此裝備無圖片</div>
                      <div v-else class="flex flex-wrap gap-2"><img v-for="(img, i) in gearImages[gear.id]" :key="img.id" :src="img.url" class="h-24 w-24 object-cover rounded cursor-pointer opacity-90 hover:opacity-100 hover:scale-[1.03] transition-all duration-200" @click.stop="openGearLightbox(gear.id, i)" /></div>
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

  <!-- ── Add / Edit Modal ───────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showForm" class="modal-backdrop" @click.self="closeForm">
        <div class="form-modal">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <h2 class="font-heading text-lg text-ink tracking-wide">{{ editingId ? '編輯裝備' : '新增裝備' }}</h2>
            <button class="text-inkMuted hover:text-ink transition-colors cursor-pointer" @click="closeForm">
              <XIcon :size="18" />
            </button>
          </div>

          <div class="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            <!-- 第一行：名稱 + 類別 -->
            <div class="grid grid-cols-[1fr_160px] gap-3">
              <div>
                <label class="field-label">名稱 *</label>
                <input v-model="form.name" type="text" class="input-field text-sm" placeholder="裝備名稱" />
              </div>
              <div>
                <label class="field-label">類別</label>
                <select v-model="form.category" class="input-field text-sm font-body">
                  <option v-for="cat in filterCategories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>
            </div>

            <!-- 第二行：品牌 + 價格 + 重量 + 數量 -->
            <div class="grid grid-cols-4 gap-3">
              <div>
                <label class="field-label">品牌</label>
                <input v-model="form.brand" type="text" class="input-field text-sm" placeholder="品牌" />
              </div>
              <div>
                <label class="field-label">價格</label>
                <input v-model="form.price" type="text" inputmode="numeric" class="input-field text-sm font-mono" placeholder="0"
                  :style="formErrors.price ? { borderColor: '#ef4444' } : {}" />
                <p v-if="formErrors.price" class="mt-1 text-xs font-body" style="color:#ef4444;">{{ formErrors.price }}</p>
              </div>
              <div>
                <label class="field-label">重量 (g)</label>
                <input v-model="form.weight" type="text" inputmode="numeric" class="input-field text-sm font-mono" placeholder="0"
                  :style="formErrors.weight ? { borderColor: '#ef4444' } : {}" />
                <p v-if="formErrors.weight" class="mt-1 text-xs font-body" style="color:#ef4444;">{{ formErrors.weight }}</p>
              </div>
              <div>
                <label class="field-label">數量</label>
                <input v-model.number="form.quantity" type="number" min="1" class="input-field text-sm font-mono no-spinner" placeholder="1" />
              </div>
            </div>

            <!-- 第三行：加入時間 + 參考連結 -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">加入時間</label>
                <input v-model="form.addedAt" type="date" class="input-field text-sm font-mono" />
              </div>
              <div>
                <label class="field-label">參考連結</label>
                <input v-model="form.referenceUrl" type="text" class="input-field text-sm font-mono" placeholder="https://…"
                  :style="formErrors.referenceUrl ? { borderColor: '#ef4444' } : {}" />
                <p v-if="formErrors.referenceUrl" class="mt-1 text-xs font-body" style="color:#ef4444;">{{ formErrors.referenceUrl }}</p>
              </div>
            </div>

            <!-- 第四行：備註 -->
            <div>
              <label class="field-label">備註</label>
              <textarea v-model="form.note" rows="3" class="input-field text-sm resize-none" placeholder="選填" />
            </div>

            <!-- 狀態 -->
            <div>
              <label class="field-label">狀態</label>
              <div class="flex gap-2 flex-wrap mt-1">
                <button
                  v-for="s in statusOptions" :key="s.value"
                  type="button"
                  class="status-btn"
                  :class="[`status-btn--${s.value}`, { 'status-btn--active': form.status === s.value }]"
                  @click="form.status = s.value"
                >{{ s.label }}</button>
              </div>
            </div>

            <!-- 圖片 -->
            <div>
              <label class="field-label">圖片（選填）</label>
              <div v-if="loadingImages" class="text-xs font-body text-inkMuted flex items-center gap-1.5 mb-2">
                <span class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                載入圖片中…
              </div>
              <div class="flex flex-wrap gap-2">
                <!-- Existing images (not yet deleted) -->
                <div v-for="img in editingImages" :key="img.id" class="gear-img-thumb">
                  <img :src="img.url" class="w-full h-full object-cover" />
                  <button type="button" class="gear-img-remove" @click="removeExistingImage(img.id)">
                    <XIcon :size="10" />
                  </button>
                </div>
                <!-- New image previews -->
                <div v-for="(preview, i) in newImagePreviews" :key="preview" class="gear-img-thumb">
                  <img :src="preview" class="w-full h-full object-cover"
                    :class="saving ? 'opacity-50' : 'opacity-75'" />
                  <button type="button" class="gear-img-remove" :disabled="saving" @click="removeNewImage(i)">
                    <XIcon :size="10" />
                  </button>
                  <!-- Per-file upload progress overlay -->
                  <div v-if="saving" class="absolute inset-0 flex flex-col items-center justify-center gap-1"
                    style="background: rgba(0,0,0,0.45);">
                    <template v-if="newImageProgress[i] >= 100">
                      <CheckIcon :size="16" class="text-green-400" />
                    </template>
                    <template v-else>
                      <span class="text-white text-[10px] font-mono font-bold leading-none">{{ newImageProgress[i] }}%</span>
                      <div class="w-10 h-0.5 rounded-full overflow-hidden" style="background: rgba(255,255,255,0.25);">
                        <div class="h-full rounded-full transition-all duration-100"
                          style="background: white;"
                          :style="{ width: `${newImageProgress[i]}%` }" />
                      </div>
                    </template>
                  </div>
                </div>
                <!-- Add button -->
                <button
                  type="button"
                  class="w-16 h-16 rounded-lg flex flex-col items-center justify-center gap-1 text-inkMuted hover:text-primary hover:border-primary transition-colors cursor-pointer"
                  style="border: 1px dashed var(--c-border);"
                  @click="triggerImageInput"
                >
                  <ImageIcon :size="18" class="opacity-50" />
                  <span class="text-[10px] font-body">上傳</span>
                </button>
              </div>
              <input ref="imageInputRef" type="file" accept="image/*" multiple class="hidden" @change="onImagesSelected" />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50">
            <button
              class="px-4 py-2 rounded-lg text-sm font-body font-medium cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors"
              @click="closeForm"
            >取消</button>
            <button
              class="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-body font-semibold btn-cta cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="!form.name.trim() || hasFormErrors || saving"
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

  <!-- ── Gear image lightbox ──────────────────────────────── -->
  <PhotoGallery ref="gearLightboxRef" :headless="true" :photos="lightboxImages" />

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
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
  ChevronRight as ChevronRightIcon,
  ChevronsUpDown as ChevronsUpDownIcon,
  Check as CheckIcon,
  Image as ImageIcon,
  Bookmark as BookmarkIcon,
} from 'lucide-vue-next'
import type { Gear, GearImage, GearStatus } from '../types'
import { usePostStore } from '../stores/postStore'
import PhotoGallery from '../components/PhotoGallery.vue'

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

async function removeCat(name: string) {
  await store.deleteGearCategory(name)
}

// ── Table state ──────────────────────────────────────────
const filterCategories = computed(() => {
  const all = new Set([
    ...store.gearCategories,
    ...store.gearLibrary.map(g => g.category).filter(Boolean),
  ])
  return [...all].sort((a, b) => a.localeCompare(b, 'zh-TW'))
})

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

function gearStatus(g: Gear): GearStatus {
  if (g.status) return g.status
  return g.isWishlist ? 'wishlist' : 'owned'
}

const hasMultipleGroups = computed(() => store.gearLibrary.some(g => gearStatus(g) !== 'other'))
const filteredOwned     = computed(() => filtered.value.filter(g => gearStatus(g) === 'owned'))
const filteredWishlist  = computed(() => filtered.value.filter(g => gearStatus(g) === 'wishlist'))
const filteredAbandon   = computed(() => filtered.value.filter(g => gearStatus(g) === 'abandon'))
const filteredOther     = computed(() => filtered.value.filter(g => gearStatus(g) === 'other'))
const ownedInLibrary    = computed(() => store.gearLibrary.filter(g => gearStatus(g) === 'owned'))
const wishlistCount     = computed(() => store.gearLibrary.filter(g => gearStatus(g) === 'wishlist').length)
const abandonCount      = computed(() => store.gearLibrary.filter(g => gearStatus(g) === 'abandon').length)
const otherCount        = computed(() => store.gearLibrary.filter(g => gearStatus(g) === 'other').length)


const totalWeightKg    = computed(() => (gramsOf(ownedInLibrary.value) / 1000).toFixed(2))
const filteredWeightKg = computed(() => (gramsOf(filteredOwned.value) / 1000).toFixed(2))
const categoryCount    = computed(() => new Set(store.gearLibrary.map(g => g.category)).size)

// ── Row expansion + image cache ──────────────────────────
const expandedIds = ref(new Set<string>())
const gearImages  = ref<Record<string, GearImage[] | null>>({})

async function toggleExpand(id: string) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) { next.delete(id); expandedIds.value = next; return }
  next.add(id)
  expandedIds.value = next
  if (!(id in gearImages.value)) {
    gearImages.value[id] = null
    try { gearImages.value[id] = await store.fetchGearImages(id) }
    catch { gearImages.value[id] = [] }
  }
}

// ── Gear lightbox ────────────────────────────────────────
const gearLightboxRef = ref<InstanceType<typeof PhotoGallery> | null>(null)
const lightboxImages  = ref<{ id: string; url: string }[]>([])

function openGearLightbox(gearId: string, index: number) {
  const imgs = gearImages.value[gearId]
  if (!imgs?.length) return
  lightboxImages.value = imgs
  gearLightboxRef.value?.openPhoto(index)
}

// ── Image management in edit modal ───────────────────────
const editingImages     = ref<GearImage[]>([])
const deletingImageIds  = ref<string[]>([])
const newImageFiles     = ref<File[]>([])
const newImagePreviews  = ref<string[]>([])
const newImageProgress  = ref<number[]>([])
const loadingImages     = ref(false)
const imageInputRef     = ref<HTMLInputElement | null>(null)

function triggerImageInput() { imageInputRef.value?.click() }

function onImagesSelected(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  for (const file of files) {
    newImageFiles.value.push(file)
    newImagePreviews.value.push(URL.createObjectURL(file))
    newImageProgress.value.push(0)
  }
  if (imageInputRef.value) imageInputRef.value.value = ''
}

function removeExistingImage(imgId: string) {
  deletingImageIds.value.push(imgId)
  editingImages.value = editingImages.value.filter(img => img.id !== imgId)
}

function removeNewImage(index: number) {
  URL.revokeObjectURL(newImagePreviews.value[index])
  newImageFiles.value.splice(index, 1)
  newImagePreviews.value.splice(index, 1)
  newImageProgress.value.splice(index, 1)
}

onUnmounted(() => { newImagePreviews.value.forEach(u => URL.revokeObjectURL(u)) })

// ── Form modal ───────────────────────────────────────────
type GearForm = {
  name: string; weight: string; note: string; category: string
  quantity: number; brand: string; referenceUrl: string; price: string; addedAt: string
  status: GearStatus
}

const showForm  = ref(false)
const editingId = ref<string | null>(null)
const saving    = ref(false)
const apiError  = ref<string | null>(null)

const today = () => new Date().toISOString().slice(0, 10)

const statusOptions: { value: GearStatus; label: string }[] = [
  { value: 'owned',    label: '已擁有' },
  { value: 'wishlist', label: '願望清單' },
  { value: 'abandon',  label: '已淘汰' },
  { value: 'other',    label: '未分組' },
]

const blankForm = (): GearForm => ({
  name: '', weight: '', note: '', category: '其他',
  quantity: 1, brand: '', referenceUrl: '', price: '', addedAt: today(),
  status: 'other',
})

const formErrors = computed(() => {
  const e: Partial<Record<'weight' | 'price' | 'referenceUrl', string>> = {}
  const w = form.value.weight.trim()
  if (w !== '' && (isNaN(Number(w)) || Number(w) < 0))
    e.weight = '重量需為有效數字'
  const p = form.value.price.trim()
  if (p !== '' && (isNaN(Number(p)) || Number(p) < 0))
    e.price = '價格需為有效數字'
  const url = form.value.referenceUrl.trim()
  if (url && !/^https?:\/\//.test(url))
    e.referenceUrl = '需以 http:// 或 https:// 開頭'
  return e
})
const hasFormErrors = computed(() => Object.keys(formErrors.value).length > 0)
const form = ref<GearForm>(blankForm())

function openCreate() {
  editingId.value      = null
  form.value           = blankForm()
  editingImages.value    = []
  deletingImageIds.value = []
  newImageFiles.value    = []
  newImagePreviews.value = []
  newImageProgress.value = []
  loadingImages.value    = false
  apiError.value         = null
  showForm.value         = true
}

function openEdit(gear: Gear) {
  router.push(`/gear-library/edit/${gear.id}`)
}

function closeForm() {
  newImagePreviews.value.forEach(u => URL.revokeObjectURL(u))
  newImageFiles.value    = []
  newImagePreviews.value = []
  newImageProgress.value = []
  deletingImageIds.value = []
  editingImages.value    = []
  loadingImages.value    = false
  showForm.value         = false
}

async function submitForm() {
  if (!form.value.name.trim() || hasFormErrors.value) return
  saving.value   = true
  apiError.value = null
  try {
    const payload = {
      name:         form.value.name.trim(),
      weight:       form.value.weight.trim() ? Number(form.value.weight) : 0,
      note:         form.value.note,
      category:     form.value.category,
      quantity:     form.value.quantity ?? 1,
      brand:        form.value.brand || null,
      referenceUrl: form.value.referenceUrl.trim() || null,
      price:        form.value.price.trim() ? Number(form.value.price) : null,
      addedAt:      form.value.addedAt || null,
      status:       form.value.status,
      isWishlist:   form.value.status === 'wishlist',
    }
    let gearId: string
    if (editingId.value) {
      await store.updateLibraryGear(editingId.value, payload)
      gearId = editingId.value
    } else {
      gearId = await store.createLibraryGear(payload)
    }
    for (const imgId of deletingImageIds.value) {
      await store.deleteGearImage(gearId, imgId)
    }
    for (let i = 0; i < newImageFiles.value.length; i++) {
      await store.uploadGearImageWithProgress(gearId, newImageFiles.value[i], (pct) => {
        newImageProgress.value[i] = pct
      })
    }
    delete gearImages.value[gearId]
    closeForm()
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
