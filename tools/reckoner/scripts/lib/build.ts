/**
 * Build the student-facing app from the canonical guides.
 *
 * The YAML guides in content/guides are the source of truth. Authored guides
 * supply their own reckoner fit profile and a full guide page; models in
 * content/catalogue.json appear in the reckoner and library with a
 * "guide coming soon" marker until a guide is written for them.
 *
 * Three outputs:
 *   site    index.html (shell) + app.js + data/manifest.json + data/guides/<id>.json.
 *           What GitHub Pages serves. One guide edit changes one data file.
 *   single  One self-contained HTML file with the data and code inline, for offline use.
 *   review  A single file that also includes draft and in-review guides, with a
 *           "review copy" banner. Never publish a review build to students.
 *
 * Only published guides are included in site and single builds, so unreviewed
 * content cannot reach students. Output is deterministic: the same YAML always
 * produces byte-identical files, so a diff of reckoner/ shows only real changes.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import yaml from "js-yaml";
import { ModelGuide } from "../../src/schema/model-guide";
import { FIT_DIMENSIONS, FIT_DIMENSION_KEYS } from "../../src/schema/fit-dimensions";

export const PKG_ROOT = join(__dirname, "..", "..");

export type BuildMode = "site" | "single" | "review";
export interface BuildOptions {
  mode: BuildMode;
  /** Output directory; emptied first, except in review mode. */
  outDir: string;
  /** review mode: the guide to open on load. Omit to review every guide. */
  reviewId?: string;
  guidesDir?: string;
  contentDir?: string;
  templatesDir?: string;
  log?: (msg: string) => void;
}
export interface BuildResult {
  files: string[];
  guides: { id: string; version: string; status: string }[];
  models: number;
}

const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 12);
/** JSON that is safe to place inside an inline <script>. */
const inlineJson = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");

export function loadGuides(guidesDir: string, includeDrafts: boolean, log: (m: string) => void) {
  return readdirSync(guidesDir)
    .filter((f) => /\.ya?ml$/.test(f))
    .sort()
    .map((f) => ModelGuide.parse(yaml.load(readFileSync(join(guidesDir, f), "utf8"))))
    .filter((g) => {
      const ok = g.status === "published" || includeDrafts;
      if (!ok) log(`! skipping ${g.id}: status is ${g.status}`);
      if (ok && g.status !== "published") log(`! including ${g.id} (${g.status}) — review copy only`);
      return ok;
    });
}

