/**
 * Methodology schema
 * ---------------------------------------------------------------------------
 * content/methodology.yaml holds the prose for the "How it works" page: what the
 * reckoner is for, how each route decides, how content is made and reviewed, what
 * the evidence-strength labels mean, and its limits. Counts (models, guides) and
 * question weights are computed by the page, never written here, so this file
 * cannot drift from the data.
 *
 * Same publication rule as guides: nothing reaches students until it is reviewed.
 */
import { z } from "zod";
import { EvidenceStrength, IsoDate, Markdown, Provenance, Reference, ShortText, Slug, obj } from "./model-guide";

export const ROUTE_IDS = ["unit", "three-taps", "quick", "detailed", "rules", "dial"] as const;

const evidenceStrengthShape = {
  strong: ShortText,
  moderate: ShortText,
  emerging: ShortText,
  framework: ShortText,
};
// Keep evidenceStrength keys in step with the EvidenceStrength enum: a type error here means one side changed.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const evidenceKeysMatch: Same<keyof typeof evidenceStrengthShape, z.infer<typeof EvidenceStrength>> = true;
void evidenceKeysMatch;

export const Methodology = obj({
  schemaVersion: z.literal("1.0"),
  id: z.literal("methodology"),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Use semver, e.g. 1.0.0"),
  status: z.enum(["draft", "in-review", "published"]),
  lastReviewed: IsoDate,
  provenance: Provenance,
  intro: obj({ lead: ShortText, purpose: Markdown }),
  principles: z
    .array(obj({ id: Slug, title: ShortText, body: Markdown, referenceIds: z.array(Slug).default([]) }))
    .min(3),
  routes: z.array(obj({ id: z.enum(ROUTE_IDS), title: ShortText, body: Markdown })),
  review: Markdown,
  evidenceStrength: obj(evidenceStrengthShape),
  limits: z.array(ShortText).min(1),
  glossary: z.array(obj({ term: ShortText, definition: ShortText })).min(1),
  references: z.array(Reference).default([]),
}).superRefine((m, ctx) => {
  const issue = (path: (string | number)[], message: string) =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

  // Every route exactly once
  for (const id of ROUTE_IDS) {
    const n = m.routes.filter((r) => r.id === id).length;
    if (n === 0) issue(["routes"], `Missing route "${id}"`);
    if (n > 1) issue(["routes"], `Route "${id}" appears ${n} times`);
  }

  // Unique principle ids; every citation resolves
  const refIds = new Set(m.references.map((r) => r.id));
  const seen = new Set<string>();
  m.principles.forEach((p, i) => {
    if (seen.has(p.id)) issue(["principles", i, "id"], `Duplicate principle id "${p.id}"`);
    seen.add(p.id);
    p.referenceIds.forEach((r) => !refIds.has(r) && issue(["principles", i, "referenceIds"], `Unknown reference "${r}"`));
  });

  // Glossary terms unique, ignoring case
  const terms = new Set<string>();
  m.glossary.forEach((g, i) => {
    const t = g.term.toLowerCase();
    if (terms.has(t)) issue(["glossary", i, "term"], `Duplicate glossary term "${g.term}"`);
    terms.add(t);
  });

  // Published means reviewed
  if (m.status === "published" && (m.provenance.source === "ai-generated" || m.provenance.reviewedBy.length === 0))
    issue(["status"], "Published methodology must be reviewed: provenance.source authored or ai-drafted-reviewed, with reviewedBy filled in");
});

export type Methodology = z.infer<typeof Methodology>;
