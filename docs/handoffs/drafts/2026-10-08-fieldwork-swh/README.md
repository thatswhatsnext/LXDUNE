# Fieldwork Round 7 redraft: awaiting Steve's review

Drafts only, kept here because they can't live in `tools/reckoner/content/` yet: a published guide may not hold
unreviewed content, and these lessons depend on the new spinners sequence. Nothing here is validated or built.

Steve's direction (2026-10-08): the bottles example confused readers and wasn't the best illustration of SWH in
action, and the separation and bottles examples overlap (both Chemistry practicals on the properties of materials),
so both are replaced.

| File | Goes to on sign-off | What it is |
|---|---|---|
| `swh-seq-s4-spinners.yaml` | appended to `workedSequences` in `tools/reckoner/content/guides/swh.yaml` | New worked sequence: paper spinners, Stage 4 Forces (SC4-FOR-01), five lessons, all seven phases. Guide minor bump; set provenance to `ai-drafted-reviewed` with Steve as reviewer |
| `swh-1-spinners.yaml` | `tools/reckoner/content/game/` | SWH lesson 1, Recognise, on the spinners sequence |
| `swh-2-duckweed.yaml` | `tools/reckoner/content/game/` | SWH lesson 2, Explain: claims and evidence, on `swh-seq-s5-duckweed` |
| `swh-3-negotiate.yaml` | `tools/reckoner/content/game/` | SWH lesson 3, Explain: reading and reflection, on duckweed |
| `swh-4-build.yaml` | `tools/reckoner/content/game/` | SWH lesson 4, Design: build board, on duckweed |
| `swh-5-negotiation-day.yaml` | `tools/reckoner/content/game/` | SWH lesson 5, Design: branching sim, on duckweed |
| `select-4-routine.yaml` | `tools/reckoner/content/game/` | Choosing a model lesson 4: ADI or SWH? |

Checked on 2026-10-08 in a preview copy where the spinners sequence counted as reviewed: validate, 21 build tests,
22 game tests (the review copy plays all 22 lessons to the end), typecheck; no sideways scroll at 360 px in light
and dark. Every answer and reason in `select-4-routine` agrees with the Reckoner's scoring.

The SWH path and the `swh` model on Choosing a model are already in `game.yaml` on this branch. Until lessons
land, the path shows no lessons.

Open question for Steve: retire or replace the guide's own `swh-seq-s5-bottles` too, or only keep it out of
Fieldwork? Removing it needs an allowance in `check:regressions`.
