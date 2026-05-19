import { test, expect, Page } from '@playwright/test';

const BASE  = 'http://localhost:5173';
const TODAY = new Date().toISOString().slice(0, 10);

test('Hiking Journal — full user flow', async ({ page }) => {
  let postId = '';

  // ════════════════════════════════════════════════════════════════════
  // Phase 1: Create a new post
  // ════════════════════════════════════════════════════════════════════

  await test.step('Home page loads and shows the 新增記錄 button', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
    await expect(page.locator('a[href="/create"]', { hasText: '新增記錄' }).first()).toBeVisible({ timeout: 8000 });
  });

  await test.step('Click 新增記錄 → navigate to /create', async () => {
    await page.locator('a[href="/create"]', { hasText: '新增記錄' }).first().click();
    await page.waitForURL('**/create', { timeout: 10000 });
    expect(page.url()).toContain('/create');
  });

  await test.step('Enter title "Test1" in step 1', async () => {
    const titleInput = page.locator('input[placeholder="這次登山的名稱"]');
    await titleInput.waitFor({ timeout: 8000 });
    await titleInput.fill('Test1');
  });

  await test.step('Click 下一步 four times to reach step 5', async () => {
    for (let i = 0; i < 4; i++) {
      const nextBtn = page.locator('button', { hasText: '下一步' });
      await nextBtn.waitFor({ timeout: 5000 });
      await nextBtn.click();
      await page.waitForTimeout(300);
    }
    await expect(page.locator('button', { hasText: '完成送出' })).toBeVisible({ timeout: 5000 });
  });

  await test.step('Click 完成送出 → redirect to /detail/<uuid>', async () => {
    await page.locator('button', { hasText: '完成送出' }).click();
    await page.waitForURL(/\/detail\/[0-9a-f-]+/, { timeout: 30000 });
    expect(page.url()).toMatch(/\/detail\/[0-9a-f-]+/);
    postId = page.url().match(/\/detail\/([0-9a-f-]+)/)?.[1] ?? '';
  });

  // ════════════════════════════════════════════════════════════════════
  // Phase 2: Return home and verify card count
  // ════════════════════════════════════════════════════════════════════

  await test.step('Click 返回 → navigate back to /', async () => {
    const backBtn = page.locator('button', { hasText: '返回' });
    await backBtn.waitFor({ timeout: 8000 });
    await backBtn.click();
    await page.waitForURL(BASE + '/', { timeout: 10000 }).catch(() =>
      page.waitForURL(BASE, { timeout: 5000 })
    );
    expect(page.url().replace(/\/$/, '')).toBe(BASE);
  });

  await test.step('Home page shows the newly created Test1 card', async () => {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await expect(page.locator('.card-wrap').filter({ hasText: 'Test1' }).first()).toBeVisible({ timeout: 10000 });
  });

  // ════════════════════════════════════════════════════════════════════
  // Phase 3: Open detail and verify tabs
  // ════════════════════════════════════════════════════════════════════

  await test.step('Click Test1 card → navigate to /detail/<uuid>', async () => {
    await page.locator('.card-wrap').filter({ hasText: 'Test1' }).first().click();
    await page.waitForURL(/\/detail\/[0-9a-f-]+/, { timeout: 15000 });
    expect(page.url()).toMatch(/\/detail\/[0-9a-f-]+/);
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });

  await test.step('Detail page has three tabs: 照片, 地圖, 裝備 — all clickable', async () => {
    const tabPhotos = page.locator('button', { hasText: '照片' });
    const tabMap    = page.locator('button', { hasText: '地圖' });
    const tabGear   = page.locator('button', { hasText: '裝備' });

    await expect(tabPhotos).toBeVisible({ timeout: 8000 });
    await expect(tabMap).toBeVisible({ timeout: 5000 });
    await expect(tabGear).toBeVisible({ timeout: 5000 });

    await tabMap.click();
    await page.waitForTimeout(300);
    await tabGear.click();
    await page.waitForTimeout(300);
    await tabPhotos.click();
    await page.waitForTimeout(300);
  });

  // ════════════════════════════════════════════════════════════════════
  // Phase 4: Edit the post — fill metadata
  // ════════════════════════════════════════════════════════════════════

  await test.step('Click 編輯 → navigate to /edit/<uuid>', async () => {
    await page.locator('a', { hasText: '編輯' }).first().click();
    await page.waitForURL(/\/edit\/[0-9a-f-]+/, { timeout: 15000 });
    expect(page.url()).toMatch(/\/edit\/[0-9a-f-]+/);
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });

  await test.step('Fill 開始日期 01/01/2026, 結束日期 01/05/2026, 天氣 起霧, 人數 7', async () => {
    const dateStartInput = page.locator('input[type="date"]').first();
    await dateStartInput.waitFor({ timeout: 8000 });
    await dateStartInput.fill('2026-01-01');
    await page.locator('input[type="date"]').nth(1).fill('2026-01-05');
    await page.locator('select.input-field').first().selectOption('起霧');
    await page.locator('input[placeholder="隊員人數"]').fill('7');
  });

  await test.step('Click progress step "裝備" (step 5) and verify gear section appears', async () => {
    await page.locator('span.font-body', { hasText: '裝備' }).first().click();
    await page.waitForTimeout(400);
    await expect(page.locator('h2', { hasText: '新增裝備' })).toBeVisible({ timeout: 5000 });
  });

  await test.step('Click 儲存 → redirect to /detail/<uuid>', async () => {
    await page.locator('button', { hasText: '儲存' }).first().click();
    await page.waitForURL(/\/detail\/[0-9a-f-]+/, { timeout: 30000 });
    expect(page.url()).toMatch(/\/detail\/[0-9a-f-]+/);
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });

  // ════════════════════════════════════════════════════════════════════
  // Phase 5: Verify updated metadata on detail page
  // ════════════════════════════════════════════════════════════════════

  await test.step('Detail page shows meta chips: 起霧, 7 人, 2026/01/01 – 2026/01/05', async () => {
    await expect(page.locator('.meta-chip').filter({ hasText: '起霧' }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.meta-chip').filter({ hasText: '7 人' }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.meta-chip').filter({ hasText: '2026/01/01' }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.meta-chip').filter({ hasText: '2026/01/05' }).first()).toBeVisible({ timeout: 5000 });
  });

  // ════════════════════════════════════════════════════════════════════
  // Phase 6: Add gear on edit page
  // ════════════════════════════════════════════════════════════════════

  await test.step('Click 編輯 → /edit/<uuid> (for gear entry)', async () => {
    await page.locator('a', { hasText: '編輯' }).first().click();
    await page.waitForURL(/\/edit\/[0-9a-f-]+/, { timeout: 15000 });
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });

  await test.step('Click progress step "裝備" → verify 新增裝備 (left) + 現有裝備 (right)', async () => {
    await page.locator('span.font-body', { hasText: '裝備' }).first().click();
    await page.waitForTimeout(400);
    await expect(page.locator('h2', { hasText: '新增裝備' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('p.label-title', { hasText: '現有裝備' })).toBeVisible({ timeout: 5000 });
  });

  await test.step('Fill gear form: 大背包 / OSPREY / 背負系統 / 12000 / 今日 / 2200g / 1 / 備註 / URL', async () => {
    const nameInput = page.locator('input[placeholder="裝備名稱 *"]');
    await nameInput.waitFor({ timeout: 5000 });
    await nameInput.fill('大背包');

    await page.locator('select.input-field.font-body').selectOption('背負系統');
    await page.locator('input[placeholder="品牌名稱"]').fill('OSPREY');

    await page.locator('label.field-label', { hasText: '價格' })
      .locator('xpath=..').locator('input').fill('12000');
    await page.locator('label.field-label', { hasText: '加入時間' })
      .locator('xpath=..').locator('input').fill(TODAY);
    await page.locator('label.field-label', { hasText: '重量' })
      .locator('xpath=..').locator('input').fill('2200');
    await page.locator('label.field-label', { hasText: '數量' })
      .locator('xpath=..').locator('input').fill('1');

    await page.locator('input[placeholder="選填"]').fill('包覆性強');
    await page.locator('input[type="url"]').fill('https://www.tpshanshui.com.tw/');
  });

  await test.step('Click 加入清單 → 大背包 appears in right panel with NEW badge', async () => {
    await page.locator('button', { hasText: '加入清單' }).click();
    await page.waitForTimeout(300);

    const newGearRow = page.locator('tr').filter({ hasText: '大背包' });
    await expect(newGearRow).toBeVisible({ timeout: 5000 });
    await expect(newGearRow.locator('.new-badge')).toBeVisible({ timeout: 3000 });
  });

  await test.step('Click 儲存 → redirect to /detail/<uuid>', async () => {
    await page.locator('button', { hasText: '儲存' }).first().click();
    await page.waitForURL(/\/detail\/[0-9a-f-]+/, { timeout: 30000 });
    expect(page.url()).toMatch(/\/detail\/[0-9a-f-]+/);
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });

  // ════════════════════════════════════════════════════════════════════
  // Phase 7: Verify gear on detail page
  // ════════════════════════════════════════════════════════════════════

  await test.step('Click 裝備 tab → 大背包 visible in gear table', async () => {
    const gearTab = page.locator('button', { hasText: '裝備' });
    await gearTab.waitFor({ timeout: 8000 });
    await gearTab.click();
    await page.waitForTimeout(600);

    await expect(
      page.locator('table td', { hasText: '大背包' }).first()
    ).toBeVisible({ timeout: 8000 });
  });
});
