<template>
  <Teleport to="body">
    <Transition name="btt-fade">
      <button
        v-if="visible"
        class="btt-btn"
        aria-label="回到頂部"
        @click="scrollToTop"
      >
        <ArrowUpIcon :size="18" />
      </button>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowUp as ArrowUpIcon } from 'lucide-vue-next'
import { useBrowserPanel } from '../composables/useBrowserPanel'

const route          = useRoute()
const { browserOpen } = useBrowserPanel()
const THRESHOLD      = 320
const scrolled       = ref(false)

// Detect native browser scroll-to-top support (CSS Overflow spec)
const nativeSupported = typeof CSS !== 'undefined' && CSS.supports('scroll-to-top', 'auto')

// PostDetail has its own back-to-top; hide while inline browser panel is open
const visible = computed(() =>
  scrolled.value &&
  !route.path.startsWith('/detail/') &&
  !nativeSupported &&
  !browserOpen.value
)

function onScroll() {
  scrolled.value = window.scrollY > THRESHOLD
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  if (nativeSupported) {
    // Let the browser render its own button for the document scroll container
    document.documentElement.style.setProperty('scroll-to-top', 'auto')
  } else {
    window.addEventListener('scroll', onScroll, { passive: true })
  }
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.btt-btn {
  position: fixed;
  bottom: 28px;
  right: 20px;
  z-index: 90;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--c-border) 70%, transparent);
  background: color-mix(in srgb, var(--c-card) 90%, transparent);
  color: var(--c-inkMuted);
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
  backdrop-filter: blur(8px);
  transition: background 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s;
}
.btt-btn:hover {
  background: var(--c-card);
  color: var(--c-primary);
  box-shadow: 0 6px 24px rgba(0,0,0,0.35);
  transform: translateY(-2px);
}
.btt-btn:active {
  transform: translateY(0);
}

.btt-fade-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.btt-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.btt-fade-enter-from, .btt-fade-leave-to { opacity: 0; transform: translateY(8px); }
</style>
