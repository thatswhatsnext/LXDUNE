# LXDUNE Action Plan
**Last updated:** 2026-05-19
**How to update:** Tell Claude Code "Update docs/ACTION-PLAN.md — mark item X complete" or "add [item] under [priority]"

---

## 🔴 Do now — units are live

### 1. Verify live Moodle shells are working ✅ — 2026-05-19
Confirm whatson and autovideos render correctly in production Moodle for both EDSE357 and EDSE358 after the Phase 4 refactor.
- [x] Open live EDSE357 Moodle page — confirm whatson shows correct week, autovideos shows correct video
- [x] Open live EDSE358 Moodle page — same check
- [x] If either shows "Loading..." permanently, check shell HTML for stale import URL or ID mismatch

### 2. EDSE358 week 8 — write missing content ⬜
- [ ] Write `announcementBody`, `liveSessionFocus`, `liveSessionTasks` for Module 4D
- [ ] Populate `links.lecture`, `links.forum`, `links.materials` for week 8
- [ ] Commit to dev and push

### 3. Fix EDSE358 AT2 known broken links ⬜
- [ ] Confirm correct Chemistry marking guide URL
- [ ] Confirm correct EES task URL
- [ ] Update `config/units/EDSE358.json` assessmentFiles — commit and push

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
| 8 (Module 4D) | all links |

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

### 9a. Add key link URLs to unit JSONs ⬜
Both `renderUnitKeyInfo` and `renderAssessmentStatus` are built and tested. The `keyLinks` array in each unit JSON currently has all URLs set to `null`. Populate them as links become available.

**EDSE358:**
- [ ] `keyLinks[0].url` — Unit Outline pluginfile URL
- [ ] `keyLinks[1].url` — Learning Materials Moodle book URL
- [ ] `keyLinks[2].url` — Assessment Portal Moodle page URL

**EDSE357:**
- [ ] Same three links as above

**EDSE362:**
- [ ] Same three links as above (T2 2027 — populate before go-live)

### 9b. Add navigation shells to deployed Moodle pages ⬜
Once links are populated, generate and paste the two navigation shells for each live unit.

**For EDSE358 (T1 2026):**
- [ ] Generate `unit-key-info` shell from generator — paste to EDSE358 course home page
- [ ] Generate `assessment-status` shell from generator — paste to EDSE358 course home page

**For EDSE357 (T1 2026):**
- [ ] Same as above

### 9c. Set bannerUrl for each unit ⬜
- [ ] Upload unit banner images to Moodle — get pluginfile URLs
- [ ] Set `bannerUrl` in each unit JSON (currently `null` → shows code/name placeholder)

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

### 12. EDSE358 T2 2026 preparation ⬜
T2 starts 2026-06-22.
- [ ] Add T2-2026 trimesterConfig to `EDSE358.json` — new Zoom meeting ID and URL
- [ ] Confirm T2 start date in `trimester-config.json` (currently `2026-06-22`)
- [ ] Review and update assessment due dates for T2
- [ ] Update any module content that changes between trimesters
- [ ] Verify whatson and autovideos render correctly for T2 dates in test harness
- [ ] Update Moodle shells `forTri` and `forStartDate` parameters

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

---

## 🔵 Do before T2 2027 — EDSE362

### 16. EDSE362 full population ⬜
- [ ] Confirm T2 2027 start date against UNE academic calendar (currently placeholder `2027-06-21`)
- [ ] Confirm T3 2027 dates
- [ ] Set up Zoom meeting for T2 2027 — add to config
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
