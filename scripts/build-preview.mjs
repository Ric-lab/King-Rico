// Rebuild the visual preview entirely from this checkout; no Firebase connection.
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {build} from 'esbuild';
import {relocatePreview} from './preview-base.mjs';
const root=path.resolve(import.meta.dirname,'..');process.chdir(root);
execFileSync(process.execPath,['scripts/build.mjs','--emulator'],{stdio:'inherit'});
await mkdir('work',{recursive:true});
const native=await readFile('ui/park/index.js','utf8');
const imports=[...native.matchAll(/^import .*;$/gm)].map(m=>m[0].replace(/from '([^']+)'/,(_,p)=>'from '+JSON.stringify(path.resolve('ui/park',p))));
const prefix=await readFile('prototypes/circus-preview/wallet-client.js','utf8');
let body=native.slice(native.indexOf('function toast('));
body=body.replace('function boot(){',`call({action:'state'}).then(r=>readyResolve(r.player)).catch(e=>{Cloud.error(e);readyResolve(null);});\nfunction boot(){const badge=document.createElement('span');badge.textContent='PRÉVIA · MOEDAS DE TESTE';badge.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#20152c;color:white;text-align:center;font:10px sans-serif;z-index:99999';document.body.append(badge);`);
await writeFile('work/preview-entry.mjs',`import '../prototypes/circus-preview/browser-wallet.mjs';\n${imports.join('\n')}\n${prefix}\nObject.defineProperty(Cloud,'park',{get:()=>state});\nconst game=document.querySelector('meta[name="king-rico-game"]')?.content;Cloud.parkMode=['clown','penalty','flying','fingo','bounce'].includes(game);\n${body}`);
await build({entryPoints:['work/preview-entry.mjs'],outfile:'dist/cloud/client.js',bundle:true,format:'iife',minify:true,alias:{'node:crypto':path.join(root,'prototypes/circus-preview/crypto-browser.mjs')}});
await writeFile('dist/cloud/firebase-config.js','window.KING_RICO_FIREBASE={enabled:false};\n');
await writeFile('dist/ui/app-shell.js','/* Local preview: no service worker or installation. */\n');
// The preview client above already includes the native park UI. Loading the
// production bundle too creates competing controllers, duplicate charge animations and
// bonus handlers that call unavailable production wallet methods.
for(const name of await readdir('dist'))if(name.endsWith('.html')){
 const file=path.join('dist',name),html=await readFile(file,'utf8');
 await writeFile(file,html.replace(/<script\b[^>]*\bsrc=["'][^"']*ui\/park\/client\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/g,''));
}

const routes=JSON.parse(await readFile('site/routes.json','utf8'));
// Resolve clean routes in a plain static server, including navigation between games.
for(const route of [...routes,{path:'/home',file:'Fortune Circus.dc.html'}]){
 const dir=path.join('dist',route.path.slice(1));await mkdir(dir,{recursive:true});
 await writeFile(path.join(dir,'index.html'),'<script>location.replace('+JSON.stringify('/'+encodeURIComponent(route.file))+'+location.search+location.hash)</script>');
}
await relocatePreview('dist',process.argv.find(a=>a.startsWith('--base='))?.slice(7)||'');
console.log('Local preview ready in dist/; use a static server on port 4178.');
