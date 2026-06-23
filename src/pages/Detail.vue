<template>
  <div class="min-h-screen flex flex-col textured-bg vignette">

    <div v-if="store.loading" class="flex items-center justify-center flex-1">
      <div class="card-aged px-8 py-5 flex items-center gap-3 font-body text-inkMuted">
        <div class="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" />
        載入中…
      </div>
    </div>

    <div v-else-if="store.error" class="flex-1 flex items-center justify-center font-body" style="color: #e07070;">
      {{ store.error }}
    </div>

    <template v-else-if="store.currentPost">

      <!-- Header -->
      <header class="shrink-0 px-[5vw] pt-5 pb-4 border-b"
        style="border-color: color-mix(in srgb, var(--c-border) 50%, transparent);">

        <!-- Row 1: back + edit -->
        <div class="flex items-center justify-between mb-3">
          <button
            class="card-aged text-inkMuted hover:text-ink flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
            @click="$router.push('/')"
          >
            <ArrowLeftIcon :size="15" />
            返回
          </button>
          <div class="flex items-center gap-2">
            <button
              v-if="auth.user"
              @click="toggleVisibility"
              :class="store.currentPost!.isPublic
                ? 'card-aged text-inkMuted hover:text-ink'
                : 'btn-cta'"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
            >
              <EyeOffIcon v-if="store.currentPost!.isPublic" :size="14" />
              <GlobeIcon  v-else :size="14" />
              {{ store.currentPost!.isPublic ? '取消公開' : '公開發布' }}
            </button>
            <router-link
              v-if="auth.user"
              :to="`/edit/${store.currentPost!.id}`"
              class="card-aged text-inkMuted hover:text-ink flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
            >
              <PencilIcon :size="14" />
              編輯
            </router-link>
            <button
              class="card-aged text-inkMuted hover:text-ink flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
              @click="showExportModal = true"
            >
              <DownloadIcon :size="14" />
              匯出
            </button>
          </div>
        </div>

        <!-- Row 2: label + title -->
        <p class="text-[10px] font-body tracking-[0.25em] uppercase mb-1" style="color: var(--c-primary); opacity: 0.6;">
          Expedition Record
        </p>
        <h1 class="font-heading text-2xl sm:text-3xl font-bold text-ink leading-tight mb-3">
          {{ store.currentPost.title }}
        </h1>

        <!-- Row 3: meta chips -->
        <div v-if="hasMeta" class="flex flex-wrap items-center gap-2">
          <div v-if="dateRange" class="meta-chip">
            <CalendarIcon :size="11" class="meta-chip-icon" />
            <span class="font-mono text-[11px]">{{ dateRange }}</span>
          </div>
          <div v-if="tripDays" class="meta-chip">
            <SunriseIcon :size="11" class="meta-chip-icon" />
            <span>{{ tripDays }} 天</span>
          </div>
          <div v-if="store.currentPost.weather" class="meta-chip">
            <CloudIcon :size="11" class="meta-chip-icon" />
            <span>{{ store.currentPost.weather }}</span>
          </div>
          <div v-if="store.currentPost.peopleCount" class="meta-chip">
            <UsersIcon :size="11" class="meta-chip-icon" />
            <span>{{ store.currentPost.peopleCount }} 人</span>
          </div>
          <div v-if="store.currentPost.difficultyStars" class="meta-chip">
            <span class="text-primary" style="font-size:11px;letter-spacing:-1px;">{{ '★'.repeat(store.currentPost.difficultyStars) }}</span>
          </div>
        </div>
      </header>

      <!-- Three-column layout -->
      <div class="relative z-10 flex flex-1 overflow-hidden px-[5vw] pt-6 pb-[30vh]">

        <!-- ① Left sidebar — tab navigation -->
        <nav
          class="w-[72px] shrink-0 flex flex-col pt-5 pb-4 gap-1 pr-3"
          style="border-right: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);"
        >
          <button
            v-for="nav in navTabs"
            :key="nav.key"
            class="relative flex flex-col items-center gap-1.5 py-3 transition-all duration-200 cursor-pointer rounded-r-sm"
            :style="activeTab === nav.key ? 'color: var(--c-primary);' : 'color: var(--c-inkMuted);'"
            @click="setTab(nav.key)"
          >
            <!-- Left indicator line -->
            <span
              v-if="activeTab === nav.key"
              class="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
              style="background: var(--c-primary);"
            />
            <component :is="nav.icon" :size="18" />
            <span class="text-[10px] font-body tracking-wide">{{ nav.label }}</span>
          </button>
        </nav>

        <!-- ② Center — main content -->
        <main class="flex-1 flex flex-col overflow-hidden relative">

          <!-- Top bar: always visible -->
          <div class="shrink-0"
            style="border-bottom: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);">

            <!-- Row 1: tags + right actions -->
            <div class="flex items-center gap-2 px-4 py-2 flex-wrap">
              <!-- GPX record tabs (gpx tab only) -->
              <template v-if="activeTab === 'gpx'">
                <button
                  class="px-2.5 py-1 rounded-lg text-[11px] font-body transition-colors duration-150 cursor-pointer"
                  :style="activeGpxRecordId === null
                    ? 'background: var(--c-primary); color: var(--c-base);'
                    : 'color: var(--c-inkMuted); border: 1px solid var(--c-border);'"
                  @click="activeGpxRecordId = null"
                >主要路線</button>
                <button
                  v-for="rec in store.currentGpxRecords"
                  :key="rec.id"
                  class="px-2.5 py-1 rounded-lg text-[11px] font-body transition-colors duration-150 cursor-pointer"
                  :style="activeGpxRecordId === rec.id
                    ? 'background: var(--c-primary); color: var(--c-base);'
                    : 'color: var(--c-inkMuted); border: 1px solid var(--c-border);'"
                  @click="activeGpxRecordId = rec.id"
                >{{ rec.name }}</button>
                <button
                  v-if="auth.user"
                  class="px-2 py-1 rounded-lg text-[11px] font-body transition-colors duration-150 cursor-pointer flex items-center gap-1"
                  style="color: var(--c-inkMuted); border: 1px solid var(--c-border);"
                  @click="openNewRecordModal"
                >
                  <PlusIcon :size="11" />
                  新增路線
                </button>
              </template>

              <!-- Tags (non-gpx tabs) -->
              <template v-else-if="store.currentPost?.tags?.length">
                <span
                  v-for="tag in store.currentPost.tags"
                  :key="tag"
                  class="px-2.5 py-1 rounded-full text-[10px] font-body tracking-wide border"
                  style="color: var(--c-primary); border-color: color-mix(in srgb, var(--c-primary) 35%, transparent); background: color-mix(in srgb, var(--c-primary) 8%, transparent);"
                >{{ tag }}</span>
              </template>

              <!-- Right-side actions -->
              <div class="ml-auto flex items-center gap-2 shrink-0">
                <!-- Reset favourites (photos tab only) -->
                <button
                  v-if="activeTab === 'photos' && galleryRef?.hasFavorites"
                  class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
                  style="color: var(--c-inkMuted); border: 1px solid var(--c-border);"
                  @click="galleryRef?.resetFavorites()"
                >
                  <StarOffIcon :size="12" />
                  重置喜愛
                </button>

                <!-- Edit gears button (gears tab only) -->
                <button
                  v-if="auth.user && activeTab === 'gears'"
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
                  :style="gearEditMode
                    ? 'background: var(--c-primary); color: var(--c-base); border: 1px solid var(--c-primary);'
                    : 'color: var(--c-inkMuted); border: 1px solid var(--c-border);'"
                  @click="gearEditMode = !gearEditMode"
                >
                  <PencilIcon :size="13" />
                  <span>編輯裝備</span>
                </button>

                <!-- Edit route (both main and additional records) -->
                <button
                  v-if="auth.user && activeTab === 'gpx' && (activeGpxRecordId !== null || store.currentPost?.gpxFile)"
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
                  style="color: var(--c-inkMuted); border: 1px solid var(--c-border);"
                  @click="openEditRecordModal"
                >
                  <PencilIcon :size="13" />
                  <span>編輯路線</span>
                </button>

                <!-- Reupload GPX button -->
                <button
                  v-if="auth.user && activeTab === 'gpx' && (activeGpxRecordId !== null || store.currentPost?.gpxFile)"
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
                  style="color: var(--c-inkMuted); border: 1px solid var(--c-border);"
                  @click="activeGpxRecordId !== null ? openRerouteModal() : openGpxModal()"
                >
                  <UploadIcon :size="13" />
                  <span>重新上傳</span>
                </button>

                <!-- Edit foods button (foods tab only) -->
                <button
                  v-if="auth.user && activeTab === 'foods'"
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
                  :style="foodEditMode
                    ? 'background: var(--c-primary); color: var(--c-base); border: 1px solid var(--c-primary);'
                    : 'color: var(--c-inkMuted); border: 1px solid var(--c-border);'"
                  @click="foodEditMode = !foodEditMode"
                >
                  <PencilIcon :size="13" />
                  <span>編輯糧食</span>
                </button>

                <!-- Sidebar collapse toggle -->
                <button
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
                  style="color: var(--c-inkMuted); border: 1px solid var(--c-border);"
                  @click="sidebarOpen = !sidebarOpen"
                >
                  <template v-if="sidebarOpen">
                    <ChevronsRightIcon :size="13" />
                    <span>收起</span>
                  </template>
                  <template v-else>
                    <ChevronsLeftIcon :size="13" />
                    <span>行程資訊</span>
                  </template>
                </button>
              </div>
            </div>

            <!-- Row 2: route description (gpx only, has description) -->
            <div
              v-if="activeTab === 'gpx' && activeRouteDescription"
              class="px-4 py-3 flex flex-col gap-2"
              style="border-top: 1px solid color-mix(in srgb, var(--c-border) 30%, transparent);"
            >
              <div class="flex items-center gap-1.5">
                <AlignLeftIcon :size="11" style="color: var(--c-primary); opacity: 0.7;" />
                <span class="text-[10px] font-body uppercase tracking-[0.18em]" style="color: var(--c-primary); opacity: 0.7;">路線說明</span>
              </div>
              <span class="font-body text-sm text-inkMuted leading-relaxed">{{ activeRouteDescription }}</span>
            </div>

            <!-- Row 3: map layer toggles (gpx only, has url) -->
            <div
              v-if="activeTab === 'gpx' && activeGpxUrl"
              class="flex items-center gap-2 px-4 py-2"
              style="border-top: 1px solid color-mix(in srgb, var(--c-border) 30%, transparent);"
            >
              <button
                v-for="tog in mapToggles"
                :key="tog.key"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
                :style="tog.active.value
                  ? 'background: var(--c-primary); color: var(--c-base); border: 1px solid var(--c-primary);'
                  : 'background: transparent; color: var(--c-inkMuted); border: 1px solid var(--c-border);'"
                @click="tog.active.value = !tog.active.value"
              >
                <component :is="tog.icon" :size="12" />
                {{ tog.label }}
              </button>
            </div>
          </div>

          <!-- Content area -->
          <div
            ref="contentScrollRef"
            class="flex-1 min-h-0"
            :class="activeTab !== 'gpx' ? 'overflow-y-auto p-6' : 'overflow-y-auto'"
          >
            <PhotoGallery
              v-if="activeTab === 'photos'"
              ref="galleryRef"
              :photos="store.currentPhotos"
            />

            <template v-else-if="activeTab === 'gpx'">

              <!-- No GPX: upload prompt (main record only) -->
              <div
                v-if="activeGpxRecordId === null && !store.currentPost?.gpxFile"
                class="flex flex-col items-center justify-center gap-6 p-16 h-full"
              >
                <div
                  class="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style="background: color-mix(in srgb, var(--c-primary) 10%, transparent); border: 1px solid color-mix(in srgb, var(--c-primary) 25%, transparent);"
                >
                  <UploadIcon :size="32" style="color: var(--c-primary); opacity: 0.7;" />
                </div>
                <div class="text-center">
                  <p class="font-heading text-xl text-ink mb-1.5">尚未上傳 GPX 路線</p>
                  <p class="text-sm font-body text-inkMuted opacity-60">上傳 .gpx 檔案以顯示地圖與記錄點</p>
                </div>
                <button
                  class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-body cursor-pointer btn-cta transition-colors duration-150"
                  @click="openGpxModal"
                >
                  <UploadIcon :size="14" />
                  上傳 GPX
                </button>
              </div>

              <!-- Map (fixed height so Leaflet renders correctly) -->
              <GpxViewer
                v-else-if="activeGpxUrl"
                ref="gpxViewerRef"
                data-gpx-map
                style="height: 100vh;"
                :key="activeGpxUrl"
                :gpx-url="activeGpxUrl"
                :show-peaks="showPeaks"
                :show-waypoints="showWaypoints"
                :show-shelters="showShelters"
                :overrides="activeOverrides"
                :add-mode="addingWpt"
                @waypoints-ready="gpxWaypoints = $event"
                @add-waypoint="onMapClick"
              />

              <!-- Waypoint list below the map -->
              <div v-if="activeGpxUrl" class="p-6">
                <div class="flex items-center gap-2 mb-4">
                  <MapPinIcon :size="14" class="text-primary opacity-70" />
                  <span class="text-[10px] font-body uppercase tracking-[0.2em] text-inkMuted">記錄點</span>
                  <span v-if="gpxWaypoints.length" class="font-mono text-[10px] text-inkMuted opacity-50">{{ gpxWaypoints.length }}</span>
                  <div class="ml-auto flex items-center gap-2">
                    <button
                      v-if="auth.user && gpxWaypoints.length > 0"
                      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
                      style="background: transparent; color: var(--c-inkMuted); border: 1px solid var(--c-border);"
                      @click="openBatchHide"
                    >
                      <EyeOffIcon :size="12" />
                      批次顯示/隱藏
                    </button>
                    <button
                      v-if="auth.user"
                      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
                      :style="addingWpt
                        ? 'background: var(--c-cta); color: #fff; border: 1px solid var(--c-cta);'
                        : 'background: transparent; color: var(--c-inkMuted); border: 1px solid var(--c-border);'"
                      @click="toggleAddMode"
                    >
                      <PlusIcon :size="12" />
                      {{ addingWpt ? '點擊地圖選點…' : '新增記錄點' }}
                    </button>
                  </div>
                </div>

                <div class="flex gap-4 overflow-x-auto pb-2 pl-2">
                  <div
                    v-for="([date, wpts]) in groupedWaypoints"
                    :key="date"
                    class="flex-none w-64 flex flex-col gap-3"
                  >
                    <!-- Date header -->
                    <p class="text-[10px] font-mono tracking-wider text-inkMuted opacity-60 pb-1"
                      style="border-bottom: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);">
                      {{ date }}
                    </p>

                    <!-- Waypoint cards for this date -->
                    <div
                      v-for="(wpt, i) in wpts"
                      :key="i"
                      class="card-aged rounded-xl p-4 space-y-2.5 cursor-pointer select-none transition-all duration-200"
                      :class="[
                        wpt.hidden ? 'opacity-35 grayscale-[40%]' : '',
                        selectedWpt === wpt ? 'wpt-card-selected' : 'hover:ring-1',
                      ]"
                      :style="selectedWpt !== wpt ? '--tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);' : ''"
                      @click="onWptClick(wpt)"
                      @dblclick="onWptDblClick(wpt)"
                    >
                      <p class="font-heading text-sm font-semibold text-ink leading-snug truncate">
                        {{ wpt.name || '未命名' }}
                      </p>
                      <p v-if="wpt.desc" class="text-[11px] font-body text-inkMuted italic leading-relaxed">
                        {{ wpt.desc }}
                      </p>
                      <div class="flex flex-wrap gap-1.5">
                        <span v-if="wpt.ele !== null"
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px]"
                          style="background: color-mix(in srgb, var(--c-primary) 10%, transparent); color: var(--c-primary);">
                          {{ wpt.ele }} m
                        </span>
                        <span
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] text-inkMuted"
                          style="background: color-mix(in srgb, var(--c-surface) 60%, transparent);">
                          {{ wpt.lat.toFixed(5) }}, {{ wpt.lng.toFixed(5) }}
                        </span>
                      </div>
                      <p v-if="wpt.time" class="text-[10px] font-mono text-inkMuted opacity-60">
                        {{ formatWptTime(wpt.time) }}
                      </p>
                      <Transition name="wpt-hint">
                        <p v-if="auth.user && hintWpt === wpt" class="text-[10px] font-body text-inkMuted opacity-60 tracking-wide">
                          ✦ 雙擊進入編輯
                        </p>
                      </Transition>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <GearEditor
              v-else-if="activeTab === 'gears'"
              v-model:editing="gearEditMode"
              :gears="store.currentGears"
              :post-id="store.currentPost!.id"
            />

            <FoodDayPlanner
              v-else-if="activeTab === 'foods'"
              v-model:editing="foodEditMode"
              :foods="store.currentFoods"
              :post-id="store.currentPost!.id"
              :date-start="store.currentPost?.dateStart"
              :date-end="store.currentPost?.dateEnd"
            />
          </div>
        </main>

        <!-- ③ Right sidebar — trip info (collapsible) -->
        <aside
          class="shrink-0 overflow-hidden transition-[width] duration-300"
          :style="`width: ${sidebarOpen ? '240px' : '0px'}; border-left: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);`"
        >
        <div class="w-[240px] overflow-y-auto p-5 h-full">
          <!-- Meta info -->
          <div v-if="hasMeta" class="mb-5">
            <p class="text-[9px] font-body uppercase tracking-[0.2em] text-inkMuted opacity-50 mb-3">行程資訊</p>
            <div class="space-y-2.5">
              <div v-if="dateRange" class="meta-item">
                <CalendarIcon :size="13" class="meta-icon" />
                <span class="meta-value font-mono text-xs">{{ dateRange }}</span>
              </div>
              <div v-if="tripDays" class="meta-item">
                <SunriseIcon :size="13" class="meta-icon" />
                <span class="meta-label">天數</span>
                <span class="meta-value">{{ tripDays }} 天</span>
              </div>
              <div v-if="store.currentPost.weather" class="meta-item">
                <CloudIcon :size="13" class="meta-icon" />
                <span class="meta-label">天氣</span>
                <span class="meta-value">{{ store.currentPost.weather }}</span>
              </div>
              <div v-if="store.currentPost.peopleCount" class="meta-item">
                <UsersIcon :size="13" class="meta-icon" />
                <span class="meta-label">人數</span>
                <span class="meta-value">{{ store.currentPost.peopleCount }} 人</span>
              </div>
              <div v-if="store.currentPost.difficultyStars" class="meta-item">
                <span class="meta-icon text-primary" style="font-size:13px;line-height:1;">★</span>
                <span class="meta-label">難度</span>
                <span class="meta-value text-primary" style="letter-spacing:-1px;">{{ '★'.repeat(store.currentPost.difficultyStars) }}</span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div
            v-if="store.currentPost.description"
            :class="hasMeta ? 'pt-5' : ''"
            :style="hasMeta ? 'border-top: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);' : ''"
          >
            <p class="text-[9px] font-body uppercase tracking-[0.2em] text-inkMuted opacity-50 mb-3">描述</p>
            <p class="text-sm font-body italic text-inkMuted leading-relaxed">
              {{ store.currentPost.description }}
            </p>
          </div>
        </div>
        </aside>

      </div>
    </template>

    <!-- ── Waypoint Edit Modal ──────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="export-fade">
        <div
          v-if="editingWpt"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: color-mix(in srgb, var(--c-base) 60%, transparent); backdrop-filter: blur(4px);"
          @click.self="editingWpt = null"
          @keydown.esc="editingWpt = null"
        >
          <div class="card-aged rounded-xl shadow-xl overflow-hidden flex w-full" style="max-width: 26rem;">

            <!-- Main form area -->
            <div class="flex-1 p-6 space-y-4 min-w-0">

              <!-- Header: title + X close -->
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2.5 min-w-0">
                  <MapPinIcon :size="15" class="text-primary opacity-80 shrink-0" />
                  <span class="font-heading text-lg text-ink tracking-wide truncate">編輯記錄點</span>
                </div>
                <button class="wpt-close-btn shrink-0" @click="editingWpt = null">
                  <XIcon :size="12" />
                </button>
              </div>

              <!-- Read-only info chips -->
              <div class="flex flex-wrap gap-1.5">
                <span v-if="editingWpt.ele !== null"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px]"
                  style="background: color-mix(in srgb, var(--c-primary) 10%, transparent); color: var(--c-primary);">
                  {{ editingWpt.ele }} m
                </span>
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] text-inkMuted"
                  style="background: color-mix(in srgb, var(--c-surface) 60%, transparent);">
                  {{ editingWpt.lat.toFixed(5) }}, {{ editingWpt.lng.toFixed(5) }}
                </span>
                <span v-if="editingWpt.time"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] text-inkMuted"
                  style="background: color-mix(in srgb, var(--c-surface) 60%, transparent);">
                  {{ formatWptTime(editingWpt.time) }}
                </span>
              </div>

              <!-- Name field -->
              <div class="space-y-1.5">
                <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">名稱</label>
                <input
                  v-model="wptDraft.name"
                  class="w-full rounded-lg px-3 py-2 text-sm font-body text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
                  style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                  placeholder="記錄點名稱"
                  @keydown.enter="saveWptEdit"
                />
              </div>

              <!-- Desc field -->
              <div class="space-y-1.5">
                <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">描述</label>
                <textarea
                  v-model="wptDraft.desc"
                  rows="3"
                  class="w-full rounded-lg px-3 py-2 text-sm font-body text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150 resize-none"
                  style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                  placeholder="備註說明"
                />
              </div>

              <!-- Date field -->
              <div class="space-y-1.5">
                <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">日期</label>
                <input
                  :value="wptDraft.wptDate"
                  type="date"
                  class="w-full rounded-lg px-3 py-2 text-sm font-mono text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
                  :style="`border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent); color-scheme: ${theme.isDark ? 'dark' : 'light'};`"
                  @change="wptDraft.wptDate = ($event.target as HTMLInputElement).value"
                />
              </div>

              <!-- Error message -->
              <p v-if="wptError" class="text-xs font-body text-red-400">{{ wptError }}</p>

              <!-- Save button -->
              <button
                class="w-full py-2 rounded-lg text-sm font-semibold font-body cursor-pointer btn-cta transition-colors duration-150 flex items-center justify-center gap-2"
                :disabled="wptSaving"
                @click="saveWptEdit"
              >
                <div v-if="wptSaving" class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {{ wptSaving ? '儲存中…' : '儲存' }}
              </button>

            </div>

            <!-- Right action strip -->
            <div
              class="shrink-0 flex flex-col items-center gap-3 py-6 px-3"
              style="border-left: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);"
            >
              <button
                class="wpt-action-btn"
                :title="editingWpt?.hidden ? '顯示記錄點' : '隱藏記錄點'"
                :disabled="wptSaving"
                @click="editingWpt && toggleWptHidden(editingWpt); editingWpt = null"
              >
                <EyeIcon v-if="editingWpt?.hidden" :size="16" />
                <EyeOffIcon v-else :size="16" />
              </button>
              <button
                v-if="editingWpt && isCustomWpt(editingWpt)"
                class="wpt-action-btn danger"
                title="刪除記錄點"
                :disabled="wptSaving"
                @click="editingWpt && deleteWpt(editingWpt); editingWpt = null"
              >
                <Trash2Icon :size="16" />
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Add Waypoint Modal ────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="export-fade">
        <div
          v-if="showAddWptModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: color-mix(in srgb, var(--c-base) 60%, transparent); backdrop-filter: blur(4px);"
          @click.self="showAddWptModal = false"
          @keydown.esc="showAddWptModal = false"
        >
          <div class="card-aged rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4">

            <!-- Header -->
            <div class="flex items-center gap-2.5">
              <PlusIcon :size="15" class="text-primary opacity-80" />
              <span class="font-heading text-lg text-ink tracking-wide">新增記錄點</span>
            </div>

            <!-- Lat/Lng fields -->
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">緯度</label>
                <input
                  v-model="newWptDraft.lat"
                  type="number"
                  step="0.000001"
                  class="w-full rounded-lg px-3 py-2 text-sm font-mono text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
                  style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                  placeholder="24.123456"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">經度</label>
                <input
                  v-model="newWptDraft.lng"
                  type="number"
                  step="0.000001"
                  class="w-full rounded-lg px-3 py-2 text-sm font-mono text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
                  style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                  placeholder="121.123456"
                />
              </div>
            </div>

            <!-- Name field -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">名稱</label>
              <input
                v-model="newWptDraft.name"
                class="w-full rounded-lg px-3 py-2 text-sm font-body text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
                style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                placeholder="記錄點名稱"
              />
            </div>

            <!-- Desc field -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">描述</label>
              <textarea
                v-model="newWptDraft.desc"
                rows="2"
                class="w-full rounded-lg px-3 py-2 text-sm font-body text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150 resize-none"
                style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                placeholder="備註說明"
              />
            </div>

            <!-- Date field -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">日期</label>
              <input
                :value="newWptDraft.wptDate"
                type="date"
                class="w-full rounded-lg px-3 py-2 text-sm font-mono text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
                :style="`border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent); color-scheme: ${theme.isDark ? 'dark' : 'light'};`"
                @change="newWptDraft.wptDate = ($event.target as HTMLInputElement).value"
              />
            </div>

            <!-- Error message -->
            <p v-if="addWptError" class="text-xs font-body text-red-400">{{ addWptError }}</p>

            <!-- Footer buttons -->
            <div class="flex gap-2 pt-1">
              <button
                class="flex-1 py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-150 border"
                style="color: var(--c-inkMuted); border-color: var(--c-border);"
                :disabled="addWptSaving"
                @click="showAddWptModal = false"
              >取消</button>
              <button
                class="flex-1 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer btn-cta transition-colors duration-150 flex items-center justify-center gap-2"
                :disabled="addWptSaving"
                @click="createWpt"
              >
                <div v-if="addWptSaving" class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {{ addWptSaving ? '新增中…' : '新增' }}
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── GPX Upload Modal ──────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="export-fade">
        <div
          v-if="showGpxUploadModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: color-mix(in srgb, var(--c-base) 60%, transparent); backdrop-filter: blur(4px);"
          @click.self="showGpxUploadModal = false"
          @keydown.esc="showGpxUploadModal = false"
        >
          <div class="card-aged rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4">

            <!-- Header: tabs + close -->
            <div class="flex items-center justify-between">
              <div class="flex gap-1 p-0.5 rounded-lg" style="background: color-mix(in srgb, var(--c-border) 40%, transparent);">
                <button
                  class="px-3 py-1 rounded-md text-xs font-body transition-colors duration-150 cursor-pointer"
                  :class="gpxUploadTab === 'upload' ? 'btn-cta' : 'text-inkMuted hover:text-ink'"
                  @click="gpxUploadTab = 'upload'"
                ><UploadIcon :size="11" class="inline mr-1" />上傳檔案</button>
                <button
                  class="px-3 py-1 rounded-md text-xs font-body transition-colors duration-150 cursor-pointer"
                  :class="gpxUploadTab === 'import' ? 'btn-cta' : 'text-inkMuted hover:text-ink'"
                  @click="gpxUploadTab = 'import'; gpxLibStore.fetchGpxLibrary()"
                ><BookOpenIcon :size="11" class="inline mr-1" />從 GPX 收藏匯入</button>
              </div>
              <button class="wpt-close-btn" @click="showGpxUploadModal = false">
                <XIcon :size="12" />
              </button>
            </div>

            <!-- ── Upload tab ── -->
            <template v-if="gpxUploadTab === 'upload'">
              <div v-if="gpxModalIsNewRecord" class="space-y-1.5">
                <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">路線名稱</label>
                <input
                  v-model="gpxRecordName"
                  class="w-full rounded-lg px-3 py-2 text-sm font-body text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
                  style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                  placeholder="留空預設為「新路線」"
                />
              </div>
              <label
                class="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors duration-150 py-10"
                :style="gpxUploadFile
                  ? 'border-color: var(--c-primary); background: color-mix(in srgb, var(--c-primary) 6%, transparent);'
                  : 'border-color: var(--c-border); background: transparent;'"
              >
                <UploadIcon
                  :size="28"
                  :style="gpxUploadFile ? 'color: var(--c-primary);' : 'color: var(--c-inkMuted); opacity: 0.4;'"
                />
                <div class="text-center">
                  <p class="text-sm font-body" :style="gpxUploadFile ? 'color: var(--c-primary);' : 'color: var(--c-inkMuted);'">
                    {{ gpxUploadFile ? gpxUploadFile.name : '點擊選擇 .gpx 檔案' }}
                  </p>
                  <p v-if="!gpxUploadFile" class="text-[11px] font-body text-inkMuted opacity-50 mt-1">或拖曳至此</p>
                </div>
                <input
                  type="file"
                  accept=".gpx,application/gpx+xml"
                  class="hidden"
                  @change="gpxUploadFile = ($event.target as HTMLInputElement).files?.[0] ?? null"
                />
              </label>
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" v-model="syncToLibrary" class="rounded accent-primary" />
                <span class="text-xs font-body text-inkMuted">同步加入到 GPX 收藏</span>
              </label>
              <p v-if="gpxUploadError" class="text-xs font-body text-red-400 break-all">{{ gpxUploadError }}</p>
              <div class="flex gap-2">
                <button
                  class="flex-1 py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-150 border"
                  style="color: var(--c-inkMuted); border-color: var(--c-border);"
                  :disabled="gpxUploading"
                  @click="showGpxUploadModal = false"
                >取消</button>
                <button
                  class="flex-1 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer btn-cta transition-colors duration-150 flex items-center justify-center gap-2"
                  :disabled="!gpxUploadFile || gpxUploading"
                  @click="gpxModalIsNewRecord ? addGpxRecord() : gpxModalRerouteRecordId ? rerouteRecord() : uploadGpx()"
                >
                  <div v-if="gpxUploading" class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {{ gpxUploading ? '上傳中…' : (gpxModalIsNewRecord ? '新增' : '上傳') }}
                </button>
              </div>
            </template>

            <!-- ── Import tab ── -->
            <template v-else>
              <div v-if="gpxModalIsNewRecord" class="space-y-1.5">
                <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">紀錄名稱</label>
                <input
                  v-model="gpxRecordName"
                  class="w-full rounded-lg px-3 py-2 text-sm font-body text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
                  style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                  placeholder="留空預設為「新路線」"
                />
              </div>
              <div class="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                <div v-if="gpxLibStore.loading" class="py-8 text-center text-inkMuted font-body text-sm">載入中…</div>
                <div v-else-if="gpxLibStore.gpxLibrary.length === 0" class="py-8 text-center text-inkMuted font-body text-sm">GPX 收藏為空</div>
                <button
                  v-for="entry in gpxLibStore.gpxLibrary"
                  :key="entry.id"
                  class="w-full text-left px-3 py-2.5 rounded-lg card-aged cursor-pointer transition-colors duration-150 hover:border-primary disabled:opacity-50"
                  :disabled="gpxImporting"
                  @click="(gpxModalIsNewRecord || gpxModalRerouteRecordId) ? importRecordFromLibrary(entry) : importGpxFromLibrary(entry)"
                >
                  <p class="font-body text-sm text-ink leading-snug">{{ entry.name }}</p>
                  <p class="font-mono text-[10px] text-inkMuted mt-0.5">
                    {{ entry.date ?? '—' }}<span v-if="entry.category"> · {{ entry.category }}</span>
                  </p>
                </button>
              </div>
              <p v-if="gpxImportError" class="text-xs font-body text-red-400 break-all">{{ gpxImportError }}</p>
              <button
                class="w-full py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-150 border"
                style="color: var(--c-inkMuted); border-color: var(--c-border);"
                :disabled="gpxImporting"
                @click="showGpxUploadModal = false"
              >取消</button>
            </template>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Edit Route Modal ─────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="export-fade">
        <div
          v-if="showEditRecordModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: color-mix(in srgb, var(--c-base) 60%, transparent); backdrop-filter: blur(4px);"
          @click.self="showEditRecordModal = false"
          @keydown.esc="showEditRecordModal = false"
        >
          <div class="card-aged rounded-xl p-6 w-full max-w-lg shadow-xl space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <PencilIcon :size="15" class="text-primary opacity-80" />
                <span class="font-heading text-lg text-ink tracking-wide">編輯路線</span>
              </div>
              <button class="wpt-close-btn" @click="showEditRecordModal = false">
                <XIcon :size="12" />
              </button>
            </div>
            <div v-if="!editingMainRoute" class="space-y-1.5">
              <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">路線名稱</label>
              <input
                v-model="editRecordName"
                class="w-full rounded-lg px-3 py-2 text-sm font-body text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
                style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                placeholder="路線名稱"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">說明</label>
              <textarea
                v-model="editRecordDescription"
                rows="10"
                class="w-full rounded-lg px-3 py-2 text-sm font-body text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150 resize-none"
                style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                placeholder="路線說明（選填）"
              />
            </div>
            <p v-if="editRecordError" class="text-xs font-body text-red-400">{{ editRecordError }}</p>
            <div class="flex gap-2">
              <button
                class="flex-1 py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-150 border"
                style="color: var(--c-inkMuted); border-color: var(--c-border);"
                :disabled="editRecordSaving"
                @click="showEditRecordModal = false"
              >取消</button>
              <button
                class="flex-1 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer btn-cta transition-colors duration-150 flex items-center justify-center gap-2"
                :disabled="editRecordSaving"
                @click="saveRecordEdit"
              >
                <div v-if="editRecordSaving" class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {{ editRecordSaving ? '儲存中…' : '儲存' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Export Modal ─────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="export-fade">
        <div
          v-if="showExportModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: color-mix(in srgb, var(--c-base) 60%, transparent); backdrop-filter: blur(4px);"
          @click.self="showExportModal = false"
          @keydown.esc="showExportModal = false"
        >
          <div class="card-aged rounded-xl p-6 w-full max-w-sm shadow-xl">

            <!-- Header -->
            <div class="flex items-center gap-2.5 mb-5">
              <DownloadIcon :size="16" class="text-primary" />
              <span class="font-heading text-lg text-ink tracking-wide">匯出記錄</span>
            </div>

            <!-- Format selection -->
            <p class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted mb-2.5">匯出格式</p>
            <div class="flex gap-2 mb-5">
              <button
                v-for="fmt in (['json', 'pdf'] as const)"
                :key="fmt"
                class="flex-1 py-2 rounded-lg text-sm font-mono font-semibold border cursor-pointer transition-all duration-150"
                :style="exportFormat === fmt
                  ? 'background: var(--c-primary); color: var(--c-base); border-color: var(--c-primary);'
                  : 'background: transparent; color: var(--c-inkMuted); border-color: var(--c-border);'"
                @click="exportFormat = fmt"
              >
                .{{ fmt }}
              </button>
            </div>

            <!-- Include gears toggle -->
            <label class="flex items-center gap-3 cursor-pointer select-none mb-6 group">
              <div
                class="w-10 h-5 rounded-full relative transition-colors duration-200 shrink-0"
                :style="includeGears
                  ? 'background: var(--c-primary);'
                  : 'background: color-mix(in srgb, var(--c-border) 80%, transparent);'"
                @click="includeGears = !includeGears"
              >
                <div
                  class="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
                  :style="`background: var(--c-base); box-shadow: 0 1px 3px rgba(0,0,0,0.3); transform: translateX(${includeGears ? 20 : 2}px);`"
                />
              </div>
              <span class="text-sm font-body text-ink">匯出裝備清單</span>
            </label>

            <!-- Footer buttons -->
            <div class="flex gap-2">
              <button
                class="flex-1 py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-150 border"
                style="color: var(--c-inkMuted); border-color: var(--c-border);"
                @click="showExportModal = false"
              >
                取消
              </button>
              <button
                class="flex-1 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer btn-cta transition-colors duration-150"
                @click="doExport"
              >
                匯出
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Back to Top ───────────────────────────────────────────── -->
    <Transition name="export-fade">
      <button
        v-if="showBackToTop"
        class="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-colors duration-150"
        style="background: var(--c-primary); color: var(--c-base);"
        @click="scrollToTop"
      >
        <ChevronsRightIcon :size="18" style="transform: rotate(-90deg);" />
      </button>
    </Transition>

    <!-- ── Batch Hide Modal ─────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="export-fade">
        <div
          v-if="showBatchHideModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: color-mix(in srgb, var(--c-base) 60%, transparent); backdrop-filter: blur(4px);"
          @click.self="showBatchHideModal = false"
          @keydown.esc="showBatchHideModal = false"
        >
          <div class="card-aged rounded-xl shadow-xl overflow-hidden flex flex-col w-full" style="max-width: 26rem; max-height: 80vh;">

            <!-- Header -->
            <div class="flex items-center justify-between gap-2 px-6 py-4" style="border-bottom: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);">
              <div class="flex items-center gap-2">
                <EyeOffIcon :size="15" class="text-primary opacity-70" />
                <span class="font-heading text-base text-ink tracking-wide">批次顯示/隱藏</span>
              </div>
              <button
                class="w-6 h-6 rounded-full flex items-center justify-center text-inkMuted hover:text-ink transition-colors cursor-pointer"
                style="border: 1px solid var(--c-border);"
                @click="showBatchHideModal = false"
              >
                <XIcon :size="12" />
              </button>
            </div>

            <!-- Select all -->
            <div class="px-6 py-3 flex items-center gap-3" style="border-bottom: 1px solid color-mix(in srgb, var(--c-border) 30%, transparent);">
              <input
                id="batch-select-all"
                type="checkbox"
                class="w-4 h-4 cursor-pointer accent-primary"
                :checked="batchHideSelected.size === sortedWaypoints.length && sortedWaypoints.length > 0"
                :indeterminate="batchHideSelected.size > 0 && batchHideSelected.size < sortedWaypoints.length"
                @change="toggleBatchSelectAll"
              />
              <label for="batch-select-all" class="text-xs font-body text-inkMuted cursor-pointer select-none">全選</label>
              <span class="ml-auto font-mono text-[10px] text-inkMuted opacity-50">
                已選 {{ batchHideSelected.size }} / {{ sortedWaypoints.length }}
              </span>
            </div>

            <!-- Waypoint list -->
            <div class="overflow-y-auto flex-1 px-6 py-3 space-y-1">
              <label
                v-for="wpt in sortedWaypoints"
                :key="`${wpt.lat},${wpt.lng}`"
                class="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer select-none transition-colors duration-100"
                :style="batchHideSelected.has(`${wpt.lat},${wpt.lng}`)
                  ? 'background: color-mix(in srgb, var(--c-primary) 8%, transparent);'
                  : 'background: transparent;'"
              >
                <input
                  type="checkbox"
                  class="w-4 h-4 cursor-pointer accent-primary shrink-0"
                  :checked="batchHideSelected.has(`${wpt.lat},${wpt.lng}`)"
                  @change="toggleBatchItem(`${wpt.lat},${wpt.lng}`)"
                />
                <div class="min-w-0 flex-1">
                  <p class="font-heading text-sm leading-snug truncate" :class="wpt.hidden ? 'text-inkMuted line-through' : 'text-ink'">{{ wpt.name || '未命名' }}</p>
                  <p class="font-mono text-[10px] text-inkMuted opacity-60">{{ wpt.lat.toFixed(5) }}, {{ wpt.lng.toFixed(5) }}</p>
                </div>
                <component
                  :is="wpt.hidden ? EyeOffIcon : EyeIcon"
                  :size="13"
                  class="shrink-0 opacity-40"
                  :class="wpt.hidden ? 'text-inkMuted' : 'text-primary'"
                />
              </label>
            </div>

            <!-- Footer -->
            <div class="flex gap-2 px-6 py-4" style="border-top: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);">
              <button
                class="flex-1 py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-150 border"
                style="color: var(--c-inkMuted); border-color: var(--c-border);"
                @click="showBatchHideModal = false"
              >
                取消
              </button>
              <button
                class="flex-1 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer btn-cta transition-colors duration-150 flex items-center justify-center gap-2"
                :disabled="batchHideSelected.size === 0 || batchHideSaving"
                @click="confirmBatchHide"
              >
                <div v-if="batchHideSaving" class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {{ batchHideSaving ? '處理中…' : `切換 ${batchHideSelected.size} 個記錄點` }}
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft as ArrowLeftIcon, Pencil as PencilIcon,
  Camera as CameraIcon, Map as MapIcon, Backpack as BackpackIcon, UtensilsCrossed as FoodIcon,
  Triangle as TriangleIcon, MapPin as MapPinIcon, Home as HomeIcon,
  Calendar as CalendarIcon, Sunrise as SunriseIcon,
  Cloud as CloudIcon, Users as UsersIcon,
  ChevronsRight as ChevronsRightIcon, ChevronsLeft as ChevronsLeftIcon,
  StarOff as StarOffIcon, Download as DownloadIcon, Upload as UploadIcon,
  Plus as PlusIcon, Eye as EyeIcon, EyeOff as EyeOffIcon, Trash2 as Trash2Icon, X as XIcon,
  BookOpen as BookOpenIcon, AlignLeft as AlignLeftIcon, Globe as GlobeIcon,
} from 'lucide-vue-next'
import PhotoGallery from '../components/PhotoGallery.vue'
import GpxViewer from '../components/GpxViewer.vue'
import GearEditor from '../components/GearEditor.vue'
import FoodDayPlanner from '../components/FoodDayPlanner.vue'
import { usePostStore } from '../stores/postStore'
import { useThemeStore } from '../stores/themeStore'
import { useGpxLibraryStore } from '../stores/gpxLibraryStore'
import { useAuthStore } from '../stores/authStore'
import type { Waypoint, GpxLibraryEntry, PostGpxRecord } from '../types'

const route       = useRoute()
const router      = useRouter()
const store       = usePostStore()
const theme       = useThemeStore()
const gpxLibStore = useGpxLibraryStore()
const auth        = useAuthStore()

const activeTab    = ref('photos')
const sidebarOpen   = ref(false)
const foodEditMode  = ref(false)
const gearEditMode  = ref(false)
const galleryRef    = ref<InstanceType<typeof PhotoGallery> | null>(null)
const gpxViewerRef  = ref<InstanceType<typeof GpxViewer> | null>(null)
const contentScrollRef = ref<HTMLElement | null>(null)
const showBackToTop    = ref(false)

function onWindowScroll() {
  const winScroll = window.scrollY
  const divScroll = contentScrollRef.value?.scrollTop ?? 0
  showBackToTop.value = winScroll > 200 || divScroll > 200
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  contentScrollRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

function setTab(key: string) {
  if (key === 'gpx') {
    sidebarOpen.value = false
    if (store.currentPost) store.fetchGpxRecords(store.currentPost.id)
  }
  if (key !== 'foods')  foodEditMode.value = false
  if (key !== 'gears')  gearEditMode.value = false
  activeTab.value = key
}
const showPeaks     = ref(true)
const showWaypoints = ref(true)
const showShelters  = ref(false)
const gpxWaypoints  = ref<Waypoint[]>([])

watch(gpxWaypoints, () => {
  selectedWpt.value = null
  hintWpt.value     = null
  if (hintTimer) { clearTimeout(hintTimer); hintTimer = null }
})

// ── Waypoint selection + edit ──────────────────────────────────────
const selectedWpt = ref<Waypoint | null>(null)
const hintWpt     = ref<Waypoint | null>(null)
let   hintTimer:  ReturnType<typeof setTimeout> | null = null
const editingWpt  = ref<Waypoint | null>(null)
const wptDraft    = ref({ name: '', desc: '', wptDate: '' })
const wptSaving   = ref(false)
const wptError    = ref<string | null>(null)

// ── Waypoint add ──────────────────────────────────────────────────
const addingWpt       = ref(false)
const showAddWptModal = ref(false)
const newWptDraft     = ref({ lat: '', lng: '', name: '', desc: '', wptDate: '' })
const addWptSaving    = ref(false)
const addWptError     = ref<string | null>(null)

// ── Batch hide ────────────────────────────────────────────────────
const showBatchHideModal = ref(false)
const batchHideSelected  = ref<Set<string>>(new Set())
const batchHideSaving    = ref(false)

function openBatchHide() {
  batchHideSelected.value = new Set()
  showBatchHideModal.value = true
}

function toggleBatchItem(key: string) {
  const s = new Set(batchHideSelected.value)
  if (s.has(key)) s.delete(key)
  else s.add(key)
  batchHideSelected.value = s
}

function toggleBatchSelectAll() {
  const all = sortedWaypoints.value
  if (batchHideSelected.value.size === all.length) {
    batchHideSelected.value = new Set()
  } else {
    batchHideSelected.value = new Set(all.map(w => `${w.lat},${w.lng}`))
  }
}

async function confirmBatchHide() {
  if (batchHideSaving.value || batchHideSelected.value.size === 0) return
  batchHideSaving.value = true
  const targets = sortedWaypoints.value.filter(w => batchHideSelected.value.has(`${w.lat},${w.lng}`))
  for (const wpt of targets) {
    await toggleWptHidden(wpt)
  }
  batchHideSaving.value = false
  showBatchHideModal.value = false
}

function onWptClick(wpt: Waypoint) {
  selectedWpt.value = wpt
  gpxViewerRef.value?.selectWaypoint(wpt.lat, wpt.lng)
  if (hintTimer) clearTimeout(hintTimer)
  hintWpt.value = wpt
  hintTimer = setTimeout(() => { hintWpt.value = null; hintTimer = null }, 3000)
}

function onWptDblClick(wpt: Waypoint) {
  if (!auth.user) return
  openWptEdit(wpt)
}

function toggleAddMode() {
  addingWpt.value = !addingWpt.value
  if (addingWpt.value) {
    const mapEl = document.querySelector('[data-gpx-map]') as HTMLElement | null
    mapEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function openWptEdit(wpt: Waypoint) {
  editingWpt.value = wpt
  wptDraft.value   = { name: wpt.name, desc: wpt.desc, wptDate: toDateInput(wpt.time) }
  wptError.value   = null
}

async function saveWptEdit() {
  if (!editingWpt.value || wptSaving.value) return
  const wpt  = editingWpt.value
  const name = wptDraft.value.name
  const desc = wptDraft.value.desc
  const { date: time, iso: timeIso } = parseDate(wptDraft.value.wptDate)
  wptSaving.value = true
  wptError.value  = null

  // Immediate UI update
  wpt.name = name
  wpt.desc = desc
  wpt.time = time
  gpxViewerRef.value?.updateWaypoint(wpt.lat, wpt.lng, name, desc, time)
  const ovList = activeOverrides.value
  const existing = ovList.find(o => Math.abs(o.lat - wpt.lat) < 1e-5 && Math.abs(o.lng - wpt.lng) < 1e-5)
  if (existing) { existing.name = name; existing.description = desc; existing.time = timeIso }
  else ovList.push({ lat: wpt.lat, lng: wpt.lng, name, description: desc, isCustom: false, hidden: false, time: timeIso })
  editingWpt.value = null

  try {
    const res = await fetch(waypointApiUrl(''), {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ lat: wpt.lat, lng: wpt.lng, name, desc, time: timeIso }),
    })
    if (!res.ok) throw new Error(`伺服器錯誤 (${res.status})`)
  } catch (e) {
    wptError.value = (e as Error).message
  } finally {
    wptSaving.value = false
  }
}

function isCustomWpt(wpt: Waypoint): boolean {
  return activeOverrides.value.some(
    o => Math.abs(o.lat - wpt.lat) < 1e-5 && Math.abs(o.lng - wpt.lng) < 1e-5 && o.isCustom
  )
}

function onMapClick(pos: { lat: number; lng: number }) {
  newWptDraft.value   = { lat: pos.lat.toFixed(6), lng: pos.lng.toFixed(6), name: '', desc: '', wptDate: '' }
  addWptError.value   = null
  showAddWptModal.value = true
  addingWpt.value     = false
}

async function createWpt() {
  if (addWptSaving.value) return
  const lat  = parseFloat(newWptDraft.value.lat)
  const lng  = parseFloat(newWptDraft.value.lng)
  if (isNaN(lat) || isNaN(lng)) { addWptError.value = '請輸入有效的座標'; return }
  const name = newWptDraft.value.name
  const desc = newWptDraft.value.desc
  const { date: time, iso: timeIso } = parseDate(newWptDraft.value.wptDate)
  addWptSaving.value = true
  addWptError.value  = null

  // Immediate UI update
  const newWpt: Waypoint = { name, desc, lat, lng, ele: null, time }
  const ovList = activeOverrides.value
  gpxWaypoints.value.push(newWpt)
  ovList.push({ lat, lng, name, description: desc, isCustom: true, hidden: false, time: timeIso })
  gpxViewerRef.value?.addWaypointMarker(lat, lng, name, desc)
  showAddWptModal.value = false

  try {
    const res = await fetch(waypointApiUrl(''), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ lat, lng, name, desc, time: timeIso }),
    })
    if (!res.ok) throw new Error(`伺服器錯誤 (${res.status})`)
  } catch (e) {
    // Rollback
    gpxWaypoints.value = gpxWaypoints.value.filter(
      w => !(Math.abs(w.lat - lat) < 1e-5 && Math.abs(w.lng - lng) < 1e-5)
    )
    const idx = ovList.findIndex(o => Math.abs(o.lat - lat) < 1e-5 && Math.abs(o.lng - lng) < 1e-5)
    if (idx !== -1) ovList.splice(idx, 1)
    gpxViewerRef.value?.removeWaypointMarker(lat, lng)
    addWptError.value = (e as Error).message
    showAddWptModal.value = true
  } finally {
    addWptSaving.value = false
  }
}

