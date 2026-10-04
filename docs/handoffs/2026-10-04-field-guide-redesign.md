# Handoff: Field Guide redesign of the Reckoner page and the game

**Design direction chosen by:** Steve Grant, 2026-10-04 (direction A, "Field Notebook", from three options)

**Branch:** `feature/field-guide-redesign`

## Goal

Students meet one product, The Field Guide to Constructivist Teaching Models, with a clear path for a
novice: learn how the models relate, practise in Fieldwork, choose with the Reckoner, then plan with a
companion guide. Today the game is a text link and six tools sit as equal-weight tabs, so a beginner
cannot tell where to start. This is a presentation change: no content, scoring or routing changes.

## Design reference

The mock-ups are on a private Claude design canvas, page "Direction A: The Field Guide":
https://claude.ai/artifact/PLeg8BTZep87e3msSJJm5e (Steve can open it; Claude Code works from this file).
The canvas shows five phone screens (home, Family Tree, Fieldwork lesson, quick Reckoner, 5E guide) and
a desktop home. Everything needed to build is written out below, so the canvas is a visual check only.

## Scope

- **Changes:** `tools/reckoner/templates/app.html`, `tools/reckoner/templates/app.js`,
  `tools/reckoner/templates/game.html`, `tools/reckoner/templates/game.js`, the two build tests
  (`scripts/test-build.ts`, `scripts/test-game.ts`), and the generated `reckoner/`, `play/` and
  `docs/reckoner-state.md` via `npm run publish:pages`.
- **Must not change:**
  - Anything in `tools/reckoner/content/` (guides, `catalogue.json`, `questions.json`, game lessons) or
    `src/schema/`. No guide or lesson version bumps.
  - Tab and panel ids (`t-unit`, `p-unit`, `t-quick`, `p-quick`, `t-compare`, `p-compare`, `t-detail`,
    `p-detail`, `t-guides`, `p-guides`, `t-lib`, `p-lib`, `p-how`) and the hash routes
    (`#/guide/<id>[/<section>]`, `#/how-it-works[/<part>]`). `test-build.ts` relies on them.
  - `t-unit` stays the default selected tab.
  - The URL paths `reckoner/` and `play/`.
  - Game scoring, XP, streak, calibration (`S.conf`), progress storage keys and the feedback notice text.
  - `moodle-blocks/`, `config/`, `generate/`, `frameworks/`, root `scripts/`.

## Naming

Keep every user-facing name in one constant per template (for example `const NAMES = {...}` at the top of
`app.js` and `game.js`), because students may help name parts of the guide and a rename should be a
one-line change.

| Thing | Old label | New label |
|---|---|---|
| Whole product (page `<title>`, masthead) | Constructivist model reckoner and companion guides | The Field Guide to Constructivist Teaching Models |
| Decision tool | the reckoner | The Reckoner (capital R wherever it is a name) |
| Model map tab | Model map | Family Tree |
| Game | Teaching Models Play | Fieldwork |
| Game page `<title>` | Teaching Models Play | Fieldwork · The Field Guide |
| Lessons | unchanged | unchanged (for example The Willow Problem keeps its name) |

Other tab labels stay as they are: Start with your unit, Quick reckoner, Compare models, Detailed
reckoner, Companion guides.

## New files

| File | Goes to | What it is |
|---|---|---|
| `2026-10-04-field-guide-icons.svg` | pasted inline into `app.html` and `game.html`, straight after `<body>` | Icon sprite: 25 `<symbol>`s on a 24 px grid, stroke = `currentColor` |
| `2026-10-04-field-guide-willow.svg` | pasted inline into the home hero (`app.html`) and used as the 5e-1-willow plate in `game.js` | Plate 1, The Willow Problem, coloured by `--plate-*` tokens |

Both files stay in `docs/handoffs/` as the record. Use icons as
`<svg class="i" aria-hidden="true"><use href="#i-reckoner"/></svg>`, with
`.i{width:1.25em;height:1.25em;flex:none}`. Icon-only controls carry an `aria-label` on the control.

## Design tokens

The app's existing tokens already match direction A. Keep every existing token and its dark values; add
these to all three token blocks in `app.html` (bare `:root`, the `prefers-color-scheme: dark` block and
`:root[data-theme="dark"]`).

