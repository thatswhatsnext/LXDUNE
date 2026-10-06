# Handoff: Lesson plates for the ADI path and Choosing a model

**Reviewed and signed off by:** Steve Grant, 2026-10-07 (each plate chosen from three options: N1, R1, BA3, A3, S2, DL2, SA3)

**Branch:** `feature/fieldwork-cells-yeast-plates` (already pushed). These commits sit on top of item 54's, so one `/ship` releases both: `feat(game): plates for the ADI path and Choosing a model`, then `chore(pages): publish`.

## Goal

The last seven lessons get a plate on their first item. Every Fieldwork lesson then has one. As before, no plate has text or numbers, and none gives the answer away.

- **Keep the noise out (`adi-2-noise`), N1:** a small speaker playing a tone inside a box lined with a soft material, and a phone with a blank sound-meter screen standing outside it. The meter shows no reading.
- **Review, then revise (`adi-3-review`), R1:** two students swapping their reports, the name on each covered so the review is anonymous.
- **Build it: ADI (`adi-4-build`), BA3:** a unit as a long band in the five 5E colours, with an ADI routine of eight stages (in its three group colours) sitting inside the Explore and Explain stretch, and the lined speaker box on the bench. It shows ADI as a routine inside a unit, in line with item 48.
- **Argument day (`adi-5-argument-day`), A3:** two whiteboards with bar charts, the two groups who made them facing each other, and a speech bubble between them.
- **Which model, and why? (`select-1-which`), S2:** eleven question cards, one per Reckoner question, each with its own small icon, and an arrow to the 5E and POE tokens. The cards are all the same size, so none looks weightier.
- **When the dial moves (`select-2-dial`), DL2:** the yeast flask from the POE path, and two calendars: one with a single lesson marked, the other with a unit's worth. No gauge or needle, so nothing points to an answer.
- **Argue it out (`select-3-argue`), SA3:** models nested inside each other: a 5E unit, an ADI routine inside its Explore and Explain stretch, and a POE inside the ADI routine's first stage.

## Scope

- **Changes:** `tools/reckoner/templates/game.js`, `tools/reckoner/scripts/test-game.ts`; then the generated `play/index.html`; `docs/ACTION-PLAN.md`.
- **Must not change:** lesson YAML (no version bumps), guides, `game.html` (no new tokens or classes: the seven plates reuse item 54's `--plate-*` tokens, `.pv-*` styles and phase colours), `app.html`/`app.js`, `reckoner/`, storage keys.

## New files

| File | Goes to | What it is |
|---|---|---|
| `2026-10-07-adi-choosing-plates.patch` (alongside this handoff) | applied from the repo root | The two source changes below, as a `git diff` against the branch at item 54's action-plan commit |

## Changes

1. **`game.js`, `PLATES`:** seven new entries after `"5e-6-prac-day"`: `"adi-2-noise"`, `"adi-3-review"`, `"adi-4-build"`, `"adi-5-argument-day"`, `"select-1-which"`, `"select-2-dial"` and `"select-3-argue"`. Same shape as before (`viewBox="0 0 350 190"`, own `<defs>`, `aria-label`, no `<text>`). Id prefixes: `nz-`, `rv-`, `ba-`, `ad-`, `s1-`, `s2-`, `s3-`. The two plates with people (`adi-3-review`, `adi-5-argument-day`) each carry their own `person` symbol in their `<defs>`.
2. **`test-game.ts`:** the plate test's loop over later lessons now also opens the seven new lessons, checks each has a plate with the expected description and no text, and checks every `<use>` points inside its own plate.

## Expected results

- Lessons with a plate: 9 → 16, i.e. every published lesson.
- Published lessons 16, guides 6, examples 58: unchanged. No version bumps.
- Build tests 20, game tests 22, all passing.
- validate, test, typecheck, check:pages and check:regressions pass. Checked in a browser at 375 px in light and dark.

## Commits

1. `feat(game): plates for the ADI path and Choosing a model`
2. `chore(pages): publish`
3. The action plan, as its own commit (as item 54 did)

## Action plan

Next item: **Lesson plates for the ADI path and Choosing a model.** Record Steve's choices from three options each (2026-10-07): N1, R1, BA3, A3, S2, DL2, SA3. Every Fieldwork lesson now has a plate, which closes the plate work left open in item 54.

## Open questions for review

None.
