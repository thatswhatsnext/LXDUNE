/**
 * Build and publishing tests: the split site is deterministic, drafts never
 * reach the site, the page loads and renders every guide (in jsdom), and the
 * Pages mirror removes files the build no longer produces.
 *
 *   npm test   (runs after the schema rule tests)
 */
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import yaml from "js-yaml";
import { buildSite, PKG_ROOT } from "./lib/build";
import { mirror } from "./lib/mirror";

// jsdom ships without bundled types; only a few calls are used here.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { JSDOM, VirtualConsole, requestInterceptor } = require("jsdom");

/**
 * Keeps the page tests off the network. The page's own files (file: URLs, such as app.js) are loaded
 * normally, so a missing local file is still an error. Anything remote (the Google Fonts stylesheet) is
 * answered with an empty response and recorded in `remote`.
 */
function offlineResources() {
  const remote: string[] = [];
  const resources = {
    interceptors: [
      requestInterceptor((request: { url: string }) => {
        if (request.url.startsWith("file:")) return undefined;
        remote.push(request.url);
        return new Response("", { status: 200, headers: { "Content-Type": "text/css" } });
      }),
    ],
  };
  return { resources, remote };
}

const tmp = mkdtempSync(join(tmpdir(), "reckoner-test-"));
const quiet = () => {};
const guideIds = readdirSync(join(PKG_ROOT, "content", "guides")).filter((f) => f.endsWith(".yaml")).map((f) => f.replace(/\.yaml$/, "")).sort();
const SECTION_COUNT = 10;
/** Hash of every watch-out and nesting text for fixed answers; see the rules test. */
const RULES_HASH = "f928e6d457994b16";

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

