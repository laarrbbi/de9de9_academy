# De9De9 Academy — agent guide

A Capacitor mobile app (iOS and Android) of bilingual (FR/AR, RTL) lessons
linked to the De9De9 store (`laarrbbi/de9de9`). Plain HTML, CSS and ES modules
in `www/`, no framework or bundler, like the sibling app De9De9 Play
(`laarrbbi/de9de9-games`). Read `README.md` first.

## Hard conventions

- **Every lesson exists in both languages**, at the same path under
  `content/lessons/fr/` and `ar/`. The build and `npm test` fail if the two
  drift (lessons, quiz answers, tool shelves, section, tip and table counts).
- **Safety is data, not prose.** A lesson with `risk: medium|high` must have
  `safety` and `callAPro` (enforced in `scripts/content.mjs`). Lessons teach
  what a non-professional can do safely and say plainly when to stop. Never
  teach refrigerant handling, work inside the electrical panel, gas, or new
  circuits.
- **Facts must be checkable.** Methods are verified before they are written
  (the card tricks were simulated). No invented statistics or prices.
- **Store links** go through `shelfUrl()` with a key from `www/js/shelves.js`.
  The slugs mirror the store's importer
  (`apps/api/seeders/catalogue-import.ts` in `laarrbbi/de9de9`); the Arabic
  store needs the Arabic slug. Links out of the app use `target="_blank"` so
  Capacitor opens them in the phone's browser.
- **Design** follows the store's `docs/design/DESIGN-SYSTEM.md`; tokens live
  at the top of `www/css/style.css`. Use logical properties (`inline-start`,
  `margin-inline`) so RTL mirrors itself; direction-bearing icons get `.flip`.
- **Mobile platform layer:** never lock zoom; gate `:hover` behind
  `(hover: hover) and (pointer: fine)`; give every control `:active` feedback;
  read safe areas through `--sat` / `--sab`.
- **Navigation:** screens are hash routes (`www/js/routes.js`) pushed onto
  history, so Android's back button works through `@capacitor/app`. Keep it
  installed.
- Interface text goes in `www/js/i18n.js`, in both languages.
- `www/js/content.js` is generated: edit `content/lessons/`, never that file.
- `web/` is the parked website. Don't change it unless asked.

## Reviews

Code reviews follow `.claude/skills/code-review-pipeline/` (the same skill the
store uses): four phases, one at a time, stopping for a go-ahead between
phases. Reports go in `reports/`.

## Commands

- `npm start` (build lessons + serve `www/` on :5174) · `npm run watch`
- `npm test` · `npm run build`
- `npm run android` / `npm run ios` · `python3 scripts/app-icons.py`
