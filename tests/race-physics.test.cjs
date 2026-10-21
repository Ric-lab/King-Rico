const test=require('node:test'),assert=require('node:assert/strict');
const {simulate,surface,LAYOUTS}=require('../cloud/race-physics.cjs');
const {race,physicalWinner}=require('../cloud/race.cjs');
const winners=require('../cloud/race-physics-winners.json');
const fs=require('node:fs');
test('Rigid bodies start at rest, accelerate with gravity, collide, finish and exactly match every rule settlement',()=>{
 const counts=[0,0,0,0,0];
 for(let layout=0;layout<LAYOUTS;layout++){
  const a=simulate(layout);assert.equal(a.order[0],winners[layout]);assert.ok(a.contacts>0);assert.ok(a.duration>12&&a.duration<35);
  assert.ok(a.frames[120].reduce((sum,b)=>sum+b[7],0)/5>2,'The group gains speed under gravity; collisions may stop individual marbles');
  for(let i=0;i<5;i++){assert.equal(a.frames[0][i][7],0);assert.ok(Number.isFinite(a.times[i]));for(const frame of a.frames){assert.ok(frame[i].every(Number.isFinite));const d=-frame[i][2],centre=surface(d);assert.ok(Math.abs(frame[i][0]-centre.x)<2.2,JSON.stringify({layout,i,d,x:frame[i][0],y:frame[i][1],centre}));}}
  for(let shift=0;shift<5;shift++){const seed=layout*5+shift,winner=(a.order[0]+shift)%5;assert.equal(physicalWinner(seed),winner);counts[winner]++;assert.equal(race(2.5,winner,seed,'physics',3).winUnits,1200);}
 }
 assert.deepEqual(counts,[32,32,32,32,32]);
 assert.ok(fs.readFileSync('firestore.rules','utf8').includes(JSON.stringify(winners)));
});
test('Zero gravity cannot drive a race; identical initial states replay identical rigid bodies',()=>{
 assert.throws(()=>simulate(0,{gravity:0}),/Unfinished/);
 const a=simulate(0),b=simulate(0);assert.deepEqual(a.times,b.times);assert.deepEqual(a.frames[480],b.frames[480]);
});

