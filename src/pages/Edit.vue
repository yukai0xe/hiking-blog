<template>
  <div class="min-h-screen textured-bg vignette py-8">
    <div class="relative z-10 px-4">

      <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <button
            class="card-aged w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
            @click="$router.back()" aria-label="返回"
          >
            <ArrowLeftIcon :size="17" />
          </button>
          <div>
            <p class="text-xs font-body tracking-[0.25em] uppercase text-primary opacity-60">Edit Entry</p>
            <h1 class="font-heading text-xl font-bold text-ink">編輯記錄</h1>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="delete-btn flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-semibold font-body cursor-pointer transition-all duration-200"
            :disabled="store.loading"
            @click="confirmingDelete = true"
          >
            <Trash2Icon :size="15" />
            刪除
          </button>
          <button
            class="btn-cta flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold font-body cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="store.loading || !form.title.trim()"
            @click="save"
          >
            <span v-if="store.loading" class="w-4 h-4 border-2 rounded-full animate-spin border-current border-t-transparent" />
            <SaveIcon v-else :size="15" />
            {{ store.loading ? '儲存中…' : '儲存' }}
          </button>
        </div>
      </div>

      <!-- Save error banner -->
      <div
        v-if="store.error && !confirmingDelete"
        class="mb-4 px-4 py-2.5 rounded-lg flex items-center gap-2 font-body text-sm"
        style="background: rgba(220,60,60,0.12); border: 1px solid rgba(220,60,60,0.35); color: #e07070;"
      >
        <AlertCircleIcon :size="14" class="shrink-0" />
        {{ store.error }}
      </div>
      </div>

      <!-- Modals -->
      <CropModal v-if="showCropper" :src="cropSrc" @confirm="onCropConfirm" @cancel="showCropper = false" />

      <Teleport to="body">
        <Transition name="modal">
          <div v-if="confirmingDelete" class="modal-backdrop" @click.self="confirmingDelete = false">
            <div class="modal-box">
              <div class="modal-icon-wrap"><Trash2Icon :size="26" /></div>
              <h2 class="font-heading text-xl font-bold text-ink mb-1">刪除這筆記錄？</h2>
              <p class="font-body text-sm text-inkMuted leading-relaxed mb-6">
                「{{ store.currentPost?.title }}」將永久刪除，包含所有照片與裝備資料，無法復原。
              </p>
              <p v-if="store.error" class="text-red-400 text-xs font-body mb-4 flex items-center gap-1">
                <AlertCircleIcon :size="13" /> {{ store.error }}
              </p>
              <div class="flex gap-3">
                <button
                  class="flex-1 py-2.5 rounded-lg font-semibold font-body text-sm cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors duration-200"
                  :disabled="store.loading"
                  @click="confirmingDelete = false"
                >取消</button>
                <button
                  class="flex-1 py-2.5 rounded-lg font-semibold font-body text-sm cursor-pointer delete-confirm-btn flex items-center justify-center gap-1.5 transition-all duration-200"
                  :disabled="store.loading"
                  @click="handleDelete"
                >
                  <span v-if="store.loading" class="w-3.5 h-3.5 border-2 rounded-full animate-spin border-current border-t-transparent" />
                  <Trash2Icon v-else :size="13" />
                  {{ store.loading ? '刪除中…' : '確認刪除' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Loading -->
      <div v-if="pageLoading" class="max-w-2xl mx-auto card-aged p-10 text-center text-inkMuted font-body">
        <div class="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
        載入中…
      </div>

      <template v-else>

        <!-- Step indicator -->
        <div class="max-w-2xl mx-auto">
          <div class="flex items-center mb-6 card-aged p-4">
            <template v-for="(label, i) in stepLabels" :key="i">
              <div class="flex flex-col items-center gap-1 cursor-pointer" @click="step = i + 1">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200"
                  :class="
                    step > i + 1   ? 'bg-secondary text-ink opacity-80' :
                    step === i + 1 ? 'bg-primary text-[var(--c-cta-text)] shadow-md' :
                                     'bg-border/40 text-inkMuted hover:bg-border/70'
                  "
                >
                  <CheckIcon v-if="step > i + 1" :size="14" />
                  <span v-else>{{ i + 1 }}</span>
                </div>
                <span
                  class="text-[10px] tracking-wide hidden sm:block font-body"
                  :class="
                    step === i + 1 ? 'text-primary' :
                    step > i + 1   ? 'text-inkMuted' :
                                     'text-inkMuted opacity-40'
                  "
                >{{ label }}</span>
              </div>
              <div v-if="i < stepLabels.length - 1"
                class="flex-1 h-px mx-2 transition-colors duration-300"
                :class="step > i + 1 ? 'bg-secondary opacity-60' : 'bg-border opacity-40'"
              />
            </template>
          </div>
        </div>

        <!-- Step card + optional gear panel -->
        <div :class="(step === 5 || step === 6) ? 'max-w-[1240px] mx-auto flex gap-5 items-start' : 'max-w-2xl mx-auto'">
        <div class="card-aged p-6 flex-1 min-w-0">

          <!-- Step 1: 基本資訊 -->
          <div v-if="step === 1" class="space-y-5">
            <h2 class="font-heading text-xl text-ink mb-4">基本資訊</h2>
            <div>
              <label class="field-label">標題 *</label>
              <input v-model="form.title" type="text" class="input-field" placeholder="這次登山的名稱" />
            </div>
            <div>
              <label class="field-label">標籤</label>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in form.tags" :key="tag"
                  class="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-body border"
                  style="background: color-mix(in srgb, var(--c-primary) 28%, transparent); border-color: var(--c-primary); color: var(--c-ink); font-weight: 600;"
                >
                  <button type="button" class="cursor-pointer opacity-60 hover:opacity-100 transition-opacity" @click="form.tags.splice(form.tags.indexOf(tag), 1)">
                    <XIcon :size="11" />
                  </button>
                  {{ tag }}
                </span>
                <button
                  type="button"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body cursor-pointer transition-all duration-150 border border-dashed"
                  style="color: var(--c-inkMuted); border-color: color-mix(in srgb, var(--c-border) 80%, transparent);"
                  @click="tagModalOpen = true"
                >
                  <TagIcon :size="12" /> 選擇標籤
                </button>
              </div>
              <TagPickerModal :open="tagModalOpen" v-model="form.tags" @close="tagModalOpen = false" />
            </div>
            <div>
              <label class="field-label">描述</label>
              <textarea v-model="form.description" rows="4" class="input-field resize-none" placeholder="記錄這次登山的心得…" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="field-label">開始日期</label>
                <input v-model="form.dateStart" type="date" class="input-field font-mono text-sm" />
              </div>
              <div>
                <label class="field-label">結束日期</label>
                <input v-model="form.dateEnd" type="date" class="input-field font-mono text-sm" />
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="field-label">天氣</label>
                <select v-model="form.weather" class="input-field font-body">
                  <option value="">— 選擇天氣 —</option>
                  <option>晴天</option><option>多雲時晴</option><option>多雲</option>
                  <option>陰天</option><option>小雨</option><option>雨天</option>
                  <option>大雨</option><option>雷陣雨</option><option>起霧</option><option>下雪</option>
                </select>
              </div>
              <div>
                <label class="field-label">人數</label>
                <input v-model.number="form.peopleCount" type="number" min="1" max="999" class="input-field no-spinner" placeholder="隊員人數" />
              </div>
            </div>
          </div>

          <!-- Step 2: GPX -->
          <div v-else-if="step === 2" class="space-y-5">
            <h2 class="font-heading text-xl text-ink mb-4">GPX 路線</h2>
            <div class="flex items-center gap-3 p-4 rounded-xl border"
              style="border-color: color-mix(in srgb, var(--c-border) 50%, transparent); background: color-mix(in srgb, var(--c-card) 50%, transparent);">
              <RouteIcon :size="22" class="text-primary shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-body text-inkMuted uppercase tracking-widest mb-0.5">目前檔案</p>
                <p class="font-mono text-sm text-ink truncate">{{ newGpxFile ? newGpxFile.name : currentGpxFilename }}</p>
              </div>
              <span v-if="newGpxFile" class="bg-primary text-[var(--c-cta-text)] text-[10px] font-mono px-2 py-0.5 rounded shrink-0">NEW</span>
            </div>
            <div
              class="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200"
              :class="newGpxFile ? 'border-primary/50 bg-primary/5' : 'border-border/40 hover:border-primary/40'"
              @click="gpxInput?.click()" @dragover.prevent @drop.prevent="onGpxDrop"
            >
              <UploadIcon :size="28" class="mx-auto mb-2 text-inkMuted opacity-40" />
              <p class="text-inkMuted font-body text-sm">點擊或拖曳上傳新的 GPX 檔案</p>
              <p class="text-xs text-inkMuted/50 font-body italic mt-1">僅支援 .gpx 格式</p>
            </div>
            <input ref="gpxInput" type="file" accept=".gpx" class="hidden" @change="onGpxChange" />
          </div>

          <!-- Step 3: 封面 -->
          <div v-else-if="step === 3" class="space-y-4">
            <h2 class="font-heading text-xl text-ink mb-4">封面圖片</h2>
            <div
              class="relative overflow-hidden cursor-pointer group/cover border-2 border-dashed rounded-xl transition-all duration-200"
              :class="coverPreview ? 'border-primary/50' : 'border-border/40 hover:border-primary/40'"
              @click="coverInput?.click()"
            >
              <img
                :src="coverPreview ?? store.currentPost?.coverImage"
                alt="封面"
                class="w-full h-auto block transition-all duration-300 group-hover/cover:brightness-75"
              />
              <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity duration-200">
                <div class="flex items-center gap-2 bg-base/80 text-ink px-4 py-2 rounded-lg text-sm font-body font-medium">
                  <ImageIcon :size="15" /> 更換封面
                </div>
              </div>
              <div v-if="coverPreview" class="absolute top-2 right-2 bg-primary text-[var(--c-cta-text)] text-[10px] font-mono px-2 py-0.5 rounded">
                NEW
              </div>
            </div>
            <input ref="coverInput" type="file" accept="image/*" class="hidden" @change="onCoverChange" />
          </div>

          <!-- Step 4: 照片 -->
          <div v-else-if="step === 4" class="space-y-4">
            <div class="flex items-center justify-between mb-2">
              <h2 class="font-heading text-xl text-ink">照片集</h2>
              <button
                class="flex items-center gap-1.5 btn-cta text-xs font-semibold font-body px-3 py-1.5 rounded-lg cursor-pointer"
                @click="photosInput?.click()"
              >
                <PlusIcon :size="13" /> 新增照片
              </button>
            </div>
            <input ref="photosInput" type="file" accept="image/*" multiple class="hidden" @change="onAddPhotos" />

            <div v-if="visiblePhotos.length > 0 || newPhotoPreviews.length > 0" class="grid grid-cols-3 gap-2">
              <div v-for="photo in visiblePhotos" :key="photo.id"
                class="relative aspect-square overflow-hidden rounded-lg group/photo">
                <img :src="photo.url" class="w-full h-full object-cover opacity-90" alt="" />
                <button
                  class="absolute top-1 right-1 w-6 h-6 rounded-full bg-base/80 text-inkMuted hover:text-red-400 hover:bg-base flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all duration-150 cursor-pointer"
                  @click="markDelete(photo.id)"
                ><XIcon :size="12" /></button>
              </div>
              <div v-for="(src, i) in newPhotoPreviews" :key="`new-${i}`"
                class="relative aspect-square overflow-hidden rounded-lg group/photo">
                <img :src="src" class="w-full h-full object-cover opacity-90" alt="" />
                <div class="absolute top-1 left-1 bg-primary text-[var(--c-cta-text)] text-[10px] font-mono px-1.5 py-0.5 rounded">NEW</div>
                <button
                  class="absolute top-1 right-1 w-6 h-6 rounded-full bg-base/80 text-inkMuted hover:text-red-400 hover:bg-base flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all duration-150 cursor-pointer"
                  @click="removeNewPhoto(i)"
                ><XIcon :size="12" /></button>
              </div>
            </div>
            <div v-else class="text-center text-inkMuted text-sm font-body italic py-8">
              — 尚無照片，點擊「新增照片」上傳 —
            </div>

            <div v-if="pendingDeletes.length > 0" class="mt-2 pt-4 border-t border-border/40">
              <p class="text-xs text-inkMuted font-body mb-2 flex items-center gap-1">
                <AlertCircleIcon :size="12" /> 以下照片將於儲存時刪除（點擊可復原）
              </p>
              <div class="flex gap-2 flex-wrap">
                <div v-for="photo in deletedPhotos" :key="photo.id"
                  class="relative w-16 h-16 overflow-hidden rounded-lg cursor-pointer opacity-40 hover:opacity-70 transition-opacity"
                  @click="undoDelete(photo.id)">
                  <img :src="photo.url" class="w-full h-full object-cover" alt="" />
                  <div class="absolute inset-0 flex items-center justify-center bg-base/60">
                    <RotateCcwIcon :size="14" class="text-ink" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 5: 裝備 -->
          <div v-else-if="step === 5" class="space-y-4">
            <div class="flex items-center justify-between mb-2">
              <h2 class="font-heading text-xl text-ink">新增裝備</h2>
              <button
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors duration-200"
                @click="openLibraryModal"
              >
                <LibraryIcon :size="13" />
                從裝備庫選取
              </button>
            </div>

            <!-- 編輯模式提示 -->
            <div v-if="activeGearId !== null || activeNewIndex !== null"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-body"
              style="background: color-mix(in srgb, var(--c-primary) 10%, transparent); color: var(--c-primary); border: 1px solid color-mix(in srgb, var(--c-primary) 25%, transparent);">
              <PencilIcon :size="12" />
              編輯模式 — 修改後點擊「更新裝備」
            </div>

            <!-- 名稱 + 類別 -->
            <div class="grid grid-cols-[1fr_120px] gap-2">
              <input v-model="newGear.name" type="text" class="input-field text-sm" placeholder="裝備名稱 *" @keyup.enter="submitGear" />
              <select v-model="newGear.category" class="input-field text-sm font-body">
                <option v-for="cat in store.gearCategories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <!-- 品牌 + 價格 + 加入時間 -->
            <div class="grid grid-cols-[1fr_90px_140px] gap-2">
              <div>
                <label class="field-label">品牌</label>
                <input v-model="newGear.brand" type="text" class="input-field text-sm" placeholder="品牌名稱" />
              </div>
              <div>
                <label class="field-label">價格</label>
                <input v-model.number="newGear.price" type="number" min="0" class="input-field text-sm font-mono no-spinner" placeholder="0" />
              </div>
              <div>
                <label class="field-label">加入時間</label>
                <input v-model="newGear.addedAt" type="date" class="input-field text-sm font-mono" />
              </div>
            </div>

            <!-- 重量 + 數量 + 備註 -->
            <div class="grid grid-cols-[80px_60px_1fr] gap-2">
              <div>
                <label class="field-label">重量 (g)</label>
                <input v-model.number="newGear.weight" type="number" min="0" class="input-field text-sm font-mono no-spinner" placeholder="0" @keyup.enter="submitGear" />
              </div>
              <div>
                <label class="field-label">數量</label>
                <input v-model.number="newGear.quantity" type="number" min="1" class="input-field text-sm font-mono no-spinner" placeholder="1" @keyup.enter="submitGear" />
              </div>
              <div>
                <label class="field-label">備註</label>
                <input v-model="newGear.note" type="text" class="input-field text-sm" placeholder="選填" @keyup.enter="submitGear" />
              </div>
            </div>

            <!-- 參考連結 -->
            <div>
              <label class="field-label">參考連結</label>
              <input v-model="newGear.referenceUrl" type="url" class="input-field text-sm font-mono" placeholder="https://…" />
            </div>

            <div class="flex items-center gap-2">
              <button
                v-if="activeGearId !== null || activeNewIndex !== null"
                type="button"
                class="px-3 py-1.5 rounded-lg text-xs font-body font-medium cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors duration-200"
                @click="cancelEdit"
              >取消</button>
              <button
                class="flex items-center gap-1.5 btn-cta text-xs font-semibold font-body px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="!newGear.name.trim()" @click="submitGear"
              >
                <SaveIcon v-if="activeGearId !== null || activeNewIndex !== null" :size="13" />
                <PlusIcon v-else :size="13" />
                {{ (activeGearId !== null || activeNewIndex !== null) ? '更新裝備' : '加入清單' }}
              </button>
            </div>
          </div>

          <!-- Step 6: Food -->
          <div v-else-if="step === 6" class="space-y-4">
            <h2 class="font-heading text-xl text-ink mb-2">糧食清單</h2>

            <!-- 編輯模式提示 -->
            <div v-if="activeFoodIndex !== null"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-body"
              style="background: color-mix(in srgb, var(--c-primary) 10%, transparent); color: var(--c-primary); border: 1px solid color-mix(in srgb, var(--c-primary) 25%, transparent);">
              <PencilIcon :size="12" />
              編輯模式 — 修改後點擊「更新糧食」
            </div>

            <!-- 名稱 -->
            <input v-model="newFood.name" type="text" class="input-field text-sm" placeholder="食物名稱 *" @keyup.enter="submitFood" />

            <!-- 重量 + 數量 + 價格 + 備註 -->
            <div class="grid grid-cols-[80px_60px_90px_1fr] gap-2">
              <div>
                <label class="field-label">重量 (g)</label>
                <input v-model.number="newFood.weight" type="number" min="0" class="input-field text-sm font-mono no-spinner" placeholder="0" @keyup.enter="submitFood" />
              </div>
              <div>
                <label class="field-label">數量</label>
                <input v-model.number="newFood.quantity" type="number" min="1" class="input-field text-sm font-mono no-spinner" placeholder="1" @keyup.enter="submitFood" />
              </div>
              <div>
                <label class="field-label">價格</label>
                <input v-model.number="newFood.price" type="number" min="0" class="input-field text-sm font-mono no-spinner" placeholder="0" />
              </div>
              <div>
                <label class="field-label">備註</label>
                <input v-model="newFood.note" type="text" class="input-field text-sm" placeholder="選填" @keyup.enter="submitFood" />
              </div>
            </div>

            <!-- 參考連結 -->
            <div>
              <label class="field-label">參考連結</label>
              <input v-model="newFood.referenceUrl" type="url" class="input-field text-sm font-mono" placeholder="https://…" />
            </div>

            <div class="flex items-center gap-2">
              <button
                v-if="activeFoodIndex !== null"
                type="button"
                class="px-3 py-1.5 rounded-lg text-xs font-body font-medium cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors duration-200"
                @click="cancelFoodEdit"
              >取消</button>
              <button
                class="flex items-center gap-1.5 btn-cta text-xs font-semibold font-body px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="!newFood.name.trim()" @click="submitFood"
              >
                <SaveIcon v-if="activeFoodIndex !== null" :size="13" />
                <PlusIcon v-else :size="13" />
                {{ activeFoodIndex !== null ? '更新糧食' : '加入清單' }}
              </button>
            </div>
          </div>

          <!-- Navigation -->
          <div class="flex justify-between mt-8 pt-6 border-t border-border/40">
            <button v-if="step > 1"
              class="flex items-center gap-1.5 px-5 py-2.5 rounded-lg card-aged text-inkMuted font-body font-medium cursor-pointer hover:text-ink transition-colors duration-200"
              @click="step--">
              <ArrowLeftIcon :size="14" /> 上一步
            </button>
            <div v-else />
            <button v-if="step < TOTAL_STEPS"
              class="btn-cta flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-semibold font-body cursor-pointer"
              @click="step++">
              下一步 <ArrowRightIcon :size="14" />
            </button>
            <button v-else
              class="btn-cta flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold font-body cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              :disabled="store.loading || !form.title.trim()" @click="save">
              <span v-if="store.loading" class="w-4 h-4 border-2 rounded-full animate-spin border-current border-t-transparent" />
              <SaveIcon v-else :size="15" />
              {{ store.loading ? '儲存中…' : '儲存' }}
            </button>
          </div>

        </div>

        <!-- Gear quick pick panel: outside step card, appears only on step 5 -->
        <Transition name="gear-panel">
          <div v-if="step === 5" class="w-[560px] shrink-0 self-start card-aged p-4">
            <GearQuickPick
              :gears="displayGears"
              :new-gears="gearsToAdd"
              :deleted-gears="deletedGears"
              :active-gear-id="activeGearId"
              :active-new-index="activeNewIndex"
              @select-existing="selectExistingGear"
              @select-new="selectNewGear"
              @mark-delete="markGearDelete"
              @remove-new="(i) => gearsToAdd.splice(i, 1)"
              @undo-delete="undoGearDelete"
            />
          </div>
        </Transition>

        <!-- Food quick-pick panel: appears only on step 6 -->
        <Transition name="gear-panel">
          <div v-if="step === 6" class="w-[480px] shrink-0 self-start card-aged p-4">
            <FoodQuickPick
              :new-foods="foodsToSave"
              :active-new-index="activeFoodIndex"
              @select-new="selectNewFood"
              @remove-new="(i) => foodsToSave.splice(i, 1)"
            />
          </div>
        </Transition>
        </div>
      </template>
    </div>
  </div>

  <!-- ── 裝備庫 Modal ───────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="lib-modal">
      <div v-if="showLibrary" class="lib-backdrop" @click.self="showLibrary = false">
        <div class="lib-modal">
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <div class="flex items-center gap-2">
              <LibraryIcon :size="16" class="text-primary" />
              <span class="font-heading text-lg text-ink tracking-wide">裝備庫</span>
              <span class="font-mono text-xs text-inkMuted ml-1">{{ libraryGears.length }} 件</span>
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
                  class="group/lib border-b border-border/20"
                  :class="addedLibraryIds.has(gear.id)
                    ? 'lib-row-added'
                    : librarySelected.includes(gear.id) ? 'lib-row-selected cursor-pointer' : 'lib-row cursor-pointer'"
                  @click="toggleLibraryGear(gear.id)"
                >
                  <td class="lib-td text-center">
                    <input
                      type="checkbox"
                      class="lib-checkbox"
                      :class="addedLibraryIds.has(gear.id) ? 'cursor-not-allowed' : 'cursor-pointer'"
                      :checked="librarySelected.includes(gear.id)"
                      :disabled="addedLibraryIds.has(gear.id)"
                      @click.stop="toggleLibraryGear(gear.id)"
                    />
                  </td>
                  <td class="lib-td font-medium">
                    <span class="flex items-center gap-1.5" :class="addedLibraryIds.has(gear.id) ? 'text-inkMuted' : 'text-ink'">
                      {{ gear.name }}
                      <a v-if="gear.referenceUrl" :href="gear.referenceUrl" target="_blank" rel="noopener noreferrer"
                        class="text-inkMuted hover:text-primary transition-colors shrink-0" @click.stop>
                        <ExternalLinkIcon :size="10" />
                      </a>
                      <span v-if="addedLibraryIds.has(gear.id)" class="added-badge">已加入</span>
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
              {{ libraryGears.length === 0 ? '— 裝備庫為空 —' : '— 無符合結果 —' }}
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
                :disabled="librarySelected.length === 0"
                @click="confirmLibrarySelection"
              >
                <PlusCircleIcon :size="14" />
                加入清單
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon,
  Save as SaveIcon, Check as CheckIcon,
  Plus as PlusIcon, X as XIcon, Tag as TagIcon, Pencil as PencilIcon,
  Image as ImageIcon, Upload as UploadIcon,
  Route as RouteIcon,
  AlertCircle as AlertCircleIcon,
  RotateCcw as RotateCcwIcon,
  Trash2 as Trash2Icon,
  Library as LibraryIcon,
  Search as SearchIcon,
  PlusCircle as PlusCircleIcon,
  ExternalLink as ExternalLinkIcon,
} from 'lucide-vue-next'
import type { Photo, Gear, GearDraft, FoodDraft } from '../types'
import { usePostStore } from '../stores/postStore'
import CropModal from '../components/CropModal.vue'
import TagPickerModal from '../components/TagPickerModal.vue'
import GearQuickPick from '../components/GearQuickPick.vue'
import FoodQuickPick from '../components/FoodQuickPick.vue'

const route  = useRoute()
const router = useRouter()
const store  = usePostStore()
const id = route.params.id as string

const TOTAL_STEPS = 6
const stepLabels  = ['基本', 'GPX', '封面', '照片', '裝備', '糧食']

// UI state
const step             = ref(1)
const pageLoading      = ref(true)
const confirmingDelete = ref(false)
const tagModalOpen     = ref(false)
const showCropper      = ref(false)
const cropSrc          = ref('')

// File refs
const gpxInput    = ref<HTMLInputElement | null>(null)
const coverInput  = ref<HTMLInputElement | null>(null)
const photosInput = ref<HTMLInputElement | null>(null)

// New file state
const newCoverFile     = ref<File | null>(null)
const newGpxFile       = ref<File | null>(null)
const coverPreview     = ref<string | null>(null)
const newPhotoFiles    = ref<File[]>([])
const newPhotoPreviews = ref<string[]>([])

// Photo delete state
const pendingDeletes = ref<string[]>([])

// Gear state
const gearsToAdd         = ref<GearDraft[]>([])
const gearsToUpdate      = ref<(GearDraft & { id: string })[]>([])
const pendingGearDeletes = ref<string[]>([])
const newGear            = ref<GearDraft>({ name: '', weight: 0, note: '', category: '其他', quantity: 1, brand: '', referenceUrl: '', price: null, addedAt: '' })
const activeGearId       = ref<string | null>(null)
const activeNewIndex     = ref<number | null>(null)

// Food state
const foodsToSave     = ref<FoodDraft[]>([])
const newFood         = ref<FoodDraft>({ name: '', weight: 0, quantity: 1, note: '', referenceUrl: '', price: null })
const activeFoodIndex = ref<number | null>(null)

// Gear library modal
const showLibrary    = ref(false)
const librarySearch  = ref('')
const librarySelected   = ref<string[]>([])

// Form
const form = ref({
  title:       '',
  description: '',
  dateStart:   '',
  dateEnd:     '',
  weather:     '',
  peopleCount: null as number | null,
  tags:        [] as string[],
})

const currentGpxFilename = computed(() => {
  const url = store.currentPost?.gpxFile ?? ''
  return decodeURIComponent(url.split('/').pop() ?? '').replace(/^[^-]+-\d+-/, '') || 'route.gpx'
})

const visiblePhotos = computed<Photo[]>(() =>
  store.currentPhotos.filter(p => !pendingDeletes.value.includes(p.id))
)
const deletedPhotos = computed<Photo[]>(() =>
  store.currentPhotos.filter(p => pendingDeletes.value.includes(p.id))
)
const visibleGears = computed<Gear[]>(() =>
  store.currentGears.filter(g => !pendingGearDeletes.value.includes(g.id))
)
const deletedGears = computed<Gear[]>(() =>
  store.currentGears.filter(g => pendingGearDeletes.value.includes(g.id))
)
const displayGears = computed<Gear[]>(() =>
  visibleGears.value.map(g => {
    const u = gearsToUpdate.value.find(u => u.id === g.id)
    return u ? { ...g, ...u } : g
  })
)

function toDateInput(val: string | null | undefined) {
  return val ? val.slice(0, 10) : ''
}

const libraryGears = computed(() => store.gearLibrary)

const filteredLibrary = computed(() => {
  const q = librarySearch.value.trim().toLowerCase()
  if (!q) return libraryGears.value
  return libraryGears.value.filter(g =>
    g.name.toLowerCase().includes(q) ||
    (g.brand ?? '').toLowerCase().includes(q) ||
    (g.category ?? '').toLowerCase().includes(q)
  )
})

// Tracks all library gear IDs already present in this post (existing + session-added).
// visibleGears already excludes pendingGearDeletes, so removing a gear auto-unblocks it in the picker.
const addedLibraryIds = computed(() => {
  const ids = new Set<string>()
  visibleGears.value.forEach(g => { if (g.gearId) ids.add(g.gearId) })
  gearsToAdd.value.forEach(g => { if (g._libraryId) ids.add(g._libraryId) })
  return ids
})

const selectableLibrary = computed(() =>
  filteredLibrary.value.filter(g => !addedLibraryIds.value.has(g.id))
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
  if (addedLibraryIds.value.has(id)) return
  const idx = librarySelected.value.indexOf(id)
  if (idx >= 0) librarySelected.value.splice(idx, 1)
  else librarySelected.value.push(id)
}

function toggleAllFiltered() {
  if (isAllFilteredSelected.value) {
    const filteredIds = filteredLibrary.value.map(g => g.id)
    librarySelected.value = librarySelected.value.filter(id => !filteredIds.includes(id))
  } else {
    const toAdd = selectableLibrary.value.map(g => g.id).filter(id => !librarySelected.value.includes(id))
    librarySelected.value.push(...toAdd)
  }
}

function confirmLibrarySelection() {
  const gearsMap = new Map(libraryGears.value.map(g => [g.id, g]))
  librarySelected.value.forEach(id => {
    const gear = gearsMap.get(id)
    if (!gear) return
    gearsToAdd.value.push({
      name:         gear.name,
      weight:       gear.weight,
      note:         gear.note ?? '',
      category:     gear.category,
      quantity:     gear.quantity ?? 1,
      brand:        gear.brand ?? '',
      referenceUrl: gear.referenceUrl ?? '',
      price:        gear.price ?? null,
      addedAt:      gear.addedAt ?? '',
      _libraryId:   id,
    })
  })
  showLibrary.value = false
}

onMounted(async () => {
  await Promise.all([store.fetchPostDetail(id), store.fetchGearLibrary(), store.fetchGearCategories()])
  if (store.currentPost) {
    const p = store.currentPost
    form.value.title       = p.title
    form.value.description = p.description ?? ''
    form.value.dateStart   = toDateInput(p.dateStart)
    form.value.dateEnd     = toDateInput(p.dateEnd)
    form.value.weather     = p.weather     ?? ''
    form.value.peopleCount = p.peopleCount ?? null
    form.value.tags        = p.tags?.length ? [...p.tags] : []
  }
  foodsToSave.value = store.currentFoods.map(f => ({
    name:         f.name,
    weight:       f.weight,
    quantity:     f.quantity,
    note:         f.note,
    referenceUrl: f.referenceUrl ?? '',
    price:        f.price ?? null,
  }))
  pageLoading.value = false
})

// Cover
function onCoverChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  ;(e.target as HTMLInputElement).value = ''
  if (cropSrc.value) URL.revokeObjectURL(cropSrc.value)
  cropSrc.value    = URL.createObjectURL(file)
  showCropper.value = true
}
function onCropConfirm(file: File) {
  if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
  newCoverFile.value  = file
  coverPreview.value  = URL.createObjectURL(file)
  showCropper.value   = false
}

