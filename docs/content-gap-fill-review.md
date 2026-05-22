# Content Gap Fill — Review Document

**Branch:** feature/content-gap-fill  
**Date:** 2026-05-22  
**Status:** Pending Steve review — do NOT merge to dev without confirmation

---

## What was filled

### EDSE357

| Week | Field added | Assessment connection |
|------|-------------|----------------------|
| 4 — Research and Experimentation | `orientationNote` | AT1 Part A (experimental design underpins resource critique); AT1 Part C2 (OEI instructions) |
| 6 — Current and Future Uses of Science | `orientationNote` | AT2 — prompts students to start resource selection this week |
| 8 — Teaching with a Diverse Cohort | `orientationNote` | AT2 Diversity criterion (15%) — resource curation for diverse learners |

**Not added:** `forumPrompts` (by design — only weeks 3, 5, 7 have forum activities in EDSE357). `synthesisTemplate` (not in EDSE357 schema).

---

### EDSE358

| Week | Fields added | Assessment connection |
|------|-------------|----------------------|
| 3 — Module 3A: Constructivist Teaching | `orientationNote`, `forumPrompts` (2), `synthesisTemplate` | AT1 Part A forum post due this week; AT1 Part C1 (justifying pedagogical decisions) |
| 6 — Module 4B: Assessment Instrument Design | `orientationNote` | AT1 Part B4 (evaluation strategy); AT1 Part C1 (constructive alignment justification) |
| 7 — Module 4C: Differentiated Assessment | `orientationNote`, `forumPrompts` (2), `synthesisTemplate` | AT1 Part B (differentiation for named cohort); AT1 Part C2 (resource justification) |
| 8 — Module 4D: Rubrics and Feedback | `orientationNote`, `synthesisTemplate` | AT1 Part D1 (feedback planning criterion) |

**Not added to week 8 `forumPrompts`** — already present (3 prompts). Only `synthesisTemplate` was new.  
**Not modified:** weeks 1, 2, 4, 5.

---

### EDSE362

| Week | Field added | Assessment connection |
|------|-------------|----------------------|
| 5 — The Inclusive Science Classroom | `orientationNote` | LO5; foundational for Topic 6 assessment design work |
| 6 — Planning and Evaluating a Unit of Work | `orientationNote` | AT1 due 26 July — prompts students to begin drafting now |
| 7 — Teaching and Learning Science Using Analogies | `orientationNote` | LO1, LO3 — pedagogical content knowledge for junior science |
| 8 — Developing Your Science Content Knowledge | `orientationNote` | AT2 due 6 September — content audit as AT2 preparation |

**Not added:** `forumPrompts` (no forum links exist in EDSE362 — T2 Moodle not yet set up). No other fields.

---

## Content principles applied

All generated content follows the conventions established in existing orientationNotes in the codebase:

- **Tone:** professional and direct; addresses the student as a developing teacher, not a passive learner
- **Assessment connection:** always explicit — names the specific task, part, and criterion where relevant
- **Action orientation:** tells students what to do with the week's content, not just what it covers
- **No platitudes:** avoids "this is an important week" framing; every note earns its place

The `forumPrompts` for EDSE358 weeks 3 and 7 follow the existing pattern (week 4, 5, 6, 8) — two prompts per week, one requiring application of the week's content, one connecting explicitly to the assessment task.

The `synthesisTemplate` entries for weeks 3, 7, 8 follow the existing week 6 pattern — bracketed placeholders for a cohort strength observed, a common issue, and a feed-forward to the next module or submission deadline.

---

## What still needs Steve

The following gaps were identified in Phase 1 but are outside the scope of auto-fill:

| Gap | Unit(s) | Reason |
|-----|---------|--------|
| All `links.*` (lecture, slides, recording, forum, materials, hub) | EDSE357 all weeks | Moodle URLs not available |
| `links.lecture`, `links.slides` | EDSE358 weeks 1, 2, 3, 6, 7 | Echo360/Moodle URLs needed |
| `links.recording` | EDSE358 all weeks | No session recordings uploaded yet |
| `links.liveHub` | EDSE358 weeks 6, 7, 8 | Moodle section IDs needed |
| All links + videos | EDSE362 all weeks | T2-2026 Moodle content not yet uploaded |
| `video` YouTube IDs | EDSE362 weeks 1–8 | Videos not yet recorded |
| AT1, AT2 full content | EDSE362 | Titles, rationale, parts, criteria, rubric all null |
| Zoom details | EDSE362 | T2-2026 session not yet scheduled |

---

## Commits

| Commit | Unit | Changes |
|--------|------|---------|
| `47c41a2` | EDSE357 | orientationNote weeks 4, 6, 8 |
| `207a7a1` | EDSE362 | orientationNote weeks 5, 6, 7, 8 |
| `2035a0a` | EDSE358 | orientationNote weeks 3, 6, 7, 8 + forumPrompts weeks 3, 7 + synthesisTemplate weeks 3, 7, 8 |

---

## Review checklist

Before merging to dev, Steve should confirm:

- [ ] EDSE357 week 4 orientationNote — assessment connection accurate?
- [ ] EDSE357 week 6 orientationNote — timing and resource selection framing correct?
- [ ] EDSE357 week 8 orientationNote — Diversity criterion connection accurate?
- [ ] EDSE358 week 3 forumPrompts — appropriate difficulty and timing given Part A is due this week?
- [ ] EDSE358 week 3 synthesisTemplate — tone and bracket placeholders match how you use this?
- [ ] EDSE358 week 7 forumPrompts — appropriate given students may not yet have an AT1 draft?
- [ ] EDSE358 week 8 synthesisTemplate — correct that submission is 5 April?
- [ ] EDSE362 week 6 orientationNote — correct that AT1 is due 26 July?
- [ ] EDSE362 week 8 orientationNote — correct that AT2 is due 6 September?
