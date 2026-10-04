# Handoff: Fieldwork ADI path, Choosing a model lesson 3, and the Reckoner's time-and-scale prompts

**Reviewed and signed off by:** Steve Grant, 2026-10-05 (the four lessons, and the decision behind the prompts and the How it works line).

**Branch:** `feature/fieldwork-adi`

## Goal

Fieldwork gains its third model path, Argument-Driven Inquiry, with three lessons. Choosing a model gains lesson 3, which adds ADI as a candidate. The Reckoner gains a "Have you thought about…?" prompt for when a model's scale and the class's timescale don't line up. The prompt supports teacher judgement and doesn't change the ranking.

## Scope

- **Changes:** `tools/reckoner/` (content/game, content/methodology.yaml, src/schema/game-lesson.ts, scripts/lib/game.ts, scripts/test-build.ts, scripts/test-game.ts, templates/app.html, templates/app.js, templates/game.js), then the generated `play/`, `reckoner/` and `docs/reckoner-state.md` via `npm run publish:pages`, and `docs/ACTION-PLAN.md`.
- **Must not change:** any guide in `content/guides/` (no version bumps); the existing 10 lessons; the wording of existing watch-out and nesting rules (the rules-hash test must still pass unchanged); storage keys; `moodle-blocks/`, `config/`, `generate/`, `test/`, root `scripts/`.

## New files

| File | Goes to | What it is |
|---|---|---|
| `2026-10-05-fieldwork-adi.patch` (alongside this handoff) | applied from the repo root | Every source change below as one `git diff` against `main` at `973e242`, limited to `tools/reckoner/` |

The patch carries four new lesson files, all published, v1.0.0, `ai-drafted-reviewed`, reviewed by Steve Grant on 2026-10-05:

| Lesson | Path · level | Built on |
|---|---|---|
| `adi-1-leaf-litter` Under the leaf litter | ADI · Recognise, 11 items | `seq-s5-microhabitats` |
| `adi-2-noise` Keep the noise out | ADI · Explain, 11 items | `seq-s5-sound` |
| `adi-3-review` Review, then revise | ADI · Explain, 11 items | `seq-s5-microhabitats` lessons 6–8 |
| `select-3-argue` Argue it out | Choosing a model · Select, 7 items | Reckoner fit profiles of 5E, POE, ADI |

## Steps

1. Read before writing: `CLAUDE.md`, `docs/reckoner-state.md`, and `git log -1 origin/dev`. Report if `tools/reckoner/` on `dev` differs from `main` at `973e242`.
2. Branch `feature/fieldwork-adi` from an up-to-date `dev`.
3. `git apply --check docs/handoffs/2026-10-05-fieldwork-adi.patch`, then `git apply` it. If the check fails because `dev` has moved, apply the changes described below by hand and report what differed.
4. From `tools/reckoner`: `npm run publish:pages`, then `npm run typecheck`, `npm run check:pages`, `npm run check:regressions -- origin/main`.
5. Add the action-plan item (below), commit, open a PR into `dev`, and merge once the `Reckoner` check passes.
6. Steve has asked for this to be published: release `dev` into `main` with `/ship`, then confirm the Pages files match.

## What the patch changes

### Game engine (no effect on 5E, POE, scoring or saved progress)

1. **`game.yaml` path setting `rail: phases | groups`** (default `phases`). With `groups`, the lesson rail shows the journey guide's `phaseGroups` (ADI: Investigate · Argue · Write and review). The loader refuses `groups` on a guide without `phaseGroups`.
2. **Colour by group.** A guide with `phaseGroups` colours each phase by its group, so eight stages never wrap round the five colours. 5E and POE have no groups, so they are unchanged.
3. **Stage tag.** On a grouped guide, an item's phase tag shows the stage name in its group colour ("ARGUMENTATION SESSION · TEACHER MOVE"). The 5E glyph tags and POE's plain tags are unchanged.
4. **Spot items take an optional `among`** (2–5 phase ids). Only those phases are offered, feedback is required only for them, and the answer must be one of them.
5. **Lessons take an optional `requires`** (path and level), on top of the path's unlock and the previous lesson. The map shows "Unlocks at Explain on the ADI path". This puts `select-3` on the Choosing a model path without re-locking it for students who already opened it.
6. **`game.yaml`:** the ADI path sits between POE and Choosing a model, uses `rail: groups`, and requires POE Explain. The `select` path's `models` becomes `[5e, poe, adi]`.
7. Railnote article fix ("an Argument-Driven Inquiry sequence").

