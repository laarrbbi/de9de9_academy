// Reads the lessons in content/lessons/, checks them, and turns their
// Markdown into HTML for the app. Used by build-content.mjs and the tests.
//
// A lesson lives at content/lessons/<locale>/<track>/<lesson>.md. The same
// lesson in the other language has the same <track>/<lesson> path.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Marked } from 'marked';
import { parse as parseYaml } from 'yaml';
import { LOCALES, TRACKS } from '../www/js/tracks.js';
import { SHELVES } from '../www/js/shelves.js';

export const LESSONS_DIR = new URL('../content/lessons/', import.meta.url).pathname;

const marked = new Marked({ gfm: true });

const FIELDS = ['title', 'summary', 'order', 'minutes', 'level', 'risk', 'safety', 'tools', 'callAPro', 'quiz'];
const LEVELS = ['beginner', 'intermediate'];
const RISKS = ['low', 'medium', 'high'];

const isText = (v) => typeof v === 'string' && v.trim() !== '';
const isCount = (v) => Number.isInteger(v) && v > 0;

// Every rule a lesson must follow. Returns the list of problems, empty if none.
export function lessonProblems(data) {
  const problems = [];
  const need = (ok, message) => ok || problems.push(message);

  for (const key of Object.keys(data)) need(FIELDS.includes(key), `unknown field "${key}"`);
  need(isText(data.title), '"title" is required');
  need(isText(data.summary), '"summary" is required');
  need(isCount(data.order), '"order" must be a whole number from 1');
  need(isCount(data.minutes), '"minutes" must be a whole number from 1');
  need(LEVELS.includes(data.level), `"level" must be one of ${LEVELS.join(', ')}`);
  need(RISKS.includes(data.risk), `"risk" must be one of ${RISKS.join(', ')}`);
  need(data.safety === undefined || isText(data.safety), '"safety" must be text');

  const tools = data.tools;
  need(Array.isArray(tools) && tools.length > 0, '"tools" needs at least one tool');
  (Array.isArray(tools) ? tools : []).forEach((tool, i) => {
    need(isText(tool?.name), `tool ${i + 1} needs a "name"`);
    need(tool?.shelf === undefined || tool.shelf in SHELVES, `tool ${i + 1}: unknown shelf "${tool?.shelf}" (see www/js/shelves.js)`);
  });

  const pro = data.callAPro ?? [];
  need(Array.isArray(pro) && pro.every(isText), '"callAPro" must be a list of sentences');

  // Anything that can hurt someone must say how to stay safe and when to stop.
  if (data.risk !== 'low') {
    need(isText(data.safety), `a "${data.risk}" risk lesson needs a "safety" rule`);
    need(Array.isArray(pro) && pro.length > 0, `a "${data.risk}" risk lesson needs a "callAPro" list`);
  }

  const quiz = data.quiz;
  need(Array.isArray(quiz) && quiz.length >= 1 && quiz.length <= 5, '"quiz" needs 1 to 5 questions');
  (Array.isArray(quiz) ? quiz : []).forEach((q, i) => {
    const n = i + 1;
    need(isText(q?.question), `question ${n} needs a "question"`);
    need(Array.isArray(q?.options) && q.options.length >= 2 && q.options.length <= 4 && q.options.every(isText), `question ${n} needs 2 to 4 "options"`);
    need(Number.isInteger(q?.answer) && q.answer >= 0 && q.answer < (q?.options?.length ?? 0), `question ${n}: "answer" is the index of the right option, from 0`);
    need(isText(q?.explanation), `question ${n} needs an "explanation"`);
  });

  return problems;
}

// Splits a lesson file into its frontmatter data and its Markdown body.
export function parseLesson(text) {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text.replace(/\r\n/g, '\n'));
  if (!match) throw new Error('missing the "---" frontmatter block at the top');
  return { data: parseYaml(match[1]) ?? {}, body: match[2] };
}

// The shape of a lesson body, compared between languages.
function structureOf(tokens) {
  return {
    sections: tokens.filter((t) => t.type === 'heading' && t.depth === 2).length,
    tips: tokens.filter((t) => t.type === 'blockquote').length,
    tables: tokens.filter((t) => t.type === 'table').length,
  };
}

