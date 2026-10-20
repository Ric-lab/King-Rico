'use strict';
const value = card => Math.min(card % 13 + 1, 10);
const score = (hard, aces) => hard + (aces > 0 && hard + 10 <= 21 ? 10 : 0);
function total(cards) {
  return score(cards.reduce((n,c)=>n+value(c),0),cards.filter(c=>value(c)===1).length);
}
function shuffle(rng) {
  const deck=Array.from({length:52},(_,i)=>i);
  for(let i=51;i>0;i--) {const j=Math.floor(rng()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  return deck;
}
function add(round,hand) {
  const card=round.deck[round.cursor++];
  round[hand].push(card);
  round[hand+'Hard']+=value(card);
  round[hand+'Aces']+=value(card)===1 ? 1 : 0;
}
function result(round) {
  const p=score(round.playerHard,round.playerAces),d=score(round.dealerHard,round.dealerAces);
  const pn=p===21 && round.player.length===2,dn=d===21 && round.dealer.length===2;
  let outcome,reason;
  if(p>21){outcome='loss';reason='player-bust';}
  else if(pn && dn){outcome='push';reason='both-21';}
  else if(dn){outcome='loss';reason='dealer-21';}
  else if(pn){outcome='win';reason='natural';}
  else if(d>21){outcome='win';reason='dealer-bust';}
  else if(p>d){outcome='win';reason='higher';}
  else if(p===d){outcome='push';reason='equal';}
  else {outcome='loss';reason='lower';}
  const payoutUnits=outcome==='push'?round.betUnits:outcome==='win'?Math.round(round.betUnits*(reason==='natural'?2.5:2)):0;
  return {outcome,reason,payoutUnits,netUnits:payoutUnits-round.betUnits};
}
function twentyOne(bet,previous,move,roundId,rng) {
  let round;
  if(move==='start') {
    round={id:roundId,betUnits:Math.round(bet*100),turn:1,phase:'player',deck:shuffle(rng),cursor:0,
      player:[],dealer:[],playerHard:0,playerAces:0,dealerHard:0,dealerAces:0,result:null};
    for(const hand of ['player','dealer','player','dealer'])add(round,hand);
    if(total(round.player)===21 || total(round.dealer)===21)round.phase='dealer';
  } else {
    round=structuredClone(previous);round.turn++;
    if(move==='hit') {
      add(round,'player');const p=score(round.playerHard,round.playerAces);
      round.phase=p>21?'settled':p===21?'dealer':'player';
    } else if(move==='stand')round.phase='dealer';
    else {
      const natural=round.player.length===2&&total(round.player)===21 || round.dealer.length===2&&total(round.dealer)===21;
      if(!natural&&score(round.dealerHard,round.dealerAces)<17)add(round,'dealer');
      if(natural||score(round.dealerHard,round.dealerAces)>=17)round.phase='settled';
    }
  }
  const ended=round.phase==='settled';
  if(ended)round.result=result(round);
  return {move,round,ended,winUnits:ended?round.result.payoutUnits:0};
}
module.exports={value,score,total,result,twentyOne};
