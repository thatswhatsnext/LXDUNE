# Framework Explorer — Product Roadmap

**Product:** LXDUNE Framework Explorer — config-driven teaching-framework artefacts, authored as validated JSON, rendered by one shared module, pasted into Moodle as a live-served web artefact.
**Last updated:** 2026-07-30
**Delivery model (current):** repo-native live JS+JSON on GitHub Pages; a one-line `<script type="module">` shell pasted into a Moodle Page. No build, no server, no browser storage. See `frameworks/README.md`.

---

## Now (shipped / in flight)

- ✅ **HITS in NSW Science** — deep-dive view. Live on `main`.
- ✅ **Metacognition in Science** — matrix view (13 topics × 9 habits = 117 cells). Live on `main`.
- ✅ **Metacognition — starter** — grid view (4 contexts × 9 habits = 36 cells). Lighter on-ramp to the full matrix.
- ⏳ **Real-Moodle verification** — paste into a myLearn Page, confirm §7 theme interaction at desktop + mobile. *The last open item before the model is fully proven in situ.*
- ⏳ **EDSE362 "Teaching frameworks" page** — all three explorers on one page. Shells ready in `docs/EDSE362-framework-explorer-shells.html`.

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

---

## Delivery-model limits — when the paste-in web artefact starts to break

The current model (static JS+JSON on Pages, pasted into a Moodle Page, no server, no storage) is deliberately simple and covers a lot. It holds as long as the artefact is **read-only, stateless, and anonymous**. Watch for these signals that it's being outgrown — any one is a reason to flag a pivot toward an app/plugin/LTI:

1. **You need to know *who* did something** (per-student analytics, gradebook, completion) → needs trustworthy server-side identity, which a pasted Page can't provide safely.
2. **You need to persist state across visits** (resume, progress, saved notes) → the no-storage rule blocks this client-side; needs a backend.
3. **You need to write back into Moodle** (grades, completion, competency) → needs a plugin / LTI / web-service auth, not a `<script>` paste.
4. **Editors keep stripping the shell** — if Atto/TinyMCE strip `<script>` on save and raw-HTML can't be enabled, the paste model itself is blocked → an activity plugin sidesteps it.
5. **Content authoring outgrows JSON review** (many contributors, non-technical authors) → an authoring UI / CMS becomes worth it.
6. **Cross-institution or offline reuse** → a packaged content type (H5P / SCORM / plugin) travels better than a Pages URL.

Until one of these bites, **keep building as a web artefact** — it's the cheapest, most maintainable path, and every framework added this way is one data file. Learning analytics (Later) is the first item on the list above that trips signal #1, which is exactly why it's parked rather than bolted on.