// GPX
function onGpxChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  newGpxFile.value = file
  ;(e.target as HTMLInputElement).value = ''
}
function onGpxDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0]
  if (!file || !file.name.endsWith('.gpx')) return
  newGpxFile.value = file
}

// Photos
function onAddPhotos(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  newPhotoFiles.value.push(...files)
  newPhotoPreviews.value.push(...files.map(f => URL.createObjectURL(f)))
  ;(e.target as HTMLInputElement).value = ''
}
function removeNewPhoto(i: number) {
  URL.revokeObjectURL(newPhotoPreviews.value[i])
  newPhotoFiles.value.splice(i, 1)
  newPhotoPreviews.value.splice(i, 1)
}
function markDelete(photoId: string) { pendingDeletes.value.push(photoId) }
function undoDelete(photoId: string) { pendingDeletes.value = pendingDeletes.value.filter(x => x !== photoId) }

// Gears
function submitGear() {
  if (!newGear.value.name.trim()) return
  if (activeGearId.value !== null) {
    const idx = gearsToUpdate.value.findIndex(u => u.id === activeGearId.value)
    const entry = { id: activeGearId.value!, ...newGear.value }
    if (idx >= 0) gearsToUpdate.value[idx] = entry
    else gearsToUpdate.value.push(entry)
    activeGearId.value = null
  } else if (activeNewIndex.value !== null) {
    gearsToAdd.value[activeNewIndex.value] = { ...newGear.value }
    activeNewIndex.value = null
  } else {
    gearsToAdd.value.push({ ...newGear.value })
  }
  newGear.value = { name: '', weight: 0, note: '', category: '其他', quantity: 1, brand: '', referenceUrl: '', price: null, addedAt: '' }
}
function markGearDelete(gearId: string) { pendingGearDeletes.value.push(gearId) }
function undoGearDelete(gearId: string) { pendingGearDeletes.value = pendingGearDeletes.value.filter(x => x !== gearId) }