export function buildSite(opts: BuildOptions): BuildResult {
  const log = opts.log ?? console.warn;
  const guidesDir = opts.guidesDir ?? join(PKG_ROOT, "content", "guides");
  const contentDir = opts.contentDir ?? join(PKG_ROOT, "content");
  const templatesDir = opts.templatesDir ?? join(PKG_ROOT, "templates");
  const review = opts.mode === "review";

  const guides = loadGuides(guidesDir, review, log);
  if (review && opts.reviewId && !guides.some((g) => g.id === opts.reviewId)) {
    throw new Error(`No guide with id "${opts.reviewId}". Guides: ${guides.map((g) => g.id).join(", ")}`);
  }

  const catalogue = JSON.parse(readFileSync(join(contentDir, "catalogue.json"), "utf8"));
  const questions = JSON.parse(readFileSync(join(contentDir, "questions.json"), "utf8"));

  /** Reckoner entry from an authored guide: fit profile arrays become the digit strings the UI uses. */
  const fromGuide = (g: ModelGuide) => ({
    id: g.id,
    name: g.name,
    src: g.originators,
    scale: g.reckoner.scale,
    distinct: g.reckoner.distinguishingFeature,
    fit: g.reckoner.bestScienceFit,
    theory: g.reckoner.theoryTags,
    teacher: g.roles.teacher,
    learner: g.roles.learner,
    pitfall: g.reckoner.commonPitfall,
    evidence: g.reckoner.evidenceSummary,
    phases: g.phases.slice().sort((a, b) => a.order - b.order).map((p) => p.name),
    hasGuide: true,
    p: g.reckoner.fitProfile
      ? Object.fromEntries(FIT_DIMENSION_KEYS.map((k) => [k, g.reckoner.fitProfile![k].join("")]))
      : null,
  });

  const authored = new Set(guides.map((g) => g.id));
  const models = [
    ...guides.map(fromGuide),
    ...catalogue.filter((m: any) => !authored.has(m.id)).map((m: any) => ({ ...m, hasGuide: false })),
  ];

  const shared = {
    dims: questions.DIMS,
    scale: questions.SCALE,
    quick: questions.QUICK,
    purposePhrase: questions.PURPOSE_PHRASE,
    fitDimensions: FIT_DIMENSIONS,
    models,
  };

  const template = readFileSync(join(templatesDir, "app.html"), "utf8");
  const appJs = readFileSync(join(templatesDir, "app.js"), "utf8");
  if (!template.includes("<!--__BOOT__-->")) throw new Error("templates/app.html is missing <!--__BOOT__-->");

  // Review copies accumulate (one file per guide sent out); site and single builds start clean.
  if (!review) rmSync(opts.outDir, { recursive: true, force: true });
  const files: string[] = [];
  const write = (rel: string, body: string) => {
    const p = join(opts.outDir, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, body);
    files.push(rel);
  };

  if (opts.mode === "site") {
    const guideFiles = guides.map((g) => {
      const body = JSON.stringify(g, null, 2) + "\n";
      return { g, body, hash: hash(body) };
    });
    const manifest = {
      ...shared,
      guides: guideFiles.map(({ g, hash }) => ({ id: g.id, name: g.name, version: g.version, lastReviewed: g.lastReviewed, hash })),
    };
    guideFiles.forEach(({ g, body }) => write(`data/guides/${g.id}.json`, body));
    write("data/manifest.json", JSON.stringify(manifest, null, 2) + "\n");
    write("app.js", appJs);
    write("index.html", template.replace("<!--__BOOT__-->", siteBoot(hash(appJs))));
  } else {
    const data: Record<string, unknown> = { ...shared, guides };
    if (review) {
      const g = guides.find((x) => x.id === opts.reviewId);
      data.review = {
        guideId: g?.id ?? null,
        label: g ? `${g.name} v${g.version}, status ${g.status}` : `All guides, including drafts`,
      };
    }
    const openAt = review && opts.reviewId ? `if(!location.hash)location.hash=${JSON.stringify("#/guide/" + opts.reviewId)};` : "";
    const boot = `<script>window.RECKONER_DATA = ${inlineJson(data)};${openAt}</script>\n<script>\n${appJs.replace(/<\/script/gi, "<\\/script")}</script>`;
    const name = review ? `${opts.reviewId ?? "all-guides"}-review.html` : "index.html";
    write(name, template.replace("<!--__BOOT__-->", boot));
  }

  return {
    files,
    guides: guides.map((g) => ({ id: g.id, version: g.version, status: g.status })),
    models: models.length,
  };
}

/**
 * Loader for the site build: fetch the manifest, then every published guide,
 * then the app code. Guide and app URLs carry a content hash so a changed file
 * is never served from a stale cache; the manifest is revalidated on each load.
 */
function siteBoot(appHash: string) {
  return `<script>
(function(){
  var msg = document.getElementById("bootMsg");
  if (msg) msg.textContent = "Loading the reckoner…";
  function fail(){ if (msg) msg.textContent = "The reckoner could not load its content. Check your connection and reload the page."; }
  function json(u, opt){ return fetch(u, opt).then(function(r){ if(!r.ok) throw new Error(u + " " + r.status); return r.json(); }); }
  json("data/manifest.json", { cache: "no-cache" }).then(function(man){
    return Promise.all(man.guides.map(function(g){ return json("data/guides/" + g.id + ".json?v=" + g.hash); }))
      .then(function(guides){
        man.guides = guides;
        window.RECKONER_DATA = man;
        var s = document.createElement("script");
        s.src = "app.js?v=${appHash}";
        s.onerror = fail;
        document.body.appendChild(s);
      });
  }).catch(fail);
})();
</script>`;
}
