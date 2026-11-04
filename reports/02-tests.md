# Tests — De9De9 Academy

**Date:** 2026-11-04
**Scope:** branch `claude/lucid-mendel-5oyuic`, after the Phase 1 fixes (`362bb34`). The root app; `web/` is out of scope.
**Phase:** 2 of 4 — Tests

## Summary

Before this phase, 4 of the 61 behaviors in the Phase 1 inventory were covered, 10 partly, and 45 not at all. The screens, which make up the code Phase 1 changed most (`main.js`, `quiz.js`), had no test. The coverage tool still reported 97%, because it never loaded them. The tests that did exist were weaker than they looked: rule tests passed if *any* problem was reported, and the parity tests would still pass if the comparison function returned a constant. This phase rewrote those, and added 47 unit tests and a 15-journey browser suite with its own CI job. Now 46 behaviors are covered, 8 partly, and 5 not at all; the remaining gaps are mostly what only a real phone can show. Every new test was checked by deliberately breaking the code it protects (9 mutations, all caught).

Counts by severity: Critical 0 · High 1 · Medium 4 · Low 4 (6 fixed in this phase, 3 open)

## Scope and method

- **Read:** every test in `tests/`, the Phase 1 behavior inventory (B1–B61, `reports/01-code-and-schema.md`), `package.json`, `.github/workflows/ci.yml`.
- **Ran:** `npm test` (81 tests, 0.37 s) · `npm run test:e2e` (15 tests, about 18 s; three consecutive green runs) · `node --test --experimental-test-coverage` · 9 mutation checks (code changed on purpose, the right test must fail, then restored; table below) · the new CI step (`npx cap copy android` with `content.js` deleted) locally.
- **Environment:** Node 22.22.0, npm 10.9.4, Playwright 1.56.1 with Chromium 141 (phone context 390×844, touch, `fr-FR` or `ar-DZ`).
- **Could not verify:** the CI workflow on GitHub itself (the change is pushed, but the run is not watched here); anything that needs a real phone (see "Not verified").

## Findings

