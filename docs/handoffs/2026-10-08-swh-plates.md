# Handoff: Plates for the SWH path and Which routine?

**Reviewed and signed off by:** Steve Grant, 2026-10-08 (each plate chosen from three options: SP1, BO1, RB3, BB1,
DB1, DW1, RD1, BD1, DD1, SR1)

**Branch:** `feature/fieldwork-swh`, on top of the SWH path (`2026-10-08-fieldwork-swh.md`, action-plan item 58).
The source changes are in `2026-10-08-swh-plates.patch` alongside this file. One release ships both.

## Goal

Every published Fieldwork lesson opens with a plate. The ten lessons added with the SWH path get theirs: the shared
spinners lesson, both cases' lessons 2–5, and Which routine?.

## Scope

- **Changes:** `tools/reckoner/templates/game.js` (`PLATES`), `tools/reckoner/scripts/test-game.ts`, and the generated
  `play/index.html`.
- **Must not change:** lesson YAML, guides, `game.html` (no new tokens or styles), `reckoner/`, existing plates.

## Changes to existing files

### 1. `templates/game.js`: ten entries in `PLATES`, after `"select-3-argue"`

| Lesson | Plate | What it shows |
|---|---|---|
| `swh-1-spinners` | SP1 | A paper spinner and a crumpled ball of the same paper, just released, falling side by side at the same height. Neither has landed |
| `swh-2-bottles` | BO1 | The four bottles on a bench: double-walled steel, aluminium, glass, ridged plastic |
| `swh-3-bottles` | RB3 | Four bottles on a shelf; two notebooks below, each with an arrow to a different bottle (steel, plastic) |
| `swh-4-bottles` | BB1 | A seven-column planning board, headers in the three SWH stage colours, a card on its way in; bottles beside |
| `swh-5-bottles` | DB1 | A classroom: teacher by the front desk with a closed folder (the figures, held back); two groups seated at benches with the steel and plastic bottles |
| `swh-2-duckweed` | DW1 | A creek after rain: road and garden above, run-off streaking from a drain pipe, duckweed on the surface |
| `swh-3-duckweed` | RD1 | Two students facing each other over cups and notebooks, a folded reading standing on the bench between them |
| `swh-4-duckweed` | BD1 | The planning board with cups of duckweed beside it |
| `swh-5-duckweed` | DD1 | The classroom with cups on the windowsill, the reading held back on the front desk, two groups with their cups |
| `select-4-routine` | SR1 | A signpost at a fork: one arm towards a whiteboard on an easel, the other towards an open notebook |

Each plate has a full `aria-label`, no `<text>`, and its own prefixed ids (`swb3-`, `swb5-`, `swd3-`, `swd5-`). None
gives an answer away: the spinner and ball are level, the duckweed case plate shows the creek and not the counts. The
plates reuse existing tokens (`--plate-*`, the phase colours) and `.pv-*` styles; people are pale outlines.

### 2. `scripts/test-game.ts`: the plate test covers every lesson

- The ten lessons join the list of described plates, matched on words from each `aria-label`.
- `open()` chooses a lesson's case before opening it.
- Where the first item is a card that advances on its own (a case card), the plate is checked to leave on the next item.
- The test fails if any published lesson has no plate.

**Version bumps:** none (plates live in the template).

## Expected results

- Lessons with a plate 16 → 26: every published lesson. Published lessons 26, guides 6, examples 58, worked sequences 21
  unchanged.
- Build tests 21, game tests 23 (the plate test is extended, not added).
- Only `play/index.html` changes among generated files.
- Validate, test, typecheck, check:pages and check:regressions (against `origin/main`) pass.
- Checked in Chromium at 360 px in light and dark: each plate shows on its lesson's first item, no sideways scroll, no
  page errors.

## Commits

1. `feat(game): plates for the SWH path and Which routine?` (with the regenerated `play/`).
2. `docs(handoffs): plates for the SWH path`: this handoff and its patch.

To add when applying: `docs(action-plan): <next item>, plates for the SWH path`.

## Action plan

Next item: record the ten plates and Steve's choices. This closes item 58's open item on plates.

## Open questions for review

None.
