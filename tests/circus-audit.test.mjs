import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {auditCircusV4,auditCircusV5} from '../scripts/economy-audit.mjs';
import profile from '../cloud/circus-profile.cjs';
test('approved audit covers five million v4 spins at each required stake and current sources',()=>{
 const report=JSON.parse(readFileSync('docs/circus-economy-audit.json'));
 assert.equal(report.passed,true);assert.deepEqual(report.results.map(x=>x.bet),[1,10,100,1000]);
 for(const [file,hash]of Object.entries(report.sourceHashes))assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),hash,file+' changed after audit');
 for(const row of report.results){
  assert.equal(row.version,4);assert.ok(row.spins>=5000000);assert.deepEqual(row.pays,profile.PAYS);
  const c=row.components,total=(c.baseAndFeatureCoins+c.wheelCoins-c.tigerStolen+c.ticketsAwarded*25)/(row.spins*row.bet);
  assert.ok(Math.abs(total-row.totalReturn)<1e-10);assert.ok(total>=.885&&total<=.915&&total<1);
  assert.ok(row.netOfRayReturn>=.885&&row.netOfRayReturn<=.915);
 }
});
test('v4 audit is reproducible and accounts for bonus, theft and ticket value separately',()=>{
 const a=auditCircusV4({spins:1000,bet:10,seed:472831});assert.deepEqual(a,auditCircusV4({spins:1000,bet:10,seed:472831}));
 assert.equal(a.components.ticketCoins,a.components.ticketsAwarded*25);assert.ok(a.components.wheelCoins>0);assert.ok(a.components.tigerStolen>0);
 assert.throws(()=>auditCircusV4({spins:0,bet:10}));
});

test('v5 audit covers 5 million spins per stake, literal pays, net tickets and the final controller sources',()=>{
 const report=JSON.parse(readFileSync('docs/circus-economy-v5-audit.json'));assert.equal(report.passed,true);assert.deepEqual(report.results.map(x=>x.bet),[1,10,100,1000]);
 for(const [file,hash]of Object.entries(report.sourceHashes))assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),hash,file+' changed after v5 audit');
 for(const row of report.results){
  assert.equal(row.version,5);assert.ok(row.spins>=5000000);assert.deepEqual(row.pays,profile.PAYS_V5);
  const c=row.components,gross=(c.baseAndFeatureCoins+c.wheelCoins-c.tigerStolen+c.ticketsAwarded*25)/(row.spins*row.bet),net=gross-c.rayStolenTickets*25/(row.spins*row.bet);
  assert.ok(Math.abs(gross-row.totalReturn)<1e-10);assert.ok(Math.abs(net-row.netOfRayReturn)<1e-10);
  for(const r of[gross,net])assert.ok(r>=.885&&r<=.915&&r<1);
 }
 const options={spins:1000,bet:10,seed:472831};assert.deepEqual(auditCircusV5(options),auditCircusV5(options));
});

test('v5 release gate also covers changing stakes and a high bet only on the tenth spin',()=>{
 const rows=readFileSync('docs/circus-economy-v5-stake-stress.jsonl','utf8').trim().split('\n').map(JSON.parse);
 assert.deepEqual(rows.map(r=>r.mode),['alternate','before-wheel']);
 for(const row of rows){assert.ok(row.spins>=1000000);for(const value of[row.gross,row.net])assert.ok(value>=.885&&value<=.915&&value<1,JSON.stringify(row));}
});

test('v6 five million spins at every stake plus changing stakes and armor farming stay near 90%',()=>{
 const report=JSON.parse(readFileSync('docs/circus-economy-v6-audit.json'));
 assert.equal(report.passed,true);assert.deepEqual(report.results.map(x=>x.bet),[1,10,100,1000]);
 for(const [file,hash]of Object.entries(report.sourceHashes))assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),hash,file+' changed after v6 audit');
 for(const row of [...report.results,...JSON.parse(readFileSync('docs/circus-economy-v6-stress.json'))]){
  assert.ok(row.spins>=1000000);assert.deepEqual(row.pays,profile.PAYS_V6);assert.deepEqual(row.weights,profile.WEIGHTS_V6);
  assert.equal(row.cedarProbability,profile.CEDAR_P);
  const c=row.components,r=(c.paid+c.wheel-c.theft)/c.wagered;
  assert.ok(Math.abs(r-row.return)<1e-10);assert.ok(r>=.885&&r<=.915&&r<1);
 }
});
