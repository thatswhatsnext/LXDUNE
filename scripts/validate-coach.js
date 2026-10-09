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
//   • no length cue in recall and scenario questions: the shortest option is at
//     least 60% of the longest, and the correct option is never more than 15%
//     longer than the longest wrong option
//   • parity: every string in the approved source (docs/handoffs/mcg-content.js)
//     survives, unchanged, in the content the page builds — run through the
//     page's own buildGame(), so the check covers the real expansion. Changes
//     made since approval are listed in games/metacognition-coach/changes.json
//     and applied to the source first; each one needs a reviewer
//
// Usage: node scripts/validate-coach.js [--allow-drafts]
//   --allow-drafts  report unreviewed changes as notes, not errors (for review
//                   copies; CI runs without it, so drafts can't ship)
// Exit code 0 = pass, 1 = fail.

import Ajv from 'ajv/dist/2020.js';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import vm from 'node:vm';
import { buildGame } from '../games/metacognition-coach/coach.js';
import { makeContextChecker } from './lib/game-context.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CONTENT_REL = 'games/metacognition-coach/content.json';
const CHANGES_REL = 'games/metacognition-coach/changes.json';
const MIN_SPREAD = 0.6; // shortest option / longest option
const MAX_LEAD = 1.15; // correct option / longest wrong option
const allowDrafts = process.argv.includes('--allow-drafts');
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
const checkContext = makeContextChecker(vocab);

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
      checkContext(where, s.scene.ctx, err);
    }
    if (s.kind === 'def') {
      const ds = s.distractors.map((d) => d.habit);
      for (const d of ds) if (!habitIds.includes(d)) err(where, `distractor habit "${d}" is not a habit in ${fwDir}`);
      if (ds.includes(u.id)) err(where, 'a distractor is the unit’s own habit');
      if (new Set(ds).size !== ds.length) err(where, 'distractor habits repeat');
    }
    if (s.opts && (s.kind === 'recall' || s.kind === 'scenario') && !s.fixedOrder) {
      const len = s.opts.map((o) => o.t.replace(/<[^>]+>/g, '').length);
      const ci = s.opts.findIndex((o) => o.correct);
      const longestWrong = Math.max(...len.filter((_, k) => k !== ci));
      if (Math.min(...len) < MIN_SPREAD * Math.max(...len))
        err(where, `length cue: options run from ${Math.min(...len)} to ${Math.max(...len)} characters (shortest must be at least ${MIN_SPREAD * 100}% of the longest)`);
      if (ci > -1 && len[ci] > MAX_LEAD * longestWrong)
        err(where, `length cue: the correct option (${len[ci]} characters) is more than ${Math.round((MAX_LEAD - 1) * 100)}% longer than the longest wrong option (${longestWrong})`);
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
  applyChanges(A);
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


// Apply the changes made since approval to the approved source, so parity
// compares against approved text plus reviewed changes. Each change replaces
// one option's text in one step, and must match exactly one option.
function applyChanges(A) {
  if (!existsSync(join(ROOT, CHANGES_REL))) return;
  const { changes = [] } = readJson(CHANGES_REL);
  let unreviewed = 0;
  changes.forEach((ch, i) => {
    const where = `${CHANGES_REL} change ${i + 1} (unit ${ch.unit} step ${ch.step})`;
    if (!Array.isArray(ch.reviewedBy) || !ch.reviewedBy.length) unreviewed++;
    const unit = A.UNITS.find((u) => u.id === ch.unit);
    const step = unit && unit.steps[ch.step - 1];
    const hits = step && step.opts ? step.opts.filter((o) => o.t === ch.from) : [];
    if (hits.length !== 1) return err(where, `"from" matches ${hits.length} options in the approved source (expected exactly 1)`);
    hits[0].t = ch.to;
  });
  if (unreviewed) {
    const msg = `${unreviewed} of ${changes.length} change(s) since approval have no reviewer (reviewedBy is empty)`;
    if (allowDrafts) note(`${msg}; allowed by --allow-drafts`);
    else err(CHANGES_REL, `${msg}. Review them, then add the reviewer's name`);
  } else if (changes.length) note(`${changes.length} reviewed change(s) since approval applied before the parity check`);
}

const steps = content.units.reduce((n, u) => n + u.steps.length, 0);
finish(`${CONTENT_REL} (v${content.version}) — ${content.units.length} units, ${steps} steps, ${scenes} scenes; habits from ${fwDir}`);
