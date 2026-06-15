# Post Visibility (Public / Private Toggle) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public/private toggle to each post so unauthenticated visitors only see posts the owner has explicitly published.

**Architecture:** A new `is_public` boolean column on `posts` (default `false`) drives visibility. The backend `GET /api/Posts` filters by `is_public = true` for unauthenticated callers; a new `PATCH /api/Posts/{id}/visibility` endpoint (auth-protected) sets the flag. The frontend adds a toggle button in Detail.vue's header visible only when logged in, and redirects unauthenticated users away from private post detail pages.

**Tech Stack:** C# ASP.NET Core 9 / Dapper / Npgsql (backend) · Vue 3 + TypeScript + Pinia (frontend) · Supabase Postgres (database) · System.IdentityModel.Tokens.Jwt for auth validation

---

### Task 1: Database Migration

**Files:**
- Create: `D:\RiderProject\hiking-backend\hiking.Repository\supabase\migrations\20260615000001_post_visibility.sql`

- [ ] **Step 1: Create the migration file**

```sql
ALTER TABLE posts ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
```

Save to `hiking.Repository/supabase/migrations/20260615000001_post_visibility.sql`.

- [ ] **Step 2: Apply the migration via Supabase Dashboard**

Open Supabase Dashboard → SQL Editor → paste and run the SQL above.

Verify with: `SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'is_public';`
Expected: one row with `data_type = boolean`, `column_default = false`.

- [ ] **Step 3: Commit**

```bash
git add hiking.Repository/supabase/migrations/20260615000001_post_visibility.sql
git commit -m "feat: add is_public column to posts"
```

---

### Task 2: Backend — Model & Repository

**Files:**
- Modify: `D:\RiderProject\hiking-backend\hiking.Repository\Model\PostModel.cs`
- Modify: `D:\RiderProject\hiking-backend\hiking.Repository\Repositories\PostRepository.cs`

- [ ] **Step 1: Add `IsPublic` to PostModel**

In `PostModel.cs`, add after `ShowFoods`:

```csharp
public bool IsPublic { get; set; } = false;
```

Full property block after the edit:
```csharp
public bool ShowGpx   { get; set; } = true;
public bool ShowGears { get; set; } = true;
public bool ShowFoods { get; set; } = true;
public bool IsPublic  { get; set; } = false;
```

- [ ] **Step 2: Update `GetAllAsync` to accept a `publicOnly` filter**

In `PostRepository.cs`, change the signature and body of `GetAllAsync`:

```csharp
public async Task<List<PostModel>> GetAllAsync(bool publicOnly = false)
{
    await using var conn = await db.OpenConnectionAsync();
    var sql = publicOnly
        ? """
          SELECT * FROM posts
          WHERE deleted_at IS NULL AND is_public = true
          ORDER BY created_at DESC
          """
        : """
          SELECT * FROM posts
          WHERE deleted_at IS NULL
          ORDER BY created_at DESC
          """;
    return (await conn.QueryAsync<PostModel>(sql)).ToList();
}
```

- [ ] **Step 3: Add `UpdateIsPublicAsync`**

Add after `UpdateGpxDescriptionAsync` in `PostRepository.cs`:

```csharp
public async Task UpdateIsPublicAsync(Guid id, bool isPublic)
{
    await using var conn = await db.OpenConnectionAsync();
    await conn.ExecuteAsync(
        "UPDATE posts SET is_public = @isPublic WHERE id = @id",
        new { id, isPublic });
}
```

- [ ] **Step 4: Commit**

```bash
git add hiking.Repository/Model/PostModel.cs hiking.Repository/Repositories/PostRepository.cs
git commit -m "feat: add IsPublic to PostModel and visibility methods to PostRepository"
```

---

### Task 3: Backend — Service & Controller

**Files:**
- Modify: `D:\RiderProject\hiking-backend\hiking.Service\Services\PostService.cs`
- Modify: `D:\RiderProject\hiking-backend\hiking.WebApi\Controllers\PostConroller.cs`

- [ ] **Step 1: Update `PostService.GetAllAsync` to accept `isAuthenticated`**

