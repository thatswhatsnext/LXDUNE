#!/usr/bin/env node
// scripts/validate-frameworks.js
// Validation gate for the Framework Explorer (handoff §8).
// Structure is enforced by JSON Schema (ajv, draft 2020-12); cross-file
// referential integrity, curriculum-vocabulary membership + supersession,
// and matrix completeness are enforced here in code. One report format.
//
// Usage:
//   node scripts/validate-frameworks.js            # validate every framework
//   node scripts/validate-frameworks.js hits-nsw-science
//   node scripts/validate-frameworks.js --allow-incomplete   # partial migration: downgrade
//                                                             # unresolved cross-refs to warnings
// Exit code 0 = pass, 1 = fail. Wire into pre-push / CI.

import Ajv from 'ajv/dist/2020.js';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FRAMEWORKS = join(ROOT, 'frameworks');
const SCHEMA_PATH = join(FRAMEWORKS, '_schema', 'framework.schema.json');
const VOCAB_PATH = join(FRAMEWORKS, '_schema', 'curriculum.vocab.json');

const args = process.argv.slice(2);
const allowIncomplete = args.includes('--allow-incomplete');
const only = args.filter((a) => !a.startsWith('--'));

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

// ── report accumulator ────────────────────────────────────────────────────────
const report = { errors: [], warnings: [] };
const err = (file, msg) => report.errors.push({ file, msg });
const warn = (file, msg) => report.warnings.push({ file, msg });

// ── build the controlled-vocabulary id set ─────────────────────────────────────
function buildVocab() {
  const v = readJson(VOCAB_PATH);
  const ids = new Set();
  const superseded = new Map(); // id -> supersededBy
  for (const s of Object.keys(v.stages || {})) ids.add(s);
  for (const [id, syl] of Object.entries(v.syllabuses || {})) {
    ids.add(id);
    if (syl.supersededBy) superseded.set(id, syl.supersededBy);
  }
  for (const areasByStage of Object.values(v.focusAreas || {}))
    for (const list of Object.values(areasByStage))
      for (const fa of list) ids.add(fa.id);
  for (const list of Object.values(v.modules || {})) for (const m of list) ids.add(m.id);
  for (const [k] of Object.entries(v.themes || {})) if (!k.startsWith('_')) ids.add(k);
  return { ids, superseded };
}

// ── ajv setup ──────────────────────────────────────────────────────────────────
const ajv = new Ajv({ allErrors: true, strict: false });
const schema = readJson(SCHEMA_PATH);
ajv.addSchema(schema, 'framework.schema.json');
const validateFramework = ajv.getSchema('framework.schema.json#/$defs/framework');
const validateDeepDive = ajv.getSchema('framework.schema.json#/$defs/deepDiveItem');
const validateMatrixRow = ajv.getSchema('framework.schema.json#/$defs/matrixRow');
const validateMatrixCol = ajv.getSchema('framework.schema.json#/$defs/matrixCol');
const validateMatrixCell = ajv.getSchema('framework.schema.json#/$defs/matrixCell');

const fmtAjv = (label, errors) =>
  (errors || []).map((e) => `${label}${e.instancePath || ''} ${e.message}`);

// ── curriculum-reference checker (shared) ──────────────────────────────────────
function checkRefs(file, ctx, vocab, refsAcknowledged) {
  const refs = [];
  if (ctx.stage) refs.push(ctx.stage);
  if (ctx.syllabus) refs.push(ctx.syllabus);
  if (ctx.focusArea) refs.push(ctx.focusArea);
  if (Array.isArray(ctx.spans)) refs.push(...ctx.spans);
  for (const ref of refs) {
    if (!vocab.ids.has(ref)) {
      err(file, `curriculum reference "${ref}" is not in the vocabulary`);
    } else if (vocab.superseded.has(ref) && !refsAcknowledged) {
      err(
        file,
        `curriculum reference "${ref}" is superseded by "${vocab.superseded.get(ref)}" — set "acknowledgedSuperseded": true on the item to use it deliberately`
      );
    }
  }
}

