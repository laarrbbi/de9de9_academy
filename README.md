# De9De9 Academy

Short lessons and tips on what De9De9 sells: how to unblock a sink, read an
electrical panel, look after an air conditioner, or perform a first card trick.
Each lesson lists the tools it needs with a link to the right shelf of the
store, says when to stop and call a professional, and ends with a short quiz.

French and Arabic (right to left), same brand and design tokens as the store
(`laarrbbi/de9de9`, `docs/design/DESIGN-SYSTEM.md`). A static site built with
[Astro](https://astro.build): no server, no database.

## Run it

```bash
npm install
npm run dev            # http://localhost:4321
```

| Command | What |
|---|---|
| `npm run dev` | Dev server with live reload |
| `npm run build` | Static site in `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm test` | French and Arabic lessons are in step |
| `npm run check` | Type and schema check |
| `npm run check:links` | After a build: every internal link resolves |

## What's in it

| Track | Store shelf | Lessons |
|---|---|---|
| Plomberie | Travaux › Plomberie | Unblocking a sink · Fixing a dripping tap · Finding and fixing a leak |
| Électricité | Travaux › Électricité | Understanding the panel · Voltage tester and multimeter · Replacing a socket |
| Climatisation | Travaux › Climatisation | How an AC works · Maintenance you can do · Settings and troubleshooting |
| Magie de cartes | Évènement › Musique et spectacle | The key card · The 21-card trick · The double lift |

12 lessons, each in French and Arabic. Progress (finished lessons) is kept
on the reader's device, shared between both languages.

## Where things are

| Path | What |
|---|---|
| `src/content/lessons/<fr\|ar>/<track>/<lesson>.md` | The lessons, one file per language |
| `src/content.config.ts` | Lesson schema: what every lesson must contain |
| `src/data/tracks.ts` | The tracks: names, taglines, store group and shelf |
| `src/data/shelves.ts` | Store shelf slugs (FR and AR) and the link builder |
| `src/config.ts` | Store and services addresses |
| `astro.config.mjs` | The Academy's own public address (`SITE`) |
| `src/i18n/ui.ts` | Interface text in both languages |
| `src/components/TrackIcon.astro` | Track icons, in the store's icon style |
| `src/scripts/progress.ts` | Quiz checking and progress |
| `src/styles/global.css` | Design tokens copied from the store |
| `tests/content.test.mjs` | French/Arabic parity test |

## Write a lesson

1. Create `src/content/lessons/fr/<track>/<lesson>.md` and the same path under `ar/`.
2. Copy the frontmatter of an existing lesson and fill it in:
   - `risk`: `low`, `medium` or `high`. Anything above `low` must have a
     `safety` rule and a `callAPro` list; the build fails otherwise.
   - `tools`: add `shelf:` to link a tool to the store (keys in `src/data/shelves.ts`).
   - `quiz`: 1 to 5 questions, `answer` is the index of the right option, from 0.
3. Write the body in Markdown: `##` sections, numbered steps, and a
   `> **Astuce** :` blockquote for a tip.
4. `npm test` checks that both languages have the same lessons, quiz answers,
   tool links, sections, tips and tables.

To add a track: add it to `src/data/tracks.ts`, draw its icon in
`TrackIcon.astro`, then write its lessons.

## Deploy

`npm run build` produces a plain static site in `dist/`. Any static host
works (nginx on the store's VPS, Vercel, Netlify, Cloudflare Pages). Set the
public address in `astro.config.mjs` (`SITE`) and in `public/robots.txt` first.

## Not done yet

- **Content review.** The lessons were written for this first version. Have
  them reread by the team in both languages, and the electricity and AC
  safety content by a qualified electrician and AC technician, before launch.
- **Magic shelf.** The store's catalogue documents have no card or magic
  products, so the magic lessons link to Évènement › Musique et spectacle.
  Point them at the right shelf in `src/data/shelves.ts` once it exists.
- **Addresses.** `academy.de9de9.dz` is a placeholder. "Find a professional"
  opens the store home: point `SERVICES_URL` at the services page.
- **Progress is per device.** It is not tied to De9De9 accounts.
- **No photos or diagrams** in the lessons yet. Step photos would help most
  for the tap, socket and double lift lessons.
- Store links carry `utm_source=academy`. Check that the store's analytics
  records them, to measure what the Academy brings in.
