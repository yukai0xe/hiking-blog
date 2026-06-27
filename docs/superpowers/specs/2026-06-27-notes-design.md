# Notes (Link Collection) Design

**Goal:** Add a Notes page where users can bookmark URLs with link previews, organized into named groups.

**Architecture:** Vertical sections layout — ungrouped links at top, each group as a titled section below. Backend provides an og:title + og:image scrape endpoint to avoid CORS. Data stored in two new tables with `ON DELETE SET NULL` so deleting a group orphans its links to ungrouped.

**Tech Stack:** Vue 3 + TypeScript, Pinia, existing `apiFetch` pattern, REST API backend.

---

## Data Model

### `note_groups`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text NOT NULL | |
| description | text | nullable |
| sort_order | int | insertion order |
| created_at | timestamptz | |

### `note_links`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| group_id | uuid nullable FK → note_groups | ON DELETE SET NULL — link survives group deletion |
| url | text NOT NULL | |
| title | text NOT NULL | fetched from og:title at add time |
| cover_image_url | text | nullable, fetched from og:image at add time |
| sort_order | int | insertion order |
| created_at | timestamptz | |

---

## Backend API Endpoints

All endpoints require `Authorization: Bearer <token>`.

| Method | Path | Body / Params | Response |
|---|---|---|---|
| GET | `/api/notes` | — | `{ groups: NoteGroup[], links: NoteLink[] }` |
| POST | `/api/notes/groups` | `{ name, description? }` | created group |
| PATCH | `/api/notes/groups/:id` | `{ name, description? }` | updated group |
| DELETE | `/api/notes/groups/:id` | — | 204 (links become ungrouped via DB cascade) |
| POST | `/api/notes/links` | `{ url, title, coverImageUrl?, groupId? }` | created link |
| DELETE | `/api/notes/links/:id` | — | 204 |
| GET | `/api/notes/preview?url=…` | query param | `{ title: string, coverImageUrl: string \| null }` |

The preview endpoint fetches the target URL server-side, parses `og:title` (fallback: `<title>`) and `og:image`. Returns 200 with nulls if fetch fails — client handles gracefully.

---

## Frontend Architecture

### Store — `src/stores/notesStore.ts`

Pinia store using the same `apiFetch` helper pattern as `gpxLibraryStore`.

State: `groups: NoteGroup[]`, `links: NoteLink[]`, `loading: boolean`, `error: string | null`

Methods:
- `fetchNotes()` — GET /api/notes, populates both arrays
- `createGroup(name, description?)` → optimistic push, POST, refetch on error
- `updateGroup(id, name, description?)` → optimistic patch
- `deleteGroup(id)` → optimistic remove from groups (links with that group_id get group_id set to null client-side too)
- `addLink(url, title, coverImageUrl?, groupId?)` → POST, push to links
- `deleteLink(id)` → DELETE, filter from links
- `fetchPreview(url)` → GET /api/notes/preview, returns `{ title, coverImageUrl }`

### Components

**`src/pages/Notes.vue`**
- Route: `/notes` (protected)
- Top section: grid of ungrouped links (`links` where `group_id == null`) + "+ Add Link" button
- Maps over `groups` to render `<NoteGroupSection>` per group
- "+ New Group" button at the bottom of the page
- Owns open/close state for `NoteAddLinkModal` and `NoteGroupEditModal`
- Passes `groupId: null` to modal for ungrouped adds, group's id for grouped adds

**`src/components/NoteGroupSection.vue`**
- Props: `group: NoteGroup`, `links: NoteLink[]`
- Emits: `add-link`, `edit-group`, `delete-group`
- Header: group name + description + edit button + delete button (with inline confirm)
- Link grid below
- "+ Add Link" button at bottom of section

**`src/components/NoteLinkCard.vue`**
- Props: `link: NoteLink`
- Emits: `delete`
- Cover image (og:image) or a placeholder if none
- Title text
- URL hostname as muted subtitle
- Delete button visible on card hover

**`src/components/NoteAddLinkModal.vue`**
- Props: `open: boolean`, `groupId: string | null`
- Emits: `close`, `added`
- URL text input → "Preview" button → calls `notesStore.fetchPreview(url)`
- Shows spinner while fetching; shows preview card (cover + title) once resolved
- "Add" button calls `notesStore.addLink(...)` then emits `added`
- If preview fetch fails, user can still submit with the URL (title defaults to hostname)

**`src/components/NoteGroupEditModal.vue`**
- Props: `open: boolean`, `group: NoteGroup | null` (null = create mode)
- Emits: `close`, `saved`
- Name input (required) + description textarea (optional)
- Calls `createGroup` or `updateGroup` depending on mode

### Routing & Navigation

`src/router/index.ts`:
- Add `{ path: '/notes', component: Notes }` import
- Add `'/notes'` to `protectedPaths`

`src/components/UserAvatarMenu.vue`:
- Add `BookmarkIcon` row `to="/notes"` labelled `筆記` between 裝備庫 and the first divider before 個人設定

---

## Types — `src/types/index.ts` additions

```ts
export interface NoteGroup {
  id:          string
  name:        string
  description: string | null
  sortOrder:   number
  createdAt:   string
}

export interface NoteLink {
  id:            string
  groupId:       string | null
  url:           string
  title:         string
  coverImageUrl: string | null
  sortOrder:     number
  createdAt:     string
}
```

---

## Error Handling

- `fetchPreview` failure: modal shows "無法取得預覽，仍可新增連結" with hostname as title fallback
- Any store mutation failure: `error` ref populated, shown as inline error in the triggering modal
- Group delete: no cascade confirmation needed — links survive; a brief inline confirm ("確定刪除分組？") on the delete button suffices

---

## Out of Scope

- Drag-and-drop reordering of links or groups
- Moving a link between groups after creation
- Link click-through tracking
