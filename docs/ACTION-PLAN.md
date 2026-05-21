# LXDUNE Action Plan
**Last updated:** 2026-05-21
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

### 9a. Add key link URLs to unit JSONs ⬜ (EDSE362 only remaining)

**EDSE358:** ✅ — 2026-05-19
- [x] `keyLinks[0].url` — Unit Outline
- [x] `keyLinks[1].url` — Learning Materials
- [x] `keyLinks[2].url` — Assessment Portal

**EDSE357:** ✅ — 2026-05-19
- [x] Same three links as above

**EDSE362:**
- [ ] Same three links as above (T2 2026 — populate before go-live)

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

### 18. Render new alignment improvement fields in blocks.js ⬜
Five new fields are stored in EDSE358.json but not yet rendered to students.
Add rendering support to the relevant blocks.js functions:

- `orientationNote` → render at top of `renderAnnouncementBlock` or as a
  new `renderOrientationNote` function — a framing paragraph shown at the
  start of a module
- `forumPrompts` → render inside `renderLiveSessionHub` after live session
  tasks — a list of forum discussion prompts
- `workedExample` → render inside `renderLectureBlock` or as a collapsible
  section — a worked example supporting the module activity
- `synthesisTemplate` → not student-facing — this is a lecturer tool.
  Add to the generate/index.html admin tool as a 'Post-forum synthesis'
  shell type that outputs the template for the lecturer to personalise
- `guidanceNotes` on AT1 parts → render inside `renderAssessmentPage`
  Part detail sections — additional guidance paragraphs shown after
  requirements

Also apply same fields to EDSE357.json and EDSE362.json where relevant
once content is written for those units.

Trigger: before T2 2026 EDSE358 go-live, or when content is ready to
surface to students.

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
- [ ] Write `assessmentTasks` AT1 and AT2 in full — rationale, aim, parts, criteria, rubric descriptors, checklists
- [ ] Add assessment file links once tasks are uploaded
- [ ] Deploy all Moodle shells to EDSE362 course
- [ ] Verify in test harness before go-live

---

## ✅ Completed

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
