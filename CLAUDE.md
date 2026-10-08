# De9De9 Academy — agent guide

Static Astro site: bilingual (FR/AR, RTL) lessons linked to the De9De9 store
(`laarrbbi/de9de9`). Read `README.md` first.

## Hard conventions

- **Every lesson exists in both languages**, at the same path under
  `src/content/lessons/fr/` and `ar/`. `npm test` fails if the two drift
  (lessons, quiz answers, tool shelves, section and tip counts).
- **Safety is data, not prose.** A lesson with `risk: medium|high` must have
  `safety` and `callAPro` (enforced by `src/content.config.ts`). Lessons teach
  what a non-professional can do safely and say plainly when to stop. Never
  teach refrigerant handling, work inside the electrical panel, gas, or new
  circuits.
- **Facts must be checkable.** Methods are verified before they are written
  (the card tricks were simulated). No invented statistics or prices.
- **Store links** go through `shelfUrl()` with a key from `src/data/shelves.ts`.
  The slugs mirror the store's importer
  (`apps/api/seeders/catalogue-import.ts` in `laarrbbi/de9de9`); the Arabic
  store needs the Arabic slug.
- **Design** follows the store's `docs/design/DESIGN-SYSTEM.md`; tokens live
  in `src/styles/global.css`. Use logical properties (`inline-start`, `margin-inline`)
  so RTL mirrors itself. In a component `<style>`, write RTL rules as
  `:global([dir='rtl']) .x`: a bare `[dir='rtl'] .x` is scoped by Astro and
  never matches `<html dir>`.
- Interface text goes in `src/i18n/ui.ts`, in both languages.

## Commands

- `npm run dev` · `npm run build` · `npm run preview`
- `npm test` · `npm run check` · `npm run check:links` (after a build)
