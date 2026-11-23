const test=require('node:test'),assert=require('node:assert/strict');
const c=require('../cloud/circus-control-v6.cjs'),park=require('../cloud/park.cjs');
function rngFace(value,draw=0){const target=Math.max(.1,Math.min(4.9,value)),z=(target-2.5)/.625;const q=[draw,.5,Math.exp(-z*z/2),z<0?.5:0];return ()=>q.shift()??.5;}
function setup(){return {p:{balanceUnits:1000000,peaches:4,peachBank:{count:4,units:999}},s:{...park.fresh(),cedros:0,economyV6:{...c.freshEconomy(),paidUnits:1000000}}};}
test('all six saved Tony faces are integer multiples, zero causes no loss, maximum 5 bets',()=>{
 for(let value=0;value<=5;value++){
  const {p,s}=setup(),x=c.candidate(p,s,10,rngFace(value));
  assert.equal(x.tony.version,4);assert.equal(x.tony.dice.value,value);assert.equal(x.tony.stolenUnits,value*1000);
  assert.equal(x.tony.hits.reduce((a,b)=>a+b),value*1000);
 }
});
test('resource dice save the actual face and cap whole-unit losses at the available stock',()=>{
 for(const kind of ['tucker','ray'])for(const stock of [0,1,4,5])for(let value=0;value<=5;value++){
  const {p,s}=setup();if(kind==='ray')s.cedros=stock;else{p.peaches=stock;p.peachBank={count:stock,units:stock*251};}
  const x=c.candidate(p,s,10,rngFace(value,kind==='ray'?.54:.51));
  assert.equal(x[kind].dice.value,value);assert.equal(x[kind].stolen,Math.min(stock,value));
  if(kind==='ray')assert.equal(s.cedros,stock-Math.min(stock,value));
  else{assert.equal(x.peaches,stock-Math.min(stock,value));assert.ok(x.peachBank.units>=0);}
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
