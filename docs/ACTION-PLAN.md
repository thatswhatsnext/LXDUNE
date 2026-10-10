# LXDUNE Action Plan
**Last updated:** 2026-09-24
**How to update:** Tell Claude Code "Update docs/ACTION-PLAN.md — mark item X complete" or "add [item] under [priority]"

---

## 🔴 Do now — units are live

### 1. Verify live Moodle shells are working ✅ — 2026-05-19
Confirm whatson and autovideos render correctly in production Moodle for both EDSE357 and EDSE358 after the Phase 4 refactor.
- [x] Open live EDSE357 Moodle page — confirm whatson shows correct week, autovideos shows correct video
- [x] Open live EDSE358 Moodle page — same check
- [x] If either shows "Loading..." permanently, check shell HTML for stale import URL or ID mismatch

### 2. EDSE358 week 8 — write missing content ✅ — 2026-05-18
- [x] Write `announcementBody`, `liveSessionFocus`, `liveSessionTasks` for Module 4D
- [x] Populate `links.lecture`, `links.forum`, `links.materials` for week 8
- [x] Commit to dev and push
- Note: `slides`, `recording`, `liveHub` still null — tracked in item 7

### 3. Fix EDSE358 AT2 known broken links ✅ — 2026-05-18
- [x] Confirm correct Chemistry marking guide URL
- [x] Confirm correct EES task URL
- [x] Update `config/units/EDSE358.json` assessmentFiles — commit `b168bd0`

### 4. Confirm GitHub Pages is on main ✅ — 2026-05-19
- [x] Settings → Pages → confirm source is `main`
- [x] Verify: `curl https://thatswhatsnext.github.io/LXDUNE/moodle-blocks/blocks.js` returns 200

### Fix week resolution — Monday anchor ✅ — 2026-06-22
Timezone parse bug: blocks.js buildDateList() week-1 entry parsed ISO date string as UTC
midnight while all other entries used local midnight, resolving the trimester start date to
week 0 in UTC+ timezones. Fixed commit b75b84b (blocks.js) + 4c29261 (test/index.html twin
copy). A prior workaround that shifted start dates to Sundays was reverted — it had moved
every week boundary from Mon–Sun to Sun–Sat. Merged dev → main 1e82b3a.

---

## 🟡 Do this week — set up live unit pages

### 5. Deploy EDSE358 Moodle shells ✅ — 2026-05-19
Generate from `generate/index.html` and paste into Moodle. Output file: `docs/EDSE358-T1-2026-shells.html`

**Course level:**
- [x] Course hub — `renderCourseHub`
- [x] Learning outcomes table — `renderLearningOutcomesTable`
- [x] Assessment download block — `renderAssessmentDownloadBlock`
- [x] AT1 assessment page — `renderAssessmentPage({ forTask: 'AT1' })`
- [x] AT2 assessment page — `renderAssessmentPage({ forTask: 'AT2' })`
- [x] AT1 pre-submission checklist
- [x] AT2 pre-submission checklist

**Per module (weeks 1–8):**
- [x] Announcement block — `renderAnnouncementBlock`
- [x] Workflow card — `renderWorkflowCard`
- [x] Lecture block — `renderLectureBlock`
- [x] Live session hub — `renderLiveSessionHub`

**Module 4C only:**
- [x] Resource directory — `renderResourceDirectory`

### 6. Deploy EDSE357 Moodle shells ✅ — 2026-05-19
Output file: `docs/EDSE357-T1-2026-shells.html`

**Course level:**
- [x] Course hub — `renderCourseHub`
- [x] Learning outcomes table — `renderLearningOutcomesTable`
- [x] Assessment download block — `renderAssessmentDownloadBlock`
- [x] AT1 assessment page — `renderAssessmentPage({ forTask: 'AT1' })`
- [x] AT2 assessment page — `renderAssessmentPage({ forTask: 'AT2' })`
- [x] AT1 pre-submission checklist
- [x] AT2 pre-submission checklist

**Per topic (weeks 1–8):**
- [x] Announcement block — `renderAnnouncementBlock`
- [x] Workflow card — `renderWorkflowCard`
- [x] Lecture block — `renderLectureBlock`
- [x] Live session hub — `renderLiveSessionHub`

### 7. EDSE358 missing links ⬜
Update `config/units/EDSE358.json` as content is published:

| Week | Links needed |
|------|-------------|
| 1 (Module 1) | lecture, slides, recording, forum, materials, liveHub |
| 2 (Module 2) | lecture, slides, recording, forum, materials, liveHub |
| 3 (Module 3A) | lecture, slides, recording |
| 6 (Module 4B) | lecture, slides, liveHub, recording |
| 7 (Module 4C) | lecture, slides, liveHub, recording |
| 8 (Module 4D) | slides, recording, liveHub |

### 8. EDSE358 assessment links ⬜
- [ ] AT1 rubric PDF URL → `assessmentTasks[AT1].links.rubric`
- [ ] AT1 task files URL → `assessmentTasks[AT1].links.taskFiles`
- [ ] AT1 submit URL → `assessmentTasks[AT1].links.submit`
- [ ] AT1 forum URL → `assessmentTasks[AT1].links.forum`
- [ ] AT2 rubric PDF URL → `assessmentTasks[AT2].links.rubric`
- [ ] AT2 submit URL → `assessmentTasks[AT2].links.submit`

### 9. EDSE358 rubric descriptors ⬜
- [x] AT1 rubric descriptors populated ✅
- [x] AT2 rubric descriptors populated ✅

---

## 🟣 Navigation blocks — populate unit key info links

### 9a. Add key link URLs to unit JSONs ✅ — 2026-05-23

**EDSE358:** ✅ — 2026-05-19
- [x] `keyLinks[0].url` — Unit Outline
- [x] `keyLinks[1].url` — Learning Materials
- [x] `keyLinks[2].url` — Assessment Portal

**EDSE357:** ✅ — 2026-05-19
- [x] Same three links as above

**EDSE362:** ✅ — 2026-05-23
- [x] `keyLinks[0].url` — Unit Outline
- [x] `keyLinks[1].url` — Learning Materials
- [x] `keyLinks[2].url` — Assessment Portal

### 9b. Add navigation shells to deployed Moodle pages ✅ — 2026-05-19

**For EDSE358 (T1 2026):**
- [x] `unit-key-info` shell generated — `docs/EDSE358-navigation-shells.html`
- [x] `assessment-status` shell generated — same file

**For EDSE357 (T1 2026):**
- [x] Same — `docs/EDSE357-navigation-shells.html`

### 9c. Set bannerUrl for each unit ✅ — 2026-05-19
- [x] SVG banners created and served from GitHub Pages (`assets/banners/`) — Moodle upload not needed
- [x] `bannerUrl` set in all three unit JSONs — pointing to live GitHub Pages SVG URLs

---

## 🟠 Do before end of trimester — EDSE357 content

### 10. EDSE357 week links ⬜
Populate as content is published — for each of Topics 1–8:
- [ ] `links.lecture` — Echo360 URL
- [ ] `links.slides` — PDF or PowerPoint URL
- [ ] `links.recording` — post-session recording URL
- [ ] `links.forum` — Moodle forum URL
- [ ] `links.materials` — Moodle book/page URL
- [ ] `links.liveHub` — live session hub page URL

### 11. EDSE357 assessment links and files ⬜
- [ ] AT1 rubric PDF URL
- [ ] AT1 task files URL
- [ ] AT1 submit URL
- [ ] AT1 forum URL
- [ ] AT1 unpacking video URL — once recorded
- [ ] AT2 rubric PDF URL — once published
- [ ] AT2 submit URL
- [ ] AT2 forum URL
- [ ] AssessmentFiles — discipline task and marking URLs for AT1 and AT2 (Biology, Chemistry, EES, Investigating Science, Physics)

---

## 🟢 Do before T2 2026

### 12. EDSE358 T2 2026 preparation ⬜ (in progress)
T2 starts 2026-06-22.
- [x] Per-trimester dates schema implemented — `assessmentTasks` now uses `trimesterDates` object keyed by trimester (e.g. `T1-2026`) in all three unit JSONs ✅ 2026-05-19
- [x] Zoom URL now driven from `trimesterConfig` — week-level `links.zoom` nulled out in EDSE358 weeks 3–8; `blocks.js` falls back to `week.links.zoom` if `trimesterConfig` zoom is null ✅ 2026-05-19
- [x] T2-2026 stub added to EDSE358 `trimesterConfig` ✅ 2026-05-19
- [x] T2-2026 Zoom meeting ID and URL — set to same meeting as T1-2026 ✅ 2026-05-19
- [x] Confirm T2 start date in `trimester-config.json` — `2026-06-22` ✅ already correct
- [ ] Confirm T2 assessment due dates — pending Steve providing dates; add to `assessmentTasks[AT1/AT2].trimesterDates.T2-2026`
- [x] Verify test harness for T2 — blocks render correctly; T2 date fields show "Date TBC" until due dates are added ✅ 2026-05-19
- [ ] Update Moodle shells `forTri` and `forYear` for T2 — regenerate from generator once T2 due dates are confirmed
- [ ] Update any module content that changes between trimesters

### 13. Fix `briefing-update` slash command ⬜
- [ ] Update Claude Code: `npm update -g @anthropic-ai/claude-code`
- [ ] Restart and confirm `/briefing-update` appears in autocomplete
- [ ] Test it runs correctly

### 14. EDIT units — create config JSONs ⬜
Removes the legacy fallback dependency in `autovideos.js`.
- [ ] Create `config/units/EDIT415.json` — `videoInterval: 2`, weeks with video IDs from legacy `VideoURLs` class
- [ ] Repeat for EDIT425, EDIT426, EDIT513, EDIT517, EDIT518, EDIT521
- [ ] Remove `VideoURLs` legacy class from `autovideos.js` once all JSONs exist
- [x] EDIT518 migrated for T3 2026 (2026-10-06): `config/units/EDIT518.json` written from Steve's schedule, not from the legacy list, whose videos no longer exist. Its `VideoURLs` entry is removed; the other EDIT entries stay
- [x] EDIT521 migrated for T3 2026 (2026-10-06): `config/units/EDIT521.json`, same shape as EDIT518 (dates, assessment types, fortnights) with its own topics, forum, quiz and assignment links, and Tuesday 1:00pm (AEDT) live sessions in Weeks 2, 4, 6, 8 and 11. Its `VideoURLs` entry is removed (videos show "coming soon")
- [x] Prerequisite done (2026-10-06): `autovideos.js` now looks videos up by week number (`weeks[N].video`, N = first week of the period) instead of list position, so fortnightly units get the right video. Weekly EDSE output is unchanged

### 15. Refactor pre-submission checklists into config-driven system ⬜
**Trigger:** Do this before writing a fourth checklist from scratch.

**Spec for Claude Code:**
Work on `feature/checklist-refactor` branched from dev.

Step 1 — Schema: add `checklist` array to each `assessmentTask` in all unit JSONs:
```json
{
  "checklist": [
    {
      "part": "A",
      "partTitle": "Digital Resource Critique",
      "items": [
        {
          "id": "a1",
          "label": "Checklist item text.",
          "tip": "Recommendation text with sentence frames."
        }
      ]
    }
  ]
}
```
Migrate all content from the three existing template files into unit JSONs. Preserve all tip text exactly.

