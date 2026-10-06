/**
 * Families schema
 * ---------------------------------------------------------------------------
 * content/families.yaml groups the reckoner's models into the Family Tree's families:
 * models that share an idea about how learning works. A family is a relation between
 * models, so it lives in one file rather than as a field on each guide and catalogue
 * entry: regrouping a model changes one line and no guide version.
 *
 * Every model id in MODEL_REGISTRY belongs to exactly one family; validate.ts checks
 * that, because a model left out would vanish from the Family Tree. A family marked
 * `across` (Levels of inquiry) is not a branch of its own: it applies inside any model.
 *
 * Same publication rule as guides: the families reach students only once reviewed.
 * Until then the Family Tree groups models by scale, as it always has.
 */
import { z } from "zod";
import { IsoDate, Provenance, ShortText, Slug, obj } from "./model-guide";

export const Family = obj({
  id: Slug,
  name: ShortText,
  /** One line under the family's heading: the idea its models share. */
  summary: ShortText,
  /** Shown in this order on the Family Tree. */
  models: z.array(Slug).min(1),
  /** True for a setting that applies inside any model (Levels of inquiry), drawn last. */
  across: z.boolean().default(false),
});

export const Families = obj({
  schemaVersion: z.literal("1.0"),
  id: z.literal("families"),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Use semver, e.g. 1.0.0"),
  status: z.enum(["draft", "in-review", "published"]),
  lastReviewed: IsoDate,
  provenance: Provenance,
  families: z.array(Family).min(2),
}).superRefine((f, ctx) => {
  const issue = (path: (string | number)[], message: string) =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
  const ids = new Set<string>(), models = new Map<string, string>();
  f.families.forEach((fam, i) => {
    if (ids.has(fam.id)) issue(["families", i, "id"], `Duplicate family id "${fam.id}"`);
    ids.add(fam.id);
    fam.models.forEach((m, j) => {
      if (models.has(m)) issue(["families", i, "models", j], `"${m}" is already in family "${models.get(m)}"`);
      models.set(m, fam.id);
    });
  });
  const across = f.families.filter((fam) => fam.across);
  if (across.length > 1) issue(["families"], `Only one family can be marked across (found ${across.length})`);
  if (across.length && !f.families[f.families.length - 1].across) issue(["families"], "The across family goes last");
  if (f.status === "published" && !f.provenance.reviewedBy.length) issue(["provenance", "reviewedBy"], "A published families file needs a reviewer");
  if (f.status === "published" && f.provenance.source === "ai-generated") issue(["provenance", "source"], "A published families file must be reviewed (source ai-drafted-reviewed or authored)");
});

export type Families = z.infer<typeof Families>;
