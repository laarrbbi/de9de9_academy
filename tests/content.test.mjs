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

// Each broken lesson must be caught by the rule it breaks: the message is
// checked, so a test cannot pass on an unrelated problem.
const broken = {
  'a risky lesson without a safety rule': [{ safety: undefined }, /needs a "safety" rule/],
  'a risky lesson with a blank safety rule': [{ safety: '  ' }, /"safety" must be text/],
  'a risky lesson without "call a pro"': [{ callAPro: [] }, /needs a "callAPro" list/],
  'a "call a pro" that is not a list of sentences': [{ callAPro: 'call' }, /"callAPro" must be a list/],
  'a quiz answer out of range': [{ quiz: [{ question: 'Q', options: ['A', 'B'], answer: 2, explanation: 'E' }] }, /"answer" is the index/],
  'a negative quiz answer': [{ quiz: [{ question: 'Q', options: ['A', 'B'], answer: -1, explanation: 'E' }] }, /"answer" is the index/],
  'a quiz with no questions': [{ quiz: [] }, /1 to 5 questions/],
  'a quiz with six questions': [{ quiz: Array(6).fill(sound.quiz[0]) }, /1 to 5 questions/],
  'a question with one option': [{ quiz: [{ question: 'Q', options: ['A'], answer: 0, explanation: 'E' }] }, /2 to 4 "options"/],
  'a question with five options': [{ quiz: [{ question: 'Q', options: ['A', 'B', 'C', 'D', 'E'], answer: 0, explanation: 'E' }] }, /2 to 4 "options"/],
  'a question without an explanation': [{ quiz: [{ question: 'Q', options: ['A', 'B'], answer: 0 }] }, /needs an "explanation"/],
  'an unknown shelf': [{ tools: [{ name: 'Tester', shelf: 'nowhere' }] }, /unknown shelf "nowhere"/],
  'a tool without a name': [{ tools: [{ shelf: 'travaux-electricite' }] }, /tool 1 needs a "name"/],
  'no tools': [{ tools: [] }, /at least one tool/],
  'a misspelt field': [{ callApro: ['x'] }, /unknown field "callApro"/],
  'an unknown level': [{ level: 'expert' }, /"level" must be one of/],
  'an unknown risk': [{ risk: 'extreme' }, /"risk" must be one of/],
  'a blank title': [{ title: ' ' }, /"title" is required/],
  'minutes that are not a whole number': [{ minutes: 7.5 }, /"minutes" must be a whole number/],
  'an order of zero': [{ order: 0 }, /"order" must be a whole number/],
};

for (const [name, [change, message]] of Object.entries(broken)) {
  test(`catches ${name}`, () => {
    const problems = lessonProblems({ ...sound, ...change });
    assert.ok(problems.some((p) => message.test(p)), `expected ${message} in ${JSON.stringify(problems)}`);
  });
}

test('a low-risk lesson needs neither a safety rule nor "call a pro"', () => {
  assert.deepEqual(lessonProblems({ ...sound, risk: 'low', safety: undefined, callAPro: [] }), []);
});

// Every fact the two languages must share, changed in the Arabic copy only,
// must be reported against that lesson.
const drifts = {
  'order': (l) => { l.order += 10; },
  'minutes': (l) => { l.minutes += 1; },
  'level': (l) => { l.level = l.level === 'beginner' ? 'intermediate' : 'beginner'; },
  'risk': (l) => { l.risk = l.risk === 'low' ? 'medium' : 'low'; },
  'safety rule present or not': (l) => { l.safety = l.safety ? null : 'Coupez le courant.'; },
  'a tool\'s shelf': (l) => { l.tools[0].shelf = l.tools[0].shelf ? null : 'travaux-plomberie'; },
  'the number of tools': (l) => { l.tools.push({ name: 'x', shelf: null }); },
  'the number of "call a pro" signs': (l) => { l.callAPro = [...l.callAPro, 'x']; },
  'the number of quiz options': (l) => { l.quiz[0].options = [...l.quiz[0].options, 'x']; },
  'a quiz answer': (l) => { l.quiz[0].answer = (l.quiz[0].answer + 1) % l.quiz[0].options.length; },
  'the number of sections': (l) => { l.structure.sections += 1; },
  'the number of tips': (l) => { l.structure.tips += 1; },
  'the number of tables': (l) => { l.structure.tables += 1; },
};

for (const [what, change] of Object.entries(drifts)) {
  test(`a drift in ${what} is caught`, () => {
    const drifted = structuredClone(lessons);
    const lesson = drifted.ar[0];
    change(lesson);
    const problems = contentProblems(drifted);
    assert.ok(problems.some((p) => p.startsWith(`${lesson.key}: fr and ar differ`)), JSON.stringify(problems));
  });
}

test('a lesson missing from either language is caught', () => {
  const noArabic = structuredClone(lessons);
  const [gone] = noArabic.ar.splice(0, 1);
  assert.ok(contentProblems(noArabic).includes(`${gone.key}: missing in ar`));
  const noFrench = structuredClone(lessons);
  const [goneFr] = noFrench.fr.splice(0, 1);
  assert.ok(contentProblems(noFrench).includes(`${goneFr.key}: missing in fr`));
});

test('a track numbered with a gap or a duplicate is caught', () => {
  for (const order of [4, 1]) {
    const misnumbered = structuredClone(lessons);
    const track = misnumbered.fr.filter((l) => l.track === 'magie');
    track[2].order = order;
    track.sort((a, b) => a.order - b.order);
    misnumbered.fr = misnumbered.fr.filter((l) => l.track !== 'magie').concat(track);
    assert.ok(contentProblems(misnumbered).some((p) => p.startsWith('fr/magie: lessons must be numbered')), `order ${order}`);
  }
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

test('a folder that is not a track, and a badly named lesson file, are refused', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'academy-lessons-'));
  try {
    cpSync(LESSONS_DIR, scratch, { recursive: true });
    cpSync(join(scratch, 'fr', 'magie'), join(scratch, 'fr', 'cuisine'), { recursive: true });
    assert.throws(() => loadLessons(scratch), /fr\/cuisine: unknown track/);
    rmSync(join(scratch, 'fr', 'cuisine'), { recursive: true });
    renameSync(join(scratch, 'fr', 'magie', 'la-carte-cle.md'), join(scratch, 'fr', 'magie', 'La Carte.md'));
    assert.throws(() => loadLessons(scratch), /file names are lowercase words joined by hyphens/);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
