import { test, expect } from '@playwright/test';
import { getCode, setCode } from './helpers.js';

const series = '/fr/exercices/01-bases/';
const exercise = (page, n) => {
  const w = page.getByTestId('exercise').nth(n - 1);
  return { w, code: w.getByTestId('code'), check: w.getByTestId('run'), out: w.getByTestId('output'), status: w.getByTestId('status'), solution: w.getByTestId('solution'), toggle: w.getByTestId('solution-toggle'), reset: w.getByTestId('reset') };
};

test.beforeEach(async ({ page }) => {
  await page.goto(series);
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('the series page shows its exercises with a starter code and the tests', async ({ page }) => {
  await expect(page.getByTestId('exercise')).toHaveCount(6);
  const e = exercise(page, 1);
  expect(await getCode(e.code)).toMatch(/fun carre\(n: int\) -> int/);
  await expect(e.status).toHaveText('À faire');
  await e.w.locator('details.tests summary').click();
  await expect(e.w.getByTestId('tests')).toContainText('assert(carre(4) == 16');
});

test('starter code fails a test, with the test that failed', async ({ page }) => {
  const e = exercise(page, 1);
  await e.check.click();
  await expect(e.out).toContainText('Test échoué');
  await expect(e.out).toContainText('assert(carre(4) == 16');
  await expect(e.status).toHaveText('À faire');
});

test('a correct solution passes, and the progress is kept', async ({ page }) => {
  const e = exercise(page, 1);
  await setCode(e.code, 'fun carre(n: int) -> int\n  n * n\nend');
  await e.check.click();
  await expect(e.out).toContainText('exercice 1 OK');
  await expect(e.out).toContainText('tous les tests passent');
  await expect(e.status).toHaveText('Réussi ✓');
  // after a reload it is still done, and the list shows 1/6
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect(exercise(page, 1).status).toHaveText('Réussi ✓');
  await expect(exercise(page, 2).status).toHaveText('À faire');
  await page.goto('/fr/exercices/');
  await expect(page.locator('[data-progress-series="01-bases"]')).toHaveText('1/6');
});

test('errors in the student code are shown at their own line', async ({ page }) => {
  const e = exercise(page, 1);
  await setCode(e.code, 'fun carre(n: int) -> int\n  n * "x"\nend');
  await e.check.click();
  await expect(e.out).toContainText(/2:\d+ T\d+/);
});

test('the solution can be shown and hidden', async ({ page }) => {
  const e = exercise(page, 1);
  await expect(e.solution).toBeHidden();
  await e.toggle.click();
  await expect(e.solution).toBeVisible();
  expect(await getCode(e.solution.getByTestId('solution-code'))).toMatch(/n \* n/);
  await e.toggle.click();
  await expect(e.solution).toBeHidden();
});

test('reset brings the starter code back', async ({ page }) => {
  const e = exercise(page, 2);
  await setCode(e.code, 'nothing');
  await e.reset.click();
  expect(await getCode(e.code)).toMatch(/est_pair/);
});

test('the progress can be erased', async ({ page }) => {
  const e = exercise(page, 1);
  await setCode(e.code, 'fun carre(n: int) -> int\n  n * n\nend');
  await e.check.click();
  await expect(e.status).toHaveText('Réussi ✓');
  await page.goto('/fr/exercices/');
  page.once('dialog', (d) => d.accept());
  await page.getByTestId('reset-progress').click();
  await expect(page.locator('[data-progress-series="01-bases"]')).toHaveText('0/6');
});

test('the exercises are reachable from the menu, in both languages', async ({ page }) => {
  await page.getByTestId('nav-lessons').click();
  await expect(page).toHaveURL('/fr/');
  await page.getByTestId('nav-exercises').click();
  await expect(page).toHaveURL('/fr/exercices/');
  await page.getByTestId('switch-language').click();
  await expect(page).toHaveURL('/en/exercices/');
  await expect(page.getByRole('link', { name: 'Variables, conditions, loops, functions' })).toBeVisible();
});

for (const lang of ['fr', 'en']) test(`every ${lang} exercise has a solution that passes its own tests`, async ({ page }) => {
  for (const s of ['01-bases', '02-tableaux-chaines', '03-structs-traits', '04-algorithmes', '05-tuples-ensembles-result']) {
    await page.goto(`/${lang}/exercices/${s}/`);
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    const count = await page.getByTestId('exercise').count();
    for (let i = 0; i < count; i++) {
      const w = page.getByTestId('exercise').nth(i);
      await w.getByTestId('solution-toggle').click();
      const solution = await getCode(w.getByTestId('solution-code'));
      await setCode(w.getByTestId('code'), solution);
      await w.getByTestId('run').click();
      await expect(w.getByTestId('status'), `${s} #${i + 1}`).toHaveText(lang === 'fr' ? 'Réussi ✓' : 'Done ✓');
    }
  }
});

test('hints are revealed one at a time', async ({ page }) => {
  await page.goto(series);
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const e = page.getByTestId('exercise').first();
  await expect(e.getByTestId('hints')).toBeHidden();
  await expect(e.getByTestId('hint')).toHaveText('Indice (1/2)');
  await e.getByTestId('hint').click();
  await expect(e.getByTestId('hints')).toContainText('multiplié par lui-même');
  await expect(e.getByTestId('hint')).toHaveText('Indice (2/2)');
  await e.getByTestId('hint').click();
  await expect(e.getByTestId('hints').locator('p')).toHaveCount(2);
  await expect(e.getByTestId('hint')).toBeHidden();
  // the hints are not part of the page as plain code blocks
  await expect(page.locator('pre code.language-qlang-hint')).toHaveCount(0);
});

test('every exercise has hints, in both languages', async ({ page }) => {
  for (const lang of ['fr', 'en']) {
    for (const s of ['01-bases', '02-tableaux-chaines', '03-structs-traits', '04-algorithmes', '05-tuples-ensembles-result']) {
      await page.goto(`/${lang}/exercices/${s}/`);
      await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
      const count = await page.getByTestId('exercise').count();
      await expect(page.getByTestId('hint'), `${lang}/${s}`).toHaveCount(count);
    }
  }
});
