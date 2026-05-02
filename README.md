# 登山日誌專案 — Learning Reflection

> Vue 3 · TypeScript · Supabase · Leaflet · Tailwind CSS

---

## 1. Project Overview

This project is a personal hiking journal built entirely from scratch. The goal was to record expedition logs — uploading GPX route files, cover images, photo galleries, and gear lists — and display them in a visually rich, themed web interface.

Building this app from scratch without a backend team meant learning the full stack: frontend architecture in Vue 3, backend-as-a-service with Supabase, file storage, map rendering, and SVG animation.

---

## 2. Technologies Learned

### 2.1 Vue 3 — Composition API

This project used Vue 3 exclusively with the Composition API (`<script setup>`). Key takeaways:

- `ref()` and `reactive()` for local component state
- `computed()` for derived values (e.g. elevation stats, filtered photo lists)
- `onMounted()` / `onUnmounted()` for lifecycle hooks (map init, map cleanup)
- `nextTick()` — critical for waiting until Vue has updated the DOM before running imperative code like Leaflet
- `defineProps<T>()` with TypeScript generics for fully typed component props
- `<Transition>` / `<Teleport>` for animation and portals (lightbox overlay)

### 2.2 Pinia — State Management

Pinia replaced Vuex as the official Vue state library. Key patterns used:

- `defineStore()` with setup syntax (same as Composition API)
- Shared store state across pages without prop drilling
- Async actions that update `loading` / `error` reactive refs
- `postStore`: fetchPosts, fetchPostDetail, createPost, updatePost, deletePhoto
- `themeStore`: persists dark/light mode preference to `localStorage`

### 2.3 Tailwind CSS v3 + CSS Custom Properties

The design system combined Tailwind utility classes with CSS custom properties for runtime theming:

- All colors defined as CSS variables (`--c-base`, `--c-primary`, etc.) rather than hardcoded values
- Tailwind config maps color tokens to `var(--c-*)` so utility classes work in both dark and light mode automatically
- The default theme is dark (expedition log); light mode adds `.light` class on `<html>` instead of using Tailwind's `dark:` prefix

**Lesson:** `@apply` cannot use opacity modifiers with CSS variable colors.

```css
/* ✗ breaks */
@apply ring-primary/30;

/* ✓ works */
box-shadow: 0 0 0 2px color-mix(in srgb, var(--c-primary) 30%, transparent);
```

### 2.4 Supabase — Backend as a Service

Supabase provided the entire backend: Postgres database, file storage, and auth infrastructure.

#### Row Level Security (RLS)

RLS is enabled by default on all tables. Without explicit policies, all operations are blocked. A critical lesson:

- SELECT policies were created early, so reading data worked fine
- UPDATE and DELETE policies were missing — Supabase **silently returned 0 rows affected** without throwing an error
- This caused cover image updates and photo deletions to fail with no visible error message
- **Fix:** always create INSERT, SELECT, UPDATE, and DELETE policies for each table

#### Storage Buckets

- Files are uploaded to named buckets (`covers`, `gpx`, `photos`)
- `uploadFile()` uses `upsert: true` to allow re-uploading the same path
- `getPublicUrl()` returns a permanent public URL to store in the database

#### Migrations

- Schema is versioned in `supabase/migrations/*.sql` files
- Applied manually via Supabase Dashboard → SQL Editor in this project

### 2.5 Leaflet — Interactive Maps

Leaflet rendered the GPX route on an interactive OpenStreetMap tile layer.

- `L.map()`, `L.tileLayer()`, `L.polyline()`, `L.marker()` — core Leaflet API
- `L.divIcon()` for custom HTML marker icons (start/end dots)
- `fitBounds()` to auto-zoom to the route extent

**Critical timing bug discovered and fixed:**

- `renderMap()` was called while `loading = true`, so `<div ref="mapEl">` did not exist in the DOM yet
- `mapEl.value` was `null` → Leaflet silently exited → only the elevation chart rendered
- **Fix:** `loading.value = false` → `await nextTick()` → `renderMap()`

### 2.6 GPX Parsing — @tmcw/togeojson

GPX is an XML format used by GPS devices. `@tmcw/togeojson` converts it to GeoJSON.

- Dynamic import: `const { gpx } = await import('@tmcw/togeojson')` — keeps it out of the initial bundle
- Most GPS devices export tracks with multiple `<trkseg>` segments
- `togeojson` outputs `MultiLineString` for multi-segment tracks, **not** `LineString`
- Original code only handled `LineString` → all multi-segment GPX files showed "route not found"

**Fix:** check `geometry.type` and flatten `MultiLineString` with `.flat()`

```ts
const raw =
  feature.geometry.type === 'LineString'
    ? feature.geometry.coordinates
    : feature.geometry.coordinates.flat() // MultiLineString
```

