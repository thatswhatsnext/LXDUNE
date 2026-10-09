# Habit Studio: authoring guide

How to write the Studio's content. The design and the reasons behind it are in
`docs/habit-studio-pilot-spec.md`; the exact fields are in `games/_schema/studio.schema.json`.
The samples in `content/model/` show one complete example of every content type.

## Workflow

1. **Draft.** Each item starts as `"source": "ai-generated"` (or `"authored"` if you wrote it),
   `"reviewedBy": []`, `"published": false`. Use `authorNote` for anything reviewers need to know; players
   never see it.
2. **Check.** `npm run validate` from the repo root. Drafts don't fail the build; the Studio validator lists
   them, with progress towards the spec's counts (for example, `case pairs 1/3`).
3. **Review copy.** `node scripts/studio-review.js model ~/Documents/LXDUNE-private/review.html` renders
   every station as a player meets it, with expert answers. Keep it private.
4. **Publish.** When an item is reviewed: `"source"` becomes `"ai-drafted-reviewed"` (or stays
   `"authored"`), `"reviewedBy"` names the reviewer, `"lastReviewed"` is the date, `"published": true`. The
   validator then holds it to the full rules.

Once anything in a habit is published, the validator expects the whole set: 3 station case pairs, at least
10 station artefacts with at least two at each rubric level, and 2 briefs.

## House rules

- Australian English. Write “Aboriginal and Torres Strait Islander” in full.
- Cite NSW syllabus outcome codes if needed; don't quote or paraphrase NESA outcome wording.
- Contexts are vocabulary ids (`stages`, then `focusArea`, or `syllabus` + `module`, plus an optional
  `note`), as in the Coach.
- Content strings may use `<b>`, `<i>`, `<sub>` and `<sup>` only. Write formulae as
  `CO<sub>2</sub>`.
- Never use real names. Speakers are roles: `Teacher`, `Student A`, `Margin note 1`.
- `"material": "composite"` for anything constructed to be realistic. Real classroom material
  (`"real-deidentified"`) needs consent and removal of anything identifying (spec §6.1).
- If a case involves Aboriginal and Torres Strait Islander students or draws on frameworks such as 8 Ways of
  Learning, consult Aboriginal and Torres Strait Islander educators; don't author it alone.

## Station A: explainer (`explainer.json`, one per habit)

| Field | What it's for | Good when |
|---|---|---|
| `body` | ~600 words, as paragraphs | It explains the mechanism (what changes in students' thinking), in plain language, for a beginning teacher |
| `diagram` | A 2–5 stage sequence the app draws | `alt` says everything the diagram shows |
| `prompts` | 2–3 self-explanation prompts, each placed after a paragraph | The prompt asks *why*, and the expert answer could only be written by someone who understood the paragraph |
| `dilutions` | 4–6 common ways the habit is diluted | Each one is a real failure you've seen, with a concrete example |
| `evidence` | Citations | Each is checked against the source and marked `"verified": true` before publishing |

## Station B: contrasting cases (`cases.json`, 3 per habit, plus spaced-return pairs)

Two transcripts of the same moment that differ in **one deliberate feature**.

- **Same length.** Keep the versions within 20% of each other (the validator checks). If the better version
  is also the longer one, length gives the answer away; fill the weaker version with ordinary talk
  (procedure, encouragement, notation) instead of the missing feature.
- **Same everything else.** Same class, same content, same opening line, same correct science.
- **Order by difficulty.** Pair 1 is noticeable (`difficulty: 1`); pair 3 should be subtle enough that
  capable players disagree (`difficulty: 3`).
- **Notes point at lines.** Each `annotation.notes` entry names a version and a 1-based line number.
- `use: "spaced"` marks pairs kept back for the 3- and 10-day revisits.

## Station C: rubric and artefacts (`rubric.json`, `artefacts.json`)

**Rubric:** four levels describing the *thinking*, not the polish. Each level has a short anchor, quoted as
a student would say or write it. Levels should be distinguishable by what a student does, not by how much
they write.

**Artefacts:** 10–12 per habit for the station, plus 4–6 for spaced return.

- Spread them across the levels: at least two at each.
- Vary length and neatness *within* each level, so players can't place work by how tidy it looks.
- Include some that are genuinely hard to place. Where reviewers disagree, that's useful: the app shows
  “Experts split” with both rationales.
- **Placements:** two experts place each artefact independently, without seeing each other's placement
  first. `by` is the reviewer's name; a provisional placement from a draft is `"by": "draft"` and must be
  replaced before publishing.

## Station D: briefs (`briefs.json`, 2 per habit)

- A concrete class, topic and lesson moment, and what these students tend to think.
- `selfCheck`: 3–5 criteria the player checks their own draft against before seeing the exemplars.
- **Three exemplars:** `strong`, `flawed` and `weak`. The flawed one is the most important to get right: it
  should be something a capable beginning teacher would write, with one or two real weaknesses — not a
  strawman.
- **Annotations quote the exemplar word for word** (the validator checks); the app highlights the quoted
  phrase and shows the comment beside it.

## Station E: unit plan (`unit-plan.json`, one per habit)

An annotated expert plan across a 4–12 week unit. Moments are `introduce`, `practise`, `fade` and `check`,
in week order, and the plan must check for unprompted use after the scaffold fades. Each moment says *what*
happens and *why*.

## Station F: rehearsal (`rehearsal.json`, one per habit)

- `cues`: 3–6 short reminders shown beside the player's own script while they rehearse aloud.
- `protocol`: what to try on placement, what student evidence to collect, and exactly three questions to
  answer afterwards.

## Science

Every case, artefact and exemplar must be scientifically right, including the idealisations: if a puck
slides on “smooth” ice, there is still a little friction. Check worked examples (balanced equations,
calculations) by hand.
