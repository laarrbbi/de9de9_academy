// The app's screens in a phone-sized browser (Chromium, 390x844, touch).
// Run with `npm run test:e2e`, which builds the lessons first. Each test names
// the behaviors (B*) from reports/01-code-and-schema.md that it protects.
//
// This is the WebView's engine, not a phone: Android's back button, the
// status bar and the notch still need a check on real devices.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { serve } from './server.mjs';

const WWW = new URL('../../www/', import.meta.url).pathname;
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'fr-FR' };
// Taps in the first 300 ms of a new screen are ignored on purpose (the
// double-tap guard), so the tests wait that long before each tap.
const GUARD_MS = 320;

let server;
let browser;

before(async () => {
  assert.ok(existsSync(`${WWW}js/content.js`), 'www/js/content.js is missing: run `npm run build` first');
  server = await serve(WWW);
  // CHROMIUM_PATH: a Chromium already on the machine, when it is not the one
  // this Playwright version downloads (`npx playwright install chromium`).
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function open(path = '', options = {}) {
  const context = await browser.newContext({ ...PHONE, ...options.context });
  if (options.blockStorage) {
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
    });
  }
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  if (options.route) await options.route(page);
  if ('storeLive' in options) await page.route('**/js/config.js', serveConfig(options.storeLive));
  await page.goto(server.url + path);
  if (!options.noWait) await page.waitForSelector('#app > .screen');
  return { page, errors, close: () => context.close() };
}

// The store tests set the shop switch themselves (STORE_LIVE in config.js,
// false until the shop is online), so they test both states whatever its value.
const CONFIG = readFileSync(`${WWW}js/config.js`, 'utf8');
const SWITCH = /export const STORE_LIVE = (true|false);/;
assert.match(CONFIG, SWITCH);
const serveConfig = (live) => (route) =>
  route.fulfill({
    contentType: 'text/javascript; charset=utf-8',
    body: CONFIG.replace(SWITCH, `export const STORE_LIVE = ${live};`),
  });

const tap = async (page, selector) => {
  await page.waitForTimeout(GUARD_MS);
  await page.locator(selector).tap();
};
const atHash = (page, hash) => page.waitForFunction((h) => location.hash === h, hash);
const heading = async (page) => (await page.locator('h1').textContent()).trim();
const overflows = (page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
const stackSize = (page) => page.evaluate(() => history.state.trail.length);

async function answerQuiz(page, { wrongFirst = false } = {}) {
  const questions = page.locator('fieldset[data-answer]');
  const count = await questions.count();
  for (let i = 0; i < count; i += 1) {
    const question = questions.nth(i);
    const right = Number(await question.getAttribute('data-answer'));
    const options = await question.locator('input').count();
    const pick = wrongFirst && i === 0 ? (right + 1) % options : right;
    await question.locator(`input[value="${pick}"]`).check();
  }
  await page.locator('[data-quiz-submit]').tap();
}

test('B2, B17, B33, B53: a French phone opens on the French home screen, offline', async () => {
  const outside = [];
  const { page, errors, close } = await open('', {
    route: (p) => p.on('request', (request) => { if (!request.url().startsWith(server.url)) outside.push(request.url()); }),
  });
  assert.equal(await page.getAttribute('html', 'lang'), 'fr');
  assert.equal(await page.getAttribute('html', 'dir'), 'ltr');
  assert.equal(await page.locator('.track-row').count(), 4);
  assert.equal(await page.getAttribute('.resume', 'href'), '#/l/plomberie/deboucher-un-evier');
  assert.match(await page.locator('.resume small').textContent(), /^Commencer/);
  assert.equal(await overflows(page), false);
  assert.deepEqual(outside, [], 'fonts, icons and lessons all ship inside the app');
  assert.deepEqual(errors, []);
  await close();
});

test('B17, B37, B42, B9: an Arabic phone opens in Arabic; the choice of language is kept', async () => {
  const { page, errors, close } = await open('', { context: { locale: 'ar-DZ' } });
  assert.equal(await page.getAttribute('html', 'dir'), 'rtl');
  assert.equal(await heading(page), 'تعلّم الحركات الصحيحة.');
  assert.equal(await overflows(page), false);
  await tap(page, '[data-action="lang"]');
  assert.equal(await page.getAttribute('html', 'lang'), 'fr');
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.action), 'lang', 'focus stays on the button');
  await page.reload();
  await page.waitForSelector('#app > .screen');
  assert.equal(await page.getAttribute('html', 'lang'), 'fr', 'the choice survives a restart');
  assert.deepEqual(errors, []);
  await close();
});

