/**
 * Copy the built app to the LXDUNE Pages path.
 *   tools/reckoner/dist/site/index.html  ->  reckoner/index.html  (repo root)
 *
 * Refuses to run outside the expected repo layout, so it cannot write into
 * another part of the site by accident.
 */
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");
const repoRoot = resolve(pkgRoot, "..", "..");
const src = join(pkgRoot, "dist", "site", "index.html");
const destDir = join(repoRoot, "reckoner");
const dest = join(destDir, "index.html");

if (!existsSync(src)) {
  console.error("No build found. Run npm run build first.");
  process.exit(1);
}
if (!existsSync(join(repoRoot, "moodle-blocks"))) {
  console.error(`Expected the LXDUNE repo root at ${repoRoot} (no moodle-blocks/ there). Nothing copied.`);
  process.exit(1);
}
mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`Copied ${(statSync(dest).size / 1024).toFixed(0)} kB to reckoner/index.html`);