async function toggleWptHidden(wpt: Waypoint) {
  const newHidden = !wpt.hidden
  const ovList    = activeOverrides.value

  // Immediate UI update
  wpt.hidden = newHidden
  const ov = ovList.find(o => Math.abs(o.lat - wpt.lat) < 1e-5 && Math.abs(o.lng - wpt.lng) < 1e-5)
  if (ov) ov.hidden = newHidden
  else ovList.push({ lat: wpt.lat, lng: wpt.lng, name: wpt.name, description: wpt.desc, isCustom: false, hidden: newHidden })
  if (newHidden) {
    gpxViewerRef.value?.removeWaypointMarker(wpt.lat, wpt.lng)
  } else {
    gpxViewerRef.value?.addWaypointMarker(wpt.lat, wpt.lng, wpt.name, wpt.desc, isCustomWpt(wpt))
  }

  try {
    const res = await fetch(waypointApiUrl(''), {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ lat: wpt.lat, lng: wpt.lng, name: wpt.name, desc: wpt.desc, hidden: newHidden }),
    })
    if (!res.ok) throw new Error(`伺服器錯誤 (${res.status})`)
  } catch (e) { console.error(e) }
}

async function deleteWpt(wpt: Waypoint) {
  const ovList = activeOverrides.value

  // Immediate UI update
  gpxWaypoints.value = gpxWaypoints.value.filter(
    w => !(Math.abs(w.lat - wpt.lat) < 1e-5 && Math.abs(w.lng - wpt.lng) < 1e-5)
  )
  const idx = ovList.findIndex(o => Math.abs(o.lat - wpt.lat) < 1e-5 && Math.abs(o.lng - wpt.lng) < 1e-5)
  if (idx !== -1) ovList.splice(idx, 1)
  gpxViewerRef.value?.removeWaypointMarker(wpt.lat, wpt.lng)

  try {
    const res = await fetch(waypointApiUrl(''), {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ lat: wpt.lat, lng: wpt.lng }),
    })
    if (!res.ok) throw new Error(`伺服器錯誤 (${res.status})`)
  } catch (e) { console.error(e) }
}