In `PostService.cs`, change the signature and body:

```csharp
public async Task<List<PostModel>> GetAllAsync(bool isAuthenticated = false)
{
    return await repo.GetAllAsync(publicOnly: !isAuthenticated);
}
```

- [ ] **Step 2: Add `SetPublicAsync` to PostService**

Add after `GetAllAsync` in `PostService.cs`:

```csharp
public async Task SetPublicAsync(Guid id, bool isPublic)
{
    await repo.UpdateIsPublicAsync(id, isPublic);
}
```

- [ ] **Step 3: Update `PostsController` — inject AuthService and update `GetAll`**

The controller currently declares: `public class PostsController(PostService svc, PdfExportService pdfSvc)`.

Change the constructor parameters to also include `AuthService authSvc`:

```csharp
public class PostsController(PostService svc, PdfExportService pdfSvc, AuthService authSvc) : ControllerBase
```

Update the `using` directives at the top of the file — add:
```csharp
using hikingService.Services;
```

Change `GetAll()`:

```csharp
[HttpGet]
public async Task<IActionResult> GetAll()
{
    var bearer = Request.Headers.Authorization.FirstOrDefault();
    var token  = bearer?.StartsWith("Bearer ") == true ? bearer[7..] : null;
    var isAuthenticated = token is not null && authSvc.ValidateJwt(token) is not null;
    return Ok(await svc.GetAllAsync(isAuthenticated));
}
```

- [ ] **Step 4: Add the `PATCH {id}/visibility` endpoint**

Add a request model record at the bottom of `PostConroller.cs` (above the closing `}`):

```csharp
public record VisibilityRequest(bool IsPublic);
```

Add the endpoint inside the controller class:

```csharp
[HttpPatch("{id:guid}/visibility")]
public async Task<IActionResult> SetVisibility(Guid id, [FromBody] VisibilityRequest req)
{
    await svc.SetPublicAsync(id, req.IsPublic);
    return NoContent();
}
```

Note: `[RequireAuth]` is already applied at the class level, so this endpoint is automatically auth-protected. GET requests skip auth (the filter body checks `if IsGet return`), so `GetAll` remains publicly accessible.

- [ ] **Step 5: Verify build compiles in Rider IDE**

Open Rider and trigger a build. Fix any compile errors before committing.

- [ ] **Step 6: Commit**

```bash
git add hiking.Service/Services/PostService.cs hiking.WebApi/Controllers/PostConroller.cs
git commit -m "feat: post visibility service method and PATCH visibility endpoint"
```

---

### Task 4: Frontend — Types & Store

**Files:**
- Modify: `D:\Project\Personal\hiking\src\types\index.ts`
- Modify: `D:\Project\Personal\hiking\src\stores\postStore.ts`

- [ ] **Step 1: Add `isPublic` to the `Post` interface**

In `types/index.ts`, add to the `Post` interface after `gpxDescription`:

```typescript
isPublic?: boolean | null
```

Full `Post` interface after the edit:
```typescript
export interface Post {
  id: string
  title: string
  coverImage: string
  gpxFile: string
  description: string
  created_at: string
  dateStart?: string | null
  dateEnd?: string | null
  weather?: string | null
  peopleCount?: number | null
  deletedAt?: string | null
  tags?: string[] | null
  compressedCoverImage?: string | null
  showGpx?: boolean | null
  showGears?: boolean | null
  showFoods?: boolean | null
  gpxDescription?: string | null
  isPublic?: boolean | null
}
```

- [ ] **Step 2: Add `updatePostVisibility` to postStore**

In `postStore.ts`, add the following function before the `return { ... }` block:

```typescript
async function updatePostVisibility(postId: string, isPublic: boolean): Promise<void> {
  await apiFetch(`/api/Posts/${postId}/visibility`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ isPublic }),
  })
  if (currentPost.value?.id === postId) {
    currentPost.value = { ...currentPost.value, isPublic }
  }
}
```

Then add `updatePostVisibility` to the returned object in the `return { ... }` block:

