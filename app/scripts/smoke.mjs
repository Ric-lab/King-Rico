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
async function open(url, init) {
  const p = await browser.newPage({ viewport: { width: 453, height: 802 } });
  if (init) await p.addInitScript(init);
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
// Simula o bridge do app Android para conferir que a vibração vai para o plugin nativo FcHaptics
const fakeBridge = () => {
  window.__hap = [];
  window.Capacitor = { PluginHeaders: [{ name: 'FcHaptics', methods: [{ name: 'vibrate', rtype: 'promise' }] }],
    nativePromise: (plugin, method, opts) => { window.__hap.push({ plugin, method, opts }); return Promise.resolve(); } };
};
const g = await open(base + '?from=home', fakeBridge);
const start = await g.evaluate(() => window.__fc.balance());
const bet = await g.evaluate(() => window.__fc.bet());
let paid = 0;
for (let i = 0; i < 3; i++) {
  await g.evaluate(() => window.__fc.spin());
  await g.waitForFunction(() => window.__fc.state.spinning, null, { timeout: 5000 });
  // espera o giro terminar; prêmio grande abre a janela que exige um toque (regra do jogo): o teste toca como o jogador
  let settled = false, won = 0;
  for (const t0 = Date.now(); Date.now() - t0 < 60000;) {
    const st = await g.evaluate(() => { const f = window.__fc, s = f.state; return { spin: s.spinning, celeb: f.isCeleb(), win: s.showWin, amt: s.winAmount || 0, feat: !!(s.feature || s.featLock) }; });
    if (st.feat) { settled = 'feature'; break; } // Rodada Especial: encerra o teste aqui
    if (st.win) { won = Math.max(won, st.amt); await g.evaluate(() => window.__fc.dismissWin()); }
    else if (!st.spin && !st.celeb) { won = Math.max(won, st.amt); settled = true; break; }
    await g.waitForTimeout(300);
  }
  if (!settled) { problems.push('giro ' + (i + 1) + ' não terminou em 60 s: ' + JSON.stringify(await g.evaluate(() => { const f = window.__fc, s = f.state; return { spinning: s.spinning, showWin: s.showWin, celebHold: !!f._celebHold, dances: (f._dances || []).length, coinFly: !!f._cfRun, hint: s.hint }; }))); break; }
  if (settled === 'feature') break;
  paid += won;
  await g.waitForTimeout(800);
}
const end = await g.evaluate(() => window.__fc.balance());
console.log(`saldo ${start} → ${end} (aposta ${bet}, prêmios ${paid})`);
if (end === start) problems.push('saldo não mudou após 3 giros');
const hap = await g.evaluate(() => window.__hap);
const pulses = hap.flatMap(h => h.opts.pattern.filter((_, i) => i % 2 === 0));
console.log(`vibração nativa: ${hap.length} chamadas, pulsos ${Math.min(...pulses)}–${Math.max(...pulses)} ms`);
if (!hap.length) problems.push('nenhuma vibração chegou ao plugin nativo FcHaptics');
if (hap.some(h => h.plugin !== 'FcHaptics' || h.method !== 'vibrate')) problems.push('chamada nativa errada: ' + JSON.stringify(hap[0]));
if (pulses.some(v => v < 15)) problems.push('pulso de vibração abaixo de 15 ms (o motor não sente)');

await browser.close();
server.close();
if (problems.length) { console.error('FALHOU:\n' + problems.join('\n')); process.exit(1); }
console.log('smoke ok: Home e jogo carregam offline, giros funcionam');
