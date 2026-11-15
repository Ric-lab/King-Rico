const test=require('node:test'),assert=require('node:assert/strict'),e=require('../cloud/engine.cjs');
function seeded(seed){return()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);}
test('ordinary spins include single/pair villains, never an unbacked triple or a theft',()=>{
 const rng=seeded(41515);let singles=0,pairs=0;
 for(let n=0;n<5000;n++){
  const x=e.slot(10,0,rng,null,6);for(const s of[12,13,14])assert.ok(x.grid.filter(v=>v===s).length<=2);
  const count=x.grid.filter(v=>v>=12&&v<=14).length;singles+=count===1;pairs+=count===2;
  assert.ok(!x.tony&&!x.tucker&&!x.ray);assert.deepEqual(x.res,e.evaluate(x.grid,10,6));
 }
 assert.ok(singles>100&&pairs>50,{singles,pairs});
});
test('a suspense pair preserves paid cells, roletas, trevos and controller, without changing the award',()=>{
 const grid=[10,10,10,11,5,15,0,2,6],sy=e.slotSymbols(6),total=sy.reduce((n,x)=>n+x.w,0);
 const draws=grid.flatMap(s=>s===11?[0]:s===5?[.1]:[.99,(sy.slice(0,s).reduce((n,x)=>n+x.w,0)+sy[s].w/2)/total]);
 const x=e.slot(10,0,()=>draws.shift()??0,null,6);
 assert.deepEqual(x.grid.slice(0,6),grid.slice(0,6));assert.equal(x.grid.filter(v=>v===12).length,2);
 assert.equal(x.res.win,e.evaluate(grid,10,6).win);assert.deepEqual(x.res.peach,[3]);assert.equal(x.winUnits,400);
});
