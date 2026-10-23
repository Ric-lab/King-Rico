const {test}=require('node:test'),assert=require('node:assert/strict');
const engine=require('../cloud/engine.cjs'),cards=require('../cloud/thirty-three.cjs'),{rngFor}=require('./helpers/twenty-one.cjs');
const start=prefix=>engine.twentyOne(2.5,null,'start','round',rngFor(prefix,{guided33:true}),33);
const move=(x,m)=>engine.twentyOne(2.5,x.round,m,'round');
test('33 values every rank literally, including 1 and 11–13, without aces or an opening natural',()=>{
 assert.deepEqual(Array.from({length:13},(_,i)=>cards.value(i)),Array.from({length:13},(_,i)=>i+1));
 const x=start([0,11,10,12]);assert.equal(x.round.playerHard,12);assert.equal(x.round.dealerHard,25);
 assert.equal(x.round.playerAces,0);assert.equal(x.round.target,33);assert.equal(x.round.phase,'player');assert.equal(new Set(x.round.deck).size,52);
});
test('33 automatically hands an exact 33 to the bank and pays 2.08x including cents',()=>{
 let x=move(start([12,25,11,10,7,38]),'hit');assert.equal(x.round.playerHard,33);assert.equal(x.round.phase,'dealer');
 x=move(x,'dealer');assert.equal(x.round.dealerHard,37);assert.equal(x.winUnits,520);assert.equal(x.round.result.reason,'dealer-bust');
});
test('33 bank reacts to the player total and never changes the player hand',()=>{
 let x=move(start([12,25,11,38,0]),'stand'),player=[...x.round.player];x=move(x,'dealer');
 assert.equal(x.round.dealerHard,26);assert.equal(x.round.phase,'settled');assert.equal(x.round.cursor,4);assert.deepEqual(x.round.player,player);
});
test('33 against 33 refunds the exact stake; player bust settles before the bank',()=>{
 let x=move(start([12,25,11,24,7,20]),'hit');x=move(x,'dealer');assert.equal(x.round.dealerHard,33);assert.equal(x.winUnits,250);assert.equal(x.round.result.reason,'equal');
 x=move(start([12,0,25,1,11]),'hit');assert.equal(x.round.playerHard,38);assert.equal(x.round.result.reason,'player-bust');assert.equal(x.winUnits,0);assert.equal(x.round.dealer.length,2);
});
test('33 bank bust settles a win and 21 hands keep their original rules',()=>{
 let x=move(start([12,11,25,26,38,51]),'stand');x=move(x,'dealer');assert.equal(x.round.phase,'dealer');x=move(x,'dealer');assert.equal(x.round.dealerHard,39);assert.equal(x.winUnits,520);
 x=engine.twentyOne(2.5,null,'start','old',rngFor([0,8,9,7]));assert.equal(x.round.target,undefined);x=engine.twentyOne(2.5,x.round,'dealer','old',undefined,33);assert.equal(x.winUnits,625);
});

test('an already saved 33 hand retains its original 2x payout after the balance update',()=>{
 let x=start([12,25,11,10,7,3]);delete x.round.winFactor;delete x.round.dealVersion;
 x=move(x,'hit');x=move(x,'dealer');assert.equal(x.winUnits,500);assert.equal(x.round.winFactor,undefined);
});
test('a v5 hand preserves bank 27 and its saved 2.08x payout',()=>{
 let x=start([12,25,11,10,7,3]);delete x.round.dealVersion;
 x=move(x,'hit');x=move(x,'dealer');
 assert.equal(x.round.dealerHard,28);assert.equal(x.round.phase,'settled');assert.equal(x.winUnits,520);
});
test('adaptive bank can stop below 27, chase above 27, and protect a risky tie',()=>{
 assert.equal(cards.bankDraw(22,24),false);
 assert.equal(cards.bankDraw(33,32),true);
 assert.equal(cards.bankDraw(27,27),false);
 assert.equal(cards.bankDraw(20,20),true);
});
test('directed deals preserve four copies of each rank, bounded fallback and the reference return',()=>{
 for(const [roll,goal]of[[0,'win'],[.45,'push'],[.9,'loss']]){
  const deck=cards.directedDeck(()=>roll);
  assert.equal(cards.referenceOutcome(deck),goal);assert.equal(new Set(deck).size,52);
  for(let rank=1;rank<=13;rank++)assert.equal(deck.filter(c=>cards.value(c)===rank).length,4);
 }
 assert.ok(Math.abs(cards.WIN_CHANCE*cards.WIN_FACTOR/100+cards.PUSH_CHANCE-.98)<1e-12);
});
test('the same prepared opening can win or lose according to the player decision',()=>{
 const initial=start([12,25,11,10,7,38]),saved=structuredClone(initial.round.deck);
 let stood=move(initial,'stand'),hit=move(initial,'hit');
 while(stood.round.phase==='dealer')stood=move(stood,'dealer');
 while(hit.round.phase==='dealer')hit=move(hit,'dealer');
 assert.equal(stood.round.result.outcome,'loss');assert.equal(hit.round.result.outcome,'win');
 assert.deepEqual(hit.round.deck,saved);assert.deepEqual(stood.round.deck,saved);
});
