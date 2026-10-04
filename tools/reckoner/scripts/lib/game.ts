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
  reckoner: Reckoner;
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

  const reckoner = loadReckoner(guides);
  if (config) {
    for (const p of config.paths) {
      if (p.kind === "guide" && !guides.has(p.id)) errors.push(`game.yaml: path "${p.id}" has no guide`);
      if (p.kind === "select" && !p.journey) errors.push(`game.yaml: select path "${p.id}" needs a journey guide`);
      if (p.journey && !guides.has(p.journey)) errors.push(`game.yaml: path "${p.id}" journey "${p.journey}" has no guide`);
      p.models.forEach((m) => !guides.has(m) && errors.push(`game.yaml: path "${p.id}" model "${m}" has no guide`));
      p.requires.forEach((r) => !config!.paths.some((x) => x.id === r.path) && errors.push(`game.yaml: path "${p.id}" requires unknown path "${r.path}"`));
      if (p.rail === "groups" && !guides.get(journeyOf(p))?.phaseGroups.length) errors.push(`game.yaml: path "${p.id}" has rail: groups but its journey guide has no phaseGroups`);
    }
    for (const l of lessons) {
      const path = config.paths.find((p) => p.id === l.path);
      if (!path) { errors.push(`${l.id}: path "${l.path}" is not listed in game.yaml`); continue; }
      const g = guides.get(journeyOf(path));
      if (g) errors.push(...checkLesson(l, g, { guides, reckoner }));
      l.requires.forEach((r) => {
        if (!config!.paths.some((x) => x.id === r.path)) errors.push(`${l.id}: requires unknown path "${r.path}"`);
        else if (r.path === l.path) errors.push(`${l.id}: a lesson can't require its own path`);
      });
    }
    // Lesson order on each path runs 1, 2, 3… with no gaps or repeats, drafts included.
    for (const p of config.paths) {
      const orders = lessons.filter((l) => l.path === p.id).map((l) => l.order).sort((a, b) => a - b);
      orders.forEach((o, i) => o !== i + 1 && errors.push(`path ${p.id}: lesson orders must run 1, 2, 3… (found ${orders.join(", ")})`));
    }
  }
  const pathIndex = (id: string) => config?.paths.findIndex((p) => p.id === id) ?? 0;
  lessons.sort((a, b) => pathIndex(a.path) - pathIndex(b.path) || a.order - b.order);
  return { config: config!, lessons, guides, reckoner, errors: [...new Set(errors)] };
}

/** The guide whose phases make a path's lesson rail. */
export const journeyOf = (p: GameConfig["paths"][number]) => p.journey ?? p.id;

/* ------------------------------------------------------------------ */
/* The reckoner as answer key                                          */
/* ------------------------------------------------------------------ */

type Dim = { id: string; short: string; weight: number; multi?: number; options: [string, string][] };
type Profile = Record<string, string | string[]>;
export interface Reckoner { dims: Dim[]; profiles: Map<string, Record<string, number[]>> }

/** The reckoner's questions (content/questions.json) and each guide's fit profile. */
export function loadReckoner(guides: Map<string, ModelGuide>): Reckoner {
  const dims: Dim[] = JSON.parse(readFileSync(join(PKG_ROOT, "content", "questions.json"), "utf8")).DIMS;
  const profiles = new Map<string, Record<string, number[]>>();
  for (const [id, g] of guides) if (g.reckoner.fitProfile) profiles.set(id, g.reckoner.fitProfile as Record<string, number[]>);
  return { dims, profiles };
}

/** A straight port of dimScore() in templates/app.js; test-game.ts checks the two agree. */
export function dimScore(p: Record<string, number[]>, d: Dim, a: Profile): number | null {
  const v = a[d.id];
  const sel = Array.isArray(v) ? v : v ? [v] : [];
  if (!sel.length) return null;
  return sel.reduce((s, x) => s + +p[d.id][d.options.findIndex((o) => o[0] === x)], 0) / sel.length;
}
/** A straight port of fit() in templates/app.js, at normal importance for every question. */
export function fit(p: Record<string, number[]>, a: Profile, dims: Dim[]): number {
  let num = 0, den = 0;
  for (const d of dims) {
    const s = dimScore(p, d, a);
    if (s === null) continue;
    num += d.weight * s;
    den += d.weight * 3;
  }
  return den ? num / den : 0;
}

/** Below this gap between the top two candidates, a select item is too close to call and is refused. */
export const MIN_MARGIN = 0.03;

