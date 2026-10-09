# Spec — Habit Studio pilot: deeper practice on two metacognition habits

**For:** Steve Grant (authoring and review), then Claude Code (build)
**Drafted:** 2026-10-09, after the Metacognition Coach release
**Status:** draft for Steve's review. Nothing is built yet.
**Decisions already made (Steve, 2026-10-09):** the deeper layer is **practice, not assessment**; it
**lives in a web app**; Steve will give **serious authoring time** to it.
**Working name:** *Habit Studio* (to confirm, §13).

---

## 1. Why this exists

The Metacognition Coach is a quick, surface-level way into the nine habits. Measured against its own
content, it trains recognition rather than judgement:

- 45 of its 63 steps are multiple-choice or yes/no. The 18 steps where players write something get no
  feedback beyond three tick-boxes they mark themselves.
- In all 26 of its recall and scenario questions, the correct option is the longest. Players can score
  by picking the longest option without understanding the habit.
- Each scenario ends at the teacher's move. Players never see what students said or did next, which is
  the evidence that tells you whether metacognition happened.
- Habits are taught one at a time, in a single moment. Real use combines habits and runs over weeks,
  with scaffolds fading.

The Studio is the depth layer. The three parts have distinct jobs:

| | Job | Format |
|---|---|---|
| Framework Explorer | Reference: look up a move for a topic | Matrix of 117 classroom moves |
| Metacognition Coach | Entry: recognise the nine habits and tell them apart | Quick game, ~10 min per habit |
| **Habit Studio** | **Depth: judge, design, plan and rehearse one habit well** | **Guided studio, ~60–75 min per habit, revisited** |

The pilot builds two habits fully, tests them with pre-service teachers, and decides whether the model
is worth scaling to nine.

## 2. The two pilot habits

**Model your thinking** (monitoring) and **Evaluate progress** (evaluating).

- **Model your thinking** is easy to imitate and hard to do well. Beginning teachers tend to model the
  answer rather than the thinking, model fluently with no visible stuck moment, and never hand the
  thinking over to students. Each of these failures can be seen in a transcript.
- **Evaluate progress** is where analysing student work matters most: telling apart a student who judged
  their own process from one who judged the product, and seeing self-assessment drift from actual
  performance.
- Together they cover two phases (monitoring, evaluating) and connect naturally: you can model
  evaluation itself. That lets the pilot test one cross-habit activity (§5.5).

## 3. Design principles

1. **Generation over recognition.** Players explain, sort, write and plan. The few multiple-choice items
   that remain must not be answerable from surface cues: options matched in length and register, with
   plausible near-misses rather than strawmen. The validator checks length parity (§8).
2. **Student thinking is the object.** Most activities centre on what students say, write or do, not
   only on what the teacher does.
3. **Conditional knowledge.** For each habit: when it helps, when it misfires, and what makes a strong
   version different from a weak one. Show the common dilutions explicitly.
4. **Feedback from expert reference points, not a server.** Annotated exemplars at several quality
   levels, expert placements of student work, and rubric anchors. No AI marking and no backend in the
   pilot (§7).
5. **Revision is the practice.** Players draft, compare against exemplars, and revise. Both versions are
   kept, so the change is visible to them.
6. **Real science contexts.** Every case is set in a named NSW focus area or module and uses the shared
   vocabulary. Each habit appears in at least three contrasting contexts, so players see what transfers.
7. **Honest about uncertainty.** Where experts disagree on a judgement, say so instead of forcing one
   right answer.

## 4. What players should be able to do after one habit

By the end of a habit, a pre-service teacher can:

1. **Explain** why the habit works (the mechanism) and name its common dilutions.
2. **Discriminate** a strong from a weak enactment in a transcript, and say exactly what differs.
3. **Judge** the quality of students' metacognition from their work and talk, against a rubric, roughly
   agreeing with expert placements.
4. **Design** a move for a given class and topic, then improve it against annotated exemplars.
5. **Plan** the habit across a unit: introduce, practise, fade, check for unprompted use.
6. **Rehearse** the move aloud, and take a ready-to-use protocol to placement.

## 5. The studio session for one habit

Six stations, done in order the first time and open in any order afterwards. Each shows an estimated
time. Progress is saved after every station.

### 5.1 Station A — How it works (10 min)

- A short explainer (~600 words, text plus one diagram) on the mechanism: what the habit changes in
  students' thinking, and the evidence base. Written for beginning teachers, not as a literature review.
