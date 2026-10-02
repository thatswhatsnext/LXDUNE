/**
 * The game at /play/: load and check the lessons in content/game, and build the page.
 *
 *   site    play/index.html: one self-contained file with published lessons only.
 *   review  dist/review/game-review.html: every lesson, drafts included, with a review banner.
 *
 * Lessons point into their path's guide by id. checkLesson() resolves every reference against the
 * guide and the build copies the look-for wording the page needs, so the page never needs the guide
 * and a renamed look-for fails the build instead of a lesson. Output is deterministic.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import yaml from "js-yaml";
import { GameConfig, GameLesson, MASTERY } from "../../src/schema/game-lesson";
import type { ModelGuide } from "../../src/schema/model-guide";
import { loadGuides, PKG_ROOT } from "./build";

export const GAME_DIR = join(PKG_ROOT, "content", "game");

type Issues = string[];
const readYaml = (dir: string, file: string) => yaml.load(readFileSync(join(dir, file), "utf8"));
const zodIssues = (file: string, err: { issues: { path: (string | number)[]; message: string }[] }) =>
  err.issues.map((i) => `${file}: ${i.path.join(".") || "(root)"}: ${i.message}`);

export interface GameContent {
  config: GameConfig;
  lessons: GameLesson[];
  guides: Map<string, ModelGuide>;
  errors: Issues;
}

/** Load config and every lesson, schema-check them, then check every reference into the guides. */
export function loadGame(opts: { gameDir?: string; guidesDir?: string } = {}): GameContent {
  const gameDir = opts.gameDir ?? GAME_DIR;
  const guidesDir = opts.guidesDir ?? join(PKG_ROOT, "content", "guides");
  const errors: Issues = [];
  const guides = new Map(loadGuides(guidesDir, true, () => {}).map((g) => [g.id, g]));

  let config: GameConfig | undefined;
  try {
    const r = GameConfig.safeParse(readYaml(gameDir, "game.yaml"));
    if (r.success) config = r.data;
    else errors.push(...zodIssues("game.yaml", r.error));
  } catch (e: any) {
    errors.push(`game.yaml: ${e.code === "ENOENT" ? "missing" : `YAML error: ${e.reason || e.message}`}`);
  }

  const lessons: GameLesson[] = [];
  for (const file of readdirSync(gameDir).filter((f) => /\.ya?ml$/.test(f) && f !== "game.yaml").sort()) {
    let raw: unknown;
    try {
      raw = readYaml(gameDir, file);
    } catch (e: any) {
      errors.push(`${file}: YAML error: ${e.reason || e.message}${e.mark ? ` (line ${e.mark.line + 1})` : ""}`);
      continue;
    }
    const r = GameLesson.safeParse(raw);
    if (!r.success) {
      errors.push(...zodIssues(file, r.error));
      continue;
    }
    if (file.replace(/\.ya?ml$/, "") !== r.data.id) errors.push(`${file}: file name must match id "${r.data.id}"`);
    lessons.push(r.data);
  }

  if (config) {
    for (const p of config.paths) if (!guides.has(p.id)) errors.push(`game.yaml: path "${p.id}" has no guide`);
    for (const l of lessons) {
      if (!config.paths.some((p) => p.id === l.path)) errors.push(`${l.id}: path "${l.path}" is not listed in game.yaml`);
      const g = guides.get(l.path);
      if (g) errors.push(...checkLesson(l, g));
    }
    // Lesson order on each path runs 1, 2, 3… with no gaps or repeats, drafts included.
    for (const p of config.paths) {
      const orders = lessons.filter((l) => l.path === p.id).map((l) => l.order).sort((a, b) => a - b);
      orders.forEach((o, i) => o !== i + 1 && errors.push(`path ${p.id}: lesson orders must run 1, 2, 3… (found ${orders.join(", ")})`));
    }
  }
  lessons.sort((a, b) => a.path.localeCompare(b.path) || a.order - b.order);
  return { config: config!, lessons, guides, errors: [...new Set(errors)] };
}

