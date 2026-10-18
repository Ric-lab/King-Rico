import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLayout,velocityFromGesture,simulateShot,applyOutcome,collect} from './physics.mjs';
test('mesmo cenário e gesto produzem o mesmo resultado',()=>{
  const v=velocityFromGesture(43,-140),layout=makeLayout(38495,1);
  assert.deepEqual(simulateShot(layout,v),simulateShot(layout,v));
  assert.deepEqual(layout,makeLayout(38495,1));
});
test('swipe proporcional funciona da mesma forma em telas diferentes',()=>{
  const a=velocityFromGesture(45,-120,390),b=velocityFromGesture(45*360/390,-120*360/390,360);
  assert.ok(Math.abs(a.vx-b.vx)<1e-10);assert.ok(Math.abs(a.vz-b.vz)<1e-10);
  assert.equal(velocityFromGesture(0,80),null);assert.equal(velocityFromGesture(3,-7),null);
});
test('todos os portais são alcançáveis com swipes em diferentes cenários',()=>{
  for(const seed of [1,872,214894,99999])for(let stage=0;stage<3;stage++){
    const reached=new Set(),layout=makeLayout(seed,stage);
    for(let dx=-125;dx<=125;dx+=1){const r=simulateShot(layout,velocityFromGesture(dx,-140));if(r.kind==='hit')reached.add(r.index);}
    assert.equal(reached.size,3,`seed ${seed}, lance ${stage}`);
  }
});
const fixture=()=>({balance:975,round:{id:'round',stake:25,amount:25,status:'flight',stage:0,outcome:{kind:'hit',mult:1.8}}});
test('retomar um resultado e receber repetidamente não duplica as moedas',()=>{
  const won=applyOutcome(fixture());assert.equal(won.round.amount,45);assert.equal(won.balance,975);
  assert.deepEqual(applyOutcome(won),won);
  const paid=collect(won);assert.equal(paid.balance,1020);assert.deepEqual(collect(paid),paid);
});
test('terceiro acerto paga uma vez e derrota não devolve aposta',()=>{
  const s=fixture();s.round.stage=2;s.round.amount=81;
  const paid=applyOutcome(s);assert.equal(paid.balance,1120);assert.equal(paid.round.status,'paid');assert.deepEqual(applyOutcome(paid),paid);assert.deepEqual(collect(paid),paid);
  const miss=fixture();miss.round.outcome={kind:'miss'};const lost=applyOutcome(miss);assert.equal(lost.balance,975);assert.equal(lost.round.status,'lost');assert.deepEqual(collect(lost),lost);
});
