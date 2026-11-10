const test=require('node:test'),assert=require('node:assert/strict');
const park=require('../cloud/park.cjs'),engine=require('../cloud/engine.cjs');
for(const [kind,draw,symbol]of[['tucker',.0625,13],['ray',.0875,14]]){
 test(kind+' uses every line, takes at most one and preserves the other resources',()=>{
  for(let before=0;before<=4;before++)for(let line=0;line<8;line++){
   const p={balanceUnits:100000,peaches:before,peachBank:{count:before,units:before?751:0}},s=park.fresh();s.tickets=before;
   let draws=[draw,(line+.5)/8];const x=park.spin(p,s,10,'id',()=>draws.shift()??.99,4),e=x[kind];
   assert.equal(e.before,before);assert.equal(e.stolen,Math.min(1,before));assert.equal(e.remaining,Math.max(0,before-1));
   assert.deepEqual(x.res.cells,engine.ALL_LINES[line]);assert.equal(x.grid.filter(n=>n===symbol).length,3);
   assert.equal(engine.evaluate(x.grid,10,4).win,0);assert.equal(x.winUnits,0);assert.equal(x.ticketAward,0);assert.equal(x.feature,null);
   assert.equal(s.spins,1);assert.equal(x.peaches,kind==='tucker'?e.remaining:before);
   assert.equal(s.tickets,kind==='ray'?e.remaining:before);
   assert.equal(x.peachBank.units,kind==='tucker'?(before?751-Math.round(751/before):0):p.peachBank.units);
  }
 });
 test(kind+' leaves legacy versions and the tenth-spin guarantee untouched',()=>{
  const p={balanceUnits:100000,peaches:0,peachBank:{count:0,units:0}};
  for(const v of[1,2,3]){let n=0;assert.equal(park.spin(p,park.fresh(),10,'id',()=>n++===0?draw:.99,v)[kind],undefined);}
  const s=park.fresh();s.spins=9;let n=0;const x=park.spin(p,s,10,'id',()=>n++===0?draw:.99,4);assert.equal(x[kind],undefined);assert.ok(s.wheel.baseUnits>0);
 });
}
