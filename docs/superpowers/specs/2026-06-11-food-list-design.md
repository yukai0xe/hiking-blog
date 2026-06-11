# 糧食清單 (Food List) — Design Spec

**Date:** 2026-06-11  
**Scope:** Full-stack — DB migration, C# backend, Vue frontend (Create step 6, Edit step 6, Detail display)

---

## Overview

Add a sixth step "糧食清單" to the Create and Edit flows, allowing users to record food/rations for each expedition. Food items are persisted to a dedicated `foods` DB table, displayed read-only in Detail.vue below the existing gear table.

Fields per food item: 食物名稱, 重量 (g), 數量, 備註, 參考連結, 價格.

---

## Data Layer

### DB Migration

```sql
CREATE TABLE foods (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  name          text NOT NULL,
  weight        int  NOT NULL DEFAULT 0,
  quantity      int  NOT NULL DEFAULT 1,
  note          text NOT NULL DEFAULT '',
  reference_url text,
  price         int,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON foods FOR ALL USING (true) WITH CHECK (true);
```

Migration file: `supabase/migrations/20260611000001_foods.sql`

### C# Backend

**`hiking.Repository/Model/FoodModel.cs`**
```csharp
public class FoodModel
{
    public Guid    Id           { get; set; }
    public Guid    PostId       { get; set; }
    public string  Name         { get; set; } = "";
    public int     Weight       { get; set; }
    public int     Quantity     { get; set; }
    public string  Note         { get; set; } = "";
    public string? ReferenceUrl { get; set; }
    public int?    Price        { get; set; }
}
```

**`PostRepository.cs`** — add two methods:
- `GetFoodsAsync(Guid postId) → IEnumerable<FoodModel>`  
  `SELECT id, post_id, name, weight, quantity, note, reference_url, price FROM foods WHERE post_id = @postId ORDER BY created_at`
- `InsertFoodsAsync(Guid postId, IEnumerable<FoodInsertDto> foods)`  
  Bulk INSERT into foods table

**`PostService.cs` / `PostsController.cs`**
- `CreatePostRequest` DTO gains `Foods` array (name, weight, quantity, note, referenceUrl, price)
- `createPost` calls `InsertFoodsAsync` after inserting the post
- `GetPostDetail` response includes `foods` array
- `UpdatePost` replaces foods (delete existing rows for postId, re-insert)

---

## TypeScript Types

**`src/types/index.ts`** — add:
```ts
export interface Food {
  id:            string
  postId:        string
  name:          string
  weight:        number
  quantity:      number
  note:          string
  referenceUrl?: string | null
  price?:        number | null
}

export type FoodDraft = {
  name:         string
  weight:       number
  quantity:     number
  note:         string
  referenceUrl: string
  price:        number | null
}
```

**`src/stores/postStore.ts`** — add:
- `currentFoods: ref<Food[]>([])`
- Populate in `fetchPostDetail` from API response
- `createPost` payload gains `foods: FoodDraft[]`
- `updatePost` payload gains `foodsToAdd / foodsToUpdate / foodIdsToDelete` (mirror gear pattern)

---

## Frontend Components

### `src/components/FoodQuickPick.vue`

Right-side table used in Create step 6 and Edit step 6.

- **Props:** `newFoods: FoodDraft[]`, `activeNewIndex: number | null`, `existingFoods?: Food[]`
- **Emits:** `selectNew(food, index)`, `removeNew(index)`, `selectExisting(food, id)`, `markDelete(id)`
- **Columns:** 名稱 (+ external link icon if referenceUrl) / 重量×數量 / 價格 / 備註 / delete button
- Mirrors GearQuickPick styling (`.th`, `.td`, `.data-row`, `.new-badge`, `.is-active` classes)
- Empty state: `— 尚無糧食 —`

### `src/components/FoodList.vue`

Read-only table for Detail.vue.

- **Props:** `foods: Food[]`
- **Columns:** 名稱 (+ link icon) / 重量 (g) / 數量 / 總重 / 價格 / 備註
- Footer Total row: sum of `weight × quantity` across all items
- Empty state: `— 尚無糧食資料 —`
- Mirrors GearList.vue styling

---

## Create.vue — Step 6

Layout mirrors Step 5 exactly:
- Outer wrapper switches to `max-w-[1240px] mx-auto flex gap-5 items-start` when `step === 6`
- Left card (`flex-1`): food entry form
- Right panel (`w-[560px] shrink-0`): `FoodQuickPick` with `newFoods` and `activeNewIndex`

**Step indicator:** `stepLabels` extends to `['基本', 'GPX', '封面', '照片', '裝備', '糧食']`

**Navigation:** `v-if="step < 6"` for 下一步; `v-else` for 完成送出

**Form fields (left card):**
```
Row 1: 食物名稱* (flex-1)
Row 2: 重量(g) [80px] | 數量 [60px] | 價格 [90px] | 備註 (flex-1)
Row 3: 參考連結 (full width)
```

**Local state:**
```ts
type FoodDraft = { name: string; weight: number; quantity: number; note: string; referenceUrl: string; price: number | null }
const foodsToAdd     = ref<FoodDraft[]>([])
const newFood        = ref<FoodDraft>({ name: '', weight: 0, quantity: 1, note: '', referenceUrl: '', price: null })
const activeFoodIndex = ref<number | null>(null)
```

**`submitFood()`** — pushes to `foodsToAdd` or updates existing index (mirrors `submitGear`)

**`submit()`** — passes `foodsToAdd` to `store.createPost`

---

## Edit.vue — Step 6

Same layout as Create step 6, but pre-populated from `store.currentFoods`:
- On mount / step change: populate `existingFoods` ref from store
- Supports inline edit (click row → load into form → save updates the row)
- On submit: diff against original to compute `foodsToAdd`, `foodsToUpdate`, `foodIdsToDelete`
- Passes all three to `store.updatePost`

---

## Detail.vue — Food Section

Inside the gear tab panel (wherever `<GearList>` is rendered in Detail.vue), directly after it:

```html
<template v-if="store.currentFoods.length > 0">
  <h3 class="font-heading text-base text-ink mt-6 mb-3">糧食清單</h3>
  <FoodList :foods="store.currentFoods" />
</template>
```

No tab structure changes — food appears inline below the gear table.

---

## Verification Checklist

- [ ] DB migration runs cleanly on Supabase
- [ ] POST /api/posts with foods array persists correctly
- [ ] GET /api/posts/:id returns foods
- [ ] Create flow step 6: add, edit, remove food items; submit saves to DB
- [ ] Detail view: food section appears below gear table when foods exist
- [ ] Edit flow step 6: existing foods load, can be edited/deleted/added
- [ ] `npx vue-tsc --noEmit` — zero errors
