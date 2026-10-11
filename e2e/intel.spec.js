import { test, expect } from '@playwright/test';
import { setCode } from './helpers.js';

// Completion and hover tooltips in the editable editors, computed by the compiler (wasm).
test.beforeEach(async ({ page }) => {
  await page.goto('/fr/cours/01-premiers-pas/');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('typing a dot offers the methods of the value', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the emulated keyboard cannot type into CodeMirror');
  const w = page.locator('.qlang-widget').first();
  await setCode(w.getByTestId('code'), 'let xs = [1, 2]\nxs');
  await w.locator('.cm-content').click();
  await page.keyboard.press('Control+End');
  await page.keyboard.type('.pu');
  const list = page.locator('.cm-tooltip-autocomplete');
  await expect(list).toContainText('push');
  await expect(list).toContainText('value: int');
  // CodeMirror lets Enter through for a moment after the list opens (so that typing is not hijacked)
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await expect(w.locator('.cm-content')).toContainText('xs.push');
});

test('names in scope are offered while typing', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the emulated keyboard cannot type into CodeMirror');
  const w = page.locator('.qlang-widget').first();
  await setCode(w.getByTestId('code'), 'let counter = 1\nprint(1)');
  await w.locator('.cm-content').click();
  await page.keyboard.press('Control+End');
  await page.keyboard.type('\ncoun');
  await expect(page.locator('.cm-tooltip-autocomplete')).toContainText('counter');
});

test('hovering a name shows its type', async ({ page, isMobile }) => {
  test.skip(isMobile, 'there is no hover on a touch screen');
  const w = page.locator('.qlang-widget').first();
  await setCode(w.getByTestId('code'), 'let total = 40 + 2\nprint(total)');
  const target = w.locator('.cm-line').nth(1);
  const box = await target.boundingBox();
  // "print(total)": the word `total` starts after 6 characters
  const char = (await w.locator('.cm-content').evaluate((el) => parseFloat(getComputedStyle(el).fontSize))) * 0.6;
  await page.mouse.move(box.x + 16 + char * 8, box.y + box.height / 2);
  await expect(page.locator('.cm-tooltip')).toContainText('total: int', { timeout: 10000 });
});
