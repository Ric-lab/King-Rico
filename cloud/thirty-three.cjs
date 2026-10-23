'use strict';
const {shuffle}=require('./twenty-one.cjs');
const TARGET=33, BANK_STAND=27, WIN_FACTOR=208, DEAL_VERSION=2, PUSH_CHANCE=.08, WIN_CHANCE=(.98-PUSH_CHANCE)/(WIN_FACTOR/100);
const value=card=>card%13+1;
const total=cards=>cards.reduce((n,c)=>n+value(c),0);
// Dealer decisions depend on the player's hand. On a tie, draw only when
// at least seven of thirteen ranks are safe; otherwise preserve the tie.
const bankDraw=(player,dealer)=>dealer<player || dealer===player && dealer<=26;
function referenceOutcome(deck,threshold=28){
 let p=value(deck[0])+value(deck[2]),d=value(deck[1])+value(deck[3]),i=4;
 while(p<threshold)p+=value(deck[i++]);
 if(p>TARGET)return 'loss';
 while(bankDraw(p,d))d+=value(deck[i++]);
 return d>TARGET || p>d?'win':p===d?'push':'loss';
}
function directedDeck(rng){
 const roll=rng(),goal=roll<WIN_CHANCE?'win':roll<WIN_CHANCE+PUSH_CHANCE?'push':'loss';
 let deck;
 for(let i=0;i<128;i++){
  deck=shuffle(rng);
  if(referenceOutcome(deck)===goal)return deck;
 }
 // Bounded fallback for a degenerate/injected RNG, still a valid 52-card deck.
 const prefix=goal==='win'?[12,11,25,24,6,38]:goal==='push'?[12,11,25,24,6,8]:[12,11,25,24,1,4];
 return [...prefix,...deck.filter(c=>!prefix.includes(c))];
}
function result(r){
 const p=r.playerHard,d=r.dealerHard,bet=r.betUnits;
 const reason=p>TARGET?'player-bust':d>TARGET?'dealer-bust':p>d?'higher':p===d?'equal':'lower';
 const outcome=reason==='equal'?'push':['dealer-bust','higher'].includes(reason)?'win':'loss';
 const payoutUnits=outcome==='push'?bet:outcome==='win'?Math.round(bet*(r.winFactor??200)/100):0;
 return {outcome,reason,payoutUnits,netUnits:payoutUnits-bet};
}
function thirtyThree(bet,previous,move,roundId,rng){
 let r;
 const add=hand=>{const c=r.deck[r.cursor++];r[hand].push(c);r[hand+'Hard']+=value(c);};
 if(move==='start'){
  r={id:roundId,target:TARGET,dealVersion:DEAL_VERSION,winFactor:WIN_FACTOR,betUnits:Math.round(bet*100),turn:1,phase:'player',deck:directedDeck(rng),cursor:0,
   player:[],dealer:[],playerHard:0,playerAces:0,dealerHard:0,dealerAces:0,result:null};
  for(const h of ['player','dealer','player','dealer'])add(h);
 }else{
  r=structuredClone(previous);r.turn++;
  if(move==='hit'){add('player');r.phase=r.playerHard>TARGET?'settled':r.playerHard===TARGET?'dealer':'player';}
  else if(move==='stand')r.phase='dealer';
  else{
   const draw=()=>r.dealVersion===DEAL_VERSION?bankDraw(r.playerHard,r.dealerHard):r.dealerHard<BANK_STAND;
   if(draw())add('dealer');if(!draw())r.phase='settled';
  }
 }
 const ended=r.phase==='settled';if(ended)r.result=result(r);
 return {move,round:r,ended,winUnits:ended?r.result.payoutUnits:0};
}
module.exports={TARGET,BANK_STAND,WIN_FACTOR,DEAL_VERSION,PUSH_CHANCE,WIN_CHANCE,value,total,bankDraw,referenceOutcome,directedDeck,result,thirtyThree};
