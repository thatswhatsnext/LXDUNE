/**
 * Model Companion Guide schema
 * ---------------------------------------------------------------------------
 * One guide per constructivist teaching model. The same file feeds:
 *   - the reckoner (front matter: scale, fit profile, short descriptions)
 *   - the guide pages and A4 export (all sections)
 *   - the interactive checklist and program auditor (look-fors, checklist)
 *   - the AI layer (only what `scaffold` permits, grounded in this content)
 *
 * Design stance: the product is a LEARNING SCAFFOLD for pre-service teachers.
 * Fields in the `scaffold` block govern what learners must attempt before
 * content is revealed, and what AI may and may not produce.
 *
 * Text fields marked Markdown accept CommonMark (no raw HTML).
 */
import { z } from "zod";
import { ALL_FOCUS_AREAS, OUTCOMES, OUTCOME_CODES, STAGES } from "./syllabus";
import { FIT_DIMENSIONS, FIT_DIMENSION_KEYS, type FitDimension } from "./fit-dimensions";

/** Strict object: unknown keys are errors, so authoring typos are never silently dropped. */
const obj = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict();

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

const Slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lower-case kebab-case ids");
const Markdown = z.string().min(1);
const ShortText = z.string().min(1).max(280);
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const Stage = z.enum(STAGES);
export const FocusArea = z.enum(ALL_FOCUS_AREAS);
export const OutcomeCode = z.enum(OUTCOME_CODES);
export const Discipline = z.enum(["biology", "chemistry", "physics", "earth-environmental", "integrated"]);
export const Scale = z.enum(["macro", "meso", "micro", "dial"]);
export const EvidenceStrength = z.enum(["strong", "moderate", "emerging", "framework"]);

/** Where a piece of content came from. Everything learners see carries one. */
export const Provenance = obj({
  source: z.enum(["authored", "ai-drafted-reviewed", "ai-generated"]),
  authors: z.array(z.string()).default([]),
  reviewedBy: z.array(z.string()).default([]),
  reviewedOn: IsoDate.optional(),
});

/** Tags that let the reckoner match content to a user's context. */
export const ContextTags = obj({
  stages: z.array(Stage).min(1),
  focusAreas: z.array(FocusArea).default([]),
  disciplines: z.array(Discipline).default([]),
});

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

/**
 * A look-for is the atomic unit of quality judgement. Checklist items,
 * examples, misapplications and the AI auditor all point at look-for ids.
 */
export const LookFor = obj({
  id: Slug,
  question: ShortText, // "Does the explanation refer back to the class's own data?"
  strongEvidence: ShortText, // what a strong design shows
  weakEvidence: ShortText, // what a weak design shows
});

export const Example = obj({
  id: Slug,
  kind: z.enum(["positive", "negative"]),
  title: ShortText,
  context: ContextTags,
  outcomes: z.array(OutcomeCode).default([]),
  body: Markdown, // what happens
  diagnosis: Markdown, // why it works or fails, in terms of the look-fors
  lookForIds: z.array(Slug).min(1),
  provenance: Provenance,
});

export const Phase = obj({
  id: Slug,
  name: z.string().min(1),
  order: z.number().int().positive(),
  /** Optional stage group, for models with many fine-grained phases (see phaseGroups). */
  group: Slug.optional(),
  job: ShortText, // one-line purpose of the phase
  essentialFeatures: z.array(ShortText).min(2),
  teacherMoves: z.array(ShortText).min(1),
  learnerMoves: z.array(ShortText).min(1),
  typicalShare: z
    .object({ minPercent: z.number().min(0).max(100), maxPercent: z.number().min(0).max(100) })
    .refine((s) => s.minPercent <= s.maxPercent, "minPercent must not exceed maxPercent")
    .optional(),
  formativeChecks: z.array(ShortText).default([]),
  lookFors: z.array(LookFor).min(1),
  /**
   * Worked examples. Without phaseGroups, every phase needs a positive and a negative
   * example. With phaseGroups, the pair is required once per group, so an eight-stage
   * routine is not forced to carry sixteen examples. Enforced in superRefine below.
   */
  examples: z.array(Example).default([]),
});

