'use strict';
const {shuffle}=require('./twenty-one.cjs');
const TARGET=33, BANK_STAND=27, WIN_FACTOR=208;
const value=card=>card%13+1;
const total=cards=>cards.reduce((n,c)=>n+value(c),0);
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
  r={id:roundId,target:TARGET,winFactor:WIN_FACTOR,betUnits:Math.round(bet*100),turn:1,phase:'player',deck:shuffle(rng),cursor:0,
   player:[],dealer:[],playerHard:0,playerAces:0,dealerHard:0,dealerAces:0,result:null};
  for(const h of ['player','dealer','player','dealer'])add(h);
 }else{
  r=structuredClone(previous);r.turn++;
  if(move==='hit'){add('player');r.phase=r.playerHard>TARGET?'settled':r.playerHard===TARGET?'dealer':'player';}
  else if(move==='stand')r.phase='dealer';
  else{if(r.dealerHard<BANK_STAND)add('dealer');if(r.dealerHard>=BANK_STAND)r.phase='settled';}
 }
 const ended=r.phase==='settled';if(ended)r.result=result(r);
 return {move,round:r,ended,winUnits:ended?r.result.payoutUnits:0};
}
module.exports={TARGET,BANK_STAND,WIN_FACTOR,value,total,result,thirtyThree};
