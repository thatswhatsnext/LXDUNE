/**
 * Nothing goes backwards compared with a base ref (default origin/dev).
 *
 *   npm run check:regressions                 compare with origin/dev
 *   npm run check:regressions -- origin/main  compare with another ref
 *
 * For each guide on the base ref, fails if:
 * - it was published there and is now missing or no longer published
 * - its version is now lower (semver)
 * - (published guides) any example, phase, look-for, worked sequence, misapplication or
 *   checklist item id that existed on the base ref is now missing
 *
 * It compares ids, not wording: a reworded example still passes, so review remains the guard
 * for content quality. Guides are read from git with `git show`, so the base ref must be fetched.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import yaml from "js-yaml";
import { PKG_ROOT } from "./lib/build";

const base = process.argv.slice(2).find((a) => !a.startsWith("--")) || "origin/dev";
const REPO = resolve(PKG_ROOT, "..", "..");
const DIR = join(PKG_ROOT, "content", "guides");
const REL = relative(REPO, DIR);
const git = (...args: string[]) => execFileSync("git", ["-C", REPO, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

try {
  git("rev-parse", "--verify", "--quiet", `${base}^{commit}`);
} catch {
  console.error(`Cannot resolve "${base}". Fetch it first, for example: git fetch origin dev`);
  process.exit(1);
}

const baseFiles = git("ls-tree", "--name-only", `${base}:${REL}`).split("\n").filter((f) => /\.ya?ml$/.test(f));

/** Semver compare: negative if a < b. Non-numeric parts compare as 0. */
const semver = (a: string, b: string) => {
  const pa = String(a).split(".").map((n) => parseInt(n, 10) || 0), pb = String(b).split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  return 0;
};

/** Every id that must not disappear from a published guide, grouped by kind. */
const idsOf = (g: any): Record<string, string[]> => ({
  phases: (g.phases ?? []).map((p: any) => p.id),
  examples: (g.phases ?? []).flatMap((p: any) => (p.examples ?? []).map((e: any) => e.id)),
  "look-fors": (g.phases ?? []).flatMap((p: any) => (p.lookFors ?? []).map((l: any) => l.id)),
  "worked sequences": (g.workedSequences ?? []).map((s: any) => s.id),
  misapplications: (g.misapplications ?? []).map((m: any) => m.id),
  "checklist items": (g.checklist ?? []).flatMap((c: any) => (c.items ?? []).map((i: any) => i.id)),
});

const problems: string[] = [];
let compared = 0;
for (const file of baseFiles) {
  let before: any;
  try {
    before = yaml.load(git("show", `${base}:${REL}/${file}`));
  } catch {
    console.warn(`! ${file}: could not read it on ${base}; skipped`);
    continue;
  }
  const path = join(DIR, file);
  if (!existsSync(path)) {
    if (before.status === "published") problems.push(`${file}: published on ${base}, but the file is gone`);
    continue;
  }
  let after: any;
  try {
    after = yaml.load(readFileSync(path, "utf8"));
  } catch {
    problems.push(`${file}: YAML syntax error (run npm run validate)`);
    continue;
  }
  compared++;
  if (before.status === "published" && after.status !== "published")
    problems.push(`${file}: published on ${base}, now "${after.status}"`);
  if (semver(after.version, before.version) < 0)
    problems.push(`${file}: version went down, ${before.version} on ${base} → ${after.version}`);
  if (before.status !== "published") continue;
  const was = idsOf(before), now = idsOf(after);
  for (const kind of Object.keys(was)) {
    const missing = was[kind].filter((id) => !now[kind].includes(id));
    if (missing.length) problems.push(`${file}: ${missing.length} ${kind} missing compared with ${base}: ${missing.join(", ")}`);
  }
}

if (problems.length) {
  console.error(`Regressions compared with ${base}:`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`No regressions compared with ${base}: ${compared} guide(s) checked; versions, publication status and ids all intact.`);
