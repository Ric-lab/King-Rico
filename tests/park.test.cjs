const test=require('node:test'),assert=require('node:assert/strict');
const park=require('../cloud/park.cjs'),engine=require('../cloud/engine.cjs');
const player=()=>({balanceUnits:100000,peaches:0,settings:{},peachBank:{count:0,units:0}});
test('Park authorizes without charging and consumes exactly one ticket on first play',()=>{
 const p=player(),s=park.fresh();s.tickets=3;
 park.entry(p,s,'clown','ticket');assert.equal(p.balanceUnits,100000);assert.equal(s.tickets,3);
 const data={action:'clown',bet:25,roundId:'round',park:true};const payment=park.payment(p,s,data);
 assert.deepEqual(payment,{first:true,method:'ticket',debit:0});
 park.settle(s,data,{ended:false},payment);assert.equal(s.tickets,2);
 p.clownRound={id:'round'};const continuation=park.payment(p,s,data);assert.equal(continuation.first,false);assert.equal(continuation.debit,0);
 park.settle(s,data,{ended:true},continuation);assert.equal(s.tickets,2);assert.equal(s.passes.clown,undefined);
});
test('Park preserves a paid legacy round and rejects free or changed-stake new entries',()=>{
 const p=player(),s=park.fresh();p.fingoRound={id:'legacy',betUnits:1000};
 assert.equal(park.payment(p,s,{action:'fingo',bet:10}),null);
 assert.throws(()=>park.entry(p,s,'fingo','coins'),/aberta/);
 assert.throws(()=>park.payment(player(),s,{action:'penalty',bet:25,park:true}),/entrada/);
 assert.throws(()=>park.entry(player(),s,'penalty','ticket'),/insuficientes/);
 park.entry(p,s,'penalty','coins');assert.throws(()=>park.payment(p,s,{action:'penalty',bet:1000,park:true}),/25/);
});
test('The tenth spin creates a real prize and a saved wheel blocks further charges',()=>{
 const p=player(),s=park.fresh();
 for(let n=0;n<10;n++){const x=park.spin(p,s,1,'spin-'+n,()=>.99);assert.equal(s.spins,n+1);assert.equal(x.winUnits,engine.units(x.res.win));if(n===9){assert.ok(x.res.win>0);assert.equal(s.wheel.baseUnits,x.winUnits);}}
 assert.throws(()=>park.spin(p,s,1,'extra',()=>.99),/roleta/);assert.equal(s.spins,10);
});
test('Every multiplier adds only its extra and repeating a saved result adds zero',()=>{
 for(const draw of [0,.35,.7,.9,.99]){
  const s=park.fresh();s.wheel={id:'wheel',baseUnits:123,pockets:park.POCKETS,result:null};
  const extra=park.bonus(s,'wheel',()=>draw),r=s.wheel.result;
  assert.equal(123+extra,r.winUnits);assert.equal(r.winUnits,123*r.multiplier);assert.equal(park.POCKETS[r.index],r.multiplier);
  assert.equal(park.bonus(s,'wheel',()=>0),0);assert.throws(()=>park.bonus(s,'wrong',()=>0),/encerrada/);
 }
});
test('A ticket trinca uses a dedicated symbol and awards three',()=>{
 const p=player(),s=park.fresh(),draws=[...Array.from({length:9},()=>[.99,.4]).flat(),0];
 const x=park.spin(p,s,10,'ticket',()=>draws.shift()??.99);
 assert.equal(x.ticketAward,3);assert.equal(s.tickets,3);assert.deepEqual(x.grid.slice(0,3),[10,10,10]);assert.equal(x.feature,null);
 assert.equal(x.res.win,engine.evaluate(x.grid.map(v=>v===10?-1:v),10).win);
});
test('The guaranteed-prize fallback preserves a legacy Happeach bank',()=>{
 const p=player(),s=park.fresh();p.peaches=3;delete p.peachBank;s.spins=9;
 const weights=[.01,.3,.55,.63,.7,.8,.86,.91,.97];let n=0;
 const rng=()=>{const i=n++%18;return i%2?weights[Math.floor(i/2)]:.99;};
 const x=park.spin(p,s,10,'legacy-bank',rng);assert.ok(n>18*128);assert.equal(x.feature,null);assert.ok(x.res.win>0);
 assert.deepEqual(x.peachBank,{count:3,units:3000});assert.equal(x.peaches,3);
});
