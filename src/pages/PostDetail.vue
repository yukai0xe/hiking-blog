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
      <header class="detail-header shrink-0 sm:px-[5vw] sm:pt-5 sm:pb-4 border-b"
        style="border-color: color-mix(in srgb, var(--c-border) 50%, transparent);">

        <div class="flex items-center justify-between mb-3">
          <button
            class="card-aged text-inkMuted hover:text-ink flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
            @click="$router.push('/')"
          >
            <ArrowLeftIcon :size="15" />
            <span class="hidden sm:inline">返回</span>
          </button>
          <div class="flex items-center gap-2">
            <button
              v-if="auth.user"
              :class="store.currentPost!.isPublic ? 'card-aged text-inkMuted hover:text-ink' : 'btn-cta'"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
              @click="toggleVisibility"
            >
              <EyeOffIcon v-if="store.currentPost!.isPublic" :size="14" />
              <GlobeIcon  v-else :size="14" />
              <span class="hidden sm:inline">{{ store.currentPost!.isPublic ? '取消公開' : '公開發布' }}</span>
            </button>
            <router-link
              v-if="auth.user"
              :to="`/edit/${store.currentPost!.id}`"
              class="card-aged text-inkMuted hover:text-ink flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
            >
              <PencilIcon :size="14" />
              <span class="hidden sm:inline">編輯</span>
            </router-link>
            <button
              class="card-aged text-inkMuted hover:text-ink flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
              @click="showExportModal = true"
            >
              <DownloadIcon :size="14" />
              <span class="hidden sm:inline">匯出</span>
            </button>
            <!-- Mobile: info sheet trigger -->
            <button
              v-if="(hasMeta || store.currentPost?.description)"
              class="sm:hidden card-aged text-inkMuted hover:text-ink flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
              @click="showInfoSheet = true"
            >
              <InfoIcon :size="14" />
            </button>
          </div>
        </div>

        <p class="text-[10px] font-body tracking-[0.25em] uppercase mb-1" style="color: var(--c-primary); opacity: 0.6;">
          Expedition Record
        </p>
        <h1 class="font-heading text-2xl sm:text-3xl font-bold text-ink leading-tight mb-3">
          {{ store.currentPost.title }}
        </h1>

        <div v-if="hasMeta" class="flex flex-wrap items-center gap-2 overflow-x-auto meta-chips-row">
          <div v-if="dateRange" class="meta-chip shrink-0">
            <CalendarIcon :size="11" class="meta-chip-icon" />
            <span class="font-mono text-[11px]">{{ dateRange }}</span>
          </div>
          <div v-if="tripDays" class="meta-chip shrink-0">
            <SunriseIcon :size="11" class="meta-chip-icon" />
            <span>{{ tripDays }} 天</span>
          </div>
          <div v-if="store.currentPost.weather" class="meta-chip shrink-0">
            <CloudIcon :size="11" class="meta-chip-icon" />
            <span>{{ store.currentPost.weather }}</span>
          </div>
          <div v-if="store.currentPost.peopleCount" class="meta-chip shrink-0">
            <UsersIcon :size="11" class="meta-chip-icon" />
            <span>{{ store.currentPost.peopleCount }} 人</span>
          </div>
          <div v-if="store.currentPost.difficultyStars" class="meta-chip shrink-0">
            <span class="text-primary" style="font-size:11px;letter-spacing:-1px;">{{ '★'.repeat(Math.min(store.currentPost.difficultyStars, profile.difficultyMax)) }}</span>
            <span v-if="profile.difficultyLabels[store.currentPost.difficultyStars - 1]" class="font-body text-inkMuted" style="font-size:11px;">{{ profile.difficultyLabels[store.currentPost.difficultyStars - 1] }}</span>
          </div>
        </div>
      </header>

      <!-- Three-column layout -->
      <div class="detail-three-col relative z-10 flex flex-1 overflow-hidden px-[5vw] pt-6 pb-[30vh]">

        <!-- ① Left sidebar — tab navigation -->
        <nav class="detail-nav w-[72px] shrink-0 flex flex-col pt-5 pb-4 gap-1 pr-3"
          style="border-right: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);">
          <button
            v-for="nav in navTabs"
            :key="nav.key"
            class="detail-nav-btn relative flex flex-col items-center gap-1.5 py-3 transition-all duration-200 cursor-pointer rounded-r-sm"
            :style="activeTab === nav.key ? 'color: var(--c-primary);' : 'color: var(--c-inkMuted);'"
            @click="setTab(nav.key)"
          >
            <span
              v-if="activeTab === nav.key"
              class="nav-indicator absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
              style="background: var(--c-primary);"
            />
            <component :is="nav.icon" :size="18" />
            <span class="text-[10px] font-body tracking-wide">{{ nav.label }}</span>
          </button>
        </nav>

        <!-- ② Center — main content -->
        <main class="detail-main flex-1 flex flex-col overflow-hidden relative">

          <!-- Top bar -->
          <div class="detail-topbar shrink-0" style="border-bottom: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);">

            <!-- Row 1: tags + right actions -->
            <div class="flex items-center gap-2 px-4 py-2 flex-wrap">
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

              <template v-else-if="store.currentPost?.tags?.length">
                <span
                  v-for="tag in store.currentPost.tags"
                  :key="tag"
                  class="px-2.5 py-1 rounded-full text-[10px] font-body tracking-wide border"
                  style="color: var(--c-primary); border-color: color-mix(in srgb, var(--c-primary) 35%, transparent); background: color-mix(in srgb, var(--c-primary) 8%, transparent);"
                >{{ tag }}</span>
              </template>

              <div class="ml-auto flex items-center gap-2 shrink-0">
                <button
                  v-if="activeTab === 'photos' && galleryRef?.hasFavorites"
                  class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
                  style="color: var(--c-inkMuted); border: 1px solid var(--c-border);"
                  @click="galleryRef?.resetFavorites()"
                >
                  <StarOffIcon :size="12" />
                  重置喜愛
                </button>

                <button
                  v-if="auth.user && activeTab === 'gears'"
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
                  :style="gearEditMode
                    ? 'background: var(--c-primary); color: var(--c-base); border: 1px solid var(--c-primary);'
                    : 'color: var(--c-inkMuted); border: 1px solid var(--c-border);'"
                  @click="gearEditMode = !gearEditMode"
                >
                  <PencilIcon :size="13" />
                  <span class="hidden sm:inline">編輯裝備</span>
                </button>

                <button
                  v-if="auth.user && activeTab === 'gpx' && (activeGpxRecordId !== null || store.currentPost?.gpxFile)"
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
                  style="color: var(--c-inkMuted); border: 1px solid var(--c-border);"
                  @click="openEditRecordModal"
                >
                  <PencilIcon :size="13" />
                  <span class="hidden sm:inline">編輯路線</span>
                </button>

                <button
                  v-if="auth.user && activeTab === 'gpx' && (activeGpxRecordId !== null || store.currentPost?.gpxFile)"
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
                  style="color: var(--c-inkMuted); border: 1px solid var(--c-border);"
                  @click="activeGpxRecordId !== null ? openRerouteModal() : openGpxModal()"
                >
                  <UploadIcon :size="13" />
                  <span class="hidden sm:inline">重新上傳</span>
                </button>

                <button
                  v-if="auth.user && activeTab === 'foods'"
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
                  :style="foodEditMode
                    ? 'background: var(--c-primary); color: var(--c-base); border: 1px solid var(--c-primary);'
                    : 'color: var(--c-inkMuted); border: 1px solid var(--c-border);'"
                  @click="foodEditMode = !foodEditMode"
                >
                  <PencilIcon :size="13" />
                  <span class="hidden sm:inline">編輯糧食</span>
                </button>

                <button
                  class="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
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

            <!-- Row 2: route description -->
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

            <!-- Row 3: map layer toggles -->
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
            class="detail-content-area flex-1 min-h-0"
            :class="activeTab !== 'gpx' ? 'overflow-y-auto p-6' : 'overflow-y-auto'"
          >
            <PhotoGallery
              v-if="activeTab === 'photos'"
              ref="galleryRef"
              :photos="store.currentPhotos"
            />

            <template v-else-if="activeTab === 'gpx'">
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
                    <p class="text-[10px] font-mono tracking-wider text-inkMuted opacity-60 pb-1"
                      style="border-bottom: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);">
                      {{ date }}
                    </p>
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
                      <p class="font-heading text-sm font-semibold text-ink leading-snug truncate">{{ wpt.name || '未命名' }}</p>
                      <p v-if="wpt.desc" class="text-[11px] font-body text-inkMuted italic leading-relaxed">{{ wpt.desc }}</p>
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
                      <p v-if="wpt.time" class="text-[10px] font-mono text-inkMuted opacity-60">{{ formatWptTime(wpt.time) }}</p>
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

        <!-- ③ Right sidebar -->
        <aside
          class="detail-sidebar shrink-0 overflow-hidden transition-[width] duration-300"
          :style="`width: ${sidebarOpen ? '240px' : '0px'}; border-left: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);`"
        >
          <div class="w-[240px] overflow-y-auto p-5 h-full">
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
                  <span class="meta-value text-primary" style="letter-spacing:-1px;">{{ '★'.repeat(Math.min(store.currentPost.difficultyStars, profile.difficultyMax)) }}</span>
                  <span v-if="profile.difficultyLabels[store.currentPost.difficultyStars - 1]" class="font-body text-inkMuted" style="font-size:12px; margin-left:4px;">{{ profile.difficultyLabels[store.currentPost.difficultyStars - 1] }}</span>
                </div>
              </div>
            </div>

            <div
              v-if="store.currentPost.description"
              :class="hasMeta ? 'pt-5' : ''"
              :style="hasMeta ? 'border-top: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);' : ''"
            >
              <p class="text-[9px] font-body uppercase tracking-[0.2em] text-inkMuted opacity-50 mb-3">描述</p>
              <p class="text-sm font-body italic text-inkMuted leading-relaxed">{{ store.currentPost.description }}</p>
            </div>
          </div>
        </aside>

      </div>
    </template>

    <!-- ── Mobile info bottom sheet ──────────────────────────────── -->
    <Teleport to="body">
      <Transition name="info-sheet">
        <div v-if="showInfoSheet" class="info-backdrop" @click.self="showInfoSheet = false">
          <div class="info-box">
            <div class="info-handle" />

            <div class="info-scroll">
              <div v-if="hasMeta" class="mb-5">
                <p class="info-section-label">行程資訊</p>
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
                  <div v-if="store.currentPost?.weather" class="meta-item">
                    <CloudIcon :size="13" class="meta-icon" />
                    <span class="meta-label">天氣</span>
                    <span class="meta-value">{{ store.currentPost.weather }}</span>
                  </div>
                  <div v-if="store.currentPost?.peopleCount" class="meta-item">
                    <UsersIcon :size="13" class="meta-icon" />
                    <span class="meta-label">人數</span>
                    <span class="meta-value">{{ store.currentPost.peopleCount }} 人</span>
                  </div>
                  <div v-if="store.currentPost?.difficultyStars" class="meta-item">
                    <span class="meta-icon text-primary" style="font-size:13px;line-height:1;">★</span>
                    <span class="meta-label">難度</span>
                    <span class="meta-value text-primary" style="letter-spacing:-1px;">{{ '★'.repeat(Math.min(store.currentPost.difficultyStars, profile.difficultyMax)) }}</span>
                    <span v-if="profile.difficultyLabels[store.currentPost.difficultyStars - 1]" class="font-body text-inkMuted" style="font-size:12px; margin-left:4px;">{{ profile.difficultyLabels[store.currentPost.difficultyStars - 1] }}</span>
                  </div>
                </div>
              </div>

              <div
                v-if="store.currentPost?.description"
                :class="hasMeta ? 'pt-5' : ''"
                :style="hasMeta ? 'border-top: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);' : ''"
              >
                <p class="info-section-label">描述</p>
                <p class="text-sm font-body italic text-inkMuted leading-relaxed">{{ store.currentPost.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modals ─────────────────────────────────────────────────── -->
    <WaypointEditModal
      :editing-wpt="editingWpt"
      :draft="wptDraft"
      :saving="wptSaving"
      :error="wptError"
      :is-dark="theme.isDark"
      :is-custom-wpt="editingWpt ? isCustomWpt(editingWpt) : false"
      @close="editingWpt = null"
      @save="saveWptEdit"
      @toggle-hidden="editingWpt && toggleWptHidden(editingWpt); editingWpt = null"
      @delete="editingWpt && deleteWpt(editingWpt); editingWpt = null"
    />

    <WaypointAddModal
      :open="showAddWptModal"
      :draft="newWptDraft"
      :saving="addWptSaving"
      :error="addWptError"
      :is-dark="theme.isDark"
      @close="showAddWptModal = false"
      @create="createWpt"
    />

    <GpxUploadModal
      :open="showGpxUploadModal"
      :tab="gpxUploadTab"
      :is-new-record="gpxModalIsNewRecord"
      :reroute-record-id="gpxModalRerouteRecordId"
      :record-name="gpxRecordName"
      :file="gpxUploadFile"
      :gpx-library="gpxLibStore.gpxLibrary"
      :gpx-lib-loading="gpxLibStore.loading"
      :uploading="gpxUploading"
      :importing="gpxImporting"
      :upload-error="gpxUploadError"
      :import-error="gpxImportError"
      :sync-to-library="syncToLibrary"
      @close="showGpxUploadModal = false"
      @update:tab="gpxUploadTab = $event"
      @update:record-name="gpxRecordName = $event"
      @update:file="gpxUploadFile = $event"
      @update:sync-to-library="syncToLibrary = $event"
      @upload="uploadGpx"
      @add-record="addGpxRecord"
      @reroute="rerouteRecord"
      @import-from-library="(gpxModalIsNewRecord || gpxModalRerouteRecordId) ? importRecordFromLibrary($event) : importGpxFromLibrary($event)"
      @fetch-library="gpxLibStore.fetchGpxLibrary()"
    />

    <GpxEditRecordModal
      :open="showEditRecordModal"
      :editing-main-route="editingMainRoute"
      :name="editRecordName"
      :description="editRecordDescription"
      :saving="editRecordSaving"
      :error="editRecordError"
      @close="showEditRecordModal = false"
      @save="saveRecordEdit"
      @update:name="editRecordName = $event"
      @update:description="editRecordDescription = $event"
    />

    <PostExportModal
      :open="showExportModal"
      :format="exportFormat"
      :include-gears="includeGears"
      :include-foods="includeFoods"
      :include-food-day-assignments="includeFoodDayAssignments"
      :include-gpx="includeGpx"
      :exporting="exporting"
      :error="exportError"
      @close="showExportModal = false"
      @export="doExport"
      @update:format="exportFormat = $event"
      @update:include-gears="includeGears = $event"
      @update:include-foods="includeFoods = $event"
      @update:include-food-day-assignments="includeFoodDayAssignments = $event"
      @update:include-gpx="includeGpx = $event"
    />

    <WaypointBatchModal
      :open="showBatchHideModal"
      :waypoints="sortedWaypoints"
      :selected="batchHideSelected"
      :saving="batchHideSaving"
      @close="showBatchHideModal = false"
      @toggle-item="toggleBatchItem"
      @toggle-all="toggleBatchSelectAll"
      @confirm="confirmBatchHide"
    />

    <!-- Back to top -->
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

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft as ArrowLeftIcon, Pencil as PencilIcon,
  Calendar as CalendarIcon, Sunrise as SunriseIcon, Cloud as CloudIcon, Users as UsersIcon,
  ChevronsRight as ChevronsRightIcon, ChevronsLeft as ChevronsLeftIcon,
  StarOff as StarOffIcon, Download as DownloadIcon, Upload as UploadIcon,
  Plus as PlusIcon, EyeOff as EyeOffIcon, Globe as GlobeIcon,
  MapPin as MapPinIcon, AlignLeft as AlignLeftIcon, Info as InfoIcon,
} from 'lucide-vue-next'
import PhotoGallery from '../components/PhotoGallery.vue'
import GpxViewer from '../components/GpxViewer.vue'
import GearEditor from '../components/GearEditor.vue'
import FoodDayPlanner from '../components/FoodDayPlanner.vue'
import WaypointEditModal  from '../components/WaypointEditModal.vue'
import WaypointAddModal   from '../components/WaypointAddModal.vue'
import WaypointBatchModal from '../components/WaypointBatchModal.vue'
import GpxUploadModal     from '../components/GpxUploadModal.vue'
import GpxEditRecordModal from '../components/GpxEditRecordModal.vue'
import PostExportModal    from '../components/PostExportModal.vue'
import { usePostStore }        from '../stores/postStore'
import { useThemeStore }       from '../stores/themeStore'
import { useGpxLibraryStore }  from '../stores/gpxLibraryStore'
import { useAuthStore }        from '../stores/authStore'
import { useProfileStore }     from '../stores/profileStore'
import { usePostMeta }         from '../composables/usePostMeta'
import { useGpxRecord }        from '../composables/useGpxRecord'
import { useGpxUpload }        from '../composables/useGpxUpload'
import { useWaypoint }         from '../composables/useWaypoint'
import { useWaypointAdd }      from '../composables/useWaypointAdd'
import { useWaypointBatch }    from '../composables/useWaypointBatch'
import { usePostExport }       from '../composables/usePostExport'
import { formatWptTime }       from '../utils/gpxHelpers'

const route       = useRoute()
const router      = useRouter()
const store       = usePostStore()
const theme       = useThemeStore()
const gpxLibStore = useGpxLibraryStore()
const auth        = useAuthStore()
const profile     = useProfileStore()

const galleryRef       = ref<InstanceType<typeof PhotoGallery> | null>(null)
const gpxViewerRef     = ref<InstanceType<typeof GpxViewer> | null>(null)
const contentScrollRef = ref<HTMLElement | null>(null)
const showBackToTop    = ref(false)
const showInfoSheet    = ref(false)

const {
  activeTab, sidebarOpen, foodEditMode, gearEditMode,
  showPeaks, showWaypoints, showShelters,
  setTab, navTabs, mapToggles,
  dateRange, tripDays, hasMeta,
} = usePostMeta()

const {
  activeGpxRecordId,
  showEditRecordModal, editRecordName, editRecordDescription, editingMainRoute,
  editRecordSaving, editRecordError,
  activeGpxUrl, activeOverrides, activeRouteDescription,
  waypointApiUrl, openEditRecordModal, saveRecordEdit,
} = useGpxRecord()

const {
  showGpxUploadModal, gpxUploadTab, gpxUploading, gpxUploadError, gpxUploadFile,
  syncToLibrary, gpxImporting, gpxImportError,
  gpxModalIsNewRecord, gpxModalRerouteRecordId, gpxRecordName,
  openGpxModal, openNewRecordModal, openRerouteModal,
  uploadGpx, addGpxRecord, rerouteRecord, importRecordFromLibrary, importGpxFromLibrary,
} = useGpxUpload(activeGpxRecordId)

const {
  gpxWaypoints, selectedWpt, hintWpt, editingWpt, wptDraft, wptSaving, wptError,
  isCustomWpt, onWptClick, onWptDblClick, saveWptEdit,
  toggleWptHidden, deleteWpt, sortedWaypoints, groupedWaypoints, clearHintTimer,
} = useWaypoint(gpxViewerRef, activeOverrides, waypointApiUrl)

const {
  addingWpt, showAddWptModal, newWptDraft, addWptSaving, addWptError,
  toggleAddMode, onMapClick, createWpt,
} = useWaypointAdd(gpxViewerRef, gpxWaypoints, activeOverrides, waypointApiUrl)

const {
  showBatchHideModal, batchHideSelected, batchHideSaving,
  openBatchHide, toggleBatchItem, toggleBatchSelectAll, confirmBatchHide,
} = useWaypointBatch(sortedWaypoints, toggleWptHidden)

const {
  showExportModal, exportFormat, includeGears, includeFoods,
  includeFoodDayAssignments, includeGpx, exporting, exportError,
  doExport,
} = usePostExport()

async function toggleVisibility() {
  if (!store.currentPost) return
  await store.updatePostVisibility(store.currentPost.id, !store.currentPost.isPublic)
}

function onWindowScroll() {
  const winScroll = window.scrollY
  const divScroll = contentScrollRef.value?.scrollTop ?? 0
  showBackToTop.value = winScroll > 200 || divScroll > 200
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  contentScrollRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

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

onUnmounted(() => {
  sseSource?.close()
  clearHintTimer()
  window.removeEventListener('scroll', onWindowScroll)
})
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

/* ── Mobile: Post Detail responsive overrides (< 640px) ─────────────── */
@media (max-width: 639px) {

  /* Sticky header with backdrop blur */
  .detail-header {
    position: sticky;
    top: 0;
    z-index: 20;
    padding: 10px 16px 10px;
    backdrop-filter: blur(12px);
    background: color-mix(in srgb, var(--c-base) 88%, transparent);
  }
  .meta-chips-row {
    flex-wrap: nowrap;
    scrollbar-width: none;
    padding-bottom: 2px;
  }
  .meta-chips-row::-webkit-scrollbar { display: none; }

  /* Three-col: stack vertically, document scroll */
  .detail-three-col {
    flex-direction: column;
    overflow: visible;
    padding: 0;
    padding-bottom: 2rem;
    flex: none;
  }

  /* Left nav → horizontal scroll tab bar */
  .detail-nav {
    flex-direction: row !important;
    width: 100%;
    padding: 0 4px !important;
    border-right: none !important;
    border-bottom: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);
    overflow-x: auto;
    scrollbar-width: none;
    flex-shrink: 0;
    gap: 0;
  }
  .detail-nav::-webkit-scrollbar { display: none; }

  .detail-nav-btn {
    flex-direction: row !important;
    gap: 6px !important;
    padding: 10px 14px !important;
    white-space: nowrap;
    border-radius: 0;
  }
  .detail-nav-btn span.text-\[10px\] { font-size: 13px !important; }

  /* Nav active indicator: bottom underline */
  .nav-indicator {
    left: 8px !important;
    right: 8px !important;
    top: auto !important;
    bottom: -1px !important;
    width: auto !important;
    height: 2px !important;
  }

  /* Main: natural flow */
  .detail-main {
    overflow: visible !important;
    flex: none !important;
  }
  .detail-content-area {
    overflow: visible !important;
    height: auto !important;
    min-height: 0 !important;
    flex: none !important;
  }
  /* Remove padding added by :class for non-gpx tabs — re-add inline */
  .detail-content-area.overflow-y-auto.p-6 { padding: 16px !important; }

  /* Right sidebar: hidden on mobile */
  .detail-sidebar { display: none !important; }

  /* Top bar: tighter padding */
  .detail-topbar > div { padding-left: 12px; padding-right: 12px; }
}

/* ── Mobile info bottom sheet ──────────────────────────────────────── */
.info-backdrop {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: flex-end; justify-content: center;
}
.info-box {
  width: 100%;
  background: var(--c-card);
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  border-radius: 0;
  box-shadow: 0 -8px 48px rgba(0,0,0,0.4);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  max-height: 75vh;
  display: flex;
  flex-direction: column;
}
.info-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: color-mix(in srgb, var(--c-border) 70%, transparent);
  margin: 12px auto 4px;
  flex-shrink: 0;
}
.info-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px 20px;
}
.info-section-label {
  font-size: 9px;
  font-family: Inter, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--c-inkMuted);
  opacity: 0.5;
  margin-bottom: 12px;
}

/* Sheet slide-up transition */
.info-sheet-enter-active { transition: opacity 0.2s ease, transform 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
.info-sheet-leave-active { transition: opacity 0.16s ease, transform 0.2s ease; }
.info-sheet-enter-from, .info-sheet-leave-to { opacity: 0; transform: translateY(60%); }
</style>