| ID | Severity | Effort | Finding | Status |
|----|----------|--------|---------|--------|
| T1 | High | M | The screens had no tests: about 30 behaviors (navigation, quiz, language, store links, offline) were unprotected, including everything Phase 1 changed | Fixed: `tests/e2e/app.e2e.mjs`, CI job `screens` |
| T2 | Medium | S | Rule tests asserted "some problem was reported", not the rule's own message, so they could pass on an unrelated problem | Fixed: 20 rule cases, each checks its message |
| T3 | Medium | S | The 12 parity tests would pass if `languageFreeFacts()` returned a constant; only a quiz-answer drift was pinned | Fixed: 13 drift cases, one per compared fact, plus missing lessons and numbering |
| T4 | Medium | S | `progress.js`, `i18n.js`, `shelves.js` were untested: storage failures, language detection, Arabic URL encoding | Fixed: `tests/progress.test.mjs`, `tests/text-and-links.test.mjs` |
| T5 | Low | S | The coverage number (97%) hid that the UI modules were never loaded | Documented here; coverage is now reported after the gap table |
| T6 | Low | S | The native copy path (Phase 1 F6) was untested | Fixed: CI deletes `content.js`, runs `cap copy android`, checks it arrived |
| T7 | Medium | M | The store contract (slugs = importer output; each tool's shelf really sells it) is checked only by hand, across two repositories | **Open:** proposal below |
| T8 | Low | S | Device-only behaviors (status bar, safe areas, Android back, links handed to the browser, iOS first-launch language) have no automated check | **Open:** release checklist below |
| T9 | Low | S | `npm run watch`, `npm start` and `scripts/app-icons.py` are untested | **Open:** accepted, used by hand |

### Behavior coverage

Before: Covered 4 · Partial 10 · Uncovered 45. After: Covered 46 · Partial 8 · Uncovered 5 (2 not applicable).

| ID | Behavior | Before | After | Tests | Remaining gap |
|----|----------|--------|-------|-------|---------------|
| B1 | Startup: seed history, restore depth, first render | Uncovered | Partial | `tests/e2e/app.e2e.mjs` (every test starts the app; reload in the language test) | Reload in the middle of a stack keeps the trail: not asserted |
| B2 | Home screen | Uncovered | Covered | `tests/e2e/app.e2e.mjs` |  |
| B3 | Track screen | Uncovered | Covered | `tests/e2e/app.e2e.mjs` |  |
| B4 | Lesson screen (all 12, both languages) | Uncovered | Covered | `tests/e2e/app.e2e.mjs` |  |
| B5 | Unknown address → home, hash #/ | Uncovered | Covered | `tests/e2e/app.e2e.mjs` |  |
| B6 | In-app links: forward, back to a screen on the stack, double-tap guard | Uncovered | Covered | `tests/e2e/app.e2e.mjs`, `tests/routes.test.mjs` |  |
| B7 | On-screen back arrow (with and without history) | Uncovered | Covered | `tests/e2e/app.e2e.mjs` |  |
| B8 | System back/forward, scroll restored | Uncovered | Covered | `tests/e2e/app.e2e.mjs` |  |
| B9 | Focus after navigation and language switch | Uncovered | Partial | `tests/e2e/app.e2e.mjs` (language switch, quiz success) | Focus on the h1 after navigation: not asserted |
| B10 | Opened straight onto a lesson: back walks up | Uncovered | Covered | `tests/e2e/app.e2e.mjs` |  |
| B11 | parseRoute() | Covered | Covered | `tests/routes.test.mjs` |  |
| B12 | Screen addresses and parentHref() | Covered | Covered | `tests/routes.test.mjs` |  |
| B13 | nextLesson() | Covered | Covered | `tests/routes.test.mjs` |  |
| B14 | t() fallback, dir(), key parity | Uncovered | Covered | `tests/text-and-links.test.mjs` |  |
| B15 | readDone(): corrupt and blocked storage | Uncovered | Covered | `tests/progress.test.mjs` |  |
| B16 | markDone(): idempotent, never throws | Uncovered | Covered | `tests/progress.test.mjs` |  |
| B17 | Language: phone language, saved choice | Uncovered | Covered | `tests/progress.test.mjs`, `tests/e2e/app.e2e.mjs` |  |
| B18 | setupQuiz() contract | Uncovered | Covered | `tests/e2e/app.e2e.mjs` |  |
| B19 | shelfUrl(): slug per language, encoding, tags | Uncovered | Covered | `tests/text-and-links.test.mjs`, `tests/e2e/app.e2e.mjs` |  |
| B20 | storeUrl() | Uncovered | Covered | `tests/text-and-links.test.mjs` |  |
| B21 | Data modules: shelves, tracks, config | Uncovered | Covered | `tests/text-and-links.test.mjs`, `tests/content.test.mjs` |  |
| B22 | parseLesson(): BOM, CRLF, spaces, errors | Partial | Covered | `tests/content.test.mjs` |  |
| B23 | lessonProblems(): every rule | Partial | Covered | `tests/content.test.mjs` (20 cases, each checks its message) |  |
| B24 | loadLessons(): stray files, missing folder, unknown track | Partial | Covered | `tests/content.test.mjs` |  |
| B25 | languageFreeFacts(): every compared fact | Partial | Covered | `tests/content.test.mjs` (13 drift cases) |  |
| B26 | contentProblems(): missing lessons, drift, numbering | Partial | Covered | `tests/content.test.mjs` |  |
| B27 | What appears: tracks with lessons, links only with a shelf | Uncovered | Partial | `tests/e2e/app.e2e.mjs` | A track with no lessons in one language is hidden: not asserted |
| B28 | Frontmatter rules | Partial | Covered | `tests/content.test.mjs` |  |
| B29 | Risky lesson needs safety + call a pro | Partial | Covered | `tests/content.test.mjs` |  |
| B30 | Slug and track folder rules | Uncovered | Covered | `tests/content.test.mjs` |  |
| B31 | Lessons numbered 1..n per track | Partial | Covered | `tests/content.test.mjs` |  |
| B32 | FR/AR parity | Partial | Covered | `tests/content.test.mjs` |  |
| B33 | Home resume card: start, continue, all done | Uncovered | Covered | `tests/e2e/app.e2e.mjs` |  |
| B34 | Track call to action: start, continue, review | Uncovered | Covered | `tests/e2e/app.e2e.mjs` |  |
| B35 | After a lesson: next lesson or back to the track | Uncovered | Covered | `tests/e2e/app.e2e.mjs` |  |
| B36 | Quiz pass rule | Uncovered | Covered | `tests/e2e/app.e2e.mjs` |  |
| B37 | Language switch | Uncovered | Covered | `tests/e2e/app.e2e.mjs` |  |
| B38 | Store links per place, tagged | Uncovered | Covered | `tests/text-and-links.test.mjs`, `tests/e2e/app.e2e.mjs` |  |
| B39 | Store slugs = what the importer generates | Uncovered | Partial | Phase 1 script (by hand) | Cross-repo check: see T7 |
| B40 | Quiz state machine | Uncovered | Covered | `tests/e2e/app.e2e.mjs` |  |
| B41 | Lesson becomes done | Uncovered | Covered | `tests/e2e/app.e2e.mjs` |  |
| B42 | Language survives a restart | Uncovered | Covered | `tests/progress.test.mjs`, `tests/e2e/app.e2e.mjs` |  |
| B43 | Navigation state (trail in history) | Uncovered | Covered | `tests/e2e/app.e2e.mjs`, `tests/routes.test.mjs` |  |
| B44 | Progress counts in both languages | Uncovered | Covered | `tests/e2e/app.e2e.mjs` |  |
| B45 | content.js generated, not in git | Uncovered | Covered | CI (cap copy step), `tests/e2e/app.e2e.mjs` |  |
| B46 | Every lesson in both languages | Covered | Covered | `tests/content.test.mjs` |  |
| B47 | Track ids shared by data, folders, icons | Uncovered | Covered | `tests/text-and-links.test.mjs`, `tests/content.test.mjs` |  |
| B48 | Parked web/ reads the lessons | Uncovered | Uncovered | — | Parked; see Phase 1 F18 |
| B49 | Links out open the phone's browser | Uncovered | Partial | `tests/e2e/app.e2e.mjs` (target="_blank") | The actual hand-off: device only |
| B50 | Status bar style | Uncovered | Uncovered | — | Device only (config, Phase 1 F3) |
| B51 | Safe areas | Uncovered | Partial | `tests/text-and-links.test.mjs` (viewport-fit=cover) | Rendering: device only |
| B52 | Android back button | Uncovered | Partial | `tests/e2e/app.e2e.mjs` (history back) | The hardware button: device only |
| B53 | Offline; message instead of a blank page | Uncovered | Covered | `tests/e2e/app.e2e.mjs` |  |
| B54 | Platform rules: zoom, hover, tap feedback | Uncovered | Partial | `tests/text-and-links.test.mjs` (zoom, hover) | Tap feedback: visual |
| B55 | npm run build refuses broken content | Partial | Covered | CI + `tests/content.test.mjs` |  |
| B56 | npm run watch | Uncovered | Uncovered | — | Low value; documented |
| B57 | npm start | Uncovered | Uncovered | — | Used by hand every day |
| B58 | npm test | — | — | — | The suite itself |
| B59 | Native builds: cap sync builds the lessons | Uncovered | Covered | CI (cap copy android) |  |
| B60 | App icons script | Uncovered | Uncovered | — | Run by hand when the logo changes |
| B61 | CI | — | — | — |  |

### Mutation checks

Each line is a deliberate break in the code; the suite must go red, and it did. The code was restored after each one.

| Mutation | Caught by |
|----------|-----------|
| Parity stops comparing tool shelves | 2 drift tests |
| Parity stops comparing sections, tips and tables | 3 drift tests |
| Risky lessons no longer need a safety rule | the "safety rule" rule test |
| Lesson numbering no longer checked | the gap/duplicate numbering test |
| Language rule loosened from `/^ar\b/` to `/^ar/` (so `arn` would count as Arabic) | the phone-language test |
| Saved progress no longer filtered for non-strings | the corrupt-data test |
| Shelf links ignore the `medium` tag | the tagging test |
| Double-tap guard removed (`TAP_GUARD_MS = 0`) | the double-tap journey |
| Phase 1 F4 reverted (links to a screen on the stack push again) | both back-stack journeys |
| *(from the Phase 1 fixes)* hidden files no longer skipped by the loader | the stray-files test |

### Coverage, as a secondary number

`node --test --experimental-test-coverage` over the unit tests: 99.67% of lines, 95% of branches, 100% of functions in `scripts/content.mjs` and every module in `www/js/` that Node can load. `main.js`, `quiz.js` and `boot.js` run only in the browser and don't appear in that report; the browser journeys cover them. This number was 97% before this phase while covering far less, which is why it comes after the table.

## Details

### T1 — The screens had no tests

**Severity:** High · **Effort:** M · **Location:** `www/js/main.js`, `www/js/quiz.js`, `www/js/boot.js`

**Evidence**
Before this phase, `tests/` held `content.test.mjs` and `routes.test.mjs` only. Nothing loaded a screen. The 38 phone checks used during development lived in a scratch file, outside the repository and CI. Phase 1's two navigation defects (F4, F5) were found by hand for that reason.

**Impact**
Any change to navigation, the quiz, the language switch or the store links could break the app with CI still green.

**Fix (done)**
`tests/e2e/app.e2e.mjs`: 15 journeys in a phone-sized Chromium, with the existing `node:test` style and assertions, served by a 40-line Node server (`tests/e2e/server.mjs`, so no Python is needed). Each test names the behaviors it protects. Highlights:

- a reader finishes a lesson through a wrong answer, a retry and a pass; progress then shows on the track and the home screen (B3, B4, B33–B36, B40, B41);
- finishing a track and tapping "Retour au parcours" leaves home one tap away (B6, B7, B35, B43; Phase 1 F4);
- a double tap moves one screen (B6; Phase 1 F5); going back restores the scroll position (B8);
- every lesson opens without errors or sideways scrolling, in both languages (B4);
- store links: target, slug per language, tags, no link where the shelf lacks the tool (B19, B27, B38, B49);
- the app makes no network request of its own (B53), and shows a message if the lessons fail to load (B53; Phase 1 F14).

`npm run test:e2e` builds the lessons first. CI runs it in a separate job, `screens`, which installs Chromium.

**Verify**
`npm run test:e2e` → 15/15. Removing the tap guard or reverting F4 turns the matching journeys red (mutation table).

### T2 — Rule tests passed on any problem

**Severity:** Medium · **Effort:** S · **Location:** `tests/content.test.mjs`

**Evidence**
`assert.notDeepEqual(lessonProblems({ ...sound, ...change }), [])`: any reported problem satisfied the test, whichever rule fired.

**Fix (done)**
Each case pairs a broken field with the message its rule must produce, and asserts that message is present. The 7 original cases became 20, covering every rule in `lessonProblems()`: question count and option-count bounds, a negative answer, a missing explanation, a blank title, non-integer minutes, order 0, an unknown risk, a nameless tool, a malformed "call a pro". Also new: a low-risk lesson needs neither safety rule nor "call a pro".

### T3 — Parity tests would pass if the comparison did nothing

**Severity:** Medium · **Effort:** S · **Location:** `tests/content.test.mjs`

**Evidence**
`assert.deepEqual(languageFreeFacts(ar), languageFreeFacts(fr))` holds for any constant function. Only one test changed a fact (a quiz answer) and expected a report.

**Fix (done)**
One drift test per compared fact (order, minutes, level, risk, safety present, a tool's shelf, the number of tools, "call a pro" count, option count, quiz answer, sections, tips, tables), each changed in the Arabic copy only and expected to be reported against that lesson. Also: a lesson missing from either language, and a track numbered with a gap or a duplicate.

### T4 — Storage, language and links were untested

**Severity:** Medium · **Effort:** S · **Location:** `www/js/progress.js`, `www/js/i18n.js`, `www/js/shelves.js`

**Fix (done)**
`tests/progress.test.mjs` (9 tests, with a fake `localStorage` and phone language): fresh install, idempotent `markDone`, corrupt and wrong-typed saved data, blocked storage, the phone-language rule (`ar`, `ar-DZ`, `AR-dz`, `arn`, empty, missing), a saved choice winning over the phone, an invalid saved value. `tests/text-and-links.test.mjs` (9 tests): key parity and no empty strings, every key used by the screens exists, `t()`/`dir()` fallbacks, Arabic slug percent-encoding, the three tags, the store home link, slug formats, every track has an icon, zoom never locked and every `:hover` gated.

### T5 — The coverage number misled

**Severity:** Low · **Effort:** S

Node's coverage only sees files the tests import. Before this phase it reported 97% while the four UI modules weren't loaded at all. It is now reported after the behavior table, as a secondary number.

### T6 — The native copy path was untested

**Severity:** Low · **Effort:** S · **Location:** `.github/workflows/ci.yml`, job `app`

**Fix (done)**
New CI step: delete `www/js/content.js`, run `npx cap copy android` (no Android SDK needed), and fail unless `android/app/src/main/assets/public/js/content.js` exists. It pins Phase 1 F6. Run locally: passes.

### T7 — The store contract is only checked by hand (open)

**Severity:** Medium · **Effort:** M · **Location:** `www/js/shelves.js`, the `shelf:` fields of the lessons

**Evidence**
Phase 1 found 9 tool links to shelves that don't stock the tool (F1, F8, F9), and verified the six slugs by running the store importer's own functions. Both checks need the store repository (`laarrbbi/de9de9`), so neither can run in this repository's tests.

**Impact**
When the store renames a category or its catalogue changes, the app keeps linking to it, and nothing goes red.

**Proposed fix**
A script `scripts/check-store.mjs <path-to-de9de9>` that (1) recomputes each shelf's slugs with the importer's `slugify`/`arSlugify` on the taxonomy data and compares them byte for byte, and (2) lists every tool link whose shelf has no product mentioning the tool, as warnings to review. That is the Phase 1 check, made repeatable. Run it by hand before each release, or from the store's CI when the catalogue changes. It's not implemented yet because where it runs is a decision for the two teams.

### T8 — Device-only behaviors (open)

**Severity:** Low · **Effort:** S per release

No automated check runs on a phone. Proposed release checklist, about 15 minutes on one Android and one iPhone:

1. Android: the back button goes back one screen, and leaves the app from home (B52).
2. Both: status-bar icons are readable on the home and lesson screens, in light and dark mode (B50; Phase 1 F3).
3. Both: nothing is hidden under the notch or the gesture bar, on home, a track and a lesson (B51).
4. Both: "Voir sur De9De9" opens the phone's browser on the right shelf (B49).
5. iPhone set to Arabic, fresh install: the app opens in Arabic (Phase 1 F2).
6. Both: airplane mode, the app opens and lessons read fine (B53).

### T9 — Watch, start and the icons script (open, accepted)

**Severity:** Low

`npm run watch`, `npm start` and `scripts/app-icons.py` are used by hand, and break visibly when they break. Tests would cost more than they'd catch.

## Test health

- **One command each:** `npm test` (0.37 s) and `npm run test:e2e` (about 18 s). CI runs both, in two jobs.
- **No shared services:** the browser suite serves `www/` from a throwaway local server on a random port. The content tests that need broken data work on a temporary copy of the lessons and delete it afterwards.
- **Isolation:** every browser test opens a fresh context, so no storage leaks between tests. Unit tests reset the fake storage before each test.
- **Flakiness:** three consecutive green runs. One deliberate fixed wait remains: 320 ms before each tap, the length of the app's own double-tap guard. It's named `GUARD_MS` and explained where it's defined.
- **Fixtures:** lessons are real content (these tests are content checks by design). Rules are tested on one small synthetic lesson (`sound`) with one change at a time.

Phase 4's dependency upgrades will lean on this suite. Coverage is now good enough to make a Capacitor, `marked` or `yaml` upgrade safe to verify, except for what only a phone shows (T8).

## Recommended order

1. **T8:** run the device checklist once now, since Phase 1's F2 and F3 are configuration fixes that only a phone can confirm.
2. **T7:** decide where the store check runs, then write `scripts/check-store.mjs`; it protects against the one class of bug Phase 1 found most of.
3. **Partial behaviors** (B1, B9, B27): three small browser assertions (reload mid-stack, focus on the h1 after navigation, a track hidden when one language has no lessons), whenever the suite is next touched.

## Considered and not recommended

- **Screenshot comparison tests:** they break on every intended visual change and get disabled; the layout checks that matter (no sideways scrolling, sizes of touch targets) are asserted directly.
- **Mocking Capacitor in the browser tests:** the app calls no Capacitor API from JavaScript any more (Phase 1 F3); a mock would test the mock.
- **Raising the coverage number:** the modules Node can load are at 99.67%; the rest is covered by behavior, which is what counts here.
- **Testing `scripts/app-icons.py` pixel by pixel:** run rarely, checked by eye when run.

## Not verified

- The two CI jobs have not been watched running on GitHub.
- Everything in T8: no phone, emulator or simulator was available.
- The browser suite uses Chromium, which is Android's WebView engine. iOS uses WebKit, which was not run; layout differences on iPhone are possible.