- **Self-explanation prompts** at two points ("In your own words, why does pausing at the stuck moment
  matter more than the fluent part?"). Free text, then the expert explanation is revealed to compare.
- **Dilutions:** 4–6 common ways the habit is diluted, each with a one-line example and why it fails.

### 5.2 Station B — Contrasting cases (15 min)

- **3 pairs of short classroom transcripts** (~150–250 words each). Within a pair, everything is the same
  except one deliberate feature.
- The player writes what differs and what it does to students' thinking, and only then sees the
  expert annotation. The annotation highlights the lines that matter.
- After each pair, one rating: "Which version would you rather your students experienced, and how sure
  are you?" (confidence 1–5, carried into calibration, §5.7).
- The pairs move from an obvious difference to a subtle one.

### 5.3 Station C — Reading student thinking (15 min)

- **10–12 student artefacts** per habit: exit slips, transcribed group talk, worked solutions with
  annotations, and confidence ratings next to quiz results.
- The player sorts each artefact into one of **four rubric levels** of metacognitive quality, using the
  rubric with an anchor example at each level, and writes a one-line reason for at least three
  placements.
- **Feedback:** expert placements are revealed with a short rationale for each. Where Steve and a second
  reviewer placed an artefact at different levels, it shows "Experts split" with both rationales.
- **Score:** agreement with expert placements, exact and within one level. This is the pilot's main
  measure of judgement. It isn't cued by surface features, because artefacts at each level vary in
  length and polish.

### 5.4 Station D — Design a move (15–20 min)

- **2 design briefs** per habit, each naming a stage, focus area or module, a lesson moment and a
  student profile (for example, "Year 9, Reactions, students who balance equations by trial and
  error").
- The player writes the move: what they'll say and do, and what students will do.
- They check their own draft against the rubric, then compare it with **3 annotated exemplars** at
  different quality levels (strong, plausible but flawed, weak). The annotations point at specific
  lines.
- They revise. Both drafts are kept and shown side by side.

### 5.5 Station E — Plan across a unit (10 min)

- A timeline builder for a 6–8 week unit in a named focus area. The player places moments on the
  timeline: introduce, practise, fade the scaffold, check for unprompted use.
- Simple built-in checks give immediate feedback, for example "No check-in after the scaffold fades" or
  "The scaffold is never removed".
- Then the player compares their plan with one annotated expert plan.
- **Cross-habit task (pilot only once, in the second habit):** plan a unit where *Model your thinking*
  is used to model *evaluating*. This tests whether combining habits adds value.

### 5.6 Station F — Rehearse and take it to placement (10 min)

- A rehearsal card: the player's revised script from Station D, with cues on pacing, where to pause at
  the stuck moment, and which question hands the thinking to students.
- **Optional recording:** the player records themselves saying it aloud and plays it back. The audio
  stays in the browser for that session only and is never stored or sent anywhere.
- A **placement protocol** to export (print or PDF): what to try, what student evidence to collect, and
  three questions to answer afterwards. Practice, not assessed.

### 5.7 Across stations

- **Calibration:** confidence ratings in Stations B and C are compared with performance at the end, as
  the Coach does, but on judgement tasks rather than recall.
- **Spaced return:** 3 and 10 days later, a 5-minute revisit with *new* artefacts and one new contrasting
  pair, so returning tests transfer rather than memory.
- **Export:** the player can download everything they wrote (drafts, revisions, unit plan, protocol) as a
  single file. Practice work belongs to the player and shouldn't be trapped in one browser.

## 6. Content inventory and authoring estimate

Per habit:

| Type | Count | Typical length | What makes it good | Estimate |
|---|---|---|---|---|
| Explainer | 1 | ~600 words + 1 diagram | Accurate mechanism, plain language, cited | 3–4 h |
| Self-explanation prompts + expert answers | 2 | 80–120 words each | Targets the core of the mechanism | 1 h |
| Dilutions | 4–6 | 50–80 words each | Each one is a real, common failure | 1–2 h |
| Contrasting transcript pairs + annotations | 3 pairs | 150–250 words per transcript | One deliberate difference; realistic talk | 6–9 h |
| Student artefacts | 10–12 | 30–200 words each | Realistic, de-identified, spread across levels | 6–10 h |
| Rubric (4 levels) + anchors | 1 | 1 page | Levels describe the thinking, not the polish | 2–3 h |
| Expert placements + rationales | 10–12 | 30–60 words each | Two independent reviewers | 3–4 h (plus second reviewer) |
| Design briefs | 2 | 60–100 words each | Concrete class, topic and moment | 1 h |
| Annotated exemplars | 6 (3 per brief) | 120–200 words + annotations | Plausible flawed versions, not strawmen | 5–7 h |
| Expert unit plan + annotations | 1 | 1 timeline | Shows fading and check-in clearly | 2–3 h |
| Rehearsal card + placement protocol | 1 each | 1 page each | Usable on a real placement | 2 h |
| Spaced-return items | 4–6 artefacts + 1 pair | as above | New, not reused | 3–4 h |
| **Total per habit** | | | | **~35–50 h**, plus review |

For both habits: **roughly 70–100 hours** of authoring, plus a second reviewer's time for placements, plus
testing. Treat these as first estimates; the first habit will show the real rate.

### 6.1 Sourcing realistic material

- **Constructed composites** for the pilot: realistic transcripts and student work written by you,
  checked by a practising science teacher for authenticity, and flagged in the provenance as composite.
  This avoids consent and privacy work while the format is being tested.
- **Real artefacts** later, if the pilot works: de-identified student work and transcripts from
  placements or partner schools need consent and possibly ethics approval, so check UNE's process before
  collecting.
- **Video** of real classrooms is powerful for modelling but needs licensing or consent. Out of scope
  for the pilot.
- **Culturally responsive practice:** how students show their thinking, and how comfortable they are
  doing it aloud, varies. If cases include Aboriginal and Torres Strait Islander students or draw on
  frameworks such as 8 Ways of Learning, that content needs consultation with Aboriginal and Torres
  Strait Islander educators, not authoring alone.

### 6.2 What AI drafting can and can't do here

Claude can draft transcript pairs, artefacts and exemplars quickly, but realism is the whole point and
AI drafts tend to be tidy and generic. Under the repo's existing rules, any AI-drafted item starts as
`source: ai-generated` and only publishes after your review (`ai-drafted-reviewed`, `reviewedBy` filled).
A sensible split: you write the rubrics, the expert placements and the subtle contrasting pairs; AI
drafts the first versions of artefacts and flawed exemplars for you to rewrite.

## 7. Feedback without a backend

The pilot gives feedback through:

- expert reference points revealed after the player commits an answer (annotations, placements,
  exemplars, an expert unit plan);
- agreement scores against expert placements (Station C);
- rule-based checks on the unit plan (Station E);
- self-assessment against rubric anchors (Station D).

**Not in the pilot: AI feedback on players' writing.** It would need a server, a decision on sending
student text to an AI service, and a check that feedback quality is good enough. If the pilot shows that
exemplar comparison isn't enough for Station D, this is the first thing to add, and it ties into the
access options in `docs/metacognition-coach-access.md` (it needs at least option 4 or 5).

## 8. Content model and validation

The repo's existing patterns apply: content is validated JSON, the source of truth is in the repo, and
one validator joins `npm run validate`.

- **Location:** `games/habit-studio/` (app, module and content), with `content/<habit-id>/*.json`, one
  file per content type, and a schema in `games/_schema/studio.schema.json`.
- **Habits from the framework:** names and phases come from `frameworks/metacognition-nsw-science`,
  as in the Coach.
- **Contexts as vocabulary ids**, rendered with the vocabulary's labels.
- **Provenance on every item:** `source` (`authored`, `ai-generated`, `ai-drafted-reviewed`,
  `composite`), `reviewedBy`, `lastReviewed`, and `version`. Only reviewed items publish; drafts are
  visible through a review copy, as the reckoner does.
- **Validator rules,** beyond structure:
  - every artefact has an expert placement at a valid rubric level, and each level has at least two
    artefacts;
  - "experts split" is set exactly when the two placements differ;
  - each brief has three exemplars, one per quality level;
  - transcript pairs carry annotations that point at real lines;
  - any multiple-choice item has options within 25% of each other in length;
  - only `<b>`, `<i>` and the annotation markup in strings; no NESA outcome wording (outcome codes only).
- **Second reviewer:** placements record who placed them, so agreement between reviewers is visible.

## 9. The app

- **A separate app,** `games/habit-studio/`, linked from the Coach's completion screen for the two pilot
  habits ("Go deeper in the Studio") and from Moodle. It shares the Coach's visual language and
  accessibility bar but not its game mechanics: no XP, no streak. Progress is shown as stations done and
  a judgement-agreement score.
- **Storage:** `localStorage` under its own key (`lxd-studio-v1`), same limits as the Coach. Writing is
  heavier here, so: autosave as the player types, a warning when storage is unavailable, and the
  download export (§5.7) so work is never only in one browser.
- **Recording (Station F):** `MediaRecorder` in memory only, with clear wording that nothing is saved or
  uploaded. Hidden where the browser doesn't support it.
- **Accessibility:** the same measured bar as the Coach (axe with 0 violations, contrast on the rendered
  page, keyboard path, 390 px with no overflow, reduced motion). Sorting in Station C and the timeline in
  Station E must work by keyboard, not only by dragging.
- **No AI, no analytics, no backend** in the pilot.

## 10. Testing the pilot

Practice, not assessment, but the pilot needs evidence that it builds depth.

- **Participants:** 6–10 pre-service teachers, volunteers, ideally EDSE362. If any results are to be
  published, check UNE's human research ethics requirements first. Course-improvement evaluation may
  not need full approval, but confirm.
- **Before and after, on transfer material** (artefacts and a brief not used in the Studio):
  - *Judgement:* place 8 new artefacts; measure agreement with experts.
  - *Design:* write a move for a new brief; two raters score it blind on the rubric.
- **During:** time per station, where people stop, and the change between first and revised drafts.
- **After:** a short interview or think-aloud with 3–4 participants: what felt useful, what felt like
  busywork.
- **Success criteria, to set before the pilot:** for example, agreement with experts improves by at
  least one level-band on average, blind design scores improve, most participants finish all stations,
  and participants rate it as worth the time.

## 11. Milestones

| | What | Who | Done when |
|---|---|---|---|
| M0 | Approve this spec; confirm the names and open decisions (§13) | Steve | Signed off |
| M1 | Schema plus **one sample of each content type** for *Model your thinking* | Claude drafts the schema; Steve writes the samples | Steve is happy with the format before writing at volume |
| M2 | Full *Model your thinking* content, second reviewer's placements | Steve (+ reviewer) | Validator passes; all items reviewed |
| M3 | App build for one habit; local testing to the Coach's bar | Claude Code | All §9 checks measured |
| M4 | Small trial with 2–3 people; fix | Steve | Usability issues fixed |
| M5 | *Evaluate progress* content, including the cross-habit unit task | Steve (+ reviewer) | As M2 |
| M6 | Pilot with 6–10 participants (§10) | Steve | Data collected |
| M7 | Decide: scale to nine habits, revise the format, or stop | Steve | Decision recorded in the action plan |

Building one habit end to end (M1–M4) before writing the second avoids writing 50 hours of content for a
format that doesn't work.

## 12. Fixing the Coach's length cue (separate, small)

Independent of the Studio: rewrite the Coach's wrong options so they match the correct option in length
and quality, using plausible near-misses. That's a content review of 26 questions, a minor version bump
to `content.json`, and the new length-parity rule added to `scripts/validate-coach.js`. Worth doing
before more students use the Coach.

## 13. Decisions for Steve

1. **Name:** "Habit Studio", or something else?
2. **Second reviewer** for expert placements: who? (A practising science teacher or a colleague.)
3. **Composites or real material** for the pilot. Recommendation: composites, flagged as such (§6.1).
4. **Pilot participants and timing:** which cohort and term; and whether ethics approval is needed.
5. **Order:** build *Model your thinking* first (recommended), or both in parallel?
6. **Coach length-cue fix (§12):** now, or with the Studio?

## 14. Out of scope for the pilot

The other seven habits · AI feedback · a backend, accounts or cross-device sync · analytics or a teacher
view · assessment or grades · real classroom video · changes to the Framework Explorer.

## 15. Starting references (verify each before citing in content)

- NSW Department of Education (2020). *Metacognition – a key to unlocking learning.* The nine habits
  and the three phases.
- Education Endowment Foundation (2018, updated 2021). *Metacognition and self-regulated learning:
  guidance report.* Explicit teaching, modelling, and metacognitive talk.
- Collins, Brown & Newman (1989). Cognitive apprenticeship. Modelling, coaching and fading.
- Chi et al. (1989, 1994). Self-explanation.
- White & Frederiksen (1998). Inquiry, modelling and metacognition in science.
- Schwartz & Bransford (1998). "A time for telling": contrasting cases before explanation.
- Sadler (1989) and Hattie & Timperley (2007). Exemplars, criteria and feedback.
- Kalyuga et al. (2003). The expertise reversal effect: when scaffolds should fade.
- Grossman et al. (2009). Representations, decompositions and approximations of practice in teacher
  education; Lampert et al. (2013) on rehearsals.
