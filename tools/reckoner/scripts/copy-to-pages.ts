/**
 * Copy the built site to the LXDUNE Pages path.
 *   tools/reckoner/dist/site/  ->  reckoner/  (repo root)
 *
 * reckoner/ becomes an exact mirror of the build: changed files are updated and
 * files the build no longer produces are deleted, so an unpublished guide cannot
 * linger on Pages. Only the changed files are listed, so you can see what students
 * will get before you commit.
 *
 *   --check   compare only; exit 1 if reckoner/ does not match the YAML (used in CI)
 *
 * Refuses to run outside the expected repo layout, so it cannot write into
 * another part of the site by accident.
 */
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { mirror } from "./lib/mirror";
import { PKG_ROOT } from "./lib/build";

const check = process.argv.includes("--check");
const repoRoot = resolve(PKG_ROOT, "..", "..");
const src = join(PKG_ROOT, "dist", "site");
const dest = join(repoRoot, "reckoner");

if (!existsSync(join(src, "index.html"))) {
  console.error("No build found. Run npm run build first.");
  process.exit(1);
}
if (!existsSync(join(repoRoot, "moodle-blocks"))) {
  console.error(`Expected the LXDUNE repo root at ${repoRoot} (no moodle-blocks/ there). Nothing copied.`);
  process.exit(1);
}

const r = mirror(src, dest, check);
const lines = [
  ...r.added.map((f) => `  + reckoner/${f}`),
  ...r.updated.map((f) => `  ~ reckoner/${f}`),
  ...r.removed.map((f) => `  - reckoner/${f}`),
];

if (check) {
  if (lines.length) {
    console.error("reckoner/ does not match the YAML. Run npm run publish:pages and commit the result.\n" + lines.join("\n"));
    process.exit(1);
  }
  console.log("reckoner/ matches the YAML.");
} else {
  console.log(lines.length ? `Updated reckoner/:\n${lines.join("\n")}` : "reckoner/ already up to date; nothing changed.");
}
