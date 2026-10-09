# Framework Explorer — Product Roadmap

**Product:** LXDUNE Framework Explorer — config-driven teaching-framework artefacts, authored as validated JSON, rendered by one shared module, pasted into Moodle as a live-served web artefact.
**Last updated:** 2026-10-09
**Delivery model (current):** repo-native live JS+JSON on GitHub Pages; a one-line `<script type="module">` shell pasted into a Moodle Page. No build, no server, no browser storage. (The Metacognition Coach, below, is a separate web app with browser-only progress.) See `frameworks/README.md` and `games/README.md`.

---

## Now (shipped / in flight)

- ✅ **HITS in NSW Science** — deep-dive view. Live on `main`.
- ✅ **Metacognition in Science** — matrix view (13 topics × 9 habits = 117 cells). Live on `main`.
- 🗄️ **Metacognition — starter** — grid view (4 contexts × 9 habits = 36 cells). *Retired from the EDSE362 page 2026-10-01: superseded, the page is consolidated to one metacognition explorer (the full matrix).* Retained in the repo as a reference on-ramp: files unchanged, still validated and served. See its `CHANGELOG.md`.
- ⏳ **Real-Moodle verification** — paste into a myLearn Page, confirm §7 theme interaction at desktop + mobile. *The last open item before the model is fully proven in situ.*
- ⏳ **EDSE362 "Teaching frameworks" page** — HITS and the full Metacognition matrix on one page (the starter was retired from it 2026-10-01). Shells ready in `docs/EDSE362-framework-explorer-shells.html`.
- ⏳ **Metacognition Coach** — *built 2026-10-09, renderer `coach@1.0.0`.* A practice game on the nine metacognition habits (9 habits × 7 steps), built on the explorer's habits and the curriculum vocabulary. **A standalone web app, not a Moodle embed** (Steve, 2026-10-09): `games/metacognition-coach/` (`index.html`, `coach.js`, `content.json`), checked by `npm run validate`. Published on Pages while prototyping; students reach it through a link on Moodle (Steve, 2026-10-09). Open: securing access later, options in `docs/metacognition-coach-access.md`. **Storage exception:** it keeps progress (XP, streak, finished habits, review dates, drafts and commitments) in `localStorage` under `lxd-mcg-v1`, approved by Steve for this stage. Known limits: progress is per browser and device; on a shared computer the next person sees it until they reset; clearing site data erases it; the storage belongs to the `thatswhatsnext.github.io` origin, shared with the reckoner and Fieldwork, so the namespaced key matters. Nothing leaves the browser. If progress needs to follow a student between devices, that is delivery-model signal 2 below.

---

## Next (candidate frameworks — build when ready, one data file + `npm run validate` each)

Each maps cleanly onto an existing view shape (deep-dive = rich per-item arcs; matrix/grid = context × move). Content authoring is a separate decision (handoff §12) — these are the shortlist, not commitments.

| Candidate | Shape | Why it earns a slot |
| --- | --- | --- |
| **CESE *What Works Best* (2020/2025)** | deep-dive | The NSW-native counterpart to HITS — the framework school-improvement docs actually speak. Strongest "second deep-dive"; already referenced in the HITS jurisdictions note. |
| **Rosenshine's Principles of Instruction** | deep-dive | 10 principles, cross-KLA. Proves the deep-dive shape generalises beyond science. |
| **Formative assessment / feedback moves** | matrix | Syllabus context × assessment-for-learning technique (exit tickets, hinge questions, comparative judgement). |
| **Differentiation & adjustments** | matrix | Context × adjustment type, mapped to the EDSE362 given-cohort groups (EAL/D, advanced, behind, Aboriginal and Torres Strait Islander) — directly reusable in assessment tasks. |
| **Cognitive Load Theory in practice** | deep-dive | Worked-example effect, split-attention, redundancy, expertise reversal — each a classroom arc. |
| **Universal Design for Learning (UDL)** | matrix | UDL principle × subject context. General-teaching, cross-KLA. |

