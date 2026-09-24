/**
 * Build and publishing tests: the split site is deterministic, drafts never
 * reach the site, the page loads and renders every guide (in jsdom), and the
 * Pages mirror removes files the build no longer produces.
 *
 *   npm test   (runs after the schema rule tests)
 */
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import yaml from "js-yaml";
import { buildSite, PKG_ROOT } from "./lib/build";
import { mirror } from "./lib/mirror";

// jsdom ships without bundled types; only a few calls are used here.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { JSDOM, VirtualConsole } = require("jsdom");

const tmp = mkdtempSync(join(tmpdir(), "reckoner-test-"));
const quiet = () => {};
const guideIds = readdirSync(join(PKG_ROOT, "content", "guides")).filter((f) => f.endsWith(".yaml")).map((f) => f.replace(/\.yaml$/, "")).sort();
const SECTION_COUNT = 10;

const read = (dir: string) =>
  Object.fromEntries(
    (function walk(d: string, base = ""): string[] {
      return readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(d, e.name), join(base, e.name)) : [join(base, e.name)],
      );
    })(dir).map((f) => [f, readFileSync(join(dir, f), "utf8")]),
  );

const wait = async (cond: () => boolean, what: string, ms = 8000) => {
  const end = Date.now() + ms;
  while (!cond()) {
    if (Date.now() > end) throw new Error(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 25));
  }
};

/** Load a built page in jsdom. For the site build, fetch() is served from the build directory. */
async function openPage(file: string, siteDir?: string) {
  const errors: string[] = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e: Error) => errors.push(e.message));
  vc.on("error", (e: unknown) => errors.push(String(e)));
  const dom = new JSDOM(readFileSync(file, "utf8"), {
    url: pathToFileURL(file).href,
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window: any) {
      if (siteDir)
        window.fetch = async (u: string) => {
          const rel = String(u).split("?")[0];
          const p = join(siteDir, rel);
          const ok = existsSync(p);
          return { ok, status: ok ? 200 : 404, json: async () => JSON.parse(readFileSync(p, "utf8")) };
        };
    },
  });
  const doc = dom.window.document;
  await wait(() => !doc.getElementById("bootMsg") || errors.length > 0 || /could not load/.test(doc.getElementById("bootMsg").textContent), "the app to start");
  if (errors.length) throw new Error(errors.join("; "));
  if (doc.getElementById("bootMsg")) throw new Error(doc.getElementById("bootMsg").textContent);
  return { dom, doc, errors };
}

/** Route to each guide by URL hash and check it renders with its full section list. */
async function checkGuides(page: Awaited<ReturnType<typeof openPage>>, ids: string[]) {
  const { dom, doc, errors } = page;
  for (const id of ids) {
    dom.window.location.hash = `#/guide/${id}`;
    await wait(() => (doc.querySelector("#guideNav a.on")?.getAttribute("href") ?? "") === `#/guide/${id}`, `guide ${id}`);
    const heading = doc.querySelector("#guideBody h2")?.textContent ?? "";
    if (!/companion guide/.test(heading)) throw new Error(`${id}: no guide heading (got "${heading}")`);
    const sections = doc.querySelectorAll("#secNav a").length;
    if (sections !== SECTION_COUNT) throw new Error(`${id}: ${sections} section links, expected ${SECTION_COUNT}`);
  }
  if (errors.length) throw new Error(errors.join("; "));
}

