/**
 * Game tests: lessons validate and every guide reference resolves, broken references and
 * unreviewed published lessons are refused, drafts never reach the site build, the build is
 * deterministic, and the page plays a lesson to the end in jsdom.
 *
 *   npm test   (runs after the build tests)
 */
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import yaml from "js-yaml";
import { GameLesson } from "../src/schema/game-lesson";
import { buildGame, buildReport, checkLesson, dialElements, dialGuide, dialLevel, dimScore, fit, GAME_DIR, journeyOf, loadGame } from "./lib/game";
import { PKG_ROOT } from "./lib/build";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { JSDOM, VirtualConsole, requestInterceptor } = require("jsdom");

const tmp = mkdtempSync(join(tmpdir(), "game-test-"));
const lessonFiles = readdirSync(GAME_DIR).filter((f) => /\.ya?ml$/.test(f) && f !== "game.yaml");
const rawLesson = (f: string) => yaml.load(readFileSync(join(GAME_DIR, f), "utf8")) as any;

/** A copy of content/game in a temp folder, so a test can break one lesson. */
function gameCopy(name: string, edit?: (lesson: any) => void, file = "5e-1-willow.yaml") {
  const dir = join(tmp, name);
  cpSync(GAME_DIR, dir, { recursive: true });
  if (edit) {
    const l = rawLesson(file);
    edit(l);
    writeFileSync(join(dir, file), yaml.dump(l));
  }
  return dir;
}

const wait = async (cond: () => boolean, what: string, ms = 8000) => {
  const end = Date.now() + ms;
  while (!cond()) {
    if (Date.now() > end) throw new Error(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 20));
  }
};

/** Load a built game page in jsdom on an http origin, so it gets localStorage (file: URLs are opaque). */
async function openGame(file: string) {
  const errors: string[] = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e: Error) => errors.push(e.message));
  const dom = new JSDOM(readFileSync(file, "utf8"), {
    url: "https://lxdune.test/play/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(win: any) { win.scrollTo = () => {}; win.HTMLElement.prototype.focus = function () {}; },
    resources: { interceptors: [requestInterceptor(() => new Response("", { status: 200, headers: { "Content-Type": "text/css" } }))] },
  });
  const doc = dom.window.document;
  await wait(() => !!doc.querySelector("[data-l]") || errors.length > 0, "the path map");
  if (errors.length) throw new Error(errors.join("; "));
  return { dom, doc, errors };
}

/** Play one lesson to its results screen, always taking the first option. */
async function playLesson(doc: any, id: string) {
  const go = () => doc.getElementById("go").click();
  let btn = doc.querySelector(`[data-l="${id}"]`);
  // On a path with cases, the lesson may sit in a case that isn't chosen yet: choose it.
  for (const c of btn ? [] : [...doc.querySelectorAll("[data-case]")].map((b: any) => b.dataset.case)) {
    doc.querySelector(`[data-case="${c}"]`).click();
    if ((btn = doc.querySelector(`[data-l="${id}"]`))) break;
  }
  if (!btn || btn.disabled) throw new Error(`${id} is locked`);
  btn.click();
  go();
  for (let step = 0; step < 100 && !doc.querySelector(".sum-head"); step++) {
    // A build board: place every card (all in the first phase) before checking the plan.
    if (doc.querySelector("[data-c]")) {
      while (doc.querySelector("[data-c]")) { doc.querySelector("[data-c]").click(); doc.querySelector("[data-place]").click(); }
      go();
      if (!doc.querySelector(".report")) throw new Error(`${id}: no feature report after checking the plan`);
      go();
      continue;
    }
    if (doc.querySelector("#pool .opt")) while (doc.querySelector("#pool .opt")) doc.querySelector("#pool .opt").click();
    else {
      const opt = doc.querySelector(".opts .opt:not([disabled])");
      if (opt) opt.click();
    }
    go();
    if (doc.querySelector(".dock.good, .dock.bad")) go();
  }
  if (!doc.querySelector(".sum-head")) throw new Error(`${id} did not reach the results screen`);
}

