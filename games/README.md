# Games

Practice games for LXDUNE: standalone web apps served from GitHub Pages. Content
lives in validated JSON beside each app's module; the module fetches it and renders
it. There is no build step.

The **Habit Studio** (`games/habit-studio/`) is the depth layer beside the Coach: a
guided studio for one habit at a time. It's in authoring (spec: `docs/habit-studio-pilot-spec.md`;
how to write its content: `games/habit-studio/AUTHORING.md`); there is no app yet.

These are separate from Fieldwork, the reckoner's game (`tools/reckoner/content/game/`,
published to `play/`).

```
games/
  _schema/
    coach.schema.json         JSON Schema for the Metacognition Coach's content
  metacognition-coach/
    index.html                the app page
    coach.js                  the app module (renderCoach) and content helpers
    content.json              units, steps and the game's habit descriptions
    CHANGELOG.md
```

## Metacognition Coach

A Duolingo-style practice game on the nine habits of the `metacognition-nsw-science`
framework. The explorer is the reference layer; the game builds fluency. Habit
names and phases come from the framework, and scenario contexts are vocabulary ids,
so neither is copied here.

**Address:** <https://thatswhatsnext.github.io/LXDUNE/games/metacognition-coach/>
(once on `main`). Add `?reviewer=1` for a toggle that unlocks every habit, for staff.

`index.html` calls `renderCoach()` from `coach.js`:

| Option | Default | |
|---|---|---|
| `mount` | `"lxd-coach"` | Id of the container element (or the element itself) |
| `explorerUrl` | `""` | An `http(s)` address turns "Go deeper" into a link to the explorer; empty names it without one |
| `allowReviewer` | `false` | `true` shows the reviewer toggle. Never stored |

The game's markup and CSS are scoped under `.lxd-mcg` and its ids are prefixed per
mount; `index.html` owns the page-level styles. The mount is stamped with
`data-mcg-version`, `data-mcg-content-hash` and `data-mcg-renderer`.

Progress is stored in this browser only, under `localStorage` key `lxd-mcg-v1`.
It is per browser and device, the next person on a shared computer sees it until
they reset, and clearing site data erases it. The storage belongs to the
`thatswhatsnext.github.io` origin, which the reckoner and Fieldwork share, so the
key is namespaced. Nothing leaves the browser.

The app is public while it is a prototype; students reach it through a link on
Moodle. Options for securing it later: `docs/metacognition-coach-access.md`.

## Checking

`npm run validate` (repo root) runs `scripts/validate-coach.js` after the framework
validator. It checks the structure, the seven-step sequence, options and feedback,
habit and vocabulary references, the `<b>`/`<i>` tag whitelist, and parity with the
approved source in `docs/handoffs/mcg-content.js`.

Run it locally with `python3 -m http.server 8000` from the repo root, then open
`http://localhost:8000/games/metacognition-coach/`.
