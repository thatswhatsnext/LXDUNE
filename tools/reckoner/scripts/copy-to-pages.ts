/**
 * Copy the built site to the LXDUNE Pages paths.
 *   tools/reckoner/dist/site/  ->  reckoner/  (repo root)
 *   tools/reckoner/dist/play/  ->  play/      (repo root, the game)
 *
 * Each destination becomes an exact mirror of its build: changed files are updated and
 * files the build no longer produces are deleted, so an unpublished guide or lesson cannot
 * linger on Pages. Only the changed files are listed, so you can see what students
 * will get before you commit.
 *
 *   --check   compare only; exit 1 if reckoner/ or play/ does not match the YAML (used in CI)
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
const targets = [
  { src: join(PKG_ROOT, "dist", "site"), dest: join(repoRoot, "reckoner"), name: "reckoner" },
  { src: join(PKG_ROOT, "dist", "play"), dest: join(repoRoot, "play"), name: "play" },
];

for (const t of targets)
  if (!existsSync(join(t.src, "index.html"))) {
    console.error(`No build found for ${t.name}/. Run npm run build first.`);
    process.exit(1);
  }
if (!existsSync(join(repoRoot, "moodle-blocks"))) {
  console.error(`Expected the LXDUNE repo root at ${repoRoot} (no moodle-blocks/ there). Nothing copied.`);
  process.exit(1);
}

const lines = targets.flatMap((t) => {
  const r = mirror(t.src, t.dest, check);
  return [
    ...r.added.map((f) => `  + ${t.name}/${f}`),
    ...r.updated.map((f) => `  ~ ${t.name}/${f}`),
    ...r.removed.map((f) => `  - ${t.name}/${f}`),
  ];
});

if (check) {
  if (lines.length) {
    console.error("reckoner/ or play/ does not match the YAML. Run npm run publish:pages and commit the result.\n" + lines.join("\n"));
    process.exit(1);
  }
  console.log("reckoner/ and play/ match the YAML.");
} else {
  console.log(lines.length ? `Updated:\n${lines.join("\n")}` : "reckoner/ and play/ already up to date; nothing changed.");
}