*Recommended first pick:* **What Works Best** or **Rosenshine** — highest value + proves generalisation.

---

## Later (platform / lifecycle — parked, with triggers)

- **Learning analytics in Moodle** — *parked 2026-07-30.* Gather + report interaction data (which strategy/topic/habit students open). Reverses handoff §12 ("no analytics") and §7 ("no external requests / no storage"). Ladder: (0) Moodle page logs — free today; (1) event-emission seam in the renderer, default no-op — analytics-ready, still §7-clean; (2) xAPI → LRS via Moodle Logstore xAPI — standards-based, best reporting; (3) `sendBeacon` → light endpoint — simplest transport, heaviest privacy load. **This is the first feature that pushes against the paste-in web-artefact model** (needs server-side identity + a data sink) — see *Delivery-model limits* below.
- **App / plugin pivot** — *not now.* A Moodle plugin (or an activity module / LTI tool) would unlock gradebook integration, server-side identity, persistence, and native reporting. Trigger signals in *Delivery-model limits*.
- **2025 Stage 6 syllabus migration** — *scheduled 2027* (first HSC 2028). Re-author Stage 6 content against the 2025 modules; the vocab already carries `supersededBy`/`activeFrom` and the content is flagged `acknowledgedSuperseded: true`.
- **Constructive-alignment maps** — *explicitly NOT part of this pipeline* (handoff D2c declined). Tracked separately as the `blocks.js` `renderAlignmentMap()` renderer.
- **Debt: deep-dive eyebrow is HITS-specific** — *logged 2026-10-01, renderer `deep-dive@2.0.0`.* The deep-dive view's eyebrow reads "High Impact Teaching Strategy NN of 10", hard-coded in `headerHTML()` in `moodle-blocks/framework-explorer.js` (as the redesign spec required, with no new fields). **Trigger:** the second deep-dive framework (e.g. *What Works Best* or Rosenshine from *Next*), which would otherwise inherit the HITS wording. **Fix then:** an optional framework-level label in `framework.json` (e.g. `itemNoun`, "High Impact Teaching Strategy"), defined in the schema, defaulting to the current HITS text so HITS renders unchanged. The switcher's "Choose a strategy" heading and the pill and panel labels ("In a science faculty") need the same treatment.

---

## Delivery-model limits — when the paste-in web artefact starts to break

The current model (static JS+JSON on Pages, pasted into a Moodle Page, no server, no storage) is deliberately simple and covers a lot. It holds as long as the artefact is **read-only, stateless, and anonymous**. Watch for these signals that it's being outgrown — any one is a reason to flag a pivot toward an app/plugin/LTI:

1. **You need to know *who* did something** (per-student analytics, gradebook, completion) → needs trustworthy server-side identity, which a pasted Page can't provide safely.
2. **You need to persist state across visits** (resume, progress, saved notes) → the no-storage rule blocks this client-side; needs a backend. *The Metacognition Coach is a deliberate, browser-only exception (see Now): it accepts per-device progress rather than adding a backend.*
3. **You need to write back into Moodle** (grades, completion, competency) → needs a plugin / LTI / web-service auth, not a `<script>` paste.
4. **Editors keep stripping the shell** — if Atto/TinyMCE strip `<script>` on save and raw-HTML can't be enabled, the paste model itself is blocked → an activity plugin sidesteps it.
5. **Content authoring outgrows JSON review** (many contributors, non-technical authors) → an authoring UI / CMS becomes worth it.
6. **Cross-institution or offline reuse** → a packaged content type (H5P / SCORM / plugin) travels better than a Pages URL.

Until one of these bites, **keep building as a web artefact** — it's the cheapest, most maintainable path, and every framework added this way is one data file. Learning analytics (Later) is the first item on the list above that trips signal #1, which is exactly why it's parked rather than bolted on.
