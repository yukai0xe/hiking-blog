# GPX Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone `/gpx-library` page where users can upload, browse, edit, download, and delete GPX routes, accessible from the Home navbar.

**Architecture:** Full-stack mirroring the GearLibrary pattern — new `gpx_library` DB table → C# `GpxLibraryRepository` / `GpxLibraryService` / `GpxLibraryController` → frontend `gpxLibraryStore.ts` + `GpxLibrary.vue`. Cards show a topo-grid background with an SVG route preview (fetched client-side); clicking a card opens a Leaflet modal.

**Tech Stack:** PostgreSQL (Supabase), C# .NET 9 / Dapper / Npgsql, Vue 3 + TypeScript + Pinia, Leaflet

---

## File Map

**Backend (`D:\RiderProject\hiking-backend`)**
- Create: `hiking.Repository/supabase/migrations/20260613000001_gpx_library.sql`
- Create: `hiking.Repository/Model/GpxLibraryModel.cs`
- Create: `hiking.Repository/Repositories/GpxLibraryRepository.cs`
- Create: `hiking.Service/Services/GpxLibraryService.cs`
- Create: `hiking.WebApi/Controllers/GpxLibraryController.cs`
- Modify: `hiking.WebApi/Program.cs` — register `GpxLibraryRepository` + `GpxLibraryService`

**Frontend (`D:\Project\Personal\hiking\src`)**
- Modify: `services/gpx.ts` — add `parseGPXFromUrl`, `downsampleCoords`, `gpxCoordsToSvgPath`, `computeTotalDistanceKm`
- Modify: `types/index.ts` — add `GpxLibraryEntry`
- Create: `stores/gpxLibraryStore.ts`
- Create: `pages/GpxLibrary.vue`
- Modify: `router/index.ts` — add `/gpx-library` route
- Modify: `pages/Home.vue` — add navbar button

---

## Task 1: DB Migration

**Files:**
- Create: `D:\RiderProject\hiking-backend\hiking.Repository\supabase\migrations\20260613000001_gpx_library.sql`

- [ ] **Step 1: Create migration file**

```sql
CREATE TABLE gpx_library (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text        NOT NULL,
    gpx_file_url    text        NOT NULL DEFAULT '',
    date            date,
    difficulty_stars int        CHECK (difficulty_stars BETWEEN 1 AND 5),
    category        text,
    people_count    int,
    created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gpx_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON gpx_library FOR ALL USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Apply migration in Supabase Dashboard**

Open Supabase Dashboard → SQL Editor → paste the SQL → Run.
Expected: table `gpx_library` created with no errors.

- [ ] **Step 3: Create `gpx-library` storage bucket**

In Supabase Dashboard → Storage → New bucket:
- Name: `gpx-library`
- Public: ✅

- [ ] **Step 4: Commit**

```bash
git -C "D:\RiderProject\hiking-backend" add hiking.Repository/supabase/migrations/20260613000001_gpx_library.sql
git -C "D:\RiderProject\hiking-backend" commit -m "feat: add gpx_library table migration"
```

---

## Task 2: C# Model + Repository

**Files:**
- Create: `D:\RiderProject\hiking-backend\hiking.Repository\Model\GpxLibraryModel.cs`
- Create: `D:\RiderProject\hiking-backend\hiking.Repository\Repositories\GpxLibraryRepository.cs`

- [ ] **Step 1: Create `GpxLibraryModel.cs`**

```csharp
// D:\RiderProject\hiking-backend\hiking.Repository\Model\GpxLibraryModel.cs
using System;

namespace hikingRepository.Model;

