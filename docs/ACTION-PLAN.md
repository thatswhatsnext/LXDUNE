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
- [ ] Open: Family Tree families. Steve approved the draft groupings on 2026-10-04 (handoff open question 1: Learning cycles; Conceptual change; Argument and writing; Reasoning; Problems, projects and issues; Levels of inquiry across every branch). Building them needs a new optional field, so it is a separate change. Until then the tab keeps the current map under its new name, and home step 1 reads "How the models relate and fit inside each other" rather than promising where each model comes from
- [ ] Open: plates for more lessons, starting with Cells under the lens and the POE path (add to `PLATES` in `game.js`)
- [ ] Open: ask the next student cohort about the names (Field Guide, Family Tree, Fieldwork) before they are fixed in the Moodle unit pages
- [x] Steve's decision, 2026-10-04: keep the alternative card's wording as it is (handoff open question 2)
- [x] Steve's decision, 2026-10-04: Fieldwork keeps IBM Plex Sans for body text, matching the Reckoner (handoff open question 3)
- [x] Steve's decision, 2026-10-04: keep the step order (Learn, Practise, Choose, Plan) and add "Already planning a unit? Start with your unit ↓" under the steps, which selects Start with your unit and brings the stage picker into view (handoff open question 4). Revisit with usage data
- [ ] Open: content still says "reckoner" in lower case in places (`methodology.yaml`, some game lesson text). Content was out of scope here; align it the next time those files are reviewed

### 47. Fieldwork ADI path and the Reckoner's time-and-scale prompts ⬜ (open items remain) — 2026-10-05
- [x] Applied `docs/handoffs/2026-10-05-fieldwork-adi.md` and its patch (four lessons, the methodology line and the decision behind the prompts reviewed and signed off by Steve Grant, 2026-10-05). The patch applied cleanly: `tools/reckoner/` on `dev` was identical to `main` at `973e242`
- [x] Game engine: a path can show its journey guide's stage groups on the rail (`rail: groups`); a guide with stage groups colours phases by group; ADI items carry a stage tag in the group colour; spot items can offer only some phases (`among`, 2–5); a lesson can carry its own `requires`. 5E, POE, scoring and saved progress are unchanged
- [x] Content: ADI path (between POE and Choosing a model, unlocks at POE Explain) with `adi-1-leaf-litter`, `adi-2-noise` and `adi-3-review`; Choosing a model gains `select-3-argue` (requires ADI Explain) and lists ADI as a model. Published lessons 10 → 14 (5E 6, POE 2, ADI 3, Choosing a model 3)
- [x] Reckoner: "Have you thought about…?" prompts on the detailed Reckoner's top three cards when a model's scale and the timescale don't line up. Not a rule, so the ranking and the rule texts (and their hash) are unchanged; models already covered by the time watch-out get no prompt. Methodology 1.1.0 → 1.2.0 with one line in "Hand-written rules", reviewed 2026-10-05
- [x] Steve's decisions, 2026-10-05: three-group rail; Biology (microhabitats) then sound; five ADI lessons in all (Design lessons follow); ADI added to Choosing a model now; ADI path unlocks after POE Explain
- [x] Steve's decisions on the Reckoner, 2026-10-05: the Reckoner supports teacher judgement rather than being foolproof, so a one-lesson class that ranks ADI or SWH first gets a prompt, not a gate. ADI's guide length (6–8 lessons) is right; ADI can serve as a routine inside a unit or as the unit's architecture, and the prompt puts that choice to the teacher. ADI's fit profile is unchanged
- [x] Results: models 15, guides 6, examples 58, worked sequences 20, focus areas unchanged, no guide version changes. Build tests 19 → 20, game tests 20 → 22. Validate, test, typecheck, check:pages and check:regressions (against `origin/main`) pass. Checked in a browser: the prompt shows on the top card for an arguing class with one lesson, the How it works line renders, and the ADI path waits for POE Explain
- Adapted from the handoff: (1) the patch added the methodology line as a single-quoted YAML string inside a `|` block, where quotes are literal, so students would have seen the quote marks and doubled apostrophes ("model''s"). It is now plain text, word for word the signed-off wording. (2) The handoff asked Claude Code to open, merge and release the PR; `/apply-handoff` stops at a pushed branch, so release waits for `/ship`. (3) The handoff and its patch are committed under `docs/handoffs/` as the record
- [ ] Open: Round 6, ADI Design lessons `adi-4` (Build it: ADI) and `adi-5` (Argument Day, a branching sim on `seq-s5-sound`)
- [ ] Open: the ADI guide's `scaleNote` says ADI "replaces a practical and its report, not the whole unit". Steve's 2026-10-05 view is that ADI can also carry a unit. Align the wording the next time the ADI guide is reviewed (patch bump)
- [ ] Open: plate for `adi-1-leaf-litter` (add to `PLATES` in `game.js`), alongside item 46's plate list

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
