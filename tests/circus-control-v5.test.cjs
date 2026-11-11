const test=require('node:test'),assert=require('node:assert/strict');
const c=require('../cloud/circus-control-v5.cjs'),park=require('../cloud/park.cjs');
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
const setup=(surplus=1000000,tickets=100,peaches=4)=>({p:{balanceUnits:10000000,peaches,peachBank:{count:peaches,units:peaches*1000}},s:{...park.fresh(),tickets,economy:{...c.freshEconomy(),wageredUnits:1000000,paidUnits:900000+surplus}}});
test('v5 control excludes grants and preserves target floor; rich wallets increase pressure',()=>{
 const {p,s}=setup(0);assert.equal(c.control(p,s,10).probability,0);assert.equal(c.candidate(p,s,10,()=>0),null);
 s.economy.paidUnits+=10000;const rich=c.control(p,s,10);p.balanceUnits=1000;
 assert.ok(rich.probability>c.control(p,s,10).probability);assert.equal(c.control(p,s,10).maxTiger,0);
});
test('v5 theft bounds, integer tickets, centered distribution and no concurrent award',()=>{
 const random=rng(472831),values={tony:[],tucker:[],ray:[]};
 for(let i=0;i<100000;i++){
  const {p,s}=setup();const x=c.candidate(p,s,10,random);if(!x)continue;
  assert.equal(x.winUnits,0);assert.equal(x.ticketAward,0);assert.equal(x.feature,null);assert.equal(x.grid.includes(5),false);
  if(x.tony){const t=x.tony;assert.ok(t.stolenUnits>=1000&&t.stolenUnits<=25000);assert.equal(t.hits.reduce((a,b)=>a+b),t.stolenUnits);values.tony.push(t.stolenUnits/1000);}
  for(const [kind,min,max]of[['tucker',1,4],['ray',5,50]])if(x[kind]){const e=x[kind];assert.ok(Number.isInteger(e.stolen)&&e.stolen>=min&&e.stolen<=max);assert.equal(e.remaining,e.before-e.stolen);values[kind].push(e.stolen);}
 }
 for(const [kind,mean,tolerance]of[['tony',13,.1],['tucker',2.5,.02],['ray',27.5,.2]]){const v=values[kind];assert.ok(v.length>10000);assert.ok(Math.abs(v.reduce((a,b)=>a+b)/v.length-mean)<tolerance,kind);}
 const tails=values.tony.filter(x=>x<=2||x>=24).length/values.tony.length;assert.ok(tails<.001);
 for(const tickets of[0,1,2,3,7]){const {p,s}=setup(1000000,tickets,0);const x=c.candidate(p,s,10,()=>.7);assert.ok(x.ray);assert.ok(Number.isInteger(x.ray.stolen));assert.ok(x.ray.stolen<=tickets);}
});
test('v5 never steals more than previous surplus or available balance',()=>{
 const {p,s}=setup(1900);const budget=c.control(p,s,10).budget;assert.equal(budget,1000);
 const x=c.candidate(p,s,10,()=>0);assert.equal(x.tony.stolenUnits,1000);c.recordSpin(s,x,10);
 assert.ok(c.returned(s.economy)>=Math.ceil(s.economy.wageredUnits*.9));
});
test('v5 tenth spin always keeps wheel; bonus accounted once across replay',()=>{
 const {p,s}=setup();s.spins=9;s.cycleWagerUnits=9000;const x=park.spin(p,s,10,'wheel',rng(1),5);
 assert.ok(s.wheel);assert.equal(x.tony,undefined);assert.equal(x.tucker,undefined);assert.equal(x.ray,undefined);
 assert.ok(!x.grid.includes(5));const paid=s.economy.paidUnits,extra=park.bonus(s,'wheel',()=>.99);
 assert.equal(s.economy.paidUnits,paid+extra);assert.equal(park.bonus(s,'wheel',()=>{throw Error('redraw')}),0);assert.equal(s.economy.paidUnits,paid+extra);
});

test('v5 wheel sums actual ten stakes, retains ordinary winnings and does not infer unrecorded old bets',()=>{
 const {p,s}=setup(0,0,0),random=rng(543);let staked=0;
 for(let i=0;i<10;i++){const bet=i===9?1000:1;staked+=bet*100;const x=park.spin(p,s,bet,'cycle'+i,random,5);p.balanceUnits+=x.winUnits-bet*100-(x.tony?.stolenUnits||0);p.peaches=x.peaches;p.peachBank=x.peachBank;}
 assert.equal(s.cycleWagerUnits,100900);assert.equal(s.wheel.prizeVersion,4);assert.equal(s.wheel.baseUnits,Math.round(staked*.04));
 const paid=s.economy.paidUnits,base=s.wheel.baseUnits,extra=park.bonus(s,s.wheel.id,()=>.99);assert.equal(extra,10*base);assert.equal(s.economy.paidUnits,paid+extra);
 const old={...park.fresh(),spins:9};park.spin(p,old,10,'migration',rng(1),5);assert.equal(old.wheel.baseUnits,40);assert.equal(old.cycleWagerUnits,1000);
});