/** Stage groups for models with many phases, e.g. ADI's investigate / argue / write and review. */
export const PhaseGroup = obj({ id: Slug, name: z.string().min(1), summary: ShortText });

/** A slot the learner must complete when the sequence is used as a task. */
export const ScaffoldSlot = obj({
  field: z.enum(["activity", "wsOutcomes", "formativeCheck", "phaseId"]),
  prompt: ShortText, // what the tool asks the learner
});

const Range = z.string().regex(/^\d+(–\d+)?$/, 'Use "3" or "2–3" (en dash)');

/**
 * A step is timed in lessons (unit and routine models) or minutes (single-lesson
 * models). Exactly one is required; the guide's scale decides which (see below).
 */
export const SequenceStep = obj({
  lessons: Range.optional(),
  minutes: Range.optional(),
  phaseId: Slug,
  activity: Markdown,
  wsOutcomes: z.array(OutcomeCode).default([]),
  formativeCheck: ShortText,
  scaffoldSlots: z.array(ScaffoldSlot).default([]),
}).refine((st) => (st.lessons === undefined) !== (st.minutes === undefined), {
  message: "Give either lessons or minutes, not both or neither",
});

export const WorkedSequence = obj({
  id: Slug,
  title: ShortText,
  context: ContextTags,
  contentOutcomes: z.array(OutcomeCode).min(1),
  bigQuestion: ShortText,
  learningIntentions: z.array(ShortText).min(1),
  targetConceptions: z.array(ShortText).default([]),
  steps: z.array(SequenceStep).min(2),
  whyItWorks: z.array(ShortText).min(1),
  watchFor: Markdown.optional(),
  safetyNotes: Markdown.optional(),
  /** Asked BEFORE whyItWorks is revealed in tutor mode (predict-then-reveal). */
  predictPrompt: ShortText,
  provenance: Provenance,
});

export const Misapplication = obj({
  id: Slug,
  name: ShortText,
  looksLike: ShortText,
  whyItUndermines: ShortText,
  fix: ShortText,
  lookForIds: z.array(Slug).min(1),
});

export const ChecklistGroup = obj({
  id: Slug,
  title: z.string().min(1),
  phaseId: Slug.optional(), // omit for whole-sequence or inclusion groups
  items: z.array(obj({ id: Slug, text: ShortText, lookForId: Slug.optional() })).min(1),
});

export const TheoryFoundation = obj({
  tradition: z.string().min(1), // "Piaget: disequilibrium"
  idea: Markdown,
  designImplication: Markdown, // what it means for how the model is built
  referenceIds: z.array(Slug).default([]),
});

export const Critique = obj({
  claim: Markdown,
  response: Markdown,
  referenceIds: z.array(Slug).min(1),
});

export const ReflectionPrompt = obj({
  id: Slug,
  type: z.enum(["personal", "critical", "application"]),
  prompt: Markdown,
  /** Follow-ups the reflection coach may ask. The coach never answers the prompt. */
  coachFollowUps: z.array(ShortText).default([]),
});

export const Reference = obj({
  id: Slug,
  citation: z.string().min(1), // APA 7
  url: z.string().url().optional(),
  doi: z.string().optional(),
});

/**
 * How a guidance-dial model turns reckoner answers into a recommended level.
 * Only dial models carry this. Each factor names a reckoner dimension, scores its
 * options, and must state the rationale and the evidence behind it, so the
 * recommendation the app shows students can be traced to literature.
 */
export const DialFactor = obj({
  dimension: z.enum(FIT_DIMENSION_KEYS as [FitDimension, ...FitDimension[]]),
  points: z.record(z.number().int().min(0).max(3)),
  rationale: Markdown,
  evidenceStrength: EvidenceStrength,
  referenceIds: z.array(Slug),
});

