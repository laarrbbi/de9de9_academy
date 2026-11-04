// Screen addresses, the on-screen back arrow, and which lesson comes next.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lessonHref, navigation, nextLesson, parentHref, parseRoute, trackHref } from '../www/js/routes.js';

test('reads every screen address', () => {
  assert.deepEqual(parseRoute(''), { name: 'home' });
  assert.deepEqual(parseRoute('#/'), { name: 'home' });
  assert.deepEqual(parseRoute('#/t/plomberie'), { name: 'track', track: 'plomberie' });
  assert.deepEqual(parseRoute('#/l/plomberie/fuite-d-eau'), { name: 'lesson', track: 'plomberie', lesson: 'fuite-d-eau' });
});

test('anything else is the home screen', () => {
  for (const hash of ['#/t', '#/l/plomberie', '#/x/y', '#/t/a/b/c', '#garbage']) {
    assert.deepEqual(parseRoute(hash), { name: 'home' }, hash);
  }
});

test('addresses round-trip', () => {
  const lesson = { track: 'magie', slug: 'la-carte-cle' };
  assert.deepEqual(parseRoute(lessonHref(lesson)), { name: 'lesson', track: 'magie', lesson: 'la-carte-cle' });
  assert.deepEqual(parseRoute(trackHref('magie')), { name: 'track', track: 'magie' });
});

test('the back arrow goes up one level when there is no history', () => {
  assert.equal(parentHref(parseRoute('#/l/magie/la-carte-cle')), '#/t/magie');
  assert.equal(parentHref(parseRoute('#/t/magie')), '#/');
});

test('the next lesson is the first one not done', () => {
  const lessons = ['a/1', 'a/2', 'b/1'].map((key) => ({ key }));
  assert.equal(nextLesson(lessons, new Set()).key, 'a/1');
  assert.equal(nextLesson(lessons, new Set(['a/1'])).key, 'a/2');
  assert.equal(nextLesson(lessons, new Set(['a/2'])).key, 'a/1');
  assert.equal(nextLesson(lessons, new Set(['a/1', 'a/2', 'b/1'])), undefined);
});

// Phase 1 F4: a link to a screen already behind this one goes back to it.
test('a link to a screen on the stack goes back to it', () => {
  const trail = ['#/', '#/t/magie', '#/l/magie/la-carte-cle', '#/l/magie/tour-des-21-cartes'];
  assert.deepEqual(navigation(trail, '#/t/magie'), { back: 2 }); // "Retour au parcours"
  assert.deepEqual(navigation(trail, '#/l/magie/la-carte-cle'), { back: 1 }); // "Leçon précédente"
  assert.deepEqual(navigation(trail, '#/'), { back: 3 });
});

test('a link to a new screen goes forward', () => {
  assert.deepEqual(navigation(['#/', '#/t/magie'], '#/l/magie/la-carte-cle'), {
    push: ['#/', '#/t/magie', '#/l/magie/la-carte-cle'],
  });
});

test('a link to the current screen does nothing', () => {
  assert.deepEqual(navigation(['#/', '#/t/magie'], '#/t/magie'), { back: 0 });
});
