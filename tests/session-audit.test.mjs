import test from 'node:test';
import assert from 'node:assert/strict';
import engine from '../cloud/engine.cjs';
import {profiles,auditSession} from '../scripts/session-audit.mjs';
test('short-session audit covers all eight public games and separates profits, pushes and returns',()=>{
 assert.equal(new Set(profiles.map(p=>p.game)).size,8);
 for(const p of profiles){
  const options={count:12,rounds:10,stake:10};
  const a=auditSession(engine,p,options),b=auditSession(engine,p,options);
  assert.deepEqual(a,b);assert.ok(a.completedRounds>0);
  assert.ok(Math.abs(a.profitRate+a.pushRate+a.partialReturnRate+a.zeroReturnRate-1)<1e-12);
  assert.ok(a.endingBalance.p10>=0&&a.endingBalance.p90>=a.endingBalance.median);
  assert.ok(a.medianActions>=a.medianRounds);
 }
});
test('session audit stops when the next stake cannot be paid',()=>{
 const a=auditSession(engine,profiles.find(p=>p.id==='wheel-fortune'),{count:20,rounds:100,stake:1000,startingBalance:1000});
 assert.ok(a.unableToBetAgain>.8);assert.equal(a.medianRounds,1);
 assert.equal(a.endingBalance.median,0);
});
