import { LESSONS } from './content.js';
import { APP_LINKS, SERVICES_URL, SOCIAL_LINKS, STORE_LIVE } from './config.js';
import { dir, t } from './i18n.js';
import { markDone, readDone, readLocale, saveLocale } from './progress.js';
import { setupQuiz } from './quiz.js';
import { homeHref, lessonHref, navigation, nextLesson, parentHref, parseRoute, trackHref } from './routes.js';
import { SHELVES, shelfUrl, storeUrl } from './shelves.js';
import { groupEmoji, trackEmoji, trackScene, TRACKS } from './tracks.js';

const app = document.getElementById('app');
let locale = readLocale();
// How many screens deep we are in this app's history (0 = first screen).
let depth = 0;
// When the current screen was drawn. Taps in the next moment are ignored, so
// a double tap does not land on the new screen too.
let drawnAt = 0;
const TAP_GUARD_MS = 300; // Android's own double-tap window

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
  globe: svg('i', '0 0 16 16', `<circle cx="8" cy="8" r="6.2" ${stroke} stroke-width="1.5"/><path d="M1.8 8h12.4M8 1.8c-1.9 2-1.9 10.4 0 12.4m0-12.4c1.9 2 1.9 10.4 0 12.4" ${stroke} stroke-width="1.5"/>`),
  saved: svg('i', '0 0 16 16', `<path d="M4 1.8h8v12.4L8 11.2l-4 3Z" ${stroke} stroke-width="1.5"/>`),
  offline: svg('i', '0 0 16 16', `<rect x="4" y="1.6" width="8" height="12.8" rx="1.8" ${stroke} stroke-width="1.5"/><path d="M8 5v4.6m-2-2 2 2 2-2" ${stroke} stroke-width="1.5"/>`),
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

// A 3D emoji of de9de9.dz on its white disc (decorative: a name is always
// written next to it or on its link).
const emojiDisc = (src, cls = '') => `<span class="emoji-disc ${cls}"><img src="${src}" alt=""></span>`;
const img = (src, cls, w, h) => `<img class="${cls}" src="assets/brand-site/${src}.webp" alt="" width="${w}" height="${h}" draggable="false">`;
// « b[o]ns »: the logo's roof over one letter, de9de9.dz's « sôlution ». The
// word stays whole: a line must not break around the roofed letter.
const roofed = (text) =>
  text.replace(
    /(\S*)\[(.)\](\S*)/,
    (_, before, letter, after) =>
      `<span class="roof-word">${before}<span class="roof">${letter}${img('roof-o', 'roof-art', 97, 97)}</span>${after}</span>`,
  );
// The De9De9 people, as on de9de9.dz's « Besoin d'un pro ? » band.
const pros = (n, cls) =>
  `<ul class="${cls}" aria-hidden="true">${[1, 2, 3, 4, 5, 6]
    .slice(0, n)
    .map((i) => `<li>${img(`pro-${i}`, '', 126, 255)}</li>`)
    .join('')}</ul>`;

// White top bar of the inner screens. `reveal`: the screen's head repeats
// the title, so the bar shows it only once that headline has scrolled under
// it (see watchTitle). Screen readers get the headline, not this copy.
function topbar(title, { reveal = false } = {}) {
  const attrs = reveal ? 'class="topbar-title is-hidden" data-reveal aria-hidden="true"' : 'class="topbar-title"';
  return `
    <header class="topbar">
      <button class="icon-btn" type="button" data-action="back" aria-label="${esc(tr('nav.back'))}">${ICON.back}</button>
      <span ${attrs}>${esc(title)}</span>
    </header>`;
}

// ---------- screens ----------
// The language of de9de9.dz, the client's services site, as the store took
// it on 2026-11-09 (laarrbbi/de9de9, apps/storefront/src/components/home/ and
// components/category/): white header, the teal band of 3D emojis, the
// display title with the roof and the coral pill, the arch with the group's
// scene, « Pourquoi ? », the pros band, the coral ribbon and the teal footer.

