/**
 * Validate every guide in content/guides against the schema, check links
 * between guides, and report coverage gaps for authors.
 *
 *   npm run validate
 *
 * Exits non-zero on any error, so it can gate a build or pull request.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { ModelGuide } from "../src/schema/model-guide";
import { FOCUS_AREAS } from "../src/schema/syllabus";

/** Every model the reckoner knows about. Nesting may only point at these. */
export const MODEL_REGISTRY = [
  "poe", "learning-cycle", "5e", "7e", "glm", "case", "interactive-approach",
  "levels-of-inquiry", "adi", "swh", "ast", "pbl", "project-based", "design-cycle", "ssi",
] as const;

const dir = join(__dirname, "..", "content", "guides");
const files = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f));
let errors = 0;
const guides: ModelGuide[] = [];

for (const file of files) {
  let raw: unknown;
  try {
    raw = yaml.load(readFileSync(join(dir, file), "utf8"));
  } catch (e: any) {
    // A YAML syntax error is almost always an unquoted value containing ": " or a comma in a flow mapping
    console.error(`\n✗ ${file}: YAML syntax error\n  ${e.reason || e.message}${e.mark ? ` (line ${e.mark.line + 1}, column ${e.mark.column + 1})` : ""}\n  Check for an unquoted value containing ": " or a comma inside { }.`);
    errors++;
    continue;
  }
  const result = ModelGuide.safeParse(raw);
  if (!result.success) {
    console.error(`\n✗ ${file}`);
    for (const i of result.error.issues) console.error(`  ${i.path.join(".") || "(root)"}: ${i.message}`);
    errors += result.error.issues.length;
    continue;
  }
  const g = result.data;
  if (`${g.id}.yaml` !== file && `${g.id}.yml` !== file) {
    console.error(`✗ ${file}: file name must match id "${g.id}"`);
    errors++;
  }
  guides.push(g);
  console.log(`✓ ${file}  (${g.status}, v${g.version})`);
}

// Cross-guide checks
const byId = new Map(guides.map((g) => [g.id, g]));
const pair = (h: string, n: string, p?: string) => `${h}>${n}@${p ?? ""}`;
const hostsClaims = new Set<string>();
const nestsInClaims = new Set<string>();

for (const g of guides) {
  if (!MODEL_REGISTRY.includes(g.id as never)) {
    console.error(`✗ ${g.id}: not in MODEL_REGISTRY`);
    errors++;
  }
  for (const n of g.nesting) {
    if (!MODEL_REGISTRY.includes(n.modelId as never)) {
      console.error(`✗ ${g.id}: nesting points at unknown model "${n.modelId}"`);
      errors++;
      continue;
    }
    const other = byId.get(n.modelId);
    if (n.role === "hosts") hostsClaims.add(pair(g.id, n.modelId, n.phaseId));
    else nestsInClaims.add(pair(n.modelId, g.id, n.phaseId));

    if (!other) {
      console.warn(`! ${g.id}: nests with "${n.modelId}", which has no guide yet (link will show as coming soon)`);
      continue;
    }
    // nests-in names the OTHER guide's phase, so it can only be checked once that guide exists
    if (n.role === "nests-in" && n.phaseId && !other.phases.some((p) => p.id === n.phaseId)) {
      console.error(`✗ ${g.id}: nests in "${n.modelId}" at unknown phase "${n.phaseId}"`);
      errors++;
    }
  }
}

// Reciprocity: when both guides exist, each side of a nesting should record it
for (const claim of hostsClaims) {
  const [h, rest] = claim.split(">");
  const [n] = rest.split("@");
  if (byId.has(h) && byId.has(n) && !nestsInClaims.has(claim))
    console.warn(`! ${n}: "${h}" hosts it (${claim.split("@")[1] || "no phase"}), but ${n} does not record nests-in "${h}" at that phase`);
}
for (const claim of nestsInClaims) {
  const [h, rest] = claim.split(">");
  const [n] = rest.split("@");
  if (byId.has(h) && byId.has(n) && !hostsClaims.has(claim))
    console.warn(`! ${h}: "${n}" nests in it (${claim.split("@")[1] || "no phase"}), but ${h} does not record hosting "${n}" at that phase`);
}

// Coverage report: which contexts have examples or worked sequences
console.log("\nCoverage");
for (const g of guides) {
  const tagged = [
    ...g.phases.flatMap((p) => p.examples.map((e) => e.context)),
    ...g.workedSequences.map((s) => s.context),
  ];
  const areas = new Set(tagged.flatMap((c) => c.focusAreas));
  const disciplines = new Set(tagged.flatMap((c) => c.disciplines));
  const missing = [...FOCUS_AREAS.stage4, ...FOCUS_AREAS.stage5].filter((a) => !areas.has(a));
  console.log(`  ${g.id}: ${g.workedSequences.length} worked sequence(s); disciplines: ${[...disciplines].join(", ") || "none"}`);
  console.log(`  ${g.id}: focus areas without any example: ${missing.join("; ") || "none"}`);
  if (!disciplines.has("biology") || !g.workedSequences.some((s) => s.context.disciplines.includes("biology")))
    console.warn(`! ${g.id}: no Biology worked sequence yet (priority for this cohort)`);
}

console.log(errors ? `\n${errors} error(s)` : `\nAll ${guides.length} guide(s) valid`);
process.exit(errors ? 1 : 0);
