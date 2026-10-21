import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

test('production artifact serves every Home game and the Penalty renderer with local dependencies',async()=>{
  const result=spawnSync(process.execPath,['scripts/build.mjs','--production'],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const home=await readFile('dist/Home.dc.html','utf8');
  const games=[...new Set([...home.matchAll(/href="(Fortune[^"#?]+\.dc\.html)/g)].map(m=>decodeURIComponent(m[1])))];
  assert.ok(games.includes('Fortune Penalty.dc.html'));
  assert.match(await readFile('dist/Fortune Fingo.dc.html','utf8'),/src="\.\/runtime\/matter\.min\.js"/);
  for(const game of ['Clown','Bounce','Flying Clown','33','Claw']) assert.ok(games.includes(`Fortune ${game}.dc.html`));
  for(const file of ['clownball.js','bounce3d.js']) {const source=await readFile(path.join('dist',file),'utf8');assert.match(source,/const SRC = '\.\/runtime\/three\.module\.js'/);assert.doesNotMatch(source,/unpkg\.com/);}
  for(const game of games) {
    const html=await readFile(path.join('dist',game),'utf8');
    for(const script of ['firebase-config','client'])
      assert.equal([...html.matchAll(new RegExp(`src="\\./cloud/${script}\\.js"`,'g'))].length,1,game);
    for(const match of html.matchAll(/<(?:script|x-import)\b[^>]*\b(?:src|from)="(\.\/[^"?#]+)"/g))
      await access(path.join('dist',match[1]));
  }
  assert.equal(await readFile('dist/penalty3d.js','utf8'),await readFile('penalty3d.js','utf8'));
  assert.match(await readFile('dist/penalty3d.js','utf8'),/const SRC = '\.\/runtime\/three\.module\.js'/);
  await access('dist/assets/models/happeach-toy.glb');await access('dist/assets/models/king-rico-toy.glb');
  for(const art of ['symbols/sym-gem.png','symbols/sym-coin.webp','girafa/head.webp','king-rico/view-front.png'])await access('dist/assets/'+art);await access('dist/games/claw/game.js');await access('dist/games/claw/style.css');
  await access('dist/games/fortune21/game.js');await access('dist/games/fortune21/style.css');
  await access('dist/runtime/three.module.js');await access('dist/runtime/three.core.js');
  assert.equal(await readFile('dist/cloud/firebase-config.js','utf8'),await readFile('cloud/firebase-config.production.js','utf8'));
});