const sortedWaypoints = computed(() =>
  [...gpxWaypoints.value].sort((a, b) => {
    if (!a.time && !b.time) return 0
    if (!a.time) return 1
    if (!b.time) return -1
    return a.time.getTime() - b.time.getTime()
  })
)

const groupedWaypoints = computed(() => {
  const map = new Map<string, Waypoint[]>()
  for (const wpt of sortedWaypoints.value) {
    const key = wpt.time
      ? wpt.time.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : '未知日期'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(wpt)
  }
  return [...map.entries()]
})

const navTabs = computed(() => {
  const p = store.currentPost
  const tabs = [{ key: 'photos', label: '照片', icon: CameraIcon }]
  if (!p || p.showGpx !== false)   tabs.push({ key: 'gpx',   label: '地圖', icon: MapIcon })
  if (!p || p.showGears !== false) tabs.push({ key: 'gears', label: '裝備', icon: BackpackIcon })
  if (!p || p.showFoods !== false) tabs.push({ key: 'foods', label: '糧食', icon: FoodIcon })
  return tabs
})

const mapToggles = [
  { key: 'peaks',     label: '山頭',    icon: TriangleIcon, active: showPeaks },
  { key: 'waypoints', label: '記錄點',  icon: MapPinIcon,   active: showWaypoints },
  { key: 'shelters',  label: '山屋',    icon: HomeIcon,     active: showShelters },
]

