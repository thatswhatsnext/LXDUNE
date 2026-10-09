# Changelog — Metacognition Coach

## v1.0.0 — 2026-10-09 (renderer coach@1.0.0)

- Initial port of the Metacognition Coach prototype into LXDUNE, as a standalone
  web app: `index.html` (the app page) and `coach.js` (the module), served from
  GitHub Pages. Not a Moodle embed (Steve's decision, 9 October 2026). Spec, approved
  content and reference prototype: `docs/handoffs/2026-10-09-metacognition-coach.md`,
  `docs/handoffs/mcg-content.js` and `docs/handoffs/Metacognition_Coach.html`.
  Content reviewed and approved by Steve Grant (9 October 2026).
- 9 habits × 7 steps = 63 steps, in the approved order (explicit, model, ask,
  plan, collab, evaluate, challenge, practise, checkin); 27 classroom scenes.
- Converted without changing any wording. `npm run validate` runs a parity check
  through the page's own `buildGame()`: every string in the approved source
  survives unchanged, curly quotes and dashes included.
- Habit names and phases come from `frameworks/metacognition-nsw-science/habits.json`
  (`habitsFrom`); only the game's one-line descriptions live here, as
  `gameDescriptions`. Definition items are stored as references (`distractors`)
  and built by the engine.
- Scenario contexts are vocabulary ids (`stages`, `focusArea`, or `syllabus` +
  `module`, plus an optional `note`), rendered with the vocabulary's labels. The
  five Stage 6 contexts therefore read, for example, "Chemistry Stage 6 (2017) ·
  M6 Acid/Base Reactions" rather than the prototype's "Stage 6 Chemistry ·
  Module 6 Acid/Base Reactions" (Steve's decision, 9 October 2026). The 2017
  Stage 6 syllabuses are flagged `acknowledgedSuperseded`.
- Phase colours are the Framework Explorer's (planning #3C6E8F, monitoring
  #8A6D1F, evaluating #7A4477), not the prototype's. Monitoring's small text uses
  #77601B, because #8A6D1F on the sunk background is 4.46:1.
- Progress is kept in `localStorage` under `lxd-mcg-v1`, with its limits recorded
  in `docs/framework-explorer-roadmap.md`. `?reviewer=1` shows the reviewer toggle.
- Changes from the prototype's behaviour and look:
  - Reviewer mode is hidden unless the page asks for it (`allowReviewer: true`,
    set by `?reviewer=1`), and it is never stored.
  - "Go deeper" names the explorer without a link unless `explorerUrl` is set.
  - The game doesn't take focus when the page loads.
  - Every screen has one `h1`; the prototype's question screens had only an `h2`.
  - The completion screens' panel headings are `h2`, not `h3` (axe heading-order).
  - The footer no longer says "Prototype".
  - The "You performed" bar is drawn at its displayed level (`level × 20%`), so a
    0% unit shows 1/5 at 20%, not 0%.
  - The chosen confidence button's label uses the body colour; muted text on the
    accent tint was 4.25:1.
