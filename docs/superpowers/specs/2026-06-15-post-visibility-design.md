# Post Visibility (Public / Private) Design

## Goal
Allow the post owner to toggle each post between private and public. Unauthenticated visitors only see public posts on Home and are redirected to home if they navigate directly to a private post's detail page.

## Database

```sql
ALTER TABLE posts ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
```

All existing posts default to private (`false`). The owner must explicitly publish each one.

## Backend

### Model & Repository
- `PostModel.cs`: add `public bool IsPublic { get; set; }` property
- `PostRepository.cs`:
  - Include `is_public` in all SELECT queries
  - Add `UpdateIsPublicAsync(Guid id, bool isPublic)` — `UPDATE posts SET is_public = @IsPublic WHERE id = @Id`

### Service
- `PostService.cs`:
  - `GetAllAsync(bool isAuthenticated)` — if `!isAuthenticated`, adds `WHERE is_public = true` filter
  - `SetPublicAsync(Guid id, bool isPublic)` — delegates to repository

### Controller
- `PostsController.GetAll()`:
  - Reads `Authorization` header, validates JWT via `AuthService`
  - Passes `isAuthenticated` bool to `PostService.GetAllAsync`
- New endpoint `PATCH /api/Posts/{id}/visibility`:
  - Body: `{ "isPublic": true/false }`
  - Protected by `[RequireAuth]`
  - Calls `PostService.SetPublicAsync`

## Frontend

### Types
`Post` interface gets `isPublic?: boolean`

### Store
`postStore.ts` gets `updatePostVisibility(postId: string, isPublic: boolean): Promise<void>` — calls `PATCH /api/Posts/{id}/visibility`

### Detail.vue

**Header row 1** right-side button group (left to right): `[公開發布 / 取消公開]` · `[編輯]` · `[匯出]`

Visibility button:
- Only rendered when `auth.user` is set
- Private state (`!post.isPublic`): `GlobeIcon` + "公開發布", styled `btn-cta` (primary colour, stands out)
- Public state (`post.isPublic`): `EyeOffIcon` + "取消公開", styled `card-aged text-inkMuted` (muted)
- Click handler: calls `store.updatePostVisibility(post.id, !post.isPublic)`, updates `store.currentPost.isPublic` optimistically

**Private post guard** (in `onMounted` / `watch` after post loads):
```
if (!store.currentPost.isPublic && !auth.user) router.replace('/')
```

### Home.vue
No frontend change. Backend already returns the filtered list.

## Not in scope
- Per-user access control (it's all-or-nothing: public or owner-only)
- Visibility indicator on Home.vue post cards
- Drafts / scheduled publishing
