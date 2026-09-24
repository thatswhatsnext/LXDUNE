/**
 * NSW Science 7–10 Syllabus (2023) reference data.
 *
 * This is the whitelist every guide and every AI-generated output is validated
 * against. Codes and focus areas are taken from the NESA syllabus site:
 * https://curriculum.nsw.edu.au/learning-areas/science/science-7-10-2023/outcomes
 *
 * Outcome statements are deliberately NOT stored here. Link to NESA for the
 * official wording, so this file never drifts from the syllabus text.
 */

export const STAGES = ["stage4", "stage5"] as const;
export type Stage = (typeof STAGES)[number];

export const FOCUS_AREAS = {
  stage4: [
    "Observing the Universe",
    "Forces",
    "Cells and classification",
    "Solutions and mixtures",
    "Living systems",
    "Periodic table and atomic structure",
    "Change",
    "Data science 1",
  ],
  stage5: [
    "Energy",
    "Disease",
    "Materials",
    "Environmental sustainability",
    "Genetics and evolutionary change",
    "Reactions",
    "Waves and motion",
    "Data science 2",
  ],
} as const;

export type FocusArea =
  | (typeof FOCUS_AREAS.stage4)[number]
  | (typeof FOCUS_AREAS.stage5)[number];

export const ALL_FOCUS_AREAS = [
  ...FOCUS_AREAS.stage4,
  ...FOCUS_AREAS.stage5,
] as unknown as [FocusArea, ...FocusArea[]];

/** Working scientifically skills, in syllabus order (WS-01 … WS-08). */
export const WS_SKILLS = [
  "Observing",
  "Questioning and predicting",
  "Planning investigations",
  "Conducting investigations",
  "Processing data and information",
  "Analysing data and information",
  "Problem-solving",
  "Communicating",
] as const;

type OutcomeInfo = { stage: Stage; kind: "ws" | "content"; label: string; focusArea?: FocusArea };

const wsOutcomes = (stage: Stage, prefix: "SC4" | "SC5") =>
  Object.fromEntries(
    WS_SKILLS.map((skill, i) => [
      `${prefix}-WS-0${i + 1}`,
      { stage, kind: "ws", label: `Working scientifically: ${skill}` } satisfies OutcomeInfo,
    ]),
  );

const content = (stage: Stage, focusArea: FocusArea): OutcomeInfo => ({
  stage,
  kind: "content",
  label: focusArea,
  focusArea,
});

export const OUTCOMES: Record<string, OutcomeInfo> = {
  ...wsOutcomes("stage4", "SC4"),
  ...wsOutcomes("stage5", "SC5"),
  "SC4-OTU-01": content("stage4", "Observing the Universe"),
  "SC4-FOR-01": content("stage4", "Forces"),
  "SC4-CLS-01": content("stage4", "Cells and classification"),
  "SC4-SOL-01": content("stage4", "Solutions and mixtures"),
  "SC4-LIV-01": content("stage4", "Living systems"),
  "SC4-PRT-01": content("stage4", "Periodic table and atomic structure"),
  "SC4-CHG-01": content("stage4", "Change"),
  "SC4-DA1-01": content("stage4", "Data science 1"),
  "SC5-EGY-01": content("stage5", "Energy"),
  "SC5-DIS-01": content("stage5", "Disease"),
  "SC5-MAT-01": content("stage5", "Materials"),
  "SC5-ENV-01": content("stage5", "Environmental sustainability"),
  "SC5-GEV-01": content("stage5", "Genetics and evolutionary change"),
  "SC5-GEV-02": content("stage5", "Genetics and evolutionary change"),
  "SC5-RXN-01": content("stage5", "Reactions"),
  "SC5-RXN-02": content("stage5", "Reactions"),
  "SC5-WAM-01": content("stage5", "Waves and motion"),
  "SC5-WAM-02": content("stage5", "Waves and motion"),
  "SC5-DA2-01": content("stage5", "Data science 2"),
};

export const OUTCOME_CODES = Object.keys(OUTCOMES) as [string, ...string[]];

export const NESA_OUTCOMES_URL =
  "https://curriculum.nsw.edu.au/learning-areas/science/science-7-10-2023/outcomes";
