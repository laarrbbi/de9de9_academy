// The lessons follow the rules, and French and Arabic stay in step.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TRACKS } from '../www/js/tracks.js';
import { SHELVES } from '../www/js/shelves.js';
import { contentProblems, LESSONS_DIR, languageFreeFacts, lessonProblems, loadLessons, parseLesson } from '../scripts/content.mjs';

const lessons = loadLessons();

test('every lesson follows the rules and both languages match', () => {
  assert.ok(lessons.fr.length > 0, 'no lessons found');
  assert.deepEqual(contentProblems(lessons), []);
});

for (const fr of lessons.fr) {
  test(`${fr.key}: French and Arabic match`, () => {
    const ar = lessons.ar.find((l) => l.key === fr.key);
    assert.ok(ar, 'missing in Arabic');
    assert.deepEqual(languageFreeFacts(ar), languageFreeFacts(fr));
  });
}

// The rules themselves: a sound lesson passes, and each broken one is caught.
const sound = {
  title: 'T',
  summary: 'S',
  order: 1,
  minutes: 10,
  level: 'beginner',
  risk: 'high',
  safety: 'Cut the power first.',
  tools: [{ name: 'Tester', shelf: 'travaux-electricite' }],
  callAPro: ['The wires are burnt.'],
  quiz: [{ question: 'Q', options: ['A', 'B'], answer: 1, explanation: 'E' }],
};

test('a sound lesson has no problems', () => {
  assert.deepEqual(lessonProblems(sound), []);
});

const broken = {
  'a risky lesson without a safety rule': { safety: undefined },
  'a risky lesson without "call a pro"': { callAPro: [] },
  'a quiz answer out of range': { quiz: [{ question: 'Q', options: ['A', 'B'], answer: 2, explanation: 'E' }] },
  'an unknown shelf': { tools: [{ name: 'Tester', shelf: 'nowhere' }] },
  'a misspelt field': { callApro: ['x'] },
  'no tools': { tools: [] },
  'an unknown level': { level: 'expert' },
};

for (const [name, change] of Object.entries(broken)) {
  test(`catches ${name}`, () => {
    assert.notDeepEqual(lessonProblems({ ...sound, ...change }), []);
  });
}

test('a drift between languages is caught', () => {
  const drifted = structuredClone(lessons);
  drifted.ar[0].quiz[0].answer = (drifted.ar[0].quiz[0].answer + 1) % drifted.ar[0].quiz[0].options.length;
  assert.equal(contentProblems(drifted).length, 1);
});

test('every track shelf is a known shelf, or null for none', () => {
  for (const track of TRACKS) {
    assert.ok(track.shelf === null || track.shelf in SHELVES, `${track.id}: unknown shelf "${track.shelf}"`);
  }
});

// Phase 1 F15: what editors add on their own does not break a lesson.
test('frontmatter survives a byte-order mark, CRLF, trailing spaces and no final newline', () => {
  const lesson = '---\ntitle: T\n---\nBody\n';
  for (const text of ['\uFEFF' + lesson, lesson.replace(/\n/g, '\r\n'), lesson.replace(/---\n/g, '---  \n'), '---\ntitle: T\n---']) {
    assert.equal(parseLesson(text).data.title, 'T', JSON.stringify(text));
  }
});

test('a file without frontmatter gets a message that says so', () => {
  assert.throws(() => parseLesson('title: T\n'), /must start with a "---" line/);
  assert.throws(() => parseLesson('---\ntitle: T\n'), /never closed/);
});

// Phase 1 F7 and F15: stray files and missing folders, on a scratch copy.
test('hidden files such as .DS_Store are ignored, a missing language folder is named', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'academy-lessons-'));
  try {
    cpSync(LESSONS_DIR, scratch, { recursive: true });
    writeFileSync(join(scratch, 'fr', '.DS_Store'), '');
    writeFileSync(join(scratch, 'fr', 'magie', '.DS_Store'), '');
    const loaded = loadLessons(scratch);
    assert.equal(loaded.fr.length, lessons.fr.length);
    renameSync(join(scratch, 'ar'), join(scratch, 'ar-gone'));
    assert.throws(() => loadLessons(scratch), /content\/lessons\/ar\/ is missing/);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