function readLesson(locale, track, file) {
  const path = `${locale}/${track}/${file}`;
  const fail = (message) => {
    throw new Error(`content/lessons/${path}: ${message}`);
  };
  let parsed;
  try {
    parsed = parseLesson(readFileSync(join(LESSONS_DIR, path), 'utf8'));
  } catch (error) {
    fail(error.message);
  }
  const problems = lessonProblems(parsed.data);
  if (problems.length > 0) fail(`\n  - ${problems.join('\n  - ')}`);

  const slug = file.replace(/\.md$/, '');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail('file names are lowercase words joined by hyphens');
  const tokens = marked.lexer(parsed.body);
  const { data } = parsed;
  return {
    key: `${track}/${slug}`,
    track,
    slug,
    locale,
    title: data.title,
    summary: data.summary,
    order: data.order,
    minutes: data.minutes,
    level: data.level,
    risk: data.risk,
    safety: data.safety ?? null,
    tools: data.tools.map((t) => ({ name: t.name, shelf: t.shelf ?? null })),
    callAPro: data.callAPro ?? [],
    quiz: data.quiz,
    html: marked.parser(tokens),
    structure: structureOf(tokens),
  };
}

// Every lesson, by language, in track order then lesson order.
export function loadLessons() {
  const trackIds = TRACKS.map((t) => t.id);
  const lessons = {};
  for (const locale of LOCALES) {
    lessons[locale] = [];
    for (const track of readdirSync(join(LESSONS_DIR, locale))) {
      if (!trackIds.includes(track)) {
        throw new Error(`content/lessons/${locale}/${track}: unknown track. Add it to www/js/tracks.js first.`);
      }
      for (const file of readdirSync(join(LESSONS_DIR, locale, track))) {
        if (file.endsWith('.md')) lessons[locale].push(readLesson(locale, track, file));
      }
    }
    lessons[locale].sort((a, b) => trackIds.indexOf(a.track) - trackIds.indexOf(b.track) || a.order - b.order);
  }
  return lessons;
}

// The facts that must not differ between the two languages of a lesson.
export function languageFreeFacts(lesson) {
  return {
    order: lesson.order,
    minutes: lesson.minutes,
    level: lesson.level,
    risk: lesson.risk,
    hasSafety: lesson.safety !== null,
    shelves: lesson.tools.map((t) => t.shelf),
    callAProCount: lesson.callAPro.length,
    quiz: lesson.quiz.map((q) => ({ options: q.options.length, answer: q.answer })),
    structure: lesson.structure,
  };
}

// Problems that make the languages disagree, or a track's lessons misnumbered.
export function contentProblems(lessons) {
  const problems = [];
  const [first, ...others] = LOCALES;
  const byKey = (locale) => new Map(lessons[locale].map((l) => [l.key, l]));
  const reference = byKey(first);

  for (const locale of others) {
    const translated = byKey(locale);
    for (const key of reference.keys()) if (!translated.has(key)) problems.push(`${key}: missing in ${locale}`);
    for (const key of translated.keys()) if (!reference.has(key)) problems.push(`${key}: missing in ${first}`);
    for (const [key, lesson] of reference) {
      const other = translated.get(key);
      if (other && JSON.stringify(languageFreeFacts(lesson)) !== JSON.stringify(languageFreeFacts(other))) {
        problems.push(`${key}: ${first} and ${locale} differ (order, minutes, level, risk, safety, tool shelves, "call a pro" count, quiz answers, or sections, tips and tables)`);
      }
    }
  }

  for (const locale of LOCALES) {
    for (const track of TRACKS) {
      const orders = lessons[locale].filter((l) => l.track === track.id).map((l) => l.order);
      if (orders.some((order, i) => order !== i + 1)) {
        problems.push(`${locale}/${track.id}: lessons must be numbered 1, 2, 3… (found ${orders.join(', ')})`);
      }
    }
  }
  return problems;
}
