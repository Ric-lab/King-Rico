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
await mkdir(path.join(destination,'games/fortune21'),{recursive:true});
await copyFile('games/fortune21/style.css',path.join(destination,'games/fortune21/style.css'));
await build({entryPoints:['games/fortune21/game.js'],outfile:path.join(destination,'games/fortune21/game.js'),bundle:true,format:'esm',target:'es2022',minify:true});
for(const file of ['support.js','penalty3d.js','clownball.js','bounce3d.js','KingRico.dc.html','King Rico.dc.html','index.html','version.json'])
  await copyFile(file,path.join(destination,file));
// The authoring tool can regenerate a packed game.html. Hosting always loads the
// current source game so that Firebase login and wallet adapters remain active.
await writeFile(path.join(destination,'game.html'),`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>King Rico</title>
<script>location.replace("Fortune%20Circus.dc.html"+location.search+location.hash);</script>
</head><body><a href="Fortune%20Circus.dc.html">Abrir King Rico</a></body></html>\n`);
for(const file of ['Home.dc.html','Fortune Circus.dc.html','Fortune Wheel.dc.html','Fortune Neck.dc.html','Fortune Fingo.dc.html','Fortune Penalty.dc.html','Fortune Clown.dc.html','Fortune Bounce.dc.html','Fortune Flying Clown.dc.html','Fortune 21.dc.html']) {
  const source=(await readFile(file,'utf8')).replace(/<script\b[^>]*src=["']\.\/cloud\/(?:firebase-config|client)\.js["'][^>]*>\s*<\/script>\s*/g,'');
  if (!source.includes('<head>')) throw new Error(`Missing HTML head in ${file}`);
  const cloudTags='<script src="./cloud/firebase-config.js"></script>\n<script defer src="./cloud/client.js"></script>';
  await writeFile(path.join(destination,file),source.replace('<head>','<head>\n'+tags.join('\n')+'\n'+cloudTags));
}
console.log(`Built ${emulator?'local emulator':'production'} web app in dist/`);
