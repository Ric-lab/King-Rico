const test=require('node:test'),assert=require('node:assert/strict'),e=require('../cloud/engine.cjs');
test('v6 Good Luck can use all five spins and pay one small actual line, without a 20x floor',()=>{
 const f=e.feature(10,()=>.99,6);
 assert.equal(f.rounds.length,5);assert.equal(f.res.win,4);assert.equal(f.res.full,false);
 assert.deepEqual(f.res,e.evaluate(f.grid,10,6));assert.equal(e.circusProfile.tier(f.res.win,10).id,'regular');
 assert.equal(e.feature(10,()=>.99,3).res.win,200,'paid legacy versions keep their original floor');
});
test('v6 feature outcomes include small five-spin results and true big/super wins using the same table',()=>{
 let seed=4731,small=0,big=0,superWins=0;
 const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 for(let i=0;i<20000;i++){
  const f=e.feature(10,rng,6);assert.deepEqual(f.res,e.evaluate(f.grid,10,6));
  const t=e.circusProfile.tier(f.res.win,10);small+=f.rounds.length===5&&t.id==='regular';big+=t.id==='big';superWins+=t.id==='super';
 }
 assert.ok(small>10000&&big>0&&superWins>0,{small,big,superWins});
});
