import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createPreview} from '../prototypes/circus-preview/model.mjs';
import engine from '../cloud/engine.cjs';
import park from '../cloud/park.cjs';
const seeded=n=>()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/2**32);
test('Preview wallet uses exactly the audited v3 outcomes and wheel credits, including replay',async()=>{
 const a=seeded(7163),b=seeded(7163),model=createPreview({},a),p={peaches:0,peachBank:{count:0,units:0}},s=park.fresh();
 await model.run({action:'state'});
 for(let i=0;i<60;i++){
  const id=randomUUID(),expected=park.spin(p,s,10,id,b,3),request={action:'spin',game:'circus',bet:10,requestId:id,slotVersion:3};
  p.peaches=expected.peaches;p.peachBank=expected.peachBank;
  const actual=await model.run(request);assert.deepEqual(actual.outcome,expected);
  assert.equal((await model.run(request)).player.balance,actual.player.balance);
  if(s.wheel){
   park.bonus(s,s.wheel.id,b);const w=model.state().wheel;
   const result=await model.run({action:'wheel',wheelId:w.id,requestId:randomUUID()});
   assert.deepEqual(result.wheel.result,s.wheel.result);
   await model.run({action:'wheel-close',wheelId:w.id,requestId:randomUUID()});s.wheel=null;s.spins=0;if('cycleWagerUnits' in s)s.cycleWagerUnits=0;
  }
 }
});

test('Preview v5 wallet and controller follow the same saved ledger as real store engine',async()=>{
 const a=seeded(7163),b=seeded(7163),model=createPreview({},a),p={balanceUnits:500000,peaches:0,peachBank:{count:0,units:0}},s={...park.fresh(),tickets:3};
 await model.run({action:'state'});
 for(let i=0;i<200;i++){
  const id=randomUUID(),expected=park.spin(p,s,10,id,b,5),request={action:'spin',game:'circus',bet:10,requestId:id,slotVersion:5};
  p.balanceUnits+=expected.winUnits-1000-(expected.tony?.stolenUnits||0);p.peaches=expected.peaches;p.peachBank=expected.peachBank;
  const actual=await model.run(request);assert.deepEqual(actual.outcome,expected);assert.deepEqual(actual.park.economy,s.economy);assert.equal(actual.player.balance,p.balanceUnits/100);
  assert.deepEqual((await model.run(request)).park.economy,s.economy);
  if(s.wheel){
   const extra=park.bonus(s,s.wheel.id,b);p.balanceUnits+=extra;
   const req={action:'wheel',wheelId:s.wheel.id,requestId:randomUUID()},out=await model.run(req);assert.deepEqual(out.park.economy,s.economy);assert.equal(out.player.balance,p.balanceUnits/100);assert.deepEqual((await model.run(req)).park.economy,s.economy);
   await model.run({action:'wheel-close',wheelId:s.wheel.id,requestId:randomUUID()});s.wheel=null;s.spins=0;if('cycleWagerUnits' in s)s.cycleWagerUnits=0;
  }
 }
});
test('Preview v6 matches the production engine, cedar stock and coin-only ledger through replay and reload',async()=>{
 const a=seeded(763),b=seeded(763);let model=createPreview({},a);const p={balanceUnits:500000,peaches:0,peachBank:{count:0,units:0}},s={...park.fresh(),tickets:3};await model.run({action:'state'});
 let awards=0,defenses=0;
 for(let i=0;i<1000;i++){
  const id=randomUUID(),expected=park.spin(p,s,10,id,b,6),req={action:'spin',game:'circus',bet:10,requestId:id,slotVersion:6};
  p.balanceUnits+=expected.winUnits-1000-(expected.tony?.stolenUnits||0);p.peaches=expected.peaches;p.peachBank=expected.peachBank;
  const r=await model.run(req);assert.deepEqual(r.outcome,expected);assert.deepEqual(r.park.economyV6,s.economyV6);assert.equal(r.park.cedros,s.cedros);assert.equal(r.park.tickets,3);assert.equal(r.player.balance,p.balanceUnits/100);
  assert.deepEqual((await model.run(req)).park.economyV6,s.economyV6);awards+=expected.cedarAward;defenses+=!!expected.defense;
  if(s.wheel){const extra=park.bonus(s,s.wheel.id,b);p.balanceUnits+=extra;const wheelReq={action:'wheel',wheelId:s.wheel.id,requestId:randomUUID()},w=await model.run(wheelReq);assert.deepEqual(w.park.economyV6,s.economyV6);assert.equal(w.player.balance,p.balanceUnits/100);assert.deepEqual((await model.run(wheelReq)).park.economyV6,s.economyV6);await model.run({action:'wheel-close',wheelId:s.wheel.id,requestId:randomUUID()});s.spins=0;s.wheel=null;s.cycleWagerUnits=0;}
  if(i%100===99)model=createPreview(JSON.parse(JSON.stringify(model.exportState())),a);
 }
 assert.ok(awards>0&&defenses>0);
});