function fmtDate(iso: string) {
  const d = iso.slice(0, 10)
  return `${d.slice(0, 4)}/${d.slice(5, 7)}/${d.slice(8, 10)}`
}

const dateRange = computed(() => {
  const p = store.currentPost
  if (!p) return ''
  if (p.dateStart && p.dateEnd && p.dateEnd !== p.dateStart)
    return `${fmtDate(p.dateStart)} – ${fmtDate(p.dateEnd)}`
  if (p.dateStart) return fmtDate(p.dateStart)
  return ''
})

const tripDays = computed(() => {
  const p = store.currentPost
  if (!p?.dateStart || !p.dateEnd) return null
  const diff = Math.round(
    (new Date(p.dateEnd).getTime() - new Date(p.dateStart).getTime()) / 86400000
  )
  return Math.max(1, diff + 1)
})

const hasMeta = computed(() => {
  const p = store.currentPost
  return !!(dateRange.value || p?.weather || p?.peopleCount || p?.difficultyStars)
})

onMounted(async () => {
  const id = route.params.id as string
  await store.fetchPostDetail(id)
  if (!store.currentPost?.isPublic && !auth.user) {
    router.replace('/')
    return
  }
  await store.fetchGpxRecords(id)
  window.addEventListener('scroll', onWindowScroll, { passive: true })
})

