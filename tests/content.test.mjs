// The lessons follow the rules, and French and Arabic stay in step.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contentProblems, languageFreeFacts, lessonProblems, loadLessons } from '../scripts/content.mjs';

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
