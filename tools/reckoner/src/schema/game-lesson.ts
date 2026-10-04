/**
 * Game lessons: the item bank behind /play/, the Duolingo-style path through the companion guides.
 *
 * One YAML file per lesson in content/game/. A lesson belongs to a path (a guide id, such as 5e)
 * and points at that guide's content by id (phases, look-fors, examples, worked sequences,
 * misapplications) instead of copying it, so a guide edit cannot silently break a lesson:
 * scripts/lib/game.ts checks every reference against the published guide.
 *
 * Same review rule as guides: only a lesson with status published, reviewed provenance and a
 * reviewer reaches students. Drafts appear only in review copies (npm run review:game).
 */
import { z } from "zod";
import { obj, Slug, ShortText, IsoDate, Provenance, ContextTags, OutcomeCode } from "./model-guide";

const Text = z.string().min(1);
const SemVer = z.string().regex(/^\d+\.\d+\.\d+$/, "Use MAJOR.MINOR.PATCH");

/** Mastery levels, after Marzano & Kendall's levels of processing. */
export const MASTERY = ["recognise", "explain", "select", "design"] as const;
export const Mastery = z.enum(MASTERY);

/** The Marzano & Kendall label shown on each item. */
export const Processing = z.enum(["Retrieval", "Comprehension", "Analysis", "Knowledge utilisation", "Metacognition"]);

/**
 * Where in the player's own journey an item sits: a phase id of the path's journey guide (the phase
 * rail at the top of the screen). A 5E lesson runs as a 5E sequence, a POE lesson as a POE. Checked
 * against the guide in scripts/lib/game.ts.
 */
export const JourneyPhase = Slug;

/** References into the path's guide. Every id is checked against the published guide. */
export const GuideRefs = obj({
  phaseIds: z.array(Slug).default([]),
  lookForIds: z.array(Slug).default([]),
  exampleIds: z.array(Slug).default([]),
  sequenceIds: z.array(Slug).default([]),
  misapplicationIds: z.array(Slug).default([]),
});

const Vignette = obj({ who: ShortText, text: Text });
const PlanRow = obj({ phaseId: Slug, text: ShortText });
const Option = obj({ text: Text, fb: Text });

/** Fields every item carries. `tests` names the skill an item counts towards on the results screen. */
const base = {
  id: Slug,
  at: JourneyPhase,
  processing: Processing,
  kind: z.string().min(1).max(40),
  tests: z.string().regex(/^[a-z0-9-]+$/).optional(),
  title: Text.optional(),
  vignette: Vignette.optional(),
  plan: z.array(PlanRow).min(2).optional(),
  q: Text.optional(),
  hint: ShortText.optional(),
  why: Text.optional(),
  refs: GuideRefs.optional(),
};

/** A replay variant: same judgement, different case. Replaces only the fields it names. */
const variantOf = <T extends z.ZodRawShape>(shape: T) => z.array(obj(shape).partial()).default([]);

const predictShape = {
  title: Text,
  q: Text,
  options: z.array(obj({ text: Text })).min(2).max(5),
  answer: z.number().int().min(0),
  reveal: Text,
};
const Predict = obj({ ...base, type: z.literal("predict"), ...predictShape });

const choiceShape = { options: z.array(Option).min(2).max(5), answer: z.number().int().min(0) };
const Choice = obj({ ...base, type: z.literal("choice"), ...choiceShape, variants: variantOf({ ...base, ...choiceShape }) });

/** Spot the phase: the options are the guide's phases; feedback per phase. */
/**
 * Spot the phase. Options are the journey guide's phases, or only those named in `among` (2–5), so a
 * model with many stages doesn't put eight buttons on a phone. fb covers every option offered.
 */
const spotShape = { vignette: Vignette, answer: Slug, among: z.array(Slug).min(2).max(5).optional(), fb: z.record(Slug, Text) };
const Spot = obj({ ...base, type: z.literal("spot"), ...spotShape, variants: variantOf({ ...base, ...spotShape }) });

