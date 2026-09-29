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

type CatalogueEntry = { id: string };
type Quick = Record<string, { left: [string, string]; right: [string, string] }>;
export interface IdInputs {
  registry: readonly string[];
  guideIds: string[];
  catalogue: CatalogueEntry[];
  appJs: string;
  quick: Quick;
}

/** The inputs checkModelIds() reads, loaded from the repo. */
export function loadIdInputs(guideIds: string[]): IdInputs {
  const root = join(__dirname, "..");
  return {
    registry: MODEL_REGISTRY,
    guideIds,
    catalogue: JSON.parse(readFileSync(join(root, "content", "catalogue.json"), "utf8")),
    appJs: readFileSync(join(root, "templates", "app.js"), "utf8"),
    quick: JSON.parse(readFileSync(join(root, "content", "questions.json"), "utf8")).QUICK,
  };
}

/**
 * Places in templates/app.js that name a model id, found by context rather than by a hand-kept list:
 * lists checked with .includes(m.id), m.id comparisons, G[...] and M[...] lookups, openGuide(...) calls,
 * id: and guide: fields, and the compare view's defaults. Every id found must be registered.
 */
const APP_ID_SITES: [string, RegExp][] = [
  ["list checked against m.id", /\[([^\]\n]*)\]\.includes\(m\.id\)/g],
  ["m.id comparison", /m\.id\s*[!=]==\s*"([a-z0-9-]+)"/g],
  ["guide or model lookup", /\b[GM]\["([a-z0-9-]+)"\]/g],
  ["openGuide call", /openGuide\('([a-z0-9-]+)'/g],
  ["id or guide field", /\b(?:id|guide):\s*"([a-z0-9-]+)"/g],
  ["compare view defaults", /CMP_DEFAULT\s*=\s*\[([^\]]*)\]/g],
];

export function checkModelIds(x: IdInputs) {
  const errors: string[] = [];
  const registered = new Set(x.registry);
  const guides = new Set(x.guideIds);
  const seen = new Set<string>();
  for (const m of x.catalogue) {
    if (seen.has(m.id)) errors.push(`catalogue.json: duplicate id "${m.id}"`);
    seen.add(m.id);
    if (!registered.has(m.id)) errors.push(`catalogue.json: "${m.id}" is not in MODEL_REGISTRY`);
    if (guides.has(m.id)) errors.push(`catalogue.json: "${m.id}" also has a guide; remove the catalogue entry in the same commit as adding the guide`);
  }
  for (const id of x.registry)
    if (!guides.has(id) && !seen.has(id)) errors.push(`MODEL_REGISTRY: "${id}" has neither a guide nor a catalogue entry, so it has dropped out of the reckoner`);

  let appRefs = 0;
  for (const [kind, re] of APP_ID_SITES) {
    for (const m of x.appJs.matchAll(re)) {
      const line = x.appJs.slice(0, m.index).split("\n").length;
      const found = m[0].startsWith("[") || kind === "compare view defaults" ? [...m[1].matchAll(/"([a-z0-9-]+)"/g)].map((q) => q[1]) : [m[1]];
      for (const id of found) {
        appRefs++;
        if (!registered.has(id)) errors.push(`templates/app.js line ${line}: model id "${id}" (${kind}) is not in MODEL_REGISTRY`);
      }
    }
  }
  let quickRefs = 0;
  for (const [purpose, row] of Object.entries(x.quick))
    for (const side of ["left", "right"] as const) {
      quickRefs++;
      if (!registered.has(row[side][0])) errors.push(`questions.json QUICK.${purpose}.${side}: model id "${row[side][0]}" is not in MODEL_REGISTRY`);
    }
  return { errors, appRefs, quickRefs, guides: guides.size, catalogue: x.catalogue.length };
}


function main() {
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

  // Model ids: registry, catalogue, template and quick matrix must agree
  const ids = checkModelIds(loadIdInputs(files.map((f) => f.replace(/\.ya?ml$/, ""))));
  for (const e of ids.errors) console.error(`✗ ${e}`);
  errors += ids.errors.length;
  if (!ids.errors.length)
    console.log(`✓ model ids: ${MODEL_REGISTRY.length} registered (${ids.guides} guides, ${ids.catalogue} catalogue); ${ids.appRefs} references in templates/app.js and ${ids.quickRefs} in the quick matrix all registered`);

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
}

// Run only when invoked directly (npm run validate), so tests can import MODEL_REGISTRY and checkModelIds.
if (require.main === module) main();
