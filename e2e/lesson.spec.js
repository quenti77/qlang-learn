import { test, expect } from '@playwright/test';

const lesson = '/fr/cours/01-premiers-pas/';

// the n-th code block of the lesson
const block = (page, n) => {
  const w = page.locator('.qlang-widget').nth(n);
  return { code: w.getByTestId('code'), run: w.getByTestId('run'), reset: w.getByTestId('reset'), out: w.getByTestId('output'), stdin: w.getByTestId('stdin') };
};

test.beforeEach(async ({ page }) => {
  await page.goto(lesson);
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('the home page lists the lessons and leads to one', async ({ page }) => {
  await page.goto('/fr/');
  await page.getByRole('link', { name: 'Premiers pas' }).click();
  await expect(page).toHaveURL(lesson);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Premiers pas');
});

test('the root page picks the language of the browser', async ({ browser }) => {
  for (const [locale, path] of [['en-GB', '/en/'], ['fr-FR', '/fr/'], ['de-DE', '/fr/']]) {
    const context = await browser.newContext({ locale });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page).toHaveURL(path);
    await context.close();
  }
});

test('code blocks run in the browser', async ({ page }) => {
  const b = block(page, 0);
  await expect(b.code).toHaveValue(/Bonjour le monde/);
  await b.run.click();
  await expect(b.out).toHaveText('Bonjour le monde !\nJe m\'appelle qlang.\n');
});

test('the code can be edited, run again, and reset', async ({ page }) => {
  const b = block(page, 0);
  await b.code.fill('print(123 * 456)');
  await b.run.click();
  await expect(b.out).toHaveText('56088\n');
  await b.reset.click();
  await expect(b.code).toHaveValue(/Bonjour le monde/);
  await expect(b.out).toHaveText('');
});

test('Ctrl+Enter runs the code', async ({ page }) => {
  const b = block(page, 0);
  await b.code.fill('print("raccourci")');
  await b.code.press('Control+Enter');
  await expect(b.out).toHaveText('raccourci\n');
});

test('errors show their position and code', async ({ page }) => {
  const b = block(page, 3);
  await b.run.click();
  await expect(b.out).toContainText(/1:\d+ L\d+:/);
});

test('a type error is explained', async ({ page }) => {
  const b = block(page, 0);
  await b.code.fill('let x: int = "texte"');
  await b.run.click();
  await expect(b.out).toContainText('expected `int`, found `string`');
});

test('read() gets its lines from the input field', async ({ page }) => {
  const b = block(page, 4);
  await expect(b.stdin).toBeVisible();
  await b.stdin.fill('Ada');
  await b.run.click();
  await expect(b.out).toHaveText('Comment t\'appelles-tu ? Bonjour Ada !\n');
});

test('blocks without read() have no input field', async ({ page }) => {
  await expect(block(page, 0).stdin).toBeHidden();
});

test('an infinite loop is stopped by the step limit, and the page stays usable', async ({ page }) => {
  await page.addInitScript(() => (window.__QLANG = { maxSteps: 200_000 }));
  await page.reload();
  const b = block(page, 0);
  await b.code.fill('while true do end');
  await b.run.click();
  await expect(b.out).toContainText(/step/i);
  await b.code.fill('print("encore là")');
  await b.run.click();
  await expect(b.out).toHaveText('encore là\n');
});

test('a program that does not end is killed by the timeout, and the engine restarts', async ({ page }) => {
  await page.addInitScript(() => (window.__QLANG = { timeoutMs: 300, maxSteps: 4_000_000_000 }));
  await page.reload();
  const b = block(page, 0);
  await b.code.fill('while true do end');
  await b.run.click();
  await expect(b.out).toContainText('arrêté');
  await b.code.fill('print("relancé")');
  await b.run.click();
  await expect(b.out).toHaveText('relancé\n');
});

test('recursion works, and runaway recursion is a clear error, not a crash', async ({ page }) => {
  const b = block(page, 0);
  const program = (n) => `fun d(n: int) -> int\n  if n == 0 then return 0 end\n  1 + d(n - 1)\nend\nprint(d(${n}))`;
  await b.code.fill(program(200));
  await b.run.click();
  await expect(b.out).toHaveText('200\n');
  await b.code.fill(program(100000));
  await b.run.click();
  await expect(b.out).toContainText(/depth|nested|deep/i);
  await expect(b.out).not.toContainText('moteur');
});

test('qlang.wasm is served as WebAssembly', async ({ request }) => {
  const res = await request.get('/qlang.wasm');
  expect(res.ok()).toBe(true);
  expect(res.headers()['content-type']).toContain('application/wasm');
});

test('the language can be switched, on the lesson and on the home page', async ({ page }) => {
  await page.getByTestId('switch-language').click();
  await expect(page).toHaveURL('/en/cours/01-premiers-pas/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('First steps');
  const b = block(page, 0);
  await b.run.click();
  await expect(b.out).toHaveText('Hello world!\nMy name is qlang.\n');
  await expect(page.getByTestId('run').first()).toHaveText('Run');
  await page.getByTestId('switch-language').click();
  await expect(page).toHaveURL(lesson);
});

test('lesson pages have previous and next links that exist', async ({ page }) => {
  const links = await page.locator('nav.pager a').all();
  for (const l of links) {
    const href = await l.getAttribute('href');
    const res = await page.request.get(href);
    expect(res.ok(), href).toBe(true);
  }
});

test('a lesson can import files shown on the page', async ({ page }) => {
  await page.goto('/fr/cours/20-modules/');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByTestId('module-name')).toHaveText('lib/maths.q');
  const run = page.locator('.qlang-widget').nth(1);
  await run.getByTestId('run').click();
  await expect(run.getByTestId('output')).toContainText('[maths.q chargé]');
  await expect(run.getByTestId('output')).toContainText('5');
});

test('every lesson page runs its first example', async ({ page, request }) => {
  const home = await (await request.get('/fr/')).text();
  const links = [...home.matchAll(/href="(\/fr\/cours\/[^"]+)"/g)].map((m) => m[1]);
  expect(links.length).toBeGreaterThanOrEqual(28);
  for (const href of [...new Set(links)]) {
    await page.goto(href);
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    const first = page.locator('.qlang-widget:not(.module)').first();
    await first.getByTestId('run').click();
    await expect(first.getByTestId('output'), href).not.toBeEmpty();
  }
});