Step 2 — Add `renderChecklistBlock({ forUnit, forTask })` to `blocks.js` (10th render function). Container: `#lxdune-checklist`. Scoped CSS using unique class per unit+task. IIFE-scoped JS. Null-safe — renders 'Checklist coming soon' placeholder if data absent.

Step 3 — Add 'Pre-submission checklist' shell type to `generate/index.html` with task selector.

Step 4 — Add Checklist tab to `test/index.html`.

Step 5 — Move three existing static checklist files from `templates/` to `templates/archived/` with README note.

Step 6 — Run briefing update.

**Estimated effort:** one session, two parallel subagents (schema migration + renderer/generator/test harness).

### 16. Build renderAlignmentMap() as 13th render function ⬜
Config-driven alignment map reading from `unitCfg.alignmentMap`. Migrate EDSE362 alignment map data from static template into `config/units/EDSE362.json`. Add shell type to generator and tab to test harness.

**Trigger:** when a second unit needs an alignment map, or before T2 2026 go-live for EDSE362.

**Spec:** see `templates/constructive-alignment-map.html` for reference implementation. JSON schema follows the same pattern as `weeks` and `assessmentTasks` — outcomes array with `id`, `shortTitle`, `aitsl`, `teaching`, `practice`, `a1`, `a2`, and `advice` fields.

### 18. Render new alignment improvement fields in blocks.js ✅ — 2026-05-21
- [x] `renderOrientationNote` (fn 13) — standalone block, `#lxdune-orientation-note`, reads `weeks[n].orientationNote`
- [x] `renderForumPrompts` (fn 14) — standalone block, `#lxdune-forum-prompts`, reads `weeks[n].forumPrompts[]`
- [x] `renderWorkedExample` (fn 15) — standalone collapsible, `#lxdune-worked-example`, reads `weeks[n].workedExample`
- [x] `synthesisTemplate` → 'Post-forum synthesis' shell type in generator (lecturer text output, not a render function)
- [x] `guidanceNotes` → rendered in `renderAssessmentPage` after requirements for each part (divider + 'Additional guidance' heading + → paragraphs)
- [x] `presubmission-checklist-EDSE358-AT1.html` — Part D replaced with D1 (feedback planning, 5 items) and D2 (reflective practice, 2 items) matching new AT1 structure
- [x] Test harness updated — 3 new containers + imports in `test/index.html`
- [x] Generator updated — 3 new render shell options + week selector for synthesis template in `generate/index.html`

### 19. Apply alignment fields to EDSE357 and EDSE362 ⬜
When content is written for those units, add `orientationNote`, `forumPrompts`, `workedExample`, `synthesisTemplate`, `guidanceNotes` fields to their JSON configs. Rendering is already live.

### 20. Build EDSE358 constructive alignment map ✅ — 2026-05-21
- [x] Static HTML template created — `templates/constructive-alignment-map-EDSE358.html`
- [x] 4 LOs across Teaching, Practice, AT1 and AT2 columns. Purple/cyan theme. Reflects post-audit improved state (G1–G8). Click-to-expand rows show student advice.
- [x] Added to `templates/README.md`

### 21. Build renderAlignmentMap() for EDSE358 ⬜
Migrate EDSE358 alignment map data from static template into
`config/units/EDSE358.json` under an `alignmentMap` field, following
the same pattern as the planned EDSE362 migration (item 16).

**Trigger:** when `renderAlignmentMap()` is built as part of item 16.

### 22. Add loMapping to EDSE362 assessmentTasks once AT1 and AT2 are defined ⬜
EDSE362 assessmentTasks are currently empty stubs. Once AT1 and AT2 are
populated with learningOutcomes arrays, the reverse map in
renderLearningOutcomesTable will automatically show assessment connections
for EDSE362. No code change needed — data only.

### 23. Build renderAlignmentMap() for EDSE357 ⬜
Migrate EDSE357 alignment map data from static template into
`config/units/EDSE357.json` under an `alignmentMap` field.

**Trigger:** when `renderAlignmentMap()` is built as part of item 16.

### 24. Deploy multi-assessment shells to live Moodle units ⬜
Replace existing single-task AT1 and AT2 shells on EDSE357 and EDSE358
course pages with the new 'All assessments (tabbed)' shell — one shell
replaces two, students see AT1/AT2 in a tab switcher. Also deploy
`renderAssessmentNav` to course homepages. Generate shells from
`generate/index.html` after `feature/multi-assessment-page` merges to main.

---

## 🔵 Do before T2 2026 go-live — EDSE362

⚠️ **Correction: EDSE362 runs T2 2026 (starts 2026-06-22), not T2 2027 as previously recorded.**

### 17. EDSE362 full population ⬜
- [x] T2-2026 start date confirmed — `2026-06-22` in `trimester-config.json` ✅
- [x] AT1 and AT2 due dates populated in `trimesterDates.T2-2026` ✅ (AT1: 2026-07-26, AT2: 2026-09-06)
- [ ] Set up Zoom meeting for T2 2026 — add `meetingId`, `password`, `url` to `trimesterConfig.T2-2026`
- [ ] Populate `keyLinks` URLs (Unit Outline, Learning Materials, Assessment Portal)
- [ ] Record week 0–8 lecture videos — add YouTube IDs to config
- [ ] Populate all week links as content is created
- [x] AT1 and AT2 assessmentTasks fully populated — rationale, aim, parts, rubric (with band ranges), hdCallout, submissionInstructions, aitslStandards — merged to dev commit 88867d6 ✅ 2026-05-23
- [ ] Add assessment file links once tasks are uploaded
- [ ] Deploy all Moodle shells to EDSE362 course
- [ ] Verify in test harness before go-live

### 28. Constructivist model reckoner — companion guides ⬜ (open item remains) — 2026-09-24
Session note: added the reckoner as a standalone tool, separate from `blocks.js`.
- [x] Source lives at `tools/reckoner` (YAML guides + Zod schema + build); published page is `reckoner/index.html`
- [x] Editing workflow: change `tools/reckoner/content/guides/*.yaml`, then `cd tools/reckoner && npm run publish:pages`. Never edit anything in `reckoner/` by hand (see item 29)
- [x] Only guides with `status: published` reach students (`--drafts` builds a review copy to `dist/site/review.html` only)
- [x] Four guides published at v1.0.0: 5E, POE, ADI, Levels of inquiry. The other eleven models show "guide coming soon"
- [ ] Open: the 9 catalogue models in `tools/reckoner/content/catalogue.json` (was 13; four now have guides and the stale entries were removed in item 38) still carry unvalidated fit profiles
- [x] After dev → main merge: confirm `https://thatswhatsnext.github.io/LXDUNE/reckoner/` serves, then link from a Moodle block with `target="_blank"` — linked from EDSE362's home page, see item 39

### 29. Reckoner: split content from the page ✅ — 2026-09-24
Session note: `reckoner/` is now a shell plus data files, so one guide edit changes one file.
- [x] `reckoner/index.html` (shell + loader), `reckoner/app.js` (code), `reckoner/data/manifest.json`, `reckoner/data/guides/<id>.json`
- [x] Build is deterministic (no build date); `publish:pages` lists exactly which files changed and removes files for unpublished guides
- [x] `npm run review -- <id>` makes a self-contained review copy of one guide (drafts included, "not for students" banner) to send to a reviewer
- [x] `npm run build:single` still makes a single offline file
- [x] New GitHub Actions workflow `Reckoner` (`.github/workflows/reckoner.yml`): validate, 39 tests, typecheck, and fails if `reckoner/` does not match the YAML. Checks only, never commits
- [x] Rendered output checked identical to the PR #5 page (only the "Built <date>" stamp removed)
- Note: the page now needs a web server (Pages is fine); opening `reckoner/index.html` from disk shows "could not load its content"

### 30. Reckoner: compare view, lighter entry point and density control ⬜ (open item remains) — 2026-09-26
Feedback: reviewers found the app overwhelming on arrival.
Built in response (template only; no guide content, schema or build script changed):
- [x] Compare models tab (second): up to four models side by side on scale, distinguishing feature, phases, teacher and learner roles, best fit, pitfall and guide link. Rows clamp to about three lines with one "Show more" per row across all columns; below 760px it becomes one stacked card per model; prints fully expanded. Defaults to the detailed reckoner's top three, otherwise 5E, ADI and POE
- [x] Quick reckoner opens with three entry points (use the reckoner, compare models, 60-second tour); the purpose-by-readiness matrix is collapsed into a details element
- [x] Guide pages default to Compact (long sections collapse to a heading and a count) with a Full toggle saved per browser; deep links still open and scroll to their section; printing always prints everything
- [x] Four-step in-app walkthrough: opens once on a first visit to the landing screen, dismissible at any step, repeatable from the entry point
- [ ] Open: record a narrated walkthrough video (about 90 seconds, captioned, hosted on the Moodle page beside the reckoner link), only if the in-app walkthrough does not cover it

### 31. Reckoner Lite, option B: "Start with your unit" ⬜ (open items remain) — 2026-09-27
Built from the Reckoner Lite handoff spec, option B (the recommended front door).
- [x] New first tab and landing view: stage → focus area → result. Three result cases chosen by what the guides hold: a ready worked sequence (6 focus areas), examples only (4), or nothing yet, which says "Start from 5E" and names the gap (6 of 16)
- [x] Tiles mark "Ready plan" where a sequence exists and never show "coming soon"
- [x] Build: derived `focusIndex` in `scripts/lib/build.ts` (reads existing guide fields, writes no content). Each focus area pairs only with its own stage, and the build fails on an off-whitelist or mismatched pairing. New build test covers it
- [x] §2 colour tokens applied across the app (new values, `--sunk`, `--line-soft`, `color-scheme` in dark). All used text pairs pass AA; fixed white-on-dial text in dark mode (was 2.2:1)
- [x] Fixed: every "Open guide" button rendered the guide twice, which could leave the scroll in the wrong place
- Note: the walkthrough no longer opens by itself, because the landing view is now B; it is still available from the Quick reckoner's entry point
- [ ] Ship B to a cohort and watch what students do (spec §10). A and C were built ahead of that; see items 32 and 33
- [x] Author the six empty focus areas: Observing the Universe; Periodic table and atomic structure; Change; Data science 1; Energy; Genetics and evolutionary change (see item 34)