/** Select all that apply. */
const multiShape = { options: z.array(obj({ text: Text, ok: z.boolean(), fb: Text })).min(3).max(6) };
const Multi = obj({ ...base, type: z.literal("multi"), ...multiShape });

/** Put activities in phase order. */
const orderShape = { title: Text, steps: z.array(obj({ text: ShortText, phaseId: Slug })).min(3).max(7) };
const Order = obj({ ...base, type: z.literal("order"), ...orderShape, variants: variantOf({ ...base, ...orderShape }) });

/**
 * Match a classroom moment to the guide look-for it shows. Options are look-for questions read from
 * the guide; `strong` says whether the vignette is strong or weak evidence for the answer.
 */
const lookForShape = { vignette: Vignette, answer: Slug, distractors: z.array(Slug).min(1).max(4), strong: z.boolean() };
const LookFor = obj({ ...base, type: z.literal("lookfor"), ...lookForShape, variants: variantOf({ ...base, ...lookForShape }) });

/**
 * Diagnose a flawed plan: options are misapplications read from the guide (name, why it
 * undermines the model, the fix), so the game teaches the guide's own diagnosis.
 */
const diagnoseShape = { answer: Slug, distractors: z.array(Slug).min(1).max(4) };
const Diagnose = obj({ ...base, type: z.literal("diagnose"), ...diagnoseShape, variants: variantOf({ ...base, ...diagnoseShape }) });

/**
 * A class profile in the reckoner's own terms: dimension id -> option value (an array for the
 * multi-select dimensions, purpose and ws). Values are checked against content/questions.json.
 */
const Profile = z.record(z.string(), z.union([z.string(), z.array(z.string()).min(1)]));
/** A candidate: a model id, or "host+nested" for a model run inside another (e.g. 5e+poe). */
const Candidate = z.string().regex(/^[a-z0-9-]+(\+[a-z0-9-]+)?$/);

/**
 * Choose the model for a class, then justify it. The reckoner is the answer key: the build scores
 * the profile with the reckoner's own fit() and refuses an authored answer that disagrees. Each
 * reason names the dimension it rests on (null = a preference, never a fit reason); `ok` must match
 * whether that dimension really favours the answer.
 */
const Select = obj({
  ...base,
  type: z.literal("select"),
  scenario: Vignette,
  profile: Profile,
  candidates: z.array(Candidate).min(2).max(4),
  answer: Candidate,
  reasons: z.array(obj({ text: Text, dim: z.string().nullable(), ok: z.boolean() })).min(3).max(6),
});

/** Which single change to the class flips the reckoner's choice? Checked by re-scoring each change. */
const Flip = obj({
  ...base,
  type: z.literal("flip"),
  scenario: Vignette,
  profile: Profile,
  candidates: z.array(Slug).min(2).max(4),
  changes: z.array(obj({ dim: z.string(), value: z.union([z.string(), z.array(z.string()).min(1)]) })).min(3).max(5),
  answer: z.number().int().min(0),
});

/** Where does this model sit inside a host model? Options are the host guide's phases; checked against the guides' nesting records. */
const Nest = obj({ ...base, type: z.literal("nest"), model: Slug, host: Slug, answer: Slug });

/**
 * Build a plan: place activity and check cards into the guide's phases, then get a feature report
 * keyed to the guide's look-fors and misapplications (not a score). A card counts towards its
 * look-fors only in the phase whose job it does (`does`); a card with `flaws` raises those
 * misapplications wherever it goes. `missing` names the misapplication an empty phase raises.
 * `formative` asks for check cards in at least `minPhases` phases. The build refuses a board that
 * can't produce a clean report.
 */
