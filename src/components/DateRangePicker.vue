<template>
  <div class="drp-wrap" ref="wrapRef">
    <!-- Trigger button -->
    <button
      class="drp-trigger flex items-center gap-2"
      :class="{ 'drp-trigger--active': start || end }"
      @click="open = !open"
    >
      <CalendarIcon :size="13" class="shrink-0 opacity-70" />
      <span class="truncate">{{ displayText }}</span>
    </button>

    <!-- Calendar dropdown -->
    <Transition name="drp">
      <div v-if="open" class="drp-dropdown">

        <!-- Month header -->
        <div class="drp-header">
          <button class="drp-nav" @click="shiftMonth(-1)" aria-label="上個月">
            <ChevronLeftIcon :size="14" />
          </button>
          <span class="drp-month-label font-heading">
            {{ viewYear }} 年 {{ viewMonth + 1 }} 月
          </span>
          <button class="drp-nav" @click="shiftMonth(1)" aria-label="下個月">
            <ChevronRightIcon :size="14" />
          </button>
        </div>

        <!-- Weekday row -->
        <div class="drp-weekdays">
          <span v-for="w in ['日','一','二','三','四','五','六']" :key="w">{{ w }}</span>
        </div>

        <!-- Day grid -->
        <div class="drp-grid">
          <button
            v-for="d in calendarDays"
            :key="d.date"
            class="drp-day"
            :class="dayClass(d)"
            :disabled="!d.currentMonth"
            @click="selectDay(d.date)"
            @mouseenter="hoverDate = d.date"
            @mouseleave="hoverDate = ''"
          >
            {{ d.day }}
          </button>
        </div>

        <!-- Footer -->
        <div class="drp-footer">
          <span class="drp-hint font-body">
            {{ start && !end ? '請選擇結束日期' : start ? `${fmt(start)} → ${fmt(end)}` : '請選擇起始日期' }}
          </span>
          <button v-if="start || end" class="drp-clear font-body" @click="clear">清除</button>
        </div>

      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Calendar as CalendarIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from 'lucide-vue-next'

const start = defineModel<string>('start', { required: true })
const end   = defineModel<string>('end',   { required: true })

const open      = ref(false)
const hoverDate = ref('')
const wrapRef   = ref<HTMLElement | null>(null)

const today     = new Date()
const viewYear  = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())

// ── Helpers ───────────────────────────────────────────
function toStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fmt(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${y}/${m}/${d}`
}

// ── Calendar days ──────────────────────────────────────
interface CalDay { date: string; day: number; currentMonth: boolean }

const calendarDays = computed<CalDay[]>(() => {
  const days: CalDay[] = []
  const first   = new Date(viewYear.value, viewMonth.value, 1)
  const last    = new Date(viewYear.value, viewMonth.value + 1, 0)
  const padStart = first.getDay()

  for (let i = padStart - 1; i >= 0; i--) {
    const d = new Date(viewYear.value, viewMonth.value, -i)
    days.push({ date: toStr(d), day: d.getDate(), currentMonth: false })
  }
  for (let i = 1; i <= last.getDate(); i++) {
    days.push({ date: toStr(new Date(viewYear.value, viewMonth.value, i)), day: i, currentMonth: true })
  }
  const endPad = (7 - (days.length % 7)) % 7
  for (let i = 1; i <= endPad; i++) {
    const d = new Date(viewYear.value, viewMonth.value + 1, i)
    days.push({ date: toStr(d), day: d.getDate(), currentMonth: false })
  }
  return days
})

// ── Day class ──────────────────────────────────────────
function dayClass(d: CalDay) {
  if (!d.currentMonth) return 'drp-day--other'
  const s = start.value
  const e = end.value || hoverDate.value
  const isStart = d.date === s
  const isEnd   = d.date === (end.value || '')
  const inRange = s && e && d.date > (s < e ? s : e) && d.date < (s < e ? e : s)
  const isHoverEnd = !end.value && hoverDate.value && s && d.date === hoverDate.value && d.date > s
  return {
    'drp-day--start':    isStart,
    'drp-day--end':      isEnd,
    'drp-day--in-range': inRange || isHoverEnd,
    'drp-day--today':    d.date === toStr(today) && !isStart && !isEnd,
  }
}

// ── Selection logic ────────────────────────────────────
function selectDay(date: string) {
  if (!start.value || (start.value && end.value)) {
    start.value = date
    end.value = ''
  } else {
    if (date < start.value) {
      end.value = start.value
      start.value = date
    } else {
      end.value = date
    }
    open.value = false
  }
}

function clear() {
  start.value = ''
  end.value = ''
}

function shiftMonth(delta: number) {
  const d = new Date(viewYear.value, viewMonth.value + delta, 1)
  viewYear.value  = d.getFullYear()
  viewMonth.value = d.getMonth()
}

// ── Display text ───────────────────────────────────────
const displayText = computed(() => {
  if (start.value && end.value)   return `${fmt(start.value)} → ${fmt(end.value)}`
  if (start.value)                return `${fmt(start.value)} →`
  return '選擇日期'
})

// ── Click outside ──────────────────────────────────────
function onClickOutside(e: MouseEvent) {
  if (wrapRef.value && !wrapRef.value.contains(e.target as Node)) open.value = false
}
onMounted(()   => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.drp-wrap { position: relative; }

/* Trigger */
.drp-trigger {
  min-width: 130px;
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
  white-space: nowrap;
}
.drp-trigger:focus { border-color: var(--c-primary); }
.drp-trigger--active { border-color: var(--c-primary); color: var(--c-primary); }

/* Dropdown */
.drp-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 100;
  width: 260px;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  box-shadow: 0 12px 36px var(--c-shadow);
  overflow: hidden;
}

/* Header */
.drp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--c-border);
}
.drp-month-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-ink);
  letter-spacing: 0.03em;
}
.drp-nav {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-inkMuted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.drp-nav:hover { background: var(--c-border); color: var(--c-ink); }

/* Weekdays */
.drp-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 6px 8px 2px;
}
.drp-weekdays span {
  text-align: center;
  font-size: 10px;
  font-family: Inter, sans-serif;
  color: var(--c-inkMuted);
  opacity: 0.6;
  letter-spacing: 0.05em;
}

/* Day grid */
.drp-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 2px 8px 8px;
  gap: 1px;
}
.drp-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-family: Inter, sans-serif;
  color: var(--c-ink);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
}
.drp-day:hover:not(:disabled):not(.drp-day--start):not(.drp-day--end) {
  background: color-mix(in srgb, var(--c-primary) 15%, transparent);
}
.drp-day--other    { color: var(--c-inkMuted); opacity: 0.3; cursor: default; }
.drp-day--today    { font-weight: 700; color: var(--c-primary); }
.drp-day--in-range { background: color-mix(in srgb, var(--c-primary) 15%, transparent); border-radius: 0; }
.drp-day--start,
.drp-day--end {
  background: var(--c-primary);
  color: var(--c-base);
  font-weight: 700;
  border-radius: 6px;
}

/* Footer */
.drp-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid var(--c-border);
}
.drp-hint  { font-size: 11px; color: var(--c-inkMuted); }
.drp-clear {
  font-size: 11px;
  font-weight: 600;
  color: var(--c-primary);
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.15s;
}
.drp-clear:hover { opacity: 1; }

/* Transition */
.drp-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.drp-leave-active { transition: opacity 0.12s ease, transform 0.1s ease; }
.drp-enter-from, .drp-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
