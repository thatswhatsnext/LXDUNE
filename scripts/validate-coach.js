#!/usr/bin/env node
// scripts/validate-coach.js
// Validation gate for the Metacognition Coach (spec §10). Structure is enforced
// by JSON Schema (games/_schema/coach.schema.json); the rules a schema can't
// express are enforced here in code, in the same report format as
// validate-frameworks.js:
//   • one unit per framework habit, each exactly once, in the approved order
//   • the seven-step sequence (def, spot, recall, scenario, scenario, apply, commit)
//   • exactly one correct option per choice step; feedback on every wrong or
//     partial option; a partial option implies the step's `part`
//   • every habit reference resolves to the framework; every context id
//     resolves to the vocabulary (superseded syllabuses only when acknowledged)
//   • only <b> and <i> in content strings
//   • parity: every string in the approved source (docs/handoffs/mcg-content.js)
//     survives, unchanged, in the content the page builds — run through the
//     page's own buildGame(), so the check covers the real expansion
//
// Usage: node scripts/validate-coach.js      Exit code 0 = pass, 1 = fail.

import Ajv from 'ajv/dist/2020.js';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import vm from 'node:vm';
import { buildGame } from '../games/metacognition-coach/coach.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CONTENT_REL = 'games/metacognition-coach/content.json';
const SCHEMA_REL = 'games/_schema/coach.schema.json';
const SEQUENCE = ['choice/def', 'tf/spot', 'choice/recall', 'choice/scenario', 'choice/scenario', 'apply', 'commit'];
const PHASE_OF = { plan: 'planning', monitor: 'monitoring', evaluate: 'evaluating' };

const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const report = { errors: [], notes: [] };
const err = (where, msg) => report.errors.push({ where, msg });
const note = (msg) => report.notes.push(msg);

function finish(summary) {
  console.log(`\nMetacognition Coach — validation gate`);
  if (summary) console.log(`${report.errors.length ? '✗' : '✓'} ${summary}`);
  if (report.notes.length) {
    console.log(`\n${report.notes.length} note(s):`);
    for (const n of report.notes) console.log(`  · ${n}`);
  }
  if (report.errors.length) {
    console.log(`\n${report.errors.length} error(s):`);
    for (const e of report.errors) console.log(`  ✗ ${e.where}: ${e.msg}`);
    console.log('');
    process.exit(1);
  }
  console.log(`\nAll checks passed.\n`);
  process.exit(0);
}

// ── load ──────────────────────────────────────────────────────────────────────
const content = readJson(CONTENT_REL);
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(readJson(SCHEMA_REL));
if (!validate(content)) {
  for (const e of validate.errors) err(CONTENT_REL, `${e.instancePath || '/'} ${e.message}`);
  finish(); // the rules below assume the schema holds
}

const fwDir = `frameworks/${content.habitsFrom}`;
if (!existsSync(join(ROOT, fwDir, 'framework.json'))) {
  err(CONTENT_REL, `habitsFrom "${content.habitsFrom}" is not a framework in frameworks/`);
  finish();
}
const fw = readJson(`${fwDir}/framework.json`);
const habits = readJson(`${fwDir}/${fw.matrix.habits}`);
const vocab = JSON.parse(readFileSync(resolve(ROOT, fwDir, fw.vocabulary), 'utf8'));
const habitIds = habits.map((h) => h.id);

// ── habits: one unit per framework habit, each once ─────────────────────────────
const unitIds = content.units.map((u) => u.id);
for (const id of habitIds) {
  const n = unitIds.filter((u) => u === id).length;
  if (n !== 1) err(CONTENT_REL, `habit "${id}" has ${n} units (expected exactly 1)`);
}
for (const id of unitIds) if (!habitIds.includes(id)) err(CONTENT_REL, `unit "${id}" is not a habit in ${fwDir}`);
for (const id of habitIds) if (!content.gameDescriptions[id]) err(CONTENT_REL, `gameDescriptions has no entry for habit "${id}"`);
for (const id of Object.keys(content.gameDescriptions))
  if (!habitIds.includes(id)) err(CONTENT_REL, `gameDescriptions has "${id}", which is not a habit in ${fwDir}`);

