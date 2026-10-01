/**
 * Parity test for the syllabus whitelist. src/schema/syllabus.ts derives its
 * constants from frameworks/_schema/curriculum.vocab.json, the single source of
 * truth shared with the Framework Explorer. This test pins what the reckoner
 * sees, so an edit to the vocab file cannot silently change the whitelist that
 * every guide is validated against.
 *
 * The expected values below are deliberately written out by hand. If a change
 * to the vocab file is intended, update them here in the same commit.
 *
 *   npm test
 */
import { ALL_FOCUS_AREAS, FOCUS_AREAS, NESA_OUTCOMES_URL, OUTCOMES, OUTCOME_CODES, STAGES, WS_SKILLS } from "../src/schema/syllabus";

const EXPECTED_STAGES = ["stage4", "stage5"];

const EXPECTED_FOCUS_AREAS = {
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
};

const EXPECTED_WS_SKILLS = [
  "Observing",
  "Questioning and predicting",
  "Planning investigations",
  "Conducting investigations",
  "Processing data and information",
  "Analysing data and information",
  "Problem-solving",
  "Communicating",
];

const ws = (stage: string, prefix: string) =>
  Object.fromEntries(EXPECTED_WS_SKILLS.map((skill, i) => [`${prefix}-WS-0${i + 1}`, { stage, kind: "ws", label: `Working scientifically: ${skill}` }]));
const content = (stage: string, focusArea: string) => ({ stage, kind: "content", label: focusArea, focusArea });

const EXPECTED_OUTCOMES = {
  ...ws("stage4", "SC4"),
  ...ws("stage5", "SC5"),
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

const EXPECTED_URL = "https://curriculum.nsw.edu.au/learning-areas/science/science-7-10-2023/outcomes";

// JSON.stringify compares order as well as content: order drives the reckoner's
// focus-area menus and coverage tables.
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const cases: [string, boolean][] = [
  ["STAGES", same(STAGES, EXPECTED_STAGES)],
  ["FOCUS_AREAS", same(FOCUS_AREAS, EXPECTED_FOCUS_AREAS)],
  ["ALL_FOCUS_AREAS", same(ALL_FOCUS_AREAS, [...EXPECTED_FOCUS_AREAS.stage4, ...EXPECTED_FOCUS_AREAS.stage5])],
  ["WS_SKILLS", same(WS_SKILLS, EXPECTED_WS_SKILLS)],
  ["OUTCOMES", same(OUTCOMES, EXPECTED_OUTCOMES)],
  ["OUTCOME_CODES", same(OUTCOME_CODES, Object.keys(EXPECTED_OUTCOMES))],
  ["NESA_OUTCOMES_URL", NESA_OUTCOMES_URL === EXPECTED_URL],
];

let failed = 0;
for (const [name, ok] of cases) {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} syllabus parity: ${name} matches the pinned whitelist`);
}
if (failed) console.error(`\n${failed} syllabus parity check(s) failed. If the vocab change is intended, update scripts/test-syllabus.ts in the same commit.`);
process.exit(failed ? 1 : 0);
