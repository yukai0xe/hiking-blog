<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="detailEntry" class="modal-backdrop" @click.self="closeDetail">
        <div class="detail-modal">
          <div class="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <div>
              <p class="text-[10px] font-body uppercase tracking-widest text-primary opacity-60 mb-0.5">Route Preview</p>
              <h2 class="font-heading text-lg text-ink">{{ detailEntry.name }}</h2>
            </div>
            <button class="text-inkMuted hover:text-ink transition-colors cursor-pointer" @click="closeDetail"><XIcon :size="18" /></button>
          </div>
          <!-- Leaflet map -->
          <div ref="detailMapEl" style="height: 420px;" />
          <!-- Stats -->
          <div v-if="detailStats" class="flex items-center justify-around px-5 py-4 border-t border-border/40">
            <div class="text-center">
              <p class="font-heading text-xl font-bold text-ink leading-none mb-0.5">{{ detailStats.distanceKm }}</p>
              <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">km 路線長</p>
            </div>
            <div class="w-px h-8 bg-border/40" />
            <div class="text-center">
              <p class="font-heading text-xl font-bold text-ink leading-none mb-0.5">{{ detailStats.totalAscent }}</p>
              <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">m 爬升</p>
            </div>
            <div class="w-px h-8 bg-border/40" />
            <div class="text-center">
              <p class="font-heading text-xl font-bold text-ink leading-none mb-0.5">{{ detailStats.maxElevation }}</p>
              <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">m 最高點</p>
            </div>
            <div class="w-px h-8 bg-border/40" />
            <div class="text-center">
              <p class="font-heading text-xl font-bold text-ink leading-none mb-0.5">{{ detailStats.minElevation }}</p>
              <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">m 最低點</p>
            </div>
          </div>
          <div v-else class="py-4 text-center text-inkMuted font-body text-sm">載入路線資料中…</div>
          <div v-if="detailEntry.referenceUrl" class="px-5 py-3 border-t border-border/40 flex items-center gap-2">
            <span class="text-[10px] font-body uppercase tracking-widest text-inkMuted shrink-0">參考連結</span>
            <a :href="detailEntry.referenceUrl" target="_blank" rel="noopener noreferrer"
               class="text-xs font-mono text-primary hover:opacity-70 truncate transition-opacity">
              {{ detailEntry.referenceUrl }}
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import { X as XIcon } from 'lucide-vue-next'
import { useGpxDetail } from '../composables/useGpxDetail'

const { detailEntry, detailMapEl, detailStats, openDetail, closeDetail } = useGpxDetail()

defineExpose({ openDetail, closeDetail, detailMapEl })
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; z-index: 9000;
  display: flex; align-items: center; justify-content: center; padding: 24px;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
}
.detail-modal {
  width: 100%; max-width: 800px; max-height: 90vh;
  border-radius: 16px; overflow: hidden;
  background: var(--c-card);
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  box-shadow: 0 24px 60px rgba(0,0,0,0.5);
  display: flex; flex-direction: column;
}
.modal-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.modal-leave-active { transition: opacity 0.14s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .detail-modal { transform: translateY(12px) scale(0.98); }
</style>