// ── SSE: listen for background GPX sync completion ───────────────
let sseSource: EventSource | null = null

watch(() => store.currentPost?.id, (id) => {
  sseSource?.close()
  if (!id) return
  const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
  sseSource = new EventSource(`${apiBase}/api/Gpx/${id}/events`)
  sseSource.onmessage = (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data as string) as { gpxUrl?: string }
      if (data.gpxUrl && store.currentPost) store.currentPost.gpxFile = data.gpxUrl
    } catch { /* ignore malformed events */ }
  }
}, { immediate: true })

onUnmounted(() => {
  sseSource?.close()
  if (hintTimer) clearTimeout(hintTimer)
  window.removeEventListener('scroll', onWindowScroll)
})

// ── GPX Upload ───────────────────────────────────────────────────
const showGpxUploadModal = ref(false)
const gpxUploadTab       = ref<'upload' | 'import'>('upload')
const gpxUploading       = ref(false)
const gpxUploadError     = ref<string | null>(null)
const gpxUploadFile      = ref<File | null>(null)
const syncToLibrary      = ref(false)
const gpxImporting       = ref(false)
const gpxImportError     = ref<string | null>(null)

// ── GPX Records ──────────────────────────────────────────────────
const activeGpxRecordId      = ref<string | null>(null)
const showEditRecordModal     = ref(false)
const editRecordName          = ref('')
const editRecordDescription   = ref('')
const editingMainRoute        = ref(false)
const editRecordSaving        = ref(false)
const editRecordError         = ref<string | null>(null)

