<template>
  <div>
    <!-- Desktop: native select -->
    <select v-if="!isMobile" v-model="model" class="input-field text-sm font-body">
      <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
    </select>

    <!-- Mobile: trigger button -->
    <button
      v-else
      type="button"
      class="input-field text-sm font-body w-full text-left flex items-center justify-between gap-2"
      @click="sheetOpen = true"
    >
      <span class="truncate">{{ model || '選擇類別' }}</span>
      <ChevronUpIcon :size="13" class="shrink-0 opacity-40" />
    </button>

    <!-- "新增類別" inline (desktop only) -->
    <template v-if="!isMobile">
      <div v-if="addingCat" class="flex items-center gap-1.5 mt-1.5">
        <input
          v-model="newCatName"
          type="text"
          class="input-field text-xs flex-1"
          placeholder="新類別名稱"
          @keydown.enter="confirmAdd"
          @keydown.escape="addingCat = false; newCatName = ''"
        />
        <button type="button" class="w-7 h-7 rounded-lg flex items-center justify-center btn-cta cursor-pointer disabled:opacity-40"
          :disabled="!newCatName.trim() || savingCat" @click="confirmAdd">
          <span v-if="savingCat" class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          <CheckIcon v-else :size="11" />
        </button>
        <button type="button" class="w-7 h-7 rounded-lg flex items-center justify-center card-aged text-inkMuted hover:text-ink transition-colors cursor-pointer"
          @click="addingCat = false; newCatName = ''">
          <XIcon :size="11" />
        </button>
      </div>
      <button v-else type="button"
        class="mt-1.5 flex items-center gap-1 text-[11px] font-body text-inkMuted hover:text-primary transition-colors cursor-pointer"
        @click="addingCat = true">
        <PlusIcon :size="10" /> 新增類別
      </button>
    </template>
  </div>

  <!-- Mobile: bottom sheet -->
  <Teleport to="body">
    <Transition name="cat-sheet">
      <div v-if="sheetOpen && isMobile" class="cat-backdrop" @click.self="sheetOpen = false">
        <div class="cat-sheet-box">
          <div class="cat-handle" />
          <p class="cat-title">選擇類別</p>

          <div class="cat-list">
            <button
              v-for="cat in categories" :key="cat"
              type="button"
              class="cat-item"
              :class="model === cat ? 'cat-item--active' : ''"
              @click="model = cat; sheetOpen = false"
            >
              {{ cat }}
              <CheckIcon v-if="model === cat" :size="14" class="shrink-0" style="color: var(--c-primary);" />
            </button>

            <div class="cat-divider" />

            <!-- Add new category inline in sheet -->
            <div v-if="addingCat" class="px-5 py-3 flex items-center gap-2">
              <input
                v-model="newCatName"
                type="text"
                class="input-field text-sm flex-1"
                placeholder="新類別名稱"
                @keydown.enter="confirmAdd"
              />
              <button type="button" class="w-8 h-8 rounded-lg flex items-center justify-center btn-cta cursor-pointer disabled:opacity-40 shrink-0"
                :disabled="!newCatName.trim() || savingCat" @click="confirmAdd">
                <span v-if="savingCat" class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                <CheckIcon v-else :size="12" />
              </button>
              <button type="button" class="w-8 h-8 rounded-lg flex items-center justify-center card-aged text-inkMuted cursor-pointer shrink-0"
                @click="addingCat = false; newCatName = ''">
                <XIcon :size="12" />
              </button>
            </div>
            <button v-else type="button" class="cat-item" style="color: var(--c-primary);"
              @click="addingCat = true">
              <span class="flex items-center gap-2"><PlusIcon :size="13" /> 新增類別</span>
            </button>
          </div>

          <div class="pb-safe" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Plus as PlusIcon, Check as CheckIcon, X as XIcon, ChevronUp as ChevronUpIcon } from 'lucide-vue-next'

const props = defineProps<{
  categories: string[]
  addCategory: (name: string) => Promise<void>
}>()

const model = defineModel<string>({ required: true })

const isMobile  = ref(typeof window !== 'undefined' && window.innerWidth < 640)
const sheetOpen  = ref(false)
const addingCat  = ref(false)
const newCatName = ref('')
const savingCat  = ref(false)

function onResize() { isMobile.value = window.innerWidth < 640 }
onMounted(() => window.addEventListener('resize', onResize, { passive: true }))
onUnmounted(() => window.removeEventListener('resize', onResize))

async function confirmAdd() {
  const name = newCatName.value.trim()
  if (!name || savingCat.value) return
  savingCat.value = true
  try {
    await props.addCategory(name)
    model.value      = name
    addingCat.value  = false
    newCatName.value = ''
    sheetOpen.value  = false
  } catch {
    // keep input open on error
  } finally {
    savingCat.value = false
  }
}
</script>

<style scoped>
.cat-backdrop {
  position: fixed; inset: 0; z-index: 500;
  display: flex; align-items: flex-end;
  background: rgba(0,0,0,0.55);
}
.cat-sheet-box {
  width: 100%;
  background: var(--c-card);
  border-top: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  box-shadow: 0 -8px 48px rgba(0,0,0,0.4);
  max-height: 70dvh;
  display: flex;
  flex-direction: column;
}
.cat-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: color-mix(in srgb, var(--c-border) 70%, transparent);
  margin: 12px auto 0; flex-shrink: 0;
}
.cat-title {
  padding: 12px 20px 8px;
  font-family: Inter, sans-serif; font-size: 11px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--c-inkMuted); flex-shrink: 0;
}
.cat-list {
  overflow-y: auto; flex: 1;
  padding-bottom: env(safe-area-inset-bottom, 8px);
}
.cat-divider {
  height: 1px;
  background: color-mix(in srgb, var(--c-border) 40%, transparent);
  margin: 4px 0;
}
.cat-item {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 13px 20px;
  font-family: Inter, sans-serif; font-size: 15px;
  color: var(--c-ink); background: transparent; border: none;
  cursor: pointer; text-align: left;
  transition: background 0.12s;
}
.cat-item:active { background: color-mix(in srgb, var(--c-primary) 8%, transparent); }
.cat-item--active { color: var(--c-primary); font-weight: 600; }

.cat-sheet-enter-active { transition: opacity 0.2s ease, transform 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
.cat-sheet-leave-active { transition: opacity 0.16s ease, transform 0.2s ease; }
.cat-sheet-enter-from, .cat-sheet-leave-to { opacity: 0; transform: translateY(60%); }
</style>