### 32. Reckoner Lite, option A: "Three taps" ✅ — 2026-09-27
The "Not sure what you need?" route from the unit view (it previously went to the quick reckoner, which is still its own tab).
- [x] One question per screen: what to shift (7), how long (4), how much investigating (3). Plain-language labels and glosses per the spec; any option without one uses the payload's own label (all four time options do)
- [x] Progress dots with "n of 3"; Back on steps 2–3 clears the answer being revisited; answers advance immediately
- [x] Decision logic is the quick matrix, unchanged: all 84 answer combinations give the same model as the Quick reckoner tab
- [x] Result card: "Start here", model name, originators and scale, the why sentence, first three moves (the opening phase's first three essential features) and what good looks like (its first look-for), opening the guide at that phase
- [x] Models without a guide (8 of the 11 the logic can return) show their phases and distinguishing feature and name the nearest guide at the same scale (ADI for routines, 5E for unit models); never an empty "first three moves"
- Template only: no guide content, schema or build change

### 33. Reckoner Lite, option C: "The map" ✅ — 2026-09-27
Replaces the Model library tab (now "Model map").
- [x] All 15 models on one screen in four bands by scale (unit architectures, routines, single lesson, guidance dial), each with a note and a nesting caption; guide models first in each band
- [x] Tiles show name, phase count (levels for the dial) and a dot, with hidden text, when a guide exists; legend "Companion guide ready: 4 of 15 so far"
- [x] Tapping a tile opens a panel (toggle, aria-pressed): phases, distinguishing feature, teacher and learner roles (side by side from 620px), nesting lines and an action; models without a guide show a disabled "Guide not written yet"
- [x] Nesting lines read the guides' nesting[] in both directions: 8 of 15 models get at least one; the other 7 have no nesting data yet, so their panels omit the lines
- Template only: no guide content, schema or build change
- [x] Copy check: unit architectures are "6–15 lessons" everywhere (map band note and scale tooltip now match the time question) — 2026-09-27

### 34. Reckoner: examples for the six empty focus areas ⬜ (open item remains) — 2026-09-27
- [x] 14 reviewed examples added (drafted by Claude, reviewed and signed off by Steve Grant, 2026-09-27): a done-well and done-badly pair for Observing the Universe, Periodic table and atomic structure, Data science 1, Energy and Genetics and evolutionary change, and two pairs for Change (chemical and geological)
- [x] All 16 focus areas now carry worked material: 6 with a ready plan, 10 with examples only, 0 empty. None shows "Start from 5E" any more
- [x] Examples across the four guides: 30 → 44. ADI's `tentative-argument` phase gained its first examples
- [x] Guides at v1.1.0 (lastReviewed 2026-09-27), still published
- [x] Repaired the stage-group rule test, which adding a positive to ADI `tentative-argument` had made vacuous; it now strips positives from every phase in the group
- [x] The example-only focus areas each need a worked sequence to become a ready plan (8 as of item 36). Done in item 42: all 16 focus areas have a ready plan

### 35. Reckoner: 7E companion guide ⬜ (open items remain) — 2026-09-28
- [x] 7E guide published (v1.0.0, reviewed and signed off by Steve Grant 2026-09-28), the first of five Tier A guides: 7 phases in 3 groups, 13 look-fors, 6 examples, 1 worked sequence (Stage 5 Energy, 9 lessons), 6 misapplications, 18 checklist items. Leans on the 5E guide for Explore, Explain and Elaborate
- [x] Model id corrected from `e7` to `7e` (matches `MODEL_REGISTRY` and `5e`); the catalogue entry is removed in the same commit, so the reckoner still shows 15 models (catalogue 13 → 12, guides 4 → 5)
- [x] Reciprocal nesting lines added to POE, ADI and Levels of inquiry (their versions unchanged)
- [x] Followed the rename into the detailed reckoner's "needs a longer run" watch-out, which still listed `e7`
- Guided coverage of reckoner recommendations: 17% → 36% (the handoff's measure)
- [x] Next: Science Writing Heuristic, which takes coverage to 48% and repairs the "coming soon" nesting references in 5E, 7E and ADI (see item 36)
- [x] Open (low severity): `scripts/lib/build.ts` uses `ModelGuide.parse()` and throws a raw stack on an invalid guide, where `scripts/validate.ts` uses `safeParse` and reports properly. `publish:pages` runs validate first, so this only bites a direct `npm run build`. Worth a one-line fix when that file is next touched — done, see item 38

### 36. Reckoner: SWH companion guide and safety sweep ⬜ (open items remain) — 2026-09-28
- [x] Science Writing Heuristic guide published (v1.0.0, reviewed by Steve Grant 2026-09-28), the second of five Tier A guides: 7 phases in 3 groups, 14 look-fors, 8 examples across three focus areas, 1 worked sequence (Stage 5 Materials, 6 lessons). Guided coverage 36% → 49% (the handoff's measure)
- [x] Catalogue entry removed in the same commit (catalogue 12 → 11, guides 5 → 6, still 15 models); reciprocal nesting line added to Levels of inquiry (version unchanged)
- [x] Repairs the "coming soon" nesting links to SWH in 5E, 7E and ADI. Remaining coming-soon links: SSI (from 5E), GLM and AST (from POE)
- [x] Safety sweep across all five guides with worked-sequence safety notes: the reckoner no longer prescribes safety controls. Each block says it is not a substitute for the school's risk assessment, names what the sequence introduces, points at the head teacher and current NSW guidance, and says what the model does to the assessment. 5E, ADI, POE → v1.1.1; 7E → v1.0.1
- Note: the handoff's attached 5E, ADI, POE and Levels of inquiry files predated item 34 and would have deleted its 14 reviewed examples if copied over. Only the intended changes (safety blocks, versions, one nesting line) were applied to the current files; all 58 examples are intact
- [ ] Next is the plan's stage-3 pause. Two Tier A guides are in; choose the next guide on what the cohort actually lands on rather than the frequency table. SSI is next on the table, at +13%
- [x] Open: the draft banner in `templates/app.js` (line 338) reads "This guide is a in-review draft". Review and drafts builds only — done, see item 38
- [ ] Open: a `wellbeing` key on the `inclusion` block would give 5E's illness-and-loss consideration a proper home; it currently lives in `safetyNotes` with a cross-reference. Schema 1.4, optional field so existing guides stay valid
- [x] Open: the last case in `scripts/test-rules.ts` still reads "unmodified 5E, POE, ADI and Levels of inquiry guides are valid" and does not cover 7E or SWH. Both validate; the test is not watching them — done, see item 38
- (The `ModelGuide.parse()` vs `safeParse` open item is already recorded in item 35.)

### 37. Chat and code working from the same repo state ⬜ (open items remain) — 2026-09-29
- [x] `CLAUDE.md` at the repo root: branches and releases, commit trailer, language rules, reckoner content rules (edit guides in place, bump versions from current, catalogue swap in one commit, reciprocal nesting, next action-plan number), handoff format, and which folders reckoner work leaves alone
- [x] `docs/reckoner-state.md`, generated by `npm run status`: guides and versions, examples, worked sequences, focus-area coverage, phases with no examples, coming-soon nesting links, the model registry and the next action-plan item. `publish:pages` refreshes it; `check:pages` (in CI) fails if it is stale. The Reckoner workflow now also runs on changes to `docs/ACTION-PLAN.md` and `docs/reckoner-state.md`
- [x] Connect the repo to the Claude chat Project (GitHub in project knowledge) and include `CLAUDE.md` and `docs/reckoner-state.md` in the synced files; Sync before each drafting session — done 2026-09-29: the Project syncs `CLAUDE.md`, `docs/reckoner-state.md`, `docs/ACTION-PLAN.md`, `docs/handoffs/TEMPLATE.md`, the reckoner README, schema and content. Keep syncing before each drafting session
- [x] Move recurring handoff checks into the validator and tests: registry ids vs guides and catalogue, model ids used in `templates/app.js`, no version going down, no published guide losing examples compared with `dev` — done, see item 38
- [x] `/ship` and `/apply-handoff` slash commands (`.claude/commands/`), the Pages check script they use (`.claude/scripts/verify-pages.sh`), and a handoff template (`docs/handoffs/TEMPLATE.md`) — 2026-09-29

### 38. Reckoner: guardrails and code open items ⬜ (open items remain) — 2026-09-29
Applied from a Claude chat handoff with `/apply-handoff`. Code only: no guide content, versions or schema changed.
- [x] Readable build errors: `loadGuides()` uses `safeParse` and reports an invalid guide as "file: path: message", like `npm run validate`; YAML syntax errors name the file, line and column
- [x] Draft banner wording by status ("This guide is in review" / "This guide is a draft"); review copies only
- [x] The clean-guide rule test reads every guide file, so 7E and SWH are now checked and new guides are covered automatically
- [x] `validate.ts` errors on: catalogue ids not in `MODEL_REGISTRY`, catalogue entries that also have a guide, registry ids with neither, duplicate catalogue ids, unregistered model ids in `templates/app.js` (found by context: 48 references across 21 places today), and unregistered quick-matrix ids in `questions.json`. Eight new rule tests
- [x] `npm run check:regressions [ref]` (default `origin/dev`): fails if a published guide is gone or unpublished, a version went down, or any example, phase, look-for, sequence, misapplication or checklist id is missing. Runs in CI after `check:pages` (pull requests against their base branch, pushes against `dev`). Tested against the SWH-handoff overwrite: it catches the version drop and all six missing POE examples
- [x] Build tests no longer need the network: a jsdom request interceptor answers remote URLs (Google Fonts) locally; missing local files are still errors
- Adapted from the handoff: the new catalogue check found stale catalogue entries for ADI and Levels of inquiry (both have guides). With Steve's go-ahead they were removed (catalogue 11 → 9); built output is byte-identical. The quick-matrix id check was added as the same class of stale-id risk. `publish:pages` also changes `reckoner/index.html`, because the shell carries the app.js fingerprint. jsdom 30 replaced `ResourceLoader` with request interceptors, so the offline fix uses `requestInterceptor`
- [ ] Open: regression checks compare counts and ids only. A reworded example still passes, so review remains the guard for content quality
- [ ] Open: the `app.js` id check finds model ids by context (lists checked with `.includes(m.id)`, `m.id` comparisons, `G`/`M` lookups, `openGuide`, `id:`/`guide:` fields, compare defaults). New model-id logic written in a different shape needs a pattern added to `APP_ID_SITES` in `scripts/validate.ts`
- [ ] Open question: should a deliberate removal (retiring a weak example) be allowed? If so, add an allow-list such as `--allow-removal <id>`, named in the handoff. For now any removal fails
- [ ] Open question: `check:regressions` compares pull requests with their base branch, which covers a `dev` → `main` PR too; releases currently merge locally, where CI compares `main` pushes with `dev`

### 39. Reckoner: linked from EDSE362 ⬜ (open items remain) — 2026-09-29
- [x] "Model Reckoner" added as the fourth key link on EDSE362's unit home page (`config/units/EDSE362.json` → `keyLinks`), opening `https://thatswhatsnext.github.io/LXDUNE/reckoner/` in a new tab. Config only: `renderUnitKeyInfo` already renders `keyLinks`, so the button appears on the next page load with no Moodle re-paste and no `blocks.js` change
- [x] Appended last, so the gap-audit tools that read `keyLinks.0`–`.2` by position are unaffected. Rendered locally: four buttons in the house style; EDSE357 unchanged
- [ ] Open: EDSE357 and EDSE358 (Stage 6 units) later. The reckoner is built on the NSW Science 7–10 syllabus, so decide whether it helps students planning 11–12 before adding it there
- [ ] Open: put it in front of a cohort and decide how to learn from use (item 31). The reckoner records nothing; a short Moodle poll or forum prompt is the simplest route, and any automatic tracking needs a privacy decision first. Method decided in item 40: an anonymous Moodle Feedback survey, linked from the reckoner

### 40. Reckoner: feedback link for the baseline survey ⬜ (open items remain) — 2026-09-30
- [x] `FEEDBACK_URL` constant and `feedbackLine()` helper in `templates/app.js`. With a URL set, the footer reads "Used the reckoner for your planning? **Tell us how it went** (six questions, about three minutes, anonymous)", and one "Was this useful? Tell us how it went." line closes the Quick result, the lead detailed card, the three-taps "Start here" result and each Start with your unit result (ready plan, examples only and Start from 5E). Opens in a new tab, announced to screen readers; hidden in print. F5 from the plan "Reckoner: methodology layer and discovery survey", shipped first so the baseline measures the reckoner as it is today. The reckoner still records nothing
- [x] Parked until the survey exists (Steve, 2026-09-30): while `FEEDBACK_URL` is `""`, each of those places shows "A short feedback survey is coming soon." with no link. Setting the URL swaps every placeholder for the link
- [x] Checked in jsdom both ways: one line per view and in the footer; placeholder text and no links with the URL empty; `target="_blank" rel="noopener"` with a test URL. `reckoner/data/` byte-identical to `dev`; only `reckoner/app.js` and the shell's app.js fingerprint change
- Adapted from the handoff: no URL was supplied. The handoff asked for an empty URL to hide everything; Steve chose a "coming soon" placeholder instead. The footer paragraph is inserted by `app.js` rather than written into `app.html`
- [ ] Open: create the anonymous Moodle Feedback activity on the EDSE362 page with the six questions in `docs/handoffs/2026-09-30-reckoner-feedback-link.md` (record user names Anonymous; one submission per student; analysis hidden from students), then put its URL in `FEEDBACK_URL` in `tools/reckoner/templates/app.js` and republish
- [ ] Open: open the survey once students have planned with the reckoner; close it a week later. This is the baseline for the transparency release (`docs/handoffs/2026-09-30-reckoner-transparency.md`). Keep questions 3 and 4 word-for-word for the follow-up
- Note: responses are for reckoner improvement only (quality improvement, not research). If that changes, seek ethics approval before the next round

### 41. Reckoner: transparency release (show the working, route lines, trust chips, How it works) ⬜ (open items remain) — 2026-09-30
- [x] **Show the working (F2):** each detailed-reckoner top card lists every term of its fit score (answer, fit 0–3, weight × importance, points, share), totalling to the card's percentage. Watch-outs and nesting lines carry a "Rule" badge and the answer that triggered them; `watchOuts()` and `nesting()` return `{ text, because }` with the same lines firing word for word
- [x] **Route lines (F3):** Quick and three-taps results name the purpose-table cell (or the one-lesson rule); Start with your unit says it chose by what the guides hold, not by fit, and offers the Quick reckoner
- [x] **Trust chips (F4):** evidence strength and review status on guided models (guide header, map panel, compare view); Provisional on catalogue models wherever they appear as a result or choice. AA contrast checked in both themes (lowest 5.62:1); no horizontal scroll at 360px
- [x] **How it works (F1):** `content/methodology.yaml` with schema `src/schema/methodology.ts`, validation, rule tests and build wiring; a page behind the footer link (`#/how-it-works`), with a computed weights table, live model counts and an SVG diagram. The file lands as a **draft**, so students do not see the page or its links yet
- [x] Checks: ranking order and every percentage identical for 49 fixed answer sets before and after; rule texts hash-checked in `test-build.ts`; `reckoner/data/` (manifest included) byte-identical to `dev`; validate, 48 rule checks, 15 build tests, typecheck, check:pages and check:regressions pass
- Adapted from the handoff: released without the baseline survey (Steve, 2026-09-30), so the survey will measure the reckoner after this change and question 4 has no before/after comparison. `model-guide.ts` gained `export` on five primitives the methodology schema reuses, as change 1 asks; nothing else in it changed. Unit results with no material for the focus area (the Start from 5E case) also get a route line. "Show the working" links to the detailed route of How it works
- [x] Methodology published: v1.1.0 approved by Steve Grant on 2026-09-30 and released (item 43)
- [x] For that review: Steve approved v1.0.0 as written on 2026-09-30, including the evidence-strength definitions and the Start with your unit and Provisional wording. The "three times" and feedback-survey lines were corrected in item 43
- [ ] Open: run the follow-up survey with the same six questions once the feedback link is live
- [ ] Open: F6 visible weights, F7 glossary tooltips and F8 walkthrough refresh, shaped by survey answers
- Note: the rule-labelling pattern keeps the shapes `APP_ID_SITES` in `scripts/validate.ts` matches (still 48 model-id references found)

### 42. Reckoner: ready plans for all 16 focus areas ⬜ (open items remain) — 2026-09-30
- [x] One worked sequence for each of the eight example-only focus areas, reviewed and signed off by Steve Grant on 2026-09-30 (`docs/handoffs/2026-09-30-ready-plans.md`): 7E `7e-seq-s4-moon` (Observing the Universe) and `7e-seq-s5-evolution` (Genetics and evolutionary change); 5E `seq-s4-elements` (Periodic table and atomic structure), `seq-s5-rates` (Reactions) and `seq-s5-motion` (Waves and motion); POE `ep-s4-steel-wool` (Change); SWH `swh-seq-s4-separation` (Solutions and mixtures); Levels of inquiry `seq-s4-reaction-time` (Data science 1)
- [x] Appended in place, new ids added to each guide's `revealAfterAttempt`. Minor bumps: 5e 1.2.0, 7e 1.1.0, levels-of-inquiry 1.2.0, poe 1.2.0, swh 1.1.0; `lastReviewed` 2026-09-30. ADI untouched (`adi.json` byte-identical)
- [x] Results: worked sequences 9 → 17; focus areas 16 ready plan / 0 examples only / 0 empty; examples 58, unchanged. The "7e: no Biology worked sequence" warning is cleared. Every existing id is intact (`check:regressions`); validate, tests, typecheck and check:pages pass. Each of the eight focus areas renders its new plan in Start with your unit
- Nothing adapted: the handoff matched the repo (versions, sequence ids, phase ids, outcome codes, insertion points)
- [x] Change: `ep-s4-steel-wool` covers the chemical half; the geological half is now `ep-s4-freeze-thaw` (item 44)
- [x] Waves and motion: `seq-s5-motion` covers motion; waves is now `seq-s5-sound` in ADI (item 44)
- [x] SWH Biology worked sequence: `swh-seq-s5-duckweed` (item 44)
- [ ] Open: `7e-seq-s4-moon` lesson 6 depends on a session planned with the school's Aboriginal Education staff and local Aboriginal community; the sequence says to leave it out rather than teach it from secondary sources
- [x] `md()` in `templates/app.js` turned every line of a multi-line field into its own paragraph, so wrapped activities broke mid-sentence on the live site. Fixed on this branch (Steve asked for it before release): consecutive lines join into one paragraph, a blank line or list item starts a new block, and a line straight after a list item continues it. Across all 4,306 content strings the text is identical and paragraphs drop from 4,990 to 4,322; a build test covers the rules, including lists, which no current content uses
- Resolved: the handoff asked whether the result cards' "A short feedback survey is coming soon." line was intended. It is: Steve chose the placeholder over hiding the line (item 40)

### 43. Reckoner: How it works rewritten and laid out for the web ⬜ (open item remains) — 2026-09-30
- [x] Steve approved the methodology prose (v1.0.0) on 2026-09-30 and asked for it to be optimised for reading on the web before it goes live, as a rewrite for his approval
- [x] Prose v1.1.0 (`content/methodology.yaml`): each route gains a one-line `summary` (new required schema field); route bodies, the intro and "How content is made" become short bullets with front-loaded sentences; principles and glossary tightened. Meaning kept
- [x] Corrections Steve chose: "Feedback will go through an anonymous Moodle survey" (the link is parked, item 40); "Purpose counts most: three times as much as most questions" (place-based, at half, is the least important). Also corrected: example pairs are per phase, or per stage in models with many phases (7E, ADI, SWH), not per phase everywhere
- [x] Layout: "On this page" contents bar; 46rem measure; diagram first as "At a glance"; route cards with the summary first; weights table in a disclosure (opened for print); principles as a card grid; evidence strengths shown with the guides' chips; glossary in columns; APA in-text citations. No horizontal scroll at 360px; text contrast AA in both themes (lowest 5.16:1)
- [x] Status `in-review`, `source: ai-generated`, `reviewedBy: []`, so students still do not see the page. `reckoner/data/` byte-identical to `dev`; validate, tests, typecheck, check:pages and check:regressions pass
- [x] Steve's layout requests: Principles are flip cards (title and number on the front; turn by clicking the card or "Read more" to reveal the text and citations; "Show all" turns every card; the hidden face is `inert`, focus follows the turn, no spin under reduced motion, both faces print). The "On this page" bar is sticky, with "← Back" always on its left and the section being read highlighted; on narrow screens the pills are one swipeable row. "How each route decides" uses the same flip cards (number, title and one-line summary on the front; the detail bullets on the back; its own Show all); a route-line "How it works" link opens that route's card already turned; the weights table sits below the route cards
- [x] Steve approved v1.1.0 and its layout on 2026-09-30: `status: published`, `source: ai-drafted-reviewed`, `reviewedBy: [Steve Grant]`, `reviewedOn: 2026-09-30`. The footer link "How the reckoner works" and the route lines' "How it works" links now show on the site; the methodology rides in `data/manifest.json`
- [ ] Open: when the feedback survey URL is set (item 40), change the limits line back to "Feedback goes through an anonymous Moodle survey"

### 44. Reckoner: item 42's content gaps closed (freeze–thaw, sound, duckweed) ✅ — 2026-09-30
- [x] Three worked sequences, reviewed and signed off by Steve Grant on 2026-09-30 (`docs/handoffs/2026-09-30-item-42-gaps.md`): POE `ep-s4-freeze-thaw` (the geological half of Change, Stage 4); ADI `seq-s5-sound` (the waves half of Waves and motion, Stage 5; ADI's first physics sequence); SWH `swh-seq-s5-duckweed` (Environmental sustainability, Stage 5; SWH's first Biology sequence)
- [x] Appended in place, new ids added to each guide's `revealAfterAttempt`. Minor bumps: poe 1.3.0, adi 1.2.0, swh 1.2.0; `lastReviewed` 2026-09-30. 5E, 7E and Levels of inquiry untouched
- [x] Results: worked sequences 17 → 20; focus areas still 16 ready plan / 0 / 0, with Change, Waves and motion and Environmental sustainability each offering two plans; examples 58, unchanged. The "swh: no Biology worked sequence" warning is cleared, so no guide now warns. Every existing id intact; validate, tests, typecheck, check:pages and check:regressions pass. Each new plan renders as the second plan for its focus area
- Nothing adapted: the handoff matched the repo (versions, sequence ids, phase ids, outcome codes, insertion points)
- Note: `swh-seq-s5-duckweed` needs a growth period of about two weeks, counted at the start of each science lesson; duckweed and treated water must not go into drains, gardens or waterways
- Note: `seq-s5-sound`: decide per class whether to teach the logarithmic decibel scale or compare reductions only

### 45. One syllabus vocabulary for the reckoner and the Framework Explorer ✅ — 2026-10-01
- [x] Found in the Framework Explorer close-out: the syllabus whitelist lived in three places that nothing kept in step: `frameworks/_schema/curriculum.vocab.json`, `tools/reckoner/src/schema/syllabus.ts` and a hard-coded `FOCUS` list in `tools/reckoner/templates/app.js`. Steve approved making the vocab file the single source of truth
- [x] Checked first that both vocab readers (`scripts/validate-frameworks.js`, `moodle-blocks/framework-explorer.js`) ignore unknown top-level keys: with extra keys added, the validator's output and all three frameworks' rendered HTML and content hashes were identical
- [x] Vocab 1.1.0, additive only: `workingScientificallySkills`, `outcomes` (codes only, never outcome wording) and the Science 7–10 `outcomesUrl`; the eight Investigating Science Stage 6 (2017) modules, checked against NESA, close that TODO (57 → 65 controlled ids)
- [x] `syllabus.ts` now reads the vocab file and keeps its exports and the reckoner's ids (`stage4`, focus areas by label). The `FOCUS` list in `app.js` uses `DATA.focusAreas` from the build. No guide content or versions changed
- [x] New parity test `scripts/test-syllabus.ts` (runs first in `npm test`) pins the whitelist by hand, order included, so a vocab edit that changes it fails CI. The Reckoner workflow now also runs when the vocab file changes
- Note: `Stage` and `FocusArea` are now `string` types rather than literal unions; the zod enums still enforce the same values at runtime, and `npm run typecheck` found nothing that relied on the literals
- Note: the 2025 Stage 6 module lists remain a TODO in the vocab file, to be added when content is written against them

### 46. Field Guide redesign applied to the Reckoner page and Fieldwork (design direction A) ⬜ (open items remain) — 2026-10-04
- [x] Steve chose direction A, "Field Notebook", on 2026-10-04 (`docs/handoffs/2026-10-04-field-guide-redesign.md`). Presentation only: no content, scoring, routing, tab or panel ids, URL paths, storage keys or game scoring changed; no guide or lesson version bumps
- [x] Names: the product is "The Field Guide to Constructivist Teaching Models"; the decision tool is "The Reckoner"; "Model map" is now "Family Tree"; the game is "Fieldwork" (page title "Fieldwork · The Field Guide"). Each template keeps every name in one `NAMES` constant; the static text in `app.html` carries `data-name` fallbacks filled from it, so a rename is a one-line change
- [x] Reckoner page: masthead on every view; a home section (the willow plate, the question, and four steps: Learn the Family Tree, Practise in Fieldwork, Choose with the Reckoner, Plan with a companion guide) shown only on "Start with your unit" with no hash route; the tabs become the Reckoner's tool strip with icons, one swipeable row on phones; stage cards with seedling and sapling icons; scale badges with icons and soft fills; "Why this matters" on question help; the quick result gets a header band, "Practise it in Fieldwork" for 5E and POE, and a card for the other side of the quick matrix with "Compare these two side by side"; guides get a phase strip and, where every phase has a typical share, a time-share bar; new footer line
- [x] Fieldwork: the app's colours and fonts (Source Serif 4, IBM Plex Sans, IBM Plex Mono); masthead with a link back to the Field Guide; HUD line "Fieldwork · path", lesson title and item counter; a phase tag ("ENGAGE · PREDICT") above each item; the willow plate on the first item of The Willow Problem; restyled confidence slider (behaviour unchanged); one-line privacy notice on lesson screens. A chosen option is ink-bordered, so it never looks correct, and marked options show a tick or cross with "Correct" or "Not this one"
- [x] New tests: home visibility and step order, the Family Tree label and page title (build); the quick alternative card for misc/unit/novice and none for one lesson; the 5E phase strip and bar, none on Levels of inquiry; Fieldwork title, slider and plate (game). Build tests 16 → 19, game tests 19 → 20. Validate, tests, typecheck, check:pages and check:regressions pass. Models 15, guides 6, examples 58, worked sequences 20, focus areas 16 / 0 / 0, game lessons 10: all unchanged, as the handoff expected
- [x] Checked in a browser at 360 px and on desktop, light and dark: no sideways scroll, every control at least 44 px tall. Contrast of new text pairs is at least 4.5:1 in both themes (lowest: micro on its soft tile, 4.51:1)
- Adapted from the handoff: (1) the sprite has no cross or lock icon, so `game.html` adds `i-cross` and `i-lock` in a separate small sprite; the handoff's sprite is pasted byte for byte. (2) The masthead chip keeps `class="chip"` with a scoped override, because `.chip` already styles the radio chips; it is hidden under 520 px, where it would take its own row. (3) The time-share ranges are a key under the bar (swatch, phase, range), because labels under 5–10% segments overlap at 360 px; the caption says "episode" for POE, as the rest of the guide does. (4) Phase-coloured text on its own 14% tint fails AA for Engage (3.5:1) and Explore (4.2:1) in light mode, so the game's phase tag text mixes the phase colour 70% with ink. (5) The game loads Plex Sans 700 as well, since it sets bold body text; display headings move from 800 to 600 to match the loaded serif. (6) The item counter sits on the HUD's mono line rather than as a pill, which squeezed the progress bar at 360 px. (7) The masthead's title chip in the game is gone (the HUD now says where you are), so the lesson intro card shows the path title instead. (8) "the Reckoner" is capitalised in the templates' running text where it names the tool; "Quick reckoner" and "Detailed reckoner" keep their labels
- [x] ~~Open: Family Tree families. Steve approved the draft groupings on 2026-10-04 (handoff open question 1: Learning cycles; Conceptual change; Argument and writing; Reasoning; Problems, projects and issues; Levels of inquiry across every branch). Building them needs a new optional field, so it is a separate change. Until then the tab keeps the current map under its new name, and home step 1 reads "How the models relate and fit inside each other" rather than promising where each model comes from~~ Done in item 56, with a families file rather than a field on each model
- [x] ~~Open: plates for more lessons, starting with Cells under the lens and the POE path (add to `PLATES` in `game.js`)~~ Done in item 54: every 5E and POE lesson has a plate
- [ ] Open: ask the next student cohort about the names (Field Guide, Family Tree, Fieldwork) before they are fixed in the Moodle unit pages
- [x] Steve's decision, 2026-10-04: keep the alternative card's wording as it is (handoff open question 2)
- [x] Steve's decision, 2026-10-04: Fieldwork keeps IBM Plex Sans for body text, matching the Reckoner (handoff open question 3)
- [x] Steve's decision, 2026-10-04: keep the step order (Learn, Practise, Choose, Plan) and add "Already planning a unit? Start with your unit ↓" under the steps, which selects Start with your unit and brings the stage picker into view (handoff open question 4). Revisit with usage data
- [ ] Open: content still says "reckoner" in lower case in places (`methodology.yaml`, some game lesson text). Content was out of scope here; align it the next time those files are reviewed

### 47. Fieldwork ADI path and the Reckoner's time-and-scale prompts ✅ — 2026-10-05
- [x] Applied `docs/handoffs/2026-10-05-fieldwork-adi.md` and its patch (four lessons, the methodology line and the decision behind the prompts reviewed and signed off by Steve Grant, 2026-10-05). The patch applied cleanly: `tools/reckoner/` on `dev` was identical to `main` at `973e242`
- [x] Game engine: a path can show its journey guide's stage groups on the rail (`rail: groups`); a guide with stage groups colours phases by group; ADI items carry a stage tag in the group colour; spot items can offer only some phases (`among`, 2–5); a lesson can carry its own `requires`. 5E, POE, scoring and saved progress are unchanged
- [x] Content: ADI path (between POE and Choosing a model, unlocks at POE Explain) with `adi-1-leaf-litter`, `adi-2-noise` and `adi-3-review`; Choosing a model gains `select-3-argue` (requires ADI Explain) and lists ADI as a model. Published lessons 10 → 14 (5E 6, POE 2, ADI 3, Choosing a model 3)
- [x] Reckoner: "Have you thought about…?" prompts on the detailed Reckoner's top three cards when a model's scale and the timescale don't line up. Not a rule, so the ranking and the rule texts (and their hash) are unchanged; models already covered by the time watch-out get no prompt. Methodology 1.1.0 → 1.2.0 with one line in "Hand-written rules", reviewed 2026-10-05
- [x] Steve's decisions, 2026-10-05: three-group rail; Biology (microhabitats) then sound; five ADI lessons in all (Design lessons follow); ADI added to Choosing a model now; ADI path unlocks after POE Explain
- [x] Steve's decisions on the Reckoner, 2026-10-05: the Reckoner supports teacher judgement rather than being foolproof, so a one-lesson class that ranks ADI or SWH first gets a prompt, not a gate. ADI's guide length (6–8 lessons) is right; ~~ADI can serve as a routine inside a unit or as the unit's architecture, and the prompt puts that choice to the teacher~~ (superseded by item 48: ADI is a routine inside a unit, not a unit's architecture). ADI's fit profile is unchanged
- [x] Results: models 15, guides 6, examples 58, worked sequences 20, focus areas unchanged, no guide version changes. Build tests 19 → 20, game tests 20 → 22. Validate, test, typecheck, check:pages and check:regressions (against `origin/main`) pass. Checked in a browser: the prompt shows on the top card for an arguing class with one lesson, the How it works line renders, and the ADI path waits for POE Explain
- Adapted from the handoff: (1) the patch added the methodology line as a single-quoted YAML string inside a `|` block, where quotes are literal, so students would have seen the quote marks and doubled apostrophes ("model''s"). It is now plain text, word for word the signed-off wording. (2) The handoff asked Claude Code to open, merge and release the PR; `/apply-handoff` stops at a pushed branch, so release waits for `/ship`. (3) The handoff and its patch are committed under `docs/handoffs/` as the record
- [x] ~~Open: Round 6, ADI Design lessons `adi-4` (Build it: ADI) and `adi-5` (Argument Day, a branching sim on `seq-s5-sound`)~~ Done in item 49
- [x] ~~Open: align the ADI guide's `scaleNote` with the view that ADI can also carry a unit~~ Closed by item 48: the `scaleNote` ("replaces a practical and its report, not the whole unit") already matches the Field Guide, so no guide change is needed
- [x] ~~Open: plate for `adi-1-leaf-litter`~~ Done in item 50

### 48. ADI framed as a multi-lesson routine inside a unit ✅ — 2026-10-05
- [x] Steve's direction, 2026-10-05 (`docs/handoffs/2026-10-05-adi-routine-wording.md`): keep consistency with the Field Guide's wording. ADI is a multi-lesson routine ("A few lessons. Fits inside a unit."): between one lesson and part of a unit, not a whole unit. Corrects three places item 47 shipped
- [x] Reckoner: the routine-for-a-unit "Have you thought about…?" prompt now asks which unit model the routine will sit inside, and where in that unit it does its work. How it works: the rules line now names "a multi-lesson routine when you're planning a whole unit, since a routine fits inside a unit rather than structuring one". Methodology 1.2.0 → 1.2.1; the line stays plain text in its block
- [x] Fieldwork: `select-3-argue` 1.0.0 → 1.0.1. Its three Reckoner items now plan "a few lessons inside your unit" (timescale 2–5 lessons), re-scored against the Reckoner by the build (sound: ADI; local ecosystems: 5E; the flip's starting class changed so the flip stays clear). `adi-1-leaf-litter` 1.0.0 → 1.0.1: the concept card says ADI "sits inside a unit". Both reviewed by Steve Grant, 2026-10-05
- [x] Results: lessons 14; models 15, guides 6, examples 58, worked sequences 20, focus areas unchanged; no guide version changes. Build tests 20, game tests 22, rules hash unchanged. Validate, test, typecheck, check:pages and check:regressions (against `origin/main`) pass. The patch applied cleanly: `tools/reckoner/` on `dev` matched `main` at `96bf198`
- [x] Item 47's decision line on ADI as a unit's architecture is marked superseded, and its `scaleNote` open item is closed: the ADI guide already says ADI "replaces a practical and its report, not the whole unit"
- Nothing adapted from the handoff

### 49. Fieldwork ADI path complete: Design lessons and Argue it out on a unit timescale ✅ — 2026-10-05
- [x] Applied `docs/handoffs/2026-10-05-fieldwork-adi-design.md`, signed off by Steve Grant on 2026-10-05. Used the pushed `feature/fieldwork-adi-design` branch, as the handoff allows: it sits on `main` at `1085e1a` (unchanged since), contains `dev`, and its source changes are identical to the handoff's patch
- [x] Two Design lessons on the ADI path, published at v1.0.0 and reviewed by Steve Grant: `adi-4-build` "Build it: ADI" (a 15-card build board across the eight stages, reported against 12 look-fors; five flawed cards and empty argument or review stages raise the guide's misapplications; then "two lessons lost, what do you cut?") and `adi-5-argument-day` "Argument Day" (a six-node branching sim on `seq-s5-sound` lessons 4–6, voicing all three target conceptions, three endings). No engine, template, schema or test changes
- [x] `select-3-argue` 1.0.1 → 1.0.2: its ADI classes plan 6–8 lessons inside the unit with the "A unit (6–15 lessons)" timescale, matching the ADI guide's length, re-scored against the Reckoner by the build (sound: ADI; local ecosystems: 5E; the flip still clear). The wording keeps item 48's framing: ADI runs inside the unit, it does not structure it
- [x] Steve's decisions, 2026-10-05: ADI lessons use the guide's 6–8 lessons; Argue it out's ADI classes use "A unit (6–15 lessons)"; both Design lessons signed off
- [x] The ADI path is complete at five lessons (Recognise 1, Explain 2, Design 2). Published lessons 14 → 16 (5E 6, POE 2, ADI 5, Choosing a model 3). Models 15, guides 6, examples 58, worked sequences 20, focus areas unchanged; no guide or methodology version changes
- [x] Validate, test (build 20, game 22; the jsdom test plays all 16 lessons to the end), typecheck, check:pages and check:regressions (against `origin/main`) pass. Checked in a browser at 360 px: the Build it: ADI board shows eight stages and 15 cards under the three-group rail, with no sideways scroll
- Nothing adapted from the handoff. The branch's first commit marks the lessons as drafts; its second publishes them with Steve's review
- [x] ~~Open: plate for `adi-1-leaf-litter` (carried from item 47)~~ Done in item 50

### 50. Leaf litter plate on Under the leaf litter ✅ — 2026-10-05
- [x] Applied `docs/handoffs/2026-10-05-leaf-litter-plate.md`, signed off by Steve Grant on 2026-10-05 (draft A of two; sun rays all the way round; a fuller canopy, about 80% green and 20% leaf-fall colours; no text or numbers). Used the pushed `feature/fieldwork-leaf-litter-plate` branch, stacked on `feature/fieldwork-adi-design` after item 49; its source changes are identical to the handoff's patch
- [x] `adi-1-leaf-litter` shows a plate on its first item: two pitfall traps in cross-section, a sunny mown oval with a cup crowded with ants of one kind, and a gum in leaf litter with one each of six kinds (ant, beetle, slater, spider, centipede, springtail). It doesn't say which site is more diverse, so the prediction stays open. A full `aria-label`, no `<text>`. New tokens `--plate-grey` and `--plate-rust` in all three theme blocks of `game.html`
- [x] No lesson YAML changes and no version bumps: plates live in the template, keyed by lesson id. Lessons 16, guides 6, examples 58 unchanged
- [x] Validate, test (build 20, game 22; the plate test now also covers the leaf litter plate: on the first item only, no text, a description), typecheck, check:pages and check:regressions (against `origin/main`) pass. Checked in a browser at 375 px in light and dark: no sideways scroll
- [x] Closes the `adi-1-leaf-litter` plate item from items 47 and 49. Item 46's plate list still has Cells under the lens and the POE path
- Nothing adapted. The local copy of the handoff was an earlier revision of the branch's (it named `c632975` rather than `7afd44a` as the base); the branch's copy was kept, and the substance is the same

### 51. EDIT518 — record fortnightly videos; add YouTube IDs to `weeks[n].video` in EDIT518.json ⬜ — 2026-10-06
- [ ] Record the fortnightly videos and add each YouTube ID to both weeks of its fortnight: 1 & 2, 3 & 4, 5 & 6, 7 & 8, 10 & 11 (plus 0, 9, 12 and 13 if they get one)
- Until an ID is set, that week shows "This week's video is coming soon." (`videoFallback: "coming-soon"`)
- [x] Week 0 video added: `7X7gs37nPGM` (2026-10-07)
- 2026-10-06: EDIT518 moved to UNE's official 13-week schedule (shutdown after Week 9), so Weeks 10 & 11 straddle the break and videos are now looked up weekly (`videoInterval: 1`). The earlier list (weeks 0, 1, 3, 5, 7, 9, 11, 13) no longer applies

### 53. EDIT521 — videos and Moodle shells ⬜ — 2026-10-06
- [ ] Record the fortnightly videos and add each YouTube ID to both weeks of its fortnight in `config/units/EDIT521.json` (weekly lookup, as EDIT518)
- [x] Week 0 video added: `2umFLPlowR4` (2026-10-07)
- [x] EDIT521's `assessmentPortalUrl` added (2026-10-06)
- [ ] Paste the home-page shell (generator: EDIT521, T3 2026, Home page) and fill in the Zoom details, which stay out of the public config
- [ ] Check in Moodle: quizzes are shown as due Sun 17 Jan with extension to 24 Jan (Moodle lists "Closes 24 Jan")
- [x] EDIT521 has a Unit Outline Quiz; Week 0 links it (2026-10-06). `whatson.js` now shows `weeks["0"].activities` in Week 0

### 52. Correct Sunday trimester start dates in `config/trimester-config.json` ⬜ — 2026-10-06
Five of the six start dates are Sundays: T2 2026 (`2026-06-21`), T3 2026 (`2026-10-18`) and all of 2027 (T1 `2027-02-21`, T2 `2027-06-20`, T3 `2027-10-17`). Only T1 2026 (`2026-02-23`) is a Monday. They look like leftovers of the Sunday workaround reverted under "Fix week resolution — Monday anchor". `blocks.js` (`resolve()` → `buildDateList`), the test harness and the generator's pre-filled shell dates all read this file, so for those trimesters week boundaries fall on Sundays. Found while moving EDIT518, whose shells pass `2026-10-19` directly and don't read the file.
- [x] T3 2026 corrected to Monday `2026-10-19` (2026-10-06, Steve), matching UNE's official study schedule; every T3 2026 week in `blocks.js` now starts on its official Monday
- [ ] On a separate `fix/` branch, move the remaining Sunday starts (T2 2026 and all of 2027) to the following Monday
- [ ] Harness regression for `blocks.js`: compare the resolved week for every day of each affected trimester, before and after, and confirm only the Sunday boundaries move
- [ ] Check the live EDSE shells and any generated shells that embed one of these dates

### 54. Lesson plates for the 5E and POE paths ✅ — 2026-10-07
- [x] Applied `docs/handoffs/2026-10-06-cells-yeast-plates.md`, signed off by Steve Grant on 2026-10-06 and 2026-10-07. Used the pushed `feature/fieldwork-cells-yeast-plates` branch, as items 49 and 50 did: it sits on `main` at `6561c1d` (unchanged since), contains `dev`, and its source changes are identical to the handoff's patch
- [x] Seven new plates on the first item of their lesson, in `PLATES` in `game.js`, each with its own prefixed ids, a full `aria-label` and no `<text>`; none gives the prediction away: `5e-2-cells`, `poe-1-yeast`, `poe-2-hands`, `5e-3-outbreak`, `5e-4-labels`, `5e-5-build`, `5e-6-prac-day`. New tokens `--plate-sugar` and `--plate-uv` in all three theme blocks of `game.html`; `.pv-*` styles; the 5E plates reuse the game's phase colours
- [x] Steve's choices: C3 "field guide plate" from three options, revised so the barrel stands upright over the stage; P2 "waiting to observe" from three options; the Clean hands plate drawn in P2's style, approved as drafted (2026-10-06); O3, L2, B1 and D1 for the later 5E lessons, from three options each (2026-10-07), with L2 revised so the binder opens at its first divider, the Engage tab on the left-hand page
- [x] Lessons with a plate 2 → 9. No lesson YAML changes and no version bumps: plates live in the template. Published lessons 16, guides 6, examples 58 unchanged
- [x] Validate, test (build 20, game 22; the plate test, now "every lesson plate on its first item only", covers all nine plates and checks that each `<use>` in the eight newer plates points inside its own plate), typecheck, check:pages and check:regressions (against `origin/main`) pass. The handoff reports a browser check at 375 px in light and dark
- Adapted from the handoff: its fourth commit was to include the action plan, but the branch's publish commits don't, so this item is a separate commit on the branch. The handoff and its patch are committed under `docs/handoffs/` as the record (already on the branch)
- [x] Closes item 46's plate open item. ~~Still without a plate: ADI lessons 2–5 and the three Choosing a model lessons~~ Done in item 55

### 55. Lesson plates for the ADI path and Choosing a model ✅ — 2026-10-07
- [x] Applied `docs/handoffs/2026-10-07-adi-choosing-plates.md`, signed off by Steve Grant on 2026-10-07. Its commits were pushed onto `feature/fieldwork-cells-yeast-plates` on top of item 54, and its source changes are identical to the handoff's patch; one release ships both items
- [x] Seven new plates in `PLATES` in `game.js`, each with its own prefixed ids, a full `aria-label` and no `<text>`; none gives the answer away: `adi-2-noise`, `adi-3-review`, `adi-4-build`, `adi-5-argument-day`, `select-1-which`, `select-2-dial`, `select-3-argue`. The two plates with people each carry their own `person` symbol. No `game.html` changes: the plates reuse item 54's tokens, `.pv-*` styles and phase colours
- [x] Steve's choices, from three options each (2026-10-07): N1, R1, BA3, A3, S2, DL2, SA3. BA3 and SA3 show ADI as a routine inside a unit, in line with item 48
- [x] Lessons with a plate 9 → 16: every published Fieldwork lesson. No lesson YAML changes and no version bumps. Published lessons 16, guides 6, examples 58 unchanged
- [x] Validate, test (build 20, game 22; the plate test now opens all seven new lessons too), typecheck, check:pages and check:regressions (against `origin/main`) pass. The handoff reports a browser check at 375 px in light and dark
- Nothing adapted from the handoff. Closes the plate work left open in item 54

### 56. Family Tree families ✅ — 2026-10-07
- [x] Applied `docs/handoffs/2026-10-07-family-tree-families.md`, signed off by Steve Grant on 2026-10-04 (the groupings) and 2026-10-07 (the summaries and the decisions below). Used the pushed `feature/family-tree-families` branch: it contains `dev`, and its source changes are identical to the handoff's patch
- [x] New `content/families.yaml` (published v1.0.0, `ai-drafted-reviewed`, reviewed by Steve Grant 2026-10-07) and its schema `src/schema/families.ts`: six families (Learning cycles; Conceptual change; Argument and writing; Reasoning; Problems, projects and issues; Across every branch), all 15 models placed once. `validate` fails if a registered model is in no family or a member is unregistered; the build ships `families` only once published (or in a review copy)
- [x] Design decision: one families file rather than the new optional field on each model that item 46 expected. A family is a relation between models, so regrouping is one line with no guide version bumps, and `validate` checks the whole grouping at once
- [x] Family Tree: opens on **Group by: Family**, one band per family in the file's order, Levels of inquiry last ("Applies inside any of them"); tiles keep the scale edge and show the scale in words and icon, with a scale key in the legend; **Scale** shows the four scale bands as before. A model's card names its family with **Same family** pills. The intro and home step 1 ("Where each model comes from and how they fit inside each other") change as item 46 planned. The view choice is held in memory only (no new storage key). Without published families the page is unchanged
- [x] Steve's decisions, 2026-10-07: summaries signed off; "5E and 7E grew out of the original Learning cycle" checks out; Ambitious Science Teaching belongs in Problems, projects and issues; the Family Tree opens on families
- [x] Results: models 15, guides 6, examples 58, worked sequences 20, focus areas 16 / 0 / 0, game lessons 16, all unchanged; no guide, lesson or methodology version changes. Rule checks 48 → 55, build tests 20 → 21, game tests 22. `reckoner/data/guides/`, `play/` and every guide, catalogue, question and methodology file unchanged; `manifest.json` only gains `families`. Validate, test, typecheck, check:pages and check:regressions (against `origin/main`) pass. The handoff reports a browser check at 360 px (light and dark) and 1200 px
- Nothing adapted from the handoff
- Item 46's open item on asking the next cohort about the names is unchanged

### 57. Explore: animate the Family Tree's Family | Scale switch ⬜ — 2026-10-07
Parked for later exploration (Steve, 2026-10-07). Depends on item 56.
- [ ] Explore animating the switch so each model's card visibly moves into its new grouping. Suggested approach: FLIP in `renderMap()` (`templates/app.js`): record each tile's position by `data-model` before re-rendering, re-render, then slide each tile from its old spot to its new one (about 350 ms, slight stagger) with the Web Animations API, and fade in the new band headings. Tiles stay real buttons and focus stays on the Group by button
- [ ] Care points: instant switch under `prefers-reduced-motion` and where `element.animate` is missing (jsdom); the tile foot changes (scale ↔ phase count) mid-move; tiles sliding in from off screen on phones; a second click mid-animation starts from where the tiles are. Template-only: no content, storage key or version changes
- [ ] If pursued: a build test that the switch still lands every model in the right band, and a browser check at 360 px (light and dark) and on desktop

### 58. Fieldwork SWH path with a choice of cases ⬜ (open items remain) — 2026-10-08
- [x] Applied `docs/handoffs/2026-10-08-fieldwork-swh.md`, signed off by Steve Grant on 2026-10-08 (review copy v3). Used the pushed `feature/fieldwork-swh` branch, as items 49–56 did: it sits on `dev` at `7f8f593`, and its source changes are identical to the handoff's patch (applied to `dev` in a scratch worktree and compared file by file)
- [x] Game engine: a path can offer cases (`tracks` in `game.yaml`, `track` on a lesson). Shared lessons come first, then a "Choose a case" group on the map; only the chosen case's lessons show, and players can switch at any time. The choice is saved as `tracks` inside the existing progress record (no new storage key). Unlocking and warm-ups stay within a case; either case counts towards the path's mastery. New unscored `case` card (setting, lead, "The lessons so far", "Your role") and an optional `table` on any item, rendered as a real `<table>` with a caption and scoped headings. The build checks track ids, per-track numbering and `sofar` phase ids
- [x] Content: SWH path (unlocks at POE Explain, three-group rail) with shared `swh-1-spinners`, then case `bottles` (Year 10 Chemistry) and case `duckweed` (Year 9 Biology), each with lessons 2–5 (Explain ×2, Build it: SWH, Negotiation Day). Choosing a model gains `select-4-routine` "Which routine?" (ADI or SWH?, requires SWH Explain) and lists SWH as a model. All ten published at 1.0.0, `ai-drafted-reviewed`, reviewed by Steve Grant 2026-10-08
- [x] `swh` guide 1.2.0 → 1.3.0 (minor, content added), `lastReviewed` 2026-10-08: worked sequence `swh-seq-s4-spinners` appended (Stage 4 Forces, `SC4-FOR-01`, five lessons, all seven phases). No other id in the guide changed
- [x] Steve's decisions, 2026-10-07: five lessons; worked sequences chosen by topic; the SWH path unlocks at POE Explain; Choosing a model gains "ADI or SWH?". 2026-10-08: the separation and bottles examples overlapped, so lesson 1 uses a new Physics example (spinners); the bottles game translation was reworked to keep to the guide's tests and one class data set; keep both bottles and duckweed and let players choose; set every case up for a player who hasn't read the guide; put results in tables
- [x] Results, all as the handoff expected: models 15, guides 6, examples 58, worked sequences 20 → 21, Stage 4 Forces lists two ready plans (`5e:seq-s4-forces`, `swh:swh-seq-s4-spinners`). Published lessons 16 → 26 (5E 6, POE 2, ADI 5, SWH 9, Choosing a model 4). Rule checks 55 (unchanged), build tests 21, game tests 22 → 23 (the review copy plays all 26 lessons to the end). Only `swh.json` and `manifest.json` change under `reckoner/data/`. Validate, test, typecheck, check:pages and check:regressions (against `origin/main`) pass; rebuilding changed nothing. The handoff reports a browser check at 360 px in light and dark
- Adapted from the handoff: nothing. The branch already carried every source and generated change, so applying it meant verifying the branch rather than re-applying the patch
- [x] ~~Open: plates for the ten new lessons (three options each, as for the other paths)~~ Done in item 59
- [x] ~~Open: "Build it: ADI" lists the strong card first in every pair, and build cards aren't shuffled; reorder its cards to interleave, as the SWH boards do (no engine change)~~ Done in item 60
- [ ] Open: choice options aren't shuffled on a first play; the new lessons vary the correct option's position by hand. A first-play shuffle would remove the need
- [ ] Open: the Fieldwork feedback form URL is still a placeholder in `game.yaml`
- Note: the guide's `swh-seq-s4-separation` is no longer used by Fieldwork. It stays in the guide

### 59. Plates for the SWH path and Which routine? ✅ — 2026-10-08
- [x] Applied `docs/handoffs/2026-10-08-swh-plates.md`, signed off by Steve Grant on 2026-10-08. Its commits were pushed onto `feature/fieldwork-swh` on top of item 58, and its source changes are identical to the handoff's patch (applied to `05280fa` in a scratch worktree and compared); one release ships both items
- [x] Ten new plates in `PLATES` in `game.js`, on the first item of their lesson, each with a full `aria-label`, no `<text>` and its own prefixed ids; none gives an answer away: `swh-1-spinners`, `swh-2-bottles`, `swh-3-bottles`, `swh-4-bottles`, `swh-5-bottles`, `swh-2-duckweed`, `swh-3-duckweed`, `swh-4-duckweed`, `swh-5-duckweed`, `select-4-routine`. No `game.html` changes: they reuse the existing `--plate-*` tokens, phase colours and `.pv-*` styles
- [x] Steve's choices, from three options each (2026-10-08): SP1, BO1, RB3, BB1, DB1, DW1, RD1, BD1, DD1, SR1
- [x] Plate test extended (not added): it opens each lesson in its case, checks a plate that follows a self-advancing case card leaves on the next item, and fails if any published lesson has no plate
- [x] Results, as the handoff expected: lessons with a plate 16 → 26, every published lesson. Published lessons 26, guides 6, examples 58, worked sequences 21 unchanged; no lesson, guide or methodology version changes. Rule checks 55, build tests 21, game tests 23. Only `play/index.html` changes among generated files. Validate, test, typecheck, check:pages and check:regressions (against `origin/main`) pass; rebuilding changed nothing. The handoff reports a browser check at 360 px in light and dark
- Nothing adapted from the handoff. Closes item 58's plate open item

### 60. Build it: ADI cards interleaved ✅ — 2026-10-08
- [x] Steve's request, 2026-10-08, closing item 58's open item: build cards aren't shuffled, and `adi-4-build` listed the strong card first in every stage's pair, so the pattern showed. The cards are now interleaved as the SWH boards are: strong first for the question, argumentation and peer review; flawed or weaker first for design, tentative argument, report and revision. `rd-consolidate` is its stage's only card and stays in place
- [x] Order only: every card's text, `does`, `features` and `flaws` are unchanged (the file's sorted lines differ only in the version). `adi-4-build` 1.0.0 → 1.0.1; `lastReviewed` and provenance are unchanged, since no content was reviewed
- [x] Validate, test (rule checks 55, build 21, game 23), typecheck, check:pages and check:regressions (against `origin/main`) pass. Generated changes: `play/index.html` and `docs/reckoner-state.md` only

### 61. Metacognition Coach ⬜ (open items remain) — 2026-10-09
- [x] Applied `docs/handoffs/2026-10-09-metacognition-coach.md` (content reviewed and approved by Steve Grant, 2026-10-09). Phase 0 reconciliation reported first; Steve's decisions, 2026-10-09: the explorer's phase colours; Stage 6 contexts show the vocabulary's labels as they are; `games/` as the folder; merge the deep-dive redesign first (PR #55, merged into `dev`); a separate `.lxd-mcg` root
- [x] Goal changed after the first build (Steve, 2026-10-09): **the target is a standalone web app; the Moodle embed is not a constraint.** The app is `games/metacognition-coach/index.html`; the module moved from `moodle-blocks/` to `games/metacognition-coach/coach.js`; the Moodle handling (the pinned top bar below Boost's navbar, `#page` scrolling, the `h2`-only headings) is replaced by the prototype's simpler pattern: a CSS sticky top bar, scroll to top on each screen, an `h1` on every screen. Spec §8 no longer applies, except scoping and per-mount ids, which stay
- [x] Content: `games/metacognition-coach/content.json` (v1.0.0), converted from `docs/handoffs/mcg-content.js` without changing any wording: 9 units × 7 steps = 63 steps, 27 scenes. Habit names and phases come from `frameworks/metacognition-nsw-science/habits.json` (`habitsFrom`); definition items are stored as references; scenario contexts are vocabulary ids, with the five Stage 6 contexts flagged `acknowledgedSuperseded`
- [x] Schema `games/_schema/coach.schema.json` and validator `scripts/validate-coach.js`, chained into `npm run validate` and the `Validate frameworks` workflow (paths now include `games/**`). It checks the seven-step sequence, one correct option, feedback on every wrong or partial option, habit and vocabulary references, the `<b>`/`<i>` whitelist, and parity with the approved source through the app's own `buildGame()`. 14 deliberate breaks, each caught
- [x] App module (`renderCoach`, renderer `coach@1.0.0`): rules ported from the prototype; ids prefixed per mount; `data-mcg-*` stamps; progress in `localStorage` under `lxd-mcg-v1` (the deliberate exception, with its limits, is in `docs/framework-explorer-roadmap.md`); `?reviewer=1` shows the reviewer toggle
- [x] Measured in a local browser: all 9 habits played to the end; unlocking in path order; XP 10/5 and first-time right from first attempts only; calibration bars equal to their values; progress survives a reload; mixed review locked below two habits, 6 items across habits with "Which habit?" items, due dates per the 1/3/7/14/30 schedule; reset (two taps); storage blocked still plays; text contrast 0 failures on 19 screens at desktop and 390 px; no overflow at 390 px; keyboard path; zero console errors
- Adapted from the spec: (1) the root is `.lxd-mcg` (Steve's decision), with `--mcg-*` tokens of the same values as `--fx-*`; (2) contexts use the repo's field names (`stages`, `focusArea`, `syllabus`, `module`, `note`), and Stage 6 labels read e.g. "Chemistry Stage 6 (2017) · M6 Acid/Base Reactions"; (3) the parity test is part of the validator, because the repo root has no test runner; (4) monitoring's small text uses #77601B, as #8A6D1F on the sunk background is 4.46:1; (5) the chosen confidence button's label uses the body colour, as muted on the accent tint was 4.25:1 (the prototype's pairing); (6) the "You performed" bar is drawn at its displayed level; (7) reviewer mode only on request and `explorerUrl` empty by default, as §11 recommends
- [x] axe-core 4.10.2 (installed with `--no-save`, not a dependency): 0 violations on 19 screens, after the completion screens' panel headings moved from `h3` to `h2` (heading-order)
- [x] Steve, 2026-10-09: students reach the app through a link on Moodle; publish to `main` while prototyping, public on Pages
- [ ] Open: how to secure access later. Options and a suggested path: `docs/metacognition-coach-access.md`
- [ ] Open: the answer key (`Metacognition_Coach_answer_key.html`) is not committed, since everything on `main` is public on Pages. Decide where it lives

### 62. Habit Studio pilot: deeper practice on two habits ⬜ — 2026-10-09
- [x] Steve, 2026-10-09: the Metacognition Coach is a quick, surface-level entry; the habits need a deeper approach. The deeper layer is practice, not assessment; it lives in a web app; Steve will give serious authoring time
- [x] Draft spec: `docs/habit-studio-pilot-spec.md`. Two habits (Model your thinking, Evaluate progress); six stations per habit (how it works, contrasting cases, reading student thinking, design a move, plan across a unit, rehearse); feedback from expert exemplars and placements, no backend or AI; about 35–50 h of authoring per habit
- [x] Steve's decisions, 2026-10-09 (spec §13): the name is Habit Studio; the second reviewer for expert placements is a practising science teacher; composites for the pilot; build Model your thinking first; pilot cohort and timing on hold, and no ethics approval is needed
- [ ] Open: name the second reviewer (a practising science teacher) before M2
- [x] Steve, 2026-10-09: fix the Coach's length cue now (spec §13.6)
- [x] Length-cue fix: 75 wrong or partial options rewritten (correct options and feedback unchanged), Coach content 1.0.0 → 1.0.1, reviewed by Steve Grant on 2026-10-09 with no changes. Logged in `games/metacognition-coach/changes.json`; the validator gains length rules (shortest option ≥ 60% of the longest; correct option ≤ 15% longer than the longest wrong one) and fails on any unreviewed change
- [x] M1 started, 2026-10-09, on `feature/habit-studio-m1`: schema `games/_schema/studio.schema.json` (explainer, case pair, rubric, artefact, brief, unit plan, rehearsal, manifest); validator `scripts/validate-studio.js` in `npm run validate` and CI (15 deliberate breaks, each caught); the context check shared with the Coach in `scripts/lib/game-context.js`; review copy `scripts/studio-review.js`; authoring guide `games/habit-studio/AUTHORING.md`
- [x] One sample of each content type for Model your thinking in `games/habit-studio/content/model/`, all `ai-generated` and unpublished, for Steve to rewrite or approve. The artefact carries one provisional placement marked `draft`; expert placements are Steve's and the second reviewer's
- Adapted from the spec: (1) the Studio allows `<sub>` and `<sup>` as well as `<b>` and `<i>`, for chemical formulae; (2) a case pair's two versions must be within 20% of each other in length, so the better one isn't also the longer one (the Coach's length cue)
- [x] M1 signed off by Steve, 2026-10-10: the format works and the samples are right. All seven samples marked `ai-drafted-reviewed`, reviewed by Steve Grant; still unpublished until the full set is written. The ethane artefact is placed at level 4 independently by Steve Grant and the second reviewer (a practising science teacher), both agreeing the rationale; the second reviewer is recorded under a stand-in label, and the validator blocks publishing until it's replaced with their name
- [ ] Next: M2, the full Model your thinking set (3 case pairs, 10–12 artefacts with two placements each, 2 briefs, spaced-return items), about 35–50 h, mostly Steve's

### 63. Metacognition in Science: 2025 Stage 6 examples (drafts) ⬜ — 2026-10-10
- [x] Steve, 2026-10-10: draft 2025 Stage 6 examples for the explorer; list the 2025 structure in the vocabulary; mark the drafts unreviewed until he signs them off
- [x] Vocabulary 1.1.0 → 1.2.0, checked against NESA in October 2026: Biology, Chemistry and Physics 11–12 (2025) are organised into focus areas, not modules, so their 21 focus areas are listed under `focusAreas` (with `year`); Chemistry corrected to start in 2028 (first HSC 2029); syllabus labels now "Biology 11–12 (2025)" and so on, as NESA names them
- [x] No 2025 Investigating Science syllabus exists: NESA lists Investigating Science 11–12 as in development, with no date. The placeholder `investigating-science-stage6-2025` is replaced by `investigating-science-11-12` (status `in-development`), and the 2017 syllabus now points to it
- [x] Drafts as in Habit Studio: matrix topics gain optional `focusArea` and `review` (`source`, `reviewedBy`, `lastReviewed`, `published`). The renderer hides a topic whose `review.published` is false, and any area or stage left empty, unless `showDrafts` is set (`?drafts=1` on the standalone page, a checkbox in `frameworks/preview.html`), where drafts carry a "Draft · not reviewed" label. The validator fails a published topic that isn't reviewed, and a `focusArea` from another syllabus
- [x] Six draft topics, 54 cells, all `ai-generated` and unpublished: Biology (2025) natural selection, evaluating a biotechnology; Chemistry (2025) intermolecular forces vs bonds, limiting reagents; Physics (2025) net force and constant velocity, finding g graphically. Outcome codes in the tags (BI-11-03, BI-12-04, CH-11-01, CH-11-02, PY-11-01), wording not quoted. Evidence citations reuse the framework's existing sources
- [ ] Open: Steve reviews the six topics. To publish one: set `source` to `ai-drafted-reviewed`, add the reviewer to `reviewedBy`, set `lastReviewed` and `published: true`, then bump the framework's minor version and update Stage 6's `sub` line to mention the 2025 syllabuses
- [ ] Open: no Earth and Environmental Science area in the explorer (2017 or 2025); Investigating Science waits for NESA
- [ ] Open (found while testing, not changed here): clicking a topic card updates the result but not the card's highlight or `aria-pressed`; `renderTopics()` isn't called from the topic click handler

---

## ✅ Completed

### 25. Fix workflow card underline under host theme rule ✅ — 2026-07-14
- [x] Root cause: host Moodle theme forces a{text-decoration:underline !important};
  .lx-card's own text-decoration:none had no !important and lost the cascade
- [x] Added !important to .lx-card and .lx-card h4
- [x] Live on main

### 26. Fix nested anchor markup in renderWorkflowCard ✅ — 2026-07-14
- [x] Removed invalid nested <a> (lx-pill-link inside lx-card) causing duplicate phantom
  pill elements on iPad Safari/Edge (WebKit parser error-recovery split the invalid
  nesting into visible empty clones)
- [x] Restored whole-card click via new `.lx-card-link` sibling anchor (not nested)
- [x] Verified: 0 nested anchors, 0 phantom clones across EDSE362/358/357, live on main

### 27. Fix .lx-pill-link and .lx-btn underline under host theme rule ✅ — 2026-07-14
- [x] Host Moodle theme forces `a{text-decoration:underline !important}`, which the
  original .lx-card rule (no !important) couldn't resist — separately fixed as item 25
- [x] .lx-pill-link and .lx-btn had the same exposure; fixed with matching !important
  resting-state rules
- [x] Required also making :hover !important (cascade requires it — a non-!important
  :hover cannot beat an !important base rule regardless of specificity) — verified hover
  underline preserved in production
- [x] Live on main — no Moodle re-paste required (unchanged export signature/container ID)

- [x] renderAssessmentPage updated to support multi-task tabbed rendering (`forTask: 'all'` or array). Tab switcher scoped to container element — multiple instances on one page don't conflict. `renderAssessmentNav` added as 17th render function (unit home navigation card — one button per task, due date + weighting + LO pills). Both added to generator (shell types: 'All assessments (tabbed)', 'Assessment navigation') and test harness (view mode selector: Single task / All tasks tabbed / Navigation buttons).

- [x] Phase 1 — Config layer (trimester-config.json, all unit JSONs)
- [x] Phase 2 — Generator UI (generate/index.html)
- [x] Phase 3 — Block renderer (moodle-blocks/blocks.js, 9 render functions)
- [x] Phase 3B — Assessment Content System (renderAssessmentPage, bespoke components)
- [x] Phase 4 — Refactor whatson.js and autovideos.js to read from config JSONs
- [x] EDSE357 assessmentTasks AT1 and AT2 — fully populated including 55 rubric descriptors
- [x] EDSE358 assessmentTasks AT1 and AT2 — rubric descriptors populated
- [x] Pre-submission checklists — EDSE357 AT1, EDSE357 AT2, EDSE358 AT1 created as static templates
- [x] EDSE358 weeks 3–8 — fully populated (announcement, live session content, links)
- [x] Video IDs weeks 9–14 — set to DGIXT7ce3vQ across all units
- [x] Sandpit tests — all phases confirmed in live Moodle environment
- [x] dev → main merge — all phases live in production
- [x] GitHub Pages — serving from main
- [x] renderUnitKeyInfo and renderAssessmentStatus navigation blocks — built and deployed to EDSE357 and EDSE358 course homepages ✅
- [x] SVG banners created and live for EDSE357, EDSE358, EDSE362 ✅
- [x] EDSE357 constructive alignment audit complete — gaps G1-G7 identified and addressed. Forum prompts and orientation notes added to weeks 3, 5, 7. AT1 Part D and AT2 Diversity rubric descriptors updated. AT2 LO5/LO6 guidance notes added. Alignment map built and committed.