const Build = obj({
  ...base,
  type: z.literal("build"),
  brief: Vignette,
  cards: z.array(obj({
    id: Slug,
    text: Text,
    kind: z.enum(["activity", "check"]).default("activity"),
    does: Slug.optional(),
    features: z.array(Slug).default([]),
    flaws: z.array(Slug).default([]),
  })).min(6).max(18),
  report: z.array(Slug).min(3),
  missing: z.record(Slug, Slug).default({}),
  formative: obj({ lookFor: Slug, flag: Slug, minPhases: z.number().int().min(2) }).optional(),
});

/**
 * Prac Day: a branching classroom simulation. Each node is a moment in a worked sequence's lessons;
 * students voice the sequence's target conceptions (by index into targetConceptions); each choice
 * carries the class's thinking forward (surface, hide, challenge) and leads to the next node, or to
 * "end". The ending shown is the one with the highest minGood the run reached, so it always matches
 * how many strong moves the player made. The build refuses unreachable nodes, cycles and dead ends.
 */
const Said = obj({ who: ShortText, text: Text, conception: z.number().int().min(0) });
const SimChoice = obj({
  text: Text,
  next: z.union([Slug, z.literal("end")]),
  good: z.boolean(),
  lookFor: Slug.optional(),
  debrief: Text,
  surface: z.array(z.number().int().min(0)).default([]),
  hide: z.array(z.number().int().min(0)).default([]),
  challenge: z.array(z.number().int().min(0)).default([]),
});
const SimNode = obj({
  id: Slug,
  phase: Slug,
  when: ShortText,
  situation: Text,
  said: Said.optional(),
  choices: z.array(SimChoice).min(2).max(3),
});
const Sim = obj({
  ...base,
  type: z.literal("sim"),
  cast: Vignette,
  sequenceId: Slug,
  start: Slug,
  nodes: z.array(SimNode).min(3).max(20),
  endings: z.array(obj({ minGood: z.number().int().min(0), title: ShortText, text: Text })).min(2).max(4),
});

/** A teaching card: the model named and connected. Unscored. */
const Concept = obj({
  ...base,
  type: z.literal("concept"),
  title: Text,
  lead: Text,
  rows: z.array(obj({ phaseId: Slug, does: ShortText, move: ShortText })).min(2),
  cite: Text.optional(),
});

/** Look back: recalls the lesson's prediction, asks for a written move, shows a model answer. Unscored. */
const Reflect = obj({ ...base, type: z.literal("reflect"), title: Text, q: Text, model: Text, recall: Slug.optional() });

export const GameItem = z.discriminatedUnion("type", [Predict, Choice, Spot, Multi, Order, LookFor, Diagnose, Select, Flip, Nest, Build, Sim, Concept, Reflect]);
export type GameItem = z.infer<typeof GameItem>;

