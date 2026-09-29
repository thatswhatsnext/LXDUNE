/**
 * Regression tests for the schema's quality rules. Each case breaks the 5E
 * guide in one way and checks that validation reports it.
 *
 *   npm test
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { ModelGuide } from "../src/schema/model-guide";
import { checkModelIds, loadIdInputs } from "./validate";

const load = (id: string) => () => yaml.load(readFileSync(join(__dirname, "..", `content/guides/${id}.yaml`), "utf8")) as any;
const base = load("5e");
const poe = load("poe");
const adi = load("adi");
const loi = load("levels-of-inquiry");

const cases: [string, (g: any) => void, RegExp, (() => any)?][] = [
  // Guides are published and reviewed now, so this case must also remove the review
  ["publishing unreviewed content is blocked", (g) => { g.status = "published"; g.phases[0].examples[0].provenance = { source: "ai-generated", authors: ["Claude"], reviewedBy: [] }; }, /unreviewed content/],
  ["a phase without a negative example fails", (g) => (g.phases[0].examples = g.phases[0].examples.filter((e: any) => e.kind === "positive")), /negative example/],
  ["an invented outcome code fails", (g) => g.workedSequences[0].contentOutcomes.push("SC4-XYZ-01"), /Invalid enum value/],
  ["a Stage 5 code in a Stage 4 sequence fails", (g) => g.workedSequences[0].contentOutcomes.push("SC5-DIS-01"), /does not match stages/],
  ["an unknown look-for reference fails", (g) => g.misapplications[0].lookForIds.push("no-such-look-for"), /Unknown look-for/],
  ["a sequence that skips a phase fails", (g) => (g.workedSequences[0].steps = g.workedSequences[0].steps.filter((s: any) => s.phaseId !== "elaborate")), /never uses phase "elaborate"/],
  ["a short fit profile fails", (g) => g.reckoner.fitProfile.time.pop(), /time needs 4 scores/],
  ["missing reflection type fails", (g) => (g.reflectionPrompts = g.reflectionPrompts.filter((p: any) => p.type !== "critical")), /one critical/],
  ["practitioner mode as default is blocked", (g) => (g.scaffold.defaultMode = "practitioner"), /Invalid literal/],
  // Added in schema 1.1, found by authoring the POE guide
  ["unknown keys are rejected, not silently dropped", (g) => (g.phases[0].lookfors = []), /Unrecognized key/],
  ["a step with both lessons and minutes fails", (g) => (g.workedSequences[0].steps[0].minutes = "0–5"), /either lessons or minutes/],
  ["a unit model timed in minutes fails", (g) => g.workedSequences[0].steps.forEach((s: any) => { s.minutes = "0–5"; delete s.lessons; }), /Unit \(macro\) models time steps in lessons/],
  ["a single-lesson model timed in lessons fails", (g) => g.workedSequences[0].steps.forEach((s: any) => { s.lessons = "1"; delete s.minutes; }), /Single-lesson \(micro\) models time steps in minutes/, poe],
  ["an unmapped WS skill without a note fails", (g) => delete g.syllabusAlignment.wsMapping[2].note, /needs a note/, poe],
  ["hosting at a phase the model lacks fails", (g) => (g.nesting[0].phaseId = "no-such-phase"), /Unknown phase/],
  // Added in schema 1.2, found by authoring the ADI guide (eight stages)
  // Strips positives from EVERY phase in the group, so the case stays real as examples are added
  ["a stage group without a positive example fails", (g) => { const grp = g.phases[0].group;
    g.phases.filter((p: any) => p.group === grp).forEach((p: any) => { p.examples = (p.examples ?? []).filter((e: any) => e.kind !== "positive"); }); },
    /needs at least one positive example/, adi],
  ["a phase outside any declared group fails", (g) => (g.phases[3].group = "no-such-group"), /Unknown phase group/, adi],
  ["a grouped guide with an ungrouped phase fails", (g) => delete g.phases[2].group, /needs a group/, adi],
  ["an empty stage group fails", (g) => g.phaseGroups.push({ id: "spare", name: "Spare", summary: "Nothing here." }), /No phases in group/, adi],
  ["an ungrouped guide still needs a pair per phase", (g) => (g.phases[1].examples = []), /needs at least one positive example/],
  // The guidance-dial path: only dial models may omit a fit profile, and they must omit it
  ["a dial model with a fit profile fails", (g) => (g.reckoner.fitProfile = base().reckoner.fitProfile), /Only guidance-dial models/, loi],
  ["a ranked model without a fit profile fails", (g) => (g.reckoner.fitProfile = null), /Only guidance-dial models/],
  ["a dial model still needs example pairs", (g) => (g.phases[0].examples = []), /needs at least one positive example/, loi],
  // Schema 1.3: the dial heuristic must be traceable
  ["a heuristic factor claiming evidence with no citation fails", (g) => (g.reckoner.dialHeuristic.factors[2].evidenceStrength = "strong"), /must cite at least one reference/, loi],
  ["an unknown reference in a heuristic factor fails", (g) => g.reckoner.dialHeuristic.factors[0].referenceIds.push("not-a-ref"), /Unknown reference/, loi],
  ["a heuristic option left unscored fails", (g) => delete g.reckoner.dialHeuristic.factors[0].points.developing, /has no score/, loi],
  ["thresholds that do not ascend fail", (g) => (g.reckoner.dialHeuristic.thresholds[1].maxPoints = 0), /must ascend/, loi],
  ["thresholds that cannot reach the maximum fail", (g) => (g.reckoner.dialHeuristic.thresholds[2].maxPoints = 5), /maximum total of 6/, loi],
  ["a heuristic on a ranked model fails", (g) => (g.reckoner.dialHeuristic = loi().reckoner.dialHeuristic), /Only guidance-dial models carry/],
];

let failed = 0;
for (const [name, mutate, expect, from = base] of cases) {
  const g = from(); mutate(g);
  const r = ModelGuide.safeParse(g);
  const msgs = r.success ? "" : r.error.issues.map((i) => i.message).join(" | ");
  const ok = !r.success && expect.test(msgs);
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${name}${ok ? "" : `  (got: ${msgs || "valid"})`}`);
}
// Model-id cross-checks (validate.ts): registry, catalogue, template and quick matrix.
// Each case mutates an in-memory copy of the real inputs; nothing on disk changes.
const guideFiles = readdirSync(join(__dirname, "..", "content", "guides")).filter((f) => /\.ya?ml$/.test(f));
const idInputs = () => structuredClone({ ...loadIdInputs(guideFiles.map((f) => f.replace(/\.ya?ml$/, ""))), registry: [...loadIdInputs([]).registry] });
const idCases: [string, (x: ReturnType<typeof idInputs>) => void, RegExp][] = [
  ["a catalogue id not in the registry fails", (x) => x.catalogue.push({ id: "made-up-model" }), /catalogue\.json: "made-up-model" is not in MODEL_REGISTRY/],
  ["a catalogue entry that also has a guide fails", (x) => x.catalogue.push({ id: "5e" }), /catalogue\.json: "5e" also has a guide/],
  ["a registry id with no guide or catalogue entry fails", (x) => x.catalogue.splice(x.catalogue.findIndex((m) => m.id === "ssi"), 1), /MODEL_REGISTRY: "ssi" has neither a guide nor a catalogue entry/],
  ["a duplicate catalogue id fails", (x) => x.catalogue.push({ ...x.catalogue[0] }), /catalogue\.json: duplicate id/],
  ["a stale model id in an app.js list fails", (x) => (x.appJs += '\nif (["pbl","e7"].includes(m.id)) {}'), /templates\/app\.js line \d+: model id "e7" \(list checked against m\.id\)/],
  ["a stale model id in an app.js lookup fails", (x) => (x.appJs += '\nconst old = G["e7"];'), /templates\/app\.js line \d+: model id "e7" \(guide or model lookup\)/],
  ["a quick-matrix id not in the registry fails", (x) => (x.quick.misc.left[0] = "e7"), /questions\.json QUICK\.misc\.left: model id "e7"/],
];
const cleanIds = checkModelIds(idInputs());
if (cleanIds.errors.length) failed++;
console.log(`${cleanIds.errors.length ? "✗" : "✓"} current model ids pass the cross-checks${cleanIds.errors.length ? `  (${cleanIds.errors.join(" | ")})` : ""}`);
for (const [name, mutate, expect] of idCases) {
  const x = idInputs(); mutate(x);
  const msgs = checkModelIds(x).errors.join(" | ");
  const ok = expect.test(msgs);
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${name}${ok ? "" : `  (got: ${msgs || "no errors"})`}`);
}

// Every guide on disk, so adding a guide adds its check automatically
const guidesDir = join(__dirname, "..", "content", "guides");
let clean = true;
for (const f of readdirSync(guidesDir).filter((f) => /\.ya?ml$/.test(f)).sort()) {
  const r = ModelGuide.safeParse(yaml.load(readFileSync(join(guidesDir, f), "utf8")));
  const id = f.replace(/\.ya?ml$/, "");
  if (!r.success) clean = false;
  console.log(`${r.success ? "✓" : "✗"} unmodified ${id} is valid${r.success ? "" : `  (${r.error.issues.map((i) => i.message).join(" | ")})`}`);
}
process.exit(failed || !clean ? 1 : 0);
