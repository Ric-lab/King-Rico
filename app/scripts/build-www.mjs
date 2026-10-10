// Monta app/www: o protótipo atual (Fortune Circus.dc.html + Home embutida) pronto para rodar OFFLINE
// dentro do app Android (Capacitor) e como PWA.
// - React, ReactDOM e Babel saem de node_modules (o support.js aceita trocar as URLs do unpkg via window.__resources).
// - Fontes Google trocadas por @fontsource locais.
// - Só os assets que o jogo referencia são copiados; se faltar algum, o build falha.
// Este passo é temporário: quando o jogo for portado para React/Vite, o `vite build` substitui este script.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(app, '..');
const out = join(app, 'www');
const nm = join(app, 'node_modules');

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'vendor', 'fonts'), { recursive: true });

// 1. Runtime e bibliotecas
cpSync(join(root, 'support.js'), join(out, 'support.js'));
const vendor = {
  'https://unpkg.com/react@18.3.1/umd/react.production.min.js': 'react/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js': 'react-dom/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js': '@babel/standalone/babel.min.js',
};
const resources = {};
for (const [url, file] of Object.entries(vendor)) {
  const name = file.split('/').pop();
  cpSync(join(nm, file), join(out, 'vendor', name));
  resources[url] = 'vendor/' + name;
}

// 2. Fontes (só latin; pesos usados no jogo e na Home)
const fonts = [
  ['Baloo 2', 'baloo-2', [600, 700, 800]],
  ['Luckiest Guy', 'luckiest-guy', [400]],
  ['Rammetto One', 'rammetto-one', [400]],
];
let css = '';
for (const [family, pkg, weights] of fonts) {
  for (const w of weights) {
    const f = `${pkg}-latin-${w}-normal.woff2`;
    cpSync(join(nm, '@fontsource', pkg, 'files', f), join(out, 'vendor', 'fonts', f));
    css += `@font-face{font-family:'${family}';font-style:normal;font-weight:${w};font-display:swap;src:url(fonts/${f}) format('woff2')}\n`;
  }
}
writeFileSync(join(out, 'vendor', 'fonts.css'), css);

// 3. Páginas: o jogo vira index.html; telas importadas por <dc-import name="X"> (Home → KingRico) vão junto
const offline = file => {
  const h = readFileSync(join(root, file), 'utf8')
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*>\n?/g, '')
    .replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2[^"]*" rel="stylesheet">/g, '<link href="vendor/fonts.css" rel="stylesheet">');
  if (/https?:\/\/(?!www\.w3\.org)/.test(h)) throw new Error(file + ' ainda aponta para a internet');
  return h.replace(
    '<script src="./support.js"></script>',
    `<script>window.__resources=${JSON.stringify(resources)}</script>\n<script src="./support.js"></script>`,
  );
};
const pages = {};
const queue = [['index.html', 'Fortune Circus.dc.html']];
while (queue.length) {
  const [name, file] = queue.shift();
  if (pages[name]) continue;
  pages[name] = offline(file);
  for (const m of pages[name].matchAll(/<(?:dc|x)-import[^>]*\sname="([^"]+)"/g)) queue.push([m[1] + '.dc.html', m[1] + '.dc.html']);
}
for (const [name, h] of Object.entries(pages)) writeFileSync(join(out, name), h);

// 4. Assets referenciados (no template ou no código)
const refs = new Set(
  Object.values(pages).flatMap(h =>
    [...h.matchAll(/assets[/|][A-Za-z0-9_./|-]+?\.(?:webp|png|jpg|jpeg|svg|glb|json|js)/g)].map(m => m[0].replace(/\|/g, '/')),
  ),
);
const missing = [...refs].filter(p => !existsSync(join(root, p)));
if (missing.length) throw new Error('Assets faltando:\n' + missing.join('\n'));
let bytes = 0;
for (const p of refs) {
  cpSync(join(root, p), join(out, p));
  bytes += statSync(join(root, p)).size;
}

// 5. Ícones e manifest da PWA (gerados por scripts/icons.mjs a partir do King Rico mestre)
const pub = join(app, 'public');
if (existsSync(pub)) cpSync(pub, out, { recursive: true });

console.log(`www pronto: ${refs.size} assets (${(bytes / 1048576).toFixed(1)} MB) → ${relative(root, out)}`);