function checkProfile(a: Profile, dims: Dim[], where: string): Issues {
  const out: Issues = [];
  for (const [k, v] of Object.entries(a)) {
    const d = dims.find((x) => x.id === k);
    if (!d) { out.push(`${where}: "${k}" is not a reckoner question`); continue; }
    const vals = Array.isArray(v) ? v : [v];
    if (Array.isArray(v) !== !!d.multi) out.push(`${where}: "${k}" takes ${d.multi ? "a list" : "a single value"}`);
    vals.forEach((x) => !d.options.some((o) => o[0] === x) && out.push(`${where}: "${x}" is not an option for "${k}"`));
  }
  return out;
}

/** What the reckoner says for this class among these candidates. A "host+poe" candidate wins when the host model tops the ranking and the reckoner's own nesting rule (a robust, documented misconception) adds a POE. */
export function reckonerAnswer(a: Profile, candidates: string[], r: Reckoner) {
  const singles = candidates.filter((c) => !c.includes("+"));
  const fits = Object.fromEntries(singles.map((m) => [m, fit(r.profiles.get(m)!, a, r.dims)]));
  const ranked = singles.slice().sort((x, y) => fits[y] - fits[x]);
  const margin = fits[ranked[0]] - fits[ranked[1]];
  const top = ranked[0];
  const nested = `${top}+poe`;
  const answer = candidates.includes(nested) && a.misc === "robust" && top !== "poe" ? nested : top;
  return { fits, top, margin, answer };
}

/** Does this question favour the answer's model over every other single candidate? */
export function favours(a: Profile, dimId: string, answer: string, candidates: string[], r: Reckoner) {
  const host = answer.split("+")[0];
  if (answer.includes("+") && dimId === "misc") return true; // the dimension that triggers the nesting rule
  const d = r.dims.find((x) => x.id === dimId)!;
  const mine = dimScore(r.profiles.get(host)!, d, a)!;
  const others = candidates.filter((c) => !c.includes("+") && c !== host).map((c) => dimScore(r.profiles.get(c)!, d, a)!);
  return mine > Math.max(...others);
}

/** The nesting record for model inside host at a phase, from either guide. */
export function nestingRecord(model: string, host: string, guides: Map<string, ModelGuide>) {
  const m = guides.get(model)?.nesting.find((n) => n.modelId === host && n.role === "nests-in");
  if (m) return { phaseId: m.phaseId, how: m.how };
  const h = guides.get(host)?.nesting.find((n) => n.modelId === model && n.role !== "nests-in");
  return h ? { phaseId: h.phaseId, how: h.how } : undefined;
}