function homeScreen() {
  const done = readDone();
  const all = LESSONS[locale];
  const doneCount = all.filter((l) => done.has(l.key)).length;
  const next = nextLesson(all, done);
  const minutes = all.map((l) => l.minutes);
  const tracks = TRACKS.filter((track) => lessonsOf(track.id).length > 0);
  const trackName = (id) => esc(TRACKS.find((x) => x.id === id).name[locale]);

  const languages = ['fr', 'ar']
    .map((l) =>
      l === locale
        ? `<span class="lang-on" lang="${l}">${l === 'fr' ? 'Français' : 'العربية'}</span>`
        : `<button class="lang-btn" type="button" data-action="lang" lang="${l}" aria-label="${esc(tr('nav.switchLabel'))}">${tr('nav.switch')}</button>`,
    )
    .join('');

  const band = tracks
    .map(
      (track) => `
        <li>
          <a class="band-disc" href="${trackHref(track.id)}">
            <img src="${trackEmoji(track)}" alt=""><span class="sr-only">${esc(track.name[locale])}</span>
          </a>
        </li>`,
    )
    .join('');

  const steps = ['home.step1', 'home.step2', 'home.step3']
    .map((key, i) => `<li><span class="step-n">${i + 1}</span>${tr(key)}</li>`)
    .join('');

  const resume = next
    ? `<a class="resume tap" href="${lessonHref(next)}">
        ${emojiDisc(trackEmoji(TRACKS.find((x) => x.id === next.track)), 'small')}
        <span class="grow">
          <small>${tr(doneCount ? 'home.continue' : 'home.start')} · ${trackName(next.track)}</small>
          <strong>${esc(next.title)}</strong>
        </span>
        ${ICON.chevron}
      </a>`
    : `<p class="all-done">${ICON.check}${tr('home.allDone')}</p>`;

  const trackRows = tracks
    .map((track) => {
      const list = lessonsOf(track.id);
      const n = list.filter((l) => done.has(l.key)).length;
      return `
        <li>
          <a class="track-row card tap" href="${trackHref(track.id)}">
            ${emojiDisc(trackEmoji(track))}
            <span class="grow">
              <span class="group-tag"><img src="${groupEmoji(track)}" alt="">${esc(track.group[locale])}</span>
              <strong class="row-title">${esc(track.name[locale])}</strong>
              <span class="row-meta">${list.length} ${tr('track.lessons')} · ${count(n, list.length)} ${tr('track.done')}</span>
              ${bar(n, list.length)}
            </span>
            ${ICON.chevron}
          </a>
        </li>`;
    })
    .join('');

  // « Pourquoi ? »: reasons that hold for every lesson; the lengths are read
  // from the lessons themselves.
  const whyCards = [
    ['assets/category-emoji/cours-particuliers.webp', tr('home.whyQuizTitle'), tr('home.whyQuizText')],
    ['assets/brand-site/clock.webp', tr('home.whyShortTitle').replace('{min}', Math.min(...minutes)).replace('{max}', Math.max(...minutes)), tr('home.whyShortText')],
    ['assets/brand-site/lock.webp', tr('home.whySafeTitle'), tr('home.whySafeText')],
  ]
    .map(([art, title, text]) => `<li class="why-card"><img src="${art}" alt=""><div><h3>${title}</h3><p>${text}</p></div></li>`)
    .join('');
  const whyRows = [
    [ICON.offline, tr('home.whyOffline')],
    [ICON.globe, tr('home.whyBilingual')],
    [ICON.saved, tr('home.whyProgress')],
  ]
    .map(([icon, text]) => `<li><span class="why-icon">${icon}</span><span>${text}</span></li>`)
    .join('');

  const store = STORE_LIVE
    ? `<a class="promo card tap" href="${esc(storeUrl(locale, 'home'))}" target="_blank" rel="noopener">
        <img src="assets/de9de9-logo.webp" alt="De9De9" width="64" height="57">
        <span class="grow">
          <strong>${tr('home.storeTitle')}</strong>
          <small>${tr('home.storeBody')}</small>
          <span class="promo-cta">${tr('home.storeCta')} ${ICON.out}</span>
        </span>
      </a>`
    : '';

  const ribbon = next
    ? `<section class="cta" aria-labelledby="cta-title">
        <div class="ribbon"><h2 id="cta-title">${tr('home.ribbon')}</h2></div>
        ${img('ant', 'ant', 360, 360)}
        <p class="cta-title">${tr('home.ribbonTitle')}</p>
        <a class="btn btn-coral" href="${lessonHref(next)}">${tr('home.ribbonButton')}</a>
      </section>`
    : '';

  const rawOut = (href, label, inner, cls = '') =>
    `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener" aria-label="${esc(label)}">${inner}</a>`;

  return `
    <div class="screen home">
      <header class="appbar home-head">
        <img class="appbar-logo" src="assets/de9de9-logo.webp" alt="De9De9" width="49" height="44">
        <span class="app-tag">Academy</span>
        <div class="lang-switch" role="group" aria-label="${esc(tr('nav.language'))}">${languages}</div>
      </header>
      <nav class="band" aria-label="${esc(tr('home.bandLabel'))}"><ul>${band}</ul></nav>
      <div class="content">
        <section class="home-hero">
          <h1 tabindex="-1"><span class="hero-line">${roofed(tr('home.heroLead'))}</span> <span class="hero-pill">${tr('home.heroHighlight')}</span></h1>
          <p class="hero-sub">${tr('home.lead')}</p>
          <ol class="steps" aria-label="${esc(tr('home.stepsLabel'))}">${steps}</ol>
        </section>
        <section class="card progress-card">
          <div class="pc-top">
            <span>${tr('home.progress')}</span>
            <strong><span dir="ltr">${doneCount} / ${all.length}</span> <small>${tr('home.lessons')}</small></strong>
          </div>
          ${bar(doneCount, all.length)}
          ${resume}
        </section>
        <div class="showcase">
          ${img('hero-house', 'house', 1000, 559)}
          <div class="stat-card">
            <p class="stat-big">${tr('home.statLessons').replace('{count}', `<span dir="ltr">${all.length}</span>`)}</p>
            <p class="stat-text">${tr('home.statText').replace('{tracks}', tracks.length)}</p>
          </div>
        </div>
        <h2 class="section-title">${tr('home.tracks')}</h2>
        <ul class="track-list">${trackRows}</ul>
        <section class="why" aria-labelledby="why-title">
          <h2 class="why-title" id="why-title">${tr('home.whyTitle')}</h2>
          <ul class="why-cards">${whyCards}</ul>
          <div class="why-panel">
            ${img('ant', 'ant', 360, 360)}
            <ul class="why-list" aria-label="${esc(tr('home.whyListLabel'))}">${whyRows}</ul>
          </div>
        </section>
        ${store}
        <section class="app-promo" aria-labelledby="pro-title">
          ${img('roof-band', 'roof-band', 1920, 1009)}
          ${pros(6, 'pros')}
          <div class="app-promo-copy">
            <h2 id="pro-title">${tr('home.proLead')} <span>${tr('home.proHighlight')}</span></h2>
            <p>${tr('home.proText')}</p>
            ${outLink(SERVICES_URL, 'btn btn-primary', tr('lesson.proCta'))}
          </div>
          ${img('phone-hand', 'phone-hand', 731, 953)}
        </section>
        ${ribbon}
      </div>
      <footer class="foot">
        <svg class="wave" viewBox="0 0 1440 64" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40 C 240 64, 480 8, 720 20 C 960 32, 1200 64, 1440 28 L 1440 64 L 0 64 Z"/></svg>
        <div class="foot-body">
          <span class="logo-tile"><img src="assets/de9de9-logo.webp" alt="De9De9" width="40" height="36"></span>
          <p class="foot-note">${tr('home.note')}</p>
          <h2>${tr('home.appTitle')}</h2>
          <p>${tr('home.appText')}</p>
          <div class="badges">
            ${rawOut(APP_LINKS.googlePlay, tr('home.googlePlay'), img('badge-google-play', '', 420, 121))}
            ${rawOut(APP_LINKS.appStore, tr('home.appStore'), img('badge-app-store', '', 420, 121))}
          </div>
          <h2>${tr('home.socialTitle')}</h2>
          <ul class="socials">${SOCIAL_LINKS.map((s) => `<li>${rawOut(s.href, s.name, img(`social-${s.icon}`, '', 42, 42), 'social')}</li>`).join('')}</ul>
        </div>
      </footer>
    </div>`;
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

  // The head of a de9de9.dz group page: the name and a line of copy, and the
  // teal arch with the group's scene, the track's emoji in its bubble on top.
  return `
    <div class="screen">
      ${topbar(track.name[locale], { reveal: true })}
      <div class="content">
        <header class="hero track-hero">
          <div class="th-copy">
            <p class="group-tag"><img src="${groupEmoji(track)}" alt="">${esc(track.group[locale])}</p>
            <h1 tabindex="-1">${esc(track.name[locale])}</h1>
            <p class="tagline">${esc(track.tagline[locale])}</p>
          </div>
          <div class="arch" aria-hidden="true">
            <span class="arch-shape"></span>
            <img class="arch-scene" src="${trackScene(track)}" alt="">
            ${emojiDisc(trackEmoji(track), 'arch-bubble')}
          </div>
        </header>
        <section class="card track-head">
          <div class="th-progress">
            <span>${count(n, list.length)} ${tr('track.done')}</span>
            ${bar(n, list.length)}
          </div>
          <a class="btn btn-primary" href="${start.href}">${start.label}</a>
          ${STORE_LIVE && track.shelf ? outLink(shelfUrl(track.shelf, locale, track.id, 'track'), 'btn btn-outline', `${tr('track.shop')} « ${esc(SHELVES[track.shelf].name[locale])} »`) : ''}
        </section>
        <h2 class="section-title">${tr('track.list')}</h2>
        <ol class="lesson-list">${rows}</ol>
      </div>
    </div>`;
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
            <p class="why-answer"><span class="mark-right">${ICON.check}</span><span class="mark-wrong">${ICON.cross}</span><span>${esc(q.explanation)}</span></p>
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
        <div class="success" data-quiz-success tabindex="-1" hidden>
          ${img('ant', 'ant', 360, 360)}
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
          ${STORE_LIVE && tool.shelf ? outLink(shelfUrl(tool.shelf, locale, campaign), 'shop-link', tr('lesson.toolsShop')) : ''}
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
        ${pros(3, 'pros-mini')}
        <h2>${tr('lesson.pro')}</h2>
        <ul>${lesson.callAPro.map((sign) => `<li>${esc(sign)}</li>`).join('')}</ul>
        ${outLink(SERVICES_URL, 'btn btn-primary', tr('lesson.proCta'))}
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
      <div class="screen lesson${done ? ' is-done' : ''}">
        ${topbar(`${track.name[locale]} · ${i + 1}/${list.length}`)}
        <article class="content">
          <header class="lesson-head">
            <p class="lesson-kicker">${emojiDisc(trackEmoji(track), 'small')}<span>${tr('track.lesson')} ${i + 1}</span></p>
            <h1 tabindex="-1">${esc(lesson.title)}</h1>
            <p class="lead">${esc(lesson.summary)}</p>
            <div class="chips">${chips(lesson)}<span class="chip chip-low done-chip">${ICON.check}${tr('lesson.isDone')}</span></div>
          </header>
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

// Shows a top bar's `data-reveal` title while the hero's headline is out of
// sight under the bar. One observer at a time: each screen replaces it.
let titleWatch;
function watchTitle() {
  titleWatch?.disconnect();
  titleWatch = undefined;
  const title = app.querySelector('.topbar-title[data-reveal]');
  const headline = app.querySelector('.hero h1');
  if (!title || !headline || !('IntersectionObserver' in window)) {
    title?.classList.remove('is-hidden');
    return;
  }
  const below = app.querySelector('.topbar').offsetHeight;
  titleWatch = new IntersectionObserver(
    ([entry]) => title.classList.toggle('is-hidden', entry.isIntersecting),
    { rootMargin: `-${below}px 0px 0px 0px` },
  );
  titleWatch.observe(headline);
}

// The stack of screens behind this one, kept in each history entry.
const trail = () => history.state?.trail ?? [location.hash || homeHref()];

function render(direction) {
  drawnAt = performance.now();
  const route = parseRoute(location.hash);
  let screen;
  try {
    screen = screenFor(route);
    if (!screen) {
      // Unknown address (a renamed lesson, a typo): show the home screen.
      if (route.name !== 'home') {
        history.replaceState({ ...history.state, trail: [...trail().slice(0, -1), homeHref()] }, '', homeHref());
      }
      screen = homeScreen();
    }
    // A screen is its HTML, or { html, setup } when it needs wiring up.
    app.innerHTML = screen.html ?? screen;
    screen.setup?.();
    watchTitle();
  } catch (error) {
    showFailure(error);
    return;
  }
  if (direction !== 'none') {
    app.firstElementChild.classList.add(direction === 'back' ? 'enter-back' : 'enter-forward');
    app.querySelector('h1')?.focus({ preventScroll: true });
  }
}

// Something broke while drawing a screen: say so rather than show a blank page.
function showFailure(error) {
  console.error(error);
  app.replaceChildren();
  document.getElementById('app-error').hidden = false;
}

function go(hash) {
  const move = navigation(trail(), hash);
  if (move.back === 0) return;
  history.replaceState({ ...history.state, scrollY: window.scrollY }, '');
  if (move.back) {
    // Already on the stack: go back to it (popstate draws it).
    history.go(-move.back);
    return;
  }
  depth = move.push.length - 1;
  history.pushState({ trail: move.push, scrollY: 0 }, '', hash);
  render('forward');
  window.scrollTo(0, 0);
}

function goBack() {
  if (depth > 0) {
    history.back();
    return;
  }
  // Opened straight onto this screen: there is nothing behind it, go up.
  const parent = parentHref(parseRoute(location.hash));
  history.replaceState({ trail: [parent], scrollY: 0 }, '', parent);
  render('back');
  window.scrollTo(0, 0);
}

function switchLanguage() {
  locale = locale === 'fr' ? 'ar' : 'fr';
  saveLocale(locale);
  applyLanguage();
  render('none');
  // The button was redrawn: keep the focus on it.
  app.querySelector('[data-action="lang"]')?.focus();
}

function applyLanguage() {
  document.documentElement.lang = locale;
  document.documentElement.dir = dir(locale);
  document.title = tr('app.name');
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#/"]');
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!link && !action) return;
  if (performance.now() - drawnAt < TAP_GUARD_MS) {
    event.preventDefault();
    return;
  }
  if (link) {
    event.preventDefault();
    go(link.getAttribute('href'));
    return;
  }
  if (action === 'back') goBack();
  if (action === 'lang') switchLanguage();
});

window.addEventListener('popstate', (event) => {
  const target = (event.state?.trail?.length ?? 1) - 1;
  const direction = target < depth ? 'back' : 'forward';
  depth = target;
  render(direction);
  window.scrollTo(0, event.state?.scrollY ?? 0);
});

history.scrollRestoration = 'manual';
if (!Array.isArray(history.state?.trail)) {
  history.replaceState({ trail: [location.hash || homeHref()], scrollY: 0 }, '', location.hash || homeHref());
}
depth = history.state.trail.length - 1;
applyLanguage();
render('none');
// The first screen was not reached by a tap: nothing to guard against yet.
drawnAt = -Infinity;
