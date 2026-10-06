# Handoff: Plates for Cells under the lens and Is yeast alive?

**Reviewed and signed off by:** Steve Grant, 2026-10-06 (option C3, version 2, and option P2, chosen from three options each)

**Branch:** `feature/fieldwork-cells-yeast-plates` (already pushed, from `main` at `6561c1d`, holding everything below plus `chore(pages): publish`)

## Goal

Two more lessons get a plate on their first item, as The Willow Problem and Under the leaf litter have. Neither plate has text or numbers, and neither gives the prediction away.

- **Cells under the lens (`5e-2-cells`):** a microscope with its barrel upright over the stage, beside four round specimen views (a seed, a mushroom, a pinch of dried yeast and a salt crystal) and an empty field of view waiting for a slide. No cell detail is drawn inside any specimen.
- **Is yeast alive? (`poe-1-yeast`):** three conical flasks with limp balloons over their necks (yeast and sugar, yeast only, sugar only), a stopwatch just started, and the string and ruler students use to measure the balloons. Every balloon is limp.

## Scope

- **Changes:** `tools/reckoner/templates/game.js`, `tools/reckoner/templates/game.html`, `tools/reckoner/scripts/test-game.ts`; then the generated `play/index.html`; `docs/ACTION-PLAN.md`.
- **Must not change:** lesson YAML (no version bumps: plates live in the template), guides, `app.html`/`app.js`, `reckoner/`, storage keys.

## New files

| File | Goes to | What it is |
|---|---|---|
| `2026-10-06-cells-yeast-plates.patch` (alongside this handoff) | applied from the repo root | The three source changes below, as a `git diff` against `main` at `6561c1d` |

## Changes

1. **`game.js`, `PLATES`:** two new entries, `"5e-2-cells"` and `"poe-1-yeast"`, after `"adi-1-leaf-litter"`. Each is an inline SVG with the usual `viewBox` (`0 0 350 190`) and its own `<defs>`. Ids are prefixed `cl-` (cells) and `ye-` (yeast), so they never clash with each other or with the leaf litter plate's `ll-` ids. Each has an `aria-label` describing the scene, and neither contains `<text>`.
2. **`game.html`, token:** one new plate token, `--plate-sugar` (`#FFFFFF` light, `#E3E9E6` dark), in all three theme blocks, for the sugar cubes. Without it the cubes take the card colour and vanish in dark mode. Every other colour reuses existing `--plate-*` tokens, including `--plate-grey` and `--plate-rust` from item 50.
3. **`game.html`, styles:** `.pv-*` classes (bench, glassware, specimens, balloons, stopwatch, ruler) after the `.ll-*` rules. The `pv-` prefix keeps them clear of the game's own class names.
4. **`test-game.ts`:** the plate test (renamed "every lesson plate on its first item only") now expects a plate on `5e-2-cells`, where it previously required none, and on `poe-1-yeast`. It checks each has a description and no text, and that every `<use>` in the three newer plates points to a shape inside its own plate.

## Expected results

- Lessons with a plate: 2 → 4 (The Willow Problem, Cells under the lens, Is yeast alive?, Under the leaf litter).
- Published lessons 16, guides 6, examples 58: unchanged. No version bumps.
- Build tests 20, game tests 22, all passing.
- validate, test, typecheck, check:pages and check:regressions pass. Checked in a browser at 375 px in light and dark.

## Commits

1. `feat(game): plates for Cells under the lens and Is yeast alive?`
2. `chore(pages): publish`, plus the action plan

## Action plan

Next item: **Plates for Cells under the lens and Is yeast alive?** Record Steve's choices on 2026-10-06:
- C3 ("field guide plate") from three options, revised so the barrel stands upright over the stage;
- P2 ("waiting to observe") from three options.

This closes item 46's open plate items for Cells under the lens and the POE path. Note that Clean hands (`poe-2-hands`) can get a matching P2-style plate later.

## Open questions for review

None.