/** Every id a lesson uses must exist in its guide; spot items must give feedback for every phase; select, flip and nest items must agree with the reckoner and the guides. */
export function checkLesson(l: GameLesson, g: ModelGuide, ctx?: { guides: Map<string, ModelGuide>; reckoner: Reckoner }): Issues {
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
    need(phases, it.at, "journey phase (at)", where);
    refs(it.refs, where);
    it.plan?.forEach((row) => need(phases, row.phaseId, "phase", `${where} plan`));
    const all = [it, ...("variants" in it ? (it.variants as any[]) : [])];
    all.forEach((v: any, j) => {
      const at = j ? `${where} variant ${j}` : where;
      if (it.type === "spot") {
        if (v.answer) need(phases, v.answer, "phase", at);
        const among: string[] | undefined = v.among ?? (it as any).among;
        among?.forEach((id) => need(phases, id, "phase", `${at} among`));
        const offered = among ?? g.phases.map((p) => p.id);
        const fb = v.fb ?? (it as any).fb;
        if (v.fb || v.among) {
          Object.keys(fb).forEach((k) => need(phases, k, "phase", `${at} fb`));
          offered.forEach((id) => !(id in fb) && out.push(`${l.id} ${at}: fb has no entry for phase "${id}"`));
          if (among) Object.keys(fb).forEach((k) => !among.includes(k) && out.push(`${l.id} ${at}: fb gives "${k}", which is not offered (among)`));
        }
      }
      if (it.type === "order") v.steps?.forEach((s: any) => need(phases, s.phaseId, "phase", `${at} steps`));
      if (it.type === "diagnose") [v.answer, ...(v.distractors ?? [])].filter(Boolean).forEach((id: string) => need(mis, id, "misapplication", at));
      if (it.type === "lookfor") [v.answer, ...(v.distractors ?? [])].filter(Boolean).forEach((id: string) => need(lookFors, id, "look-for", at));
      v.plan?.forEach((row: any) => need(phases, row.phaseId, "phase", `${at} plan`));
    });
    if (it.type === "concept") it.rows.forEach((r) => need(phases, r.phaseId, "phase", `${where} rows`));
    if (it.type === "build") out.push(...checkBuild(l, it, g));
    if (it.type === "sim") out.push(...checkSim(l, it, g));
    if (!ctx) continue;
    const { guides, reckoner: r } = ctx;
    if (it.type === "select" || it.type === "flip") {
      const singles = it.candidates.flatMap((c) => c.split("+"));
      const missing = singles.filter((m) => !r.profiles.has(m));
      if (missing.length) { out.push(`${l.id} ${where}: no reckoner fit profile for ${missing.join(", ")}`); continue; }
      const bad = checkProfile(it.profile, r.dims, `${l.id} ${where} profile`);
      if (bad.length) { out.push(...bad); continue; }
    }
    if (it.type === "select") {
      it.candidates.filter((c) => c.includes("+")).forEach((c) => {
        const [host, model] = c.split("+");
        if (!nestingRecord(model, host, guides)) out.push(`${l.id} ${where}: no nesting record puts ${model} inside ${host}`);
      });
      const k = reckonerAnswer(it.profile, it.candidates, r);
      if (k.margin < MIN_MARGIN) out.push(`${l.id} ${where}: the reckoner can't separate the candidates for this class (gap ${k.margin.toFixed(3)}); change the profile`);
      if (k.answer !== it.answer) out.push(`${l.id} ${where}: answer is "${it.answer}" but the reckoner gives "${k.answer}" (${Object.entries(k.fits).map(([m, f]) => `${m} ${Math.round(f * 100)}%`).join(", ")})`);
      it.reasons.forEach((rs, i) => {
        if (rs.dim === null) { if (rs.ok) out.push(`${l.id} ${where} reason ${i}: a preference reason (dim: null) can't be correct`); return; }
        if (!(rs.dim in it.profile)) { out.push(`${l.id} ${where} reason ${i}: "${rs.dim}" is not in the class profile`); return; }
        const f = favours(it.profile, rs.dim, k.answer, it.candidates, r);
        if (f !== rs.ok) out.push(`${l.id} ${where} reason ${i}: marked ${rs.ok ? "correct" : "wrong"}, but ${rs.dim} ${f ? "does" : "does not"} favour ${k.answer} in the reckoner`);
      });
      if (!it.reasons.some((x) => x.ok)) out.push(`${l.id} ${where}: at least one reason must be correct`);
    }
    if (it.type === "flip") {
      const base = reckonerAnswer(it.profile, it.candidates, r);
      if (base.margin < MIN_MARGIN) out.push(`${l.id} ${where}: the starting class is too close to call (gap ${base.margin.toFixed(3)})`);
      it.changes.forEach((c, i) => {
        const bad = checkProfile({ [c.dim]: c.value }, r.dims, `${l.id} ${where} change ${i}`);
        if (bad.length) return out.push(...bad);
        const after = reckonerAnswer({ ...it.profile, [c.dim]: c.value }, it.candidates, r);
        const flips = after.top !== base.top;
        if (after.margin < MIN_MARGIN) out.push(`${l.id} ${where} change ${i} (${c.dim}): leaves the candidates too close to call (gap ${after.margin.toFixed(3)}); pick a clearer change`);
        else if (flips !== (i === it.answer)) out.push(`${l.id} ${where} change ${i} (${c.dim}): ${flips ? "flips" : "does not flip"} the reckoner's choice from ${base.top}, but the item says it ${i === it.answer ? "should" : "shouldn't"}`);
      });
    }
    if (it.type === "nest") {
      const host = guides.get(it.host);
      if (!host) { out.push(`${l.id} ${where}: host "${it.host}" has no guide`); continue; }
      if (!host.phases.some((p) => p.id === it.answer)) out.push(`${l.id} ${where}: "${it.answer}" is not a phase of ${it.host}`);
      const rec = nestingRecord(it.model, it.host, guides);
      if (!rec) out.push(`${l.id} ${where}: no nesting record puts ${it.model} inside ${it.host}`);
      else if (rec.phaseId !== it.answer) out.push(`${l.id} ${where}: the guides nest ${it.model} at ${rec.phaseId} in ${it.host}, not ${it.answer}`);
    }
  }
  if (l.guideSection === "sequences" && !l.builtOn.sequenceIds.length) out.push(`${l.id}: guideSection is sequences but builtOn names no worked sequence`);
  return out;
}