// ── vocabulary ──────────────────────────────────────────────────────────────────
const focusAreasByStage = new Map();
for (const byStage of Object.values(vocab.focusAreas || {}))
  for (const [stage, list] of Object.entries(byStage))
    for (const fa of list) focusAreasByStage.set(fa.id, [...(focusAreasByStage.get(fa.id) || []), stage]);

function checkContext(where, ctx) {
  for (const s of ctx.stages) if (!vocab.stages[s]) err(where, `stage "${s}" is not in the vocabulary`);
  const syl = ctx.syllabus && vocab.syllabuses[ctx.syllabus];
  if (ctx.syllabus && !syl) err(where, `syllabus "${ctx.syllabus}" is not in the vocabulary`);
  if (syl) {
    for (const s of ctx.stages)
      if (!syl.stages.includes(s)) err(where, `syllabus "${ctx.syllabus}" does not cover "${s}"`);
    if (syl.supersededBy && ctx.acknowledgedSuperseded !== true)
      err(where, `syllabus "${ctx.syllabus}" is superseded by "${syl.supersededBy}" — set "acknowledgedSuperseded": true to use it deliberately`);
  }
  if (ctx.focusArea) {
    const stages = focusAreasByStage.get(ctx.focusArea);
    if (!stages) err(where, `focus area "${ctx.focusArea}" is not in the vocabulary`);
    else if (!ctx.stages.some((s) => stages.includes(s)))
      err(where, `focus area "${ctx.focusArea}" is not a focus area of ${ctx.stages.join(', ')}`);
  }
  if (ctx.module) {
    if (!ctx.syllabus) err(where, `module "${ctx.module}" needs its syllabus`);
    else if (!(vocab.modules[ctx.syllabus] || []).some((m) => m.id === ctx.module))
      err(where, `module "${ctx.module}" is not a module of "${ctx.syllabus}"`);
  }
  if (ctx.focusArea && ctx.module) err(where, 'a context has a focus area or a module, not both');
}

// ── per-unit rules ───────────────────────────────────────────────────────────────
const TAG = /<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
function checkTags(where, value) {
  if (typeof value === 'string') {
    for (const [m, tag, attrs] of value.matchAll(TAG))
      if (!['b', 'i'].includes(tag.toLowerCase()) || attrs.trim())
        err(where, `only <b> and <i> are allowed, found ${m}`);
  } else if (Array.isArray(value)) value.forEach((v, i) => checkTags(`${where}[${i}]`, v));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) checkTags(`${where}.${k}`, v);
}
checkTags(CONTENT_REL, content);

let scenes = 0;
for (const u of content.units) {
  const seq = u.steps.map((s) => (s.kind ? `${s.type}/${s.kind}` : s.type));
  if (seq.join(' ') !== SEQUENCE.join(' '))
    err(`unit ${u.id}`, `step sequence is ${seq.join(', ')}; expected ${SEQUENCE.join(', ')}`);
  u.steps.forEach((s, j) => {
    const where = `unit ${u.id} step ${j + 1} (${s.kind || s.type})`;
    if (s.scene) {
      scenes++;
      checkContext(where, s.scene.ctx);
    }
    if (s.kind === 'def') {
      const ds = s.distractors.map((d) => d.habit);
      for (const d of ds) if (!habitIds.includes(d)) err(where, `distractor habit "${d}" is not a habit in ${fwDir}`);
      if (ds.includes(u.id)) err(where, 'a distractor is the unit’s own habit');
      if (new Set(ds).size !== ds.length) err(where, 'distractor habits repeat');
    }
    if (s.opts) {
      const correct = s.opts.filter((o) => o.correct).length;
      if (correct !== 1) err(where, `${correct} correct options (expected exactly 1)`);
      s.opts.forEach((o, k) => {
        if (o.correct && o.partial) err(where, `option ${k + 1} is both correct and partial`);
        if (!o.correct && !o.fb) err(where, `option ${k + 1} is wrong or partial but has no feedback`);
        if (o.partial && !s.part) err(where, `option ${k + 1} is partial but the step has no "part"`);
      });
    }
  });
}