function openEditRecordModal() {
  if (activeGpxRecordId.value === null) {
    editRecordName.value        = ''
    editRecordDescription.value = store.currentPost?.gpxDescription ?? ''
    editingMainRoute.value      = true
  } else {
    const rec = store.currentGpxRecords.find((r: PostGpxRecord) => r.id === activeGpxRecordId.value)
    editRecordName.value        = rec?.name ?? ''
    editRecordDescription.value = rec?.description ?? ''
    editingMainRoute.value      = false
  }
  editRecordError.value     = null
  showEditRecordModal.value = true
}

async function saveRecordEdit() {
  if (editRecordSaving.value) return
  editRecordSaving.value = true
  editRecordError.value  = null
  const description = editRecordDescription.value.trim()
  try {
    if (editingMainRoute.value) {
      await store.updateMainRouteDescription(store.currentPost!.id, description)
    } else {
      const recordId = activeGpxRecordId.value!
      const name = editRecordName.value.trim()
      if (!name) { editRecordError.value = '請輸入路線名稱'; editRecordSaving.value = false; return }
      await store.renameGpxRecord(store.currentPost!.id, recordId, name)
      await store.updateGpxRecordDescription(store.currentPost!.id, recordId, description)
    }
    showEditRecordModal.value = false
  } catch (e) {
    editRecordError.value = (e as Error).message
  } finally {
    editRecordSaving.value = false
  }
}
const gpxModalIsNewRecord      = ref(false)
const gpxModalRerouteRecordId  = ref<string | null>(null)
const gpxRecordName            = ref('')