type BuildItem = Extract<GameLesson["items"][number], { type: "build" }>;
type SimItem = Extract<GameLesson["items"][number], { type: "sim" }>;
const ordered = (g: ModelGuide) => g.phases.slice().sort((a, b) => a.order - b.order);

/**
 * The feature report for a placement (phase id -> card ids). Shared by the build check and the page,
 * which carries the same rules in templates/game.js; test-game.ts checks the two agree.
 */
export function buildReport(it: BuildItem, g: ModelGuide, placed: Record<string, string[]>) {
  const card = (id: string) => it.cards.find((c) => c.id === id)!;
  const met = new Set<string>();
  const flags: { mis: string; because: string }[] = [];
  const misplaced: { card: string; in: string; does: string }[] = [];
  const checkPhases = new Set<string>();
  for (const p of ordered(g)) {
    const ids = placed[p.id] ?? [];
    for (const id of ids) {
      const c = card(id);
      c.flaws.forEach((m) => flags.push({ mis: m, because: c.id }));
      if (c.kind === "check") { checkPhases.add(p.id); continue; }
      if (c.does && c.does !== p.id) { misplaced.push({ card: c.id, in: p.id, does: c.does }); continue; }
      if (!c.flaws.length) c.features.forEach((f) => met.add(f));
    }
    if (!ids.some((id) => card(id).kind === "activity") && it.missing[p.id]) flags.push({ mis: it.missing[p.id], because: `empty:${p.id}` });
  }
  if (it.formative) {
    if (checkPhases.size >= it.formative.minPhases) met.add(it.formative.lookFor);
    else flags.push({ mis: it.formative.flag, because: `checks:${checkPhases.size}` });
  }
  const missing = it.report.filter((f) => !met.has(f));
  return { met: it.report.filter((f) => met.has(f)), missing, flags, misplaced, clean: !flags.length && !misplaced.length && !missing.length };
}

function checkBuild(l: GameLesson, it: BuildItem, g: ModelGuide): Issues {
  const out: Issues = [];
  const where = `${l.id} item ${it.id}`;
  const phases = new Set(g.phases.map((p) => p.id));
  const lookFors = new Set(g.phases.flatMap((p) => p.lookFors.map((x) => x.id)));
  const mis = new Set(g.misapplications.map((m) => m.id));
  const ids = new Set<string>();
  for (const c of it.cards) {
    if (ids.has(c.id)) out.push(`${where}: duplicate card "${c.id}"`);
    ids.add(c.id);
    if (c.kind === "activity" && !c.does) out.push(`${where} card ${c.id}: an activity card needs "does" (the phase whose job it does)`);
    if (c.kind === "check" && c.does) out.push(`${where} card ${c.id}: a check card can go in any phase, so it has no "does"`);
    if (c.does && !phases.has(c.does)) out.push(`${where} card ${c.id}: phase "${c.does}" is not in ${g.id}`);
    c.features.forEach((f) => !lookFors.has(f) && out.push(`${where} card ${c.id}: look-for "${f}" is not in ${g.id}`));
    c.flaws.forEach((m) => !mis.has(m) && out.push(`${where} card ${c.id}: misapplication "${m}" is not in ${g.id}`));
  }
  it.report.forEach((f) => !lookFors.has(f) && out.push(`${where} report: look-for "${f}" is not in ${g.id}`));
  Object.entries(it.missing).forEach(([p, m]) => {
    if (!phases.has(p)) out.push(`${where} missing: phase "${p}" is not in ${g.id}`);
    if (!mis.has(m)) out.push(`${where} missing: misapplication "${m}" is not in ${g.id}`);
  });
  if (it.formative) {
    if (!lookFors.has(it.formative.lookFor)) out.push(`${where} formative: look-for "${it.formative.lookFor}" is not in ${g.id}`);
    if (!mis.has(it.formative.flag)) out.push(`${where} formative: misapplication "${it.formative.flag}" is not in ${g.id}`);
  }
  if (out.length) return out;
  // Solvable: every sound activity in the phase it does, and the checks spread across the first phases.
  const placed: Record<string, string[]> = {};
  it.cards.filter((c) => c.kind === "activity" && !c.flaws.length).forEach((c) => (placed[c.does!] ??= []).push(c.id));
  const checks = it.cards.filter((c) => c.kind === "check" && !c.flaws.length);
  ordered(g).forEach((p, i) => checks[i] && (placed[p.id] ??= []).push(checks[i].id));
  const rep = buildReport(it, g, placed);
  if (!rep.clean) out.push(`${where}: no placement of the sound cards gives a clean report (missing ${rep.missing.join(", ") || "none"}; flags ${rep.flags.map((f) => f.mis).join(", ") || "none"})`);
  if (!it.cards.some((c) => c.flaws.length)) out.push(`${where}: include at least one flawed card, so the board has something to resist`);
  return out;
}

