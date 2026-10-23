import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

test('production artifact serves every Home game and the Penalty renderer with local dependencies',async()=>{
  const result=spawnSync(process.execPath,['scripts/build.mjs','--production'],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const home=await readFile('dist/Home.dc.html','utf8');
  const routes=JSON.parse(await readFile('site/routes.json','utf8'));
  const games=[...new Set([...home.matchAll(/href="([^"#?]+)(?:[?#][^"]*)?"/g)].map(m=>routes.find(r=>r.path===m[1])?.file).filter(Boolean))];
  assert.ok(games.includes('Fortune Penalty.dc.html'));
  assert.match(await readFile('dist/Fortune Fingo.dc.html','utf8'),/src="\.\/runtime\/matter\.min\.js"/);
  for(const game of ['Circus','Wheel','Neck','Fingo','Penalty','Clown','Flying Clown','33']) assert.ok(games.includes(`Fortune ${game}.dc.html`));
  for(const file of ['clownball.js','bounce3d.js']) {const source=await readFile(path.join('dist',file),'utf8');assert.match(source,/const SRC = '\.\/runtime\/three\.module\.js'/);assert.doesNotMatch(source,/unpkg\.com/);}
  const archived=['Bounce','Claw','Race'].map(game=>`Fortune ${game}.dc.html`);
  for(const game of archived)assert.ok(!games.includes(game),`${game} stays archived outside Home`);
  for(const game of [...games,...archived]) {
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
  await access('dist/games/race/physics-worker.js');await access('dist/games/race/game.js');await access('dist/games/race/style.css');await access('dist/assets/brand/cover-race.png');
  await access('dist/games/fortune21/game.js');await access('dist/games/fortune21/style.css');
  await access('dist/runtime/three.module.js');await access('dist/runtime/three.core.js');
  assert.equal(await readFile('dist/cloud/firebase-config.js','utf8'),await readFile('cloud/firebase-config.production.js','utf8'));
  const hosting=JSON.parse(await readFile('firebase.json','utf8')).hosting;
  const manifest=JSON.parse(await readFile('dist/manifest.webmanifest','utf8'));
  assert.equal(manifest.name,'Fortune Circus');
  assert.equal(manifest.display,'standalone');
  assert.ok(routes.some(r=>r.path===manifest.start_url.split('?')[0]));
  for(const icon of manifest.icons) await access(path.join('dist',icon.src));
  await access('dist/assets/brand/covers/stage.webp');
  for(const route of routes) {
    assert.ok(hosting.rewrites.some(r=>r.source===route.path && r.destination==='/'+route.file),route.path);
    assert.ok(hosting.headers.some(r=>r.source===route.path && r.headers.some(h=>h.key==='Cache-Control' && h.value==='no-store')),route.path+' must not serve a stale game');
    const html=await readFile(path.join('dist',route.file),'utf8');
    assert.match(html,/<link rel="manifest" href="\/manifest.webmanifest">/);
    assert.match(html,/<link rel="apple-touch-icon"/);
    assert.ok(html.includes(`<meta name="king-rico-game" content="${route.game}">`));
    assert.equal([...html.matchAll(/<title>/g)].length,1);
  }
  await access('dist/ui/app-shell.js');await access('dist/sw.js');
  for(const file of ['ui/loading.js','ui/loading.css','assets/brand/loading-king-rico.webp'])await access(path.join('dist',file));
  for(const name of ['machine-front','wheel','neck','clown','penalty','33','flying']) {
    const asset=`assets/brand/covers/${name}.webp`;
    assert.ok(home.includes(asset),asset);
    await access(path.join('dist',asset));
  }
  await access('dist/assets/brand/covers/stage.webp');
  for(const route of routes) {
    const html=await readFile(path.join('dist',route.file),'utf8');
    assert.equal([...html.matchAll(/id="kr-boot-screen"/g)].length,1);
    assert.ok(html.indexOf('id="kr-boot-screen"')<html.indexOf('<x-dc>') || !html.includes('<x-dc>'));
    assert.match(html,/<script defer src="\.\/runtime\/react.js"/);
    assert.match(html,/<style data-kr-loading-style>/);
    assert.match(html,/data:image\/webp;base64,/);
  }
});