| Token | Light | Dark | Use |
|---|---|---|---|
| `--mono` | `"IBM Plex Mono", ui-monospace, Menlo, monospace` | same | Step labels, plate captions, metadata |
| `--meso-soft` | `#E8EDF6` | `#1D2638` | Meso badge and Reckoner step tile |
| `--micro-soft` | `#F6ECDF` | `#2C2318` | Micro badge and Plan step tile |
| `--dial-soft` | `#EFE8F4` | `#2A2233` | Dial badge |
| `--engage` … `--evaluate` | game's light values (`#b06e0c #0d7c6f #2a5cad #7046ad #ad4166`) | game's dark values (`#e7a64a #4cc4b3 #86aef0 #b598e8 #ec8aac`) | Phase glyphs in guides, matching the game |
| `--plate-sun` / `--plate-ray` | `#F2C76B` / `#D9A62E` | `#C9A04A` / `#A88128` | Willow plate |
| `--plate-canopy` / `--plate-branch` / `--plate-leaf` | `#DFEDE7` / `#1D6B56` / `#2E8A6E` | `#1B322A` / `#6FC0A3` / `#4FA586` | Willow plate |
| `--plate-trunk` / `--plate-soil` | `#5B4632` / `#7A5B3E` | `#B08C68` / `#8C6B4B` | Willow plate |
| `--plate-tub` / `--plate-rim` | `#35538F` / `#2A4372` | `#5873AE` / `#45609A` | Willow plate |
| `--plate-drop` | `#6FA8DC` | `#7FB4E4` | Willow plate |

Plate CSS: `.pl-sun{fill:var(--plate-sun)} .pl-ray{stroke:var(--plate-ray)} .pl-canopy{fill:var(--plate-canopy)}
.pl-trunk{stroke:var(--plate-trunk)} .pl-branch{stroke:var(--plate-branch)} .pl-leaf{fill:var(--plate-leaf)}
.pl-tub{fill:var(--plate-tub)} .pl-rim{fill:var(--plate-rim)} .pl-soil{stroke:var(--plate-soil)}
.pl-drop{fill:var(--plate-drop)} .pl-label{font:11px var(--mono);fill:var(--muted)}
.pl-q{font:600 40px var(--serif);fill:var(--micro)} .plate{width:100%;height:auto;display:block}`.

The plate sits on a graph-paper card: `background-color:var(--surface); background-image:
linear-gradient(var(--line-soft) 1px,transparent 1px), linear-gradient(90deg,var(--line-soft) 1px,transparent 1px);
background-size:18px 18px; border:1px solid var(--line); border-radius:12px`.

Fonts stay as they are in the app (Source Serif 4 display, IBM Plex Sans body); add IBM Plex Mono 500 to
the existing Google Fonts link.

## Changes to existing files: the Reckoner page

### 1. `app.html`: `<title>` and masthead

Replace the `<title>` with the new product name. Replace the contents of `header.top .wrap` with a slim
masthead bar that appears on every view:

```html
<header class="top">
  <div class="wrap mast">
    <a class="brand" href="./" aria-label="The Field Guide to Constructivist Teaching Models, home">
      <span class="brand-mark"><svg class="i" aria-hidden="true"><use href="#i-fieldguide"/></svg></span>
      <span class="brand-text"><b>The Field Guide</b><small>to Constructivist Teaching Models</small></span>
    </a>
    <span class="chip">NSW Science 7–10</span>
  </div>
</header>
```

`.brand-mark` is a 36 px tile, `--accent` fill, `--accent-ink` icon, radius 9 px. The `brand-text` name is
`--serif` 600 at 17 px; the small line is 11.5 px `--muted`. On desktop, add an inline nav to the right
of the brand (Family Tree, Fieldwork, The Reckoner, Companion guides) that wraps under the brand at
narrow widths. Each nav item does the same thing as the matching home step in change 2.

### 2. `app.html` + `app.js`: home hero and the four-step path

Add a `<section class="home" id="home">` between the masthead and the tabs, holding:

1. The willow plate card (the `New files` plate) with caption `Plate 1 · The Willow Problem, from Fieldwork`
   in `--mono`.
2. The existing `h1` ("Which constructivist model fits this science sequence?") and this lede:
   "A field guide for pre-service and early career teachers using the NSW Science 7–10 Syllabus (2023).
   Learn how the models relate, practise spotting them, then choose one for your own sequence and plan
   with its companion guide."
3. A heading "Work through the guide" (uppercase label style) and four step links, in this order. The
   numbers are a real sequence for novices, so they stay.