function checkSim(l: GameLesson, it: SimItem, g: ModelGuide): Issues {
  const out: Issues = [];
  const where = `${l.id} item ${it.id}`;
  const seq = g.workedSequences.find((s) => s.id === it.sequenceId);
  if (!seq) return [`${where}: worked sequence "${it.sequenceId}" is not in ${g.id}`];
  const nConc = seq.targetConceptions.length;
  const phases = new Set(g.phases.map((p) => p.id));
  const lookFors = new Set(g.phases.flatMap((p) => p.lookFors.map((x) => x.id)));
  const byId = new Map<string, SimItem["nodes"][number]>();
  it.nodes.forEach((n) => { if (byId.has(n.id)) out.push(`${where}: duplicate node "${n.id}"`); byId.set(n.id, n); });
  const conc = (i: number, at: string) => i >= nConc && out.push(`${where} ${at}: conception ${i} is past the end of ${seq.id}'s ${nConc} target conceptions`);
  for (const n of it.nodes) {
    const at = `node ${n.id}`;
    if (!phases.has(n.phase)) out.push(`${where} ${at}: phase "${n.phase}" is not in ${g.id}`);
    if (!n.choices.some((c) => c.good)) out.push(`${where} ${at}: at least one choice must be the better move`);
    if (n.said) conc(n.said.conception, at);
    n.choices.forEach((c, i) => {
      if (c.next !== "end" && !byId.has(c.next)) out.push(`${where} ${at} choice ${i}: next "${c.next}" is not a node`);
      if (c.lookFor && !lookFors.has(c.lookFor)) out.push(`${where} ${at} choice ${i}: look-for "${c.lookFor}" is not in ${g.id}`);
      [...c.surface, ...c.hide, ...c.challenge].forEach((x) => conc(x, `${at} choice ${i}`));
    });
  }
  const mins = it.endings.map((e) => e.minGood);
  if (!mins.includes(0)) out.push(`${where}: one ending needs minGood 0, so every run has an ending`);
  if (new Set(mins).size !== mins.length) out.push(`${where}: endings need different minGood values`);
  if (!byId.has(it.start)) return [...out, `${where}: start "${it.start}" is not a node`];
  if (out.length) return out;
  // Walk every path: no cycles, every node reachable, every run has 3 to 5 decisions and ends.
  const seen = new Set<string>();
  let best = 0;
  const walk = (id: string, depth: number, trail: string[]) => {
    if (id === "end") {
      if (depth < 3 || depth > 5) out.push(`${where}: the run ${trail.join(" → ")} has ${depth} decisions (needs 3 to 5)`);
      best = Math.max(best, depth);
      return;
    }
    if (trail.includes(id)) return out.push(`${where}: the path ${[...trail, id].join(" → ")} loops`);
    seen.add(id);
    byId.get(id)!.choices.forEach((c) => walk(c.next, depth + 1, [...trail, id]));
  };
  walk(it.start, 0, []);
  it.nodes.forEach((n) => !seen.has(n.id) && out.push(`${where}: node "${n.id}" can't be reached from the start`));
  if (Math.max(...mins) > best) out.push(`${where}: an ending needs ${Math.max(...mins)} strong moves, but no run has that many decisions`);
  return [...new Set(out)];
}

