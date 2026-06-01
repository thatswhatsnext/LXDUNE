import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { readFile, writeFile } from 'fs/promises';
import http from 'http';
import { exec } from 'child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const HTML_FILE   = path.join(__dirname, 'checklist.html');
const GAPS_FILE   = fileURLToPath(new URL('./edse362-gaps.html',          import.meta.url));
const CONFIG_FILE = fileURLToPath(new URL('../config/units/EDSE362.json', import.meta.url));
const CONFIG_BAK  = CONFIG_FILE + '.bak';
const STATE_FILE  = path.join(__dirname, 't2-checklist-state.json');

function setByPath(obj, pathStr, value) {
  const segs = pathStr.split('.');
  let cur = obj;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i];
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

function defaultState() {
  const items = {};
  for (let i = 1; i <= 29; i++) items[String(i)] = { checked: false, note: '' };
  return { lastUpdated: new Date().toISOString(), items };
}

function migrate(state) {
  const items = {};
  for (const [k, v] of Object.entries(state.items)) {
    items[k] = typeof v === 'boolean' ? { checked: v, note: '' } : v;
  }
  return { ...state, items };
}

async function handler(req, res) {
  if (req.method === 'GET' && req.url === '/') {
    try {
      const html = fs.readFileSync(HTML_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('checklist.html not found');
      } else {
        res.writeHead(500);
        res.end('Internal server error');
      }
    }
  } else if (req.method === 'GET' && req.url === '/state') {
    try {
      let state;
      try {
        const raw = await readFile(STATE_FILE, 'utf8');
        state = migrate(JSON.parse(raw));
      } catch (err) {
        if (err.code === 'ENOENT') {
          state = defaultState();
        } else {
          throw err;
        }
      }
      state.lastUpdated = new Date().toISOString();
      await writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(state));
    } catch (err) {
      res.writeHead(500);
      res.end('{"error":"server error"}');
    }
  } else if (req.method === 'POST' && req.url === '/state') {
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
        body.lastUpdated = new Date().toISOString();
        await writeFile(STATE_FILE, JSON.stringify(body, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end('{"error":"invalid"}');
      }
    });
  } else if (req.method === 'GET' && req.url === '/gaps') {
    try {
      const html = await readFile(GAPS_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      res.end('edse362-gaps.html not found');
    }
  } else if (req.method === 'GET' && req.url === '/config') {
    try {
      const raw = await readFile(CONFIG_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(raw);
    } catch {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'could not read config' }));
    }
  } else if (req.method === 'POST' && req.url === '/config') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try {
        const { path: fieldPath, value } = JSON.parse(Buffer.concat(chunks).toString());
        const raw    = await readFile(CONFIG_FILE, 'utf8');
        const config = JSON.parse(raw);
        const ok     = setByPath(config, fieldPath, value);
        if (!ok) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'path not found' }));
          return;
        }
        await writeFile(CONFIG_BAK, raw, 'utf8');
        await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, path: fieldPath, value }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
}

const server = http.createServer(handler);
server.listen(3001, () => {
  console.log('LXDUNE Checklist → http://localhost:3001');
  const cmd = process.platform === 'darwin' ? 'open'
             : process.platform === 'win32' ? 'start'
             : 'xdg-open';
  exec(`${cmd} http://localhost:3001`, () => {});
});