const cases: [string, () => void | Promise<void>][] = [
  ["the site build is byte-identical across builds", () => {
    buildSite({ mode: "site", outDir: join(tmp, "a"), log: quiet });
    buildSite({ mode: "site", outDir: join(tmp, "b"), log: quiet });
    const a = read(join(tmp, "a")), b = read(join(tmp, "b"));
    if (JSON.stringify(Object.keys(a)) !== JSON.stringify(Object.keys(b))) throw new Error("file lists differ");
    for (const f of Object.keys(a)) if (a[f] !== b[f]) throw new Error(`${f} differs between builds`);
  }],
  ["the site build writes one data file per published guide, plus the shell", () => {
    const files = Object.keys(read(join(tmp, "a"))).sort();
    const want = ["app.js", "data/manifest.json", ...guideIds.map((id) => `data/guides/${id}.json`), "index.html"].sort();
    if (JSON.stringify(files) !== JSON.stringify(want)) throw new Error(`got ${files.join(", ")}`);
  }],
  ["a draft guide never reaches the site or single-file build", () => {
    const guidesDir = join(tmp, "guides-draft");
    cpSync(join(PKG_ROOT, "content", "guides"), guidesDir, { recursive: true });
    const f = join(guidesDir, "poe.yaml");
    const g = yaml.load(readFileSync(f, "utf8")) as any;
    g.status = "in-review";
    writeFileSync(f, yaml.dump(g));
    const lead = g.introduction.lead as string;

    const site = buildSite({ mode: "site", outDir: join(tmp, "draft-site"), guidesDir, log: quiet });
    if (site.files.includes("data/guides/poe.json")) throw new Error("poe.json was written");
    const all = Object.values(read(join(tmp, "draft-site"))).join("\n");
    if (all.includes(lead)) throw new Error("draft guide text found in the site build");

    buildSite({ mode: "single", outDir: join(tmp, "draft-single"), guidesDir, log: quiet });
    if (readFileSync(join(tmp, "draft-single", "index.html"), "utf8").includes(lead)) throw new Error("draft guide text found in the single-file build");
  }],
  ["a review copy includes the draft and marks it", async () => {
    const guidesDir = join(tmp, "guides-draft");
    buildSite({ mode: "review", reviewId: "poe", outDir: join(tmp, "review"), guidesDir, log: quiet });
    const page = await openPage(join(tmp, "review", "poe-review.html"));
    const text = page.doc.body.textContent ?? "";
    if (!text.includes("Review copy, not for students")) throw new Error("no review banner");
    await checkGuides(page, ["poe"]);
    if (!(page.doc.getElementById("guideBody").textContent ?? "").includes("Not yet reviewed")) throw new Error("draft guide not marked");
    page.dom.window.close();
  }],
  ["a review of an unknown guide id fails clearly", () => {
    try { buildSite({ mode: "review", reviewId: "nope", outDir: join(tmp, "x"), log: quiet }); }
    catch (e) { if (/No guide with id "nope"/.test((e as Error).message)) return; throw e; }
    throw new Error("no error");
  }],
  ["the split site loads its data and renders every guide", async () => {
    const page = await openPage(join(tmp, "a", "index.html"), join(tmp, "a"));
    await checkGuides(page, guideIds);
    page.dom.window.close();
  }],
  ["the single-file build renders every guide", async () => {
    buildSite({ mode: "single", outDir: join(tmp, "single"), log: quiet });
    const page = await openPage(join(tmp, "single", "index.html"));
    await checkGuides(page, guideIds);
    page.dom.window.close();
  }],
  ["the page reports missing data instead of failing silently", async () => {
    rmSync(join(tmp, "b", "data", "manifest.json"));
    try { await openPage(join(tmp, "b", "index.html"), join(tmp, "b")); }
    catch (e) { if (/could not load its content/.test((e as Error).message)) return; throw e; }
    throw new Error("no error shown");
  }],
  ["the Pages mirror removes a guide the build no longer produces", () => {
    const dest = join(tmp, "pages");
    mirror(join(tmp, "a"), dest);
    const stale = mirror(join(tmp, "draft-site"), dest, true);
    if (!stale.removed.includes(join("data", "guides", "poe.json"))) throw new Error("check mode did not report poe.json");
    if (!existsSync(join(dest, "data", "guides", "poe.json"))) throw new Error("check mode wrote changes");
    mirror(join(tmp, "draft-site"), dest);
    if (existsSync(join(dest, "data", "guides", "poe.json"))) throw new Error("poe.json was not removed");
    const again = mirror(join(tmp, "draft-site"), dest, true);
    if (again.added.length + again.updated.length + again.removed.length) throw new Error("mirror is not in sync after copying");
  }],
];

(async () => {
  let failed = 0;
  for (const [name, fn] of cases) {
    try { await fn(); console.log(`✓ ${name}`); }
    catch (e) { failed++; console.log(`✗ ${name}\n    ${(e as Error).message}`); }
  }
  rmSync(tmp, { recursive: true, force: true });
  console.log(failed ? `\n${failed} build test(s) failed` : `\nAll ${cases.length} build tests passed`);
  process.exit(failed ? 1 : 0);
})();
