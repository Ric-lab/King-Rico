const test=require('node:test'),assert=require('node:assert/strict');
const engine=require('../cloud/engine.cjs');
test('v5 uses the requested literal multipliers and keeps the existing atlas indices',()=>{
 assert.deepEqual(engine.slotSymbols(5).map(s=>s.pay),[2.5,.4,.8,1.2,5,0,10,15,20,25]);
 assert.equal(engine.slotSymbols(5)[5].id,'scepter');assert.equal(engine.slotSymbols(5)[5].active,false);assert.equal(engine.slotSymbols(5)[5].w,0);
 assert.equal(engine.slotSymbols(5).filter(s=>s.active).length,9);
 assert.deepEqual(engine.slotSymbols(4).map(s=>s.pay),[8.576,.4,.8,4.992,1.92,11.52,17.28,32,43.52,115.2]);
});
test('new ordinary and feature draws never select scepter, without deleting its old payoff',()=>{
 let seed=9381;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 for(let n=0;n<10000;n++){
  assert.ok(!engine.slot(10,0,rng,null,5).grid.includes(5));assert.notEqual(engine.feature(10,rng,5).sym,5);
 }
 assert.equal(engine.evaluate([5,5,5,0,1,2,3,4,6],10,5).win,0);
 assert.equal(engine.evaluate([5,5,5,0,1,2,3,4,6],10,4).win,115.2);
});