test('B3, B4, B36, B40, B41, B33, B34: a reader finishes a lesson through its quiz', async () => {
  const { page, errors, close } = await open();
  await tap(page, '.track-row >> nth=0');
  await atHash(page, '#/t/plomberie');
  assert.equal(await page.locator('.lesson-row').count(), 3);
  await tap(page, '.lesson-row >> nth=0');
  await atHash(page, '#/l/plomberie/deboucher-un-evier');
  assert.equal(await page.isVisible('.safety.risk-medium'), true);
  assert.equal(await page.isVisible('[data-quiz-retry]'), false, 'no retry before answering');

  await page.locator('[data-quiz-submit]').tap();
  assert.match(await page.locator('[data-quiz-status]').textContent(), /Répondez à toutes les questions/);

  await answerQuiz(page, { wrongFirst: true });
  assert.match(await page.locator('[data-quiz-status]').textContent(), /^2 bonnes réponses sur 3$/);
  assert.equal(await page.locator('fieldset.is-wrong').count(), 1);
  assert.equal(await page.isVisible('.done-chip'), false, 'a wrong answer does not finish the lesson');

  await page.locator('[data-quiz-retry]').tap();
  await answerQuiz(page);
  assert.equal(await page.isVisible('[data-quiz-success]'), true);
  assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-quiz-success')), true);
  assert.equal(await page.isVisible('.done-chip'), true);

  await tap(page, '[data-quiz-success] a');
  await atHash(page, '#/l/plomberie/robinet-qui-goutte');
  assert.equal(await page.evaluate(() => window.scrollY), 0, 'a new screen starts at the top');
  await page.goBack();
  await page.goBack();
  await atHash(page, '#/t/plomberie');
  assert.match(await page.locator('.th-progress').textContent(), /1\/3/);
  assert.match(await page.locator('.btn-primary').first().textContent(), /Continuer/);
  await page.goBack();
  await atHash(page, '#/');
  assert.match(await page.locator('.pc-top strong').textContent(), /1 \/ 12/);
  assert.match(await page.locator('.resume strong').textContent(), /robinet/);
  assert.deepEqual(errors, []);
  await close();
});

test('B6, B7, B35, B43: after a track is finished, "Retour au parcours" goes back and one tap reaches home', async () => {
  const { page, close } = await open();
  await tap(page, '.track-row >> nth=3');
  await tap(page, '.lesson-row >> nth=0');
  await tap(page, '.pager-link.end');
  await tap(page, '.pager-link.end');
  await tap(page, '.pager-link.end'); // "Retour au parcours"
  await atHash(page, '#/t/magie');
  assert.equal(await stackSize(page), 2, 'home and the track, nothing stacked twice');
  await tap(page, '[data-action="back"]');
  await atHash(page, '#/');
  await close();
});

test('B6: a link to the previous lesson goes back instead of stacking it', async () => {
  const { page, close } = await open('#/t/plomberie');
  await tap(page, '.lesson-row >> nth=0');
  await tap(page, '.pager-link.end');
  await atHash(page, '#/l/plomberie/robinet-qui-goutte');
  await tap(page, '.pager-link >> nth=0');
  await atHash(page, '#/l/plomberie/deboucher-un-evier');
  assert.equal(await stackSize(page), 2);
  await close();
});

test('B6: a double tap moves one screen, not two', async () => {
  const { page, close } = await open();
  await page.waitForTimeout(GUARD_MS);
  const box = await page.locator('.track-row >> nth=0').boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.touchscreen.tap(x, y);
  await page.waitForTimeout(80);
  await page.touchscreen.tap(x, y);
  await page.waitForTimeout(GUARD_MS);
  assert.equal(await page.evaluate(() => location.hash), '#/t/plomberie');
  await close();
});

test('B8: going back restores the scroll position of the screen left', async () => {
  const { page, close } = await open('#/t/climatisation');
  // Scroll the row into view first: tapping it must not move the page again.
  await page.locator('.lesson-row >> nth=2').scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  assert.ok(before > 0, 'the track screen scrolled');
  await tap(page, '.lesson-row >> nth=2');
  await atHash(page, '#/l/climatisation/reglages-et-pannes');
  await page.goBack();
  await atHash(page, '#/t/climatisation');
  assert.equal(await page.evaluate(() => window.scrollY), before);
  await close();
});

test('B10, B7: opened straight onto a lesson, the back arrow walks up to home', async () => {
  const { page, close } = await open('#/l/climatisation/entretien-climatiseur');
  assert.equal(await heading(page), 'Entretenir son climatiseur soi-même');
  await tap(page, '[data-action="back"]');
  await atHash(page, '#/t/climatisation');
  await tap(page, '[data-action="back"]');
  await atHash(page, '#/');
  await close();
});

test('B5: an unknown address shows the home screen and becomes #/', async () => {
  for (const path of ['#/l/plomberie/nope', '#/t/cuisine', '#/l/nope/nothing']) {
    const { page, close } = await open(path);
    assert.equal(await page.locator('.home-head').count(), 1, path);
    assert.equal(await page.evaluate(() => location.hash), '#/', path);
    await close();
  }
});

const linksOut = (page) => page.$$eval('a[target="_blank"]', (links) => links.map((a) => a.href));

test('B19: while the shop is not online, the app links to it nowhere; "find a pro" still opens de9de9.dz', async () => {
  for (const path of ['', '#/t/plomberie', '#/l/electricite/remplacer-une-prise']) {
    const { page, errors, close } = await open(path, { storeLive: false });
    const lesson = path.startsWith('#/l/');
    // A lesson's one link out is "Trouver un professionnel" (SERVICES_URL).
    assert.deepEqual(await linksOut(page), lesson ? ['https://de9de9.dz/'] : [], path || 'home');
    if (lesson) assert.equal(await page.locator('.tools li').count(), 5, 'the tools are still listed');
    assert.deepEqual(errors, [], path || 'home');
    await close();
  }
});

