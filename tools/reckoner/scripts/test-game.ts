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
import { buildGame, checkLesson, GAME_DIR, loadGame } from "./lib/game";

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
      const issues = checkLesson(l, c.guides.get(l.path)!);
      if (issues.length) throw new Error(issues.join("; "));
    }
  }],
  ["the review copy plays every lesson to the end in jsdom", async () => {
    buildGame({ mode: "review", outDir: join(tmp, "review") });
    const file = join(tmp, "review", "game-review.html");
    const errors: string[] = [];
    const vc = new VirtualConsole();
    vc.on("jsdomError", (e: Error) => errors.push(e.message));
    // An http origin, so the page gets localStorage (file: URLs are opaque in jsdom).
    const dom = new JSDOM(readFileSync(file, "utf8"), {
      url: "https://lxdune.test/play/",
      runScripts: "dangerously",
      pretendToBeVisual: true,
      virtualConsole: vc,
      beforeParse(win: any) { win.scrollTo = () => {}; win.HTMLElement.prototype.focus = function () {}; },
      resources: { interceptors: [requestInterceptor(() => new Response("", { status: 200, headers: { "Content-Type": "text/css" } }))] },
    });
    const w = dom.window, doc = w.document;
    await wait(() => !!doc.querySelector("[data-l]") || errors.length > 0, "the path map");
    if (errors.length) throw new Error(errors.join("; "));
    const go = () => (doc.getElementById("go") as any).click();
    for (const l of loadGame().lessons) {
      (doc.querySelector(`[data-l="${l.id}"]`) as any).click();
      go();
      for (let step = 0; step < 80 && !doc.querySelector(".sum-head"); step++) {
        const slot = doc.querySelector("#pool .opt");
        if (slot) while (doc.querySelector("#pool .opt")) (doc.querySelector("#pool .opt") as any).click();
        else {
          const opt = doc.querySelector(".opts .opt:not([disabled])");
          if (opt) (opt as any).click();
        }
        go();
        if (doc.querySelector(".dock.good, .dock.bad")) go();
      }
      if (!doc.querySelector(".sum-head")) throw new Error(`${l.id} did not reach the results screen`);
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
