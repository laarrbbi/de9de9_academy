import { LESSONS } from './content.js';
import { SERVICES_URL } from './config.js';
import { dir, t } from './i18n.js';
import { markDone, readDone, readLocale, saveLocale } from './progress.js';
import { setupQuiz } from './quiz.js';
import { homeHref, lessonHref, nextLesson, parentHref, parseRoute, trackHref } from './routes.js';
import { SHELVES, shelfUrl, storeUrl } from './shelves.js';
import { TRACKS } from './tracks.js';

const app = document.getElementById('app');
let locale = readLocale();
// How many screens deep we are in this app's history (0 = first screen).
let depth = 0;

const tr = (key) => t(locale, key);
const esc = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const lessonsOf = (trackId) => LESSONS[locale].filter((l) => l.track === trackId);
const findTrack = (id) => TRACKS.find((track) => track.id === id && lessonsOf(id).length > 0);
// Links out of the app open in the phone's browser.
const outLink = (href, cls, label) =>
  `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener">${label} ${ICON.out}</a>`;

const svg = (cls, box, body) => `<svg class="${cls}" viewBox="${box}" aria-hidden="true">${body}</svg>`;
const stroke = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
const ICON = {
  chevron: svg('i chev flip', '0 0 20 20', `<path d="M8 5l5 5-5 5" ${stroke} stroke-width="2"/>`),
  back: svg('i flip', '0 0 24 24', `<path d="M15 5l-7 7 7 7" ${stroke} stroke-width="2.2"/>`),
  out: svg('i out flip', '0 0 20 20', `<path d="M7 13 13 7m-5 0h5v5" ${stroke} stroke-width="1.8"/>`),
  check: svg('i', '0 0 20 20', `<path d="m5 10.5 3.2 3.2L15 7" ${stroke} stroke-width="2.4"/>`),
  cross: svg('i', '0 0 20 20', `<path d="m6 6 8 8m0-8-8 8" ${stroke} stroke-width="2.2"/>`),
  clock: svg('i', '0 0 16 16', `<circle cx="8" cy="8" r="6.2" ${stroke} stroke-width="1.6"/><path d="M8 4.6V8l2.4 1.6" ${stroke} stroke-width="1.6"/>`),
  shield: svg('i', '0 0 16 16', '<path d="M8 1.6 2.6 3.8v3.8c0 3.2 2.3 5.8 5.4 6.8 3.1-1 5.4-3.6 5.4-6.8V3.8Z" fill="currentColor"/>'),
  warn: svg('i safety-icon', '0 0 24 24', '<path d="M12 2.4 4 5.6v5.6c0 4.8 3.4 8.8 8 10.4 4.6-1.6 8-5.6 8-10.4V5.6Z" fill="currentColor"/><path d="M12 7.5v5.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="16.3" r="1.3" fill="#fff"/>'),
};

// ---------- pieces ----------

function bar(done, total) {
  const width = total ? Math.round((100 * done) / total) : 0;
  return `<span class="progress" aria-hidden="true"><i style="width:${width}%"></i></span>`;
}

function count(done, total) {
  return `<span dir="ltr">${done}/${total}</span>`;
}

function chips(lesson) {
  return `
    <span class="chip chip-neutral">${ICON.clock}${lesson.minutes} ${tr('lesson.minutes')}</span>
    <span class="chip chip-teal">${tr(`lesson.level.${lesson.level}`)}</span>
    <span class="chip chip-${lesson.risk}">${ICON.shield}${tr(`lesson.risk.${lesson.risk}`)}</span>`;
}

function topbar(title) {
  return `
    <header class="topbar">
      <button class="icon-btn" type="button" data-action="back" aria-label="${esc(tr('nav.back'))}">${ICON.back}</button>
      <span class="topbar-title">${esc(title)}</span>
    </header>`;
}

// ---------- screens ----------