// ── validate one deep-dive framework ───────────────────────────────────────────
function validateDeepDiveFramework(dir, name, vocab, fw) {
  const itemsDir = join(dir, 'items');
  if (!existsSync(itemsDir)) return err(name, 'missing items/ directory');
  const files = readdirSync(itemsDir).filter((f) => f.endsWith('.json')).sort();

  // manifest ↔ directory consistency (the renderer fetches via the manifest)
  const manifest = (fw.items || []).map((p) => p.replace(/^items\//, ''));
  if (!fw.items) {
    err(name, 'framework.json has no "items" manifest — the renderer needs it to fetch over HTTP');
  } else {
    for (const f of files)
      if (!manifest.includes(f)) err(name, `items/${f} exists on disk but is not in the framework.json manifest`);
    for (const f of manifest)
      if (!files.includes(f)) err(name, `manifest lists items/${f} but no such file exists`);
  }
  const items = [];
  for (const f of files) {
    const rel = `${name}/items/${f}`;
    let item;
    try {
      item = readJson(join(itemsDir, f));
    } catch (e) {
      err(rel, `not valid JSON: ${e.message}`);
      continue;
    }
    if (!validateDeepDive(item)) fmtAjv('', validateDeepDive.errors).forEach((m) => err(rel, m));
    items.push({ rel, item });
  }

  // cross-file rules
  const ids = items.map((x) => x.item.id).filter(Boolean);
  const idSet = new Set(ids);
  // unique ids
  const seen = new Set();
  for (const { rel, item } of items) {
    if (item.id && seen.has(item.id)) err(rel, `duplicate item id "${item.id}"`);
    seen.add(item.id);
  }
  // contiguous ordinals from 1
  const ordinals = items.map((x) => x.item.ordinal).filter((n) => Number.isInteger(n)).sort((a, b) => a - b);
  ordinals.forEach((n, i) => {
    if (n !== i + 1) err(name, `ordinals not contiguous from 1 — expected ${i + 1}, found ${n}`);
  });
  // per-item cross checks
  for (const { rel, item } of items) {
    // span.end > span.start
    (item.exemplar?.phases || []).forEach((p, i) => {
      if (p.span && !(p.span.end > p.span.start))
        err(rel, `phase[${i}] "${p.label}" span.end (${p.span.end}) must be > span.start (${p.span.start})`);
    });
    // related resolves to a sibling, excludes self
    for (const r of item.related || []) {
      if (r === item.id) err(rel, `related includes self ("${r}")`);
      else if (!idSet.has(r)) {
        const msg = `related "${r}" does not resolve to a sibling item id`;
        if (allowIncomplete) warn(rel, `${msg} (allowed: partial migration)`);
        else err(rel, msg);
      }
    }
    // curriculum vocabulary
    if (item.exemplar?.context)
      checkRefs(rel, item.exemplar.context, vocab, item.acknowledgedSuperseded === true);
  }
  return items.length;
}

// ── validate one matrix framework ──────────────────────────────────────────────
function validateMatrixFramework(dir, name, vocab) {
  const load = (sub) => {
    const d = join(dir, sub);
    if (!existsSync(d)) return [];
    return readdirSync(d)
      .filter((f) => f.endsWith('.json'))
      .map((f) => ({ rel: `${name}/${sub}/${f}`, data: readJson(join(d, f)) }));
  };
  const rows = load('habits');
  const cols = load('contexts');
  const cells = load('cells');

  rows.forEach(({ rel, data }) => {
    if (!validateMatrixRow(data)) fmtAjv('', validateMatrixRow.errors).forEach((m) => err(rel, m));
  });
  cols.forEach(({ rel, data }) => {
    if (!validateMatrixCol(data)) fmtAjv('', validateMatrixCol.errors).forEach((m) => err(rel, m));
    checkRefs(rel, { stage: data.stage, syllabus: data.syllabusArea }, vocab, false);
  });

  const habitIds = rows.map((r) => r.data.id);
  const topicIds = cols.flatMap((c) => (c.data.topics || []).map((t) => t.id));
  const present = new Set();
  cells.forEach(({ rel, data }) => {
    if (!validateMatrixCell(data)) fmtAjv('', validateMatrixCell.errors).forEach((m) => err(rel, m));
    if (!habitIds.includes(data.habitId)) err(rel, `cell habitId "${data.habitId}" is not a defined habit`);
    if (!topicIds.includes(data.topicId)) err(rel, `cell topicId "${data.topicId}" is not a defined topic`);
    present.add(`${data.topicId}×${data.habitId}`);
  });
  // completeness: every topic × habit must exist
  for (const t of topicIds)
    for (const h of habitIds)
      if (!present.has(`${t}×${h}`)) err(name, `matrix incomplete — missing cell ${t}×${h}`);

  return `${topicIds.length}×${habitIds.length}`;
}

// ── main ────────────────────────────────────────────────────────────────────────
const vocab = buildVocab();
const dirs = readdirSync(FRAMEWORKS)
  .filter((d) => d !== '_schema' && statSync(join(FRAMEWORKS, d)).isDirectory())
  .filter((d) => only.length === 0 || only.includes(d));

if (dirs.length === 0) {
  console.error('No frameworks found to validate.');
  process.exit(1);
}

console.log(`\nFramework Explorer — validation gate`);
console.log(`vocabulary: ${vocab.ids.size} controlled ids\n`);

for (const d of dirs) {
  const dir = join(FRAMEWORKS, d);
  const fwPath = join(dir, 'framework.json');
  if (!existsSync(fwPath)) {
    err(d, 'missing framework.json');
    continue;
  }
  const fw = readJson(fwPath);
  if (!validateFramework(fw)) fmtAjv('framework.json', validateFramework.errors).forEach((m) => err(d, m));

  let summary = '';
  if (fw.viewType === 'deep-dive') summary = `${validateDeepDiveFramework(dir, d, vocab, fw)} items`;
  else if (fw.viewType === 'matrix') summary = `${validateMatrixFramework(dir, d, vocab)} matrix`;

  const bad = report.errors.some((e) => e.file.startsWith(d));
  console.log(`${bad ? '✗' : '✓'} ${d} (${fw.viewType}, v${fw.version}) — ${summary}`);
}

// ── print report ─────────────────────────────────────────────────────────────────
if (report.warnings.length) {
  console.log(`\n${report.warnings.length} warning(s):`);
  for (const w of report.warnings) console.log(`  ⚠ ${w.file}: ${w.msg}`);
}
if (report.errors.length) {
  console.log(`\n${report.errors.length} error(s):`);
  for (const e of report.errors) console.log(`  ✗ ${e.file}: ${e.msg}`);
  console.log('');
  process.exit(1);
}
console.log(`\nAll checks passed.\n`);
process.exit(0);
