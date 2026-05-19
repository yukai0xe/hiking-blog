import { test, expect } from '@playwright/test';

const BASE  = 'http://localhost:5173';
const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

test('Edit page — add 大背包 gear on step 5, save, verify on detail', async ({ page }) => {

  // ── Step 1: Home → Test1 card → detail → 編輯 → /edit/<uuid> ──
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });

  await page.locator('.card-wrap').filter({ hasText: 'Test1' }).first().click();
  await page.waitForURL(/\/detail\/[0-9a-f-]+/, { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  await page.locator('a', { hasText: '編輯' }).first().click();
  await page.waitForURL(/\/edit\/[0-9a-f-]+/, { timeout: 15000 });
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // ── Step 2: Click progress step "裝備" (step 5) ───────────────
  await page.locator('span.font-body', { hasText: '裝備' }).first().click();
  await page.waitForTimeout(400);

  await expect(page.locator('h2', { hasText: '新增裝備' })).toBeVisible({ timeout: 5000 });
  await expect(page.locator('p.label-title', { hasText: '現有裝備' })).toBeVisible({ timeout: 5000 });

  // ── Step 3: Fill in gear form ─────────────────────────────────

  // 裝備名稱 *
  const nameInput = page.locator('input[placeholder="裝備名稱 *"]');
  await nameInput.waitFor({ timeout: 5000 });
  await nameInput.fill('大背包');

  // 種類 (category select — only one select visible on step 5)
  await page.locator('select.input-field.font-body').selectOption('背負系統');

  // 品牌名稱
  await page.locator('input[placeholder="品牌名稱"]').fill('OSPREY');

  // 價格 — find via label
  await page.locator('label.field-label', { hasText: '價格' })
    .locator('xpath=..').locator('input').fill('12000');

  // 加入時間 — today's date
  await page.locator('label.field-label', { hasText: '加入時間' })
    .locator('xpath=..').locator('input').fill(TODAY);

  // 重量 (g)
  await page.locator('label.field-label', { hasText: '重量' })
    .locator('xpath=..').locator('input').fill('2200');

  // 數量
  await page.locator('label.field-label', { hasText: '數量' })
    .locator('xpath=..').locator('input').fill('1');

  // 備註
  await page.locator('input[placeholder="選填"]').fill('包覆性強');

  // 參考連結
  await page.locator('input[type="url"]').fill('https://www.tpshanshui.com.tw/');

  // ── Click 加入清單 → verify NEW row in right panel ────────────
  await page.locator('button', { hasText: '加入清單' }).click();
  await page.waitForTimeout(300);

  const newGearRow = page.locator('tr').filter({ hasText: '大背包' });
  await expect(newGearRow).toBeVisible({ timeout: 5000 });
  await expect(newGearRow.locator('.new-badge')).toBeVisible({ timeout: 3000 });

  // ── Step 4: 儲存 → redirect to /detail/<uuid> ─────────────────
  await page.locator('button', { hasText: '儲存' }).first().click();
  await page.waitForURL(/\/detail\/[0-9a-f-]+/, { timeout: 30000 });
  expect(page.url()).toMatch(/\/detail\/[0-9a-f-]+/);
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // ── Step 5: Click 裝備 tab → verify 大背包 in gear list ───────
  const gearTab = page.locator('button', { hasText: '裝備' });
  await gearTab.waitFor({ timeout: 8000 });
  await gearTab.click();
  await page.waitForTimeout(600);

  await expect(
    page.locator('table td', { hasText: '大背包' }).first()
  ).toBeVisible({ timeout: 8000 });
});
