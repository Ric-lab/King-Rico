// Syntax only: no browser, network, game execution or production wallet.
import {readdir, readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const {parse} = require('parse5'); // Already locked through firebase-tools/cheerio.
const root = path.resolve(process.argv[2] || 'dist');
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, {withFileTypes:true})) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (/\.(?:js|mjs|cjs)$/.test(entry.name)) files.push(file);
  }
}
function check(source, name, module = true) {
  const result = spawnSync(process.execPath, ['--check', `--input-type=${module ? 'module' : 'commonjs'}`], {input:source, encoding:'utf8'});
  if (result.error || result.status !== 0) throw Error(`${name}\n${result.stderr || result.error}`);
}
await walk(root);
for (const file of files) check(await readFile(file, 'utf8'), path.relative(root, file), !file.endsWith('.cjs'));
const html = await readFile(path.join(root, 'Fortune Circus.dc.html'), 'utf8');
const errors = [];
const document = parse(html, {onParseError:error => errors.push(error.code)});
const invalid = errors.filter(code => code !== 'missing-doctype');
if (invalid.length) throw Error(`HTML principal inválido: ${[...new Set(invalid)].join(', ')}`);
let scripts = 0, body = false;
function visit(node) {
  if (node.tagName === 'body') body = true;
  if (node.tagName === 'script' && !node.attrs.some(attr => attr.name === 'src')) {
    const type = node.attrs.find(attr => attr.name === 'type')?.value || '';
    if (!type || /^(module|text\/javascript|application\/javascript)$/.test(type)) {
      check((node.childNodes || []).map(child => child.value || '').join(''), `HTML principal: script ${++scripts}`, type === 'module');
    }
  }
  for (const child of node.childNodes || []) visit(child);
}
visit(document);
if (!body || !/<body\b/i.test(html)) throw Error('HTML principal sem body.');
console.log(`Sintaxe OK: ${files.length} arquivos JS/MJS/CJS e ${scripts} scripts inline; HTML principal analisado.`);
