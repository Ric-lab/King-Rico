import {mkdir, copyFile} from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
const root = path.resolve(import.meta.dirname, '..');
const out = path.resolve(process.argv[2] || path.join(root, 'work/fortune-21/dist'));
const source = path.join(root, 'prototypes/fortune-21');
await mkdir(path.join(out, 'assets'), {recursive:true});
for (const file of ['index.html', 'style.css']) await copyFile(path.join(source, file), path.join(out, file));
for (const [from,to] of [
  ['assets/fonts/baloo2-latin.woff2','baloo2-latin.woff2'],
  ['assets/fonts/rammettoone-latin.woff2','rammettoone-latin.woff2'],
  ['assets/symbols-v7.webp','symbols.webp'],
  ['assets/symbols/sym-coin.webp','coin.webp'],
  ['assets/brand/king-rico-sitting.png','king-rico.png'],
  ['assets/wheel/stage-bg.webp','stage.webp'],
  ['assets/stage-lit.webp','stage-lit.webp'],
  ['assets/icons/btn-menu.png','menu.png'],
  ['assets/spin/spin-base.webp','spin-base.webp'],
  ['assets/spin/spin-pressed.webp','spin-pressed.webp'],
]) await copyFile(path.join(root,from), path.join(out,'assets',to));
await build({entryPoints:[path.join(source,'game.js')],outfile:path.join(out,'game.js'),bundle:true,format:'esm',target:'es2022',minify:true,legalComments:'external'});
console.log('Fortune 21: '+out);
