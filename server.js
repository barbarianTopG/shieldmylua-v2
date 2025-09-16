import { createServer } from 'node:http';
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import crypto from 'node:crypto';

const uploadsDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir);

const dbFile = join(process.cwd(), 'database.txt');
if (!existsSync(dbFile)) writeFileSync(dbFile, '');

function getFileRecord(id) {
  const lines = readFileSync(dbFile, 'utf8').trim().split('\n').filter(Boolean);
  return lines.map(line => {
    const [fid, fname, pass] = line.split('|');
    return { id: fid, filename: fname, password: pass };
  }).find(r => r.id === id);
}

async function obfuscateLua(luaCode) {
  const apiRes = await fetch('https://wearedevs.net/api/obfuscate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script: luaCode })
  });
  const json = await apiRes.json();
  if (!json.success || !json.obfuscated) throw new Error('Invalid API response');
  return json.obfuscated;
}

createServer(async (req, res) => {
  const ua = req.headers['user-agent'] || '';
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const params = urlObj.searchParams;

  // Serve index.html at /
  if (urlObj.pathname === '/') {
    try {
      const html = readFileSync(join(process.cwd(), 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(html);
    } catch {
      res.writeHead(404);
      return res.end('index.html not found');
    }
  }

  // Upload via query params
  if (urlObj.pathname === '/upload') {
    const password = params.get('password');
    const filename = params.get('filename') || 'script.lua';
    const code = params.get('code');

    if (!password || !code) {
      res.writeHead(400);
      return res.end('Missing password or code');
    }

    const id = crypto.randomBytes(8).toString('hex');
    writeFileSync(join(uploadsDir, id + '.lua'), code);
    appendFileSync(dbFile, `${id}|${filename}|${password}\n`);

    try {
      const obfuscatedCode = await obfuscateLua(code);
      writeFileSync(join(uploadsDir, id + '.obf'), obfuscatedCode);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`Upload successful.\nAccess URL: http://localhost:3000/code/${id}`);
    } catch (err) {
      res.writeHead(500);
      res.end('Obfuscation failed: ' + err.message);
    }
    return;
  }

  // Access code
  if (urlObj.pathname.startsWith('/code/')) {
    const id = urlObj.pathname.split('/code/')[1];
    const record = getFileRecord(id);
    if (!record) {
      res.writeHead(404);
      return res.end('File not found');
    }

    if (ua.includes('Roblox')) {
      const obfuscated = readFileSync(join(uploadsDir, id + '.obf'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end(obfuscated);
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(`
      <h1>Enter Password to View Original Code</h1>
      <form method="GET" action="/view">
        <input type="hidden" name="id" value="${id}">
        <input type="password" name="password" required>
        <button type="submit">View</button>
      </form>
    `);
  }

  // View original code via query
  if (urlObj.pathname === '/view') {
    const id = params.get('id');
    const password = params.get('password');
    const record = getFileRecord(id);
    if (!record) {
      res.writeHead(404);
      return res.end('File not found');
    }
    if (password !== record.password) {
      res.writeHead(403);
      return res.end('Incorrect password');
    }

    const code = readFileSync(join(uploadsDir, id + '.lua'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(`
      <h1>Edit Lua Code</h1>
      <form method="GET" action="/edit">
        <input type="hidden" name="id" value="${id}">
        <input type="hidden" name="password" value="${password}">
        <textarea name="code" rows="20" cols="80">${code}</textarea><br>
        <button type="submit">Save</button>
      </form>
    `);
  }

  // Edit original code via query
  if (urlObj.pathname === '/edit') {
    const id = params.get('id');
    const password = params.get('password');
    const code = params.get('code');
    const record = getFileRecord(id);
    if (!record) {
      res.writeHead(404);
      return res.end('File not found');
    }
    if (password !== record.password) {
      res.writeHead(403);
      return res.end('Incorrect password');
    }

    writeFileSync(join(uploadsDir, id + '.lua'), code);

    try {
      const obfuscatedCode = await obfuscateLua(code);
      writeFileSync(join(uploadsDir, id + '.obf'), obfuscatedCode);
    } catch {}

    res.writeHead(200);
    return res.end('Saved and re‑obfuscated!');
  }

  // Default
  res.writeHead(404);
  res.end('Not found');
}).listen(3000, () => console.log('Server running at http://localhost:3000'));
