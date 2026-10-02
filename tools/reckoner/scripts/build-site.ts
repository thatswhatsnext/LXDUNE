/**
 * Build the student-facing app from the canonical guides. See scripts/lib/build.ts.
 *
 *   npm run build                  ->  dist/site/   (what GitHub Pages serves: shell + app.js + data/)
 *   npm run build -- --single-file ->  dist/single/index.html  (self-contained, works offline)
 *   npm run build -- --drafts      ->  dist/review/all-guides-review.html  (includes drafts)
 *   npm run review -- <id>         ->  dist/review/<id>-review.html  (includes drafts, opens at <id>)
 *   npm run review:game            ->  dist/review/game-review.html  (every game lesson, drafts included)
 *
 * The site build also builds the game into dist/play/, which copy-to-pages mirrors to play/.
 */
import { join } from "node:path";
import { buildSite, BuildMode, PKG_ROOT } from "./lib/build";
import { buildGame } from "./lib/game";

const args = process.argv.slice(2);
if (args.includes("--game-review")) {
  try {
    const r = buildGame({ mode: "review", outDir: join(PKG_ROOT, "dist", "review") });
    console.log(`Built dist/review/${r.file} — ${r.lessons.length} lesson(s): ${r.lessons.join(", ")}. Review copy only: never publish it.`);
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
  process.exit(0);
}
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
  if (mode === "site") {
    const g = buildGame({ mode: "site", outDir: join(PKG_ROOT, "dist", "play") });
    console.log(`Built dist/play/ (${g.file}) — ${g.lessons.length} published game lesson(s): ${g.lessons.join(", ") || "none"}`);
  }
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
