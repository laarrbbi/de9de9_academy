# Code and schema review — De9De9 Academy

**Date:** 2026-11-03
**Scope:** branch `claude/lucid-mendel-5oyuic` at `f5790bc`. The mobile app at the repository root: `www/`, `scripts/`, `content/lessons/`, `tests/`, `capacitor.config.json`, `package.json`, CI, and the configuration of the generated `android/` and `ios/` projects. The parked website in `web/` is out of scope, except where the app depends on it.
**Phase:** 1 of 4 — Code & Schema

## Summary

The app does what it says on its main paths: the 27 tests pass, every store link resolves to the exact slug the store's importer generates, and French and Arabic lessons agree on structure, numbers and quiz answers. The problems are at the edges between the app and the outside world. The most important one is a safety issue: the lessons send people to buy a "vérificateur d'absence de tension" on a shelf whose only tester is a **non-contact** one, which those same lessons teach cannot prove a wire is dead (F1). Next come two platform settings that don't do what the README claims (Arabic iPhones likely open in French, F2; status-bar styling silently does nothing, F3), two navigation defects reproduced on a phone-sized browser (F4, F5), two build traps (F6, F7), and tool links to shelves that don't stock the tool (F8, F9). Fix F1 first; most of the rest are small changes.

Counts by severity: Critical 0 · High 2 · Medium 7 · Low 10

## Scope and method

- **Read:** all of `www/js/`, `www/css/style.css`, `www/index.html`, `scripts/content.mjs`, `scripts/build-content.mjs`, `scripts/app-icons.py`, `tests/`, `package.json`, `capacitor.config.json`, `.github/workflows/ci.yml`, `README.md`, `CLAUDE.md`, the 24 lesson files (structure, numbers, tools, quizzes), `ios/App/App/Info.plist`, `ios/App/App.xcodeproj/project.pbxproj` (regions), `android/variables.gradle`, the git-ignore rules of both native projects. Capacitor sources read for each platform claim: `@capacitor/android` `SystemBars.java`, `Bridge.java`, `native-bridge.js`; `@capacitor/ios` `SystemBars.swift`; `@capacitor/core` `dist/index.js`; `@capacitor/app` `AppPlugin.java`; `@capacitor/cli` `dist/tasks/copy.js`, `dist/common.js`. Store side (read-only): `apps/api/seeders/catalogue-import.ts`, `apps/api/seeders/data/catalogue-taxonomy.ts`, `docs/catalog/catalogue-produits.xlsx` (sheet "Catalogue", the importer's source).
- **Ran:** `npm test` (27/27 pass) · `npm run build` (12 fr, 12 ar) · `npm audit` (3 moderate, see handoffs) · the build against deliberately broken copies of `content/` in a scratch directory (stray `.DS_Store`, byte-order mark, missing language folder, determinism) · the store importer's own `slugify`/`arSlugify` on its real taxonomy data, compared with `www/js/shelves.js` · the catalogue workbook read with openpyxl to list each linked shelf's products · Playwright probes on a phone context (Chromium, 390×844, touch) for the back stack, double tap, and the app without `content.js` · WCAG contrast computed for every text/background token pair in use · every character in the lessons and interface text checked against the bundled font subsets · a number-by-number comparison of each French lesson with its Arabic version.
- **Environment:** Node 22.22.0, npm 10.9.4, Python 3.13 with Pillow and openpyxl, Playwright 1.56.1 with Chromium; a cloud container with 4 CPUs and no Android SDK, emulator, Xcode or phone.
- **Could not verify:** anything that needs a real phone or emulator (see "Not verified"). Product availability was checked against the catalogue workbook the importer reads, not against the live store database, which was not reachable.

There is no HTTP API and no database. Following the reference, the "API contract" here is the outbound store link format (`/{locale}/c/{slug}`), and the "schema" is the lesson frontmatter rules, the generated `www/js/content.js`, and the two keys stored on the phone. Pagination (A6) does not apply.

## Findings

| ID | Severity | Effort | Finding | Location |
|----|----------|--------|---------|----------|
| F1 | High | S | The "VAT" tool links to a shelf whose only tester is non-contact, and no lesson warns that non-contact testers can't prove a wire is dead | `content/lessons/{fr,ar}/electricite/testeur-et-multimetre.md:10`, `remplacer-une-prise.md:12` |
| F2 | High | S | Arabic iPhones very likely open the app in French: the iOS project declares English only *(unverified on a device)* | `ios/App/App/Info.plist:7-8`, `www/js/progress.js:31` |
| F3 | Medium | S | The per-screen status-bar calls do nothing, so dark-mode phones show white status icons over the white top bar | `www/js/main.js:330-335` |
| F4 | Medium | S | "Retour au parcours" pushes a new screen: after finishing a track, the back arrow walks back through every lesson | `www/js/main.js:354-361` |
| F5 | Medium | S | A quick double tap on a list row navigates two screens deep | `www/js/main.js:387-397` |
| F6 | Medium | S | `npx cap sync` without `npm run build` ships an app with no lessons: a blank white screen | `package.json:11-17`, `.gitignore:6` |
| F7 | Medium | S | A `.DS_Store` file (created by macOS Finder) breaks the lesson build with a misleading "unknown track" error | `scripts/content.mjs:127-129` |
| F8 | Medium | S | The card-magic tools and the magic track link to a shelf that sells no playing cards | `www/js/tracks.js` (magie), `content/lessons/{fr,ar}/magie/*.md:9` |
| F9 | Medium | S | Five more tool links point to shelves that don't stock that tool | see details |
| F10 | Low | S | Seven small-text colour pairs are just under 4.5:1 contrast | `www/css/style.css` tokens |
| F11 | Low | S | Ω, ⎓ and ⏚ are outside the bundled fonts, and they carry meaning in the electricity lessons | `content/lessons/{fr,ar}/electricite/*` |
| F12 | Low | S | Screen-reader focus is lost after a language switch; quiz success and retry are not announced | `www/js/main.js:374-379`, `www/js/quiz.js:28-46` |
| F13 | Low | S | Two controls are under the 44px touch target: shop links (32px) and the language button (40px) | `www/css/style.css:303, 438` |
| F14 | Low | S | Any failure while loading or rendering leaves a blank page with no message | `www/js/main.js:337-352`, `www/index.html` |
| F15 | Low | S | The lesson parser gives misleading errors for a byte-order mark or trailing spaces, and a raw `ENOENT` for a missing language folder | `scripts/content.mjs:68-70, 127` |
| F16 | Low | S | The track-screen shelf button is tagged `utm_medium=lesson`, like the tool links | `www/js/shelves.js:40`, `www/js/main.js:187` |
| F17 | Low | S | Progress is keyed by file name: renaming or moving a published lesson silently drops readers' progress on it | `www/js/progress.js`, `scripts/content.mjs:102` |
| F18 | Low | M | Lesson rules, tracks and shelves are duplicated in the parked `web/`, which will drift | `web/src/content.config.ts`, `web/src/data/` |
| F19 | Low | S | Watch mode ignores edits to `tracks.js` and `shelves.js` | `scripts/build-content.mjs:41-48` |

Every Medium and High finding except F2 was reproduced by running something (F3 and F6 from source plus a run, F8/F9 from the catalogue data). F2 is inferred from the project files and platform behaviour, and marked unverified.

## Details

### F1 — The "VAT" tool links to a non-contact tester, and no lesson warns about non-contact testers

**Severity:** High · **Effort:** S · **Location:** `content/lessons/fr/electricite/testeur-et-multimetre.md:10`, `content/lessons/fr/electricite/remplacer-une-prise.md:12` (and the Arabic copies); shelf `travaux-electricite`

**Evidence**
Both lessons list the tool `Vérificateur d’absence de tension (VAT)` with `shelf: travaux-electricite`. In the store's catalogue workbook (sheet "Catalogue", the importer's source), the Électricité shelf holds exactly three products:

