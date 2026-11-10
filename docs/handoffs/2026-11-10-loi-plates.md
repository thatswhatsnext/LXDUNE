# Fieldwork plates for Levels of inquiry and Set the dial

Steve Grant selected WH3, NS1, WM2, BP2, QC1 and SD2 on 10 November 2026. The six lessons were signed off separately on the same date.

**Target branch** `feature/fieldwork-loi` at `c88f08779d1f3d859fffe9558c6bf91947cd198c`.

## Goal

Give each of the six lessons an opening illustration in the approved Field Guide cartoon style. Each image and its alt text withhold the dial setting and any worked answer.

| Lesson | Selection | Illustration |
| --- | --- | --- |
| `loi-1-who-holds` | WH3 | Open binder, ruler and ten blank lesson slips |
| `loi-2-nothing-at-stake` | NS1 | Two pairs of pupils preparing the same ruler catch |
| `loi-3-whose-method` | WM2 | Three pupils and a teacher around a shared science bench |
| `loi-4-build` | BP2 | Open planner, ruler and loose cards outside the planner |
| `loi-5-question-conference` | QC1 | A teacher and four pupils gathered around one science bench |
| `select-5-set-dial` | SD2 | Blank calendar, closed notebook and dial face with an empty hub |

## Apply the patch

1. Confirm the target branch contains the signed-off lesson source at `c88f087`. Review the companion `2026-11-10-loi-plates.patch`. From the repository root, run `git apply --check <absolute-path-to-patch>`, then `git apply <absolute-path-to-patch>`.
2. The patch adds six entries after `select-4-routine` in `tools/reckoner/assets/field-guide/assets.json` and six corresponding WebPs in `tools/reckoner/assets/field-guide/lessons/`. Each entry provides descriptive alt text, intrinsic dimensions and a SHA-256 hash. The existing renderer uses the alt text as the accessible description.
3. From `tools/reckoner`, run `NODE_OPTIONS=--max-old-space-size=4096 npm run publish:pages`, `npm run typecheck` and `npm run check:pages`. Review the generated files before committing. The patch is source-only, following the earlier SWH handoff.
4. Keep the lesson YAML, guide YAML, existing illustrations, `game.js` and `game.html` intact. The current branch uses a manifest and WebP images for plates. There are no version bumps for this artwork.

## Expected results and verification

- The build contains 32 published lessons with 32 plates, up from 26 plates. The six new plates open their respective lessons. The existing Argue it out plate retains its placement after the nesting attempt.
- On an isolated copy, validation passed for 6 guides and 32 lessons. The syllabus and rule checks, 23 build tests, 28 game tests, type checking and Pages consistency checks passed. The local verification used Node's `--import tsx` loader to run the same scripts. The game suite required a 4 GB heap.
- Regeneration updates `play/index.html` and adds the six files under `play/img/`. At this base it also refreshes `docs/reckoner-state.md`, `reckoner/data/manifest.json` and `reckoner/data/guides/levels-of-inquiry.json` from the lesson sign-off and guide review metadata already in the branch.
- The ZIP carries the selected PNG masters under `masters/`. The six deployable WebPs are embedded in the binary patch.

The artwork is ready for implementation on the feature branch. Keep publication separate from applying and verifying this handoff.
