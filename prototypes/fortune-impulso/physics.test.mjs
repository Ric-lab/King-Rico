import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLayout,velocityFromGesture,simulateShot,applyOutcome,collect,START,FLIGHT_TIME,createBall,stepBall} from './physics.mjs';
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
test('todas as zonas são alcançáveis com gestos em diferentes cenários',()=>{
  for(const seed of [1,872,214894,99999])for(let stage=0;stage<3;stage++){
    const reached=new Set(),layout=makeLayout(seed,stage);
    for(let dx=-60;dx<=60;dx+=3)for(let dy=-65;dy>=-155;dy-=3){const r=simulateShot(layout,velocityFromGesture(dx,dy));if(r.kind==='hit')reached.add(r.index);}
    assert.equal(reached.size,3,`seed ${seed}, lance ${stage}`);
  }
});
test('a trajetória animada termina no mesmo ponto usado para calcular o prêmio',()=>{
  const layout=makeLayout(3948,1),v=velocityFromGesture(25,-108),predicted=simulateShot(layout,v),b=createBall(v);
  while(!b.done)stepBall(b,layout);
  assert.deepEqual(b.result,predicted);assert.ok(Math.abs(b.x-predicted.x)<1e-9);assert.ok(Math.abs(b.z-predicted.z)<1e-9);
});
test('maior precisão paga mais e a dica identifica o erro real',()=>{
  const layout=makeLayout(456),{x,z,radius}=layout.target;
  const at=(dx,dz)=>simulateShot(layout,{vx:(x+dx-START.x)/FLIGHT_TIME,vz:(z+dz-START.z)/FLIGHT_TIME,vy:6.6});
  assert.equal(at(0,0).mult,3);assert.equal(at(radius*.5,0).mult,1.8);assert.equal(at(radius*.85,0).mult,1.2);
  assert.match(at(0,radius+1).hint,/força/);assert.match(at(radius+1,0).hint,/esquerda/);assert.match(at(-radius-1,0).hint,/direita/);
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
test('ensaio não gasta nem paga moedas, inclusive ao retomar',()=>{
  const s=fixture();s.round.training=true;s.round.stake=0;s.round.outcome.points=93;
  const result=applyOutcome(s);assert.equal(result.balance,s.balance);assert.equal(result.round.amount,93);assert.equal(result.round.status,'paid');assert.equal(result.best,93);assert.equal(result.practiceLast.points,93);assert.deepEqual(applyOutcome(result),result);assert.deepEqual(collect(result),result);
});
