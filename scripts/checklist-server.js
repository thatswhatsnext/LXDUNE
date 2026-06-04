import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { readFile, writeFile } from 'fs/promises';
import http from 'http';
import { exec } from 'child_process';

const __dirname  = fileURLToPath(new URL('.', import.meta.url));
const HTML_FILE  = path.join(__dirname, 'checklist.html');
const GAPS_FILE  = fileURLToPath(new URL('./gaps.html',               import.meta.url));
const CONFIG_DIR = fileURLToPath(new URL('../config/units/',          import.meta.url));
const STATE_FILE = path.join(__dirname, 't2-checklist-state.json');

const UNIT_WHITELIST = new Set(['EDSE357', 'EDSE358', 'EDSE362']);

function configPath(unit) {
  return path.join(CONFIG_DIR, `${unit}.json`);
}

// ── Path setter (dot-notation, hyphenated keys, numeric indices) ──────────────
function setByPath(obj, pathStr, value) {
  const segs = pathStr.split('.');
  let cur = obj;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg  = segs[i];
    const next = /^\d+$/.test(seg) ? cur[Number(seg)] : cur[seg];
    if (next === undefined || next === null || typeof next !== 'object') return false;
    cur = next;
  }
  const last = segs[segs.length - 1];
  const key  = /^\d+$/.test(last) ? Number(last) : last;
  if (!(key in Object(cur))) return false;
  cur[key] = value;
  return true;
}

// ── State helpers ─────────────────────────────────────────────────────────────
function defaultFullState() {
  return { EDSE362: { items: {} }, EDSE357: { items: {} }, EDSE358: { items: {} } };
}

function migrateItems(items) {
  const out = {};
  for (const [k, v] of Object.entries(items)) {
    out[k] = typeof v === 'boolean' ? { checked: v, note: '' } : v;
  }
  return out;
}

async function loadFullState() {
  try {
    const raw = JSON.parse(await readFile(STATE_FILE, 'utf8'));
    // Detect old flat shape: has top-level 'items' but no unit keys
    if (raw.items && typeof raw.items === 'object' && !raw.EDSE362 && !raw.EDSE357 && !raw.EDSE358) {
      const migrated = {
        EDSE362: { items: migrateItems(raw.items) },
        EDSE357: { items: {} },
        EDSE358: { items: {} },
      };
      await writeFile(STATE_FILE, JSON.stringify(migrated, null, 2), 'utf8');
      return migrated;
    }
    // Ensure all known units present
    for (const u of ['EDSE362', 'EDSE357', 'EDSE358']) {
      if (!raw[u]) raw[u] = { items: {} };
    }
    return raw;
  } catch (err) {
    if (err.code === 'ENOENT') return defaultFullState();
    throw err;
  }
}

// ── Config POST handler (shared by /config and /config/:unit) ─────────────────
async function handleConfigPost(res, unit, req) {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', async () => {
    try {
      const { path: fieldPath, value } = JSON.parse(Buffer.concat(chunks).toString());
      const cfgFile = configPath(unit);
      const raw     = await readFile(cfgFile, 'utf8');
      const config  = JSON.parse(raw);
      const ok      = setByPath(config, fieldPath, value);
      if (!ok) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'path not found' }));
        return;
      }
      // Always write backup before writing — never writes without backup
      await writeFile(cfgFile + '.bak', raw, 'utf8');
      await writeFile(cfgFile, JSON.stringify(config, null, 2) + '\n', 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, path: fieldPath, value }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  });
}

// ── Request handler ───────────────────────────────────────────────────────────
async function handler(req, res) {
  const url      = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  // GET /
  if (req.method === 'GET' && pathname === '/') {
    try {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(HTML_FILE, 'utf8'));
    } catch (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      res.end('checklist.html not found');
    }
    return;
  }

  // GET /state[?unit=EDSE362]  — unit defaults to EDSE362 for backwards compat
  if (req.method === 'GET' && pathname === '/state') {
    try {
      const unit  = (url.searchParams.get('unit') || 'EDSE362').toUpperCase();
      const full  = await loadFullState();
      const state = full[unit] || { items: {} };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(state));
    } catch {
      res.writeHead(500);
      res.end('{"error":"server error"}');
    }
    return;
  }

  // POST /state[?unit=EDSE362]
  if (req.method === 'POST' && pathname === '/state') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString());
        if (!body.items || typeof body.items !== 'object') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end('{"error":"invalid"}');
          return;
        }
        const unit = (url.searchParams.get('unit') || 'EDSE362').toUpperCase();
        const full = await loadFullState();
        full[unit] = { items: body.items };
        await writeFile(STATE_FILE, JSON.stringify(full, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end('{"error":"invalid"}');
      }
    });
    return;
  }

  // GET /gaps[?unit=...] — legacy alias + query-string unit selector
  if (req.method === 'GET' && pathname === '/gaps') {
    try {
      const html = await readFile(GAPS_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      res.end('gaps.html not found');
    }
    return;
  }

  // GET /config — legacy EDSE362 alias
  if (req.method === 'GET' && pathname === '/config') {
    try {
      const json = await readFile(configPath('EDSE362'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(json);
    } catch {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'could not read config' }));
    }
    return;
  }

  // POST /config — legacy EDSE362 alias
  if (req.method === 'POST' && pathname === '/config') {
    await handleConfigPost(res, 'EDSE362', req);
    return;
  }

  // /gaps/:unit  — redirect to /gaps?unit=UNIT so the HTML reads from query string
  const gapsUnitMatch = pathname.match(/^\/gaps\/([A-Z0-9]+)$/i);
  if (req.method === 'GET' && gapsUnitMatch) {
    const unit = gapsUnitMatch[1].toUpperCase();
    res.writeHead(302, { Location: `/gaps?unit=${unit}` });
    res.end();
    return;
  }

  // /config/:unit  GET + POST
  const configUnitMatch = pathname.match(/^\/config\/([A-Z0-9]+)$/i);
  if (configUnitMatch) {
    const unit = configUnitMatch[1].toUpperCase();
    if (!UNIT_WHITELIST.has(unit)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Unknown unit: ${unit}` }));
      return;
    }
    if (req.method === 'GET') {
      try {
        const json = await readFile(configPath(unit), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(json);
      } catch {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'could not read config' }));
      }
      return;
    }
    if (req.method === 'POST') {
      await handleConfigPost(res, unit, req);
      return;
    }
  }

  res.writeHead(404);
  res.end('Not found');
}

const server = http.createServer(handler);
server.listen(3001, () => {
  console.log('LXDUNE Checklist → http://localhost:3001');
  const cmd = process.platform === 'darwin' ? 'open'
             : process.platform === 'win32'  ? 'start'
             : 'xdg-open';
  exec(`${cmd} http://localhost:3001`, () => {});
});
