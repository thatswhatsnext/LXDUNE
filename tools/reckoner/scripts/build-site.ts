/**
 * Build the student-facing app from the canonical guides.
 *
 *   npm run build   ->  dist/site/index.html  (single self-contained file)
 *
 * The YAML guides in content/guides are the source of truth. Authored guides
 * supply their own reckoner fit profile and a full guide page; models in
 * content/catalogue.json appear in the reckoner and library with a
 * "guide coming soon" marker until a guide is written for them.
 *
 * Only published guides are included, so unreviewed content cannot reach students.
 * Pass --drafts to build a review copy that also includes draft and in-review guides,
 * each marked with a "not yet reviewed" banner. Never publish a drafts build to students.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { ModelGuide } from "../src/schema/model-guide";
import { FIT_DIMENSIONS, FIT_DIMENSION_KEYS } from "../src/schema/fit-dimensions";

const drafts = process.argv.includes("--drafts");
const root = join(__dirname, "..");
const guidesDir = join(root, "content", "guides");

const guides = readdirSync(guidesDir)
  .filter((f) => /\.ya?ml$/.test(f))
  .map((f) => ModelGuide.parse(yaml.load(readFileSync(join(guidesDir, f), "utf8"))))
  .filter((g) => {
    const ok = g.status === "published" || drafts;
    if (!ok) console.warn(`! skipping ${g.id}: status is ${g.status}`);
    if (ok && g.status !== "published") console.warn(`! including ${g.id} (${g.status}) — review copy only`);
    return ok;
  });

const catalogue = JSON.parse(readFileSync(join(root, "content", "catalogue.json"), "utf8"));
const questions = JSON.parse(readFileSync(join(root, "content", "questions.json"), "utf8"));

/** Reckoner entry from an authored guide: fit profile arrays become the digit strings the UI uses. */
const fromGuide = (g: ModelGuide) => ({
  id: g.id,
  name: g.name,
  src: g.originators,
  scale: g.reckoner.scale,
  distinct: g.reckoner.distinguishingFeature,
  fit: g.reckoner.bestScienceFit,
  theory: g.reckoner.theoryTags,
  teacher: g.roles.teacher,
  learner: g.roles.learner,
  pitfall: g.reckoner.commonPitfall,
  evidence: g.reckoner.evidenceSummary,
  phases: g.phases.sort((a, b) => a.order - b.order).map((p) => p.name),
  hasGuide: true,
  p: g.reckoner.fitProfile
    ? Object.fromEntries(FIT_DIMENSION_KEYS.map((k) => [k, g.reckoner.fitProfile![k].join("")]))
    : null,
});

const authored = new Set(guides.map((g) => g.id));
const models = [
  ...guides.map(fromGuide),
  ...catalogue.filter((m: any) => !authored.has(m.id)).map((m: any) => ({ ...m, hasGuide: false })),
];

const data = {
  builtAt: new Date().toISOString().slice(0, 10),
  dims: questions.DIMS,
  scale: questions.SCALE,
  quick: questions.QUICK,
  purposePhrase: questions.PURPOSE_PHRASE,
  fitDimensions: FIT_DIMENSIONS,
  models,
  guides: guides.map((g) => ({ ...g })),
};

const template = readFileSync(join(root, "templates", "app.html"), "utf8");
const html = template.replace("/*__DATA__*/null", JSON.stringify(data));

const out = join(root, "dist", "site");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, drafts ? "review.html" : "index.html"), html);

console.log(
  `Built dist/site/${drafts ? "review.html" : "index.html"} — ${models.length} models, ${guides.length} full guide(s): ${guides
    .map((g) => `${g.id} v${g.version}`)
    .join(", ")}`,
);
console.log(`${(html.length / 1024).toFixed(0)} kB`);
