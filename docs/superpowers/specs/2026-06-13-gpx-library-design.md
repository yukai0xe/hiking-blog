# GPX 收藏庫 — Design Spec

**Date:** 2026-06-13
**Status:** Approved

---

## Goal

Add a standalone GPX library page accessible from the Home navbar. Users can upload, browse, edit, download, and delete GPX routes. Each route is independent of any expedition post.

---

## Architecture

Full-stack approach mirroring the existing GearLibrary pattern:

- **DB:** new `gpx_library` table (Supabase Postgres)
- **Backend:** C# .NET 9 — `GpxLibraryModel` → `GpxLibraryRepository` → `GpxLibraryService` → `GpxLibraryController`
- **Frontend:** `gpxLibraryStore.ts` (Pinia) + `GpxLibrary.vue` page
- **Route:** `/gpx-library`

---

## Database

```sql
CREATE TABLE gpx_library (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text        NOT NULL,
    gpx_file_url    text        NOT NULL,
    date            date,
    difficulty_stars int        CHECK (difficulty_stars BETWEEN 1 AND 5),
    category        text,       -- 郊山 | 中級山 | 高山 | 百岳 | 技術路線
    people_count    int,
    created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gpx_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON gpx_library FOR ALL USING (true) WITH CHECK (true);
```

GPX files are stored in a new `gpx-library` Supabase Storage bucket (public).

---

## Backend API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/GpxLibrary` | List all routes |
| POST | `/api/GpxLibrary` | Create route (JSON metadata) → returns `{ id }` |
| POST | `/api/GpxLibrary/{id}/file` | Upload GPX file (multipart) — stores as `{id}.gpx` in `gpx-library` bucket (upsert), updates `gpx_file_url` in DB |
| PUT | `/api/GpxLibrary/{id}` | Update metadata only |
| DELETE | `/api/GpxLibrary/{id}` | Delete DB row + storage file |

Download is handled entirely on the frontend: `<a :href="entry.gpxFileUrl" :download="`${entry.name}.gpx`">`. No dedicated download endpoint needed.

**File re-upload on edit:** optional. If a new file is provided, POST to `/{id}/file` (overwrites `{id}.gpx` via upsert) before PUT metadata. If no new file, skip the file upload step.

**GpxLibraryModel:**
```csharp
public class GpxLibraryModel {
    public Guid     Id              { get; set; }
    public string   Name            { get; set; } = "";
    public string   GpxFileUrl      { get; set; } = "";
    public DateOnly? Date           { get; set; }
    public int?     DifficultyStars { get; set; }
    public string?  Category        { get; set; }
    public int?     PeopleCount     { get; set; }
    public DateTime CreatedAt       { get; set; }
}
```

**Response DTO** is the same shape as the model (no separate DTO needed — it's a simple list-only resource with no nested entities).

**File upload flow:** POST metadata first → receive `id` → POST file to `/{id}/file`. Same pattern as cover/GPX uploads in PostsController.

---

## Frontend — Store (`gpxLibraryStore.ts`)

```ts
interface GpxLibraryEntry {
  id:              string
  name:            string
  gpxFileUrl:      string
  date?:           string | null
  difficultyStars?: number | null
  category?:       string | null
  peopleCount?:    number | null
  createdAt:       string
}
```

Actions:
- `fetchGpxLibrary()` — GET list, populates `gpxLibrary` ref
- `createGpxRoute(payload)` — POST metadata → POST file
- `updateGpxRoute(id, payload)` — PUT metadata (file re-upload optional)
- `deleteGpxRoute(id)` — DELETE

---

## Frontend — Page (`GpxLibrary.vue`)

**Layout:**
```
[ ← Back ]  GPX 收藏                          [ ＋ 新增 GPX ]
┌─────────────────────────────────────────────────────────────┐
│ 12 條路線 │ 5 百岳 │ 3 高山 │        [搜尋框]              │
└─────────────────────────────────────────────────────────────┘
┌──────────────────────────────┐  ┌──────────────────────────┐
│  Card grid (auto-fill)       │  │  Editor panel (460px)    │
│  max 350×350px per card      │  │  路線名稱 (full width)   │
│                              │  │  日期 / 人數 / 星等      │
│  [ Card ]  [ Card ]          │  │  山岳分類 (full width)   │
│  [ Card ]  [ Card ]          │  │  GPX 上傳               │
│                              │  │  [ 確認新增 ]           │
└──────────────────────────────┘  └──────────────────────────┘
```

**Card design:**
- Square map area (`aspect-ratio: 1/1`, `max-width: 350px`, `max-height: 350px`)
- Topo grid background (`repeating-linear-gradient`)
- Orange SVG route path (`stroke: #f4a261`) with green start dot + red end dot
- SVG path simplified to ≤200 pts (same technique as PostCard hover)
- Solid dark footer (`#1a1510`, no gradient): name (14px Georgia), category + people tags, stars, date
- Hover → download / edit / delete buttons appear top-right of map

**Card click (non-button area) → Modal:**
- Full-width Leaflet map (400px height)
- Route stats below: total distance (km), total ascent (m), max elevation (m), min elevation (m)
- Close button

**Editor panel (460px, always visible when open):**
- Toggled by "＋ 新增 GPX" or card "編輯" button
- Panel title changes: "＋ 新增 GPX" vs "編輯路線"
- Fields: 路線名稱 (full), 日期 / 人數 / 難度星等 (3-col), 山岳分類 (full select), GPX 上傳 (full)
- On edit: shows current filename; new file upload is optional
- Submit button: "確認新增" or "儲存更新"
- Cancel button when editing

**Stats bar:** total count + per-category counts (百岳, 高山, 中級山, 郊山, 技術路線) — only show categories that have ≥1 entry.

**Search:** filters by name (client-side, no API call).

---

## Navbar Change (`Home.vue`)

Add router-link between theme toggle and 裝備庫:

```html
<router-link to="/gpx-library" class="card-aged ...">
  <MapIcon :size="15" />
  GPX 收藏
</router-link>
```

---

## Router

Add to `src/router/index.ts`:
```ts
{ path: '/gpx-library', component: GpxLibrary }
```

---

## Category Options

```
郊山 / 中級山 / 高山 / 百岳 / 技術路線
```

---

## Error Handling

- GPX upload fails → show inline error, keep form data
- Delete → confirm dialog before API call
- API errors surfaced via store `error` ref, displayed as inline banner in page

---

## Out of Scope

- Linking GPX library entries to expedition posts (separate feature)
- GPX editing / waypoint override on library routes
- Pagination (client-side search is sufficient for a personal library)