public class GpxLibraryModel
{
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

- [ ] **Step 2: Create `GpxLibraryRepository.cs`**

```csharp
// D:\RiderProject\hiking-backend\hiking.Repository\Repositories\GpxLibraryRepository.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using hikingRepository.Model;
using Npgsql;

namespace hikingRepository.Repositories;

public class GpxLibraryRepository(NpgsqlDataSource db)
{
    public async Task<List<GpxLibraryModel>> GetAllAsync()
    {
        await using var conn = await db.OpenConnectionAsync();
        return (await conn.QueryAsync<GpxLibraryModel>(
            "SELECT id, name, gpx_file_url, date, difficulty_stars, category, people_count, created_at FROM gpx_library ORDER BY created_at DESC"))
            .ToList();
    }

    public async Task<Guid> CreateAsync(GpxLibraryModel model)
    {
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync("""
            INSERT INTO gpx_library (id, name, gpx_file_url, date, difficulty_stars, category, people_count)
            VALUES (@Id, @Name, @GpxFileUrl, @Date, @DifficultyStars, @Category, @PeopleCount)
            """, model);
        return model.Id;
    }

    public async Task UpdateAsync(GpxLibraryModel model)
    {
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync("""
            UPDATE gpx_library SET
                name             = @Name,
                date             = @Date,
                difficulty_stars = @DifficultyStars,
                category         = @Category,
                people_count     = @PeopleCount
            WHERE id = @Id
            """, model);
    }

    public async Task UpdateFileUrlAsync(Guid id, string url)
    {
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync(
            "UPDATE gpx_library SET gpx_file_url = @url WHERE id = @id",
            new { id, url });
    }

    public async Task DeleteAsync(Guid id)
    {
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync("DELETE FROM gpx_library WHERE id = @id", new { id });
    }
}
```

- [ ] **Step 3: Commit**

```bash
git -C "D:\RiderProject\hiking-backend" add hiking.Repository/Model/GpxLibraryModel.cs hiking.Repository/Repositories/GpxLibraryRepository.cs
git -C "D:\RiderProject\hiking-backend" commit -m "feat: add GpxLibraryModel and GpxLibraryRepository"
```

---

## Task 3: C# Service

**Files:**
- Create: `D:\RiderProject\hiking-backend\hiking.Service\Services\GpxLibraryService.cs`

- [ ] **Step 1: Create `GpxLibraryService.cs`**

```csharp
// D:\RiderProject\hiking-backend\hiking.Service\Services\GpxLibraryService.cs
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using hikingRepository.Model;
using hikingRepository.Repositories;

namespace hikingService.Services;

public class GpxLibraryService(GpxLibraryRepository repo, StorageService storage)
{
    private const string Bucket = "gpx-library";

    public Task<List<GpxLibraryModel>> GetAllAsync() => repo.GetAllAsync();

    public async Task<Guid> CreateAsync(string name, DateOnly? date, int? difficultyStars, string? category, int? peopleCount)
    {
        var model = new GpxLibraryModel
        {
            Id              = Guid.NewGuid(),
            Name            = name,
            Date            = date,
            DifficultyStars = difficultyStars,
            Category        = category,
            PeopleCount     = peopleCount,
        };
        return await repo.CreateAsync(model);
    }

    public async Task UploadFileAsync(Guid id, Stream stream, string filename)
    {
        var path = $"{id}.gpx";
        var url  = await storage.UploadAsync(Bucket, path, stream, "application/gpx+xml");
        await repo.UpdateFileUrlAsync(id, url);
    }

    public async Task UpdateAsync(Guid id, string name, DateOnly? date, int? difficultyStars, string? category, int? peopleCount)
    {
        var model = new GpxLibraryModel
        {
            Id              = id,
            Name            = name,
            Date            = date,
            DifficultyStars = difficultyStars,
            Category        = category,
            PeopleCount     = peopleCount,
        };
        await repo.UpdateAsync(model);
    }

    public async Task DeleteAsync(Guid id)
    {
        await repo.DeleteAsync(id);
        // Best-effort file delete — ignore errors if file doesn't exist
        try
        {
            var req = new System.Net.Http.HttpRequestMessage(
                System.Net.Http.HttpMethod.Delete,
                $"{storage.HttpClient.BaseAddress}storage/v1/object/{Bucket}/{id}.gpx");
            await storage.HttpClient.SendAsync(req);
        }
        catch { /* ignored */ }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git -C "D:\RiderProject\hiking-backend" add hiking.Service/Services/GpxLibraryService.cs
git -C "D:\RiderProject\hiking-backend" commit -m "feat: add GpxLibraryService"
```

---

## Task 4: C# Controller + DI Registration

**Files:**
- Create: `D:\RiderProject\hiking-backend\hiking.WebApi\Controllers\GpxLibraryController.cs`
- Modify: `D:\RiderProject\hiking-backend\hiking.WebApi\Program.cs`

- [ ] **Step 1: Create `GpxLibraryController.cs`**

```csharp
// D:\RiderProject\hiking-backend\hiking.WebApi\Controllers\GpxLibraryController.cs
using System;
using System.IO;
using System.Threading.Tasks;
using hikingService.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace hiking_controller.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GpxLibraryController(GpxLibraryService svc) : ControllerBase
{
    public record CreateRequest(
        string   Name,
        string?  Date,
        int?     DifficultyStars,
        string?  Category,
        int?     PeopleCount);

    public record UpdateRequest(
        string   Name,
        string?  Date,
        int?     DifficultyStars,
        string?  Category,
        int?     PeopleCount);

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await svc.GetAllAsync());

    [HttpPost]
    [Consumes("application/json")]
    public async Task<IActionResult> Create([FromBody] CreateRequest req)
    {
        var date = req.Date != null ? DateOnly.Parse(req.Date) : (DateOnly?)null;
        var id   = await svc.CreateAsync(req.Name, date, req.DifficultyStars, req.Category, req.PeopleCount);
        return CreatedAtAction(nameof(GetAll), new { }, new { id });
    }

    [HttpPost("{id:guid}/file")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadFile(Guid id, IFormFile gpxFile)
    {
        var ms = new MemoryStream((int)gpxFile.Length);
        await gpxFile.CopyToAsync(ms);
        ms.Position = 0;
        await svc.UploadFileAsync(id, ms, gpxFile.FileName);
        return NoContent();
    }

    [HttpPut("{id:guid}")]
    [Consumes("application/json")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRequest req)
    {
        var date = req.Date != null ? DateOnly.Parse(req.Date) : (DateOnly?)null;
        await svc.UpdateAsync(id, req.Name, date, req.DifficultyStars, req.Category, req.PeopleCount);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await svc.DeleteAsync(id);
        return NoContent();
    }
}
```

- [ ] **Step 2: Register services in `Program.cs`**

After the line `builder.Services.AddScoped<GearService>();`, add:

```csharp
builder.Services.AddScoped<GpxLibraryRepository>();
builder.Services.AddScoped<GpxLibraryService>();
```

Also add the using at the top of Program.cs (Dapper already handles namespace discovery via the existing `using` statements — just ensure `hikingRepository.Repositories` and `hikingService.Services` are already imported, which they are via `AddScoped<GearRepository>` etc.).

- [ ] **Step 3: Build backend in Rider to confirm zero errors**

Open Rider → Build → All Projects. Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git -C "D:\RiderProject\hiking-backend" add hiking.WebApi/Controllers/GpxLibraryController.cs hiking.WebApi/Program.cs
git -C "D:\RiderProject\hiking-backend" commit -m "feat: add GpxLibraryController and register services"
```

---

## Task 5: Frontend GPX Service Utilities

**Files:**
- Modify: `D:\Project\Personal\hiking\src\services\gpx.ts`

These utilities are used by `GpxLibrary.vue` to render the card SVG previews and the modal stats.

- [ ] **Step 1: Add four utility exports to `services/gpx.ts`**

Append to the end of the existing file:

```ts
// ── GPX Library utilities ───────────────────────────────

function parseGPXXml(xml: Document): GpxData {
  const geojson = gpxToGeoJSON(xml)
  const feature = geojson.features[0]
  if (!feature) throw new Error('No GPX track found')

  let rawCoords: [number, number, number][]
  if (feature.geometry.type === 'LineString') {
    rawCoords = feature.geometry.coordinates as [number, number, number][]
  } else if (feature.geometry.type === 'MultiLineString') {
    rawCoords = (feature.geometry.coordinates as [number, number, number][][]).flat()
  } else {
    throw new Error('Unsupported GPX geometry type')
  }

  const coordinates: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng])
  const elevation: number[]             = rawCoords.map(([, , ele]) => ele ?? 0)
  const times: string[]                 = [feature.properties?.coordTimes ?? []].flat(2)
  const timestamps: Date[]              = times.map(t => new Date(t))

  return { coordinates, elevation, timestamps }
}

