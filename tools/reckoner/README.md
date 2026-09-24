# Model companion guide schema

Content schema for the constructivist model companion guides that sit behind the reckoner. One YAML file per teaching model is the single source of truth for the reckoner's fit scores, the guide pages, the A4 export, the interactive checklist, and anything the AI layer is allowed to do.

The product is a **learning scaffold** for pre-service science teachers, so the schema encodes scaffolding rules, not just content: learners attempt before content is revealed, and the AI layer questions and gives feedback but never completes a learner's program.

## Quick start

```bash
npm install
npm run validate       # check every guide, cross-guide links and coverage
npm test               # schema rule tests, then build and render tests
npm run typecheck
npm run export-schema  # JSON Schemas for YAML editors and AI structured output
npm run build          # render the student app -> dist/site/ (shell, app.js, data/)
npm run publish:pages  # validate, test, build, then mirror dist/site/ into reckoner/ at the repo root
npm run check:pages    # confirm reckoner/ matches the YAML (what CI runs)
npm run review -- poe  # review copy of one guide, drafts included -> dist/review/poe-review.html
npm run build:single   # self-contained single file for offline use -> dist/single/index.html
```

## Files

| Path | Purpose |
| --- | --- |
| `src/schema/model-guide.ts` | The schema (Zod), including every cross-field quality rule |
| `src/schema/syllabus.ts` | NSW Science 7–10 (2023) whitelist: stages, focus areas, outcome codes |
| `src/schema/fit-dimensions.ts` | Reckoner questions and option order, shared with the reckoner UI |
| `content/guides/5e.yaml` | The 5E guide: reference instance for unit (macro) models |
| `content/guides/poe.yaml` | The POE guide: reference instance for single-lesson (micro) models |
| `content/guides/adi.yaml` | The ADI guide: reference instance for multi-lesson routines with stage groups |
| `content/guides/levels-of-inquiry.yaml` | The Levels of inquiry guide: reference instance for unranked guidance-dial models |
| `scripts/validate.ts` | Validates all guides, checks nesting links, reports coverage gaps |
| `scripts/test-rules.ts` | Breaks the guides in 30 ways and checks each is caught |
| `scripts/test-build.ts` | Build tests: deterministic output, drafts excluded, every guide renders (jsdom), stale files removed |
| `scripts/export-json-schema.ts` | Writes `dist/*.schema.json` |
| `scripts/build-site.ts` | Command line for the builds in `scripts/lib/build.ts` (site, single file, review copy) |
| `scripts/copy-to-pages.ts` | Mirrors `dist/site/` into `reckoner/`; `--check` compares only |
| `templates/app.html` | Page shell: markup and styles; `<!--__BOOT__-->` is replaced with the loader or inline data |
| `templates/app.js` | App code: reckoner scoring, guide rendering, routing |
| `content/catalogue.json` | Reckoner entries for models with no guide yet |
| `content/questions.json` | Reckoner question text, quick matrix and scale labels |

## Guide structure