| Step | Mono label | Title | Line | Icon | Tile colours | Action |
|---|---|---|---|---|---|---|
| 1 | `1 · LEARN` | The Family Tree | Where each model comes from and how they relate | `i-familytree` | `--accent-soft` / `--accent` | Select tab `t-lib` |
| 2 | `2 · PRACTISE` | Fieldwork | Short games. Start with The Willow Problem | `i-fieldwork` | `--accent` / `--accent-ink` | Link to `../play/` |
| 3 | `3 · CHOOSE` | The Reckoner | Answer questions about your sequence and see which models fit, and why | `i-reckoner` | `--meso-soft` / `--meso` | Select tab `t-quick` |
| 4 | `4 · PLAN` | Companion guides | Phases, look-fors, worked sequences and a checklist for each model | `i-guides` | `--micro-soft` / `--micro` | Select tab `t-guides` |

Step 2 is the highlighted card (`--accent-soft` background, slightly stronger border) because practice
comes before choosing for a novice. Each step is a full-width `<a>` or `<button>` row: 46 px icon tile,
mono label, 16 px 600 title, 13.5 px muted line, `i-chevron` on the right, min height 44 px. On desktop
(≥ 900 px) the hero becomes two columns (text left, plate right) and the steps a four-column grid
(`repeat(auto-fit, minmax(240px, 1fr))`).

Remove the old `p.lede` and `p.playlink`; step 2 replaces the game link.

**When the home section shows:** only when `t-unit` is selected and there is no hash route. Selecting
any other tab, or arriving on `#/guide/...` or `#/how-it-works...`, hides `#home` (`hidden`), so deep
links open straight on their content. Returning to `t-unit` shows it again. Selecting a tab from a step
should scroll that tab's panel into view and move focus as the existing tab code does.

### 3. `app.html`: tab bar as the Reckoner's tool strip

Keep the `role="tablist"` markup and ids. Changes:

- Put a label above it: "In the Reckoner" (12 px uppercase `--muted`), and give the strip
  `aria-label="Reckoner tools"`.
- Add an icon before each label: unit `i-unit`, quick `i-reckoner`, compare `i-compare`, detailed
  `i-detail`, guides `i-book`, family tree `i-familytree`.
- Rename the `t-lib` label to "Family Tree".
- On phones, one horizontally scrolling row (`overflow-x:auto; scroll-snap-type:x proximity`) instead of
  three wrapped rows; keep ≥ 44 px targets and a visible focus ring. Selected tab: `--surface` fill, 1px
  `--line` border, `--ink` text; others: transparent with `--muted` text.

### 4. `app.js`: stage cards in `renderUnit`

In the stage step (the `data-stage` buttons), add `i-stage4` or `i-stage5` above the stage name at
40 px in `--accent`, and lay the two cards out as a two-column grid. Stage name in `--serif` 600 21 px,
years in 13.5 px `--muted`. Keep the `data-stage` attributes and the "Answer three quick questions"
`data-tapstart` link unchanged.

### 5. `app.js`: scale badges with icons

Change `badge(s)` so each badge starts with its scale icon (`i-scale-macro`, `-meso`, `-micro`, `-dial`)
at 13 px, and give the four `b-*` classes the soft fills: macro `--accent-soft` / `--macro`, meso
`--meso-soft` / `--meso`, micro `--micro-soft` / `--micro`, dial `--dial-soft` / `--dial`. Labels and
tooltips still come from `SCALE` in `questions.json`.

### 6. `app.js`: "Why this matters" on question help

Change the help `<summary>` text from "What this means" to "Why this matters" in both the quick form
(around line 264) and the detailed form (around line 322). Style the summary in `--meso` 600; leave the
help text itself unchanged.

### 7. `app.js`: show the other side of the quick matrix in `renderQuick`

When `quickCompute` returns a result with `side` of `"left"` or `"right"` (not the one-lesson results,
where `side` is `null`), and the result is not a matrix preview, render a second, quieter card under the
recommendation:

- Left result → heading "If your learners had more experience", model label from
  `QUICK[a.purpose].right[1]`, and the text the app already uses for right-side results:
  `` `You want students to ${PURPOSE_PHRASE[a.purpose]}, and your learners have the experience and time to take more control.` ``
- Right result → heading "If your learners needed more structure", label from
  `QUICK[a.purpose].left[1]`, and the left-side text with "novice learners".
- A link "Compare these two side by side" that opens `t-compare` with both models picked, if the compare
  view can be preset; otherwise leave the link out.

