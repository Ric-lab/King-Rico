import { mkdir, readFile, writeFile, copyFile, cp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import vm from 'node:vm';
import { build } from 'esbuild';

const root = path.resolve(import.meta.dirname, '..');
process.chdir(root);
const emulator = process.argv.includes('--emulator');
const production = process.argv.includes('--production');
if (emulator && production) throw new Error('Choose production or emulator build');
const destination = path.join(root, 'dist');
const routes = JSON.parse(await readFile('site/routes.json','utf8'));
await rm(destination, { recursive:true, force:true });
await mkdir(destination, {recursive:true});
await mkdir('runtime',{recursive:true});
const runtime = await readFile('support.js','utf8');
const packages = {
  'react.js':['REACT','react/umd/react.production.min.js'],
  'react-dom.js':['REACT_DOM','react-dom/umd/react-dom.production.min.js'],
  'babel.js':['BABEL','@babel/standalone/babel.min.js']
};
const tags=[];
for (const [name,[key,relative]] of Object.entries(packages)) {
  const data=await readFile(`node_modules/${relative}`);
  const expected=runtime.match(new RegExp(`var ${key}_SRI = "([^"]+)"`))?.[1];
  const actual='sha384-'+createHash('sha384').update(data).digest('base64');
  if (!expected || actual!==expected) throw new Error(`Repository SRI mismatch for ${name}`);
  await writeFile(`runtime/${name}`,data);
  tags.push(`<script src="./runtime/${name}" integrity="${expected}" crossorigin="anonymous"></script>`);
}
await build({entryPoints:['cloud/client-src.js'],outfile:'cloud/client.js',bundle:true,format:'iife',target:'es2022',minify:true});
// Pin the Fingo physics/renderer in the lockfile and serve them with the game.
for(const [source,name] of [['matter-js/build/matter.min.js','matter.min.js'],['three/build/three.module.js','three.module.js'],['three/build/three.core.js','three.core.js'],['matter-js/LICENSE','matter.LICENSE'],['three/LICENSE','three.LICENSE']])
  await copyFile('node_modules/'+source,'runtime/'+name);
let config;
if(emulator) config='window.KING_RICO_FIREBASE = '+JSON.stringify({enabled:true,
  firebase:{apiKey:'demo-key',authDomain:'demo-king-rico.firebaseapp.com',projectId:'demo-king-rico',appId:'demo-app'},
  emulators:{host:'127.0.0.1'}})+';\n';
else {
  const files=production ? ['cloud/firebase-config.production.js'] :
    ['cloud/firebase-config.js','cloud/firebase-config.production.js','cloud/firebase-config.example.js'];
  for (const file of files) {
    try { config=await readFile(file,'utf8'); break; }
    catch(error) { if(error.code!=='ENOENT') throw error; }
  }
  if (!config) throw new Error('Firebase Web configuration is missing');
  // A production build must never carry emulator routing.
  const sandbox={window:{}};vm.runInNewContext(config,sandbox,{timeout:1000});
  const settings=sandbox.window.KING_RICO_FIREBASE;
  if(!settings || typeof settings.enabled !== 'boolean') throw new Error('Invalid Firebase web configuration');
  if(settings.emulators) throw new Error('Remove emulator configuration before a production build');
  if(production && (!settings.enabled || settings.firebase?.projectId!=='king-rico'))
    throw new Error('Production deployment must target the enabled king-rico project');
  if(settings.enabled && ['apiKey','authDomain','projectId','appId'].some(key=>!settings.firebase?.[key]))
    throw new Error('Complete the public Firebase web configuration before enabling cloud mode');
}
await mkdir(path.join(destination,'cloud'),{recursive:true});
await writeFile(path.join(destination,'cloud/firebase-config.js'),config);
// Keep source-page development usable; the real config is a local ignored file.
try { await readFile('cloud/firebase-config.js'); }
catch(error) {
  if(error.code!=='ENOENT') throw error;
  if(emulator) await copyFile('cloud/firebase-config.example.js','cloud/firebase-config.js');
  else await writeFile('cloud/firebase-config.js',config);
}
await copyFile('cloud/client.js',path.join(destination,'cloud/client.js'));
await cp('runtime',path.join(destination,'runtime'),{recursive:true});
await cp('ui',path.join(destination,'ui'),{recursive:true});
await cp('assets',path.join(destination,'assets'),{recursive:true});
await mkdir(path.join(destination,'games/race'),{recursive:true});
await copyFile('games/race/style.css',path.join(destination,'games/race/style.css'));
await build({entryPoints:['games/race/game.js'],outfile:path.join(destination,'games/race/game.js'),bundle:true,format:'esm',target:'es2022',minify:true,plugins:[{name:'shared-three',setup(b){b.onResolve({filter:/^three$/},()=>({path:'three',external:true}));}}]});
await build({entryPoints:['games/race/physics-worker.js'],outfile:path.join(destination,'games/race/physics-worker.js'),bundle:true,format:'esm',target:'es2022',minify:true,plugins:[{name:'cannon-browser',setup(b){b.onResolve({filter:/^cannon-es$/},()=>({path:path.join(root,'node_modules/cannon-es/dist/cannon-es.js')}));}}]});
await mkdir(path.join(destination,'games/claw'),{recursive:true});
await copyFile('games/claw/style.css',path.join(destination,'games/claw/style.css'));
await build({entryPoints:['games/claw/game.js'],outfile:path.join(destination,'games/claw/game.js'),bundle:true,format:'esm',target:'es2022',minify:true,plugins:[{name:'shared-three',setup(b){b.onResolve({filter:/^three$/},()=>({path:'three',external:true}));}}]});
await mkdir(path.join(destination,'games/fortune21'),{recursive:true});
await copyFile('games/fortune21/style.css',path.join(destination,'games/fortune21/style.css'));
await build({entryPoints:['games/fortune21/game.js'],outfile:path.join(destination,'games/fortune21/game.js'),bundle:true,format:'esm',target:'es2022',minify:true});
for(const file of ['support.js','penalty3d.js','clownball.js','bounce3d.js','KingRico.dc.html','King Rico.dc.html','index.html','version.json','manifest.webmanifest','sw.js'])
  await copyFile(file,path.join(destination,file));
// The authoring tool can regenerate a packed game.html. Hosting always loads the
// current source game so that Firebase login and wallet adapters remain active.
await writeFile(path.join(destination,'game.html'),`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Fortune Circus</title>
<script>location.replace("/circus"+location.search+location.hash);</script>
</head><body><a href="/circus">Abrir Fortune Circus</a></body></html>\n`);
for(const {file,game,title} of routes) {
  const source=(await readFile(file,'utf8')).replace(/<script\b[^>]*src=["']\.\/cloud\/(?:firebase-config|client)\.js["'][^>]*>\s*<\/script>\s*/g,'');
  if (!source.includes('<head>')) throw new Error(`Missing HTML head in ${file}`);
  const cloudTags='<script src="./cloud/firebase-config.js"></script>\n<script defer src="./cloud/client.js"></script>';
  // Content-version stylesheet URLs so a cached old theme cannot override a new release.
  const bannerTags='<link rel="stylesheet" href="./ui/banner.css">\n<script src="./ui/banner.js"></script>\n<script src="./ui/wallet.js"></script>';
  const appTags=`<title>${title}</title>
<meta name="king-rico-game" content="${game}">
<meta name="theme-color" content="#1d0733">
<meta name="application-name" content="Fortune Circus">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Fortune Circus">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" type="image/png" href="/assets/app/icon-192.png">
<link rel="apple-touch-icon" href="/assets/app/apple-touch-icon.png">
<script defer src="/ui/app-shell.js"></script>`;
  let html=source.replace(/<title>[^<]*<\/title>/g,'').replace('<head>','<head>\n'+appTags+'\n'+bannerTags+'\n'+tags.join('\n')+'\n'+cloudTags);
  // Only navigation links change; DC component imports retain their source filenames.
  html=html.replace(/href="([^"?#]+)([?#][^"]*)?"/g,(match,target,suffix='')=>{
    const route=routes.find(entry=>entry.file===decodeURI(target.replace(/^\.\//,'')));
    return route ? `href="${route.path}${suffix}"` : match;
  });
  const styles=[...html.matchAll(/href="(\.\/[^"?]+\.css)"/g)];
  for(const [,href] of styles){
    const bytes=await readFile(path.join(destination,href));
    const revision=createHash('sha256').update(bytes).digest('hex').slice(0,12);
    html=html.replaceAll(`href="${href}"`,`href="${href}?v=${revision}"`);
  }
  await writeFile(path.join(destination,file),html);
}
console.log(`Built ${emulator?'local emulator':'production'} web app in dist/`);