const cases: [string, () => void | Promise<void>][] = [
  ["every lesson validates and its guide references resolve", () => {
    const c = loadGame();
    if (c.errors.length) throw new Error(c.errors.join("; "));
    if (c.lessons.length !== lessonFiles.length) throw new Error(`loaded ${c.lessons.length} of ${lessonFiles.length} lessons`);
  }],
  ["a look-for id that is not in the guide is refused", () => {
    const c = loadGame({ gameDir: gameCopy("bad-lookfor", (l) => (l.builtOn.lookForIds = ["no-such-look-for"])) });
    if (!c.errors.some((e) => /look-for "no-such-look-for"/.test(e))) throw new Error(`not caught: ${c.errors.join("; ")}`);
  }],
  ["a spot item missing feedback for a phase is refused", () => {
    const c = loadGame({ gameDir: gameCopy("bad-spot", (l) => delete l.items.find((i: any) => i.type === "spot").fb.elaborate) });
    if (!c.errors.some((e) => /no entry for phase "elaborate"/.test(e))) throw new Error(`not caught: ${c.errors.join("; ")}`);
  }],
  ["a misapplication id that is not in the guide is refused", () => {
    const c = loadGame({ gameDir: gameCopy("bad-dx", (l) => (l.items.find((i: any) => i.type === "diagnose").answer = "mis-nothing"), "5e-4-labels.yaml") });
    if (!c.errors.some((e) => /misapplication "mis-nothing"/.test(e))) throw new Error(`not caught: ${c.errors.join("; ")}`);
  }],
  ["a published lesson without a reviewer is refused", () => {
    const l = rawLesson("5e-1-willow.yaml");
    l.provenance = { source: "ai-generated", authors: ["Claude"], reviewedBy: [] };
    if (GameLesson.safeParse(l).success) throw new Error("an unreviewed published lesson was accepted");
  }],
  ["an answer past the last option is refused", () => {
    const l = rawLesson("5e-1-willow.yaml");
    l.items.find((i: any) => i.type === "choice").answer = 9;
    if (GameLesson.safeParse(l).success) throw new Error("an out-of-range answer was accepted");
  }],
  ["lesson order gaps on a path are refused", () => {
    const c = loadGame({ gameDir: gameCopy("bad-order", (l) => (l.order = 7), "5e-2-cells.yaml") });
    if (!c.errors.some((e) => /orders must run/.test(e))) throw new Error(`not caught: ${c.errors.join("; ")}`);
  }],
  ["the site build holds published lessons only, and is byte-identical across builds", () => {
    const c = loadGame();
    buildGame({ mode: "site", outDir: join(tmp, "a"), content: c });
    buildGame({ mode: "site", outDir: join(tmp, "b"), content: c });
    const a = readFileSync(join(tmp, "a", "index.html"), "utf8");
    if (a !== readFileSync(join(tmp, "b", "index.html"), "utf8")) throw new Error("builds differ");
    for (const l of c.lessons) {
      const inBuild = a.includes(`"id":"${l.id}"`);
      if (l.status === "published" && !inBuild) throw new Error(`${l.id} is published but missing`);
      if (l.status !== "published" && inBuild) throw new Error(`${l.id} is ${l.status} but reached the site build`);
    }
    if (!a.includes('"review":false')) throw new Error("site build is not marked as a student build");
  }],
  ["checkLesson passes every lesson against its own guide", () => {
    const c = loadGame();
    for (const l of c.lessons) {
      const path = c.config.paths.find((p) => p.id === l.path)!;
      const issues = checkLesson(l, c.guides.get(path.journey ?? path.id)!, { guides: c.guides, reckoner: c.reckoner });
      if (issues.length) throw new Error(issues.join("; "));
    }
  }],
  ["the game's fit() matches the reckoner's own code in templates/app.js", () => {
    const app = readFileSync(join(PKG_ROOT, "templates", "app.js"), "utf8");
    const src = app.slice(app.indexOf("function dimScore("), app.indexOf("const rankAll"));
    const c = loadGame();
    const dims = c.reckoner.dims;
    const appFns = new Function("DIMS", `${src}; return { dimScore, fit };`)(dims);
    const imp = Object.fromEntries(dims.map((d) => [d.id, 1]));
    const profiles = c.lessons.flatMap((l) => l.items.flatMap((it: any) => (it.profile ? [it.profile, ...(it.changes ?? []).map((ch: any) => ({ ...it.profile, [ch.dim]: ch.value }))] : [])));
    if (profiles.length < 5) throw new Error(`only ${profiles.length} profiles to compare`);
    for (const [id, p] of c.reckoner.profiles) {
      const m = { p: Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v.join("")])) };
      for (const a of profiles) {
        // The reckoner's form always supplies a list for multi-select questions, empty when unanswered.
        const formA = { ...Object.fromEntries(dims.filter((d) => d.multi).map((d) => [d.id, []])), ...a };
        const mine = fit(p, a, dims), theirs = appFns.fit(m, formA, imp);
        if (Math.abs(mine - theirs) > 1e-9) throw new Error(`${id}: game fit ${mine} vs reckoner ${theirs} for ${JSON.stringify(a)}`);
        for (const d of dims) if (dimScore(p, d, a) !== appFns.dimScore(m, d, formA)) throw new Error(`${id} ${d.id}: dimScore differs`);
      }
    }
  }],
  ["a select answer the reckoner disagrees with is refused", () => {
    const c = loadGame({ gameDir: gameCopy("bad-select", (l) => (l.items.find((i: any) => i.id === "class-yeast").answer = "5e"), "select-1-which.yaml") });
    if (!c.errors.some((e) => /the reckoner gives "poe"/.test(e))) throw new Error(`not caught: ${c.errors.join("; ")}`);
  }],
  ["a reason marked correct that doesn't favour the answer is refused", () => {
    const c = loadGame({ gameDir: gameCopy("bad-reason", (l) => (l.items.find((i: any) => i.id === "class-yeast").reasons.find((x: any) => x.dim === "ready").ok = true), "select-1-which.yaml") });
    if (!c.errors.some((e) => /ready does not favour poe/.test(e))) throw new Error(`not caught: ${c.errors.join("; ")}`);
  }],
  ["a flip whose answer doesn't flip the reckoner is refused", () => {
    const c = loadGame({ gameDir: gameCopy("bad-flip", (l) => (l.items.find((i: any) => i.type === "flip").answer = 1), "select-2-dial.yaml") });
    if (!c.errors.some((e) => /flips the reckoner's choice/.test(e)) || !c.errors.some((e) => /does not flip/.test(e))) throw new Error(`not caught: ${c.errors.join("; ")}`);
  }],
  ["a nest item that disagrees with the guides' nesting records is refused", () => {
    const c = loadGame({ gameDir: gameCopy("bad-nest", (l) => (l.items.find((i: any) => i.type === "nest").answer = "explore"), "poe-2-hands.yaml") });
    if (!c.errors.some((e) => /nest poe at engage in 5e, not explore/.test(e))) throw new Error(`not caught: ${c.errors.join("; ")}`);
  }],
  ["the page's build report matches the build's for random placements", () => {
    const js = readFileSync(join(PKG_ROOT, "templates", "game.js"), "utf8");
    const src = js.slice(js.indexOf("/*<buildReport>*/"), js.indexOf("/*</buildReport>*/"));
    const pageReport = new Function(`${src}; return buildReport;`)();
    const c = loadGame();
    let compared = 0;
    for (const l of c.lessons) for (const it of l.items) {
      if (it.type !== "build") continue;
      const g = c.guides.get(journeyOf(c.config.paths.find((p) => p.id === l.path)!))!;
      const phases = g.phases.slice().sort((a, b) => a.order - b.order);
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let t = 0; t < 200; t++) {
        const placed: Record<string, string[]> = {};
        it.cards.forEach((card) => { if (rnd() < 0.7) (placed[phases[Math.floor(rnd() * phases.length)].id] ??= []).push(card.id); });
        const a = JSON.stringify(buildReport(it, g, placed)), b = JSON.stringify(pageReport(it, placed, phases));
        if (a !== b) throw new Error(`${l.id}: reports differ for ${JSON.stringify(placed)}\n  build ${a}\n  page  ${b}`);
        compared++;
      }
    }
    if (!compared) throw new Error("no build items to compare");
  }],
  ["an unsolvable build board is refused", () => {
    const c = loadGame({ gameDir: gameCopy("bad-build", (l) => (l.items.find((i: any) => i.type === "build").cards.find((x: any) => x.id === "garden").features = []), "5e-5-build.yaml") });
    if (!c.errors.some((e) => /no placement of the sound cards gives a clean report/.test(e))) throw new Error(`not caught: ${c.errors.join("; ")}`);
  }],
  ["a Prac Day loop, unreachable node or bad conception is refused", () => {
    const loop = loadGame({ gameDir: gameCopy("bad-sim-loop", (l) => (l.items.find((i: any) => i.type === "sim").nodes.find((n: any) => n.id === "revisit").choices[0].next = "sort"), "5e-6-prac-day.yaml") });
    if (!loop.errors.some((e) => /loops/.test(e))) throw new Error(`loop not caught: ${loop.errors.join("; ")}`);
    const orphan = loadGame({ gameDir: gameCopy("bad-sim-orphan", (l) => (l.items.find((i: any) => i.type === "sim").nodes.find((n: any) => n.id === "sort").choices[1].next = "microscope"), "5e-6-prac-day.yaml") });
    if (!orphan.errors.some((e) => /"quiet" can't be reached/.test(e))) throw new Error(`orphan not caught: ${orphan.errors.join("; ")}`);
    const conc = loadGame({ gameDir: gameCopy("bad-sim-conc", (l) => (l.items.find((i: any) => i.type === "sim").nodes.find((n: any) => n.id === "sort").said.conception = 9), "5e-6-prac-day.yaml") });
    if (!conc.errors.some((e) => /conception 9 is past the end/.test(e))) throw new Error(`conception not caught: ${conc.errors.join("; ")}`);
  }],
  ["a path stays locked until the paths it requires reach their level", async () => {
    // Publish every lesson in a copy, so the student build holds the full map.
    const dir = gameCopy("all-published");
    for (const f of lessonFiles) {
      const l = rawLesson(f);
      l.status = "published";
      l.provenance = { source: "ai-drafted-reviewed", authors: ["Claude"], reviewedBy: ["Test"], reviewedOn: "2026-10-03" };
      writeFileSync(join(dir, f), yaml.dump(l));
    }
    const c = loadGame({ gameDir: dir });
    if (c.errors.length) throw new Error(c.errors.join("; "));
    buildGame({ mode: "site", outDir: join(tmp, "gate"), content: c });
    const { doc, errors } = await openGame(join(tmp, "gate", "index.html"));
    // Lessons that wait only for their path; a lesson with its own requires is checked after the loop.
    const selectIds = c.lessons.filter((l) => l.path === "select" && !l.requires.length).map((l) => l.id);
    const locked = () => selectIds.every((id) => (doc.querySelector(`[data-l="${id}"]`) as any).disabled);
    if (!locked()) throw new Error("select lessons are open before any lesson is played");
    for (const p of c.config.paths.filter((x) => x.requires.length))
      c.lessons.filter((l) => l.path === p.id).forEach((l) => { const b = doc.querySelector(`[data-l="${l.id}"]`) as any; if (b && !b.disabled) throw new Error(`${l.id} is open before the ${p.id} path's requirements are met`); });
    const req = c.config.paths.find((p) => p.id === "select")!.requires;
    for (const q of req) {
      const need = c.lessons.filter((l) => l.path === q.path);
      const upTo = need.findIndex((l) => l.level === q.level);
      for (const l of need.slice(0, upTo + 1)) {
        if (q === req[req.length - 1] && l === need[upTo] && !locked()) throw new Error("select opened before the last requirement was met");
        await playLesson(doc, l.id);
        (doc.getElementById("toMap") as any).click();
      }
    }
    if (locked()) throw new Error("select lessons are still locked after every requirement was met");
    // A lesson with its own requires stays locked, says why, and opens once that path reaches the level.
    for (const l of c.lessons.filter((x) => x.requires.length)) {
      const btn = () => doc.querySelector(`[data-l="${l.id}"]`) as any;
      if (!btn().disabled) throw new Error(`${l.id} is open before its own requirements are met`);
      if (!/Unlocks at/.test(btn().textContent)) throw new Error(`${l.id} doesn't say what unlocks it`);
      for (const q of l.requires) {
        const need = c.lessons.filter((x) => x.path === q.path);
        for (const n of need.slice(0, need.findIndex((x) => x.level === q.level) + 1)) {
          if (!(doc.querySelector(`[data-l="${n.id}"]`) as any).disabled || !n.requires.length) { await playLesson(doc, n.id); (doc.getElementById("toMap") as any).click(); }
        }
      }
      for (const prev of c.lessons.filter((x) => x.path === l.path && x.order < l.order)) {
        await playLesson(doc, prev.id); (doc.getElementById("toMap") as any).click();
      }
      if (btn().disabled) throw new Error(`${l.id} is still locked after its requirements were met`);
    }
    if (errors.length) throw new Error(errors.join("; "));
  }],
  ["a grouped rail shows stage groups, and a spot item offers only the stages it names", async () => {
    buildGame({ mode: "review", outDir: join(tmp, "grouped") });
    const { dom, doc, errors } = await openGame(join(tmp, "grouped", "game-review.html"));
    const c = loadGame();
    const path = c.config.paths.find((p) => p.rail === "groups");
    if (!path) throw new Error("no path uses rail: groups");
    const g = c.guides.get(journeyOf(path))!;
    const lesson = c.lessons.find((l) => l.path === path.id && l.items.some((i) => i.type === "spot" && i.among))!;
    (doc.querySelector(`[data-l="${lesson.id}"]`) as any).click(); (doc.getElementById("go") as any).click();
    const cells = [...doc.querySelectorAll("#rail div")].map((d: any) => d.textContent);
    if (cells.join("|") !== g.phaseGroups.map((x) => x.name).join("|")) throw new Error(`rail shows ${cells.join(", ")}`);
    if (doc.querySelectorAll("#rail div.now").length !== 1) throw new Error("the rail marks no current group");
    const tag = doc.querySelector("#stage .phtag:not(.plain)")?.textContent ?? "";
    const first = lesson.items[0];
    if (!tag.includes(g.phases.find((p) => p.id === first.at)!.name)) throw new Error(`phase tag doesn't name the stage: ${tag}`);
    // Walk to the first spot item with among, answering whatever is first.
    const spot = lesson.items.find((i) => i.type === "spot" && i.among) as any;
    for (let n = 0; n < 40 && !(doc.querySelector(".card h2, .vignette")?.textContent ?? "").includes(spot.vignette.text.slice(0, 30)); n++) {
      if (doc.querySelector("#pool .opt")) while (doc.querySelector("#pool .opt")) doc.querySelector("#pool .opt").click();
      else (doc.querySelector(".opts .opt:not([disabled])") as any)?.click();
      (doc.getElementById("go") as any).click();
      if (doc.querySelector(".dock.good, .dock.bad")) (doc.getElementById("go") as any).click();
    }
    const offered = [...doc.querySelectorAll(".opts.phases .opt")].map((o: any) => o.textContent.trim());
    const want = g.phases.filter((p) => spot.among.includes(p.id)).map((p) => p.name);
    if (offered.join("|") !== want.join("|")) throw new Error(`spot offers ${offered.join(", ")}; expected ${want.join(", ")}`);
    if (errors.length) throw new Error(errors.join("; "));
    dom.window.close();
  }],
  ["a spot answer outside among, a lesson requiring an unknown path, and a grouped rail without groups are refused", () => {
    const l = rawLesson("adi-1-leaf-litter.yaml");
    l.items.find((i: any) => i.type === "spot" && i.among).answer = "revision";
    if (GameLesson.safeParse(l).success) throw new Error("a spot answer outside among was accepted");
    const req = loadGame({ gameDir: gameCopy("bad-req", (x) => (x.requires = [{ path: "nope", level: "explain" }]), "select-3-argue.yaml") });
    if (!req.errors.some((e) => /requires unknown path "nope"/.test(e))) throw new Error(`unknown path not caught: ${req.errors.join("; ")}`);
    const dir = gameCopy("bad-rail");
    const cfg = yaml.load(readFileSync(join(dir, "game.yaml"), "utf8")) as any;
    cfg.paths.find((p: any) => p.id === "poe").rail = "groups";
    writeFileSync(join(dir, "game.yaml"), yaml.dump(cfg));
    const rail = loadGame({ gameDir: dir });
    if (!rail.errors.some((e) => /rail: groups but its journey guide has no phaseGroups/.test(e))) throw new Error(`rail not caught: ${rail.errors.join("; ")}`);
  }],
  ["Fieldwork: title, confidence slider, and every lesson's plate on its first item only", async () => {
    const built = readFileSync(join(tmp, "a", "index.html"), "utf8");
    if (!built.includes("<title>Fieldwork · The Field Guide</title>")) throw new Error("the built <title> is not Fieldwork · The Field Guide");
    buildGame({ mode: "review", outDir: join(tmp, "plate") });
    const { dom, doc, errors } = await openGame(join(tmp, "plate", "game-review.html"));
    if (doc.title !== "Fieldwork · The Field Guide") throw new Error(`document title: ${doc.title}`);
    const open = (id: string) => {
      // A lesson in a case that isn't chosen yet: choose its case first.
      for (const c of doc.querySelector(`[data-l="${id}"]`) ? [] : [...doc.querySelectorAll("[data-case]")].map((b: any) => b.dataset.case)) {
        (doc.querySelector(`[data-case="${c}"]`) as any).click();
        if (doc.querySelector(`[data-l="${id}"]`)) break;
      }
      (doc.querySelector(`[data-l="${id}"]`) as any).click(); (doc.getElementById("go") as any).click();
    };
    open("5e-1-willow");
    if (!doc.querySelector("#stage .plate-card svg.plate")) throw new Error("5e-1-willow: no plate on the first item");
    if (!doc.querySelector('#stage input[type=range]#conf')) throw new Error("5e-1-willow: the predict item has no confidence slider");
    const tag = doc.querySelector("#stage .phtag")?.textContent ?? "";
    if (!/Engage · Predict/i.test(tag)) throw new Error(`phase tag: ${tag}`);
    if (!/^Fieldwork · /.test(doc.getElementById("hudPath").textContent)) throw new Error("no Fieldwork line in the HUD");
    if (doc.getElementById("privacy").hidden) throw new Error("no privacy line on a lesson screen");
    (doc.querySelector(".opts .opt") as any).click(); (doc.getElementById("go") as any).click();
    if (!doc.querySelector(".opts .opt .vd")) throw new Error("a marked option has no text verdict");
    (doc.getElementById("go") as any).click();
    if (doc.querySelector("#stage .plate-card")) throw new Error("the plate shows on the second item too");
    (doc.getElementById("toMap") as any).click();
    open("5e-2-cells");
    if (!doc.querySelector('#stage input[type=range]#conf')) throw new Error("5e-2-cells: no confidence slider");
    const cells = doc.querySelector("#stage .plate-card svg.plate");
    if (!cells || cells.querySelector("text") || !/microscope/.test(cells.getAttribute("aria-label") ?? "")) throw new Error("5e-2-cells: no plate, or a plate with text or no description");
    (doc.getElementById("toMap") as any).click();
    open("adi-1-leaf-litter");
    const leaf = doc.querySelector("#stage .plate-card svg.plate");
    if (!leaf) throw new Error("adi-1-leaf-litter: no plate on the first item");
    if (leaf.querySelector("text")) throw new Error("adi-1-leaf-litter: the plate should carry no text or numbers");
    if (!/pitfall traps/.test(leaf.getAttribute("aria-label") ?? "")) throw new Error("adi-1-leaf-litter: the plate has no description");
    (doc.querySelector(".opts .opt") as any).click(); (doc.getElementById("go") as any).click(); (doc.getElementById("go") as any).click();
    if (doc.querySelector("#stage .plate-card")) throw new Error("adi-1-leaf-litter shows the plate on its second item too");
    (doc.getElementById("toMap") as any).click();
    open("poe-1-yeast");
    const yeast = doc.querySelector("#stage .plate-card svg.plate");
    if (!yeast || yeast.querySelector("text") || !/limp balloons/.test(yeast.getAttribute("aria-label") ?? "")) throw new Error("poe-1-yeast: no plate, or a plate with text or no description");
    (doc.getElementById("toMap") as any).click();
    open("poe-2-hands");
    const hands = doc.querySelector("#stage .plate-card svg.plate");
    if (!hands || hands.querySelector("text") || !/UV torch/.test(hands.getAttribute("aria-label") ?? "")) throw new Error("poe-2-hands: no plate, or a plate with text or no description");
    // The later 5E, ADI and Choosing a model lessons: each opens with a described plate and no text.
    const later: [string, any][] = [];
    for (const [id, words] of [["5e-3-outbreak", /shield badge/], ["5e-4-labels", /ring binder/], ["5e-5-build", /planning board/], ["5e-6-prac-day", /thinking wall/],
      ["adi-2-noise", /lined with a soft material/], ["adi-3-review", /swapping their reports/], ["adi-4-build", /ADI routine of eight stages/], ["adi-5-argument-day", /Two whiteboards/],
      ["select-1-which", /Eleven question cards/], ["select-2-dial", /two calendars/], ["select-3-argue", /Models nested/],
      ["swh-1-spinners", /paper spinner and a crumpled ball/], ["swh-2-bottles", /Four reusable drink bottles/], ["swh-3-bottles", /arrow runs from one notebook/],
      ["swh-4-bottles", /planning board with seven columns/], ["swh-5-bottles", /closed folder/], ["swh-2-duckweed", /creek after rain/i],
      ["swh-3-duckweed", /folded reading sheet/], ["swh-4-duckweed", /cups of duckweed beside it/], ["swh-5-duckweed", /folded reading on it/],
      ["select-4-routine", /signpost at a fork/]] as const) {
      (doc.getElementById("toMap") as any).click();
      open(id);
      const svg = doc.querySelector("#stage .plate-card svg.plate");
      if (!svg || svg.querySelector("text") || !words.test(svg.getAttribute("aria-label") ?? "")) throw new Error(`${id}: no plate, or a plate with text or no description`);
      later.push([id, svg]);
      // The plate shows on the first item only (checked where the first item is a card that advances on its own).
      const go = doc.getElementById("go") as any;
      if (!go.disabled && /^(Start|Got it)$/.test(go.textContent)) {
        go.click();
        if (doc.querySelector("#stage .plate-card")) throw new Error(`${id} shows the plate on its second item too`);
      }
    }
    // Every published lesson now has a plate.
    const plated = new Set(later.map(([id]) => id).concat(["5e-1-willow", "5e-2-cells", "poe-1-yeast", "poe-2-hands", "adi-1-leaf-litter"]));
    const bare = loadGame().lessons.filter((l) => l.status === "published" && !plated.has(l.id)).map((l) => l.id);
    if (bare.length) throw new Error(`lessons without a plate: ${bare.join(", ")}`);
    // Every plate keeps its shapes to itself: no <use> points outside its own <defs>.
    for (const [id, svg] of [["5e-2-cells", cells], ["poe-1-yeast", yeast], ["poe-2-hands", hands], ["adi-1-leaf-litter", leaf], ...later] as const)
      (svg as any).querySelectorAll("use").forEach((u: any) => { const ref = u.getAttribute("href").slice(1); if (!(svg as any).querySelector(`[id="${ref}"]`)) throw new Error(`${id}: <use> points at #${ref}, which isn't in the plate`); });
    if (errors.length) throw new Error(errors.join("; "));
    dom.window.close();
  }],
  ["a path with cases: shared lessons, a case chooser, each case its own run; case cards and tables render", async () => {
    // Fixture: the ADI path split into two cases. Lesson 1 shared; case a holds lessons 2–3, case b lessons 4–5 renumbered 2–3.
    const dir = gameCopy("cases");
    const cfg = yaml.load(readFileSync(join(dir, "game.yaml"), "utf8")) as any;
    cfg.paths.find((p: any) => p.id === "adi").tracks = [{ id: "a", title: "Case A", blurb: "The first case." }, { id: "b", title: "Case B", blurb: "The second case." }];
    writeFileSync(join(dir, "game.yaml"), yaml.dump(cfg));
    const put = (f: string, edit: (l: any) => void) => { const l = rawLesson(f); edit(l); writeFileSync(join(dir, f), yaml.dump(l)); };
    put("adi-2-noise.yaml", (l) => (l.track = "a"));
    put("adi-3-review.yaml", (l) => (l.track = "a"));
    put("adi-4-build.yaml", (l) => { l.track = "b"; l.order = 2; });
    put("adi-5-argument-day.yaml", (l) => { l.track = "b"; l.order = 3; });
    put("adi-1-leaf-litter.yaml", (l) => {
      l.items.unshift({ id: "case", type: "case", at: "task-question", processing: "Retrieval", kind: "The case", title: "The schoolyard",
        setting: { who: "Year 10 · Biology", text: "A class compares two sites." }, lead: "Groups set pitfall traps overnight.",
        table: { caption: "Catch by site", head: ["Site", "Animals", "Kinds"], rows: [["Oval edge", "118", "3"], ["Leaf litter", "41", "9"]] },
        sofar: [{ phaseId: "task-question", when: "Lesson 1", text: "The question was posed." }, { phaseId: "design-data", when: "Lesson 2", text: "Groups planned." }],
        you: "You're on placement." });
      l.items[1].table = { caption: "Catch by site", head: ["Site", "Animals", "Kinds"], rows: [["Oval edge", "118", "3"], ["Leaf litter", "41", "9"]] };
    });
    const c = loadGame({ gameDir: dir });
    if (c.errors.length) throw new Error(c.errors.join("; "));
    buildGame({ mode: "review", outDir: join(tmp, "cases"), content: c });
    const { dom, doc, errors } = await openGame(join(tmp, "cases", "game-review.html"));
    const shown = (id: string) => !!doc.querySelector(`[data-l="${id}"]`);
    const pressed = () => (doc.querySelector('[data-case^="adi|"][aria-pressed="true"]') as any)?.dataset.case;
    if (doc.querySelectorAll('[data-case^="adi|"]').length !== 2) throw new Error("no case chooser with two cases");
    if (pressed() !== "adi|a" || !shown("adi-1-leaf-litter") || !shown("adi-2-noise") || shown("adi-4-build")) throw new Error("the map doesn't open on the first case with the shared lesson");
    (doc.querySelector('[data-case="adi|b"]') as any).click();
    if (pressed() !== "adi|b" || !shown("adi-4-build") || shown("adi-2-noise") || !shown("adi-1-leaf-litter")) throw new Error("choosing case B didn't swap the case's lessons");
    if (JSON.parse(dom.window.localStorage.getItem("lxdune-play-v1")).tracks?.adi !== "b") throw new Error("the chosen case isn't remembered");
    // The case card, then a results table with real table markup.
    (doc.querySelector('[data-l="adi-1-leaf-litter"]') as any).click(); (doc.getElementById("go") as any).click();
    if (doc.querySelectorAll("#stage .sofar li").length !== 2 || !doc.querySelector("#stage .you") || !doc.querySelector("#stage .dtable caption")) throw new Error("the case card is missing its parts");
    if (doc.getElementById("go").textContent !== "Start") throw new Error("the case card's button doesn't say Start");
    (doc.getElementById("go") as any).click();
    const t = doc.querySelector("#stage .dtable table");
    if (!t || t.querySelectorAll('thead th[scope="col"]').length !== 3 || t.querySelectorAll('tbody th[scope="row"]').length !== 2) throw new Error("the results table is missing or not marked up with scopes");
    // A fully published copy with cases validates (the student build's numbering and track rules hold).
    const pub = gameCopy("cases-pub");
    cpSync(dir, pub, { recursive: true });
    for (const f of ["adi-1-leaf-litter.yaml", "adi-2-noise.yaml", "adi-3-review.yaml", "adi-4-build.yaml", "adi-5-argument-day.yaml"]) {
      const l = yaml.load(readFileSync(join(pub, f), "utf8")) as any;
      l.status = "published"; l.provenance = { source: "ai-drafted-reviewed", authors: ["Claude"], reviewedBy: ["Test"], reviewedOn: "2026-10-08" };
      writeFileSync(join(pub, f), yaml.dump(l));
    }
    const pc = loadGame({ gameDir: pub });
    if (pc.errors.length) throw new Error(pc.errors.join("; "));
    // Bad tracks are refused: an undeclared track, and a gap in one case's numbering.
    const bad = gameCopy("cases-bad"); cpSync(dir, bad, { recursive: true });
    const l5 = yaml.load(readFileSync(join(bad, "adi-5-argument-day.yaml"), "utf8")) as any; l5.order = 4; writeFileSync(join(bad, "adi-5-argument-day.yaml"), yaml.dump(l5));
    const l4 = yaml.load(readFileSync(join(bad, "adi-4-build.yaml"), "utf8")) as any; l4.track = "z"; writeFileSync(join(bad, "adi-4-build.yaml"), yaml.dump(l4));
    const be = loadGame({ gameDir: bad }).errors.join("; ");
    if (!/track "z" is not one of path adi's tracks/.test(be) || !/track b: lesson orders must run/.test(be)) throw new Error(`bad tracks not caught: ${be}`);
    if (errors.length) throw new Error(errors.join("; "));
    dom.window.close();
  }],
  ["the game's dialLevel() matches the Reckoner's guidance dial in templates/app.js, for every class", () => {
    const app = readFileSync(join(PKG_ROOT, "templates", "app.js"), "utf8");
    const src = app.slice(app.indexOf("function dialLevel("), app.indexOf("function renderDial("));
    const c = loadGame();
    const g = dialGuide(c.guides)!;
    const phases = g.phases.slice().sort((a, b) => a.order - b.order);
    const appDial = new Function("HEUR", "dialPhase", `${src}; return dialLevel;`)(g.reckoner.dialHeuristic, (id: string) => phases.find((p) => p.id === id));
    const opts = (id: string) => c.reckoner.dims.find((d) => d.id === id)!.options.map((o) => o[0]);
    let n = 0;
    for (const ready of opts("ready")) for (const conf of opts("conf")) for (const time of opts("time")) {
      const a = { ready, conf, time }, mine = dialLevel(g, a)!, theirs = appDial(a);
      if (mine.phaseId !== theirs.phaseId || mine.total !== theirs.total || !!mine.capped !== !!theirs.capped) throw new Error(`${JSON.stringify(a)}: game ${mine.phaseId} ${mine.total} vs Reckoner ${theirs.phaseId} ${theirs.total}`);
      n++;
    }
    if (n < 36) throw new Error(`only ${n} classes compared`);
    // Each setting gives one fewer element than the one before: confirmation all three, open none.
    const el = dialElements(g);
    if (phases.map((p) => el[p.id].length).join("") !== "3210") throw new Error(`settings give ${JSON.stringify(el)}`);
  }],
  ["a dial answer the guidance dial disagrees with, or a dial item missing a setting's feedback, is refused", () => {
    const bad = loadGame({ gameDir: gameCopy("bad-dial", (l) => (l.items.find((i: any) => i.id === "class-y7").answer = "guided"), "select-5-set-dial.yaml") });
    if (!bad.errors.some((e) => /the Reckoner's guidance dial gives "structured"/.test(e))) throw new Error(`not caught: ${bad.errors.join("; ")}`);
    const fb = loadGame({ gameDir: gameCopy("bad-dial-fb", (l) => delete l.items.find((i: any) => i.type === "dial").fb.open, "loi-1-who-holds.yaml") });
    if (!fb.errors.some((e) => /fb has no entry for setting "open"/.test(e))) throw new Error(`not caught: ${fb.errors.join("; ")}`);
    const rail = gameCopy("bad-dial-rail");
    const cfg = yaml.load(readFileSync(join(rail, "game.yaml"), "utf8")) as any;
    cfg.paths.find((p: any) => p.id === "poe").rail = "dial";
    writeFileSync(join(rail, "game.yaml"), yaml.dump(cfg));
    if (!loadGame({ gameDir: rail }).errors.some((e) => /rail: dial but its journey guide is not a guidance dial/.test(e))) throw new Error("a dial rail on a sequence guide was accepted");
  }],
  ["the dial: switches set the setting, a skipped handover can't be checked, and the dial rail marks one setting", async () => {
    buildGame({ mode: "review", outDir: join(tmp, "dial") });
    const { dom, doc, errors } = await openGame(join(tmp, "dial", "game-review.html"));
    const go = () => doc.getElementById("go") as any;
    (doc.querySelector('[data-l="loi-1-who-holds"]') as any).click(); go().click();
    // Walk to the first dial item.
    for (let n = 0; n < 10 && !doc.querySelector(".dialsw"); n++) {
      (doc.querySelector(".opts .opt:not([disabled])") as any)?.click(); go().click();
      if (doc.querySelector(".dock.good, .dock.bad")) go().click();
    }
    if (!doc.querySelector(".dialsw")) throw new Error("no dial item reached");
    const cells = [...doc.querySelectorAll("#rail div")];
    if (cells.map((d: any) => d.textContent).join("|") !== "Confirmation|Structured|Guided|Open") throw new Error(`rail shows ${cells.map((d: any) => d.textContent).join(", ")}`);
    if (doc.querySelectorAll("#rail div.now").length !== 1 || doc.querySelectorAll("#rail div.done").length) throw new Error("the dial rail should mark one setting and nothing as done");
    const sw = [...doc.querySelectorAll(".dialsw .opt")] as any[];
    if (sw.length !== 3 || sw.some((b) => b.getAttribute("role") !== "switch")) throw new Error("expected three switches");
    const on = () => doc.querySelector("#dialread .dialcells div.on")?.textContent ?? null;
    if (on() !== "Open" || go().disabled) throw new Error(`no switches should read Open and be checkable (got ${on()})`);
    sw[2].click(); // the expected result only: a skipped handover
    if (on() !== null || !go().disabled) throw new Error("result without method and question should not be a setting");
    sw[0].click(); sw[1].click(); // all three: confirmation, this item's answer
    if (on() !== "Confirmation" || sw[0].getAttribute("aria-checked") !== "true") throw new Error(`all three should read Confirmation (got ${on()})`);
    go().click();
    if (!doc.querySelector(".dock.good")) throw new Error("the right setting wasn't marked correct");
    if (errors.length) throw new Error(errors.join("; "));
    dom.window.close();
  }],
  ["the review copy plays every lesson to the end in jsdom", async () => {
    buildGame({ mode: "review", outDir: join(tmp, "review") });
    const { dom, doc, errors } = await openGame(join(tmp, "review", "game-review.html"));
    const w = dom.window;
    for (const l of loadGame().lessons) {
      await playLesson(doc, l.id);
      if (errors.length) throw new Error(`${l.id}: ${errors.join("; ")}`);
      (doc.getElementById("toMap") as any).click();
    }
    const saved = JSON.parse(w.localStorage.getItem("lxdune-play-v1"));
    const done = Object.values(saved.lessons).filter((r: any) => r.completed).length;
    if (done !== lessonFiles.length) throw new Error(`progress shows ${done} of ${lessonFiles.length} lessons completed`);
  }],
];

(async () => {
  let failed = 0;
  for (const [name, fn] of cases) {
    try { await fn(); console.log(`✓ ${name}`); }
    catch (e) { failed++; console.log(`✗ ${name}\n    ${(e as Error).message}`); }
  }
  rmSync(tmp, { recursive: true, force: true });
  console.log(failed ? `\n${failed} game test(s) failed` : `\nAll ${cases.length} game tests passed`);
  process.exit(failed ? 1 : 0);
})();