This shows students why the recommendation moves, which suits a learning scaffold. No new rules or data.

Also on the recommendation card: put the "Recommended for your answers" label, title and `name · src`
line in an `--accent-soft` header band, and add a secondary button "Practise it in Fieldwork" linking to
`../play/` when the recommended model has a game path (`5e` or `poe` today; read the path ids from the
game data if they are available to the page, otherwise hard-code those two in `NAMES`).

### 8. `app.js`: phase strip and time-share bar in companion guides

At the top of each guide's phases section:

- A row of phase tiles: 44 px rounded tile with the phase glyph, phase name below. Glyph and colour by
  phase id: `engage`/`elicit` → `i-engage` `--engage`; `explore` → `i-explore` `--explore`; `explain` →
  `i-explain` `--explain`; `elaborate`/`extend` → `i-elaborate` `--elaborate`; `evaluate` →
  `i-evaluate` `--evaluate`. Any other phase id (SWH, ADI, POE, Levels of inquiry) gets a numbered tile
  in `--accent` instead of a glyph. Tiles link to the phase card.
- A stacked bar of each phase's `typicalShare`, using the midpoint of `minPercent` and `maxPercent` as
  the segment's flex basis and the phase colour as its fill, with the ranges as mono labels underneath
  and the caption "Typical share of sequence time for each phase". Draw it only when every phase in the
  guide has `typicalShare` (all published guides except `levels-of-inquiry` today). Give the bar a
  `role="img"` and an `aria-label` that lists every range.

### 9. `app.html`: footer

Footer text becomes "The Reckoner prompts reasoning; it does not prescribe a choice. Strong programs often
combine models. Check any sequence against the NSW Science 7–10 Syllabus (2023) and your school's scope
and sequence." Add the `i-judgement` icon before it at 30 px in `--muted`.

## Changes to existing files: the game (Fieldwork)

### 10. `game.html`: tokens and fonts

Re-skin the game to the Field Guide look while keeping its structure (HUD, phase rail, dock):

- Fonts: display `--f-display` becomes Source Serif 4 600; body `--f-body` becomes IBM Plex Sans; keep
  IBM Plex Mono. Update the Google Fonts link to match the app's, plus Plex Mono.
- Colours, in all three token blocks: `--bg`, `--surface`, `--surface-2`, `--ink`, `--muted`, `--line`
  take the app's `--paper`, `--surface`, `--sunk`, `--ink`, `--muted`, `--line` values (light and dark).
  `--accent` becomes `#1D6B56` (dark `#6FC0A3`) and `--on-accent` `#FFFFFF` (dark `#0D1714`). Update the
  two `theme-color` metas to the new `--bg` values.
- Keep `--good`, `--bad` and their backgrounds, and keep all five phase colours exactly as they are.
- Because `--accent` and `--good` are now both greens, a chosen option must not look like a correct
  one. Selected (before checking): 2px `--ink` border on `--surface-2`. Correct and wrong states keep
  their colours and also show `i-tick` or a cross icon and a text label, so colour is never the only
  signal.

### 11. `game.html` + `game.js`: masthead and naming

The `#top` area shows the brand: `i-fieldwork` in a small `--accent` tile, "Fieldwork" in `--serif`,
and a link back "The Field Guide" to `../reckoner/` (with `i-back`). Inside a lesson, the HUD shows the
mono line "Fieldwork · <path title>" above the lesson title, and an item counter "n / total" in mono.
The streak and XP pills stay.

### 12. `game.js`: phase tag on each item

Above each item's stem, show a pill with the phase glyph and `PHASE · KIND` in mono uppercase (for
example "ENGAGE · PREDICT"), coloured by the item's `at` phase. Items without `at`, or with a phase id
outside the five, get a plain `--surface-2` pill with the kind only.

### 13. `game.js`: lesson plate

Add an optional plate per lesson, keyed by lesson id in a small map in `game.js` (no schema change). For
now only `5e-1-willow` has one: the willow plate from `New files`, shown on the graph-paper card at the
top of the lesson's first item. Lessons without a plate show nothing extra. The other spot illustrations
on the canvas ("Cells under the lens", "Predict first") can be added the same way later; see Action plan.

### 14. `game.js`: confidence slider

Keep the 0–100 slider exactly as it works now: calibration feedback depends on `S.conf >= 70`. Restyle
only: track in `--line`, filled part and thumb in `--ink`, 44 px tall hit area, end labels in `--muted`.
The canvas mock-up shows three buttons; do not build those.