| Section | What it holds | Consumed by |
| --- | --- | --- |
| Metadata | id, version, status (`draft`, `in-review`, `published`), review date, provenance | Build, review workflow |
| `reckoner` | Scale, fit profile, distinguishing feature, pitfall, evidence summary and strength | Reckoner ranking and result cards |
| `introduction` | Lead, purpose statement, audience, how to use | Guide page |
| `theory` | Foundations with design implications, critiques with responses | Guide page, "why this matters" notes |
| `roles` | Teacher and learner roles | Reckoner cards, guide page |
| `sequence` | Shape, summary, Mermaid diagram, scale note | Guide page |
| `phaseGroups` | Optional stage groups for models with many phases, e.g. ADI's investigate / argue / write and review | Guide page, flow diagram |
| `phases` | Job, essential features, teacher and learner moves, typical share, formative checks, **look-fors**, positive and negative **examples** | Guide page, checklist, auditor, contextualiser |
| `workedSequences` | Context-tagged sequences (timed in lessons) or episodes (timed in minutes), with scaffold slots and a predict-before-reveal prompt | Guide page, skeleton drafter |
| `misapplications` | Looks like, why it undermines, fix | Guide page, auditor |
| `checklist` | Grouped items linked to look-fors | Interactive audit, PDF |
| `syllabusAlignment` | Working scientifically mapping, depth studies, data science, inclusion | Guide page |
| `nesting` | Links to other models, with direction (`hosts` or `nests-in`) and the phase involved | Reckoner nesting suggestions |
| `reflectionPrompts` | Personal, critical and application prompts, plus coach follow-ups | Guide page, reflection coach |
| `scaffold` | Tutor mode, reveal-after-attempt, AI grounding, allowed capabilities, hard limits | Front end and AI layer |
| `references` | APA citations with URL or DOI | Everywhere claims are made |

**Look-fors are the backbone.** Each is a question with strong and weak evidence. Examples, misapplications, checklist items and the auditor all point at look-for ids, so a judgement is defined once and reused everywhere.

## Quality rules enforced at build time

- Every phase has at least one positive and one negative example. With stage groups, the pair is required once per group instead.
- Every worked sequence visits every phase.
- Outcome codes must be on the syllabus whitelist and match the stage of their context.
- Every look-for, phase and reference id that is cited must exist, and ids are unique.
- Unknown keys are errors, so a typo or a YAML comma inside an unquoted value cannot silently drop content.
- Unit models time steps in lessons; single-lesson models time steps in minutes; a sequence uses one unit.
- All eight Working scientifically skills are mapped. A skill the model does not build has no phases and a note on how to address it.
- A model that hosts another names one of its own phases. A model that nests in another names the host's phase, checked once the host guide exists, and the validator warns when the two guides disagree.
- The fit profile has the right number of scores for every reckoner dimension.
- Reflection prompts cover personal, critical and application perspectives.
- The default mode is tutor; practitioner mode cannot be the default.
- **A guide cannot be published while any example or worked sequence is AI-generated or unreviewed.**

## Scaffold and AI policy

Each guide's `scaffold.ai` block is injected into every AI call for that model:

- `groundedIn`: the only guide sections the AI may draw on
- `allowed`: which capabilities are switched on (contextualise examples, audit a program, draft a skeleton, coach reflection, compare models)
- `never`: hard limits, such as never completing a learner's program or filling scaffold slots
- `auditorFocus`: the look-fors the auditor checks first

AI output returns as JSON matching `dist/example.schema.json` or `dist/sequence-step.schema.json`, is validated with the same rules, and carries `provenance.source: ai-generated` until a reviewer promotes it.

## Authoring workflow

1. Copy `content/guides/5e.yaml` to `content/guides/<id>.yaml`, using an id from `MODEL_REGISTRY` in `scripts/validate.ts`.
2. Author with `status: draft`, and run `npm run validate` as you go. Point your editor's YAML extension at `dist/model-guide.schema.json` for autocompletion.
3. Move to `in-review`, then have a science educator review every example and worked sequence, recording `reviewedBy` and `reviewedOn`.
4. Set `status: published` only when validation passes.

## Publishing to students

The page GitHub Pages serves at `/LXDUNE/reckoner/` is split so that content and code change separately:

```
reckoner/
  index.html              page shell and loader; changes only when templates/app.html changes
  app.js                  app code; changes only when templates/app.js changes
  data/manifest.json      models, questions, catalogue, published guide list with versions
  data/guides/<id>.json   one file per published guide
```

The loader fetches the manifest, then every published guide, then `app.js`. Guide and app URLs carry a content hash, so a changed file is never served from a stale cache. The page needs a web server; for a copy that opens from disk, use `npm run build:single`.

