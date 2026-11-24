const test=require('node:test'),assert=require('node:assert/strict');
const c=require('../cloud/circus-control-v6.cjs'),park=require('../cloud/park.cjs');
function rngFace(value,draw=0){const q=[draw,.5,0,...Array(5).fill(.999),(value+.01)/6];return ()=>q.shift()??.5;}
function setup(){return {p:{balanceUnits:1000000,peaches:4,peachBank:{count:4,units:999}},s:{...park.fresh(),cedros:0,economyV6:{...c.freshEconomy(),paidUnits:1000000}}};}
test('all six saved Tony faces are integer multiples, zero causes no loss, maximum 5 bets',()=>{
 for(let value=0;value<=5;value++){
  const {p,s}=setup(),x=c.candidate(p,s,10,rngFace(value));
  assert.equal(x.tony.version,5);assert.equal(x.tony.dice.value,value);assert.equal(x.tony.stolenUnits,value*1000);
  assert.equal(x.tony.hits.reduce((a,b)=>a+b),value*1000);
 }
});
test('resource dice faces match actual inventory and the saved loss exactly',()=>{
 for(const kind of ['tucker','ray'])for(const stock of [0,1,2,3,4,5])for(let face=0;face<6;face++){
  const {p,s}=setup();if(kind==='ray')s.cedros=stock;else{p.peaches=stock;p.peachBank={count:stock,units:stock*251};}
  const x=c.candidate(p,s,10,rngFace(face,kind==='ray'?.54:.51)),event=x[kind];
  if(!stock){assert.equal(event.dice,undefined);assert.equal(event.stolen,0);continue;}
  assert.equal(event.dice.value,event.dice.faces[event.dice.index]);assert.equal(event.stolen,event.dice.value);
  assert.ok(event.dice.faces.every(v=>v>=0&&v<=stock));
  if(kind==='ray')assert.equal(s.cedros,stock-event.stolen);
  else{assert.equal(x.peaches,stock-event.stolen);assert.equal(x.peachBank.units,stock*251-event.stolen*251);}
 }
});
test('zero wheels consume neither a die nor a defense shield',()=>{
 const {p,s}=setup();p.peaches=0;p.peachBank={count:0,units:0};s.cedros=3;
 const x=c.candidate(p,s,10,rngFace(5,.51));assert.equal(x.tucker.stolen,0);assert.equal(x.tucker.dice,undefined);assert.equal(x.defense,undefined);assert.equal(s.cedros,3);
});
test('all stocks have balanced physical sides and exactly uniform outcomes across offsets',()=>{
 const {resourceDie}=require('../cloud/villain-dice.cjs');assert.equal(resourceDie(0,()=>{throw Error('No draw');}),null);
 for(let n=1;n<=5;n++){
  const totals=Array(n+1).fill(0);
  for(let offset=0;offset<=n;offset++)for(let index=0;index<6;index++){
   const draws=[(offset+.01)/(n+1),...Array(5).fill(.999),(index+.01)/6];const d=resourceDie(n,()=>draws.shift());
   const counts=Array.from({length:n+1},(_,v)=>d.faces.filter(x=>x===v).length);
   assert.ok(Math.max(...counts)-Math.min(...counts)<=1);totals[d.value]++;
  }
  assert.ok(totals.every(v=>v===6),JSON.stringify({n,totals}));
 }
});
test('Tony cannot use a die to exceed budget, available balance or 5×, including a partial-bet budget',()=>{
 for(const balance of [1000,1300,2999,5000,9000])for(const budget of [1000,1500,2900,9000]){
  const {p,s}=setup();p.balanceUnits=balance;s.economyV6.paidUnits=budget+900;
  const x=c.candidate(p,s,10,rngFace(5));if(!x?.tony)continue;
  assert.ok(x.tony.stolenUnits<=balance-1000);assert.ok(x.tony.stolenUnits<=budget);assert.ok(x.tony.stolenUnits<=5000);
  assert.equal(x.tony.stolenUnits%1000,0);
 }
});
test('blocked Tony/Tucker retain the saved shield replacement without a theft die',()=>{
 for(const [kind,draw]of[['tony',0],['tucker',.51]]){
  const {p,s}=setup();s.cedros=2;const x=c.candidate(p,s,10,rngFace(5,draw));
  assert.equal(x.defense.against,kind);assert.equal(s.cedros,1);assert.equal(x[kind].dice,undefined);
 }
});