export const GameLesson = obj({
  schemaVersion: z.literal(1),
  id: Slug,
  /** The guide this lesson teaches; also the path it sits on. */
  path: Slug,
  order: z.number().int().positive(),
  title: z.string().min(1).max(60),
  summary: ShortText,
  level: Mastery,
  version: SemVer,
  status: z.enum(["draft", "in-review", "published"]),
  lastReviewed: IsoDate,
  provenance: Provenance,
  context: ContextTags,
  outcomes: z.array(OutcomeCode).default([]),
  /** What in the guide the lesson is built on. */
  builtOn: GuideRefs,
  /** Guide section the end screen links to, as in the reckoner's #/guide/<id>/<section>. */
  guideSection: z.enum(["purpose", "theory", "model", "phases", "sequences", "misapplications", "checklist", "alignment", "reflection", "references"]).optional(),
  /**
   * This lesson also waits for each named path to reach a level, on top of its path's own unlock and
   * the lesson before it. Lets a path gain a lesson that needs a newer path without re-locking the rest.
   */
  requires: z.array(obj({ path: Slug, level: Mastery })).default([]),
  items: z.array(GameItem).min(4),
}).superRefine((l, ctx) => {
  const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
  const ids = new Set<string>();
  l.items.forEach((it, i) => {
    if (ids.has(it.id)) issue(["items", i, "id"], `Duplicate item id "${it.id}"`);
    ids.add(it.id);
    const inRange = (opts: unknown[] | undefined, a: number | undefined, at: (string | number)[]) =>
      opts && a !== undefined && a >= opts.length && issue(at, `answer ${a} is past the last option (${opts.length - 1})`);
    if (it.type === "predict") inRange(it.options, it.answer, ["items", i, "answer"]);
    if (it.type === "choice") {
      inRange(it.options, it.answer, ["items", i, "answer"]);
      it.variants.forEach((v, j) => inRange(v.options ?? it.options, v.answer ?? it.answer, ["items", i, "variants", j, "answer"]));
    }
    if (it.type === "multi" && !it.options.some((o) => o.ok)) issue(["items", i, "options"], "At least one option must be correct");
    if (it.type === "reflect" && it.recall && !l.items.some((x) => x.id === it.recall && x.type === "predict"))
      issue(["items", i, "recall"], `recall "${it.recall}" is not a predict item in this lesson`);
    if ((it.type === "lookfor" || it.type === "diagnose") && it.distractors.includes(it.answer)) issue(["items", i, "distractors"], "The answer cannot also be a distractor");
    if (it.type === "select" && !it.candidates.includes(it.answer)) issue(["items", i, "answer"], "The answer must be one of the candidates");
    if (it.type === "flip" && it.answer >= it.changes.length) issue(["items", i, "answer"], "answer is past the last change");
    if (it.type === "diagnose" && !it.vignette && !it.plan) issue(["items", i], "A diagnose item needs a vignette or a plan to diagnose");
    if (it.type === "spot") [it, ...it.variants].forEach((v, j) => {
      const among = v.among ?? it.among, answer = v.answer ?? it.answer;
      if (among && !among.includes(answer)) issue(["items", i, ...(j ? ["variants", j - 1] : []), "answer"], `answer "${answer}" is not one of among`);
    });
  });
  if (!l.items.some((it) => !["concept", "reflect", "predict"].includes(it.type))) issue(["items"], "A lesson needs at least one scored item");
  if (l.status === "published" && (l.provenance.source === "ai-generated" || l.provenance.reviewedBy.length === 0))
    issue(["status"], "A published lesson must be reviewed: provenance.source ai-drafted-reviewed or authored, with reviewedBy filled in");
});
export type GameLesson = z.infer<typeof GameLesson>;

/** content/game/game.yaml: settings for the whole game. */
export const GameConfig = obj({
  schemaVersion: z.literal(1),
  /** Paths in the order they appear on the map. Each is a guide id. */
  paths: z.array(obj({
    id: Slug,
    title: z.string().min(1).max(40),
    blurb: ShortText,
    /** guide: a path through one guide (id = guide id). select: choosing between models. */
    kind: z.enum(["guide", "select"]).default("guide"),
    /** Guide whose phases make the lesson rail. Defaults to the path's own guide. */
    journey: Slug.optional(),
    /** select paths: the models being chosen between. */
    models: z.array(Slug).default([]),
    /** The path unlocks once each named path reaches this mastery level. */
    requires: z.array(obj({ path: Slug, level: Mastery })).default([]),
    /** What the lesson rail shows: one cell per phase, or one per phase group (journey guide's phaseGroups). */
    rail: z.enum(["phases", "groups"]).default("phases"),
  })).min(1),
  feedback: obj({
    /** Google Form link; "placeholder" shows an inactive button; omit to hide feedback. */
    url: z.union([z.string().url(), z.literal("placeholder")]).optional(),
    /** Entry id of the form's game-summary question, e.g. entry.123456789. */
    summaryEntry: z.string().regex(/^entry\.\d+$/).optional(),
  }),
  notice: Text,
});
export type GameConfig = z.infer<typeof GameConfig>;
