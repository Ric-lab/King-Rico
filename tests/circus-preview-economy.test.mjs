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
  const id=randomUUID(),expected=park.spin(p,s,10,id,b,3),request={action:'spin',game:'circus',bet:10,requestId:id};
  p.peaches=expected.peaches;p.peachBank=expected.peachBank;
  const actual=await model.run(request);assert.deepEqual(actual.outcome,expected);
  assert.equal((await model.run(request)).player.balance,actual.player.balance);
  if(s.wheel){
   park.bonus(s,s.wheel.id,b);const w=model.state().wheel;
   const result=await model.run({action:'wheel',wheelId:w.id,requestId:randomUUID()});
   assert.deepEqual(result.wheel.result,s.wheel.result);
   await model.run({action:'wheel-close',wheelId:w.id,requestId:randomUUID()});s.wheel=null;s.spins=0;
  }
 }
});
