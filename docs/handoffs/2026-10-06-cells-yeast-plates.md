# Handoff: Plates for Cells under the lens, Is yeast alive? and Clean hands

**Reviewed and signed off by:** Steve Grant, 2026-10-06 (option C3, version 2, and option P2, chosen from three options each; the Clean hands plate, drawn in P2's style)

**Branch:** `feature/fieldwork-cells-yeast-plates` (already pushed, from `main` at `6561c1d`, holding everything below plus `chore(pages): publish`)

## Goal

Three more lessons get a plate on their first item, as The Willow Problem and Under the leaf litter have. None of the plates has text or numbers, and none gives the prediction away.

- **Cells under the lens (`5e-2-cells`):** a microscope with its barrel upright over the stage, beside four round specimen views (a seed, a mushroom, a pinch of dried yeast and a salt crystal) and an empty field of view waiting for a slide. No cell detail is drawn inside any specimen.
- **Is yeast alive? (`poe-1-yeast`):** three conical flasks with limp balloons over their necks (yeast and sugar, yeast only, sugar only), a stopwatch just started, and the string and ruler students use to measure the balloons. Every balloon is limp.
- **Clean hands (`poe-2-hands`):** the moment before anyone washes. A UV torch shines on two open hands with fluorescent lotion glowing evenly over both, and the four methods wait on the bench in the prediction's order: a running tap over a basin, a soap pump, a bottle of hand sanitiser, and a paper towel roll. Nothing hints at which removes the most, and there's no stopwatch, which would point towards the 20-second wash. The hands are drawn in the plate's pale outline style, not a skin tone.

## Scope

- **Changes:** `tools/reckoner/templates/game.js`, `tools/reckoner/templates/game.html`, `tools/reckoner/scripts/test-game.ts`; then the generated `play/index.html`; `docs/ACTION-PLAN.md`.
- **Must not change:** lesson YAML (no version bumps: plates live in the template), guides, `app.html`/`app.js`, `reckoner/`, storage keys.

## New files

| File | Goes to | What it is |
|---|---|---|
| `2026-10-06-cells-yeast-plates.patch` (alongside this handoff) | applied from the repo root | The three source changes below, as a `git diff` against `main` at `6561c1d` |

## Changes

1. **`game.js`, `PLATES`:** three new entries, `"5e-2-cells"`, `"poe-1-yeast"` and `"poe-2-hands"`, after `"adi-1-leaf-litter"`. Each is an inline SVG with the usual `viewBox` (`0 0 350 190`) and its own `<defs>`. Ids are prefixed `cl-` (cells), `ye-` (yeast) and `ha-` (hands), so they never clash with each other or with the leaf litter plate's `ll-` ids. Each has an `aria-label` describing the scene, and none contains `<text>`.
2. **`game.html`, tokens:** two new plate tokens in all three theme blocks: `--plate-sugar` (`#FFFFFF` light, `#E3E9E6` dark) for the sugar cubes and paper towel, which otherwise take the card colour and vanish in dark mode; and `--plate-uv` (`#6A4BB0` light, `#A88BEA` dark) for the UV torch's light. Every other colour reuses existing `--plate-*` tokens, including `--plate-grey` and `--plate-rust` from item 50.
3. **`game.html`, styles:** `.pv-*` classes (bench, glassware, specimens, balloons, stopwatch, ruler; hands, lotion glow, UV light, soap, gel, towel) after the `.ll-*` rules. The `pv-` prefix keeps them clear of the game's own class names.
4. **`test-game.ts`:** the plate test (renamed "every lesson plate on its first item only") now expects a plate on `5e-2-cells`, where it previously required none, and on `poe-1-yeast` and `poe-2-hands`. It checks each has a description and no text, and that every `<use>` in the four newer plates points to a shape inside its own plate.

## Expected results

- Lessons with a plate: 2 → 5 (The Willow Problem, Cells under the lens, Is yeast alive?, Clean hands, Under the leaf litter).
- Published lessons 16, guides 6, examples 58: unchanged. No version bumps.
- Build tests 20, game tests 22, all passing.
- validate, test, typecheck, check:pages and check:regressions pass. Checked in a browser at 375 px in light and dark.

## Commits

1. `feat(game): plates for Cells under the lens and Is yeast alive?`
2. `feat(game): plate for Clean hands`
3. `chore(pages): publish`, plus the action plan

## Action plan

Next item: **Plates for Cells under the lens, Is yeast alive? and Clean hands.** Record Steve's choices on 2026-10-06:
- C3 ("field guide plate") from three options, revised so the barrel stands upright over the stage;
- P2 ("waiting to observe") from three options;
- the Clean hands plate, drawn in P2's style and approved as drafted.

This closes item 46's open plate items for Cells under the lens and the POE path. Every 5E Recognise lesson, both POE lessons and the first ADI lesson now have a plate.

## Open questions for review

None.
