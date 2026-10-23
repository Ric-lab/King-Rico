import test from 'node:test';
import assert from 'node:assert/strict';
import engine from '../cloud/engine.cjs';
import {auditFlying} from '../scripts/flying-audit.mjs';
const sequence=(...xs)=>()=>{assert.ok(xs.length,'Unexpected random draw');return xs.shift();};
test('Flying and Neck share checkpoint acquisition, increased protected risk and saved-prize settlement',()=>{
 for(const game of ['flying','neck']){
  const play=(r,move,rng)=>game==='flying'?engine.flying(10,r,move,'round',r?.step||0,rng):engine.neck(10,r,move,'round',rng);
  const move=game==='flying'?'pop':'climb',min=game==='flying'?2:6;
  let x=play(null,move,sequence(0,0,0));assert.equal(x.peachAt,min);assert.equal(x.savedUnits,0);
  let r={...x,id:'round'};
  for(let f=2;f<=min;f++){x=play(r,move,sequence(0));r={...x,id:'round'};}
  const saved=play(r,'collect',sequence()).winUnits;
  assert.equal(x.savedUnits,saved);
  const lost=play(structuredClone(r),move,sequence(.999));
  assert.equal(lost.ok,false);assert.equal(lost.ended,true);assert.equal(lost.winUnits,saved);
  // Same risk reduction applies in both games after protection has been earned.
  const threshold=game==='flying'?.7:.87;
  assert.equal(play(r,move,sequence(threshold)).ok,false);
  assert.equal(play({...r,savedUnits:0},move,sequence(threshold)).ok,true);
  const next=play(r,move,sequence(0));assert.equal(next.savedUnits,saved);assert.equal(next.winUnits,0);
 }
});
test('Flying audit includes known checkpoints, all legal stakes and optimal choices without positive expectation',()=>{
 const x=auditFlying();assert.equal(x.peachProbability,1/8);
 for(const b of x.bets){assert.ok(Math.abs(b.optimalRtp-.98)<1e-8);assert.ok(b.fixedFloors.every(f=>f.rtp<1));}
 const bad=auditFlying({...engine,flying:(...args)=>{const x=engine.flying(...args);return{...x,winUnits:x.winUnits*2};}});
 assert.ok(bad.maxOptimalRtp>1,'Audit must detect inflated guarantees and collection');
});
test('A Flying round opened before protection keeps its original terms and does not draw Happeach',()=>{
 const r={id:'r',betUnits:250,step:1,popped:[0]};
 const x=engine.flying(2.5,r,'pop','r',1,sequence(.79));assert.equal(x.ok,true);
 assert.equal('ladderVersion' in x,false);assert.equal('savedUnits' in x,false);
 assert.equal(engine.flying(2.5,r,'collect','r',-1,sequence()).winUnits,300);
});
