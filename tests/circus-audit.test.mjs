import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {auditCircusV4} from '../scripts/economy-audit.mjs';
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