export async function parseGPXFromUrl(url: string): Promise<GpxData> {
  const res  = await fetch(url)
  const text = await res.text()
  const xml  = new DOMParser().parseFromString(text, 'text/xml')
  return parseGPXXml(xml)
}

export function downsampleCoords(coords: [number, number][], maxPoints: number): [number, number][] {
  if (coords.length <= maxPoints) return coords
  const step = coords.length / maxPoints
  return Array.from({ length: maxPoints }, (_, i) => coords[Math.floor(i * step)])
}

export function gpxCoordsToSvgPath(
  coords: [number, number][],
  viewSize = 200,
  padding  = 15,
): { d: string; start: [number, number]; end: [number, number] } {
  if (coords.length < 2) return { d: '', start: [0, 0], end: [0, 0] }

  const lats   = coords.map(c => c[0])
  const lngs   = coords.map(c => c[1])
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  const rangeW = maxLng - minLng || 1e-9
  const rangeH = maxLat - minLat || 1e-9
  const scale  = (viewSize - padding * 2) / Math.max(rangeW, rangeH)

  const toSvg = ([lat, lng]: [number, number]): [number, number] => [
    +(padding + (lng - minLng) * scale).toFixed(2),
    +(viewSize - padding - (lat - minLat) * scale).toFixed(2),
  ]

  const pts = coords.map(toSvg)
  const d   = 'M ' + pts.map(([x, y]) => `${x} ${y}`).join(' L ')

  return { d, start: pts[0], end: pts[pts.length - 1] }
}

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R    = 6371000
  const dLat = (b[0] - a[0]) * Math.PI / 180
  const dLng = (b[1] - a[1]) * Math.PI / 180
  const lat1 = a[0] * Math.PI / 180
  const lat2 = b[0] * Math.PI / 180
  const x    = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export function computeTotalDistanceKm(coords: [number, number][]): number {
  let total = 0
  for (let i = 1; i < coords.length; i++) total += haversineMeters(coords[i - 1], coords[i])
  return Math.round(total / 100) / 10
}
```

- [ ] **Step 2: Type-check**

```bash
cd "D:\Project\Personal\hiking" && npx vue-tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git -C "D:\Project\Personal\hiking" add src/services/gpx.ts
git -C "D:\Project\Personal\hiking" commit -m "feat: add GPX library service utilities"
```

---

## Task 6: TypeScript Types + Pinia Store

**Files:**
- Modify: `D:\Project\Personal\hiking\src\types\index.ts`
- Create: `D:\Project\Personal\hiking\src\stores\gpxLibraryStore.ts`

- [ ] **Step 1: Add `GpxLibraryEntry` to `types/index.ts`**

Append to the end of the file:

```ts
export interface GpxLibraryEntry {
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

- [ ] **Step 2: Create `stores/gpxLibraryStore.ts`**

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GpxLibraryEntry } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, init)
  if (!res.ok) throw new Error(await res.text())
  return res
}

