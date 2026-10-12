import { mkdir, readFile, writeFile, copyFile, cp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import vm from 'node:vm';
import { build } from 'esbuild';

const root = path.resolve(import.meta.dirname, '..');
process.chdir(root);
const emulator = process.argv.includes('--emulator');
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
let config;
if(emulator) config='window.KING_RICO_FIREBASE = '+JSON.stringify({enabled:true,
  firebase:{apiKey:'demo-key',authDomain:'demo-king-rico.firebaseapp.com',projectId:'demo-king-rico',appId:'demo-app'},
  emulators:{host:'127.0.0.1'}})+';\n';
else {
  try { config=await readFile('cloud/firebase-config.js','utf8'); }
  catch(error) { if(error.code!=='ENOENT') throw error; config=await readFile('cloud/firebase-config.example.js','utf8'); }
  // A production build must never carry emulator routing.
  const sandbox={window:{}};vm.runInNewContext(config,sandbox,{timeout:1000});
  const settings=sandbox.window.KING_RICO_FIREBASE;
  if(!settings || typeof settings.enabled !== 'boolean') throw new Error('Invalid Firebase web configuration');
  if(settings.emulators) throw new Error('Remove emulator configuration before a production build');
  if(settings.enabled && ['apiKey','authDomain','projectId','appId'].some(key=>!settings.firebase?.[key]))
    throw new Error('Complete the public Firebase web configuration before enabling cloud mode');
}
await mkdir(path.join(destination,'cloud'),{recursive:true});
await writeFile(path.join(destination,'cloud/firebase-config.js'),config);
// Keep source-page development usable; the real config is a local ignored file.
try { await readFile('cloud/firebase-config.js'); }
catch(error) { if(error.code!=='ENOENT') throw error; await copyFile('cloud/firebase-config.example.js','cloud/firebase-config.js'); }
await copyFile('cloud/client.js',path.join(destination,'cloud/client.js'));
await cp('runtime',path.join(destination,'runtime'),{recursive:true});
await cp('assets',path.join(destination,'assets'),{recursive:true});
for(const file of ['support.js','KingRico.dc.html','King Rico.dc.html','index.html','game.html','version.json'])
  await copyFile(file,path.join(destination,file));
for(const file of ['Home.dc.html','Fortune Circus.dc.html','Fortune Wheel.dc.html']) {
  const source=await readFile(file,'utf8');
  await writeFile(path.join(destination,file),source.replace('<head>','<head>\n'+tags.join('\n')));
}
console.log(`Built ${emulator?'local emulator':'production'} web app in dist/`);
