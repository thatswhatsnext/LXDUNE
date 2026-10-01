/**
 * NSW Science 7–10 Syllabus (2023) reference data.
 *
 * This is the whitelist every guide and every AI-generated output is validated
 * against. It is read from frameworks/_schema/curriculum.vocab.json, the single
 * source of truth for NSW syllabus references shared with the Framework
 * Explorer. Edit the vocab file, never this one. scripts/test-syllabus.ts pins
 * the values below, so a vocab change that alters them fails `npm test`.
 *
 * The reckoner keeps its own ids: stages as "stage4" (the vocab's "stage-4"
 * without the hyphen), and focus areas by their label ("Disease", not "disease").
 *
 * Outcome statements are deliberately NOT stored. Link to NESA for the
 * official wording, so the whitelist never drifts from the syllabus text.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SYLLABUS = "science-7-10-2023";
const VOCAB_PATH = join(__dirname, "..", "..", "..", "..", "frameworks", "_schema", "curriculum.vocab.json");

type Labelled = { id: string; label: string };
type VocabOutcome = { stage: string; kind: "ws" | "content"; skill?: string; focusArea?: string };
type Vocab = {
  syllabuses: Record<string, { stages: string[]; outcomesUrl?: string }>;
  focusAreas: Record<string, Record<string, Labelled[]>>;
  workingScientificallySkills: Labelled[];
  outcomes: Record<string, Record<string, VocabOutcome | string>>;
};

const vocab = JSON.parse(readFileSync(VOCAB_PATH, "utf8")) as Vocab;
const fail = (msg: string): never => {
  throw new Error(`curriculum.vocab.json: ${msg}`);
};
const toStage = (vocabStage: string) => vocabStage.replace("-", "");

const syllabus = vocab.syllabuses[SYLLABUS] ?? fail(`missing syllabus "${SYLLABUS}"`);

export const STAGES = syllabus.stages.map(toStage) as [string, ...string[]];
export type Stage = (typeof STAGES)[number];

export const FOCUS_AREAS = Object.fromEntries(
  syllabus.stages.map((st) => [toStage(st), (vocab.focusAreas[SYLLABUS]?.[st] ?? fail(`no focus areas for ${st}`)).map((fa) => fa.label)]),
) as Record<Stage, string[]>;

export type FocusArea = string;

export const ALL_FOCUS_AREAS = Object.values(FOCUS_AREAS).flat() as [FocusArea, ...FocusArea[]];

/** Working scientifically skills, in syllabus order (WS-01 … WS-08). */
export const WS_SKILLS = vocab.workingScientificallySkills.map((s) => s.label);

type OutcomeInfo = { stage: Stage; kind: "ws" | "content"; label: string; focusArea?: FocusArea };

const focusLabel = new Map(Object.values(vocab.focusAreas[SYLLABUS]).flat().map((fa) => [fa.id, fa.label]));
const skillLabel = new Map(vocab.workingScientificallySkills.map((s) => [s.id, s.label]));

export const OUTCOMES: Record<string, OutcomeInfo> = Object.fromEntries(
  Object.entries(vocab.outcomes[SYLLABUS] ?? fail(`no outcomes for "${SYLLABUS}"`))
    .filter(([code]) => !code.startsWith("_"))
    .map(([code, o]) => {
      if (typeof o === "string") return fail(`outcome ${code} must be an object`);
      const stage = toStage(o.stage);
      if (!STAGES.includes(stage)) fail(`outcome ${code} has unknown stage "${o.stage}"`);
      if (o.kind === "ws") {
        const skill = skillLabel.get(o.skill ?? "") ?? fail(`outcome ${code} names unknown skill "${o.skill}"`);
        return [code, { stage, kind: "ws", label: `Working scientifically: ${skill}` }];
      }
      const focusArea = focusLabel.get(o.focusArea ?? "") ?? fail(`outcome ${code} names unknown focus area "${o.focusArea}"`);
      return [code, { stage, kind: "content", label: focusArea, focusArea }];
    }),
);

export const OUTCOME_CODES = Object.keys(OUTCOMES) as [string, ...string[]];

export const NESA_OUTCOMES_URL = syllabus.outcomesUrl ?? fail(`syllabus "${SYLLABUS}" has no outcomesUrl`);
