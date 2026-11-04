// What the app remembers on the phone (B15-B17, B42, B44): finished lessons
// and the chosen language, including when storage is broken or blocked.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { markDone, readDone, readLocale, saveLocale } from '../www/js/progress.js';

const DONE_KEY = 'de9de9-academy:done:v1';
const LOCALE_KEY = 'de9de9-academy:locale';

// A stand-in for the WebView's localStorage, and a way to set the phone's language.
class MemoryStorage {
  constructor() { this.items = new Map(); }
  getItem(key) { return this.items.has(key) ? this.items.get(key) : null; }
  setItem(key, value) { this.items.set(key, String(value)); }
}
const blockedStorage = {
  getItem() { throw new Error('blocked'); },
  setItem() { throw new Error('blocked'); },
};
const useStorage = (storage) => Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
const usePhoneLanguage = (language) => Object.defineProperty(globalThis, 'navigator', { value: { language }, configurable: true });

let storage;
beforeEach(() => {
  storage = new MemoryStorage();
  useStorage(storage);
  usePhoneLanguage('fr-FR');
});

test('nothing done on a fresh install', () => {
  assert.deepEqual([...readDone()], []);
});

test('a finished lesson is remembered, once', () => {
  markDone('plomberie/fuite-d-eau');
  markDone('plomberie/fuite-d-eau');
  assert.deepEqual([...readDone()], ['plomberie/fuite-d-eau']);
  assert.equal(storage.getItem(DONE_KEY), '["plomberie/fuite-d-eau"]');
});

test('finished lessons accumulate', () => {
  markDone('magie/la-carte-cle');
  markDone('plomberie/fuite-d-eau');
  assert.deepEqual([...readDone()].sort(), ['magie/la-carte-cle', 'plomberie/fuite-d-eau']);
});

test('corrupt or unexpected saved data reads as nothing done, not as a crash', () => {
  for (const saved of ['not json', '{"a":1}', '42', 'null', '[1, null, {}]']) {
    storage.setItem(DONE_KEY, saved);
    assert.deepEqual([...readDone()], [], saved);
  }
  storage.setItem(DONE_KEY, '["magie/la-carte-cle", 3, null]');
  assert.deepEqual([...readDone()], ['magie/la-carte-cle'], 'keeps the valid keys');
});

test('blocked storage: nothing done, and finishing a lesson does not throw', () => {
  useStorage(blockedStorage);
  assert.deepEqual([...readDone()], []);
  assert.doesNotThrow(() => markDone('magie/la-carte-cle'));
  assert.doesNotThrow(() => saveLocale('ar'));
});

test('first launch follows the phone language: Arabic phones get Arabic', () => {
  const cases = { ar: 'ar', 'ar-DZ': 'ar', 'AR-dz': 'ar', 'fr-FR': 'fr', 'en-US': 'fr', arn: 'fr', '': 'fr', undefined: 'fr' };
  for (const [language, expected] of Object.entries(cases)) {
    usePhoneLanguage(language === 'undefined' ? undefined : language);
    assert.equal(readLocale(), expected, `phone language ${language}`);
  }
});

test('a chosen language wins over the phone language, and survives a restart', () => {
  usePhoneLanguage('fr-FR');
  saveLocale('ar');
  assert.equal(storage.getItem(LOCALE_KEY), 'ar');
  assert.equal(readLocale(), 'ar');
  usePhoneLanguage('ar-DZ');
  saveLocale('fr');
  assert.equal(readLocale(), 'fr');
});

test('a saved value that is not a language is ignored', () => {
  storage.setItem(LOCALE_KEY, 'en');
  usePhoneLanguage('ar-DZ');
  assert.equal(readLocale(), 'ar');
});

test('blocked storage falls back to the phone language', () => {
  useStorage(blockedStorage);
  usePhoneLanguage('ar');
  assert.equal(readLocale(), 'ar');
});