function selectExistingGear(gear: GearDraft, id: string) {
  if (activeGearId.value === id) { cancelEdit(); return }
  newGear.value        = { ...gear }
  activeGearId.value   = id
  activeNewIndex.value = null
}
function selectNewGear(gear: GearDraft, index: number) {
  if (activeNewIndex.value === index) { cancelEdit(); return }
  newGear.value        = { ...gear }
  activeNewIndex.value = index
  activeGearId.value   = null
}
function cancelEdit() {
  activeGearId.value   = null
  activeNewIndex.value = null
  newGear.value = { name: '', weight: 0, note: '', category: '其他', quantity: 1, brand: '', referenceUrl: '', price: null, addedAt: '' }
}

// Foods
function submitFood() {
  if (!newFood.value.name.trim()) return
  if (activeFoodIndex.value !== null) {
    foodsToSave.value[activeFoodIndex.value] = { ...newFood.value }
    activeFoodIndex.value = null
  } else {
    foodsToSave.value.push({ ...newFood.value })
  }
  newFood.value = { name: '', weight: 0, quantity: 1, note: '', referenceUrl: '', price: null }
}

function selectNewFood(food: FoodDraft, index: number) {
  if (activeFoodIndex.value === index) { cancelFoodEdit(); return }
  newFood.value         = { ...food }
  activeFoodIndex.value = index
}