export const DialHeuristic = obj({
  summary: Markdown,
  /** What the heuristic does NOT do, shown with the recommendation. */
  caveat: ShortText,
  factors: z.array(DialFactor).min(1),
  /** Ascending point ceilings mapped to phases (levels). */
  thresholds: z.array(obj({ maxPoints: z.number().int().min(0), phaseId: Slug })).min(2),
  /** Hard ceilings, e.g. novice learners are never recommended above structured. */
  caps: z
    .array(obj({ dimension: z.enum(FIT_DIMENSION_KEYS as [FitDimension, ...FitDimension[]]), option: z.string(), maxPhaseId: Slug, rationale: ShortText }))
    .default([]),
});

/* ------------------------------------------------------------------ */
/* Scaffold and AI policy                                              */
/* ------------------------------------------------------------------ */

/** Guide sections the AI layer can be pointed at. */
export const AiSection = z.enum([
  "phases.examples",
  "workedSequences",
  "misapplications",
  "checklist",
  "reflectionPrompts",
]);

export const AiCapability = z.enum([
  "contextualise-examples", // restate authored examples for another stage or focus area
  "audit-program", // feedback against look-fors; questions, never rewrites
  "draft-skeleton", // partial sequence, with scaffold slots left empty
  "coach-reflection", // Socratic follow-ups only
  "compare-models",
]);

export const Scaffold = obj({
  /** Tutor mode is the default for learners; practitioner mode unlocks later. */
  defaultMode: z.literal("tutor"),
  /** Content hidden until the learner makes an attempt (ids of worked sequences, misapplications). */
  revealAfterAttempt: z.array(Slug).default([]),
  ai: obj({
    groundedIn: z.array(AiSection).min(1),
    allowed: z.array(AiCapability),
    /** Hard limits, shown to reviewers and injected into every AI call. */
    never: z.array(ShortText).min(1),
    /** Look-fors the auditor prioritises for this model. */
    auditorFocus: z.array(Slug).default([]),
  }),
});

/* ------------------------------------------------------------------ */
/* Reckoner front matter                                               */
/* ------------------------------------------------------------------ */

const fitProfileShape = Object.fromEntries(
  FIT_DIMENSION_KEYS.map((k) => [
    k,
    z
      .array(z.number().int().min(0).max(3))
      .length(FIT_DIMENSIONS[k].length, `${k} needs ${FIT_DIMENSIONS[k].length} scores`),
  ]),
) as { [K in keyof typeof FIT_DIMENSIONS]: z.ZodArray<z.ZodNumber> };

export const Reckoner = obj({
  scale: Scale,
  /** Null for guidance-dial models that the reckoner does not rank. */
  fitProfile: obj(fitProfileShape).nullable(),
  distinguishingFeature: ShortText,
  bestScienceFit: ShortText,
  commonPitfall: ShortText,
  evidenceSummary: ShortText,
  evidenceStrength: EvidenceStrength,
  evidenceReferenceIds: z.array(Slug).min(1),
  theoryTags: z.array(z.string()).min(1),
  /** Dial models only: how reckoner answers map to a recommended level. */
  dialHeuristic: DialHeuristic.optional(),
});

/* ------------------------------------------------------------------ */
/* The guide                                                           */
/* ------------------------------------------------------------------ */

