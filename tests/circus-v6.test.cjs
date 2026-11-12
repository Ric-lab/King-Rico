const test=require('node:test'),assert=require('node:assert/strict'),e=require('../cloud/engine.cjs'),park=require('../cloud/park.cjs'),control=require('../cloud/circus-control-v6.cjs');
const player=()=>({balanceUnits:1000000,peaches:3,peachBank:{count:3,units:751}});
test('v6 literal pay table and all eight combinations, no wilds or old paying symbols',()=>{
 assert.deepEqual([10,2,0,6,8,7].map(i=>e.slotSymbols(6)[i].pay),[.4,.8,1.2,2.5,5,10]);
 for(const sym of[10,2,0,6,8,7])for(const line of e.ALL_LINES){const g=[5,11,5,11,5,11,5,11,5];line.forEach(i=>g[i]=sym);assert.equal(e.evaluate(g,10,6).win,10*e.slotSymbols(6)[sym].pay);}
 for(const sym of[1,3,4,5,9,11,12,13,14,15])assert.equal(e.evaluate(Array(9).fill(sym),10,6).win,0);
 assert.equal(e.slotSymbols(6)[15].active,false);assert.equal(e.evaluate(Array(9).fill(7),10,6).win,8000);
});
test('v6 every cedar combination gives one capped defense; old tickets stay untouched',()=>{
 for(const stock of[0,4,5]){const p=player(),s={...park.fresh(),cedros:stock,tickets:97};let first=true;const x=park.spin(p,s,10,'a',()=>first?(first=false,.99):.1,6);assert.equal(x.cedarAward,5-stock);assert.equal(s.cedros,5);assert.equal(s.tickets,97);assert.equal(x.winUnits,0);}
});
test('one cedar blocks the entire attack of each villain, including Ray',()=>{
 for(const [kind,r]of[['tony',0],['tucker',.51],['ray',.54]]){const p=player(),s={...park.fresh(),cedros:2,economyV6:{...control.freshEconomy(),paidUnits:1000000}};const x=park.spin(p,s,10,'a',()=>r,6);assert.ok(x[kind]);assert.deepEqual(x.defense,{against:kind});assert.equal(s.cedros,1);assert.equal(x.peaches,p.peaches);assert.deepEqual(x.peachBank,p.peachBank);assert.equal(x.tony?.stolenUnits||x[kind].stolen||0,0);}
});
test('without defenses, Tony and Tucker keep aggressive bounded losses; zero target is valid',()=>{
 for(const [kind,r]of[['tony',0],['tucker',.51]]){const p=player(),s={...park.fresh(),economyV6:{...control.freshEconomy(),paidUnits:1000000}};const x=park.spin(p,s,10,'a',()=>r,6);assert.ok(!x.defense);if(kind==='tony')assert.ok(x.tony.stolenUnits>=1000&&x.tony.stolenUnits<=25000);else {assert.ok(x.tucker.stolen>=1&&x.tucker.stolen<=3);assert.equal(x.peachBank.units,751-Math.round(751*x.tucker.stolen/3));}}
 const p=player();p.peaches=0;p.peachBank={count:0,units:0};const s={...park.fresh(),cedros:3};assert.ok(!park.spin(p,s,10,'a',()=>.01,6).defense);assert.equal(s.cedros,3);
});
test('tenth wheel uses contributing stakes and cannot use old tickets as new RTP',()=>{const s={...park.fresh(),spins:9,cycleWagerUnits:900,cedros:0,tickets:999},p=player();park.spin(p,s,1000,'a',()=>.99,6);assert.equal(s.wheel.baseUnits,4036);assert.equal(s.wheel.economyVersion,6);const extra=park.bonus(s,'a',()=>.9);assert.equal(s.economyV6.paidUnits,s.wheel.result.winUnits+3200000);assert.ok(extra>0);assert.equal(park.bonus(s,'a',()=>.9),0);});
test('compact Firestore line counting is equivalent to engine payments and cedar combinations',()=>{
 let seed=7163;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),pool=[-1,0,2,5,6,7,8,10,11];
 for(let i=0;i<100000;i++){
  const g=Array.from({length:9},()=>pool[Math.floor(rand()*pool.length)]),matched=e.ALL_LINES.map(l=>l.every(n=>g[n]===g[l[0]])?g[l[0]]:-1);
  const factors={0:12,2:8,6:25,7:100,8:50,10:4};
  const sum=Object.entries(factors).reduce((v,[id,pay])=>v+matched.filter(n=>n===Number(id)).length*pay,0);
  const win=sum*(new Set(g).size===1?10:1); // stake=1 coin = 100 cents, /10 above =>10 cents per unit.
  assert.equal(e.evaluate(g,1,6).win,win/10);
  assert.equal(matched.filter(n=>n===5).length,e.ALL_LINES.filter(l=>l.every(n=>g[n]===5)).length);
 }
});

test('feature cents round after the full-screen multiplier, not before it',()=>{
 for(const stake of [101,251,403,751,10001])for(const sym of [0,2,6,7,8,10]){
  const g=Array(9).fill(sym),factor=e.slotSymbols(6)[sym].pay;
  assert.equal(e.units(e.evaluate(g,stake/100,6).win),Math.round(stake*factor*80));
 }
 assert.equal(e.units(e.evaluate(Array(9).fill(10),4.03,6).win),12896);
});
