# Games

Practice games for LXDUNE, served from GitHub Pages and pasted into Moodle the
same way as the Framework Explorer. Content lives in validated JSON here; a module
in `moodle-blocks/` fetches it and renders it. There is no build step.

These are separate from Fieldwork, the reckoner's game (`tools/reckoner/content/game/`,
published to `play/`).

```
games/
  _schema/
    coach.schema.json         JSON Schema for the Metacognition Coach's content
  metacognition-coach/
    content.json              units, steps and the game's habit descriptions
    CHANGELOG.md
  preview.html                local preview through the real loader
```

## Metacognition Coach

A Duolingo-style practice game on the nine habits of the `metacognition-nsw-science`
framework. The explorer is the reference layer; the game builds fluency. Habit
names and phases come from the framework, and scenario contexts are vocabulary ids,
so neither is copied here.

Loader for a Moodle page:

```html
<div id="lxd-coach"></div>
<script type="module">
  import { renderCoach } from "https://thatswhatsnext.github.io/LXDUNE/moodle-blocks/metacognition-coach.js";
  renderCoach({ mount: "lxd-coach" });
</script>
```

| Option | Default | |
|---|---|---|
| `mount` | `"lxd-coach"` | Id of the container element (or the element itself) |
| `explorerUrl` | `""` | An `http(s)` address turns "Go deeper" into a link to the explorer; empty names it without one |
| `allowReviewer` | `false` | `true` shows a toggle that unlocks every habit. For staff pages only; never stored |

Everything is scoped under `.lxd-mcg`, with ids prefixed per mount. The mount is
stamped with `data-mcg-version`, `data-mcg-content-hash` and `data-mcg-renderer`.

Progress is stored in this browser only, under `localStorage` key `lxd-mcg-v1`.
It is per browser and device, the next person on a shared computer sees it until
they reset, and clearing site data erases it. Nothing leaves the browser.

## Checking

`npm run validate` (repo root) runs `scripts/validate-coach.js` after the framework
validator. It checks the structure, the seven-step sequence, options and feedback,
habit and vocabulary references, the `<b>`/`<i>` tag whitelist, and parity with the
approved source in `docs/handoffs/mcg-content.js`.

Preview locally with `python3 -m http.server 8000` from the repo root, then open
`http://localhost:8000/games/preview.html`. Add `?moodle=1` to imitate Boost (fixed
navbar, `#page` scroller, `.no-overflow` wrapper), `?combined=1` to add HITS and
the matrix, `?reviewer=1` for reviewer mode, or `?explorer=<url>` for the link.
