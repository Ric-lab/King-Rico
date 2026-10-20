import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newAccount,makeDeck,handValue,transition,readAccount} from './state.mjs';
function ordered(values) {
  const rest=makeDeck(),first=[];
  for(const value of values){const i=rest.findIndex(c=>c.value===value);assert.ok(i>=0);first.push(...rest.splice(i,1));}
  return [...first,...rest];
}
function start(values,initial=newAccount()) {return transition(initial,{type:'start',revision:initial.revision,id:'round-1',deck:ordered(values)});}
function act(s,type) {return transition(s,{type,revision:s.revision,roundId:s.round.id});}
test('52 unique numbered cards; four aces and sixteen tens',()=>{
  const deck=makeDeck();assert.equal(deck.length,52);assert.equal(new Set(deck.map(c=>c.id)).size,52);
  assert.equal(deck.filter(c=>c.value===1).length,4);assert.equal(deck.filter(c=>c.value===10).length,16);
});
test('ace adjusts automatically and multiple aces never count as two elevens',()=>{
  const cards=values=>values.map(value=>({value}));
  assert.deepEqual(handValue(cards([1,6])),{total:17,soft:true,natural:false});
  assert.equal(handValue(cards([1,6,10])).total,17);
  assert.equal(handValue(cards([1,1,9])).total,21);
  assert.equal(handValue(cards([1,10])).natural,true);
});
test('debit once; stale or repeated start cannot charge again',()=>{
  const s=start([10,5,8,10]);assert.equal(s.balance,980);assert.equal(s.round.phase,'player');
  assert.equal(transition(s,{type:'start',revision:0,id:'other',deck:makeDeck()}),s);
  assert.equal(transition(s,{type:'start',revision:s.revision,id:'other',deck:makeDeck()}),s);
});
test('natural pays 2.5x, including the stake; reload and duplicate dealer cannot pay again',()=>{
  const s=start([1,9,10,8]);assert.equal(s.round.result.reason,'natural');assert.equal(s.balance,1030);
  const restored=readAccount(JSON.stringify(s));assert.deepEqual(restored,s);
  assert.equal(act(restored,'dealer'),restored);assert.equal(act(restored,'stand'),restored);
});
test('dealer natural resolves before player can draw; both naturals push',()=>{
  const loss=start([9,1,10,10]);assert.equal(loss.round.result.reason,'dealer-21');assert.equal(loss.balance,980);
  assert.equal(act(loss,'hit'),loss);
  const push=start([1,1,10,10]);assert.equal(push.balance,1000);assert.equal(push.round.result.outcome,'push');
});
test('stand, reload during bank turn, complete and credit exactly once',()=>{
  let s=start([10,6,8,7,10]);s=act(s,'stand');s=readAccount(JSON.stringify(s));s=act(s,'dealer');
  assert.equal(s.round.result.reason,'dealer-bust');assert.equal(s.balance,1020);assert.equal(s.rounds,1);
  assert.equal(act(s,'dealer'),s);
});
test('bank stands on soft 17 without drawing',()=>{
  let s=start([10,1,8,6,10]);s=act(s,'stand');s=act(s,'dealer');
  assert.equal(s.round.dealer.length,2);assert.equal(s.balance,1020);
});
test('bust loses stake; hit cannot redraw after reload',()=>{
  let s=start([10,9,8,8,10]);s=act(s,'hit');assert.equal(s.round.result.reason,'player-bust');assert.equal(s.balance,980);
  s=readAccount(JSON.stringify(s));assert.equal(act(s,'hit'),s);
});
test('three card 21 advances to bank and pays ordinary win, not a natural',()=>{
  let s=start([10,10,5,7,6]);s=act(s,'hit');assert.equal(s.round.phase,'dealer');s=act(s,'dealer');
  assert.equal(s.round.result.reason,'higher');assert.equal(s.round.result.payout,40);
});
test('ties return stake and lower total loses',()=>{
  let s=start([10,10,8,8]);s=act(act(s,'stand'),'dealer');assert.equal(s.balance,1000);
  let lost=start([10,10,7,9]);lost=act(act(lost,'stand'),'dealer');assert.equal(lost.balance,980);
});
test('stale actions from another turn and invalid decks are ignored',()=>{
  let s=start([10,8,4,8,2]);const original=s;s=act(s,'hit');
  assert.equal(transition(s,{type:'hit',revision:original.revision,roundId:s.round.id}),s);
  assert.equal(transition(s,{type:'stand',revision:s.revision,roundId:'wrong-round'}),s);
  assert.equal(transition(newAccount(),{type:'start',revision:0,id:'bad',deck:Array(52).fill(makeDeck()[0])}).balance,1000);
});
test('insufficient funds and refill do not touch active hands; saved invalid data fails closed',()=>{
  const initial={...newAccount(),balance:5};assert.equal(start([1,9,10,8],initial),initial);
  const refill=transition(initial,{type:'refill',revision:0});assert.equal(refill.balance,1000);
  const active=start([10,8,4,8]);assert.equal(act(active,'refill'),active);
  assert.throws(()=>readAccount('{"version":1,"balance":-4}'));
});