### 15. `game.js`: privacy line

Keep the existing notice text. Show a one-line version under the dock on lesson screens: a small lock
icon and "Nothing you do here is recorded or sent anywhere. Progress stays in this browser."

## Accessibility and theme checks

- Every new colour comes from a token that is defined in all three blocks, in both templates.
- Text contrast at least 4.5:1 in both themes, including mono labels on soft tiles.
- Every interactive element at least 44 px tall and with a visible `:focus-visible` ring.
- Icons are decorative (`aria-hidden="true"`); labels carry the meaning.
- No new motion; respect `prefers-reduced-motion` for any transition added to the tab strip.
- The page body never scrolls sideways at 360 px.

## Tests to add

- `test-build.ts`: home section is visible on first load with `t-unit` selected; it is hidden after
  selecting `t-quick`, and hidden on load with `#/guide/5e`; the four steps exist in order; the `t-lib`
  label reads "Family Tree"; the `<title>` is the new product name.
- `test-build.ts`: quick reckoner with purpose `misc`, time `unit`, ready `novice` shows "5E, with a POE
  in Engage" and an alternative card naming "Generative Learning Model (or 7E)"; with time `lesson` there
  is no alternative card.
- `test-build.ts`: the 5E guide renders five phase tiles and a time-share bar; Levels of inquiry renders
  no time-share bar.
- `test-game.ts`: the page `<title>` is "Fieldwork · The Field Guide"; the predict item still renders the
  confidence slider; `5e-1-willow` shows a plate and `5e-2-cells` does not.

## Expected results

- Models in the reckoner: 15 (unchanged)
- Published guides: 6 (unchanged)
- Examples across published guides: 58 → 58
- Worked sequences: 20 (unchanged)
- Focus areas with a ready plan / examples only / empty: 16 / 0 / 0 (unchanged)
- Game lessons published: 10 (unchanged)
- Checks: validate, test (including the new tests), typecheck and check:pages all pass

## Commits

1. `feat(reckoner): Field Guide masthead, home path and icon sprite`: changes 1–3, 9, sprite, plate and tokens.
2. `feat(reckoner): stage icons, scale badges and Why this matters`: changes 4–6.
3. `feat(reckoner): show the other side of the quick matrix`: change 7.
4. `feat(reckoner): phase strip and time-share bar in guides`: change 8.
5. `feat(game): Fieldwork skin, masthead, phase tags and willow plate`: changes 10–15.
6. `test(reckoner): cover the Field Guide home, quick alternative and game skin`.
7. `chore(pages): publish`: output of `npm run publish:pages`.

## Action plan

Next item: record "Field Guide redesign applied to the Reckoner page and Fieldwork (design direction A)",
and these open items:

- Family Tree families: group the 15 models into families in the Family Tree view (needs a new optional
  field and Steve's review of the groupings; see Open questions).
- Plates for more lessons, starting with Cells under the lens and the POE path.
- Ask the next student cohort about the names (Field Guide, Family Tree, Fieldwork) before they are
  fixed in the Moodle unit pages.

## Open questions for review

1. **Family Tree groupings (not in this handoff).** The canvas groups the models into five families plus
   the guidance dial. These groupings are Claude's draft and need Steve's judgement before any data
   change. They are: Learning cycles (Learning cycle, 5E, 7E); Conceptual change (Generative Learning
   Model, Interactive Approach, Predict–Observe–Explain); Argument and writing (Science Writing
   Heuristic, Argument-Driven Inquiry); Reasoning (CASE); Problems, projects and issues (Problem-based
   learning, Project-based science, Engineering design cycle, SSI-based teaching, Ambitious Science
   Teaching); across every branch, Levels of inquiry. Until then, the Family Tree tab keeps the current
   map content under its new name.
2. **Alternative card wording (change 7).** It reuses the app's existing sentences. Check the left-side
   variant reads well when the alternative is a model students have not met yet.
3. **Fonts in the game.** Moving the game from Atkinson Hyperlegible to IBM Plex Sans unifies the look
   but drops a typeface designed for low-vision readers. If legibility feedback from the pilot matters
   more than consistency, keep Atkinson Hyperlegible as the game's body face and change only the display
   face.
4. **Home step order.** Learn → Practise → Choose → Plan assumes students arrive new to the models. If
   most arrive with a unit to plan, the stage picker could sit above the four steps instead.