test('B19, B27, B38, B49: once the shop is online, store links open outside the app, only where the shelf sells the tool', async () => {
  const { page, close } = await open('#/l/electricite/remplacer-une-prise', { storeLive: true });
  const tools = await page.$$eval('.tools li', (rows) =>
    rows.map((row) => ({ name: row.querySelector('span').textContent.trim(), link: row.querySelector('a') && { href: row.querySelector('a').href, target: row.querySelector('a').target } })),
  );
  assert.equal(tools.find((t) => t.name.includes('VAT')).link, null, 'the VAT has no store link (Phase 1 F1)');
  assert.ok(tools.filter((t) => t.link).length > 0, 'some tools link to the store');
  for (const tool of tools.filter((t) => t.link)) {
    assert.equal(tool.link.target, '_blank', tool.name);
    assert.match(tool.link.href, /^https:\/\/de9de9\.dz\/fr\/c\/[a-z-]+\?utm_source=academy-app&utm_medium=lesson&utm_campaign=electricite-remplacer-une-prise$/, tool.name);
  }
  await page.goto(`${server.url}#/t/magie`);
  await page.waitForSelector('.track-head');
  assert.equal(await page.locator('.track-head a[target="_blank"]').count(), 0, 'no shop button without a shelf (F8)');
  await page.goto(`${server.url}#/`);
  await page.waitForSelector('.home-head');
  assert.equal(await page.getAttribute('.promo', 'href'), 'https://de9de9.dz/fr?utm_source=academy-app&utm_medium=home');
  await close();

  const arabic = await open('#/t/plomberie', { context: { locale: 'ar-DZ' }, storeLive: true });
  const href = await arabic.page.getAttribute('.track-head a[target="_blank"]', 'href');
  assert.equal(decodeURIComponent(new URL(href).pathname), '/ar/c/أشغال-سباكة');
  assert.equal(new URL(href).searchParams.get('utm_medium'), 'track');
  await arabic.close();
});

test('B4: every lesson opens without errors or sideways scrolling, in both languages', async () => {
  for (const locale of ['fr-FR', 'ar-DZ']) {
    const { page, errors, close } = await open('', { context: { locale } });
    const lessons = await page.evaluate(async () => {
      const { LESSONS } = await import('./js/content.js');
      return LESSONS[document.documentElement.lang].map((l) => `#/l/${l.track}/${l.slug}`);
    });
    assert.equal(lessons.length, 12);
    for (const hash of lessons) {
      await page.goto(server.url + hash);
      await page.waitForSelector('.lesson h1');
      assert.equal(await overflows(page), false, `${locale} ${hash} scrolls sideways`);
    }
    assert.deepEqual(errors, [], locale);
    await close();
  }
});

test('B15, B16: with storage blocked, the quiz still works and nothing crashes', async () => {
  const { page, errors, close } = await open('#/l/magie/la-carte-cle', { blockStorage: true });
  await answerQuiz(page);
  assert.equal(await page.isVisible('[data-quiz-success]'), true);
  assert.deepEqual(errors, []);
  await close();
});

test('B53: if the lessons fail to load, a message replaces the blank screen', async () => {
  const { page, close } = await open('', {
    noWait: true,
    route: (p) => p.route('**/js/content.js', (route) => route.fulfill({ status: 404, body: '' })),
  });
  await page.waitForSelector('#app-error', { state: 'visible', timeout: 6000 });
  assert.match(await page.locator('#app-error').textContent(), /n’a pas pu s’afficher/);
  await close();
});

const seedDone = (keys) => (p) =>
  p.addInitScript((done) => localStorage.setItem('de9de9-academy:done:v1', JSON.stringify(done)), keys);

test('B44: a lesson finished in French counts in Arabic too', async () => {
  const { page, close } = await open('', { route: seedDone(['magie/la-carte-cle']) });
  assert.match(await page.locator('.pc-top strong').textContent(), /1 \/ 12/);
  await tap(page, '[data-action="lang"]');
  assert.equal(await page.getAttribute('html', 'lang'), 'ar');
  assert.match(await page.locator('.pc-top strong').textContent(), /1 \/ 12/);
  await close();
});

test('B33, B34: with every lesson done, home says so and tracks offer a review', async () => {
  const keys = await (async () => {
    const { LESSONS } = await import('../../www/js/content.js');
    return LESSONS.fr.map((l) => l.key);
  })();
  const { page, close } = await open('', { route: seedDone(keys) });
  assert.equal(await page.locator('.resume').count(), 0);
  assert.match(await page.locator('.all-done').textContent(), /Toutes les leçons sont terminées/);
  await tap(page, '.track-row >> nth=0');
  await atHash(page, '#/t/plomberie');
  assert.match(await page.locator('.track-head .btn-primary').textContent(), /Revoir le parcours/);
  assert.equal(await page.locator('.lesson-row.is-done').count(), 3);
  await close();
});
