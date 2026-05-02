# Hiking Journal — CLAUDE.md

## Project Overview

Personal hiking journal web app. Users can create expedition records with cover images, GPX routes, photo galleries, and gear lists. Supports dark/light theme toggle.

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

## Dev Commands

```bash
npm run dev       # start dev server
npm run build     # type-check + vite build
npm run preview   # preview production build
```

## Environment

Copy `.env.example` → `.env` and fill in:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

## Project Structure

```
src/
  pages/
    Home.vue          # waterfall card grid, theme toggle, nav to create
    Detail.vue        # hero image, tabs (photos / gpx / gears), edit link
    Create.vue        # 5-step form (基本/GPX/封面/照片/裝備)
    Edit.vue          # update title, description, cover, GPX, photos
  components/
    PostCard.vue      # card with GPX hover animation (SVG draw effect)
    PhotoGallery.vue  # masonry lightbox; deletable prop for inline delete
    GpxViewer.vue     # Leaflet map (100vh) + collapsible elevation panel
    ElevationChart.vue # Chart.js line chart (canvas only, no stats header)
    GearList.vue      # gear table with weight totals
    Tabs.vue          # tab switcher component
    WaterfallList.vue # CSS columns masonry wrapper
  stores/
    postStore.ts      # fetchPosts, fetchPostDetail, createPost, updatePost, deletePhoto
    themeStore.ts     # isDark toggle, persists to localStorage, toggles .light on <html>
  services/
    supabase.ts       # supabase client + uploadFile(bucket, path, file) → publicUrl
    gpx.ts            # parseGPX(), computeElevationStats()
  types/
    index.ts          # Post, Photo, Gear, GpxData, ElevationStats
  router/index.ts     # /, /detail/:id, /create, /edit/:id
  style.css           # CSS tokens, textured-bg, card-aged, btn-cta, vignette
```

## Database Schema

```sql
posts   (id uuid PK, title, description, cover_image, gpx_file, created_at)
photos  (id uuid PK, post_id FK, url, created_at)
gears   (id uuid PK, post_id FK, name, weight int, note, created_at)
```

All tables have RLS enabled with public SELECT, INSERT, UPDATE, DELETE policies.
Migrations live in `supabase/migrations/`. Apply via Supabase Dashboard → SQL Editor.

## Storage Buckets

| Bucket | Contents |
|---|---|
| `covers` | Post cover images |
| `gpx` | GPX route files |
| `photos` | Post photo galleries |

All buckets are public. `uploadFile()` uses `upsert: true` and returns the public URL.

## Theme System

Default theme is **dark** (expedition log). Light mode adds `.light` class to `<html>`.

All Tailwind colors reference CSS custom properties (`var(--c-*)`), so both themes work without `dark:` prefixes:

```css
:root        { --c-base: #0A0908; --c-primary: #c6ac8f; ... }  /* dark */
.light       { --c-base: #f2f8ee; --c-primary: #5e503f; ... }  /* light */
```

Typography: `font-heading` = Barlow Condensed · `font-mono` = Space Mono · `font-body` = Inter

## Key Patterns

**CSS variables + Tailwind** — Never use `@apply` with opacity modifiers on CSS-variable colors (e.g. `bg-primary/30` breaks). Use `color-mix()` in plain CSS instead:
```css
box-shadow: 0 0 0 2px color-mix(in srgb, var(--c-primary) 30%, transparent);
```

**Leaflet initialization** — Always `loading.value = false` → `await nextTick()` → `renderMap()`. The map `<div>` must be in the DOM before Leaflet initialises.

**GPX geometry** — Handle both `LineString` (single segment) and `MultiLineString` (multi-segment GPS tracks). Flatten with `.flat()`.

**Supabase RLS silent failures** — A missing UPDATE/DELETE policy returns 0 rows affected with no error thrown. If writes silently fail, check RLS policies first.

**PostCard GPX hover** — Fetches + parses GPX once on first hover (`loaded` flag), simplifies to 400 pts, renders animated SVG path with `pathLength="1"` + `stroke-dashoffset` draw animation.