function homeScreen() {
  const done = readDone();
  const all = LESSONS[locale];
  const doneCount = all.filter((l) => done.has(l.key)).length;
  const next = nextLesson(all, done);
  const other = locale === 'fr' ? 'ar' : 'fr';

  const resume = next
    ? `<a class="resume tap" href="${lessonHref(next)}">
        <span class="icon-chip small"><img src="assets/icons/${next.track}.svg" alt=""></span>
        <span class="grow">
          <small>${tr(doneCount ? 'home.continue' : 'home.start')} · ${esc(TRACKS.find((x) => x.id === next.track).name[locale])}</small>
          <strong>${esc(next.title)}</strong>
        </span>
        ${ICON.chevron}
      </a>`
    : `<p class="all-done">${ICON.check}${tr('home.allDone')}</p>`;

  const tracks = TRACKS.filter((track) => lessonsOf(track.id).length > 0)
    .map((track) => {
      const list = lessonsOf(track.id);
      const n = list.filter((l) => done.has(l.key)).length;
      return `
        <li>
          <a class="track-row card tap" href="${trackHref(track.id)}">
            <span class="icon-chip"><img src="assets/icons/${track.id}.svg" alt=""></span>
            <span class="grow">
              <span class="eyebrow">${esc(track.group[locale])}</span>
              <strong class="row-title">${esc(track.name[locale])}</strong>
              <span class="row-meta">${list.length} ${tr('track.lessons')} · ${count(n, list.length)} ${tr('track.done')}</span>
              ${bar(n, list.length)}
            </span>
            ${ICON.chevron}
          </a>
        </li>`;
    })
    .join('');

  return {
    dark: true,
    html: `
      <div class="screen home">
        <header class="home-head">
          <div class="home-bar">
            <img class="mark" src="assets/logo-mark-white.png" alt="De9De9" width="44" height="39">
            <span class="app-tag">Academy</span>
            <button class="lang-btn" type="button" data-action="lang" lang="${other}" aria-label="${esc(tr('nav.switchLabel'))}">${tr('nav.switch')}</button>
          </div>
          <h1 tabindex="-1">${tr('home.title')}</h1>
          <p>${tr('home.lead')}</p>
        </header>
        <div class="content">
          <section class="card progress-card">
            <div class="pc-top">
              <span>${tr('home.progress')}</span>
              <strong><span dir="ltr">${doneCount} / ${all.length}</span> <small>${tr('home.lessons')}</small></strong>
            </div>
            ${bar(doneCount, all.length)}
            ${resume}
          </section>
          <h2 class="list-title">${tr('home.tracks')}</h2>
          <ul class="track-list">${tracks}</ul>
          <a class="promo tap" href="${esc(storeUrl(locale, 'home'))}" target="_blank" rel="noopener">
            <img src="assets/de9de9-logo.png" alt="De9De9" width="64" height="57">
            <span class="grow">
              <strong>${tr('home.storeTitle')}</strong>
              <small>${tr('home.storeBody')}</small>
              <span class="promo-cta">${tr('home.storeCta')} ${ICON.out}</span>
            </span>
          </a>
          <p class="note">${tr('home.note')}</p>
        </div>
      </div>`,
  };
}

function trackScreen(track) {
  const done = readDone();
  const list = lessonsOf(track.id);
  const n = list.filter((l) => done.has(l.key)).length;
  const next = nextLesson(list, done);
  const start = next
    ? { href: lessonHref(next), label: tr(n ? 'track.continue' : 'track.start') }
    : { href: lessonHref(list[0]), label: tr('track.review') };

  const rows = list
    .map(
      (lesson, i) => `
        <li>
          <a class="lesson-row card tap${done.has(lesson.key) ? ' is-done' : ''}" href="${lessonHref(lesson)}">
            <span class="num"><span class="num-n">${i + 1}</span>${ICON.check}</span>
            <span class="grow">
              <strong class="row-title">${esc(lesson.title)}</strong>
              <span class="row-summary">${esc(lesson.summary)}</span>
              <span class="chips">${chips(lesson)}</span>
            </span>
            ${ICON.chevron}
          </a>
        </li>`,
    )
    .join('');

  return {
    dark: false,
    html: `
      <div class="screen">
        ${topbar(track.name[locale])}
        <div class="content">
          <section class="card track-head">
            <div class="th-top">
              <span class="icon-chip big"><img src="assets/icons/${track.id}.svg" alt=""></span>
              <div>
                <p class="eyebrow">${esc(track.group[locale])}</p>
                <h1 tabindex="-1">${esc(track.name[locale])}</h1>
              </div>
            </div>
            <p class="tagline">${esc(track.tagline[locale])}</p>
            <div class="th-progress">
              <span>${count(n, list.length)} ${tr('track.done')}</span>
              ${bar(n, list.length)}
            </div>
            <a class="btn btn-primary" href="${start.href}">${start.label}</a>
            ${outLink(shelfUrl(track.shelf, locale, track.id), 'btn btn-outline', `${tr('track.shop')} « ${esc(SHELVES[track.shelf].name[locale])} »`)}
          </section>
          <ol class="lesson-list">${rows}</ol>
        </div>
      </div>`,
  };
}

