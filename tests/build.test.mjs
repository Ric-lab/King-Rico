import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
test('production publishes Circus and safe redirects, with archived game sources and assets preserved',async()=>{
 const r=spawnSync(process.execPath,['scripts/build.mjs','--production'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
 const routes=JSON.parse(await readFile('site/routes.json','utf8'));
 assert.deepEqual(routes.filter(r=>!r.archived).map(r=>r.path),['/circus']);
 for(const route of routes){const html=await readFile(path.join('dist',route.file),'utf8');await access(route.file);
  if(route.archived){assert.match(html,/location.replace\("\/circus"/);assert.doesNotMatch(html,/data-game=|data-spin-btn|parkEntry/);continue;}
  assert.match(html,/content="circus"/);assert.equal([...html.matchAll(/id="kr-boot-screen"/g)].length,1);
  assert.equal([...html.matchAll(/src="\.\/cloud\/client.js"/g)].length,1);
  for(const match of html.matchAll(/<(?:script|x-import)\b[^>]*\b(?:src|from)="(\.\/[^"?#]+)"/g))await access(path.join('dist',match[1]));
 }
 for(const file of ['runtime/three.module.js','runtime/three.core.js','assets/symbols/sym-scepter.png','ui/park/controller-reserved.svg','assets/tony/head.webp','assets/tucker/head.webp','assets/ray/head-v1.webp'])await access('dist/'+file);
 assert.equal(await readFile('dist/cloud/firebase-config.js','utf8'),await readFile('cloud/firebase-config.production.js','utf8'));
 assert.doesNotMatch(await readFile('dist/ui/park/client.js','utf8'),/mobile-preview|mock-wallet|test-wallet/);
 const manifest=JSON.parse(await readFile('dist/manifest.webmanifest','utf8'));assert.equal(manifest.start_url.split('?')[0],'/circus');for(const icon of manifest.icons)await access(path.join('dist',icon.src));
 const hosting=JSON.parse(await readFile('firebase.json','utf8')).hosting;
 for(const route of routes)assert.ok(hosting.rewrites.some(r=>r.source===route.path&&r.destination==='/'+route.file));
 // Archived game art/models and their original sources remain available for recovery.
 for(const file of ['Fortune Fingo.dc.html','Fortune Penalty.dc.html','Fortune Flying Clown.dc.html','Fortune Bounce.dc.html'])await access(file);
 for(const file of ['assets/fingo/bet-panel.webp','assets/models/happeach-toy.glb','assets/models/king-rico-toy.glb','penalty3d.js','bounce3d.js'])await access('dist/'+file);
});