```
Travaux :: Électricité
    - Testeur de tension sans contact
    - Prises & interrupteurs (lot)
    - Rallonges / enrouleurs chantier
```

The lesson teaches (testeur-et-multimetre.md:47) that a "tournevis testeur" *« ne prouve jamais l’absence de tension »*, and that only a two-probe VAT, tested on a live socket before and after, can say a circuit is dead. A non-contact tester has the same limitation as the screwdriver tester. Neither lesson mentions non-contact testers.

**Impact**
A reader taps "Voir sur De9De9" next to "VAT", finds a "testeur de tension sans contact", reasonably assumes it is the tool the lesson asked for, and uses it for the step that comes before touching the wires of a socket (`remplacer-une-prise`, `risk: high`). That is exactly the failure the lesson exists to prevent.

**Fix**
1. Remove `shelf: travaux-electricite` from the VAT tool in both lessons and both languages, until the store sells a two-pole VAT.
2. In `testeur-et-multimetre.md` (fr and ar), add the non-contact tester to the "trois outils" table, with the same verdict as the screwdriver tester: it can show a wire is live, never that it is dead.
3. Ask the store team to stock a two-pole VAT. That's a product decision, not code.

**Verify**
`npm test` (the parity test checks the shelf change is made in both languages), then open both lessons in the app: the VAT row has no store link, and the table names the non-contact tester.

### F2 — Arabic iPhones very likely open the app in French *(unverified on a device)*

**Severity:** High · **Effort:** S · **Location:** `ios/App/App/Info.plist:7-8`, `ios/App/App.xcodeproj/project.pbxproj:121-126`, `www/js/progress.js:31`

**Evidence**
The app picks its first-launch language from `navigator.language` (`progress.js:31`: `/^ar\b/i.test(navigator.language || '') ? 'ar' : 'fr'`). The iOS project declares a single language: `CFBundleDevelopmentRegion = en`, `knownRegions = (en, Base)`, and no `CFBundleLocalizations`. In a WKWebView, `navigator.language` follows the languages the *app* declares, not just the phone's setting, so an app that declares only English is reported as English.

**Impact**
On iOS, every reader starts in French, including on a phone set to Arabic. The README promises "The app opens in Arabic on an Arabic phone". Android is not affected: its WebView reports the system language.

**Fix**
Declare both languages in the iOS app: add to `Info.plist`

```xml
<key>CFBundleLocalizations</key>
<array>
  <string>fr</string>
  <string>ar</string>
</array>
```

Optionally also add `fr` and `ar` to `knownRegions` in Xcode (Project › Info › Localizations).

**Verify**
On an iPhone or the simulator with the phone language set to Arabic, a first launch (fresh install) opens in Arabic. Before the fix, it opens in French.

### F3 — The per-screen status-bar calls do nothing

**Severity:** Medium · **Effort:** S · **Location:** `www/js/main.js:330-335`

**Evidence**
```js
window.Capacitor?.Plugins?.SystemBars?.setStyle({ style: dark ? 'DARK' : 'LIGHT', bar: 'StatusBar' })?.catch(() => {});
```
`Capacitor.Plugins.SystemBars` only exists when `@capacitor/core`'s JavaScript has registered it (`@capacitor/core/dist/index.js:174`, `Plugins[pluginName] = proxy` inside `registerPlugin`). The native bridge, which is the only Capacitor JavaScript this app loads, provides `nativePromise` but creates no plugin objects (`@capacitor/android/.../native-bridge.js:991-999`). `www/` never loads `@capacitor/core`, so the optional chain short-circuits and nothing happens. With no style set, SystemBars follows the phone's theme (`SystemBars.java:327-332`, `SystemBars.swift:25`): dark icons in light mode, **white icons in dark mode**.

**Impact**
In dark mode the clock, battery and signal icons are white over the white top bar of every track and lesson screen, so they're unreadable. In light mode the home header gets dark icons instead of the intended light ones; that's still readable, at 4.42:1. The README's "light icons on the teal home screen, dark icons elsewhere" is not true today.

**Fix**
Cheapest: set the style once in `capacitor.config.json` and delete the dead call.

```json
"plugins": { "SystemBars": { "style": "LIGHT", "initialViewportFitValueHint": "cover" } }
```

`LIGHT` means dark icons, which are readable on both the white screens and the teal header (4.42:1). `initialViewportFitValueHint` tells Android up front that the page uses `viewport-fit=cover`, avoiding a layout shift at launch (`SystemBars.java:117-120`). If you want light icons on the home screen, vendor `node_modules/@capacitor/core/dist/capacitor.js` into `www/vendor/` (as De9De9 Play vendors matter.js), load it before `main.js`, and call `Capacitor.registerPlugin('SystemBars').setStyle(...)`. Update the README line either way.

**Verify**
On an Android phone in dark mode: open a track screen, and the status-bar icons are dark and readable.

### F4 — "Retour au parcours" pushes a new screen instead of going back

**Severity:** Medium · **Effort:** S · **Location:** `www/js/main.js:354-361`

**Evidence**
Every in-app link goes through `go()`, which always pushes a new history entry, including links to a screen that's already on the stack: the pager's "Retour au parcours", the success panel's "Retour au parcours", and in practice any link back up. Reproduced on a phone context: Magie → lesson 1 → "Leçon suivante" ×2 → "Retour au parcours" lands on the track at **depth 5**. Then:

```
back-arrow trail to home: La double soulevée…  ->  Le tour des 21 cartes  ->  La carte clé…  ->  Magie de cartes  ->  Apprenez les bons gestes.
```

That's five taps on the back arrow to get home from a track screen. Android's back button follows the same path.

**Impact**
Finishing a track is the normal, successful path. From the track screen the reader expects "back" to mean home; instead it replays the lessons they just finished, which reads as the app being broken.

**Fix**
Keep the trail of hashes in `history.state` (for example `{depth, trail: [...hashes]}`). In `go(hash)`, if `hash` is already in the trail at index `i`, call `history.go(i - depth)` (pop back to it) instead of pushing. Otherwise push with `trail.concat(hash)`. This also stops the same screen from appearing twice in the stack.

**Verify**
Repeat the probe: after "Retour au parcours", one back tap reaches home. Add it to the Phase 2 tests.

### F5 — A quick double tap navigates two screens deep

**Severity:** Medium · **Effort:** S · **Location:** `www/js/main.js:387-397`, `www/css/style.css` (`touch-action: manipulation`)

**Evidence**
Two touch taps 80 ms apart on the "Plomberie" row of the home screen ended on `#/l/plomberie/deboucher-un-evier` at depth 2. The first tap opened the track; the second landed on whatever was under the finger on the new screen, the first lesson row. `touch-action: manipulation` (correctly) removes the double-tap-zoom delay, so both taps become clicks, and the new screen is already in place for the second one.

**Impact**
People who double-tap out of habit, or whose first tap seemed slow, land somewhere they didn't choose, often a lesson in the wrong track.

**Fix**
Ignore navigation taps for about 350 ms after a screen change: record `performance.now()` in `render()`, and in the click handler return early when a nav link or `data-action` is hit inside that window. External links are not affected.

**Verify**
Repeat the double-tap probe: the reader stays on the track screen.

### F6 — `npx cap sync` alone ships an app with no lessons

**Severity:** Medium · **Effort:** S · **Location:** `package.json:11-17`, `.gitignore:6` (`www/js/content.js`)

