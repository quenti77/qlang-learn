import { test, expect } from '@playwright/test';
import { getCode } from './helpers.js';

test('the documentation lists its pages by group and opens one', async ({ page }) => {
  await page.goto('/fr/');
  await page.getByTestId('nav-docs').click();
  await expect(page).toHaveURL('/fr/docs/');
  await expect(page.getByRole('heading', { level: 2, name: 'Démarrer' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Les fondamentaux' })).toBeVisible();
  const chapter = page.locator('.lesson-list a', { hasText: /^Opérateurs$/ });
  await expect(chapter).toBeVisible();
  await chapter.click();
  await expect(page).toHaveURL('/fr/docs/14-operateurs/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Opérateurs');
  await expect(page.locator('.toc a[aria-current="page"]')).toContainText('Opérateurs');
  await expect(page.getByTestId('nav-docs')).toHaveAttribute('aria-current', 'page');
});

test('examples of the reference are highlighted and cannot be run', async ({ page }) => {
  await page.goto('/fr/docs/14-operateurs/');
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

test('every link inside the documentation leads to an existing page and anchor', async ({ page, request }) => {
  await page.goto('/fr/docs/');
  const chapters = await page.locator('.lesson-list a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(chapters.length).toBeGreaterThanOrEqual(24);
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

test('the VS Code page is part of the documentation, in both languages', async ({ page }) => {
  await page.goto('/fr/docs/');
  await page.getByRole('link', { name: 'Extension VS Code' }).click();
  await expect(page).toHaveURL('/fr/docs/30-vscode/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Extension VS Code');
  await expect(page.getByText('install.sh | sh -s -- --vscode').first()).toBeVisible();
  await page.getByTestId('switch-language').click();
  await expect(page).toHaveURL('/en/docs/30-vscode/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('VS Code extension');
});

test('the documentation exists in English, and the switch keeps the page', async ({ page }) => {
  await page.goto('/fr/docs/14-operateurs/');
  await page.getByTestId('switch-language').click();
  await expect(page).toHaveURL('/en/docs/14-operators/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Operators');
  await expect(page.locator('.toc a', { hasText: 'VS Code extension' })).toBeAttached();
  await page.getByTestId('switch-language').click();
  await expect(page).toHaveURL('/fr/docs/14-operateurs/');
});

test('the English documentation links between its pages', async ({ page }) => {
  await page.goto('/en/docs/12-values-and-types/');
  await page.getByRole('link', { name: 'section 14' }).click();
  await expect(page).toHaveURL(/\/en\/docs\/23-standard-library\/#dictionaries$/);
});

test('installation and usage pages come from the README, with working links', async ({ page }) => {
  await page.goto('/fr/docs/01-installation/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Installation');
  await expect(page.getByText('install.sh | sh').first()).toBeVisible();
  await page.goto('/fr/docs/31-protocole-json/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Protocole JSON');
  await expect(page.locator('.toc a[aria-current="page"]')).toHaveText('Protocole JSON');
});
