<template>
  <div class="relative" ref="wrapRef">
    <input
      v-model="model"
      type="text"
      class="input-field text-sm"
      placeholder="品牌名稱"
      autocomplete="off"
      @focus="onFocus"
    />

    <!-- Desktop: inline dropdown -->
    <Transition name="brand-drop">
      <div v-if="!isMobile && showDropdown && suggestions.length" class="brand-dropdown">
        <button
          v-for="b in suggestions" :key="b"
          type="button"
          class="brand-option"
          :class="{ 'brand-option--active': model === b }"
          @mousedown.prevent="model = b; showDropdown = false"
        >{{ b }}</button>
      </div>
    </Transition>
  </div>

  <!-- Mobile: bottom sheet -->
  <Teleport to="body">
    <Transition name="brand-sheet">
      <div v-if="isMobile && showDropdown && suggestions.length" class="brand-backdrop" @click.self="showDropdown = false">
        <div class="brand-sheet-box">
          <div class="brand-handle" />
          <p class="brand-title">選擇品牌</p>
          <div class="brand-list">
            <button
              v-for="b in suggestions" :key="b"
              type="button"
              class="brand-item"
              :class="model === b ? 'brand-item--active' : ''"
              @click="model = b; showDropdown = false"
            >
              {{ b }}
              <CheckIcon v-if="model === b" :size="14" class="shrink-0" style="color: var(--c-primary);" />
            </button>
          </div>
          <div style="padding-bottom: env(safe-area-inset-bottom, 8px);" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, onMounted, onUnmounted } from 'vue'
import { Check as CheckIcon } from 'lucide-vue-next'

const props = defineProps<{ existingBrands: string[] }>()
const model = defineModel<string>({ required: true })

const showDropdown = ref(false)
const wrapRef = ref<HTMLElement | null>(null)

const isMobile = ref(typeof window !== 'undefined' && window.innerWidth < 640)
function onResize() { isMobile.value = window.innerWidth < 640 }
onMounted(() => window.addEventListener('resize', onResize, { passive: true }))
onUnmounted(() => window.removeEventListener('resize', onResize))

const suggestions = computed(() => {
  const q = model.value.trim().toLowerCase()
  if (!q) return props.existingBrands
  return props.existingBrands.filter(b => b.toLowerCase().includes(q))
})

function onFocus() {
  if (suggestions.value.length) showDropdown.value = true
}

function onClickOutside(e: MouseEvent) {
  if (!wrapRef.value?.contains(e.target as Node)) showDropdown.value = false
}

watch(showDropdown, (val) => {
  if (val && !isMobile.value) document.addEventListener('mousedown', onClickOutside)
  else document.removeEventListener('mousedown', onClickOutside)
})

onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
/* Desktop dropdown */
.brand-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0; right: 0;
  z-index: 50;
  background: var(--c-card);
  border: 1px solid color-mix(in srgb, var(--c-border) 70%, transparent);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.35);
  overflow: hidden;
  max-height: 200px;
  overflow-y: auto;
}
.brand-option {
  display: block; width: 100%; text-align: left;
  padding: 8px 12px; font-size: 13px;
  font-family: var(--font-body, sans-serif);
  color: var(--c-inkMuted); cursor: pointer;
  transition: background 0.1s, color 0.1s;
}
.brand-option:hover { background: color-mix(in srgb, var(--c-primary) 10%, transparent); color: var(--c-ink); }
.brand-option--active { background: color-mix(in srgb, var(--c-primary) 14%, transparent); color: var(--c-primary); font-weight: 600; }
.brand-drop-enter-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.brand-drop-leave-active { transition: opacity 0.08s ease, transform 0.08s ease; }
.brand-drop-enter-from, .brand-drop-leave-to { opacity: 0; transform: translateY(-4px); }

/* Mobile bottom sheet */
.brand-backdrop {
  position: fixed; inset: 0; z-index: 500;
  display: flex; align-items: flex-end;
  background: rgba(0,0,0,0.55);
}
.brand-sheet-box {
  width: 100%;
  background: var(--c-card);
  border-top: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  box-shadow: 0 -8px 48px rgba(0,0,0,0.4);
  max-height: 60dvh;
  display: flex;
  flex-direction: column;
}
.brand-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: color-mix(in srgb, var(--c-border) 70%, transparent);
  margin: 12px auto 0; flex-shrink: 0;
}
.brand-title {
  padding: 12px 20px 8px;
  font-family: Inter, sans-serif; font-size: 11px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--c-inkMuted); flex-shrink: 0;
}
.brand-list {
  overflow-y: auto; flex: 1;
}
.brand-item {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 13px 20px;
  font-family: Inter, sans-serif; font-size: 15px;
  color: var(--c-ink); background: transparent; border: none;
  cursor: pointer; text-align: left;
  transition: background 0.12s;
}
.brand-item:active { background: color-mix(in srgb, var(--c-primary) 8%, transparent); }
.brand-item--active { color: var(--c-primary); font-weight: 600; }

.brand-sheet-enter-active { transition: opacity 0.2s ease, transform 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
.brand-sheet-leave-active { transition: opacity 0.16s ease, transform 0.2s ease; }
.brand-sheet-enter-from, .brand-sheet-leave-to { opacity: 0; transform: translateY(60%); }
</style>
