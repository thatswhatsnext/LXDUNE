# Fieldwork Round 7 redraft: awaiting Steve's review

Drafts only, kept here because they can't live in `tools/reckoner/content/` yet: a published guide may not hold
unreviewed content, and these lessons depend on the new spinners sequence. Nothing here is validated or built.

## Steve's direction

- 2026-10-08: the game's bottles lessons felt clunky and imprecise, and the separation and bottles examples overlap
  (both Chemistry practicals on the properties of materials). Lesson 1 moves to a new example.
- 2026-10-08: the guide's bottles sequence reads well; rework the game's translation of it rather than drop it.

So lessons 2–5 come in two variants for Steve to choose between.

## Files

| File | Goes to on sign-off | What it is |
|---|---|---|
| `swh-seq-s4-spinners.yaml` | appended to `workedSequences` in `tools/reckoner/content/guides/swh.yaml` | New worked sequence: paper spinners, Stage 4 Forces (SC4-FOR-01), five lessons, all seven phases. Guide minor bump; set provenance to `ai-drafted-reviewed` with Steve as reviewer |
| `swh-1-spinners.yaml` | `tools/reckoner/content/game/` | SWH lesson 1, Recognise, on the spinners sequence |
| `select-4-routine.yaml` | `tools/reckoner/content/game/` | Choosing a model lesson 4: ADI or SWH? |
| `bottles/swh-2-bottles.yaml` … `swh-5-negotiation-day.yaml` | `tools/reckoner/content/game/` | Variant A, lessons 2–5 on `swh-seq-s5-bottles`, reworked |
| `duckweed/swh-2-duckweed.yaml` … `swh-5-negotiation-day.yaml` | `tools/reckoner/content/game/` | Variant B, lessons 2–5 on `swh-seq-s5-duckweed` |

Only one variant goes in. Both use the ids `swh-3-negotiate`, `swh-4-build` and `swh-5-negotiation-day`.

## What the bottles rework fixes

The first game draft drifted from the guide: claims about keeping drinks cold from a hot-water cooling test, data
invented item by item, purposes that shifted (cold drinks, school bags, a density offcut), and the steel bottle's
vacuum wall arriving as a twist. The rework keeps to the guide's tests (cooling with 80 °C water, mass, a contained
drop test) and runs one class data set through every lesson:

| | Steel (double-walled) | Copolyester plastic | Glass | Aluminium |
|---|---|---|---|---|
| 80 °C water after 60 min | 71 °C | 49 °C | 46 °C | 42 °C |
| Empty mass | 350 g | 130 g | 420 g | 160 g |
| Contained drop, 3 drops | small dent | undamaged | cracked | dented |

Published figures released in lesson 6: thermal conductivity about 16 (stainless steel), 200 (aluminium), 1 (glass),
0.2 (copolyester) W/m·K, with density, cost and recyclability. One steel trial lost 20 °C with a loose lid, as in the
guide's positive Evidence example. The guide's own scaffold prompt (the glass drop on concrete) is now an item, and
the predict item's data sit in the scenario box rather than the heading.

## Checks (2026-10-08)

Each variant was checked in a preview copy where the spinners sequence counted as reviewed: validate, 21 build tests,
22 game tests (the review copy plays all 22 lessons to the end), typecheck; no sideways scroll at 360 px. Every answer
and reason in `select-4-routine` agrees with the Reckoner's scoring.

The SWH path and the `swh` model on Choosing a model are already in `game.yaml` on this branch. Until lessons land,
the path shows no lessons, so don't release the branch before sign-off.
