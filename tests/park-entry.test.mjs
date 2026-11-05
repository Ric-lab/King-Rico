import test from 'node:test';
import assert from 'node:assert/strict';
import {createEntryFlow} from '../ui/park/entry-flow.js';
function harness(){
 const state={player:{balance:100},park:{tickets:2,passes:{},price:25}},calls=[];
 const flow=createEntryFlow({snapshot:()=>state,authorize:async(game,method)=>{calls.push([game,method]);state.park.passes[game]={method};},prompt:async(game,confirm)=>{calls.push(['prompt',game]);return confirm('ticket');}});
 const finish=game=>{delete state.park.passes[game];state.player[game+'Round']=null;};
 return {state,calls,flow,finish};
}
for(const game of ['clown','penalty','flying'])test(`${game}: first entry confirms; later rounds use tickets then coins without another prompt`,async()=>{
 const h=harness();await h.flow.ensure(game);assert.deepEqual(h.calls,[['prompt',game],[game,'ticket']]);
 // Pass authorization alone never spends anything. Real first-play transaction does.
 assert.equal(h.state.park.tickets,2);assert.equal(h.state.player.balance,100);
 h.state.park.tickets--;h.finish(game);await h.flow.ensure(game);
 assert.deepEqual(h.calls.at(-1),[game,'ticket']);
 h.state.park.tickets=0;h.finish(game);await h.flow.ensure(game);
 assert.deepEqual(h.calls.at(-1),[game,'coins']);assert.equal(h.calls.filter(c=>c[0]==='prompt').length,1);
});
test('Restored paid round needs no prompt or entry charge; next round is automatic',async()=>{
 const h=harness();h.state.player.penaltyRound={id:'paid'};await h.flow.ensure('penalty');assert.deepEqual(h.calls,[]);
 h.finish('penalty');await h.flow.ensure('penalty');assert.deepEqual(h.calls,[['penalty','ticket']]);
});
test('Two simultaneous starts share authorization; insufficient funds never authorizes',async()=>{
 const h=harness();await h.flow.ensure('flying');h.finish('flying');
 const a=h.flow.ensure('flying'),b=h.flow.ensure('flying');assert.equal(a,b);await a;
 assert.equal(h.calls.filter(c=>c[0]==='flying').length,2);
 h.finish('flying');h.state.park.tickets=0;h.state.player.balance=24.99;
 await assert.rejects(h.flow.ensure('flying'),/1 ingresso ou 25 moedas/);
 assert.equal(h.calls.filter(c=>c[0]==='flying').length,2);
 h.state.player.balance=25;await h.flow.ensure('flying');assert.deepEqual(h.calls.at(-1),['flying','coins']);
});
test('Failed authorization can retry; returning to the game starts a fresh confirmation',async()=>{
 const h=harness();await h.flow.ensure('clown');h.finish('clown');
 const flow=createEntryFlow({snapshot:()=>h.state,authorize:async()=>{throw Error('offline');},prompt:async(g,confirm)=>confirm('ticket')});
 await assert.rejects(flow.ensure('clown'),/offline/);await assert.rejects(flow.ensure('clown'),/offline/);
 const fresh=harness();await fresh.flow.ensure('clown');assert.equal(fresh.calls[0][0],'prompt');
});