// ── parity with the approved source ──────────────────────────────────────────────
// Parity runs the page's expansion, which assumes the references resolve.
const SOURCE = content.source;
if (report.errors.length) {
  note('parity check skipped until the errors above are fixed');
} else if (!SOURCE || !existsSync(join(ROOT, SOURCE))) {
  err(CONTENT_REL, `approved source "${SOURCE}" not found`);
} else {
  const sandbox = {};
  vm.runInNewContext(readFileSync(join(ROOT, SOURCE), 'utf8'), sandbox, { filename: SOURCE });
  const A = sandbox.MCG_CONTENT;
  const { H, units } = buildGame(content, habits, vocab);
  const same = (where, field, a, b) => {
    if (a !== b) err(where, `parity: ${field} differs from the approved source\n      approved: ${JSON.stringify(a)}\n      built:    ${JSON.stringify(b)}`);
  };

  // habit names, phases and the game descriptions
  for (const [id, h] of Object.entries(A.HABITS)) {
    if (!H[id]) {
      err(`habit ${id}`, 'parity: in the approved source but not in the framework');
      continue;
    }
    same(`habit ${id}`, 'name (from the framework)', h.name, H[id].name);
    same(`habit ${id}`, 'phase (from the framework)', PHASE_OF[h.phase], H[id].phase);
    same(`habit ${id}`, 'description', h.desc, H[id].desc);
  }
  same('units', 'unit order', A.UNITS.map((u) => u.id).join(','), units.map((u) => u.id).join(','));

  const ctxDiffs = new Map();
  A.UNITS.forEach((au, i) => {
    const bu = units[i];
    if (!bu || bu.id !== au.id) return;
    same(`unit ${au.id}`, 'short', au.short, bu.short);
    same(`unit ${au.id}`, 'intro', au.intro, bu.intro);
    au.steps.forEach((as, j) => {
      const bs = bu.steps[j];
      const where = `unit ${au.id} step ${j + 1}`;
      if (!bs) return err(where, 'parity: step missing');
      for (const [k, av] of Object.entries(as)) {
        const bv = bs[k];
        if (k === 'scene') {
          same(where, 'scene text', av.t, bv && bv.t);
          const built = bv && bv.ctx;
          if (av.ctx !== built) {
            const stored = content.units[i].steps[j].scene.ctx;
            if (!stored.module) same(where, 'scene context', av.ctx, built);
            else ctxDiffs.set(av.ctx, built);
          }
        } else if (k === 'opts') {
          // def options are shuffled anyway, so compare them as a set
          const key = (o) => JSON.stringify([o.t, o.fb || null, !!o.correct, !!o.partial]);
          const a = av.map(key);
          const b = (bv || []).map(key);
          if (as.kind === 'def') {
            a.sort();
            b.sort();
          }
          same(where, 'options', a.join('\n'), b.join('\n'));
        } else if (Array.isArray(av)) {
          same(where, k, JSON.stringify(av), JSON.stringify(bv));
        } else {
          same(where, k, av, bv);
        }
      }
    });
  });
  for (const [a, b] of ctxDiffs) note(`Stage 6 label shown from the vocabulary: "${a}" → "${b}"`);
}


const steps = content.units.reduce((n, u) => n + u.steps.length, 0);
finish(`${CONTENT_REL} (v${content.version}) — ${content.units.length} units, ${steps} steps, ${scenes} scenes; habits from ${fwDir}`);
