import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { readFile, writeFile } from 'fs/promises';
import http from 'http';
import { exec } from 'child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const HTML_FILE = path.join(__dirname, 'checklist.html');
const STATE_FILE = path.join(__dirname, 't2-checklist-state.json');

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