function cancelFoodEdit() {
  activeFoodIndex.value = null
  newFood.value = { name: '', weight: 0, quantity: 1, note: '', referenceUrl: '', price: null }
}

// Delete post
async function handleDelete() {
  try {
    await store.deletePost(id)
    router.replace('/')
  } catch { /* error shown via store.error */ }
}

// Save
async function save() {
  // Auto-commit any in-progress gear edit before saving
  if ((activeGearId.value !== null || activeNewIndex.value !== null) && newGear.value.name.trim()) {
    submitGear()
  }
  if (activeFoodIndex.value !== null && newFood.value.name.trim()) {
    submitFood()
  }
  try {
    await store.updatePost(id, {
      title:            form.value.title,
      description:      form.value.description,
      coverFile:        newCoverFile.value,
      gpxFile:          newGpxFile.value,
      photoFilesToAdd:  newPhotoFiles.value,
      photoIdsToDelete: pendingDeletes.value,
      gearsToAdd:           gearsToAdd.value.filter(g => !g._libraryId).map(({ _libraryId, ...g }) => g),
      libraryGearIdsToLink: gearsToAdd.value.filter(g => !!g._libraryId).map(g => g._libraryId!),
      gearsToUpdate:    gearsToUpdate.value,
      gearIdsToDelete:  pendingGearDeletes.value,
      dateStart:        form.value.dateStart  || undefined,
      dateEnd:          form.value.dateEnd    || undefined,
      weather:          form.value.weather    || undefined,
      peopleCount:      form.value.peopleCount,
      tags:             form.value.tags,
      foods:            foodsToSave.value,
    })
    router.push(`/detail/${id}`)
  } catch { /* error shown via store.error */ }
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
  margin-bottom: 6px;
}