export const useGpxLibraryStore = defineStore('gpxLibrary', () => {
  const gpxLibrary = ref<GpxLibraryEntry[]>([])
  const loading    = ref(false)
  const error      = ref<string | null>(null)

  async function fetchGpxLibrary() {
    loading.value = true
    error.value   = null
    try {
      const res        = await apiFetch('/api/GpxLibrary')
      gpxLibrary.value = await res.json()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function createGpxRoute(payload: {
    name:            string
    date?:           string | null
    difficultyStars?: number | null
    category?:       string | null
    peopleCount?:    number | null
    gpxFile:         File
  }): Promise<void> {
    const res  = await apiFetch('/api/GpxLibrary', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:            payload.name,
        date:            payload.date            ?? null,
        difficultyStars: payload.difficultyStars ?? null,
        category:        payload.category        ?? null,
        peopleCount:     payload.peopleCount      ?? null,
      }),
    })
    const { id } = await res.json() as { id: string }

    const fd = new FormData()
    fd.append('gpxFile', payload.gpxFile)
    await apiFetch(`/api/GpxLibrary/${id}/file`, { method: 'POST', body: fd })

    await fetchGpxLibrary()
  }

  async function updateGpxRoute(id: string, payload: {
    name:            string
    date?:           string | null
    difficultyStars?: number | null
    category?:       string | null
    peopleCount?:    number | null
    gpxFile?:        File | null
  }): Promise<void> {
    if (payload.gpxFile) {
      const fd = new FormData()
      fd.append('gpxFile', payload.gpxFile)
      await apiFetch(`/api/GpxLibrary/${id}/file`, { method: 'POST', body: fd })
    }

    await apiFetch(`/api/GpxLibrary/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:            payload.name,
        date:            payload.date            ?? null,
        difficultyStars: payload.difficultyStars ?? null,
        category:        payload.category        ?? null,
        peopleCount:     payload.peopleCount      ?? null,
      }),
    })

    await fetchGpxLibrary()
  }

  async function deleteGpxRoute(id: string): Promise<void> {
    await apiFetch(`/api/GpxLibrary/${id}`, { method: 'DELETE' })
    gpxLibrary.value = gpxLibrary.value.filter(e => e.id !== id)
  }

  return { gpxLibrary, loading, error, fetchGpxLibrary, createGpxRoute, updateGpxRoute, deleteGpxRoute }
})
```

- [ ] **Step 3: Type-check**

```bash
cd "D:\Project\Personal\hiking" && npx vue-tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git -C "D:\Project\Personal\hiking" add src/types/index.ts src/stores/gpxLibraryStore.ts
git -C "D:\Project\Personal\hiking" commit -m "feat: add GpxLibraryEntry type and gpxLibraryStore"
```

---

## Task 7: GpxLibrary.vue Page

**Files:**
- Create: `D:\Project\Personal\hiking\src\pages\GpxLibrary.vue`

This is the main page. It contains the card grid, editor side panel, detail modal (Leaflet map), and delete confirm modal.

- [ ] **Step 1: Create `GpxLibrary.vue`**

```vue
<template>
  <div class="min-h-screen textured-bg vignette py-8">
    <div class="relative z-10 max-w-[1400px] mx-auto px-4">

      <!-- Header -->
      <div class="flex items-center gap-3 mb-8">
        <button
          class="card-aged w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
          @click="$router.back()" aria-label="返回"
        ><ArrowLeftIcon :size="17" /></button>
        <div class="flex-1">
          <p class="text-xs font-body tracking-[0.25em] uppercase text-primary opacity-60">GPX Library</p>
          <h1 class="font-heading text-xl font-bold text-ink">GPX 收藏</h1>
        </div>
        <button
          class="btn-cta flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer"
          @click="openCreate"
        ><PlusIcon :size="15" /> 新增 GPX</button>
      </div>

      <!-- Stats + search bar -->
      <div class="card-aged px-5 py-4 mb-6 flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-5 mr-auto flex-wrap">
          <div class="text-center">
            <p class="font-heading text-2xl font-bold text-ink leading-none mb-0.5">{{ store.gpxLibrary.length }}</p>
            <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">條路線</p>
          </div>
          <template v-for="(count, cat) in categoryCounts" :key="cat">
            <div class="w-px h-8 bg-border/40" />
            <div class="text-center">
              <p class="font-heading text-2xl font-bold text-ink leading-none mb-0.5">{{ count }}</p>
              <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">{{ cat }}</p>
            </div>
          </template>
        </div>
        <div class="relative flex-1 min-w-[180px]">
          <SearchIcon :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-inkMuted pointer-events-none" />
          <input
            v-model="search"
            type="text"
            placeholder="搜尋路線名稱…"
            class="w-full pl-8 pr-8 py-2 rounded-lg text-sm font-body text-ink focus:outline-none focus:border-primary transition-colors"
            style="background: transparent; border: 1px solid var(--c-border);"
          />
          <button v-if="search" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-inkMuted hover:text-ink cursor-pointer" @click="search = ''">
            <XIcon :size="13" />
          </button>
        </div>
      </div>

      <!-- Error banner -->
      <div v-if="apiError"
        class="mb-4 px-4 py-2.5 rounded-lg flex items-center gap-2 font-body text-sm"
        style="background: rgba(220,60,60,0.12); border: 1px solid rgba(220,60,60,0.35); color: #e07070;"
      >
        <AlertCircleIcon :size="14" class="shrink-0" />{{ apiError }}
      </div>

      <!-- Empty state -->
      <div v-if="store.gpxLibrary.length === 0 && !store.loading" class="card-aged p-16 text-center">
        <MapIcon :size="44" class="mx-auto mb-4 text-primary opacity-30" />
        <p class="font-heading text-xl text-ink mb-2">尚無 GPX 路線</p>
        <p class="text-sm font-body italic text-inkMuted mb-6">點擊「新增 GPX」上傳第一條路線</p>
        <button class="btn-cta inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer" @click="openCreate">
          <PlusIcon :size="14" /> 新增第一條路線
        </button>
      </div>

      <!-- No results after search -->
      <div v-else-if="filtered.length === 0 && search" class="card-aged p-12 text-center">
        <SearchIcon :size="36" class="mx-auto mb-4 text-primary opacity-30" />
        <p class="font-heading text-lg text-ink mb-2">無符合結果</p>
        <button class="text-sm font-body text-primary hover:opacity-70 cursor-pointer" @click="search = ''">清除搜尋</button>
      </div>

      <!-- Main content: card grid + editor panel -->
      <div v-else class="flex gap-5 items-start">

        <!-- Card grid -->
        <div class="flex-1 grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(200px, 350px));">
          <div
            v-for="entry in filtered" :key="entry.id"
            class="gpx-card cursor-pointer"
            style="max-width: 350px;"
            @click="openDetail(entry)"
          >
            <!-- Map area: square topo preview -->
            <div class="card-map" style="aspect-ratio: 1/1; max-height: 350px; background: #2d3b1e; position: relative; overflow: hidden; flex-shrink: 0;">
              <div class="topo-bg absolute inset-0" />
              <svg v-if="cardPaths.get(entry.id)" viewBox="0 0 200 200" class="absolute inset-0 w-full h-full">
                <path :d="cardPaths.get(entry.id)!.d" class="route-line" />
                <circle :cx="cardPaths.get(entry.id)!.start[0]" :cy="cardPaths.get(entry.id)!.start[1]" r="5" class="dot-start" />
                <circle :cx="cardPaths.get(entry.id)!.end[0]"   :cy="cardPaths.get(entry.id)!.end[1]"   r="5" class="dot-end" />
              </svg>
              <div v-else class="absolute inset-0 flex items-center justify-center">
                <div class="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin opacity-40" />
              </div>
              <!-- Action buttons (hover) -->
              <div class="card-actions absolute top-2 right-2 flex gap-1.5 opacity-0 transition-opacity duration-150">
                <a
                  :href="entry.gpxFileUrl"
                  :download="`${entry.name}.gpx`"
                  class="card-action-btn"
                  @click.stop
                  title="下載 GPX"
                >↓</a>
                <button class="card-action-btn" @click.stop="openEdit(entry)" title="編輯">編輯</button>
                <button class="card-action-btn card-action-del" @click.stop="confirmDelete(entry)" title="刪除">刪除</button>
              </div>
            </div>
            <!-- Footer -->
            <div class="card-footer" style="background: #1a1510; border-top: 1px solid rgba(255,255,255,0.08); padding: 10px 12px 11px;">
              <p class="card-name font-heading font-bold text-ink mb-1.5" style="font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ entry.name }}</p>
              <div class="flex flex-wrap gap-1 mb-1.5">
                <span v-if="entry.category" class="tag-cat">{{ entry.category }}</span>
                <span v-if="entry.peopleCount" class="tag-ppl">👤 {{ entry.peopleCount }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-primary" style="font-size: 12px;">{{ starsDisplay(entry.difficultyStars) }}</span>
                <span class="font-mono text-inkMuted" style="font-size: 10px;">{{ entry.date ?? '—' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Editor side panel (460px, shown when panelOpen) -->
        <Transition name="gear-panel">
          <div v-if="panelOpen" class="w-[460px] shrink-0 card-aged p-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-heading text-base text-ink">{{ editingId ? '編輯路線' : '新增 GPX' }}</h2>
              <button class="text-inkMuted hover:text-ink cursor-pointer transition-colors" @click="closePanel"><XIcon :size="16" /></button>
            </div>

            <!-- 路線名稱 -->
            <div class="mb-3">
              <label class="field-label">路線名稱 *</label>
              <input v-model="form.name" type="text" class="input-field text-sm" placeholder="路線名稱" />
            </div>

            <!-- 日期 / 人數 / 星等 -->
            <div class="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label class="field-label">日期</label>
                <input v-model="form.date" type="date" class="input-field text-sm font-mono" />
              </div>
              <div>
                <label class="field-label">人數</label>
                <input v-model.number="form.peopleCount" type="number" min="1" class="input-field text-sm font-mono no-spinner" placeholder="1" />
              </div>
              <div>
                <label class="field-label">難度星等 (1–5)</label>
                <input v-model.number="form.difficultyStars" type="number" min="1" max="5" class="input-field text-sm font-mono no-spinner" placeholder="1–5" />
              </div>
            </div>

            <!-- 山岳分類 -->
            <div class="mb-3">
              <label class="field-label">山岳分類</label>
              <select v-model="form.category" class="input-field text-sm font-body">
                <option value="">— 選擇分類 —</option>
                <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <!-- GPX 檔案 -->
            <div class="mb-4">
              <label class="field-label">GPX 檔案{{ editingId ? '（選填，重新上傳才更新）' : ' *' }}</label>
              <div
                class="relative flex flex-col items-center justify-center gap-1 rounded-lg cursor-pointer transition-colors duration-150"
                style="height: 56px; border: 1px dashed rgba(198,172,143,0.3); background: rgba(198,172,143,0.04);"
                @click="fileInputEl?.click()"
              >
                <UploadIcon :size="15" class="text-inkMuted opacity-60" />
                <span class="text-[11px] font-body text-inkMuted">
                  {{ form.gpxFile ? form.gpxFile.name : '選擇 .gpx 檔案' }}
                </span>
                <input ref="fileInputEl" type="file" accept=".gpx" class="hidden" @change="onFileChange" />
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex items-center gap-2">
              <button
                class="px-3 py-1.5 rounded-lg text-xs font-body font-medium cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors"
                @click="closePanel"
              >取消</button>
              <button
                class="flex items-center gap-1.5 btn-cta text-xs font-semibold font-body px-4 py-1.5 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="!form.name.trim() || (!editingId && !form.gpxFile) || saving"
                @click="submitForm"
              >
                <span v-if="saving" class="w-3 h-3 border-2 rounded-full animate-spin border-current border-t-transparent" />
                <SaveIcon v-else :size="13" />
                {{ saving ? '儲存中…' : (editingId ? '儲存更新' : '確認新增') }}
              </button>
            </div>
          </div>
        </Transition>

      </div>
    </div>
  </div>

  <!-- ── Detail Modal (Leaflet map) ──────────────────────── -->
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
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Delete Confirm Modal ───────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="deletingEntry" class="modal-backdrop" @click.self="deletingEntry = null">
        <div class="delete-modal">
          <div class="modal-icon-wrap"><Trash2Icon :size="24" /></div>
          <h2 class="font-heading text-xl font-bold text-ink mb-1">刪除這條路線？</h2>
          <p class="font-body text-sm text-inkMuted leading-relaxed mb-2">「{{ deletingEntry.name }}」及其 GPX 檔案將被永久刪除。</p>
          <p v-if="apiError" class="text-red-400 text-xs font-body mb-3 flex items-center gap-1">
            <AlertCircleIcon :size="12" /> {{ apiError }}
          </p>
          <div class="flex gap-3 mt-5">
            <button
              class="flex-1 py-2.5 rounded-lg font-semibold font-body text-sm cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors"
              :disabled="saving" @click="deletingEntry = null"
            >取消</button>
            <button
              class="flex-1 py-2.5 rounded-lg font-semibold font-body text-sm cursor-pointer delete-confirm-btn flex items-center justify-center gap-1.5"
              :disabled="saving" @click="executeDelete"
            >
              <span v-if="saving" class="w-3.5 h-3.5 border-2 rounded-full animate-spin border-current border-t-transparent" />
              <Trash2Icon v-else :size="13" />
              {{ saving ? '刪除中…' : '確認刪除' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  ArrowLeft as ArrowLeftIcon, Plus as PlusIcon, Search as SearchIcon,
  X as XIcon, Save as SaveIcon, Trash2 as Trash2Icon,
  AlertCircle as AlertCircleIcon, Map as MapIcon, Upload as UploadIcon,
} from 'lucide-vue-next'
import { useGpxLibraryStore } from '../stores/gpxLibraryStore'
import type { GpxLibraryEntry } from '../types'
import {
  parseGPXFromUrl, downsampleCoords, gpxCoordsToSvgPath,
  computeElevationStats, computeTotalDistanceKm,
} from '../services/gpx'

const CATEGORIES = ['郊山', '中級山', '高山', '百岳', '技術路線'] as const

const store = useGpxLibraryStore()
onMounted(async () => {
  await store.fetchGpxLibrary()
  loadAllCardGpx()
})

// ── Search ───────────────────────────────────────────────
const search = ref('')
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return store.gpxLibrary
  return store.gpxLibrary.filter(e => e.name.toLowerCase().includes(q))
})

const categoryCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const e of store.gpxLibrary) {
    if (e.category) counts[e.category] = (counts[e.category] ?? 0) + 1
  }
  return counts
})

function starsDisplay(stars?: number | null): string {
  if (!stars) return '—'
  return '★'.repeat(stars) + '☆'.repeat(5 - stars)
}

// ── Card GPX SVG loading ──────────────────────────────────
type CardPath = { d: string; start: [number, number]; end: [number, number] }
const cardPaths = ref(new Map<string, CardPath>())

function loadAllCardGpx() {
  for (const entry of store.gpxLibrary) {
    if (!cardPaths.value.has(entry.id)) loadCardGpx(entry)
  }
}

async function loadCardGpx(entry: GpxLibraryEntry) {
  try {
    const gpxData = await parseGPXFromUrl(entry.gpxFileUrl)
    const sampled = downsampleCoords(gpxData.coordinates, 200)
    const result  = gpxCoordsToSvgPath(sampled)
    cardPaths.value.set(entry.id, result)
  } catch { /* silently skip on error */ }
}

watch(() => store.gpxLibrary, (entries) => {
  for (const e of entries) {
    if (!cardPaths.value.has(e.id)) loadCardGpx(e)
  }
}, { deep: false })

// ── Editor panel ──────────────────────────────────────────
type GpxForm = {
  name: string; date: string; peopleCount: number | null
  difficultyStars: number | null; category: string; gpxFile: File | null
}

const panelOpen  = ref(false)
const editingId  = ref<string | null>(null)
const saving     = ref(false)
const apiError   = ref<string | null>(null)
const fileInputEl = ref<HTMLInputElement | null>(null)

const blankForm = (): GpxForm => ({
  name: '', date: '', peopleCount: null, difficultyStars: null, category: '', gpxFile: null,
})
const form = ref<GpxForm>(blankForm())

function openCreate() {
  editingId.value = null
  form.value      = blankForm()
  apiError.value  = null
  panelOpen.value = true
}

function openEdit(entry: GpxLibraryEntry) {
  editingId.value = entry.id
  form.value = {
    name:            entry.name,
    date:            entry.date ?? '',
    peopleCount:     entry.peopleCount ?? null,
    difficultyStars: entry.difficultyStars ?? null,
    category:        entry.category ?? '',
    gpxFile:         null,
  }
  apiError.value  = null
  panelOpen.value = true
}

function closePanel() {
  panelOpen.value = false
  editingId.value = null
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  form.value.gpxFile = input.files?.[0] ?? null
}

async function submitForm() {
  if (!form.value.name.trim()) return
  if (!editingId.value && !form.value.gpxFile) return
  saving.value   = true
  apiError.value = null
  try {
    const payload = {
      name:            form.value.name.trim(),
      date:            form.value.date || null,
      difficultyStars: form.value.difficultyStars ?? null,
      category:        form.value.category || null,
      peopleCount:     form.value.peopleCount ?? null,
    }
    if (editingId.value) {
      await store.updateGpxRoute(editingId.value, { ...payload, gpxFile: form.value.gpxFile })
      // Reload SVG path if file was replaced
      if (form.value.gpxFile) {
        cardPaths.value.delete(editingId.value)
        const updated = store.gpxLibrary.find(e => e.id === editingId.value)
        if (updated) loadCardGpx(updated)
      }
    } else {
      await store.createGpxRoute({ ...payload, gpxFile: form.value.gpxFile! })
      const newest = store.gpxLibrary[0]
      if (newest) loadCardGpx(newest)
    }
    panelOpen.value = false
  } catch (e) {
    apiError.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

// ── Detail modal (Leaflet) ───────────────────────────────
const detailEntry  = ref<GpxLibraryEntry | null>(null)
const detailMapEl  = ref<HTMLDivElement | null>(null)
const detailStats  = ref<{ distanceKm: number; totalAscent: number; maxElevation: number; minElevation: number } | null>(null)
let   leafletMap: L.Map | null = null

async function openDetail(entry: GpxLibraryEntry) {
  detailEntry.value = entry
  detailStats.value = null
  await nextTick()
  await initDetailMap(entry)
}

function closeDetail() {
  detailEntry.value = null
  if (leafletMap) { leafletMap.remove(); leafletMap = null }
}

async function initDetailMap(entry: GpxLibraryEntry) {
  if (!detailMapEl.value) return
  if (leafletMap) { leafletMap.remove(); leafletMap = null }

  leafletMap = L.map(detailMapEl.value)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(leafletMap)

  try {
    const gpxData = await parseGPXFromUrl(entry.gpxFileUrl)
    const latlngs = gpxData.coordinates.map(([lat, lng]) => [lat, lng] as [number, number])

    const polyline = L.polyline(latlngs, { color: '#f4a261', weight: 3 }).addTo(leafletMap)
    leafletMap.fitBounds(polyline.getBounds(), { padding: [24, 24] })

    // Start / end markers
    if (latlngs.length > 0) {
      L.circleMarker(latlngs[0],                   { radius: 6, fillColor: '#7fcf7f', fillOpacity: 1, color: '#fff', weight: 1.5 }).addTo(leafletMap)
      L.circleMarker(latlngs[latlngs.length - 1],  { radius: 6, fillColor: '#e07070', fillOpacity: 1, color: '#fff', weight: 1.5 }).addTo(leafletMap)
    }

    const elevStats = computeElevationStats(gpxData.elevation)
    detailStats.value = {
      distanceKm:   computeTotalDistanceKm(gpxData.coordinates),
      totalAscent:  elevStats.totalAscent,
      maxElevation: elevStats.maxElevation,
      minElevation: elevStats.minElevation,
    }
  } catch {
    detailStats.value = null
  }
}

// ── Delete confirm ───────────────────────────────────────
const deletingEntry = ref<GpxLibraryEntry | null>(null)

function confirmDelete(entry: GpxLibraryEntry) {
  deletingEntry.value = entry
  apiError.value      = null
}

async function executeDelete() {
  if (!deletingEntry.value) return
  saving.value   = true
  apiError.value = null
  try {
    await store.deleteGpxRoute(deletingEntry.value.id)
    cardPaths.value.delete(deletingEntry.value.id)
    deletingEntry.value = null
  } catch (e) {
    apiError.value = (e as Error).message
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* ── Card ─────────────────────────────────────────────── */
.gpx-card {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
  background: #1a1510;
  display: flex;
  flex-direction: column;
  transition: transform 0.15s, box-shadow 0.15s;
}
.gpx-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
.gpx-card:hover .card-actions { opacity: 1 !important; }

.topo-bg {
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(140,120,80,0.14) 10px, rgba(140,120,80,0.14) 11px),
    repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(140,120,80,0.07) 10px, rgba(140,120,80,0.07) 11px);
}

.route-line {
  fill: none; stroke: #f4a261; stroke-width: 3;
  stroke-linecap: round; stroke-linejoin: round;
  filter: drop-shadow(0 0 6px rgba(244,162,97,0.5));
}
.dot-start { fill: #7fcf7f; filter: drop-shadow(0 0 3px rgba(127,207,127,0.6)); }
.dot-end   { fill: #e07070; filter: drop-shadow(0 0 3px rgba(220,112,112,0.6)); }

.card-actions { opacity: 0; }
.card-action-btn {
  font-size: 9px; font-family: monospace; padding: 3px 8px; border-radius: 4px;
  cursor: pointer; backdrop-filter: blur(4px);
  background: rgba(30,25,20,0.8); color: var(--c-inkMuted);
  border: 1px solid rgba(255,255,255,0.12);
  transition: color 0.12s, border-color 0.12s;
  text-decoration: none; display: inline-block;
}
.card-action-btn:hover { color: var(--c-ink); border-color: rgba(255,255,255,0.25); }
.card-action-del { color: #774444; border-color: rgba(220,80,80,0.2); }
.card-action-del:hover { color: #e07070; border-color: rgba(220,80,80,0.4); }

.tag-cat {
  font-size: 10px; font-family: monospace; padding: 2px 7px; border-radius: 4px;
  background: rgba(244,162,97,0.15); color: #f4a261; border: 1px solid rgba(244,162,97,0.28);
}
.tag-ppl {
  font-size: 10px; font-family: monospace; padding: 2px 7px; border-radius: 4px;
  background: rgba(198,172,143,0.12); color: var(--c-primary); border: 1px solid rgba(198,172,143,0.2);
}

/* ── Form ─────────────────────────────────────────────── */
.field-label {
  display: block; font-size: 11px; font-family: Inter, sans-serif;
  font-weight: 600; color: var(--c-inkMuted);
  letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 5px;
}
.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.no-spinner { -moz-appearance: textfield; }

/* ── Panel transition ─────────────────────────────────── */
.gear-panel-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.gear-panel-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.gear-panel-enter-from, .gear-panel-leave-to { opacity: 0; transform: translateX(20px); }

/* ── Detail modal ─────────────────────────────────────── */
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

/* ── Delete modal ─────────────────────────────────────── */
.delete-modal {
  width: 100%; max-width: 360px; border-radius: 16px;
  padding: 32px 28px 28px; background: var(--c-card);
  border: 1px solid rgba(220,60,60,0.25);
  box-shadow: 0 24px 64px rgba(0,0,0,0.5); text-align: center;
}
.modal-icon-wrap {
  width: 52px; height: 52px; border-radius: 50%;
  background: rgba(220,60,60,0.12); border: 1px solid rgba(220,60,60,0.3);
  color: #e07070; display: flex; align-items: center; justify-content: center;
  margin: 0 auto 18px;
}
.delete-confirm-btn {
  background: rgba(220,60,60,0.15); color: #e07070;
  border: 1px solid rgba(220,60,60,0.4);
}
.delete-confirm-btn:hover:not(:disabled) {
  background: rgba(220,60,60,0.28); border-color: rgba(220,60,60,0.65);
}

/* ── Modal transitions ───────────────────────────────── */
.modal-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.modal-leave-active { transition: opacity 0.14s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .detail-modal,
.modal-enter-from .delete-modal { transform: translateY(12px) scale(0.98); }
</style>
```

- [ ] **Step 2: Type-check**

```bash
cd "D:\Project\Personal\hiking" && npx vue-tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git -C "D:\Project\Personal\hiking" add src/pages/GpxLibrary.vue
git -C "D:\Project\Personal\hiking" commit -m "feat: add GpxLibrary page"
```

---

## Task 8: Router + Home.vue Navbar

**Files:**
- Modify: `D:\Project\Personal\hiking\src\router\index.ts`
- Modify: `D:\Project\Personal\hiking\src\pages\Home.vue`

- [ ] **Step 1: Add route to `router/index.ts`**

```ts
import GpxLibrary from '../pages/GpxLibrary.vue'
```

Add to the routes array (before the gear-library route):

```ts
{ path: '/gpx-library', component: GpxLibrary },
```

Full routes array after change:
```ts
routes: [
  { path: '/', component: Home },
  { path: '/detail/:id', component: Detail },
  { path: '/create', component: Create },
  { path: '/edit/:id', component: Edit },
  { path: '/gpx-library', component: GpxLibrary },
  { path: '/gear-library', component: GearLibrary },
],
```

- [ ] **Step 2: Add `Map` icon import to `Home.vue`**

In `Home.vue` `<script setup>`, the existing import already has `Map as MapIcon`. Add `Route as RouteIcon` (or use `Map2` — use `Map as GpxIcon` aliased separately):

Find:
```ts
  Compass as CompassIcon, Plus as PlusIcon, Map as MapIcon,
  Sun as SunIcon, Moon as MoonIcon, Search as SearchIcon, X as XIcon,
  Library as LibraryIcon,
```

Replace with:
```ts
  Compass as CompassIcon, Plus as PlusIcon, Map as MapIcon,
  Sun as SunIcon, Moon as MoonIcon, Search as SearchIcon, X as XIcon,
  Library as LibraryIcon, Route as RouteIcon,
```

- [ ] **Step 3: Add "GPX 收藏" button to `Home.vue` navbar**

Find in the template:
```html
          <router-link
            to="/gear-library"
            class="card-aged flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
          >
            <LibraryIcon :size="15" />
            裝備庫
          </router-link>
```

Replace with:
```html
          <router-link
            to="/gpx-library"
            class="card-aged flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
          >
            <RouteIcon :size="15" />
            GPX 收藏
          </router-link>
          <router-link
            to="/gear-library"
            class="card-aged flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
          >
            <LibraryIcon :size="15" />
            裝備庫
          </router-link>
```

- [ ] **Step 4: Type-check**

```bash
cd "D:\Project\Personal\hiking" && npx vue-tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git -C "D:\Project\Personal\hiking" add src/router/index.ts src/pages/Home.vue
git -C "D:\Project\Personal\hiking" commit -m "feat: add GPX Library route and navbar button"
```

---

## Verification Checklist

- [ ] `gpx_library` table exists in Supabase with correct columns
- [ ] `gpx-library` storage bucket exists and is public
- [ ] Backend builds in Rider with zero errors
- [ ] `GET /api/GpxLibrary` returns `[]` when empty
- [ ] `POST /api/GpxLibrary` creates a row → `POST /api/GpxLibrary/{id}/file` uploads file → `gpx_file_url` is populated
- [ ] `GET /api/GpxLibrary` returns the created entry
- [ ] `PUT /api/GpxLibrary/{id}` updates metadata
- [ ] `DELETE /api/GpxLibrary/{id}` removes row
- [ ] Home navbar shows "GPX 收藏" button left of "裝備庫"
- [ ] `/gpx-library` page loads, shows empty state
- [ ] Add a GPX file: card appears with topo background + route SVG
- [ ] Click card body → Leaflet modal opens with route + stats
- [ ] Hover card → download / edit / delete buttons appear
- [ ] Download button triggers `.gpx` file download
- [ ] Edit → side panel pre-fills fields, save updates card
- [ ] Delete → confirm modal → card removed
- [ ] Search filters cards by name client-side
- [ ] `npx vue-tsc --noEmit` — zero errors