function quizBlock(lesson, after) {
  const questions = lesson.quiz
    .map(
      (q, qi) => `
        <li>
          <fieldset data-answer="${q.answer}">
            <legend><span class="q-num">${qi + 1}</span><span>${esc(q.question)}</span></legend>
            <div class="options">
              ${q.options
                .map(
                  (option, oi) => `
                    <label class="option">
                      <input type="radio" name="q${qi}" value="${oi}">
                      <span>${esc(option)}</span>
                    </label>`,
                )
                .join('')}
            </div>
            <p class="why"><span class="mark-right">${ICON.check}</span><span class="mark-wrong">${ICON.cross}</span><span>${esc(q.explanation)}</span></p>
          </fieldset>
        </li>`,
    )
    .join('');

  return `
    <section class="card quiz" aria-labelledby="quiz-title">
      <h2 id="quiz-title">${tr('quiz.title')}</h2>
      <p class="quiz-lead">${tr('quiz.lead')}</p>
      <form data-quiz novalidate>
        <ol class="questions">${questions}</ol>
        <p class="status" data-quiz-status role="status" aria-live="polite"></p>
        <div class="actions">
          <button class="btn btn-primary" type="submit" data-quiz-submit>${tr('quiz.check')}</button>
          <button class="btn btn-outline" type="button" data-quiz-retry hidden>${tr('quiz.retry')}</button>
        </div>
        <div class="success" data-quiz-success hidden>
          <span class="success-icon">${ICON.check}</span>
          <p class="success-title">${tr('quiz.success')}</p>
          <a class="btn btn-primary" href="${after.href}">${after.label} ${ICON.chevron}</a>
        </div>
      </form>
    </section>`;
}

function lessonScreen(track, lesson) {
  const list = lessonsOf(track.id);
  const i = list.indexOf(lesson);
  const prev = list[i - 1];
  const next = list[i + 1];
  const done = readDone().has(lesson.key);
  const after = next
    ? { href: lessonHref(next), label: tr('lesson.next') }
    : { href: trackHref(track.id), label: tr('lesson.backToTrack') };
  const campaign = `${track.id}-${lesson.slug}`;

  const tools = lesson.tools
    .map(
      (tool) => `
        <li>
          <span>${esc(tool.name)}</span>
          ${tool.shelf ? outLink(shelfUrl(tool.shelf, locale, campaign), 'shop-link', tr('lesson.toolsShop')) : ''}
        </li>`,
    )
    .join('');

  const safety = lesson.safety
    ? `<aside class="safety risk-${lesson.risk}">
        ${ICON.warn}
        <div><p class="safety-title">${tr('lesson.safety')}</p><p>${esc(lesson.safety)}</p></div>
      </aside>`
    : '';

  const pro = lesson.callAPro.length
    ? `<section class="pro">
        <h2>${tr('lesson.pro')}</h2>
        <ul>${lesson.callAPro.map((sign) => `<li>${esc(sign)}</li>`).join('')}</ul>
        ${outLink(SERVICES_URL, 'btn btn-outline', tr('lesson.proCta'))}
      </section>`
    : '';

  const pager = `
    <nav class="pager">
      ${prev ? `<a class="pager-link tap" href="${lessonHref(prev)}"><small>${tr('lesson.prev')}</small><span>${esc(prev.title)}</span></a>` : '<span></span>'}
      <a class="pager-link end tap" href="${after.href}">
        <small>${after.label}</small>
        <span>${esc(next ? next.title : track.name[locale])}</span>
      </a>
    </nav>`;

  return {
    dark: false,
    setup: () => {
      setupQuiz(app.querySelector('form[data-quiz]'), {
        incomplete: tr('quiz.incomplete'),
        score: tr('quiz.score'),
        onPass: () => {
          markDone(lesson.key);
          app.querySelector('.lesson')?.classList.add('is-done');
        },
      });
    },
    html: `
      <div class="screen">
        ${topbar(`${track.name[locale]} · ${i + 1}/${list.length}`)}
        <article class="content lesson${done ? ' is-done' : ''}">
          <p class="eyebrow">${tr('track.lesson')} ${i + 1}</p>
          <h1 tabindex="-1">${esc(lesson.title)}</h1>
          <p class="lead">${esc(lesson.summary)}</p>
          <div class="chips">${chips(lesson)}<span class="chip chip-low done-chip">${ICON.check}${tr('lesson.isDone')}</span></div>
          ${safety}
          <section class="card tools">
            <h2>${tr('lesson.tools')}</h2>
            <ul>${tools}</ul>
          </section>
          <div class="prose">${lesson.html}</div>
          ${pro}
          ${quizBlock(lesson, after)}
          ${pager}
        </article>
      </div>`,
  };
}