/** What the page receives: lessons, the guide wording they show, and the reckoner's weighing for select and flip items. */
export function gameData(c: GameContent, includeDrafts: boolean) {
  const shown = c.lessons.filter((l) => includeDrafts || l.status === "published");
  const r = c.reckoner;
  const used = new Set<string>();
  c.config.paths.forEach((p) => { used.add(journeyOf(p)); if (p.kind === "guide") used.add(p.id); p.models.forEach((m) => used.add(m)); });
  shown.forEach((l) => l.items.forEach((it) => { if (it.type === "nest") { used.add(it.host); used.add(it.model); } if (it.type === "select" || it.type === "flip") it.candidates.forEach((x) => x.split("+").forEach((m) => used.add(m))); }));
  const guides = Object.fromEntries([...used].sort().map((id) => {
    const g = c.guides.get(id)!;
    return [id, {
      name: g.name,
      phases: g.phases.slice().sort((a, b) => a.order - b.order).map((p) => ({ id: p.id, name: p.name, ...(p.group ? { group: p.group } : {}) })),
      groups: g.phaseGroups.map((gr) => ({ id: gr.id, name: gr.name })),
      misapplications: Object.fromEntries(g.misapplications.map((m) => [m.id, { name: m.name, looksLike: m.looksLike, why: m.whyItUndermines, fix: m.fix }])),
      lookFors: Object.fromEntries(g.phases.flatMap((p) => p.lookFors.map((x) => [x.id, { phaseId: p.id, question: x.question, strong: x.strongEvidence, weak: x.weakEvidence }]))),
    }];
  }));
  const name = (cand: string) => {
    const [host, model] = cand.split("+");
    if (!model) return c.guides.get(host)!.name;
    const rec = nestingRecord(model, host, c.guides)!;
    const phase = c.guides.get(host)!.phases.find((p) => p.id === rec.phaseId)!.name;
    return `${c.guides.get(host)!.name}, with a ${c.guides.get(model)!.name} as its ${phase}`;
  };
  const optLabel = (d: Dim, v: string | string[]) => (Array.isArray(v) ? v : [v]).map((x) => d.options.find((o) => o[0] === x)![1]).join("; ");
  /** The weighing shown after a select item: each answered question, each model's fit (0–3), and the totals. */
  const weighing = (a: Profile, candidates: string[]) => {
    const singles = [...new Set(candidates.flatMap((x) => x.split("+")))].filter((m) => candidates.includes(m));
    return {
      rows: r.dims.filter((d) => d.id in a).map((d) => ({ dim: d.id, label: d.short, value: optLabel(d, a[d.id]), weight: d.weight, scores: Object.fromEntries(singles.map((m) => [m, dimScore(r.profiles.get(m)!, d, a)])) })),
      fits: Object.fromEntries(singles.map((m) => [m, Math.round(fit(r.profiles.get(m)!, a, r.dims) * 100)])),
    };
  };
  const items = (l: GameLesson) => l.items.map((it) => {
    if (it.type === "select") {
      const k = reckonerAnswer(it.profile, it.candidates, r);
      return { ...it, names: Object.fromEntries(it.candidates.map((x) => [x, name(x)])), weighing: weighing(it.profile, it.candidates), nested: k.answer.includes("+") ? nestingRecord(k.answer.split("+")[1], k.answer.split("+")[0], c.guides)!.how : null };
    }
    if (it.type === "flip") {
      const base = reckonerAnswer(it.profile, it.candidates, r);
      return {
        ...it,
        names: Object.fromEntries(it.candidates.map((x) => [x, name(x)])),
        weighing: weighing(it.profile, it.candidates),
        from: base.top,
        changeLabels: it.changes.map((ch) => {
          const d = r.dims.find((x) => x.id === ch.dim)!;
          const after = reckonerAnswer({ ...it.profile, [ch.dim]: ch.value }, it.candidates, r);
          return { text: `Change ${d.short} to “${optLabel(d, ch.value)}”`, top: after.top, fits: Object.fromEntries(Object.entries(after.fits).map(([m, f]) => [m, Math.round(f * 100)])) };
        }),
      };
    }
    if (it.type === "nest") return { ...it, how: nestingRecord(it.model, it.host, c.guides)!.how };
    if (it.type === "sim") {
      const g = c.guides.get(journeyOf(c.config.paths.find((p) => p.id === l.path)!))!;
      return { ...it, conceptions: g.workedSequences.find((x) => x.id === it.sequenceId)!.targetConceptions };
    }
    return it;
  });
  return {
    mastery: MASTERY,
    notice: c.config.notice,
    feedback: c.config.feedback,
    guides,
    paths: c.config.paths.map((p) => ({
      id: p.id, title: p.title, blurb: p.blurb, kind: p.kind, journey: journeyOf(p), models: p.models, requires: p.requires, rail: p.rail,
      guide: p.kind === "guide" ? p.id : null,
      upcoming: c.lessons.filter((l) => l.path === p.id && !shown.includes(l)).length,
    })),
    lessons: shown.map((l) => ({
      id: l.id, path: l.path, order: l.order, title: l.title, summary: l.summary, level: l.level,
      version: l.version, status: l.status, guideSection: l.guideSection ?? null, requires: l.requires, items: items(l),
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
