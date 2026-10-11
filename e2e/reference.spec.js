import { test, expect } from '@playwright/test';
import { getCode } from './helpers.js';

test('the reference lists its chapters and opens one', async ({ page }) => {
  await page.goto('/fr/');
  await page.getByTestId('nav-reference').click();
  await expect(page).toHaveURL('/fr/reference/');
  const chapter = page.locator('.lesson-list a', { hasText: /^05\s*Opérateurs$/ });
  await expect(chapter).toBeVisible();
  await chapter.click();
  await expect(page).toHaveURL('/fr/reference/05-operateurs/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Opérateurs');
  await expect(page.locator('.toc a[aria-current="page"]')).toContainText('Opérateurs');
  await expect(page.getByTestId('nav-reference')).toHaveAttribute('aria-current', 'page');
});

test('examples of the reference are highlighted and cannot be run', async ({ page }) => {
  await page.goto('/fr/reference/05-operateurs/');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const first = page.locator('.reference-code').first();
  await expect(first.locator('.cm-editor')).toBeVisible();
  expect((await getCode(first)).length).toBeGreaterThan(5);
  await expect(first.getByTestId('run')).toHaveCount(0);
  const colors = await first.locator('.cm-line span').evaluateAll((els) => new Set(els.map((e) => getComputedStyle(e).color)).size);
  expect(colors).toBeGreaterThanOrEqual(2);
  // read-only: typing changes nothing
  const before = await getCode(first);
  await first.locator('.cm-content').click();
  await page.keyboard.type('zzz');
  expect(await getCode(first)).toBe(before);
});

test('every link inside the reference leads to an existing page and anchor', async ({ page, request }) => {
  await page.goto('/fr/reference/');
  const chapters = await page.locator('.lesson-list a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(chapters.length).toBe(18);
  const problems = [];
  for (const chapter of chapters) {
    await page.goto(chapter);
    const links = await page.locator('article a').evaluateAll((as) => as.map((a) => a.href));
    for (const href of links) {
      const url = new URL(href);
      if (url.origin !== new URL(page.url()).origin) continue; // external
      const res = await request.get(url.origin + url.pathname);
      if (!res.ok()) {
        problems.push(`${chapter}: ${href} -> ${res.status()}`);
        continue;
      }
      if (url.hash) {
        const html = await res.text();
        if (!html.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`)) problems.push(`${chapter}: ${href} -> no such anchor`);
      }
    }
  }
  expect(problems).toEqual([]);
});

test('the VS Code page is in both languages', async ({ page }) => {
  await page.goto('/fr/');
  await page.getByTestId('nav-tools').click();
  await expect(page).toHaveURL('/fr/outils/vscode/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Extension VS Code');
  await expect(page.getByText('install.sh | sh -s -- --vscode').first()).toBeVisible();
  await page.getByTestId('switch-language').click();
  await expect(page).toHaveURL('/en/outils/vscode/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('VS Code extension');
});

test('a reference chapter has no English counterpart yet: the switch goes to the list', async ({ page }) => {
  await page.goto('/fr/reference/05-operateurs/');
  await page.getByTestId('switch-language').click();
  await expect(page).toHaveURL('/en/reference/');
  await expect(page.getByText('not available in this language yet')).toBeVisible();
});