/* ── Gear row ───────────────────────────────────────── */
.gear-row {
  display: grid;
  grid-template-columns: 1fr 90px 40px 56px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--c-border) 45%, transparent);
  font-size: 13px;
  font-family: Inter, sans-serif;
  color: var(--c-ink);
  background: color-mix(in srgb, var(--c-card) 60%, transparent);
}
.gear-name     { font-weight: 500; }
.gear-category { font-size: 11px; color: var(--c-primary); }
.gear-qty      { font-size: 12px; font-family: 'Space Mono', monospace; color: var(--c-inkMuted); text-align: center; }
.gear-weight   { font-size: 12px; font-family: 'Space Mono', monospace; color: var(--c-ink); text-align: right; }
.gear-note     { font-size: 12px; }
.gear-del      { flex-shrink: 0; }

/* Remove number spinners */
.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.no-spinner { -moz-appearance: textfield; }

/* ── Delete button ──────────────────────────────────── */
.delete-btn {
  background: rgba(220, 60, 60, 0.1);
  color: #e07070;
  border: 1px solid rgba(220, 60, 60, 0.35);
}
.delete-btn:hover:not(:disabled) {
  background: rgba(220, 60, 60, 0.2);
  border-color: rgba(220, 60, 60, 0.6);
  color: #f08080;
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

/* ── Gear panel slide-in ────────────────────────────── */
.gear-panel-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.gear-panel-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.gear-panel-enter-from, .gear-panel-leave-to { opacity: 0; transform: translateX(12px); }

/* ── Library modal ──────────────────────────────────── */
.lib-modal-enter-active { transition: opacity 0.2s ease; }
.lib-modal-leave-active { transition: opacity 0.15s ease; }
.lib-modal-enter-from, .lib-modal-leave-to { opacity: 0; }
.lib-modal-enter-active .lib-modal,
.lib-modal-leave-active .lib-modal { transition: transform 0.2s ease; }
.lib-modal-enter-from .lib-modal, .lib-modal-leave-to .lib-modal { transform: translateY(16px) scale(0.98); }

.lib-backdrop {
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
.lib-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 820px;
  max-height: 80vh;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  background: var(--c-card);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.lib-th {
  padding: 6px 12px 8px;
  font-size: 11px;
  font-family: Inter, sans-serif;
  font-weight: 600;
  color: var(--c-inkMuted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}
.lib-td {
  padding: 9px 12px;
  font-size: 13px;
  font-family: Inter, sans-serif;
  color: var(--c-inkMuted);
  white-space: nowrap;
}
.note-cell {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cat-badge {
  display: inline-block;
  font-size: 11px;
  font-family: Inter, sans-serif;
  color: var(--c-primary);
  background: color-mix(in srgb, var(--c-primary) 10%, transparent);
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
}
.lib-row:hover td {
  background: color-mix(in srgb, var(--c-primary) 7%, transparent);
}
.lib-row-selected td {
  background: color-mix(in srgb, var(--c-primary) 14%, transparent);
}
.lib-row-selected:hover td {
  background: color-mix(in srgb, var(--c-primary) 18%, transparent);
}
.lib-row-added td {
  opacity: 0.45;
}
.added-badge {
  font-size: 10px;
  font-family: 'Space Mono', monospace;
  color: var(--c-primary);
  border: 1px solid color-mix(in srgb, var(--c-primary) 40%, transparent);
  padding: 0 5px;
  border-radius: 4px;
  flex-shrink: 0;
}
.lib-checkbox {
  width: 15px;
  height: 15px;
  accent-color: var(--c-primary);
}

/* ── Delete modal ───────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(10, 9, 8, 0.72);
  backdrop-filter: blur(4px);
}
.modal-box {
  width: 100%;
  max-width: 380px;
  border-radius: 16px;
  padding: 32px 28px 28px;
  background: var(--c-card);
  border: 1px solid rgba(220, 60, 60, 0.25);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.04) inset;
  text-align: center;
}
.modal-icon-wrap {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: rgba(220, 60, 60, 0.12);
  border: 1px solid rgba(220, 60, 60, 0.3);
  color: #e07070;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}
.modal-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.modal-leave-active { transition: opacity 0.14s ease, transform 0.12s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.96); }
</style>
