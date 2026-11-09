import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createPreview} from '../prototypes/circus-preview/model.mjs';
test('Tucker explicit demo loses one banked Happeach once, retains coin balance except stake, and restores across reload',async()=>{
 let model=createPreview({},()=>.99);let state=await model.run({action:'state',previewTuckerSetup:true});assert.equal(state.player.peaches,3);
 const before=state.player.balance,bank=state.player.peachBank.units;
 const spin={action:'spin',game:'circus',bet:10,requestId:randomUUID(),slotVersion:4,previewTucker:true};
 const result=await model.run(spin);assert.equal(result.player.balance,before-10);assert.equal(result.player.peaches,2);
 assert.equal(result.outcome.grid.filter(v=>v===13).length,3);assert.equal(result.outcome.winUnits,0);assert.equal(result.outcome.ticketAward,0);assert.equal(result.outcome.tony,undefined);
 assert.equal(result.player.peachBank.units,bank-Math.round(bank/3));
 assert.equal((await model.run(spin)).player.peaches,2);
 model=createPreview(JSON.parse(JSON.stringify(model.exportState())),()=>.99);
 assert.equal((await model.run({action:'state',previewTuckerSetup:true})).player.peaches,2);
 assert.equal((await model.run(spin)).player.peaches,2);
});
test('Ordinary preview state does not seed Happeach or introduce Tucker',async()=>{
 const m=createPreview({},()=>.99),s=await m.run({action:'state'});assert.equal(s.player.peaches,0);
 const x=await m.run({action:'spin',game:'circus',bet:10,requestId:randomUUID(),slotVersion:4});assert.equal(x.outcome.tucker,undefined);
});
