// Screen addresses, the on-screen back arrow, and which lesson comes next.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lessonHref, nextLesson, parentHref, parseRoute, trackHref } from '../www/js/routes.js';

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
