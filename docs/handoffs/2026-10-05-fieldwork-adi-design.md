# Handoff: Fieldwork ADI Design lessons, and Argue it out on a unit timescale

**Reviewed and signed off by:** Steve Grant, 2026-10-05

**Branch:** `feature/fieldwork-adi-design` (already pushed: the source commits, plus `chore(pages): publish`, on top of `main` at `1085e1a`)

## Goal

The ADI path gets its two Design-level lessons, completing the five-lesson path Steve planned. Argue it out (Choosing a model, lesson 3) plans its ADI classes as 6–8 lessons with the "A unit (6–15 lessons)" timescale, matching the ADI guide's length.

## Scope

- **Changes:** `tools/reckoner/content/game/` (two new lessons; `select-3-argue.yaml`), then the generated `play/` and `docs/reckoner-state.md`; `docs/ACTION-PLAN.md`.
- **Must not change:** guides, the engine, templates, schema, tests, the other 14 lessons, `reckoner/`, `moodle-blocks/`. No engine changes are needed: the build board and Prac Day sim already handle a grouped eight-stage guide.

## New files

| File | Goes to | What it is |
|---|---|---|
| `2026-10-05-fieldwork-adi-design.patch` (alongside this handoff) | applied from the repo root | The source changes as a `git diff` against `main` at `1085e1a`, limited to `tools/reckoner/` |

The patch adds two lessons, published at v1.0.0, `ai-drafted-reviewed`, reviewed by Steve Grant on 2026-10-05:

| Lesson | Path · level | Built on |
|---|---|---|
| `adi-4-build` Build it: ADI | ADI · Design, 5 items | `seq-s5-sound`: a build board of 15 cards across the eight stages, reported against 12 look-fors; five flawed cards raise `mis-adi-closed-question`, `mis-adi-given-method`, `mis-adi-no-justification`, `mis-adi-teacher-judges`, `mis-adi-group-report`; an empty tentative argument, argumentation or peer review stage raises a misapplication; then "two lessons lost, what do you cut?" (`mis-adi-skip-review`) |
| `adi-5-argument-day` Argument Day | ADI · Design, 4 items | `seq-s5-sound` lessons 4–6: a six-node sim with three or four decisions per run, voicing all three target conceptions; three endings |

There are no check cards on the ADI board: the ADI guide has no formative look-for or misapplication to key them to.

## Changes to existing files

### `select-3-argue`: classes plan 6–8 lessons on a unit timescale (patch bump)

All three Reckoner items move from `time: short` to `time: unit`, and their scenarios say "6–8 lessons" inside the unit. The build re-scored them against the Reckoner:

| Item | Answer | Gap | Reason change |
|---|---|---|---|
| Sound (5E, POE, ADI) | ADI | 0.30 | "It runs 6–8 lessons" is now a wrong reason: time leans to 5E |
| Local ecosystems (5E, ADI) | 5E | 0.23 | "It runs 6–8 lessons" is now a right reason |
| Flip (5E, ADI) | Readiness → novice flips to 5E | 0.21 after the flip | The other three changes keep ADI ahead (smallest gap 0.037) |

The `why` text on the ecosystems class and the `why` item's last option are reworded to match.

## Steps

1. Read before writing: `CLAUDE.md`, `docs/reckoner-state.md`, `git log -1 origin/main`. If `main` has moved past `1085e1a`, apply the patch rather than merging the branch, and report what differed.
2. Either check out `feature/fieldwork-adi-design` (already holds everything below), or branch from `dev` and `git apply` the patch.
3. From `tools/reckoner`: `npm run publish:pages`, `npm run typecheck`, `npm run check:pages`, `npm run check:regressions -- origin/main`.
4. Add the action-plan item, commit, push, and open the PR into `dev`. Release with `/ship` when Steve asks.

## Expected results

- Published game lessons: 14 → 16 (5E 6, POE 2, ADI 5, Choosing a model 3). `select-3-argue` gets a patch bump.
- Models 15, guides 6, examples 58, worked sequences 20, focus areas unchanged. No guide or methodology version changes.
- Build tests 20, game tests 22; the jsdom test plays all 16 lessons to the end.
- validate, test, typecheck, check:pages and check:regressions pass. Verified on a clean clone of `main` at `1085e1a` before this handoff was written.

## Commits

1. `content(game): ADI Design lessons, Build it: ADI and Argument Day`
2. `content(game): publish Build it: ADI and Argument Day; Argue it out uses a unit timescale`
3. `chore(pages): publish` plus the action plan

## Action plan

Next item: **Fieldwork ADI path complete: Design lessons and Argue it out on a unit timescale**. Record:

- Steve's decisions, 2026-10-05: ADI lessons use the guide's 6–8 lessons; Argue it out's ADI classes use "A unit (6–15 lessons)"; both Design lessons signed off.
- The ADI path is complete at five lessons (Recognise 1, Explain 2, Design 2).
- Open: plate for `adi-1-leaf-litter` (carried from item 47).

## Open questions for review

None.