**Evidence**
`www/js/content.js` is generated and git-ignored. `npm run sync`, `npm run android` and `npm run ios` build it first, but `npx cap sync` and `npx cap copy` (the commands Capacitor's own docs and Android Studio workflows use) copy `www/` as it is. Served without `content.js`, the app shows nothing:

```
app children: 0 | visible text: ""
errors: [ 'Failed to load resource: the server responded with a status of 404 (File not found)' ]
```

**Impact**
On a fresh clone, or after deleting the generated file, a developer who runs the standard Capacitor command builds an app that opens to a white screen, with no message (see F14).

**Fix**
Capacitor runs an npm script named `capacitor:copy:before` before every copy and sync (`@capacitor/cli/dist/tasks/copy.js:49`, `common.js:132-142`). Add:

```json
"capacitor:copy:before": "node scripts/build-content.mjs"
```

**Verify**
Delete `www/js/content.js`, run `npx cap sync`, and check that `android/app/src/main/assets/public/js/content.js` exists.

### F7 — A `.DS_Store` file breaks the lesson build with a misleading error

**Severity:** Medium · **Effort:** S · **Location:** `scripts/content.mjs:127-129`

**Evidence**
With an empty `content/lessons/fr/.DS_Store` (macOS Finder creates one in any folder opened in it):

```
content/lessons/fr/.DS_Store: unknown track. Add it to www/js/tracks.js first.
```

`loadLessons()` treats every entry in a language folder as a track folder. The same file inside a track folder is ignored, because only `.md` files are read there.

**Impact**
The team works on macOS (the store repository's screenshots carry macOS file names). A content author opens the lessons folder in Finder, and the build, the tests and CI all fail with advice to edit `tracks.js`, which is wrong.

**Fix**
In `loadLessons()`, skip entries whose name starts with `.` and entries that aren't directories (`readdirSync(dir, { withFileTypes: true })`, keep `isDirectory()`). Optionally add `.DS_Store` to `.gitignore`, which only stops it being committed and doesn't fix local builds.

**Verify**
`touch content/lessons/fr/.DS_Store && npm run build` succeeds. Add this case to the content tests.

### F8 — The card-magic tools link to a shelf with no playing cards

**Severity:** Medium · **Effort:** S · **Location:** `www/js/tracks.js` (track `magie`, `shelf: 'evenement-musique-spectacle'`), `content/lessons/{fr,ar}/magie/la-carte-cle.md:9`, `tour-des-21-cartes.md:9`, `double-soulevee.md:9`

**Evidence**
All three magic lessons link their deck of cards to `evenement-musique-spectacle`, and the magic track screen shows "Voir le rayon « Musique et spectacle »". In the catalogue workbook that shelf holds exactly: *Enceinte portable Bluetooth, Jeu de lumière DJ (par LED), Machine à confettis, Micro sans fil UHF*. No product anywhere in the workbook mentions playing cards or magic.

**Impact**
Every "Voir sur De9De9" link in the magic track leads to speakers and DJ lights. That's a broken promise on the most shop-oriented button in the lesson.

**Fix**
Until the store sells cards: remove `shelf` from the three card tools (both languages), and make `shelf` optional on a track so the magic track shows no shelf button. When the store adds cards, put both back, pointing at the right shelf. Already listed under "Not done yet" in the README; this finding makes it a release blocker for the magic track.

**Verify**
`npm test`; open the magic track and its lessons: no store link leads to a shelf without cards.

### F9 — Five more tool links point to shelves that don't stock the tool

**Severity:** Medium · **Effort:** S · **Location:** listed below

**Evidence**
Every `tool → shelf` link checked against the catalogue workbook:

| Tool (lesson) | Linked shelf | Shelf actually sells |
|---|---|---|
| Détecteur de fuite (`plomberie/fuite-d-eau.md:14`) | Plomberie | furet/ventouse, mitigeur, flexibles + téflon + joints, coupe-tubes |
| Lampe frontale (`electricite/remplacer-une-prise.md:18`) | Électricité | testeur sans contact, prises & interrupteurs, rallonges |
| Lampe frontale ou torche (`electricite/tableau-electrique.md:10`) | Électricité | same |
| Pince à dénuder (`electricite/remplacer-une-prise.md:16`) | Outillage général | perceuse, coffret outils, niveau laser, mètre laser, multimètre, détecteur de câbles, EPI |
| Joints de rechange ou **cartouche de mitigeur** (`plomberie/robinet-qui-goutte.md:13`) | Plomberie | joints yes, cartridges no |

Correct links, for the record: ventouse, furet, flexibles/joints, téflon → Plomberie; multimètre, gants, lunettes → Outillage général; prise → Électricité; housse, kit de nettoyage → Climatisation; stabilisateur → Groupe électrogène (Énergie). Screwdrivers and an adjustable spanner only exist inside the "Coffret outils multi-usage": acceptable.

**Impact**
Same as F8 on a smaller scale: the link promises an item the shelf doesn't have.

**Fix**
Remove `shelf` from those tools (both languages) until the store stocks them, or ask the store to add a head torch, a leak detector and wire strippers. All three are already in the store's own sourcing plan (`docs/catalog/categories-produits-dropshipping.md`). A build-time check isn't possible offline: the app has no copy of the catalogue.

**Verify**
`npm test`; re-run the workbook comparison and every remaining link matches a product.

### F10 — Seven small-text colour pairs are just under 4.5:1

**Severity:** Low · **Effort:** S · **Location:** tokens in `www/css/style.css`

**Evidence**
Computed WCAG ratios for text actually rendered at 12–15px: `.chip-teal` brand-deep on brand-tint 4.15; promo CTA brand-deep on accent-tint 4.19; `.chip-neutral` and `.note` ink-muted on canvas 4.37; home lead white at 94% on brand-deep 4.39; `.resume small` brand-deep on canvas 4.47; `.chip-low` success-deep on success-tint 4.49. Everything else passes (buttons 4.75, body text 4.65 and up, tip boxes 10.9).

**Impact**
Slightly harder to read in bright sunlight. These are misses of a few hundredths, not unreadable text.

**Fix**
Darken the text tokens a notch where they sit on tints, for example `--brand-deep` text on tints `#1a6f69`, `--ink-muted` `#646e80`, `--success-deep` `#1d7650`, and drop the 94% opacity on the home lead.

**Verify**
Re-run the contrast script; all pairs ≥ 4.5.

### F11 — Ω, ⎓ and ⏚ are outside the bundled fonts

**Severity:** Low · **Effort:** S · **Location:** `content/lessons/{fr,ar}/electricite/testeur-et-multimetre.md` (Ω, ⎓), `remplacer-une-prise.md` (⏚)

**Evidence**
Every character in the lessons and interface text was checked against the Poppins latin and Cairo arabic `unicode-range`s in `style.css`; these three are the only ones not covered. They fall back to the phone's system fonts.

**Impact**
On a phone whose system fonts lack ⎓ (U+2393) or ⏚ (U+23DA), the reader sees an empty box where the lesson tells them which multimeter setting or which socket terminal to use. Unverified on devices.

**Fix**
Say it in words beside the symbol (« V⎓, le V suivi d’une ligne pleine et d’une ligne pointillée »; « la borne de terre, marquée ⏚ ou d’un symbole de râteau »), in both languages.

**Verify**
Read the two lessons on a low-end Android phone.

### F12 — Focus and announcements

**Severity:** Low · **Effort:** S · **Location:** `www/js/main.js:374-379`, `www/js/quiz.js:28-46`

**Evidence**
After a language switch, `document.activeElement` is `BODY`: the button that was tapped is destroyed by the re-render (behavior inventory B9). Passing the quiz reveals the success panel, which is not in a live region and not focused; retry only scrolls.

**Impact**
Screen-reader users lose their place after switching language, and aren't told they passed.

**Fix**
After `switchLanguage()`, focus the new `[data-action="lang"]`. Give the success panel `tabindex="-1"` and focus it when shown. On retry, focus the first radio.

**Verify**
Check `document.activeElement` after each action, or test with TalkBack.

### F13 — Two controls are under the 44px touch target

**Severity:** Low · **Effort:** S · **Location:** `www/css/style.css:438` (`.shop-link` 32px), `:303` (`.lang-btn` 40px)

**Evidence**
`min-height: 32px` and `min-height: 40px`. Everything else is at least 44px (`.icon-btn` 44, `.btn` 48, `.option` 48).

**Impact**
Easy to miss, especially "Voir sur De9De9" next to the tool name.

**Fix**
`min-height: 44px` on both. The tools list has the room.

**Verify**
Measure the bounding boxes in the phone probe.

### F14 — Any load or render failure leaves a blank page

**Severity:** Low · **Effort:** S · **Location:** `www/js/main.js:337-352`, `www/index.html`

**Evidence**
See F6: a missing module gives zero children in `#app` and an empty page. The same happens for any exception thrown while rendering a screen. There's no error handler and nothing for the reader to see.

**Impact**
A future bug shows up as a white screen that can't be diagnosed from a user report.

**Fix**
A few lines of static fallback in `index.html` ("La page n’a pas pu s’afficher. Fermez et rouvrez l’application." in both languages) that `main.js` replaces on first render, plus a `window.addEventListener('error', …)` that keeps the fallback visible.

**Verify**
Remove `content.js`: the fallback message shows.

### F15 — The lesson parser's error messages mislead

**Severity:** Low · **Effort:** S · **Location:** `scripts/content.mjs:68-70, 127`

**Evidence**
A lesson saved with a byte-order mark gives `missing the "---" frontmatter block at the top`, although the block is there. Trailing spaces after `---` give the same message. A missing `content/lessons/ar/` gives a raw `ENOENT: no such file or directory, scandir …`.

**Impact**
Content authors lose time chasing the wrong problem.

**Fix**
Strip a leading `﻿`, allow `[ \t]*` after both `---` lines, and check the locale folders exist with a message naming them.

**Verify**
Re-run the three broken-copy cases: each builds, or fails with a message that names the actual problem.

### F16 — Track-screen shelf clicks are tagged as lesson clicks

**Severity:** Low · **Effort:** S · **Location:** `www/js/shelves.js:40`, `www/js/main.js:187`

**Evidence**
`shelfUrl()` hard-codes `utm_medium: 'lesson'`, and the track screen's "Voir le rayon" button uses it too (campaign `<track>`).

**Impact**
The store can't tell track-button clicks from tool links, apart from the campaign naming.

**Fix**
Add a `medium` parameter to `shelfUrl()` and pass `'track'` from the track screen.

**Verify**
Inspect the two hrefs on a track and a lesson screen.

### F17 — Progress is keyed by file name

**Severity:** Low · **Effort:** S · **Location:** `www/js/progress.js:4-6`, `scripts/content.mjs:102`

**Evidence**
Finished lessons are stored as `"<track>/<slug>"`, where the slug is the file name. Nothing maps old keys to new ones.

**Impact**
Renaming or moving a published lesson file silently resets that lesson for every reader. Stale keys are harmless.

**Fix**
Write the rule into `CLAUDE.md`: never rename a published lesson file. If a rename is ever unavoidable, add a small `{old: new}` map applied in `readDone()`.

**Verify**
Documentation change; nothing to run.

### F18 — Lesson rules and data are duplicated in the parked website

**Severity:** Low · **Effort:** M · **Location:** `web/src/content.config.ts`, `web/src/data/shelves.ts`, `web/src/data/tracks.ts`

**Evidence**
The website validates the same lessons with its own zod schema, and keeps its own copies of tracks and shelves.

**Impact**
When F1, F8 or F9 change the shelves, the parked website keeps the old links. If it is ever revived, two rule sets will have drifted.

**Fix**
Decide the website's fate. Delete `web/` if it isn't coming back. Otherwise have it import `www/js/tracks.js`, `shelves.js` and `scripts/content.mjs` instead of its copies.

**Verify**
`grep -r "SHELVES" web/src` finds only imports.

### F19 — Watch mode ignores `tracks.js` and `shelves.js`

**Severity:** Low · **Effort:** S · **Location:** `scripts/build-content.mjs:41-48`

**Evidence**
Only `content/lessons/` is watched, and the two modules are imported once, so a changed shelf key is not seen until the watcher is restarted.

**Impact**
A confusing "unknown shelf" error that persists after it was fixed.

**Fix**
Say so in the README's "Write a lesson" section (restart `npm run watch` after editing those files). Not worth code.

**Verify**
Documentation change.

## Behavior inventory

The contract of the app as found, with stable IDs for Phases 2–4. Generated by the inventory pass and kept as written; notes record observed behaviour.

| ID | Behavior | Location | Notes |
|----|----------|----------|-------|
| B1 | On startup the app sets history.scrollRestoration='manual', seeds history.state to {depth:0, scrollY:0} when it is null (turning an empty hash into '#/'), restores the in-memory depth from history.state, applies the language, and renders the current hash with no animation and no focus move. | `www/js/main.js:407-411` | Checked in Chromium (Playwright, 390x844): a fresh load with no hash gives '#/' and state {depth:0}. A reload in the middle of the stack keeps state {depth:2}, so on-screen back still uses history.back(). |
| B2 | Route '#/' (or an empty hash) renders the home screen: a dark teal header with the logo, an 'Academy' tag, the language button, the h1 and the lead; a progress card (done/total for the current locale, a bar, and a resume link or an all-done message); the list of tracks; a store promo card; and a safety note. | `www/js/main.js:65-139` | Each track row shows the group eyebrow, track name, lesson count, n/total done and a bar. The screen returns dark:true, which drives the status bar (B51). |
| B3 | Route '#/t/<track>' renders the track screen when <track> is a TRACKS id with at least one lesson in the current locale. It shows a top bar with a back arrow, a head card (icon, group, h1 name, tagline, n/total done with a bar, a primary CTA and an outbound shelf button), then an ordered lesson list. Each row has its number (a check when done), title, summary and chips. | `www/js/main.js:141-193, 320-322` | Lesson numbers are positions in the array (i+1), not the frontmatter `order`. Parity rules keep the two equal (B31). |
| B4 | Route '#/l/<track>/<lesson>' renders the lesson screen when the track resolves and a lesson of that track in the current locale has slug <lesson>. It shows a top bar '<track name> · i/n', the eyebrow 'Leçon i', h1 title, lead summary, chips (minutes, level label, risk label with chip-<risk> style) and a done chip, a safety aside if `safety` is set, a tools card, the Markdown body, a 'call a pro' section if callAPro is not empty, the quiz, and a pager. | `www/js/main.js:239-316, 323-326, 48-53` | lesson.html is inserted unescaped (main.js:309). It is trusted build-time content; see phase 4. Risk labels: low='Sans danger', medium='Prudence', high='Sécurité d'abord' (i18n.js:32-34). The safety aside also renders on a low-risk lesson if that lesson has safety text. |
| B5 | When a track or lesson route does not resolve, the current history entry is replaced (no new entry) with '#/' and the home screen renders. Hashes that already parse as home render home but keep their original text in the address bar. | `www/js/main.js:337-344; www/js/routes.js:7-12` | Observed: '#/t/nope' and '#/l/plomberie/nope' change to '#/'; '#/x/y' and '#garbage' stay as typed. '#/t/magie/' (trailing slash) and '#//t//x' are accepted as track routes, because empty segments are dropped. Segments are never URI-decoded. |
| B6 | Clicking any a[href^='#/'] is intercepted and calls go(hash). If hash equals location.hash, nothing happens. Otherwise go() saves window.scrollY into the current entry's state, increments depth, pushes {depth, scrollY:0}, renders with direction 'forward' (enter-forward animation; focus goes to the h1 with preventScroll), and scrolls to the top. | `www/js/main.js:354-361, 387-393; www/css/style.css:160-167` | The 220ms translateX animation flips direction in RTL through --enter-x (style.css:89-95) and is turned off under prefers-reduced-motion. The 'next lesson' and 'back to track' links are forward pushes too, even when the target screen is already lower in the stack. |
| B7 | The on-screen back arrow (data-action='back' in the top bar) calls history.back() when depth > 0. At depth 0 it replaces the current entry with parentHref(route) at {depth:0, scrollY:0}, renders with direction 'back', and scrolls to the top. | `www/js/main.js:363-372, 394-395, 55-61` | Observed after a direct link to a lesson: back goes lesson -> track -> home, all through replaceState, and history.length stays the same. The home screen has no top bar or back arrow. |
| B8 | On popstate (browser or Android back/forward), the target depth is event.state.depth (0 when state is null). The direction is 'back' if the target is below the current depth, otherwise 'forward'. The handler sets depth, re-renders from the hash, and scrolls to event.state.scrollY (0 if missing), so a screen left by a forward tap is restored to the scroll offset it had. | `www/js/main.js:399-405` | Observed: scroll offset 375 was restored as 375. The offset is saved only when you leave through go(); leaving with back does not save it, so browser-forward returns to 0 or the last saved value. A hand-typed hash, or a same-document navigation, gives state null, which resets depth to 0 (observed); the on-screen back then goes up a level instead of back. |
| B9 | After a forward or back render, keyboard and screen-reader focus moves to the new screen's h1 (tabindex=-1) without scrolling. The first render and a language switch (direction 'none') do not move focus. | `www/js/main.js:348-351, 113, 178, 301` | Observed: after a language switch, document.activeElement is BODY, because the button that was clicked is destroyed by innerHTML. No aria-live announcement is made when the screen changes. |
| B10 | Opening the app straight onto a track or lesson hash renders that screen at depth 0. The back arrow then walks up the hierarchy (lesson -> track -> home) instead of leaving the app. | `www/js/main.js:408, 363-372; www/js/routes.js:18-23` | There is no appUrlOpen listener and no custom URL scheme, so a 'deep link' here means a web URL or hash only. A Capacitor cold start loads index.html with no hash, so the native app always starts at home. |
| B11 | parseRoute(hash) returns {name:'home'}, {name:'track', track}, or {name:'lesson', track, lesson}. It coerces the input with String(), strips a leading '#' and optional '/', splits on '/', drops empty segments, and maps ['t', x] to track and ['l', x, y] to lesson; anything else is home. It never throws. | `www/js/routes.js:7-12` | The leading '#' is optional ('t/plomberie' parses as a track). Segments are not decoded ('a%20b' stays as is). Covered by tests/routes.test.mjs:6-23. |
| B12 | homeHref() returns '#/', trackHref(id) returns '#/t/<id>', and lessonHref(lesson) returns '#/l/<lesson.track>/<lesson.slug>', with no encoding. parentHref(route) returns trackHref(route.track) for a lesson route and '#/' for any other route. | `www/js/routes.js:14-23` | Round-trips with parseRoute only for slug-safe ids. File and track names are limited to [a-z0-9-] for lessons (B30); track ids are not validated. |
| B13 | nextLesson(lessons, doneSet) returns the first element of the array, in array order, whose .key is not in doneSet, or undefined when every key is done. | `www/js/routes.js:25-29` | Keys in doneSet that match no lesson are ignored. Tested in tests/routes.test.mjs:30-36. |
| B14 | t(locale, key) returns STRINGS[locale][key], falling back to STRINGS.fr[key] and then to the key itself. dir(locale) returns 'rtl' for 'ar' and 'ltr' for anything else. STRINGS is exported with 45 keys each in fr and ar. | `www/js/i18n.js:106-114` | Verified that t('en', ...) throws a TypeError, because STRINGS['en'] is undefined; only 'fr' and 'ar' ever reach it. I checked that the fr and ar key sets are identical (45 = 45). Interface strings go into HTML unescaped (trusted). |
| B15 | readDone() returns a Set<string> of finished lesson keys, parsed from the JSON array in localStorage['de9de9-academy:done:v1']. Non-array JSON gives an empty set, non-string entries are dropped, and any parse or storage error gives an empty set. | `www/js/progress.js:5, 8-15` | Verified: a stored '{"a":1}' renders as 0/12. Callers re-read storage on every render (main.js:66, 142, 244). |
| B16 | markDone(key) reads the current set, adds key, and writes it back as a JSON array. Storage errors are swallowed, so progress is silently not saved. | `www/js/progress.js:17-23` | The key is not validated. Verified that with localStorage throwing, the app still renders and works within the session but remembers nothing. |
| B17 | readLocale() returns a saved 'fr' or 'ar' from localStorage['de9de9-academy:locale']. Otherwise it returns 'ar' when navigator.language matches /^ar\b/i, else 'fr'. saveLocale(locale) stores the value without validating it. Both swallow storage errors. | `www/js/progress.js:6, 25-38` | Only navigator.language is consulted, not navigator.languages. A saved invalid value such as 'en' is ignored (verified: falls back to fr). Verified that an 'ar-DZ' browser opens in Arabic, RTL. |
| B18 | setupQuiz(form, {incomplete, score, onPass}) attaches submit and retry handlers. The form must contain fieldset[data-answer], [data-quiz-status], [data-quiz-submit], [data-quiz-retry] and [data-quiz-success]. It returns undefined and throws if form is null. | `www/js/quiz.js:3-48` | It compares the checked input.value (a string) with the data-answer string. main.js:287 calls it after every lesson render, through screen.setup(). |
| B19 | shelfUrl(shelf, locale, campaign) returns `${STORE_URL}/${locale}/c/${encodeURIComponent(SHELVES[shelf].slug[locale])}?utm_source=academy-app&utm_medium=lesson&utm_campaign=<campaign>`. | `www/js/shelves.js:37-42` | Verified: an unknown shelf key throws a TypeError; an unknown locale produces the slug 'undefined'. utm_medium is hard-coded to 'lesson', even for the track-screen shelf button. |
| B20 | storeUrl(locale, medium) returns `${STORE_URL}/${locale}?utm_source=academy-app&utm_medium=<medium>`, with no campaign. | `www/js/shelves.js:44-46` | Only used for the home promo, with medium 'home' (main.js:127). |
| B21 | Static data modules export STORE_URL and SERVICES_URL (both 'https://de9de9.dz'), TRACKS (ordered {id, name{fr,ar}, tagline{fr,ar}, group{fr,ar}, shelf}), LOCALES ['fr','ar'], SHELVES (key -> {slug{fr,ar}, name{fr,ar}}), and the generated LESSONS. | `www/js/config.js:4,9; www/js/tracks.js:5-48; www/js/shelves.js:10-35` | TRACKS order sets course order (B31). LOCALES order makes 'fr' the parity reference (content.mjs:158). SERVICES_URL is a placeholder pointing at the store home (README.md:104-106). |
| B22 | parseLesson(text) normalizes CRLF and requires the text to start with '---\n' and to have a closing '\n---\n'. It returns {data: parsed YAML (null becomes {}), body}. Otherwise it throws Error('missing the "---" frontmatter block at the top'); YAML syntax errors propagate. | `scripts/content.mjs:67-72` | Verified: a UTF-8 BOM, or a closing '---' at end of file with no trailing newline, is rejected. YAML that parses to a scalar or an array is passed on and caught as 'unknown field' problems. |
| B23 | lessonProblems(data) returns an array of rule-violation messages for one lesson's frontmatter (the rules are B28 and B29). An empty array means the lesson is valid. | `scripts/content.mjs:24-65` | It throws if data is null or undefined (Object.keys); parseLesson prevents that. Tested in tests/content.test.mjs:35-53. |
| B24 | loadLessons() reads content/lessons/<locale>/<track>/*.md for every locale. It parses and validates each file and returns {fr: Lesson[], ar: Lesson[]} sorted by course order. Each lesson has key, track, slug, locale, the frontmatter fields with defaults (safety null, shelf null, callAPro []), html from marked (GFM), and structure counts. It throws a path-prefixed error on the first invalid lesson, unknown track directory or bad file name. | `scripts/content.mjs:83-138` | Non-.md files inside a track directory are ignored. Any other entry directly under a locale directory (for example .DS_Store) throws 'unknown track'. A missing locale directory throws ENOENT. The first error stops everything, so only one lesson is reported per run. |
| B25 | languageFreeFacts(lesson) returns {order, minutes, level, risk, hasSafety, shelves (each tool's shelf in order, including null), callAProCount, quiz [{options count, answer}], structure {sections: h2 count, tips: blockquote count, tables: table count}}. | `scripts/content.mjs:140-153` | Tool count is compared indirectly through the length of the shelves array. Titles, text, tool names, list or step counts and h3 headings are not compared. |
| B26 | contentProblems(lessons) returns messages for: keys missing in either language; any key whose languageFreeFacts differ from the 'fr' reference (compared with JSON.stringify); and, per locale and track, `order` values that are not exactly 1, 2, 3... | `scripts/content.mjs:155-183` | A track with no lessons passes the order check. Tested in tests/content.test.mjs:8-19, 55-59. LESSONS_DIR is also exported (content.mjs:13). |
| B27 | Shared rules decide which screen content appears. A track is listed on home and can be routed to only if it has at least one lesson in the current locale. A tool gets a store link only if it has a shelf. The 'call a pro' section renders only when callAPro is not empty. | `www/js/main.js:19, 83, 255, 267-273` | In the current content, the three magic lessons have no callAPro, and two climatisation tools have no shelf (from my dump of content.js). |
| B28 | Lesson frontmatter rules. Only these fields are allowed: title, summary, order, minutes, level, risk, safety, tools, callAPro, quiz. title and summary are non-blank text; order and minutes are positive integers; level is beginner or intermediate; risk is low, medium or high; safety is optional non-blank text. tools has at least one entry, each with a non-blank name and an optional shelf that is a SHELVES key. callAPro is an optional list of non-blank text. quiz has 1 to 5 questions, each with non-blank question text, 2 to 4 non-blank options, an integer answer index within range, and a non-blank explanation. | `scripts/content.mjs:17-62` | The shelf check uses the `in` operator, so inherited keys pass. Verified: shelf 'constructor' gives no problems, but shelfUrl would then throw at render time. minutes has no upper bound, and the body is not validated. The parked site has its own zod copy of these rules (web/src/content.config.ts:15-50). |
| B29 | A lesson whose risk is not 'low' must have non-blank `safety` text and a non-empty `callAPro` list, otherwise the build and the tests fail. | `scripts/content.mjs:48-52` | An invalid risk value (for example 'extreme') also triggers these two messages (verified). Low-risk lessons may still carry safety or callAPro, and those render (for example robinet-qui-goutte has 3 callAPro). CLAUDE.md also bans teaching refrigerant, panel, gas and new-circuit work, but nothing in code enforces that; it relies on content review. |
| B30 | A lesson's slug is its file name without .md and must match ^[a-z0-9]+(-[a-z0-9]+)*$. Its key is '<track>/<slug>'. Its track directory must be a TRACKS id. | `scripts/content.mjs:97-98, 102, 127-130` | Track ids are not checked against a slug pattern. |
| B31 | Within each locale, lessons are sorted by their track's position in TRACKS and then by `order`. Each track's orders must be exactly 1..n. The app takes 'Leçon i', 'i/n', prev/next and the resume order from array position. | `scripts/content.mjs:135, 174-181; www/js/main.js:241-243, 298, 300` | The sort is stable; duplicate orders are flagged by contentProblems. |
| B32 | Every lesson key must exist in both fr and ar, and its language-free facts must match exactly: order, minutes, level, risk, whether it has safety text, tool shelves (count and order), callAPro count, quiz option counts and answers, and h2, blockquote and table counts. | `scripts/content.mjs:155-172; tests/content.test.mjs:13-19` | Quiz option order must match across languages, because answers are compared by index. |
| B33 | Home resume card: it links to the first not-done lesson across all tracks in course order. Its label is 'Commencer' when no lesson is done and 'Continuer' otherwise, followed by the track name. When every lesson is done it shows the 'allDone' message instead. The done count only includes stored keys that match a current lesson. | `www/js/main.js:66-81, 120-122` | Done lessons stay done in both languages (B44). |
| B34 | Track CTA: it links to the track's first not-done lesson, labelled start (no lesson done) or continue. When all of the track is done, it shows 'Revoir le parcours' and links to the track's first lesson. | `www/js/main.js:142-148, 186` |  |
| B35 | Lesson 'after' target: the next lesson in the same track by position, labelled 'Leçon suivante'; on the last lesson, the track screen, labelled 'Retour au parcours'. The quiz success button and the pager's end link both use it. The pager also shows a previous-lesson link when there is one, and an empty span otherwise. | `www/js/main.js:242-247, 275-282, 233` | It never crosses into the next track. Going back to the track through this link pushes a new history entry (B6) instead of popping one. |
| B36 | Quiz pass rule: every question must have an answer selected, and the lesson passes only when all answers are right; there is no partial pass. Otherwise the status line shows '<right> <score text> <total>', for example '2 bonnes réponses sur 3'. | `www/js/quiz.js:12-34` | Observed in Chromium. Quiz answers ship in the markup as data-answer, by design (quiz.js:1-2). |
| B37 | Language switching: the language button exists only on the home screen. It toggles the locale between fr and ar, saves it, sets <html lang> and dir and document.title, and re-renders the current screen in place with no history change and no animation. | `www/js/main.js:11, 111, 374-385, 396` | index.html ships lang=fr dir=ltr until the JS runs (index.html:2). The button carries lang=<other locale> and shows the other language's name. Track and lesson screens have no language switch. |
| B38 | Store links are built and tagged as follows. The track-screen shelf button uses shelfUrl(track.shelf, locale, campaign=track.id). Tool links (tools with a shelf only) use shelfUrl(tool.shelf, locale, '<track>-<slug>'). The home promo uses storeUrl(locale, 'home'). 'Trouver un professionnel' goes to SERVICES_URL with no tagging. Arabic UI links use /ar/c/<Arabic slug>. | `www/js/main.js:127, 187, 248, 255, 271` | Verified hrefs, for example 'https://de9de9.dz/fr/c/travaux-electricite?utm_source=academy-app&utm_medium=lesson&utm_campaign=electricite-remplacer-une-prise' and '/ar/c/%D8%A3%D8%B4%D8%BA%D8%A7%D9%84-%D9%83%D9%87%D8%B1%D8%A8%D8%A7%D8%A1?...&utm_campaign=electricite'. A lesson that uses the same shelf for several tools repeats the same link. |
| B39 | Outbound store contract: links target /{locale}/c/{slug}, where slug is the store importer's level-2 category slug. In French it is '<group slugFr>-<slugify(subcategory)>'; in Arabic it is '<group slugAr>-<arSlugify(Arabic sub name)>'. The storefront decodes the slug and resolves it for that locale. | `www/js/shelves.js:5-9; /home/user/de9de9/apps/api/seeders/catalogue-import.ts:229-248, 1396-1397, 1420-1421; /home/user/de9de9/apps/storefront/src/app/[locale]/c/[slug]/page.tsx:56-60` | I did not run the slugs against a live store database. The magic track deliberately links to Évènement › Musique et spectacle as a placeholder (README.md:101-103). The store keeps slug redirects when a shelf is renamed (catalogue-import.ts:67). |
| B40 | Quiz state machine. Start: unanswered. Submit with any question unanswered: show the 'incomplete' status and lock nothing. Submit with all answered (checked): each fieldset gets is-right or is-wrong and is disabled, explanations show, and the submit button hides. If all are right (passed): the status clears, the success panel shows and scrolls into view, and onPass runs. Otherwise (failed): the score and the retry button show. Retry: form.reset() clears every selection, right ones included; classes are removed, fieldsets re-enabled, status cleared, retry hidden, submit shown, and the view scrolls to question 1. | `www/js/quiz.js:10-47; www/css/style.css:525-532` | Observed: wrong -> '2 bonnes réponses sur 3', retry visible, all fieldsets disabled; after retry, 0 inputs checked. 'Passed' stays final until the screen re-renders, and a re-render shows the quiz unanswered again even for a done lesson. |
| B41 | A lesson goes from not done to done only when its quiz is passed: markDone(lesson.key) runs and the article gets .is-done, which shows the done chip. The change is saved, and later renders show it as the track-list check, the home and track counters and bars, and the done chip. There is no way to mark a lesson not done again. | `www/js/main.js:290-293, 244, 299, 154, 68, 86; www/css/style.css:394-404` | Passing again is idempotent. Observed: storage held ['electricite/remplacer-une-prise'] and the article class 'content lesson is-done'. |
| B42 | Locale state: fr <-> ar via B37. The chosen value persists across launches and wins over the phone's language. Screens reached afterwards through back or forward render in the new locale. | `www/js/main.js:374-379; www/js/progress.js:26-38` | Android configChanges includes 'locale' (AndroidManifest.xml:13), so a system language change does not restart the activity. The locale is read only at startup (main.js:11). |
| B43 | Navigation depth state: an in-memory `depth` mirrors history.state.depth. go() adds 1. popstate sets it from the entry's state (0 when the state is null). Up-navigation at depth 0 keeps it at 0. A reload restores it from history.state. | `www/js/main.js:13, 357-358, 364-371, 400-402, 409` | Depth only counts entries this app created. It is lost when an entry has no state (B8). |
| B44 | Progress keys are '<track>/<slug>', the same in both languages, so a lesson finished in one language counts as finished in the other. They are stored as a JSON array under 'de9de9-academy:done:v1'. The locale is stored as a raw string under 'de9de9-academy:locale'. | `www/js/progress.js:4-6; scripts/content.mjs:102; README.md:43` | Renaming a track id or a lesson file silently orphans saved progress: the old key stays in storage and is ignored by the counts. Progress lives on the phone and is not tied to an account (README.md:109). |
| B45 | www/js/content.js is generated by the build and ignored by git. It contains the '// GENERATED ...' header and `export const LESSONS = {fr:[...], ar:[...]}`. Each lesson has key, track, slug, locale, title, summary, order, minutes, level, risk, safety\|null, tools[{name, shelf\|null}], callAPro[], quiz[{question, options, answer, explanation}] and html; `structure` is stripped out. | `scripts/build-content.mjs:18-26; .gitignore:5-6` | Checked the current file's keys. CLAUDE.md forbids editing it by hand. Output is deterministic for the same input; running `npm run build` during this review rewrote it from unchanged content. |
| B46 | Every lesson exists in both fr and ar at the same <track>/<lesson>.md path (currently 12 fr and 12 ar, 3 per track), and the build and npm test both enforce it. | `scripts/content.mjs:162-165; tests/content.test.mjs:8-19; CLAUDE.md:12-14` | npm test: 27/27 passed; build output: 'content: 12 fr, 12 ar lessons'. |
| B47 | Track ids are shared by TRACKS, the content/lessons/<locale>/<track>/ directories, www/assets/icons/<id>.svg and the route segments. Every track.shelf and tool.shelf must be a SHELVES key. SHELVES slugs must mirror the store. | `www/js/tracks.js:1-4; scripts/content.mjs:42, 128; www/js/main.js:74, 90, 175` | The build and tests check tool shelves only. A track's own shelf (used in main.js:187) and the icon file are not checked. |
| B48 | content/lessons/ is also read by the parked Astro website (web/), which validates the same frontmatter with its own zod schema. | `web/src/content.config.ts:14-50` | There are two validators for one format, and they can drift. For example, web checks shelves with z.enum(SHELF_KEYS) from web/src/data/shelves. web/ is out of scope, apart from this shared input. |
| B49 | Outbound links (track shelf, tool shelves, 'find a professional', home promo) are <a target='_blank' rel='noopener'>, which Capacitor sends to the phone's browser. | `www/js/main.js:20-22, 127; node_modules/@capacitor/ios/Capacitor/Capacitor/WebViewDelegationHandler.swift:108-121, 334-338; node_modules/@capacitor/android/capacitor/src/main/java/com/getcapacitor/Bridge.java:389` | On iOS, a navigation to a host outside the app is opened with UIApplication.shared.open. On Android, Bridge.launchIntent handles links to other hosts. This is from reading the code only; not verified on a device (README.md:94-97). |
| B50 | Each screen sets the system bars. Home sets <meta theme-color> to #1f8079 and calls SystemBars.setStyle({style:'DARK', bar:'StatusBar'}) for light icons. Track and lesson screens set #ffffff and style 'LIGHT' for dark icons. The call goes through window.Capacitor.Plugins.SystemBars, errors are swallowed, and in a plain browser it does nothing. | `www/js/main.js:330-335, 104, 168, 285` | SystemBars is built into the Capacitor 8 native bridge (Bridge.java:664; iOS CapacitorBridge.swift:324) and is not imported in JS. The Android mapping is setAppearanceLightStatusBars(!DARK) (SystemBars.java:292), so DARK gives light icons. Observed the theme-color switch in the browser; the native call was not exercised. |
| B51 | Safe areas: --sat and --sab come from Capacitor's --safe-area-inset-* variables on Android, or from env(safe-area-inset-*) elsewhere (with viewport-fit=cover). The home header and the sticky top bar pad their top by --sat; screens pad their bottom by 32px + --sab. | `www/css/style.css:85-88, 156, 178-179, 286; www/index.html:5` | On Android the --safe-area-inset-* values are injected by SystemBars when insetsHandling is 'css', the default (SystemBars.java:56, 243-269). Left and right insets are not used. |
| B52 | The Android back button is handled by @capacitor/app (listed in capacitor.plugins.json). The app registers no JS backButton listener, so the native handler calls WebView.goBack() when canGoBack is true, and that fires popstate (B8). | `node_modules/@capacitor/app/android/src/main/java/com/capacitorjs/plugins/app/AppPlugin.java:46-62; android/app/src/main/assets/capacitor.plugins.json` | README.md:83-85 says back on the home screen leaves the app. But AppPlugin.java:49-52 does nothing when canGoBack is false, and the callback stays enabled and consumes the press. This is unverified on a device. Up-navigation at depth 0 uses replaceState, so it leaves no WebView history behind. iOS has no hardware back, and the swipe-back gesture is not enabled, so only the on-screen arrow goes back there. |
| B53 | The app works offline. Lessons (bundled in content.js), self-hosted Poppins and Cairo woff2 fonts, icons and images all ship in www/. Only outbound store and pro links need the network. There is no remote fetch and no service worker. | `README.md:10-11; www/css/style.css:8-50; www/index.html:9-11` | grep found no http(s) URLs in index.html or style.css. |
| B54 | Mobile platform layer: zoom is not locked (the viewport meta has no maximum-scale or user-scalable); :hover is gated behind (hover: hover) and (pointer: fine); .tap, .btn, .icon-btn and .lang-btn have :active feedback; tap highlight is removed; touch-action is manipulation; overscroll-behavior is none; layouts use 100dvh; reduced motion is honoured; RTL mirrors through logical properties, and direction-bearing icons carry .flip, which is scaleX(-1) under [dir=rtl]. | `www/index.html:5; www/css/style.css:100-146, 165-168, 277-282` | These are the conventions from CLAUDE.md:24-30. I skimmed style.css and did not review it rule by rule. |
| B55 | `npm run build` loads and validates every lesson, checks parity, writes www/js/content.js and prints 'content: N fr, N ar lessons -> www/js/content.js'. On any problem it prints the problems and exits 1, leaving the previous content.js untouched. | `scripts/build-content.mjs:13-29, 49-51; package.json:11` | loadLessons stops at the first invalid file, and contentProblems lists all parity problems at once. |
| B56 | `npm run watch` builds once, then watches content/lessons/ recursively and rebuilds 100ms after the last change. Failures are logged and the process keeps running with the last good content.js. | `scripts/build-content.mjs:41-48; package.json:12` | Edits to www/js/tracks.js or shelves.js, which the rules import, do not trigger a rebuild, and the imported modules stay cached, so the watcher must be restarted after those edits. It needs recursive fs.watch (Node >= 22 per engines). |
| B57 | `npm start` builds the lessons and then serves www/ with `python3 -m http.server 5174`. The server does not start if the build fails. | `package.json:13; .claude/launch.json` | python3 is required. The server binds to all interfaces, as the README intends for testing on a phone. |
| B58 | `npm test` runs `node --test tests/*.test.mjs`. The content tests (rules, parity and drift detection) read content/lessons/ directly, not content.js. The route tests cover parseRoute, the href builders, parentHref and nextLesson. | `package.json:14; tests/content.test.mjs:1-59; tests/routes.test.mjs:1-36` | No test covers main.js, quiz.js, progress.js, shelves.js, i18n.js or the DOM; that gap is for phase 2. 27 tests pass. |
| B59 | Native builds: `npm run sync`, `npm run android` and `npm run ios` run the build, then `cap sync` (for one platform or both), then `cap open` for android and ios. capacitor.config.json sets appId com.avalonlbs.de9academy, appName 'De9De9 Academy', webDir www and backgroundColor #f7f8f9. | `package.json:15-17; capacitor.config.json:1-6` | android/app/src/main/assets/public is a git-ignored copy of www/ made by sync (android/.gitignore:96). No plugin config (SystemBars or App) is set, so the defaults apply. |
| B60 | `python3 scripts/app-icons.py` uses Pillow to draw from resources/logo.png. For 5 densities it overwrites the Android legacy square, round and adaptive-foreground launcher icons; it also overwrites every drawable*/splash.png, the iOS 1024px opaque AppIcon-512@2x.png and every Splash.imageset PNG (2732x2732). | `scripts/app-icons.py:1-70` | It assumes `cap add` has already created those files and folders. The adaptive icon background comes from values/ic_launcher_background.xml (#FFFFFF), which the script does not set. |
| B61 | CI runs on every push and pull request, on ubuntu-latest with Node 22 and an npm cache: npm ci, then npm test, then npm run build, then `node --check` on every www/js/*.js file. | `.github/workflows/ci.yml:1-21` | There is no browser or end-to-end run; main.js is only syntax-checked. app-icons.py, cap sync and the native builds are not run. The web/ site is not built. |

## Handoffs

**→ Phase 2 (tests)**
- `www/js/main.js` has no automated tests in the repository. The 38 phone-browser checks used during development live outside the repo. Navigation (B5–B10, B43), the quiz wiring (B36, B40, B41), and language switching (B37, B42) are protected only by those. F4 and F5 need regression tests.
- `loadLessons()` stray-file cases (F7, F15) and the catalogue-dependent link checks (F8, F9) are untested.
- CI runs no browser test.

**→ Phase 3 (performance)**
- `www/js/content.js` (136 KB, both languages) is loaded and parsed at startup. Measure cold start on a low-end Android phone; consider one file per language.
- Only `poppins-latin-400` is preloaded; Arabic readers wait on Cairo. Measure first render in Arabic.

**→ Phase 4 (security)**
- Lesson HTML is inserted with `innerHTML` (`main.js:309`), and `marked` passes raw HTML through without sanitizing, so anyone who can commit a lesson can ship script into the app. Decide between a sanitizer and a build-time rule rejecting raw HTML.
- No Content-Security-Policy in `www/index.html`.
- `npm audit`: 3 moderate advisories (`uuid` via `xcode` via `@capacitor/cli`), development tooling only.
- Android `allowBackup` is on (template default); it backs up progress only. Confirm that's intended.

## Recommended order

1. **F1:** the only finding that can hurt someone. Content and data only, both languages, plus a request to the store team.
2. **F6 + F7:** two small build fixes that stop a blank app and a broken build; one commit.
3. **F2 + F3:** configuration only (`Info.plist`, `capacitor.config.json`); verify both on real phones in the same session, and correct the README.
4. **F4 + F5:** both in `main.js` navigation; fix and test together.
5. **F8 + F9:** tool links; coordinate with the store team, since stocking the items is the better fix.
6. **Low bucket:** F10–F13 (accessibility) together; F14–F19 as convenient.

## Considered and not recommended

- **Progress-bar fill contrast (1.62:1 non-text):** every bar has its count written beside it, so the bar is decorative. Not worth changing the brand teal.
- **A hand-typed hash resets the depth to 0 (B8 note):** cannot happen in the app, which has no address bar.
- **A wrong quiz answer reveals the explanation, and with it the right answer:** deliberate. The quiz teaches; it doesn't grade.
- **Western digits in Arabic text render in Poppins rather than Cairo:** consistent with the store's prices and counts; not a defect.
- **Store slugs:** all six were recomputed with the importer's own functions on its taxonomy data and match byte for byte, in French and Arabic. No change needed.
- **`npm start` needs Python:** same convention as De9De9 Play.

## Not verified

- **No phone, emulator or simulator was available.** From source only: F2 (iOS language), F3's on-screen result, F11 (glyph rendering), Android back via `@capacitor/app` (B52), safe areas (B51), and links opening in the phone's browser (B49).
- **The live store database was not reachable.** Product availability (F1, F8, F9) comes from the catalogue workbook the importer reads; the live catalogue may already differ.
- **Lesson facts:** this phase checked French/Arabic agreement (structure, every number, quiz answers, ordinals) and specific technical points. It is not a review by a qualified electrician or AC technician, nor a native-speaker review of the Arabic, and should not be read as one.
- **One reviewer:** the planned multi-agent run stopped at a usage limit after the inventory. This review was done directly, and every Medium and High finding except F2 was reproduced by running something.