/** Load a built page in jsdom, optionally at a hash route. For the site build, fetch() is served from the build directory. */
async function openPage(file: string, siteDir?: string, hash = "") {
  const errors: string[] = [];
  const offline = offlineResources();
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e: Error) => errors.push(e.message));
  vc.on("error", (e: unknown) => errors.push(String(e)));
  const dom = new JSDOM(readFileSync(file, "utf8"), {
    url: pathToFileURL(file).href + hash,
    runScripts: "dangerously",
    resources: offline.resources,
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
  return { dom, doc, errors, remote: offline.remote };
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
  ["an invalid guide stops the build with a readable report", () => {
    const dir = join(tmp, "guides-invalid");
    cpSync(join(PKG_ROOT, "content", "guides"), dir, { recursive: true });
    const g = yaml.load(readFileSync(join(dir, "poe.yaml"), "utf8")) as any;
    g.status = "finished";
    g.phases[0].lookfors = [];
    writeFileSync(join(dir, "poe.yaml"), yaml.dump(g));
    const expectReadable = (want: RegExp) => {
      try { buildSite({ mode: "site", outDir: join(tmp, "invalid"), guidesDir: dir, log: quiet }); }
      catch (e) {
        const msg = (e as Error).message;
        if (/ZodError|at .*\(.*:\d+:\d+\)/.test(msg)) throw new Error(`raw error leaked: ${msg.slice(0, 120)}`);
        if (!want.test(msg)) throw new Error(`unexpected message: ${msg.slice(0, 200)}`);
        return;
      }
      throw new Error("the build did not fail");
    };
    expectReadable(/^poe\.yaml: invalid guide \(\d+ issues?\)\n  status: .*\n[\s\S]*phases\.0: Unrecognized key/);
    writeFileSync(join(dir, "poe.yaml"), "id: poe\nname: [unclosed\n");
    expectReadable(/^poe\.yaml: YAML syntax error\n  .*\(line \d+, column \d+\)/);
  }],
  ["a draft methodology appears only in review copies; a published one appears everywhere", () => {
    const contentDir = join(tmp, "content-meth");
    cpSync(join(PKG_ROOT, "content"), contentDir, { recursive: true });
    const f = join(contentDir, "methodology.yaml");
    const m = yaml.load(readFileSync(f, "utf8")) as any;
    const lead = m.intro.lead as string;
    // Start from a draft copy, whatever the committed file's status
    m.status = "draft";
    m.provenance = { ...m.provenance, source: "ai-generated", reviewedBy: [] };
    delete m.provenance.reviewedOn;
    writeFileSync(f, yaml.dump(m));
    const builds = (tag: string) => {
      const out = (mode: string) => join(tmp, `meth-${tag}-${mode}`);
      buildSite({ mode: "site", outDir: out("site"), contentDir, log: quiet });
      buildSite({ mode: "single", outDir: out("single"), contentDir, log: quiet });
      buildSite({ mode: "review", reviewId: "5e", outDir: out("review"), contentDir, log: quiet });
      const site = read(out("site"));
      return {
        guides: Object.fromEntries(Object.entries(site).filter(([k]) => k.startsWith(join("data", "guides")))),
        manifest: JSON.parse(site[join("data", "manifest.json")]),
        single: readFileSync(join(out("single"), "index.html"), "utf8"),
        review: readFileSync(join(out("review"), "5e-review.html"), "utf8"),
      };
    };
    const draft = builds("draft");
    if ("methodology" in draft.manifest) throw new Error("draft methodology in the site manifest");
    if (draft.single.includes(lead)) throw new Error("draft methodology in the single-file build");
    if (!draft.review.includes(lead)) throw new Error("draft methodology missing from the review copy");

    m.status = "published";
    m.provenance = { ...m.provenance, source: "ai-drafted-reviewed", reviewedBy: ["Test Reviewer"], reviewedOn: "2026-09-30" };
    writeFileSync(f, yaml.dump(m));
    const pub = builds("published");
    if (pub.manifest.methodology?.intro?.lead !== lead) throw new Error("published methodology missing from the site manifest");
    if (!pub.single.includes(lead)) throw new Error("published methodology missing from the single-file build");
    if (!pub.review.includes(lead)) throw new Error("published methodology missing from the review copy");
    if (JSON.stringify(pub.guides) !== JSON.stringify(draft.guides) || !Object.keys(draft.guides).length)
      throw new Error("guide data files changed with the methodology's status");
  }],
  ["How it works appears only with a published methodology, and Back restores the tab", async () => {
    const draft = await openPage(join(tmp, "meth-draft-single", "index.html"));
    if (draft.doc.getElementById("howFoot") || draft.doc.querySelector(".how-link")) throw new Error("How it works link shown for a draft methodology");
    draft.dom.window.close();
    const page = await openPage(join(tmp, "meth-published-single", "index.html"));
    const { doc, dom } = page;
    if (!doc.getElementById("howFoot")) throw new Error("no footer link");
    dom.window.location.hash = "#/how-it-works/detailed";
    await wait(() => !doc.getElementById("p-how").hidden, "the How it works page");
    const routes = [...doc.querySelectorAll("#howBody .how-route")].map((s: any) => s.id);
    const toc = doc.querySelectorAll("#howBody [data-howjump]").length, secs = doc.querySelectorAll("#howBody section.how-sec").length;
    if (!secs || toc !== secs) throw new Error(`contents bar has ${toc} links for ${secs} sections`);
    if (routes.join() !== "how-unit,how-three-taps,how-quick,how-detailed,how-rules,how-dial") throw new Error(`routes: ${routes.join()}`);
    if (doc.querySelectorAll("#howBody table.weights tbody tr").length !== doc.querySelectorAll("#detailForm fieldset").length) throw new Error("weights table does not list every question");
    if (!doc.querySelector("#howBody svg[role=img]")) throw new Error("no diagram");
    if (doc.querySelector(".tab[aria-selected=true]")?.id !== "t-unit") throw new Error("the selected tab changed");
    if ((doc.getElementById("how-detailed") as any).dataset.flipped !== "true") throw new Error("arriving at #/how-it-works/detailed did not turn its card");
    const card = doc.querySelector("#how-unit") as any;
    if (!card || !card.querySelector(".back").hasAttribute("inert")) throw new Error("a principle card's back is not inert before it is turned");
    card.querySelector(".front .flip-btn").click();
    if (card.dataset.flipped !== "true" || card.querySelector(".back").hasAttribute("inert") || !card.querySelector(".front").hasAttribute("inert"))
      throw new Error("Read more did not turn the card");
    (doc.querySelector("#how-sec-principles [data-flipall]") as any).click();
    if ([...doc.querySelectorAll("#how-sec-principles .flip")].some((c: any) => c.dataset.flipped !== "true")) throw new Error("Show all did not turn every principle card");
    if ((doc.getElementById("how-quick") as any).dataset.flipped === "true") throw new Error("Show all in Principles turned a route card");
    (doc.getElementById("howBack") as any).click();
    await wait(() => doc.getElementById("p-how").hidden && !doc.getElementById("p-unit").hidden, "Back to the selected tab");
    dom.window.close();
  }],
  ["a review of an unknown guide id fails clearly", () => {
    try { buildSite({ mode: "review", reviewId: "nope", outDir: join(tmp, "x"), log: quiet }); }
    catch (e) { if (/No guide with id "nope"/.test((e as Error).message)) return; throw e; }
    throw new Error("no error");
  }],
  ["the split site loads its data and renders every guide", async () => {
    const page = await openPage(join(tmp, "a", "index.html"), join(tmp, "a"));
    if (!page.remote.some((u) => u.startsWith("https://fonts.googleapis.com/")))
      throw new Error(`the fonts stylesheet was not answered offline (remote: ${page.remote.join(", ") || "none"})`);
    await checkGuides(page, guideIds);
    page.dom.window.close();
  }],
  ["the single-file build renders every guide", async () => {
    buildSite({ mode: "single", outDir: join(tmp, "single"), log: quiet });
    const page = await openPage(join(tmp, "single", "index.html"));
    await checkGuides(page, guideIds);
    page.dom.window.close();
  }],
  ["watch-out and nesting rules fire word for word as before", async () => {
    // Every model against 49 fixed answer sets (each option alone, plus two combinations). The hash is of the
    // rule texts from before the rules carried their triggers; change it only when rule wording changes on purpose.
    const page = await openPage(join(tmp, "single", "index.html"));
    const snap = page.dom.window.eval(`(() => {
      const blank = () => Object.fromEntries(DIMS.map(d => [d.id, d.multi ? [] : null]));
      const sets = [];
      DIMS.forEach(d => d.options.forEach(([v]) => { const a = blank(); a[d.id] = d.multi ? [v] : v; sets.push(a); }));
      sets.push(Object.assign(blank(), { purpose: ["reason"], ws: ["8"], ready: "novice", time: "short", conf: "low", res: "none", lang: "high", misc: "robust", concept: "abstract", place: "yes" }));
      sets.push(Object.assign(blank(), { concept: "value", time: "lesson", ready: "novice" }));
      const txt = x => typeof x === "string" ? x : x.text;
      return JSON.stringify(sets.map(a => DATA.models.map(m => [m.id, watchOuts(m, a).map(txt), nesting(m, a).map(n => txt(n) + (n.guide ? "|" + n.guide : ""))])));
    })()`);
    const hash = createHash("sha256").update(snap).digest("hex").slice(0, 16);
    if (hash !== RULES_HASH) throw new Error(`rule texts changed (hash ${hash}, expected ${RULES_HASH})`);
    page.dom.window.close();
  }],
  ["time-and-scale prompts: a routine for one lesson, a routine or unit choice, none where the watch-out already speaks", async () => {
    const page = await openPage(join(tmp, "single", "index.html"));
    const w = page.dom.window;
    const run = (a: object, id: string) => w.eval(`(() => { const a = Object.assign(Object.fromEntries(DIMS.map(d => [d.id, d.multi ? [] : null])), ${JSON.stringify(a)});
      const m = DATA.models.find(x => x.id === "${id}"); return timePrompts(m, a, watchOuts(m, a)).map(p => p.text); })()`) as string[];
    const one = run({ purpose: ["argue"], time: "lesson" }, "adi");
    if (one.length !== 1 || !/multi-lesson routine, and you have one lesson/.test(one[0])) throw new Error(`ADI, one lesson: ${JSON.stringify(one)}`);
    const unit = run({ purpose: ["argue"], time: "unit" }, "adi");
    if (unit.length !== 1 || !/a few lessons that fit inside a unit\. You’re planning a unit/.test(unit[0])) throw new Error(`ADI, a unit: ${JSON.stringify(unit)}`);
    if (run({ time: "short" }, "5e").length !== 1) throw new Error("5E in 2–5 lessons should prompt");
    if (run({ time: "short" }, "7e").length) throw new Error("7E in 2–5 lessons already has the time watch-out; no prompt");
    if (run({ time: "unit" }, "5e").length || run({ time: "lesson" }, "poe").length || run({ purpose: ["argue"] }, "adi").length) throw new Error("a prompt fired where scale and time agree, or with no time answer");
    // On the page: an arguing class with one lesson gets a multi-lesson routine on top (ADI or SWH), with the prompt.
    const { doc } = page;
    const pick = (name: string, value: string) => { const el = doc.querySelector(`#detailForm input[name="${name}"][value="${value}"]`) as any; el.checked = true; el.dispatchEvent(new w.Event("change", { bubbles: true })); };
    pick("d-purpose", "argue"); pick("d-time", "lesson");
    const top = doc.querySelector("#topCards article") as any;
    const name = top.querySelector("h3").textContent;
    if (!/Multi-lesson routine/.test(top.querySelector(".head-badges").textContent)) throw new Error(`top card ${name} is not a multi-lesson routine`);
    if (!/Have you thought about/.test(top.querySelector(".ponder")?.textContent ?? "")) throw new Error("no prompt on the top card");
    w.close();
  }],
  ["md() joins wrapped lines into paragraphs and keeps lists", async () => {
    const page = await openPage(join(tmp, "single", "index.html"));
    const got = page.dom.window.eval(`md("One line\\n  wrapped here.\\n\\nSecond **bold\\nacross** lines.\\n- item one\\n  continued\\n- item two\\nAfter.")`);
    const want = "<p>One line wrapped here.</p><p>Second <strong>bold across</strong> lines.</p><ul class='tight'><li>item one continued</li><li>item two After.</li></ul>";
    if (got !== want) throw new Error(`got ${got}`);
    const blank = page.dom.window.eval(`md("A\\n\\n- x\\n\\nB")`);
    if (blank !== "<p>A</p><ul class='tight'><li>x</li></ul><p>B</p>") throw new Error(`got ${blank}`);
    page.dom.window.close();
  }],
  ["show the working totals equal the card percentages", async () => {
    const page = await openPage(join(tmp, "single", "index.html"));
    const { doc, dom } = page;
    const pick = (name: string, value: string) => {
      const el = doc.querySelector(`#detailForm input[name="${name}"][value="${value}"]`) as any;
      el.checked = true; el.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    };
    pick("d-purpose", "misc"); pick("d-purpose", "model"); pick("d-time", "unit"); pick("d-ready", "novice"); pick("d-misc", "robust"); pick("d-place", "yes");
    const imp = doc.querySelector('#detailForm [data-imp="time"]') as any;
    imp.value = "2"; imp.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    const cards = [...doc.querySelectorAll("#topCards article")] as any[];
    if (cards.length !== 3) throw new Error(`${cards.length} top cards`);
    for (const c of cards) {
      const card = c.querySelector(".fitnum").textContent.replace("fit", "").trim();
      const work = c.querySelector("table.work tfoot strong")?.textContent;
      if (card !== work) throw new Error(`${c.querySelector("h3").textContent}: card ${card}, working ${work}`);
      if (c.querySelectorAll("table.work tbody tr").length !== 5) throw new Error("expected one row per answered question (5)");
    }
    if (!doc.querySelector("#topCards .b-rule")) throw new Error("no Rule label on the watch-outs or nesting lines");
    dom.window.close();
  }],
  ["the Field Guide home shows on the unit tab only, with the four steps in order", async () => {
    const built = readFileSync(join(tmp, "single", "index.html"), "utf8");
    const product = "The Field Guide to Constructivist Teaching Models";
    if (!built.includes(`<title>${product}</title>`)) throw new Error("the built <title> is not the product name");
    const page = await openPage(join(tmp, "single", "index.html"));
    const { doc, dom } = page;
    const home = doc.getElementById("home") as any, click = (id: string) => (doc.getElementById(id) as any).click();
    if (doc.title !== product) throw new Error(`document title: ${doc.title}`);
    if (doc.querySelector(".tab[aria-selected=true]")?.id !== "t-unit") throw new Error("t-unit is not the default tab");
    if (home.hidden) throw new Error("home hidden on first load");
    const steps = [...doc.querySelectorAll("#home .steps [data-step]")].map((s: any) => s.dataset.step).join();
    if (steps !== "learn,practise,choose,plan") throw new Error(`steps: ${steps}`);
    const jump = doc.querySelector('#home [data-step="unit"]') as any;
    if (!jump || !/Start with your unit/.test(jump.textContent)) throw new Error("no Start with your unit link under the steps");
    jump.click();
    if (home.hidden || doc.querySelector(".tab[aria-selected=true]")?.id !== "t-unit") throw new Error("Start with your unit did not stay on the unit tab");
    if (doc.getElementById("t-lib").textContent.trim() !== "Family Tree") throw new Error(`t-lib label: ${doc.getElementById("t-lib").textContent}`);
    click("t-quick");
    if (!home.hidden) throw new Error("home still shown after selecting t-quick");
    click("t-unit");
    if (home.hidden) throw new Error("home not shown again on returning to t-unit");
    (doc.querySelector('#home [data-step="plan"]') as any).click();
    if (!home.hidden || doc.querySelector(".tab[aria-selected=true]")?.id !== "t-guides") throw new Error("step 4 did not open the companion guides");
    dom.window.close();
    const deep = await openPage(join(tmp, "single", "index.html"), undefined, "#/guide/5e");
    await wait(() => (deep.doc.querySelector("#guideNav a.on")?.getAttribute("href") ?? "") === "#/guide/5e", "guide 5e");
    if (!deep.doc.getElementById("home").hidden) throw new Error("home shown on a #/guide/ deep link");
    deep.dom.window.close();
  }],
  ["the quick reckoner shows the other side of the matrix, except for one lesson", async () => {
    const page = await openPage(join(tmp, "single", "index.html"));
    const { doc, dom } = page;
    const pick = (name: string, value: string) => {
      const el = doc.querySelector(`#quickForm input[name="${name}"][value="${value}"]`) as any;
      el.checked = true; el.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    };
    pick("q-purpose", "misc"); pick("q-time", "unit"); pick("q-ready", "novice");
    const rec = doc.querySelector("#quickResult .card.lead h2")?.textContent;
    if (rec !== "5E, with a POE in Engage") throw new Error(`recommendation: ${rec}`);
    const alt = doc.getElementById("quickAlt");
    if (!alt || !alt.textContent.includes("Generative Learning Model (or 7E)")) throw new Error("no alternative card naming the Generative Learning Model (or 7E)");
    if (!alt.textContent.includes("If your learners had more experience")) throw new Error("alternative card heading");
    if (!doc.querySelector('#quickResult a.pill[href="../play/"]')) throw new Error("no Practise it in Fieldwork link for 5E");
    if (doc.querySelector("#quickForm details.help summary")?.textContent !== "Why this matters") throw new Error("help summary is not Why this matters");
    (doc.getElementById("altCompare") as any).click();
    const picked = [...doc.querySelectorAll("#cmpPicker input:checked")].map((i: any) => i.value).join();
    if (doc.querySelector(".tab[aria-selected=true]")?.id !== "t-compare" || picked !== "5e,glm") throw new Error(`compare opened with ${picked}`);
    pick("q-time", "lesson");
    if (doc.getElementById("quickAlt")) throw new Error("alternative card shown for a one-lesson result");
    dom.window.close();
  }],
  ["guides show a phase strip, and a time-share bar only when every phase has a share", async () => {
    const page = await openPage(join(tmp, "single", "index.html"));
    const { doc, dom } = page;
    const show = async (id: string) => {
      dom.window.location.hash = `#/guide/${id}`;
      await wait(() => (doc.querySelector("#guideNav a.on")?.getAttribute("href") ?? "") === `#/guide/${id}`, `guide ${id}`);
    };
    await show("5e");
    const tiles = doc.querySelectorAll("#guideBody .ph-strip li").length;
    if (tiles !== 5) throw new Error(`5E: ${tiles} phase tiles`);
    if (doc.querySelectorAll("#guideBody .ph-strip use").length !== 5) throw new Error("5E: not every tile has its phase glyph");
    const bar = doc.querySelector("#guideBody .share-bar");
    if (!bar || bar.querySelectorAll("span").length !== 5 || bar.getAttribute("role") !== "img") throw new Error("5E: no five-part time-share bar");
    if (!/Engage 5\u201310%/.test(bar.getAttribute("aria-label") ?? "")) throw new Error(`5E bar label: ${bar.getAttribute("aria-label")}`);
    await show("levels-of-inquiry");
    if (doc.querySelectorAll("#guideBody .ph-strip li").length !== 4) throw new Error("Levels of inquiry: not four phase tiles");
    if (doc.querySelector("#guideBody .share-bar")) throw new Error("Levels of inquiry has a time-share bar");
    dom.window.close();
  }],
  ["the page reports missing data instead of failing silently", async () => {
    rmSync(join(tmp, "b", "data", "manifest.json"));
    try { await openPage(join(tmp, "b", "index.html"), join(tmp, "b")); }
    catch (e) { if (/could not load its content/.test((e as Error).message)) return; throw e; }
    throw new Error("no error shown");
  }],
  ["the focus-area index pairs each focus area only with its own stage", () => {
    const man = JSON.parse(readFileSync(join(tmp, "a", "data", "manifest.json"), "utf8"));
    const idx = man.focusIndex as Record<string, { sequences: unknown[]; examples: unknown[] }>;
    for (const key of Object.keys(idx)) {
      const [st, fa] = key.split("|");
      if (!(man.focusAreas[st] ?? []).includes(fa)) throw new Error(`off-whitelist key ${key}`);
    }
    if (!idx["stage4|Forces"]?.sequences.length) throw new Error("stage4|Forces has no sequence");
    if (idx["stage5|Living systems"] || idx["stage4|Environmental sustainability"]) throw new Error("cross-stage pairing leaked into the index");
    const g = yaml.load(readFileSync(join(PKG_ROOT, "content", "guides", "5e.yaml"), "utf8")) as any;
    const ex = g.phases[0].examples[0];
    ex.context = { ...ex.context, stages: ["stage5"], focusAreas: ["Forces"] };
    ex.outcomes = [];
    const dir = join(tmp, "guides-mismatch");
    cpSync(join(PKG_ROOT, "content", "guides"), dir, { recursive: true });
    writeFileSync(join(dir, "5e.yaml"), yaml.dump(g));
    try { buildSite({ mode: "site", outDir: join(tmp, "mismatch"), guidesDir: dir, log: quiet }); }
    catch (e) { if (/is stage4, but the item is tagged stage5/.test((e as Error).message)) return; throw e; }
    throw new Error("a focus area tagged with the wrong stage was accepted");
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