```typescript
return {
  // ... existing exports ...
  updatePostVisibility,
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/stores/postStore.ts
git commit -m "feat: add isPublic to Post type and updatePostVisibility to store"
```

---

### Task 5: Frontend — Detail.vue Visibility Button & Guard

**Files:**
- Modify: `D:\Project\Personal\hiking\src\pages\Detail.vue`

- [ ] **Step 1: Import Globe icon and auth store**

In `Detail.vue`'s `<script setup>` section, find the Lucide import line (around line 1087):

```typescript
Plus as PlusIcon, Eye as EyeIcon, EyeOff as EyeOffIcon, Trash2 as Trash2Icon, X as XIcon,
```

Add `Globe as GlobeIcon` to the import:

```typescript
Plus as PlusIcon, Eye as EyeIcon, EyeOff as EyeOffIcon, Globe as GlobeIcon, Trash2 as Trash2Icon, X as XIcon,
```

Then import the auth store. Find the existing import block (it already imports `usePostStore`) and add:

```typescript
import { useAuthStore } from '../stores/authStore'
```

Add below the existing store setup:

```typescript
const auth = useAuthStore()
```

- [ ] **Step 2: Add the `toggleVisibility` handler**

Add this function in the `<script setup>` section, near the other async action handlers:

```typescript
async function toggleVisibility() {
  if (!store.currentPost) return
  await store.updatePostVisibility(store.currentPost.id, !store.currentPost.isPublic)
}
```

- [ ] **Step 3: Add private-post redirect guard**

In `onMounted`, after `await store.fetchPostDetail(id)`, add the guard:

```typescript
onMounted(async () => {
  const id = route.params.id as string
  await store.fetchPostDetail(id)
  // Redirect unauthenticated users away from private posts
  if (!store.currentPost?.isPublic && !auth.user) {
    router.replace('/')
    return
  }
  await store.fetchGpxRecords(id)
  window.addEventListener('scroll', onWindowScroll, { passive: true })
})
```

Note: `router` is already imported via `useRouter()` at the top of the script setup.

- [ ] **Step 4: Add the visibility toggle button in the header**

In the template, find the header button group (around line 30):

```html
<div class="flex items-center gap-2">
  <router-link
    :to="`/edit/${store.currentPost!.id}`"
    class="card-aged text-inkMuted hover:text-ink flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
  >
    <PencilIcon :size="14" />
    編輯
  </router-link>
  <button
    class="card-aged text-inkMuted hover:text-ink flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
    @click="showExportModal = true"
  >
    <DownloadIcon :size="14" />
    匯出
  </button>
</div>
```

Add the visibility button **before** the `<router-link>` for 編輯:

```html
<div class="flex items-center gap-2">
  <button
    v-if="auth.user"
    @click="toggleVisibility"
    :class="store.currentPost!.isPublic
      ? 'card-aged text-inkMuted hover:text-ink'
      : 'btn-cta'"
    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
  >
    <EyeOffIcon v-if="store.currentPost!.isPublic" :size="14" />
    <GlobeIcon  v-else :size="14" />
    {{ store.currentPost!.isPublic ? '取消公開' : '公開發布' }}
  </button>
  <router-link
    :to="`/edit/${store.currentPost!.id}`"
    class="card-aged text-inkMuted hover:text-ink flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
  >
    <PencilIcon :size="14" />
    編輯
  </router-link>
  <button
    class="card-aged text-inkMuted hover:text-ink flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
    @click="showExportModal = true"
  >
    <DownloadIcon :size="14" />
    匯出
  </button>
</div>
```

- [ ] **Step 5: Test the feature manually**

1. Start the dev server: `npm run dev`
2. Log in via Google OAuth
3. Open a post detail page — the "公開發布" button (btn-cta style) should appear in the header
4. Click "公開發布" — button should flip to "取消公開" (muted style)
5. Log out — the post should now appear on Home
6. Navigate directly to the private post URL while logged out — should redirect to `/`
7. Publish the post, log out — both Home list and direct URL should work

- [ ] **Step 6: Commit**

```bash
git add src/pages/Detail.vue
git commit -m "feat: public/private visibility toggle button and guard in Detail.vue"
```
