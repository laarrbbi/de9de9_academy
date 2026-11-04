// Interface text (B14) and the links into the store (B19, B20, B38, B39).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dir, STRINGS, t } from '../www/js/i18n.js';
import { SHELVES, shelfUrl, storeUrl } from '../www/js/shelves.js';
import { STORE_URL } from '../www/js/config.js';

test('both languages have exactly the same interface keys, none empty', () => {
  assert.deepEqual(Object.keys(STRINGS.ar).sort(), Object.keys(STRINGS.fr).sort());
  for (const locale of ['fr', 'ar']) {
    for (const [key, text] of Object.entries(STRINGS[locale])) assert.ok(text.trim(), `${locale} ${key} is empty`);
  }
});

test('every interface key the screens use exists', () => {
  const main = readFileSync(new URL('../www/js/main.js', import.meta.url), 'utf8');
  const literal = [...main.matchAll(/['`]((?:app|nav|home|track|lesson|quiz)\.[a-zA-Z.]+)['`]/g)].map((m) => m[1]);
  const templated = ['beginner', 'intermediate'].map((l) => `lesson.level.${l}`).concat(['low', 'medium', 'high'].map((r) => `lesson.risk.${r}`));
  assert.ok(literal.length > 30, 'found the keys in main.js');
  for (const key of [...literal, ...templated]) assert.ok(key in STRINGS.fr, `missing key ${key}`);
});

test('t() falls back to French, then to the key; dir() is rtl for Arabic only', () => {
  assert.equal(t('ar', 'nav.back'), 'رجوع');
  assert.equal(t('fr', 'nav.back'), 'Retour');
  assert.equal(t('ar', 'no.such.key'), 'no.such.key');
  assert.equal(dir('ar'), 'rtl');
  assert.equal(dir('fr'), 'ltr');
});

test('a shelf link uses the slug of the reader\'s language, percent-encoded', () => {
  const fr = new URL(shelfUrl('travaux-plomberie', 'fr', 'plomberie-fuite-d-eau'));
  assert.equal(fr.origin + fr.pathname, `${STORE_URL}/fr/c/travaux-plomberie`);
  const ar = new URL(shelfUrl('travaux-plomberie', 'ar', 'plomberie-fuite-d-eau'));
  assert.equal(ar.pathname, `/ar/c/${encodeURIComponent('أشغال-سباكة')}`);
  assert.equal(decodeURIComponent(ar.pathname), '/ar/c/أشغال-سباكة');
});

test('shelf links are tagged: source, where the link was, and which lesson', () => {
  const lesson = new URL(shelfUrl('travaux-electricite', 'fr', 'electricite-remplacer-une-prise')).searchParams;
  assert.equal(lesson.get('utm_source'), 'academy-app');
  assert.equal(lesson.get('utm_medium'), 'lesson');
  assert.equal(lesson.get('utm_campaign'), 'electricite-remplacer-une-prise');
  const track = new URL(shelfUrl('travaux-electricite', 'ar', 'electricite', 'track')).searchParams;
  assert.equal(track.get('utm_medium'), 'track');
});

test('the store home link is tagged with where it was', () => {
  const url = new URL(storeUrl('ar', 'home'));
  assert.equal(url.pathname, '/ar');
  assert.equal(url.searchParams.get('utm_medium'), 'home');
});

test('every shelf has a French and an Arabic slug and name', () => {
  for (const [key, shelf] of Object.entries(SHELVES)) {
    assert.match(shelf.slug.fr, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${key} fr slug`);
    assert.match(shelf.slug.ar, /^[\p{Script=Arabic}0-9]+(-[\p{Script=Arabic}0-9]+)*$/u, `${key} ar slug`);
    assert.ok(shelf.name.fr && shelf.name.ar, `${key} names`);
  }
});

// B47: every track has its icon; B54: the mobile platform rules hold.
test('every track has an icon', async () => {
  const { existsSync } = await import('node:fs');
  const { TRACKS } = await import('../www/js/tracks.js');
  for (const track of TRACKS) {
    assert.ok(existsSync(new URL(`../www/assets/icons/${track.id}.svg`, import.meta.url)), `${track.id}.svg`);
  }
});

test('zoom is never locked, and every :hover waits for a real pointer', () => {
  const html = readFileSync(new URL('../www/index.html', import.meta.url), 'utf8');
  const viewport = html.match(/<meta name="viewport" content="([^"]+)"/)[1];
  assert.doesNotMatch(viewport, /maximum-scale|user-scalable/);
  assert.match(viewport, /viewport-fit=cover/, 'needed for the safe-area insets');
  const css = readFileSync(new URL('../www/css/style.css', import.meta.url), 'utf8');
  const gated = css.match(/@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\n\}/g) ?? [];
  const outside = gated.reduce((rest, block) => rest.replace(block, ''), css);
  assert.ok(gated.length > 0);
  assert.doesNotMatch(outside, /:hover/);
});