/** Every id a lesson uses must exist in its guide; spot items must give feedback for every phase. */
export function checkLesson(l: GameLesson, g: ModelGuide): Issues {
  const out: Issues = [];
  const phases = new Set(g.phases.map((p) => p.id));
  const lookFors = new Set(g.phases.flatMap((p) => p.lookFors.map((x) => x.id)));
  const examples = new Set(g.phases.flatMap((p) => p.examples.map((x) => x.id)));
  const sequences = new Set(g.workedSequences.map((s) => s.id));
  const mis = new Set(g.misapplications.map((m) => m.id));
  const need = (set: Set<string>, id: string, what: string, where: string) =>
    !set.has(id) && out.push(`${l.id} ${where}: ${what} "${id}" is not in the ${g.id} guide`);
  const refs = (r: GameLesson["builtOn"] | undefined, where: string) => {
    if (!r) return;
    r.phaseIds.forEach((id) => need(phases, id, "phase", where));
    r.lookForIds.forEach((id) => need(lookFors, id, "look-for", where));
    r.exampleIds.forEach((id) => need(examples, id, "example", where));
    r.sequenceIds.forEach((id) => need(sequences, id, "worked sequence", where));
    r.misapplicationIds.forEach((id) => need(mis, id, "misapplication", where));
  };
  refs(l.builtOn, "builtOn");
  for (const it of l.items) {
    const where = `item ${it.id}`;
    refs(it.refs, where);
    it.plan?.forEach((row) => need(phases, row.phaseId, "phase", `${where} plan`));
    const all = [it, ...("variants" in it ? (it.variants as any[]) : [])];
    all.forEach((v: any, j) => {
      const at = j ? `${where} variant ${j}` : where;
      if (it.type === "spot") {
        if (v.answer) need(phases, v.answer, "phase", at);
        if (v.fb) {
          Object.keys(v.fb).forEach((k) => need(phases, k, "phase", `${at} fb`));
          g.phases.forEach((p) => !(p.id in v.fb) && out.push(`${l.id} ${at}: fb has no entry for phase "${p.id}"`));
        }
      }
      if (it.type === "order") v.steps?.forEach((s: any) => need(phases, s.phaseId, "phase", `${at} steps`));
      if (it.type === "diagnose") [v.answer, ...(v.distractors ?? [])].filter(Boolean).forEach((id: string) => need(mis, id, "misapplication", at));
      if (it.type === "lookfor") [v.answer, ...(v.distractors ?? [])].filter(Boolean).forEach((id: string) => need(lookFors, id, "look-for", at));
      v.plan?.forEach((row: any) => need(phases, row.phaseId, "phase", `${at} plan`));
    });
    if (it.type === "concept") it.rows.forEach((r) => need(phases, r.phaseId, "phase", `${where} rows`));
  }
  if (l.guideSection === "sequences" && !l.builtOn.sequenceIds.length) out.push(`${l.id}: guideSection is sequences but builtOn names no worked sequence`);
  return out;
}

/** What the page receives: lessons plus the guide wording it shows (phase names, look-fors). */
export function gameData(c: GameContent, includeDrafts: boolean) {
  const shown = c.lessons.filter((l) => includeDrafts || l.status === "published");
  const pathIds = c.config.paths.map((p) => p.id);
  const guideFacts = Object.fromEntries(
    pathIds.map((id) => {
      const g = c.guides.get(id)!;
      return [id, {
        name: g.name,
        phases: g.phases.slice().sort((a, b) => a.order - b.order).map((p) => ({ id: p.id, name: p.name })),
        misapplications: Object.fromEntries(g.misapplications.map((m) => [m.id, { name: m.name, looksLike: m.looksLike, why: m.whyItUndermines, fix: m.fix }])),
        lookFors: Object.fromEntries(g.phases.flatMap((p) => p.lookFors.map((x) => [x.id, { phaseId: p.id, question: x.question, strong: x.strongEvidence, weak: x.weakEvidence }]))),
      }];
    }),
  );
  return {
    mastery: MASTERY,
    notice: c.config.notice,
    feedback: c.config.feedback,
    paths: c.config.paths.map((p) => ({
      ...p,
      guide: guideFacts[p.id],
      upcoming: c.lessons.filter((l) => l.path === p.id && !shown.includes(l)).length,
    })),
    lessons: shown.map((l) => ({
      id: l.id, path: l.path, order: l.order, title: l.title, summary: l.summary, level: l.level,
      version: l.version, status: l.status, guideSection: l.guideSection ?? null, items: l.items,
    })),
  };
}

/** JSON safe inside an inline <script>. */
const inlineJson = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");

export function buildGame(opts: { mode: "site" | "review"; outDir: string; content?: GameContent; templatesDir?: string }) {
  const c = opts.content ?? loadGame();
  if (c.errors.length) throw new Error(`Game content has ${c.errors.length} error(s):\n  ${c.errors.join("\n  ")}`);
  const templatesDir = opts.templatesDir ?? join(PKG_ROOT, "templates");
  const review = opts.mode === "review";
  const data = { ...gameData(c, review), review };
  const html = readFileSync(join(templatesDir, "game.html"), "utf8");
  const js = readFileSync(join(templatesDir, "game.js"), "utf8");
  if (!html.includes("<!--__GAME__-->")) throw new Error("templates/game.html is missing <!--__GAME__-->");
  const boot = `<script>window.GAME_DATA = ${inlineJson(data)};</script>\n<script>\n${js.replace(/<\/script/gi, "<\\/script")}</script>`;
  const name = review ? "game-review.html" : "index.html";
  const p = join(opts.outDir, name);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, html.replace("<!--__GAME__-->", boot));
  return { file: name, lessons: data.lessons.map((l) => `${l.id} v${l.version}${l.status === "published" ? "" : ` [${l.status}]`}`) };
}
