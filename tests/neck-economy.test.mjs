import test from 'node:test';
import assert from 'node:assert/strict';
import engine from '../cloud/engine.cjs';
import {auditNeck} from '../scripts/neck-audit.mjs';

const audit=auditNeck();
test('collecting at the first two floors with a 10-coin stake has risk and negative expectation',()=>{
  const bet=audit.bets.find(b=>b.bet===10);
  for(const floor of bet.fixedFloors.slice(0,2)) {
    assert.ok(floor.success>0 && floor.success<1);
    assert.ok(Math.abs(floor.rtp-engine.NECK_BASE)<1e-8);
    assert.ok(Math.abs(floor.expectedNet-(engine.NECK_BASE-1)*10)<1e-7);
  }
  assert.ok(Math.abs(bet.fixedFloors[0].success-engine.NECK_BASE/1.1)<1e-8);
  assert.ok(Math.abs(bet.fixedFloors[1].success-engine.NECK_BASE/1.2)<1e-8);
  assert.equal(engine.neckPrize(10,1),1100);
  assert.equal(engine.neckPrize(10,2),1200);
});
test('all legal stakes and optimal stopping policies remain below a 100% return',()=>{
  assert.equal(audit.bets.length,engine.BETS.length);
  assert.equal(audit.peachProbability,1/8);
  for(const bet of audit.bets) {
    assert.equal(bet.fixedFloors.length,33);
    for(const floor of bet.fixedFloors) assert.ok(floor.rtp<1,JSON.stringify({bet:bet.bet,...floor}));
    assert.ok(bet.optimalRtp<1,JSON.stringify(bet));
    assert.ok(bet.optimalRtp>=Math.max(...bet.fixedFloors.map(f=>f.rtp))-1e-8);
  }
});
test('the audit includes rounding and a guarantee-aware strategy rather than the nominal RTP alone',()=>{
  const small=audit.bets.find(b=>b.bet===2.5),ten=audit.bets.find(b=>b.bet===10);
  assert.ok(small.fixedFloors[0].rtp>ten.fixedFloors[0].rtp);
  assert.ok(ten.optimalRtp>ten.fixedFloors[0].rtp);
  assert.ok(Math.abs(audit.maxOptimalRtp-.98)<1e-8);
});
test('the audit detects a genuinely profitable payout regression',()=>{
  const changed={...engine,neck(...args){
    const outcome=engine.neck(...args);
    return {...outcome,winUnits:outcome.winUnits*2};
  }};
  assert.ok(auditNeck(changed).maxOptimalRtp>1);
});
