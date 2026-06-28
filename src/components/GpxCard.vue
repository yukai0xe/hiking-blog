<template>
  <div
    class="gpx-card card-reveal cursor-pointer"
    :class="{
      'gpx-card-dragging': isDragging,
      'gpx-card-dragover': isDragOver,
    }"
    class="w-full sm:max-w-[350px]"
    draggable="true"
    @click="emit('click')"
    @dragstart="emit('dragstart')"
    @dragover.prevent="emit('dragover')"
    @drop.prevent="emit('drop')"
    @dragend="emit('dragend')"
  >
    <!-- Top accent line -->
    <div class="card-top-accent" aria-hidden="true" />

    <!-- Elevation chart preview (advanced mode only) -->
    <div v-if="viewMode === 'advanced'" class="card-map" style="height: 110px; background: #080604; position: relative; overflow: hidden; flex-shrink: 0;">
      <div v-if="cardElevation === undefined" class="absolute inset-0 flex items-center justify-center">
        <div class="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin opacity-40" />
      </div>
      <div v-else-if="!cardElevation?.length" class="absolute inset-0 flex items-center justify-center">
        <span class="text-[10px] font-mono text-inkMuted opacity-30">no elevation</span>
      </div>
      <ElevationChart v-else :elevation="cardElevation" :mini="true" class="absolute inset-0 w-full h-full" />
    </div>

    <!-- Footer -->
    <div class="card-footer">
      <!-- Nature watermark -->
      <div class="card-nature-wm" aria-hidden="true" v-html="natureSvg" />

      <!-- Name + action buttons -->
      <div class="flex items-start justify-between gap-1 mb-2 relative">
        <p class="card-name font-heading font-bold text-ink" style="font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 1; line-height: 1.25;">{{ entry.name }}</p>
        <div class="flex items-center gap-0.5 flex-shrink-0">
          <button
            class="wishlist-btn"
            :class="{ 'wishlist-btn-active': entry.isWishlist }"
            :title="entry.isWishlist ? '移出願望清單' : '加入願望清單'"
            @click.stop="emit('toggleWishlist')"
          ><BookmarkIcon :size="13" /></button>
          <button
            class="card-more-btn"
            :class="{ 'card-more-btn-active': isMenuOpen }"
            title="更多"
            @click.stop="emit('openMenu', $event)"
          ><MoreVerticalIcon :size="13" /></button>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="entry.tags?.length || entry.peopleCount" class="flex flex-wrap gap-1 mb-2.5">
        <span v-if="entry.peopleCount" class="tag-ppl">👤 {{ entry.peopleCount }}</span>
        <span v-for="tag in entry.tags" :key="tag" class="tag-label">{{ tag }}</span>
      </div>

      <!-- Difficulty + date -->
      <div class="flex items-center justify-between relative" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; margin-top: auto;">
        <div class="nature-diff" :style="{ color: entry.difficultyStars ? 'var(--c-primary)' : 'var(--c-inkMuted)' }">
          <Star :size="12" style="fill: currentColor; stroke: none;" />
          <span>{{ entry.difficultyStars ? `×${entry.difficultyStars}` : '—' }}</span>
        </div>
        <span class="font-mono" style="font-size: 10px; color: var(--c-ink); letter-spacing: 0.03em;">{{ entry.date ?? '—' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bookmark as BookmarkIcon, MoreVertical as MoreVerticalIcon, Star } from 'lucide-vue-next'
import ElevationChart from './ElevationChart.vue'
import type { GpxLibraryEntry } from '../types'

defineProps<{
  entry: GpxLibraryEntry
  viewMode: 'simple' | 'advanced'
  cardElevation: number[] | null | undefined
  isDragging: boolean
  isDragOver: boolean
  isMenuOpen: boolean
  natureSvg: string
}>()

const emit = defineEmits<{
  click: []
  dragstart: []
  dragover: []
  drop: []
  dragend: []
  toggleWishlist: []
  openMenu: [event: MouseEvent]
}>()
</script>

<style scoped>
.gpx-card {
  border-radius: 13px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  background: linear-gradient(160deg, #1c1710 0%, #0d0b08 100%);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--c-primary) 22%, rgba(255,255,255,0.05)),
    inset 0 1px 0 rgba(255,255,255,0.07),
    0 4px 18px rgba(0,0,0,0.6);
}
.gpx-card:hover {
  transform: translateY(-3px);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--c-primary) 52%, transparent),
    inset 0 1px 0 rgba(255,255,255,0.1),
    0 14px 40px rgba(0,0,0,0.7),
    0 0 30px color-mix(in srgb, var(--c-primary) 7%, transparent);
}

.card-top-accent {
  height: 2px;
  flex-shrink: 0;
  background: linear-gradient(90deg,
    transparent 0%,
    color-mix(in srgb, var(--c-primary) 40%, transparent) 25%,
    color-mix(in srgb, var(--c-primary) 70%, transparent) 50%,
    color-mix(in srgb, var(--c-primary) 40%, transparent) 75%,
    transparent 100%
  );
}

.card-footer {
  background: linear-gradient(180deg, rgba(20,15,8,0.9) 0%, rgba(10,8,5,0.95) 100%);
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 11px 13px 12px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-nature-wm {
  position: absolute;
  bottom: -6px;
  right: -4px;
  opacity: 0.18;
  color: var(--c-primary);
  pointer-events: none;
  transform: rotate(-10deg);
  line-height: 0;
}
.card-nature-wm :deep(svg) {
  display: block;
  width: 72px;
  height: 72px;
  fill: currentColor;
  stroke: none;
}

.nature-diff {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-family: 'Space Mono', monospace;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.tag-ppl {
  font-size: 10px; font-family: monospace; padding: 2px 7px; border-radius: 4px;
  background: rgba(198,172,143,0.12); color: var(--c-primary); border: 1px solid rgba(198,172,143,0.2);
}
.tag-label {
  font-size: 10px; font-family: Inter, sans-serif; padding: 2px 7px; border-radius: 4px;
  background: color-mix(in srgb, var(--c-primary) 18%, transparent);
  color: var(--c-ink); border: 1px solid color-mix(in srgb, var(--c-primary) 30%, transparent);
}

.card-more-btn {
  color: var(--c-inkMuted); opacity: 0.35;
  transition: color 0.15s, opacity 0.15s, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s;
  cursor: pointer; margin-top: 1px; padding: 3px; border-radius: 4px;
}
.card-more-btn:hover { opacity: 0.8; color: var(--c-ink); background: rgba(255,255,255,0.06); }
.card-more-btn-active {
  opacity: 1; color: var(--c-primary);
  transform: rotate(90deg);
  background: color-mix(in srgb, var(--c-primary) 12%, transparent);
}

.wishlist-btn {
  color: var(--c-inkMuted); opacity: 0.35;
  transition: color 0.15s, opacity 0.15s;
  cursor: pointer; margin-top: 1px;
}
.wishlist-btn:hover { opacity: 0.75; color: var(--c-primary); }
.wishlist-btn-active { color: var(--c-primary) !important; opacity: 1 !important; }

.gpx-card-dragging { opacity: 0.4; box-shadow: none !important; transform: none !important; }
.gpx-card-dragover { border-color: var(--c-primary) !important; box-shadow: 0 0 0 2px color-mix(in srgb, var(--c-primary) 40%, transparent); }

.card-reveal {
  opacity: 0;
  transform: translateY(22px);
  transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
.card-reveal.card-visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
