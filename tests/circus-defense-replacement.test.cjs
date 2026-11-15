const test=require('node:test'),assert=require('node:assert/strict'),engine=require('../cloud/engine.cjs'),control=require('../cloud/circus-control-v6.cjs');
test('one clover replaces only the central villain, preserves resources, and can make a real cash line',()=>{
 let wins=0,misses=0;
 for(const kind of['tony','tucker'])for(let seed=1;seed<=200;seed++){
  let n=seed;const random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/2**32);let first=true;
  const rng=()=>first?(first=false,kind==='tony'?0:.51):random();
  const p={balanceUnits:1000000,peaches:3,peachBank:{count:3,units:3000}},s={cedros:2,economyV6:{...control.freshEconomy(),paidUnits:1000000}};
  const x=control.candidate(p,s,10,rng),d=x.defense,symbol=kind==='tony'?12:13;
  assert.equal(d.against,kind);assert.equal(s.cedros,1);assert.equal(d.beforeGrid.filter(v=>v===symbol).length,3);assert.equal(x.grid.filter(v=>v===symbol).length,2);
  assert.deepEqual(x.grid.flatMap((v,i)=>v!==d.beforeGrid[i]?[i]:[]),[d.cell]);assert.equal(x.grid[d.cell],d.replacement);
  assert.deepEqual(x.res,engine.evaluate(x.grid,10,6));assert.equal(x.winUnits,engine.units(x.res.win));assert.equal(x.peaches,p.peaches);assert.deepEqual(x.peachBank,p.peachBank);
  assert.equal(x.tony?.stolenUnits||x.tucker?.stolen||0,0);if(x.winUnits)wins++;else misses++;
 }
 assert.ok(wins>0&&misses>0,{wins,misses});
});