// ---------- navigation ----------

function screenFor(route) {
  const track = route.name === 'home' ? undefined : findTrack(route.track);
  if (route.name === 'track' && track) return trackScreen(track);
  if (route.name === 'lesson' && track) {
    const lesson = lessonsOf(track.id).find((l) => l.slug === route.lesson);
    if (lesson) return lessonScreen(track, lesson);
  }
  return null;
}

function setSystemBars(dark) {
  document.querySelector('meta[name="theme-color"]').content = dark ? '#1f8079' : '#ffffff';
  // In the app, light status bar icons over the dark teal home header, dark
  // icons over the white screens. In a browser there is no Capacitor.
  window.Capacitor?.Plugins?.SystemBars?.setStyle({ style: dark ? 'DARK' : 'LIGHT', bar: 'StatusBar' })?.catch(() => {});
}

function render(direction) {
  const route = parseRoute(location.hash);
  let screen = screenFor(route);
  if (!screen) {
    // Unknown address (a renamed lesson, a typo): show the home screen.
    if (route.name !== 'home') history.replaceState(history.state, '', homeHref());
    screen = homeScreen();
  }
  app.innerHTML = screen.html;
  setSystemBars(screen.dark);
  screen.setup?.();
  if (direction !== 'none') {
    app.firstElementChild.classList.add(direction === 'back' ? 'enter-back' : 'enter-forward');
    app.querySelector('h1')?.focus({ preventScroll: true });
  }
}

function go(hash) {
  if (hash === location.hash) return;
  history.replaceState({ ...history.state, scrollY: window.scrollY }, '');
  depth += 1;
  history.pushState({ depth, scrollY: 0 }, '', hash);
  render('forward');
  window.scrollTo(0, 0);
}

function goBack() {
  if (depth > 0) {
    history.back();
    return;
  }
  // Opened straight onto this screen: there is nothing behind it, go up.
  history.replaceState({ depth: 0, scrollY: 0 }, '', parentHref(parseRoute(location.hash)));
  render('back');
  window.scrollTo(0, 0);
}

function switchLanguage() {
  locale = locale === 'fr' ? 'ar' : 'fr';
  saveLocale(locale);
  applyLanguage();
  render('none');
}

function applyLanguage() {
  document.documentElement.lang = locale;
  document.documentElement.dir = dir(locale);
  document.title = tr('app.name');
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#/"]');
  if (link) {
    event.preventDefault();
    go(link.getAttribute('href'));
    return;
  }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'back') goBack();
  if (action === 'lang') switchLanguage();
});

window.addEventListener('popstate', (event) => {
  const target = event.state?.depth ?? 0;
  const direction = target < depth ? 'back' : 'forward';
  depth = target;
  render(direction);
  window.scrollTo(0, event.state?.scrollY ?? 0);
});

history.scrollRestoration = 'manual';
if (history.state === null) history.replaceState({ depth: 0, scrollY: 0 }, '', location.hash || homeHref());
depth = history.state.depth ?? 0;
applyLanguage();
render('none');
