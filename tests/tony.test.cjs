const test=require('node:test'),assert=require('node:assert/strict');
const park=require('../cloud/park.cjs'),engine=require('../cloud/engine.cjs');
const player=balanceUnits=>({balanceUnits,peaches:4,peachBank:{count:4,units:750},settings:{}});
test('Tony exclusively occupies any of eight lines, preserving tickets, Happeach and progress',()=>{
 for(let line=0;line<8;line++){
  const p=player(100000),s=park.fresh();s.tickets=7;let samples=[0,(line+.5)/8];
  const x=park.spin(p,s,10,'spin',()=>samples.shift()??.99,4);
  assert.deepEqual(x.res.cells,engine.ALL_LINES[line]);assert.equal(x.grid.filter(v=>v===12).length,3);
  assert.equal(engine.evaluate(x.grid,10,4).win,0);assert.equal(x.winUnits,0);assert.equal(x.ticketAward,0);assert.equal(x.feature,null);
  assert.deepEqual(x.peachBank,p.peachBank);assert.equal(x.peaches,4);assert.equal(s.tickets,7);assert.equal(s.spins,1);
  assert.equal(x.tony.stolenUnits,1500);assert.deepEqual(x.tony.hits,[500,500,500]);
 }
});
test('Tony never takes more than 1.5 stakes or 5% of the post-stake balance, including cents',()=>{
 for(const balance of [1000,1059,1060,1234,5000,100000,10000000000]){
  const amount=park.theftUnits(balance,1000);assert.ok(amount<=1500);assert.ok(amount<=Math.floor(Math.max(0,balance-1000)/20));
  let draw=0;const x=park.spin(player(balance),park.fresh(),10,'id',()=>draw++<2?0:.99,4);
  if(amount<3)assert.equal(x.tony,undefined);else{assert.equal(x.tony.stolenUnits,amount);assert.equal(x.tony.hits.reduce((a,b)=>a+b),amount);}
 }
});
test('Tony cannot interrupt a full meter and does not change legacy v3 outcomes',()=>{
 const s=park.fresh();s.spins=9;
 assert.equal(park.spin(player(100000),s,10,'id',()=>.99,4).tony,undefined);assert.ok(s.wheel.baseUnits>0);
 assert.equal(park.spin(player(100000),park.fresh(),10,'id',()=>.99,3).tony,undefined);
});

test("villain chances keep the approved fixed boundaries",()=>{
 assert.equal(park.TONY_CHANCE,.05);
 const p=player(100000);
 for(const [draw,event]of[[.049,"tony"],[.05,"tucker"],[.0749,"tucker"],[.0751,"ray"],[.0999,"ray"]]){let n=0;const x=park.spin(p,park.fresh(),10,"id",()=>n++===0?draw:.5,4);assert.ok(x[event]);}
});
