# Handoff: Lesson plates for the 5E and POE paths

**Reviewed and signed off by:** Steve Grant, 2026-10-06 and 2026-10-07 (each plate chosen from three options and refined; the Clean hands plate drawn in P2's style)

**Branch:** `feature/fieldwork-cells-yeast-plates` (already pushed, from `main` at `6561c1d`, holding everything below plus `chore(pages): publish`)

## Goal

Seven more lessons get a plate on their first item, as The Willow Problem and Under the leaf litter have. Every 5E and POE lesson then has one. None of the plates has text or numbers, and none gives the prediction away.

- **Cells under the lens (`5e-2-cells`):** a microscope with its barrel upright over the stage, beside four round specimen views (a seed, a mushroom, a pinch of dried yeast and a salt crystal) and an empty field of view waiting for a slide. No cell detail is drawn inside any specimen.
- **Is yeast alive? (`poe-1-yeast`):** three conical flasks with limp balloons over their necks (yeast and sugar, yeast only, sugar only), a stopwatch just started, and the string and ruler students use to measure the balloons. Every balloon is limp.
- **Clean hands (`poe-2-hands`):** the moment before anyone washes. A UV torch shines on two open hands with fluorescent lotion glowing evenly over both, and the four methods wait on the bench in the prediction's order: a running tap over a basin, a soap pump, a bottle of hand sanitiser, and a paper towel roll. Nothing hints at which removes the most, and there's no stopwatch, which would point towards the 20-second wash. The hands are drawn in the plate's pale outline style, not a skin tone.
- **Outbreak (`5e-3-outbreak`), O3:** a web of students linked by their cup exchanges, a third wearing a shield badge. It shows the chains of contact without showing anything travelling along them.
- **Labels without logic (`5e-4-labels`), L2:** a ring binder opened at its first divider. The Engage tab sits on the left-hand page's outer edge, as a turned divider's would, and the other four phase-coloured tabs peek out from the pages beneath. Every page holds the same lecture worksheet. A sheet of spare tabs lies beside it.
- **Build it (`5e-5-build`), B1:** a planning board with five phase-coloured columns, a few cards placed, one on its way in, and a seedling in a pot beside it. Nothing hints at where a plant's mass comes from.
- **Prac Day (`5e-6-prac-day`), D1:** a teacher beside the thinking wall of sticky notes, and students at a desk, one with a microscope. People throughout are pale outlines.

## Scope

- **Changes:** `tools/reckoner/templates/game.js`, `tools/reckoner/templates/game.html`, `tools/reckoner/scripts/test-game.ts`; then the generated `play/index.html`; `docs/ACTION-PLAN.md`.
- **Must not change:** lesson YAML (no version bumps: plates live in the template), guides, `app.html`/`app.js`, `reckoner/`, storage keys.

## New files

| File | Goes to | What it is |
|---|---|---|
| `2026-10-06-cells-yeast-plates.patch` (alongside this handoff) | applied from the repo root | The three source changes below, as a `git diff` against `main` at `6561c1d` |

## Changes

1. **`game.js`, `PLATES`:** seven new entries after `"adi-1-leaf-litter"`: `"5e-2-cells"`, `"poe-1-yeast"`, `"poe-2-hands"`, `"5e-3-outbreak"`, `"5e-4-labels"`, `"5e-5-build"` and `"5e-6-prac-day"`. Each is an inline SVG with the usual `viewBox` (`0 0 350 190`) and its own `<defs>`. Ids are prefixed per plate (`cl-`, `ye-`, `ha-`, `ob-`, `lb-`, `bd-`, `pd-`), so they never clash with each other or with the leaf litter plate's `ll-` ids. Each has an `aria-label` describing the scene, and none contains `<text>`.
2. **`game.html`, tokens:** two new plate tokens in all three theme blocks: `--plate-sugar` (`#FFFFFF` light, `#E3E9E6` dark) for the sugar cubes and paper towel, which otherwise take the card colour and vanish in dark mode; and `--plate-uv` (`#6A4BB0` light, `#A88BEA` dark) for the UV torch's light. Every other colour reuses existing tokens: the `--plate-*` set, including `--plate-grey` and `--plate-rust` from item 50, and, for the 5E plates' tabs and columns, the game's own phase colours (`--engage`, `--explore`, `--explain`, `--elaborate`, `--evaluate`).
3. **`game.html`, styles:** `.pv-*` classes (bench, glassware, specimens, balloons, stopwatch, ruler; hands, lotion glow, UV light, soap, gel, towel; people, paper, desks, boards, cards, seedling, and `pv-ph-*` fills and strokes in the phase colours) after the `.ll-*` rules. The `pv-` prefix keeps them clear of the game's own class names.
4. **`test-game.ts`:** the plate test (renamed "every lesson plate on its first item only") now expects a plate on `5e-2-cells`, where it previously required none, and on `poe-1-yeast`, `poe-2-hands` and the four later 5E lessons. It checks each has a description and no text, and that every `<use>` in the eight newer plates points to a shape inside its own plate.

## Expected results

- Lessons with a plate: 2 → 9: all six 5E lessons, both POE lessons, and Under the leaf litter.
- Published lessons 16, guides 6, examples 58: unchanged. No version bumps.
- Build tests 20, game tests 22, all passing.
- validate, test, typecheck, check:pages and check:regressions pass. Checked in a browser at 375 px in light and dark.

## Commits

1. `feat(game): plates for Cells under the lens and Is yeast alive?`
2. `feat(game): plate for Clean hands`
3. `feat(game): plates for Outbreak, Labels without logic, Build it and Prac Day`
4. `chore(pages): publish`, plus the action plan

## Action plan

Next item: **Lesson plates for the 5E and POE paths.** Record Steve's choices:
- C3 ("field guide plate") from three options, revised so the barrel stands upright over the stage;
- P2 ("waiting to observe") from three options;
- the Clean hands plate, drawn in P2's style and approved as drafted (2026-10-06);
- O3, L2, B1 and D1 for the later 5E lessons, from three options each (2026-10-07). L2 was revised so the binder opens at its first divider, with the Engage tab on the left-hand page.

This closes item 46's open plate items. Every 5E and POE lesson now has a plate. Still without one: ADI lessons 2–5 and the three Choosing a model lessons.

## Open questions for review

None.
