# 登山日誌 — Hiking Journal

> Vue 3 · TypeScript · Supabase · Leaflet · Tailwind CSS

Personal hiking journal web app for recording expedition logs — GPX routes, cover images, photo galleries, gear lists, and tags.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Vue 3 + TypeScript (Composition API) |
| Build | Vite 4 |
| State | Pinia |
| Routing | Vue Router 4 |
| Styling | Tailwind CSS v3 + CSS custom properties |
| Backend | Supabase (Postgres + Storage + RLS) |
| Map | Leaflet |
| Charts | Chart.js |
| GPX parsing | @tmcw/togeojson |
| Icons | Lucide Vue Next |

---

## Features

### Pages

| Page | Description |
|---|---|
| **Home** | Waterfall card grid; GPX route draws on hover; dark/light theme toggle |
| **Create** | 5-step form: title + tags → GPX + trip info → cover → photos → gear |
| **Detail** | 3-column layout: icon nav / content (map / gallery / gears) / collapsible info sidebar |
| **Edit** | Full post editing — cover crop, GPX re-upload, photo management with undo delete |

### Detail Page Layout

```
┌─ Hero (full width) ──────────────────────────────┐
│  ← Back          Title / Date          Edit →    │
└──────────────────────────────────────────────────┘
┌─ Nav (72px) ─┬─ Center (flex-1) ──┬─ Sidebar ──┐
│  📷 照片     │  Tags · Toggles    │  行程資訊   │
│  🗺 地圖    │  ─────────────────  │  日期/天數  │
│  🎒 裝備    │  PhotoGallery  OR   │  天氣/人數  │
│             │  GpxViewer (100vh)  │  描述       │
│             │  GearList           │  (折疊)     │
└─────────────┴────────────────────┴─────────────┘
```

- Switching to the map tab auto-collapses the sidebar so Leaflet initializes at full width
- Sidebar animates open/close with `transition-[width]`

### Photo Gallery

- CSS columns masonry layout
- Lightbox with zoom (mouse wheel), pan (drag), swipe gestures, keyboard navigation
- Download button with image metadata (dimensions, MP)
- Star / favourite: moves photo to front of grid; persists to `localStorage`
- Reset favourites button in top bar

### Tag System

- Tags stored in a `tags` table in Supabase
- `TagPickerModal`: search, select from list, add custom tags (saved to DB)
- Selected tags displayed as chips in Detail page top bar

### GPX Viewer

- Leaflet map with OpenStreetMap tiles
- Route polyline + start/end markers
- Layer toggles: 山頭 (peaks) / 記錄點 (waypoints) / 山屋 (shelters)
- Collapsible elevation panel (Chart.js area chart)

---

## Database Schema

```sql
posts   (id, title, description, cover_image, gpx_file,
         date_start, date_end, weather, people_count, tags text[],
         created_at, deleted_at)
photos  (id, post_id, url, created_at)
gears   (id, post_id, name, weight int, note, created_at)
tags    (id, name unique, created_at)
```

All tables have RLS enabled with public SELECT / INSERT / UPDATE / DELETE policies.
Soft delete on posts (`deleted_at` timestamptz).

## Storage Buckets

| Bucket | Contents |
|---|---|
| `covers` | Post cover images |
| `gpx` | GPX route files |
| `photos` | Post photo galleries |

---

## Dev Commands

```bash
npm run dev       # start dev server
npm run build     # type-check + vite build
npm run preview   # preview production build
```

## Environment

Copy `.env.example` → `.env`:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

---

## Key Technical Learnings

### Vue 3

- `ref()` / `computed()` / `watch()` / `onMounted()` / `onUnmounted()` patterns
- `nextTick()` — required before running imperative DOM code (Leaflet init)
- `<Transition>` / `<Teleport>` for lightbox and modal overlays
- `defineExpose()` — expose component internals to parent via template ref (e.g. `galleryRef.resetFavorites()`)

### Tailwind + CSS Variables

All colors are CSS custom properties (`var(--c-*)`). This means opacity modifiers in `@apply` break:

```css
/* ✗ breaks — Tailwind can't apply opacity to CSS variables */
@apply bg-primary/30;

/* ✓ works */
background: color-mix(in srgb, var(--c-primary) 30%, transparent);
```

### Supabase

- RLS silent failures: missing UPDATE/DELETE policy returns 0 rows with no error — always create all four policies per table
- `upsert: true` on storage upload allows overwriting the same file path
- `text[]` columns for tag arrays; `on conflict (name) do nothing` for idempotent seed data

### Leaflet Timing

```ts
// ✗ map div not in DOM yet
renderMap()

// ✓ correct order
loading.value = false
await nextTick()
renderMap()
```

### GPX Geometry

GPS devices export multi-segment tracks → `togeojson` outputs `MultiLineString`, not `LineString`:

```ts
const coords =
  feature.geometry.type === 'LineString'
    ? feature.geometry.coordinates
    : feature.geometry.coordinates.flat()
```

### Date Input Timezone Trap

```ts
// ✗ new Date("2024-03-15") parses as UTC → shows 2024/03/14 in UTC+8
new Date(iso).toLocaleDateString(...)

// ✓ slice string directly — no timezone conversion
const d = iso.slice(0, 10)  // "YYYY-MM-DD"
`${d.slice(0,4)}/${d.slice(5,7)}/${d.slice(8,10)}`
```

### datetime-local Input on Windows Chrome

`type="datetime-local" step="1"` requires filling the seconds field. If the user doesn't, `event.target.value` returns `""` → v-model always gets an empty string. Fix: use `type="date"`.

---

## Architecture Decisions

| Decision | Rationale |
|---|---|
| CSS variables for theming | Dark by default; light adds `.light` to `<html>`. No `dark:` prefix needed on every class. |
| Pinia setup stores | Matches Composition API style. Better TypeScript inference than Vuex. |
| Soft delete on posts | Preserves data; `deleted_at IS NULL` filter excludes deleted records. |
| CSS columns masonry | `columns-*` + `break-inside-avoid` — no JS library needed. |
| Dynamic imports | `@tmcw/togeojson` and Leaflet imported dynamically to reduce initial bundle. |
| localStorage for favourites | Photo favourite order is a purely local UI preference — no need to persist to DB. |
| Tags as separate table | Enables a shared, searchable tag list across all posts rather than free-form text. |

---

*May 2026*
