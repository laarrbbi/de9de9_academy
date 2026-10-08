// Keeps the French and Arabic lessons in step. The schema in
// src/content.config.ts checks each file on its own; this checks the pairs:
// same lessons, same quiz answers, same tool links, same structure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../src/content/lessons/', import.meta.url).pathname;
const LOCALES = ['fr', 'ar'];

function lessonPaths(locale) {
  const out = [];
  for (const track of readdirSync(join(ROOT, locale))) {
    for (const file of readdirSync(join(ROOT, locale, track))) {
      if (file.endsWith('.md')) out.push(`${track}/${file}`);
    }
  }
  return out.sort();
}

// Reads the language-independent facts of a lesson. The frontmatter is
// written in a fixed shape (see any lesson), so a line scan is enough.
function facts(locale, path) {
  const text = readFileSync(join(ROOT, locale, path), 'utf8');
  const [, front, body] = text.split(/^---$/m);
  const lines = front.split('\n');
  const scalar = (key) => lines.find((l) => l.startsWith(`${key}:`))?.split(':')[1].trim();

  const tools = [];
  const quiz = [];
  let section = null;
  let proCount = 0;
  for (const line of lines) {
    if (/^\w/.test(line)) section = line.split(':')[0];
    if (section === 'tools' && /^ {2}- name:/.test(line)) tools.push(null);
    if (section === 'tools' && /^ {4}shelf:/.test(line)) tools[tools.length - 1] = line.split(':')[1].trim();
    if (section === 'callAPro' && /^ {2}- /.test(line)) proCount += 1;
    if (section === 'quiz' && /^ {2}- question:/.test(line)) quiz.push({ options: 0 });
    if (section === 'quiz' && /^ {6}- /.test(line)) quiz[quiz.length - 1].options += 1;
    if (section === 'quiz' && /^ {4}answer:/.test(line)) quiz[quiz.length - 1].answer = Number(line.split(':')[1]);
  }

  return {
    order: scalar('order'),
    minutes: scalar('minutes'),
    level: scalar('level'),
    risk: scalar('risk'),
    hasSafety: scalar('safety') !== undefined,
    tools,
    proCount,
    quiz,
    sections: (body.match(/^## /gm) ?? []).length,
    tips: (body.match(/^> /gm) ?? []).length,
    tables: (body.match(/^\|---/gm) ?? []).length,
  };
}

test('every lesson exists in both languages', () => {
  const [fr, ar] = LOCALES.map(lessonPaths);
  assert.ok(fr.length > 0, 'no lessons found');
  assert.deepEqual(ar, fr);
});

for (const path of lessonPaths('fr')) {
  test(`${path}: French and Arabic match`, () => {
    assert.deepEqual(facts('ar', path), facts('fr', path));
  });
}

test('lesson order is 1..n in every track', () => {
  for (const locale of LOCALES) {
    const byTrack = {};
    for (const path of lessonPaths(locale)) {
      const [track] = path.split('/');
      (byTrack[track] ??= []).push(Number(facts(locale, path).order));
    }
    for (const [track, orders] of Object.entries(byTrack)) {
      assert.deepEqual(
        orders.sort((a, b) => a - b),
        orders.map((_, i) => i + 1),
        `${locale}/${track} has orders ${orders}`,
      );
    }
  }
});