### 2.7 Chart.js — Elevation Profile

Chart.js rendered the elevation profile as a filled area chart.

- Only required modules are registered (tree-shaking): `LineElement`, `PointElement`, `LineController`, `CategoryScale`, `LinearScale`, `Filler`, `Tooltip`
- `chartInstance.destroy()` must be called before rebuilding to prevent canvas reuse errors
- `watch(() => props.elevation, buildChart)` re-renders when data changes

### 2.8 SVG Animation — GPX Route Draw Effect

The PostCard hover effect draws the GPX route as an animated SVG line:

- `pathLength="1"` normalises the path length to 1 regardless of actual pixel length
- `stroke-dasharray: 1` and `stroke-dashoffset: 1` initially hides the line
- CSS animation transitions `stroke-dashoffset` from `1 → 0`, drawing the line
- Three layers: outer glow (9px, 7% opacity) + mid glow (4px, 14%) + main line (1.6px)
- Start/end circles use a `pop` keyframe (`opacity 0 → 1`, `r 1 → 5 → 3.5`) after the draw completes
- GPX is fetched once on first hover and cached with a `loaded` flag
- Track simplified to max 400 points to keep SVG rendering snappy

---

## 3. Architecture Decisions

| Decision | Rationale |
|---|---|
| CSS variables for theming | Default theme is dark; light adds `.light` to `<html>`. Avoids needing `dark:` prefix on every class. |
| Pinia over Vuex | Setup-style stores match Composition API. Simpler, less boilerplate, better TypeScript inference. |
| Supabase over custom backend | No server to manage. RLS policies enforce data access rules at the database level. |
| CSS columns masonry | `columns-1 sm:columns-2 xl:columns-4` + `break-inside-avoid`. No JS library needed for waterfall layout. |
| Dynamic imports for GPX libs | `@tmcw/togeojson` and Leaflet are imported dynamically so they are not in the initial bundle. |
| SVG unique pattern IDs | Each PostCard uses `id="g-{post.id}"` for the grid `<pattern>` to prevent conflicts on the home page. |

---

## 4. Challenges & Solutions

### Leaflet map not rendering

- **Symptom:** Only elevation chart appeared; map was blank
- **Cause:** `renderMap()` called before Vue rendered the map `<div>` (`mapEl.value` was `null`)
- **Solution:** `loading = false` → `await nextTick()` → `renderMap()`

### GPX route not found error

- **Symptom:** "找不到有效的 GPX 軌跡" for real GPS device exports
- **Cause:** GPS devices export multi-segment tracks → `togeojson` produces `MultiLineString`, not `LineString`
- **Solution:** Handle both geometry types; flatten `MultiLineString` coordinates with `.flat()`

### Cover update / photo delete silently failing

- **Symptom:** Supabase calls returned no error but nothing changed in the database
- **Cause:** RLS policies for `UPDATE` (posts) and `DELETE` (photos) were never created
- **Solution:** Add missing policies in a new migration file

### @apply with CSS variable colors

- **Symptom:** Build error when using `@apply ring-primary/30` in CSS
- **Cause:** Tailwind's `@apply` cannot process opacity modifiers when the color is a CSS variable
- **Solution:** Replace with `color-mix()` in plain CSS

### Node version incompatibility with create-vite

- **Symptom:** `npm create vite@latest` failed on Node v22
- **Solution:** Downgraded to `create-vite@4` and piped `printf "y"` to auto-accept the overwrite prompt

---

## 5. Skills Developed

### Frontend

- Vue 3 Composition API patterns (`ref`, `computed`, `watch`, lifecycle hooks)
- TypeScript in Vue components (typed props, store actions, service functions)
- Tailwind CSS utility-first design with a custom design system
- CSS custom properties for runtime theming without JavaScript
- SVG animation using `stroke-dashoffset` and keyframes
- File upload UI (cover image preview, multi-photo management, undo delete)

### Backend / Data

- Supabase Postgres schema design and migrations
- Row Level Security policies for all CRUD operations
- Supabase Storage: bucket creation, file upload, public URLs
- GPX XML parsing and coordinate transformation
- Elevation statistics computation (total ascent, max/min)

### Tooling

- Vite for fast dev server and production builds
- Pinia for reactive global state
- Vue Router for client-side navigation with dynamic route params

---

## 6. What I Would Improve Next

- Add authentication so records are private per user
- Add gear weight summary (total pack weight) to the gear list
- Add distance and moving time stats parsed from GPX timestamps
- Implement optimistic UI updates instead of re-fetching after every mutation
- Add image compression before uploading to reduce storage costs
- Write Supabase Edge Functions for server-side GPX validation
- Set up Supabase CLI properly with `db push` for migration management

---

*Generated from the hiking journal project — April 2026*
