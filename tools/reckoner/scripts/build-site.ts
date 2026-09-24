/**
 * Build the student-facing app from the canonical guides. See scripts/lib/build.ts.
 *
 *   npm run build                  ->  dist/site/   (what GitHub Pages serves: shell + app.js + data/)
 *   npm run build -- --single-file ->  dist/single/index.html  (self-contained, works offline)
 *   npm run build -- --drafts      ->  dist/review/all-guides-review.html  (includes drafts)
 *   npm run review -- <id>         ->  dist/review/<id>-review.html  (includes drafts, opens at <id>)
 */
import { join } from "node:path";
import { buildSite, BuildMode, PKG_ROOT } from "./lib/build";

const args = process.argv.slice(2);
const reviewAt = args.indexOf("--review");
const reviewId = reviewAt >= 0 ? args[reviewAt + 1] : undefined;
if (reviewAt >= 0 && (!reviewId || reviewId.startsWith("--"))) {
  console.error("Usage: npm run review -- <guide id>   e.g. npm run review -- poe");
  process.exit(1);
}
const mode: BuildMode = reviewAt >= 0 || args.includes("--drafts") ? "review" : args.includes("--single-file") ? "single" : "site";
const outDir = join(PKG_ROOT, "dist", mode);

try {
  const r = buildSite({ mode, outDir, reviewId });
  console.log(
    `Built dist/${mode}/ (${r.files.join(", ")}) — ${r.models} models, ${r.guides.length} full guide(s): ${r.guides
      .map((g) => `${g.id} v${g.version}${g.status === "published" ? "" : ` [${g.status}]`}`)
      .join(", ")}`,
  );
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
