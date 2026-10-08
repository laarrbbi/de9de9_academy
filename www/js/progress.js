// What the reader has done, kept on the phone. Storage can be missing or
// blocked; the app still works, it just forgets.
//
// Finished lessons are "<track>/<lesson>" keys, the same in both languages.
const DONE_KEY = 'de9de9-academy:done:v1';
const LOCALE_KEY = 'de9de9-academy:locale';

export function readDone() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((k) => typeof k === 'string') : []);
  } catch {
    return new Set();
  }
}

export function markDone(key) {
  const done = readDone();
  done.add(key);
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify([...done]));
  } catch {}
}

// The reader's choice, else the phone's language: Arabic phones get Arabic.
export function readLocale() {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (saved === 'fr' || saved === 'ar') return saved;
  } catch {}
  return /^ar\b/i.test(navigator.language || '') ? 'ar' : 'fr';
}

export function saveLocale(locale) {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {}
}
