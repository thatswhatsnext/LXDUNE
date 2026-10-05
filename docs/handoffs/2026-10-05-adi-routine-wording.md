# Handoff: ADI as a multi-lesson routine inside a unit (wording correction to item 47)

**Reviewed and signed off by:** Steve Grant, 2026-10-05

**Branch:** `fix/adi-routine-wording`

## Goal

Keep to the Field Guide's own wording, as Steve directed on 2026-10-05: ADI is a multi-lesson routine ("A few lessons. Fits inside a unit."). It sits between one lesson and part of a unit, and does not structure a whole unit. Item 47 shipped three places that said ADI could carry a unit. This corrects them. Nothing else changes.

## Scope

- **Changes:** `tools/reckoner/templates/app.js` (one prompt string), `tools/reckoner/scripts/test-build.ts` (one regex), `tools/reckoner/content/methodology.yaml` (one line), `tools/reckoner/content/game/select-3-argue.yaml`, `tools/reckoner/content/game/adi-1-leaf-litter.yaml`; then the generated `play/`, `reckoner/` and `docs/reckoner-state.md`; `docs/ACTION-PLAN.md`.
- **Must not change:** every guide (the ADI guide's `scaleNote` is already right); the other 12 lessons; rule texts and their hash; the game engine; storage keys.

## New files

| File | Goes to | What it is |
|---|---|---|
| `2026-10-05-adi-routine-wording.patch` (alongside this handoff) | applied from the repo root | The source changes below, as a `git diff` against `main` at `96bf198`, limited to `tools/reckoner/` |

## Changes

### 1. `app.js`: the routine-for-a-unit prompt in `timePrompts()`

Replace the `m.scale === "meso" && (t === "unit" || t === "depth")` text with:

> `${m.name}` is a multi-lesson routine: a few lessons that fit inside a unit. You're planning `${tl}`. Which unit model will it sit inside, and where in that unit does it do its work?

The other three prompts are unchanged. `test-build.ts` checks the new wording.

### 2. `methodology.yaml`: the How it works line (patch bump; `lastReviewed` stays 2026-10-05)

Replace "or a routine that could either sit inside a unit or carry it." with:

> or a multi-lesson routine when you're planning a whole unit, since a routine fits inside a unit rather than structuring one.

The line stays plain text in the `|` block, as item 47 left it.

### 3. `select-3-argue`: classes plan a few lessons inside a unit (patch bump)

All three Reckoner items now use timescale "2–5 lessons", and their scenarios say "a few lessons inside your unit on …". The build re-scored every answer, reason and flip against the Reckoner:

| Item | Answer | Gap | Change |
|---|---|---|---|
| Sound (5E, POE, ADI) | ADI | 0.43 | The time reason is now correct ("It's a few lessons inside the unit, not the whole unit") |
| Local ecosystems (5E, ADI) | 5E | 0.10 | The time reason is now wrong: a few lessons favours ADI, and readiness and assessment tip it to 5E. The `why` text says so |
| Flip (5E, ADI) | Readiness → novice flips to 5E | 0.04 after the flip | The starting class is now "investigate and argue, observable, experienced" over a few lessons, with no assessment answer. At 2–5 lessons the old starting class would have been too close to call after the flip (gap 0.019) |

The `why` item's last option becomes "5E always wins over a few lessons", with feedback that a few lessons inside a unit is where ADI fits best.

### 4. `adi-1-leaf-litter`: the concept card's lead (patch bump)

> It's a multi-lesson routine of about 6–8 lessons that sits inside a unit, in three groups of stages: investigate, argue, then write and review.

## Expected results

- Published lessons: 14, with `select-3-argue` and `adi-1-leaf-litter` going up a patch version. Methodology goes up a patch version. No guide version changes.
- Models 15, guides 6, examples 58, worked sequences 20, focus areas unchanged.
- Build tests 20, game tests 22, all passing; the rules-hash test passes unchanged.
- validate, test, typecheck, check:pages and check:regressions pass. Verified on a clean clone of `main` at `96bf198` before this handoff was written.

## Commits

1. `fix(reckoner): word ADI as a routine inside a unit, matching the Field Guide`: the five source files, then `chore(pages): publish` for the generated files and the action plan.

## Action plan

Add the next item, **ADI framed as a multi-lesson routine inside a unit**. Record:

- Steve's direction, 2026-10-05: keep consistency with the Field Guide's wording. ADI's scale is between one lesson and part of a unit, not a whole unit.
- The three corrections above, and the patch bumps.

In item 47, mark two lines as superseded by the new item:
- the decision line that says ADI "can serve as a routine inside a unit or as the unit's architecture";
- the open item about the ADI guide's `scaleNote`. The `scaleNote` already matches the Field Guide, so close that item rather than leaving it open.

## Open questions for review

None.