const activeGpxUrl = computed(() => {
  if (!activeGpxRecordId.value) return store.currentPost?.gpxFile ?? ''
  const rec = store.currentGpxRecords.find((r: PostGpxRecord) => r.id === activeGpxRecordId.value)
  return rec?.gpxFileUrl ?? ''
})

const activeOverrides = computed(() =>
  activeGpxRecordId.value ? store.currentRecordWaypointOverrides : store.currentWaypointOverrides
)

const activeRouteDescription = computed(() => {
  if (!activeGpxRecordId.value) return store.currentPost?.gpxDescription ?? ''
  const rec = store.currentGpxRecords.find((r: PostGpxRecord) => r.id === activeGpxRecordId.value)
  return rec?.description ?? ''
})

function waypointApiUrl(segment: string) {
  const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
  const postId  = store.currentPost!.id
  if (activeGpxRecordId.value)
    return `${apiBase}/api/Gpx/${postId}/records/${activeGpxRecordId.value}/waypoint${segment}`
  return `${apiBase}/api/Gpx/${postId}/waypoint${segment}`
}

watch(activeGpxRecordId, async (id) => {
  if (id && store.currentPost)
    await store.fetchRecordWaypointOverrides(store.currentPost.id, id)
})

async function addGpxRecord() {
  if (!gpxUploadFile.value || gpxUploading.value) return
  gpxUploading.value   = true
  gpxUploadError.value = null
  const file = gpxUploadFile.value
  const name = gpxRecordName.value.trim() || '新路線'
  try {
    const newId = await store.createGpxRecord(store.currentPost!.id, name, file)
    if (syncToLibrary.value) {
      await gpxLibStore.createGpxRoute({ name, gpxFile: file })
    }
    activeGpxRecordId.value  = newId
    showGpxUploadModal.value = false
    gpxUploadFile.value      = null
    gpxRecordName.value      = ''
    syncToLibrary.value      = false
  } catch (e) {
    gpxUploadError.value = (e as Error).message
  } finally {
    gpxUploading.value = false
  }
}

