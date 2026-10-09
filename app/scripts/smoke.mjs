// Teste de fumaça do build offline: serve app/www, bloqueia a internet, abre Home e jogo e faz 3 giros.
// Falha se houver requisição externa, 404, imagem quebrada, erro de JS ou se o saldo não for debitado.
// Uso: npm run build:www && npm run smoke   (CHROMIUM_PATH opcional)
import { chromium } from 'playwright-core';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const www = resolve(fileURLToPath(import.meta.url), '../../www');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer((req, res) => {
  const f = join(www, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!f.startsWith(www) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' });
  createReadStream(f).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}/index.html`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const problems = [];
async function open(url) {
  const p = await browser.newPage({ viewport: { width: 453, height: 802 } });
  await p.route(/^https?:\/\/(?!localhost)/, r => { problems.push('externa: ' + r.request().url()); r.abort(); });
  p.on('response', r => { if (r.status() >= 400) problems.push(r.status() + ' ' + r.url()); });
  p.on('pageerror', e => problems.push('js: ' + e.message));
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  const broken = await p.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')));
  broken.forEach(b => problems.push('imagem quebrada: ' + b));
  return p;
}

await (await open(base)).close(); // Home
const g = await open(base + '?from=home');
const start = await g.evaluate(() => window.__fc.balance());
const bet = await g.evaluate(() => window.__fc.bet());
let paid = 0;
for (let i = 0; i < 3; i++) {
  await g.evaluate(() => window.__fc.spin());
  await g.waitForFunction(() => window.__fc.state.spinning, null, { timeout: 5000 });
  await g.waitForFunction(() => !window.__fc.state.spinning && !window.__fc.isCeleb(), null, { timeout: 60000 });
  if (await g.evaluate(() => window.__fc.state.feature || window.__fc.state.featLock)) break; // Rodada Especial: encerra o teste aqui
  paid += await g.evaluate(() => window.__fc.state.winAmount || 0);
  if (await g.evaluate(() => window.__fc.state.showWin)) await g.evaluate(() => window.__fc.dismissWin());
  await g.waitForTimeout(800);
}
const end = await g.evaluate(() => window.__fc.balance());
console.log(`saldo ${start} → ${end} (aposta ${bet}, prêmios ${paid})`);
if (end === start) problems.push('saldo não mudou após 3 giros');

await browser.close();
server.close();
if (problems.length) { console.error('FALHOU:\n' + problems.join('\n')); process.exit(1); }
console.log('smoke ok: Home e jogo carregam offline, giros funcionam');
