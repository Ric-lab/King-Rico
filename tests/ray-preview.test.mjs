import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {createPreview} from '../prototypes/circus-preview/model.mjs';
for(const tickets of [0,3])test(`Ray demo with ${tickets} tickets persists one bounded theft and replays without another charge`,async()=>{
 let m=createPreview({},()=>.99);await m.run({action:'state'});const saved=m.exportState();saved.park.tickets=tickets;m=createPreview(saved,()=>.99);
 const before=(await m.run({action:'state'})).player;
 const request={action:'spin',game:'circus',bet:10,requestId:randomUUID(),slotVersion:4,previewRay:true};
 const x=await m.run(request),stolen=Math.min(1,tickets);
 assert.deepEqual(x.outcome.ray,{version:1,before:tickets,stolen,remaining:tickets-stolen});
 assert.equal(x.outcome.grid.filter(n=>n===14).length,3);assert.equal(x.outcome.winUnits,0);assert.equal(x.outcome.ticketAward,0);
 assert.equal(x.park.tickets,tickets-stolen);assert.equal(x.player.balance,before.balance-10);assert.equal(x.player.peaches,before.peaches);
 m=createPreview(JSON.parse(JSON.stringify(m.exportState())),()=>.99);const again=await m.run(request);
 assert.equal(again.park.tickets,tickets-stolen);assert.equal(again.player.balance,before.balance-10);
 assert.equal((await m.run({action:'state'})).park.tickets,tickets-stolen);
});
test('Ray does not enter ordinary preview spins',async()=>{const m=createPreview({},()=>.99);await m.run({action:'state'});const x=await m.run({action:'spin',game:'circus',bet:10,requestId:randomUUID(),slotVersion:4});assert.equal(x.outcome.ray,undefined);});