async function rerouteRecord() {
  if (!gpxUploadFile.value || gpxUploading.value || !gpxModalRerouteRecordId.value) return
  gpxUploading.value   = true
  gpxUploadError.value = null
  const file     = gpxUploadFile.value
  const recordId = gpxModalRerouteRecordId.value
  try {
    await store.rerouteGpxRecord(store.currentPost!.id, recordId, file)
    if (syncToLibrary.value) {
      const rec  = store.currentGpxRecords.find(r => r.id === recordId)
      await gpxLibStore.createGpxRoute({ name: rec?.name ?? '新路線', gpxFile: file })
    }
    showGpxUploadModal.value = false
    gpxUploadFile.value      = null
    syncToLibrary.value      = false
  } catch (e) {
    gpxUploadError.value = (e as Error).message
  } finally {
    gpxUploading.value = false
  }
}

function openGpxModal() {
  gpxModalIsNewRecord.value     = false
  gpxModalRerouteRecordId.value = null
  gpxRecordName.value           = ''
  gpxUploadTab.value            = 'upload'
  gpxUploadFile.value           = null
  gpxUploadError.value          = null
  gpxImportError.value          = null
  syncToLibrary.value           = false
  showGpxUploadModal.value      = true
}

function openNewRecordModal() {
  gpxModalIsNewRecord.value     = true
  gpxModalRerouteRecordId.value = null
  gpxRecordName.value           = ''
  gpxUploadTab.value            = 'upload'
  gpxUploadFile.value           = null
  gpxUploadError.value          = null
  syncToLibrary.value           = false
  showGpxUploadModal.value      = true
}

function openRerouteModal() {
  gpxModalIsNewRecord.value     = false
  gpxModalRerouteRecordId.value = activeGpxRecordId.value
  gpxRecordName.value           = ''
  gpxUploadTab.value            = 'upload'
  gpxUploadFile.value           = null
  gpxUploadError.value          = null
  syncToLibrary.value           = false
  showGpxUploadModal.value      = true
}

async function uploadGpx() {
  if (!gpxUploadFile.value || gpxUploading.value) return
  gpxUploading.value   = true
  gpxUploadError.value = null
  try {
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
    const fd = new FormData()
    fd.append('gpxFile', gpxUploadFile.value)
    const res = await fetch(`${apiBase}/api/Gpx/${store.currentPost!.id}`, { method: 'POST', body: fd })
    if (!res.ok) throw new Error(`伺服器錯誤 (${res.status})`)
    if (syncToLibrary.value) {
      await gpxLibStore.createGpxRoute({ name: store.currentPost!.title, gpxFile: gpxUploadFile.value })
    }
    await store.fetchPostDetail(store.currentPost!.id)
    showGpxUploadModal.value = false
    gpxUploadFile.value      = null
    syncToLibrary.value      = false
  } catch (e) {
    gpxUploadError.value = (e as Error).message
  } finally {
    gpxUploading.value = false
  }
}

async function importRecordFromLibrary(entry: GpxLibraryEntry) {
  gpxImporting.value   = true
  gpxImportError.value = null
  try {
    if (gpxModalRerouteRecordId.value) {
      await store.linkGpxRecord(store.currentPost!.id, gpxModalRerouteRecordId.value, entry.gpxFileUrl)
    } else {
      const name  = gpxRecordName.value.trim() || entry.name
      const newId = await store.createGpxRecordFromUrl(store.currentPost!.id, name, entry.gpxFileUrl)
      activeGpxRecordId.value = newId
      gpxRecordName.value     = ''
    }
    showGpxUploadModal.value = false
    gpxUploadTab.value       = 'upload'
  } catch (e) {
    gpxImportError.value = (e as Error).message
  } finally {
    gpxImporting.value = false
  }
}

async function importGpxFromLibrary(entry: GpxLibraryEntry) {
  gpxImporting.value   = true
  gpxImportError.value = null
  try {
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
    const res = await fetch(`${apiBase}/api/Gpx/${store.currentPost!.id}/link`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url: entry.gpxFileUrl }),
    })
    if (!res.ok) throw new Error(`伺服器錯誤 (${res.status})`)
    await store.fetchPostDetail(store.currentPost!.id)
    showGpxUploadModal.value = false
    gpxUploadTab.value       = 'upload'
  } catch (e) {
    gpxImportError.value = (e as Error).message
  } finally {
    gpxImporting.value = false
  }
}

// ── Visibility toggle ────────────────────────────────────────────
async function toggleVisibility() {
  if (!store.currentPost) return
  await store.updatePostVisibility(store.currentPost.id, !store.currentPost.isPublic)
}

// ── Export ───────────────────────────────────────────────────────
const showExportModal = ref(false)
const exportFormat    = ref<'json' | 'pdf'>('json')
const includeGears    = ref(true)

function doExport() {
  showExportModal.value = false
  if (exportFormat.value === 'json') exportAsJson()
  else void exportAsPdf()
}

function exportAsJson() {
  const p = store.currentPost!
  const data: Record<string, unknown> = {
    title:       p.title,
    description: p.description ?? null,
    dateStart:   p.dateStart   ?? null,
    dateEnd:     p.dateEnd     ?? null,
    weather:     p.weather     ?? null,
    peopleCount: p.peopleCount ?? null,
    tags:        p.tags        ?? [],
    photos:      store.currentPhotos.map(ph => ph.url),
  }
  if (includeGears.value) {
    data.gears = store.currentGears.map(g => ({
      name:     g.name,
      category: g.category,
      brand:    g.brand     ?? null,
      weight:   g.weight,
      quantity: g.quantity,
      note:     g.note      || null,
    }))
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: `${safeFilename(p.title)}.json` })
  a.click()
  URL.revokeObjectURL(url)
}

async function exportAsPdf() {
  const p       = store.currentPost!
  const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
  const url     = `${apiBase}/api/Posts/${p.id}/export/pdf?includeGears=${includeGears.value}`

  const res = await fetch(url)
  if (!res.ok) {
    console.error('PDF export failed:', res.status, await res.text())
    return
  }

  const blob     = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a        = Object.assign(document.createElement('a'), {
    href:     objectUrl,
    download: `${safeFilename(p.title)}.pdf`,
  })
  a.click()
  URL.revokeObjectURL(objectUrl)
}

function safeFilename(s: string) {
  return s.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'export'
}

function formatWptTime(d: Date) {
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function toDateInput(d: Date | null | undefined): string {
  if (!d) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseDate(dateStr: string): { date: Date | null; iso: string | null } {
  if (!dateStr) return { date: null, iso: null }
  const d = new Date(dateStr + 'T00:00')
  if (isNaN(d.getTime())) return { date: null, iso: null }
  return { date: d, iso: d.toISOString() }
}
</script>

<style scoped>
.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
}
.meta-icon  { color: var(--c-primary); opacity: 0.75; flex-shrink: 0; }
.meta-label { font-family: Inter, sans-serif; color: var(--c-inkMuted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
.meta-value { font-family: Inter, sans-serif; color: var(--c-ink); font-weight: 500; }

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 99px;
  border: 1px solid color-mix(in srgb, var(--c-border) 80%, transparent);
  background: color-mix(in srgb, var(--c-primary) 6%, transparent);
  font-family: Inter, sans-serif;
  font-size: 11px;
  color: var(--c-inkMuted);
}
.meta-chip-icon { color: var(--c-primary); opacity: 0.8; flex-shrink: 0; }

.export-fade-enter-active,
.export-fade-leave-active { transition: opacity 0.15s ease; }
.export-fade-enter-from,
.export-fade-leave-to    { opacity: 0; }

.wpt-card-selected {
  box-shadow:
    0 0 0 2px var(--c-primary),
    0 0 16px color-mix(in srgb, var(--c-primary) 30%, transparent);
}

.wpt-hint-enter-active { transition: opacity 0.2s ease; }
.wpt-hint-leave-active { transition: opacity 1s ease; }
.wpt-hint-enter-from,
.wpt-hint-leave-to     { opacity: 0 !important; }

.wpt-close-btn {
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--c-border);
  color: var(--c-inkMuted);
  cursor: pointer;
  transition: all 0.15s ease;
}
.wpt-close-btn:hover {
  background: color-mix(in srgb, var(--c-border) 60%, transparent);
  color: var(--c-ink);
  transform: scale(1.1);
}

.wpt-action-btn {
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  border: 1px solid var(--c-border);
  color: var(--c-inkMuted);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.wpt-action-btn:hover {
  transform: scale(1.18);
  background: color-mix(in srgb, var(--c-primary) 12%, transparent);
  border-color: var(--c-primary);
  color: var(--c-primary);
}
.wpt-action-btn.danger {
  border-color: rgba(224, 112, 112, 0.35);
  color: #e07070;
}
.wpt-action-btn.danger:hover {
  transform: scale(1.18);
  background: rgba(224, 112, 112, 0.12);
  border-color: #e07070;
  color: #ff8a8a;
}
</style>