### Reckoner: "Have you thought about…?" prompts

`timePrompts(m, a, W)` in `templates/app.js`, shown on the detailed Reckoner's top three cards in a new `.ponder` box (accent tokens, both themes). It is not a watch-out rule, so the rule texts and their hash are untouched. Prompts:

| Model scale | Timescale | Prompt (shortened) |
|---|---|---|
| Multi-lesson routine | One lesson | It ranks well because of what you want students to do, which counts most. Could a single-lesson model carry that purpose this time, or could you find the extra lessons? |
| Unit architecture | One lesson, or 2–5 lessons | Would a shorter routine or a single-lesson model suit this stretch, with the unit model kept for the longer arc? |
| Multi-lesson routine | A unit, or a depth study | It can run as one routine inside a unit model, or carry the unit itself. Which serves your unit's arc better? |
| Single lesson | A unit, or a depth study | Which unit model or routine will it sit inside? |

A model the existing time watch-out already covers (PBL, project-based, AST, interactive approach, 7E) gets no prompt, so nothing is said twice. Each prompt carries "Prompt, because you chose … for timescale".

**`content/methodology.yaml`:** minor bump, `lastReviewed` and `reviewedOn` 2026-10-05, one line added to the `rules` section:

> **Have you thought about…?** prompts appear when a model's scale and your timescale don't line up: a multi-lesson routine for one lesson, unit architecture for a few lessons, or a routine that could either sit inside a unit or carry it. Purpose counts most, so a model can rank first even when its length doesn't match your time. The Reckoner supports your judgement; weighing the prompt is your call.

### Tests

- Build: new test "time-and-scale prompts…" (ADI one lesson; ADI a unit; 5E in 2–5 lessons; none for 7E in 2–5 lessons; none where scale and time agree or time is blank; the top card on the page for argue + one lesson is a routine and shows the prompt).
- Game: new tests for the grouped rail and `among` in jsdom, and for refusals (answer outside `among`, a lesson requiring an unknown path, `rail: groups` without `phaseGroups`). The lock test now also checks that the ADI path waits for POE Explain and that a lesson with its own `requires` stays locked, says why, then opens.

## Expected results

- Models in the Reckoner: 15. Published guides: 6. Examples: 58. Worked sequences: 20. Focus areas unchanged. No guide version changes.
- Methodology: one minor bump.
- Published game lessons: 10 → 14 (paths: 5E 6, POE 2, ADI 3, Choosing a model 3).
- Build tests: 19 → 20. Game tests: 20 → 22. The rules-hash test passes unchanged.
- validate, test, typecheck, check:pages and check:regressions all pass. Verified on a clean clone of `main` at `973e242` before this handoff was written.

## Commits

1. `feat(game): grouped rails, spot among, and lesson-level unlocks`: schema, loader, game.js, game tests.
2. `content(game): ADI path lessons 1–3 and Choosing a model lesson 3`: the four lesson files and `game.yaml`.
3. `feat(reckoner): time-and-scale "Have you thought about" prompts`: app.js, app.html, methodology.yaml, build test.
4. `chore(pages): publish`: `play/`, `reckoner/`, `docs/reckoner-state.md`, `docs/ACTION-PLAN.md`.

Each ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Action plan

Next item: **Fieldwork ADI path and the Reckoner's time-and-scale prompts**. Record:

- Steve's decisions, 2026-10-05: three-group rail; Biology (microhabitats) then sound; five ADI lessons in all (Design lessons follow); ADI added to Choosing a model now; ADI path unlocks after POE Explain.
- Steve's decisions on the Reckoner, 2026-10-05: the Reckoner supports teacher judgement rather than being foolproof, so a one-lesson class that ranks ADI or SWH first gets a prompt, not a gate. ADI's guide length (6–8 lessons) is right; ADI can serve as a routine inside a unit or as the unit's architecture, and the prompt puts that choice to the teacher. ADI's fit profile is unchanged.
- Open: Round 6, ADI Design lessons `adi-4` (Build it: ADI) and `adi-5` (Argument Day, a branching sim on `seq-s5-sound`).
- Open: the ADI guide's `scaleNote` says ADI "replaces a practical and its report, not the whole unit". Steve's 2026-10-05 view is that ADI can also carry a unit. Align the wording the next time the ADI guide is reviewed (patch bump).
- Open: plate for `adi-1-leaf-litter` (add to `PLATES` in `game.js`), alongside item 46's plate list.

## Open questions for review

None blocking. The methodology line above is new wording; Steve approved the decision, and this is the exact text students will see on How it works.
