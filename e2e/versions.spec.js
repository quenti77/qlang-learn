import { test, expect } from '@playwright/test';

// The site of the versions (e2e/fixtures/versions.json): 1.4 is the latest, 0.9 is archived.

test('the root and the addresses from before the versions lead to the latest version', async ({ page }) => {
  await page.goto('/fr/docs/');
  await expect(page).toHaveURL(/\/1\.4\/fr\/docs\/$/);
  await page.goto('/latest/en/');
  await expect(page).toHaveURL(/\/1\.4\/en\/$/);
  await page.goto('/fr/cours/28-projet-final/');
  await expect(page).toHaveURL(/\/1\.4\/fr\/cours\/34-projet-final\/$/);
  await page.goto('/');
  await expect(page).toHaveURL(/\/1\.4\/(fr|en)\/$/);
});

test('the selector lists the latest first and keeps the page when the other version has it', async ({ page }) => {
  await page.goto('/1.4/fr/docs/');
  const select = page.getByTestId('version-select');
  await expect(select.locator('option')).toHaveText(['1.4 (dernière)', '0.9']);
  await expect(select).toHaveValue('1.4');
  await expect(page.getByTestId('version-banner')).toBeHidden();
  await select.selectOption('0.9');
  await expect(page).toHaveURL(/\/0\.9\/fr\/docs\/$/);
  await expect(page.getByTestId('version-select')).toHaveValue('0.9');
});

test('an old version says so, and links to the same page in the latest one', async ({ page }) => {
  await page.goto('/0.9/fr/docs/');
  const banner = page.getByTestId('version-banner');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('qlang 0.9');
  await expect(banner).toContainText("n'est plus maintenue");
  await expect(banner.getByRole('link')).toHaveAttribute('href', '/1.4/fr/docs/');
});

test('in an old version, the lessons and the exercises are those of the latest one', async ({ page }) => {
  await page.goto('/0.9/fr/docs/');
  await expect(page.getByTestId('version-banner')).toBeVisible();
  await expect(page.getByTestId('nav-lessons')).toHaveAttribute('href', '/1.4/fr/');
  await expect(page.getByTestId('nav-exercises')).toHaveAttribute('href', '/1.4/fr/exercices/');
  await expect(page.getByTestId('nav-docs')).toHaveAttribute('href', '/0.9/fr/docs/');
});

test('the pages carry a canonical link only when the site address is known', async ({ page }) => {
  // the tests build without SITE_ORIGIN: no canonical link, and nothing breaks
  await page.goto('/0.9/fr/docs/');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test('a page missing in the other version leads to its home page, with a message', async ({ page }) => {
  // a page that only exists in 0.9: the fixture has none, so remove it from the latest one by asking for a made-up address
  await page.goto('/0.9/fr/docs/');
  await page.route('**/1.4/fr/docs/', (route) => route.fulfill({ status: 404, body: 'not found' }));
  await page.getByTestId('version-select').selectOption('1.4');
  await expect(page).toHaveURL(/\/1\.4\/fr\/\?missing=0\.9$/);
  await expect(page.getByTestId('version-banner')).toContainText("n'existe pas en 1.4");
});

test('the selector works with the keyboard and has a name', async ({ page }) => {
  await page.goto('/1.4/en/');
  const select = page.getByRole('combobox', { name: 'Documentation version' });
  await select.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page).toHaveURL(/\/0\.9\/en\/$/);
});

test('the search of a version finds pages of that version only', async ({ page }) => {
  await page.goto('/0.9/fr/');
  await page.getByTestId('search-open').click();
  await page.getByTestId('search-input').fill('trait');
  const first = page.getByTestId('search-results').locator('a').first();
  await expect(first).toBeVisible();
  expect(await first.getAttribute('href')).toContain('/0.9/');
});

test('an address that does not exist shows the 404 page', async ({ page }) => {
  const response = await page.goto('/1.4/fr/nope/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('404');
});