Only guides with `status: published` are included, so unreviewed content cannot reach students. Models without a guide still appear in the reckoner, marked "guide coming soon". The build is deterministic, so the same YAML always produces identical files.

**To update a guide:** edit its YAML, run `npm run publish:pages`, and commit. The output lists exactly which files in `reckoner/` changed; a content edit to one guide changes only that guide's JSON and the manifest. The YAML is canonical: never edit anything in `reckoner/` by hand. The `Reckoner` GitHub Actions workflow fails if `reckoner/` does not match the YAML.

**To have a guide reviewed:** run `npm run review -- <id>` and send the reviewer `dist/review/<id>-review.html`. It is one self-contained file that opens in any browser, starts at that guide, includes draft and in-review guides marked "Not yet reviewed", and carries a "Review copy, not for students" banner. Record sign-off in the guide's `provenance.reviewedBy` and `reviewedOn`, then publish.

## Guide status

| Guide | Scale | Status | Worked sequences | Notes |
| --- | --- | --- | --- | --- |
| 5E | Unit (macro) | published, v1.0.0 | Stage 4 Forces; Stage 4 Biology (Cells and classification); Stage 5 Biology (Disease) | Reviewed |
| POE | Single lesson (micro) | published, v1.0.0 | Stage 4 Biology (Living systems, yeast); Stage 5 Biology (Disease, handwashing model) | Reviewed; AI drafting switched off in tutor mode |
| ADI | Multi-lesson routine (meso) | published, v1.0.0 | Stage 5 Biology (Environmental sustainability, microhabitats) | Reviewed; eight stages in three groups |
| Levels of inquiry | Guidance dial | published, v1.0.0 | Stage 4 Biology (Living systems, progression across a unit) | Reviewed; no fit profile; owns the reckoner's guidance dial and its evidence |

## Changelog

**1.3** (the dial heuristic becomes evidence-bearing)

- `reckoner.dialHeuristic` on dial models: factors scored per reckoner option, each with a rationale, an evidence strength and citations; ascending thresholds; and hard caps such as "never above structured for novices".
- Validation: every option must be scored, thresholds must ascend and cover the maximum, references must resolve, and a factor claiming evidence must cite at least one reference.
- The reckoner now computes the recommended level from the guide, and shows why, with the evidence strength and sources for each factor.



**1.2.1** (found by authoring the Levels of inquiry guide, the first guidance-dial model)

- The reckoner's guidance dial now reads its level names and descriptions from the Levels of inquiry guide, instead of hardcoding them in the template.
- The ranking explains unranked models rather than omitting them silently.
- The validator reports YAML syntax errors with file, line and likely cause, instead of a stack trace.
- A third flow-mapping truncation class fixed: single-line values containing ": " are now quoted across all guides.



**1.2** (found by authoring the ADI guide, the first model with eight stages)

- Optional `phaseGroups`, so many-staged models group their phases; the positive and negative example pair is then required once per group rather than once per phase.
- Cross-guide nesting now reconciled in both directions for 5E, POE and ADI.
- Strict mode caught two more YAML flow-mapping truncations, in an essential feature and a nesting entry. All such values are now quoted.
- `npm run build -- --drafts` produces a review copy, with unreviewed guides banner-marked.

**1.1** (found by authoring the POE guide, the first single-lesson model)

- Steps take `lessons` or `minutes`, and the unit must match the model's scale.
- Working scientifically skills can be deliberately unmapped, with a required note.
- Nesting has a direction: `hosts` or `nests-in`, with cross-guide phase checks and reciprocity warnings.
- Objects are strict. This exposed a 1.0 bug: a 5E checklist item containing a comma had been silently truncated by YAML. Checklist text is now quoted.

**1.0** Initial schema, with the 5E guide as the reference instance.

Outcome statements are not stored locally; link to the [NESA outcomes page](https://curriculum.nsw.edu.au/learning-areas/science/science-7-10-2023/outcomes) for official wording.
