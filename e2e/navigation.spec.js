import { test, expect } from '@playwright/test';

test('the home page groups the lessons in parts', async ({ page }) => {
  await page.goto('/fr/');
  await expect(page.getByRole('heading', { level: 3, name: /Les bases/ })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: /Algorithmique/ })).toBeVisible();
  expect(await page.locator('.lesson-list a[data-lesson-link]').count()).toBeGreaterThanOrEqual(31);
});

test('a lesson shows where it is: breadcrumb, menu of its part, outline, related documentation', async ({ page }) => {
  await page.goto('/fr/cours/15-traits/');
  await expect(page.locator('.breadcrumb')).toContainText('Types et objets');
  await expect(page.locator('.toc a[aria-current="page"]')).toContainText('Les traits');
  await expect(page.locator('.toc details.toc-part[open] a[aria-current="page"]')).toHaveCount(1);
  await expect(page.locator('.related a')).toContainText(['Traits et surcharge d’opérateurs'].map((t) => t.replace('’', "'")));
  const outline = page.locator('.outline');
  if (await outline.isVisible()) await expect(outline.locator('a').first()).toBeVisible();
});

test('a lesson is marked read once its end was reached, and the home page offers to go on', async ({ page }) => {
  await page.goto('/fr/cours/01-premiers-pas/');
  await page.locator('nav.pager').scrollIntoViewIfNeeded();
  await expect(page.locator('.toc a[data-lesson-link="01-premiers-pas"]')).toHaveClass(/is-read/);
  await page.goto('/fr/');
  await expect(page.locator('[data-resume]')).toBeVisible();
  await expect(page.locator('[data-resume]')).toHaveAttribute('href', /01-premiers-pas/);
  await expect(page.locator('.part-progress').first()).toHaveText(/^1\/8$/);
});

test('the documentation page links back to the lessons', async ({ page }) => {
  await page.goto('/fr/docs/19-traits-et-surcharge-doperateurs/');
  await expect(page.locator('.related a').first()).toBeVisible();
  await expect(page.locator('.breadcrumb')).toContainText('Types et objets');
});

test('search finds pages in every section and opens one', async ({ page }) => {
  await page.goto('/fr/cours/01-premiers-pas/');
  await page.keyboard.press('/');
  const input = page.getByTestId('search-input');
  await expect(input).toBeFocused();
  await input.fill('fermetures');
  const results = page.getByTestId('search-results');
  await expect(results.locator('a').first()).toContainText('fermetures');
  await expect(page.locator('.search-filters .chip').first()).toHaveAttribute('aria-pressed', 'true');
  // the filter by section keeps the right pages
  await page.locator('.search-filters .chip', { hasText: /^Documentation/ }).click();
  for (const where of await results.locator('.where').allTextContents()) expect(where).toMatch(/^Documentation/);
  await page.locator('.search-filters .chip', { hasText: /^Tout/ }).click();
  await results.locator('a', { hasText: 'Fonctions avancées' }).first().click();
  await expect(page).toHaveURL(/\/fr\/cours\/19-fermetures\//);
});

test('search is in English on the English site, Escape closes it', async ({ page }) => {
  await page.goto('/en/');
  await page.getByTestId('search-open').click();
  await page.getByTestId('search-input').fill('closures');
  await expect(page.getByTestId('search-results').locator('a').first()).toBeVisible();
  for (const href of await page.getByTestId('search-results').locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')))) expect(href).toMatch(/^\/en\//);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog.search')).not.toBeVisible();
});

test('on a phone the menu folds behind a button', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone only');
  await page.goto('/fr/cours/15-traits/');
  const drawer = page.locator('details.drawer');
  await expect(drawer).not.toHaveAttribute('open', '');
  await drawer.locator(':scope > summary').click();
  await expect(drawer.locator('a[aria-current="page"]')).toBeVisible();
});