export const ModelGuide = z
  .object({
    schemaVersion: z.literal("1.3"),
    id: Slug,
    name: z.string().min(1),
    originators: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, "Use semver, e.g. 1.0.0"),
    status: z.enum(["draft", "in-review", "published"]),
    lastReviewed: IsoDate,
    syllabus: z.literal("NSW Science 7–10 Syllabus (2023)"),
    provenance: Provenance,

    reckoner: Reckoner,

    introduction: obj({
      lead: ShortText, // first sentence of the guide
      purposeStatement: Markdown,
      audience: ShortText,
      howToUse: Markdown,
    }),

    theory: obj({
      summary: Markdown,
      foundations: z.array(TheoryFoundation).min(1),
      critiques: z.array(Critique).default([]),
    }),

    roles: obj({ teacher: Markdown, learner: Markdown }),

    sequence: obj({
      shape: z.enum(["linear", "cyclical", "iterative", "dial"]),
      summary: Markdown,
      // Kept for document exports only: the app draws its flow diagram from `phases`.
      diagramMermaid: z.string().optional(),
      scaleNote: Markdown, // e.g. "a 5E sequence spans 4–12 lessons, not one lesson"
    }),

    phaseGroups: z.array(PhaseGroup).default([]),
    phases: z.array(Phase).min(1),
    workedSequences: z.array(WorkedSequence).min(1),
    misapplications: z.array(Misapplication).min(1),
    checklist: z.array(ChecklistGroup).min(1),

    syllabusAlignment: obj({
      wsMapping: z
        .array(
          obj({
            skill: z.number().int().min(1).max(8),
            phaseIds: z.array(Slug), // empty = this model does not build the skill
            note: ShortText.optional(), // required when phaseIds is empty
          }).refine((m) => m.phaseIds.length > 0 || m.note, {
            message: "A skill the model does not build needs a note saying how to address it",
          }),
        )
        .length(8, "Map all eight Working scientifically skills"),
      depthStudies: Markdown,
      dataScience: Markdown.optional(),
      inclusion: obj({
        eald: Markdown,
        disability: Markdown,
        highPotential: Markdown,
        aboriginalPerspectives: Markdown,
      }),
    }),

    nesting: z
      .array(
        obj({
          modelId: Slug,
          /**
           * hosts:    the other model sits inside THIS guide, at this guide's phaseId
           * nests-in: THIS model sits inside the other model, at the other guide's phaseId
           */
          role: z.enum(["hosts", "nests-in"]).default("hosts"),
          phaseId: Slug.optional(),
          how: ShortText,
        }),
      )
      .default([]),

    reflectionPrompts: z
      .array(ReflectionPrompt)
      .refine(
        (ps) => ["personal", "critical", "application"].every((t) => ps.some((p) => p.type === t)),
        "Include at least one personal, one critical and one application prompt",
      ),

    scaffold: Scaffold,
    references: z.array(Reference).min(1),
  })
  .superRefine((g, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

    const phaseIds = new Set(g.phases.map((p) => p.id));
    const lookForIds = new Set(g.phases.flatMap((p) => p.lookFors.map((l) => l.id)));
    const refIds = new Set(g.references.map((r) => r.id));
    const revealable = new Set([...g.workedSequences.map((s) => s.id), ...g.misapplications.map((m) => m.id)]);

    // Unique ids across the guide
    const all: string[] = [
      ...g.phases.map((p) => p.id),
      ...[...lookForIds],
      ...g.phases.flatMap((p) => p.examples.map((e) => e.id)),
      ...g.workedSequences.map((s) => s.id),
      ...g.misapplications.map((m) => m.id),
      ...g.checklist.flatMap((c) => [c.id, ...c.items.map((i) => i.id)]),
      ...g.reflectionPrompts.map((r) => r.id),
      ...g.references.map((r) => r.id),
    ];
    const seen = new Set<string>();
    all.forEach((id) => (seen.has(id) ? issue(["id"], `Duplicate id "${id}"`) : seen.add(id)));

    // Phase order is 1..n
    g.phases
      .map((p) => p.order)
      .sort((a, b) => a - b)
      .forEach((o, i) => o !== i + 1 && issue(["phases"], `Phase order should run 1..${g.phases.length}`));

    // Look-for references resolve
    const checkLookFors = (ids: string[], path: (string | number)[]) =>
      ids.forEach((id) => !lookForIds.has(id) && issue(path, `Unknown look-for "${id}"`));
    g.phases.forEach((p, i) => p.examples.forEach((e, j) => checkLookFors(e.lookForIds, ["phases", i, "examples", j])));
    g.misapplications.forEach((m, i) => checkLookFors(m.lookForIds, ["misapplications", i]));
    g.checklist.forEach((c, i) =>
      c.items.forEach((it, j) => it.lookForId && checkLookFors([it.lookForId], ["checklist", i, "items", j])),
    );
    checkLookFors(g.scaffold.ai.auditorFocus, ["scaffold", "ai", "auditorFocus"]);

    // Phase references resolve
    const checkPhase = (id: string | undefined, path: (string | number)[]) =>
      id && !phaseIds.has(id) && issue(path, `Unknown phase "${id}"`);
    g.workedSequences.forEach((s, i) => s.steps.forEach((st, j) => checkPhase(st.phaseId, ["workedSequences", i, "steps", j])));
    g.checklist.forEach((c, i) => checkPhase(c.phaseId, ["checklist", i]));
    g.syllabusAlignment.wsMapping.forEach((m, i) => m.phaseIds.forEach((p) => checkPhase(p, ["syllabusAlignment", "wsMapping", i])));

    // Every worked sequence visits every phase at least once
    g.workedSequences.forEach((s, i) => {
      const used = new Set(s.steps.map((st) => st.phaseId));
      phaseIds.forEach((p) => !used.has(p) && issue(["workedSequences", i], `Sequence never uses phase "${p}"`));
    });

    // Outcome codes match the stage of their context
    const checkStage = (codes: string[], stages: string[], path: (string | number)[]) =>
      codes.forEach((c) => !stages.includes(OUTCOMES[c].stage) && issue(path, `${c} does not match stages ${stages.join(", ")}`));
    g.phases.forEach((p, i) => p.examples.forEach((e, j) => checkStage(e.outcomes, e.context.stages, ["phases", i, "examples", j])));
    g.workedSequences.forEach((s, i) => {
      checkStage(s.contentOutcomes, s.context.stages, ["workedSequences", i, "contentOutcomes"]);
      s.steps.forEach((st, j) => checkStage(st.wsOutcomes, s.context.stages, ["workedSequences", i, "steps", j]));
    });

    // Reference ids resolve
    const checkRefs = (ids: string[], path: (string | number)[]) =>
      ids.forEach((id) => !refIds.has(id) && issue(path, `Unknown reference "${id}"`));
    checkRefs(g.reckoner.evidenceReferenceIds, ["reckoner", "evidenceReferenceIds"]);
    g.theory.foundations.forEach((f, i) => checkRefs(f.referenceIds, ["theory", "foundations", i]));
    g.theory.critiques.forEach((c, i) => checkRefs(c.referenceIds, ["theory", "critiques", i]));

    // Worked example coverage: per phase, or per stage group when groups are used
    const kinds = (ps: typeof g.phases) => new Set(ps.flatMap((p) => p.examples.map((e) => e.kind)));
    if (g.phaseGroups.length) {
      const groupIds = new Set(g.phaseGroups.map((gr) => gr.id));
      g.phases.forEach((p, i) => {
        if (!p.group) issue(["phases", i], "Every phase needs a group when phaseGroups are used");
        else if (!groupIds.has(p.group)) issue(["phases", i], `Unknown phase group "${p.group}"`);
      });
      g.phaseGroups.forEach((gr, i) => {
        const members = g.phases.filter((p) => p.group === gr.id);
        if (!members.length) return issue(["phaseGroups", i], `No phases in group "${gr.id}"`);
        const k = kinds(members);
        if (!k.has("positive")) issue(["phaseGroups", i], `Group "${gr.id}" needs at least one positive example`);
        if (!k.has("negative")) issue(["phaseGroups", i], `Group "${gr.id}" needs at least one negative example`);
      });
    } else {
      g.phases.forEach((p, i) => {
        const k = kinds([p]);
        if (!k.has("positive")) issue(["phases", i, "examples"], "Each phase needs at least one positive example");
        if (!k.has("negative")) issue(["phases", i, "examples"], "Each phase needs at least one negative example");
      });
    }

    // Timing unit matches the model's scale, and is consistent within a sequence
    g.workedSequences.forEach((s, i) => {
      const units = new Set(s.steps.map((st) => (st.minutes !== undefined ? "minutes" : "lessons")));
      if (units.size > 1) issue(["workedSequences", i], "Use one timing unit (lessons or minutes) throughout a sequence");
      if (g.reckoner.scale === "micro" && units.has("lessons"))
        issue(["workedSequences", i], "Single-lesson (micro) models time steps in minutes");
      if (g.reckoner.scale === "macro" && units.has("minutes"))
        issue(["workedSequences", i], "Unit (macro) models time steps in lessons");
    });

    // A model that hosts another must name one of its own phases
    g.nesting.forEach((n, i) => {
      if (n.role === "hosts") checkPhase(n.phaseId, ["nesting", i]);
      if (n.modelId === g.id) issue(["nesting", i], "A model cannot nest itself");
    });

    // Reveal-after-attempt targets exist
    g.scaffold.revealAfterAttempt.forEach(
      (id) => !revealable.has(id) && issue(["scaffold", "revealAfterAttempt"], `Unknown revealable id "${id}"`),
    );

    // Published guides must be fully human-reviewed
    if (g.status === "published") {
      const unreviewed = [
        ...g.phases.flatMap((p) => p.examples.map((e) => [e.id, e.provenance] as const)),
        ...g.workedSequences.map((s) => [s.id, s.provenance] as const),
      ].filter(([, pv]) => pv.source === "ai-generated" || pv.reviewedBy.length === 0);
      unreviewed.forEach(([id]) => issue(["status"], `Published guide contains unreviewed content "${id}"`));
    }

    // Dial heuristic: only on dial models, and every reference must resolve
    const dh = g.reckoner.dialHeuristic;
    if (dh && g.reckoner.scale !== "dial")
      issue(["reckoner", "dialHeuristic"], "Only guidance-dial models carry a dial heuristic");
    if (dh) {
      dh.factors.forEach((f, i) => {
        const opts = FIT_DIMENSIONS[f.dimension] as readonly string[];
        Object.keys(f.points).forEach(
          (o) => !opts.includes(o) && issue(["reckoner", "dialHeuristic", "factors", i], `"${o}" is not an option of ${f.dimension}`),
        );
        opts.forEach(
          (o) => !(o in f.points) && issue(["reckoner", "dialHeuristic", "factors", i], `${f.dimension} option "${o}" has no score`),
        );
        checkRefs(f.referenceIds, ["reckoner", "dialHeuristic", "factors", i]);
        if (f.evidenceStrength !== "framework" && !f.referenceIds.length)
          issue(["reckoner", "dialHeuristic", "factors", i], "A factor claiming evidence must cite at least one reference");
      });
      dh.thresholds.forEach((t, i) => {
        checkPhase(t.phaseId, ["reckoner", "dialHeuristic", "thresholds", i]);
        if (i && t.maxPoints <= dh.thresholds[i - 1].maxPoints)
          issue(["reckoner", "dialHeuristic", "thresholds", i], "Thresholds must ascend");
      });
      const maxTotal = dh.factors.reduce((n, f) => n + Math.max(...Object.values(f.points)), 0);
      if (dh.thresholds[dh.thresholds.length - 1].maxPoints < maxTotal)
        issue(["reckoner", "dialHeuristic", "thresholds"], `Top threshold must cover the maximum total of ${maxTotal}`);
      dh.caps.forEach((c, i) => {
        checkPhase(c.maxPhaseId, ["reckoner", "dialHeuristic", "caps", i]);
        const opts = FIT_DIMENSIONS[c.dimension] as readonly string[];
        if (!opts.includes(c.option)) issue(["reckoner", "dialHeuristic", "caps", i], `"${c.option}" is not an option of ${c.dimension}`);
      });
    }

    // Scale and fit profile agree
    if ((g.reckoner.scale === "dial") !== (g.reckoner.fitProfile === null))
      issue(["reckoner", "fitProfile"], "Only guidance-dial models may omit a fit profile");
  });

export type ModelGuide = z.infer<typeof ModelGuide>;
