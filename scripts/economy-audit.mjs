// Reproducible expectations and session samples from the production engine.
// Gifts/refills are deliberately excluded from wager RTP.
import engine from '../cloud/engine.cjs';
import park from '../cloud/park.cjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {slotMath} from './economy-math.mjs';
import {auditNeck} from './neck-audit.mjs';
import {auditFlying} from './flying-audit.mjs';
import {auditFingoCard} from './fingo-card-audit.mjs';
import {pathToFileURL} from 'node:url';

export const seeded=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
export function probability(predicate) {
  let lo=0,hi=2**32;
  while(lo<hi){const mid=Math.floor((lo+hi)/2);if(predicate(mid/2**32))lo=mid+1;else hi=mid;}
  return lo/2**32;
}
export function wheelMath(bet,selected) {
  const exact=selected===0?engine.WHEEL_FORTUNE_P:engine.WHEEL_EXACT_P;
  const color=selected===0?0:engine.WHEEL_COLOR_P;
  const stake=engine.units(bet);
  const prize=engine.wheel(bet,selected,()=>exact/2).winUnits;
  const colorPrize=color?engine.wheel(bet,selected,()=>exact+color/2).winUnits:0;
  return {rtp:(exact*prize+color*colorPrize)/stake,prizeRate:exact+color};
}
export function clownMath(bet,selected) {
  const one=r=>engine.clown(bet,null,'audit',selected,undefined,()=>r);
  const hit=probability(r=>one(r).hit===selected),prize=one(0).sumUnits;
  return {rtp:hit*prize*engine.CLOWN_BALLS/engine.units(bet),hitPerBall:hit,
    prizeRate:1-(1-hit)**engine.CLOWN_BALLS};
}
export function ladderMath(game,bet) {
  if(game!=='penalty')throw Error('Use auditFlying: guarantees require conditional stopping policies');
  const play=(previous,move,r)=>engine.penalty(bet,previous,move,'audit',1000,()=>r);
  let previous=null,success=1;const floors=[];
  for(let i=0;i<engine.PENALTY_MULTIPLIERS.length;i++){
    success*=probability(r=>play(previous,'shoot',r).goal);
    previous=play(previous,'shoot',0);
    const prize=previous.ended?previous.winUnits:play(previous,'collect',0).winUnits;
    floors.push({floor:i+1,rtp:success*prize/engine.units(bet),prizeRate:success});
  }
  return floors;
}
export function fingoMath(bet=10,version=2) {
  const choose=(n,k)=>{let x=1;for(let i=0;i<k;i++)x=x*(n-i)/(i+1);return x;};
  const h=version===2?engine.FINGO_HIT:engine.FINGO_LEGACY_HIT,stake=engine.units(bet);let rtp=0,prizeRate=0;
  for(let n=5;n<=engine.FINGO_BALLS;n++){
    const chance=choose(n-1,4)*h**5*(1-h)**(n-5);
    const prize=Math.round(stake*engine.fingoMultiplier(n,version));
    rtp+=chance*prize/stake;prizeRate+=chance;
  }
  return {rtp,prizeRate};
}
export function cardHand(rng,threshold=28,bet=10) {
  let x=engine.twentyOne(bet,null,'start','audit',rng,33);
  while(x.round.phase==='player')x=engine.twentyOne(bet,x.round,x.round.playerHard<threshold?'hit':'stand','audit',rng);
  while(x.round.phase==='dealer')x=engine.twentyOne(bet,x.round,'dealer','audit',rng);
  return x;
}
export function cardSimulation(hands=200000,threshold=28,seed=326729) {
  const rng=seeded(seed);let paid=0,wins=0,pushes=0;
  for(let i=0;i<hands;i++){
    const x=cardHand(rng,threshold);paid+=x.winUnits;
    wins+=x.round.result.outcome==='win';pushes+=x.round.result.outcome==='push';
  }
  return {hands,seed,threshold,rtp:paid/(hands*1000),winRate:wins/hands,pushRate:pushes/hands};
}
export function slotSample(spins=500000) {
  const rng=seeded(472831);let peaches=0,bank=null,paid=0,hits=0,profits=0,bonuses=0,streak=0,longest=0;
  for(let i=0;i<spins;i++){
    const x=engine.slot(10,peaches,rng,bank);peaches=x.peaches;bank=x.peachBank;
    paid+=x.winUnits;hits+=x.winUnits>0;profits+=x.winUnits>1000;bonuses+=!!x.feature;
    if(x.winUnits)streak=0;else longest=Math.max(longest,++streak);
  }
  return {spins,seed:472831,rtp:paid/(spins*1000),prizeRate:hits/spins,profitRate:profits/spins,
    bonusEvery:spins/bonuses,longestWithoutPrize:longest};
}
function sessions(game,count=2000) {
  const rng=seeded(98741),ends=[];let ruined=0,winners=0;
  for(let s=0;s<count;s++){
    let balance=100000,peaches=0,bank=null;
    for(let i=0;i<100 && balance>=1000;i++){
      let paid;
      if(game==='circus'){const x=engine.slot(10,peaches,rng,bank);peaches=x.peaches;bank=x.peachBank;paid=x.winUnits;}
      else if(game==='wheel')paid=engine.wheel(10,1,rng).winUnits;
      else paid=cardHand(rng).winUnits;
      balance+=paid-1000;
    }
    ends.push(balance/100);ruined+=balance<1000;winners+=balance>100000;
  }
  ends.sort((a,b)=>a-b);
  return {sessions:count,seed:98741,startingBalance:1000,stake:10,rounds:100,
    p10:ends[Math.floor(count*.1)],median:ends[Math.floor(count*.5)],p90:ends[Math.floor(count*.9)],
    endsAboveStart:winners/count,unableToBetAgain:ruined/count};
}
export function auditEconomy() {
  const neck=auditNeck(),flying=auditFlying();
  return {rulesVersion:engine.RULES_VERSION,targetRtp:engine.TARGET_RTP,
    note:'Long-run wager return. Session samples can win or lose; no historical adjustment. Skill and choices matter.',
    circus:{theoretical:slotMath(),sample:slotSample(),sessions:sessions('circus')},
    wheel:{ordinary:wheelMath(10,1),fortune:wheelMath(10,0),sessions:sessions('wheel')},
    clown:engine.CLOWN_MULTIPLIERS.map((m,i)=>({multiplier:m,...clownMath(10,i)})),
    fingo:{card:auditFingoCard(10000),paidFiveTargets:fingoMath()},flying:{maxOptimalRtp:flying.maxOptimalRtp,firstFloor:flying.bets[3].fixedFloors[0]},penalty:ladderMath('penalty',10),
    neck:{maxOptimalRtp:neck.maxOptimalRtp,firstFloor:neck.bets.find(b=>b.bet===10).fixedFloors[0]},
    thirtyThree:{strategies:[24,25,26,27,28,29,30].map(t=>cardSimulation(200000,t)),sessions:sessions('33')},
    excluded:'Legacy 21 and parked Bounce/Claw/Race retain their previous math.'};
}
// Complete Circus v4 audit: production engine, persistent Happeach/tickets,
// tenth-spin bonus and actual post-stake theft. No grants/refills or real accounts.
export function auditCircusV4({spins=5000000,bet=10,seed=472831}={}) {
  if(!Number.isSafeInteger(spins)||spins<1||!engine.BETS.includes(bet))throw Error('Invalid audit parameters');
  const rng=seeded(seed),stake=engine.units(bet),p={balanceUnits:500000000000,peaches:0,peachBank:{count:0,units:0}},state=park.fresh();
  let paid=0,wheel=0,theft=0,tickets=0,stolenTickets=0,tony=0,tucker=0,ray=0,batch=0;const batches=[];
  for(let i=0;i<spins;i++){
    const x=park.spin(p,state,bet,'audit-'+i,rng,4),loss=x.tony?.stolenUnits||0,award=x.ticketAward||0;
    p.balanceUnits+=x.winUnits-stake-loss;p.peaches=x.peaches;p.peachBank=x.peachBank;
    paid+=x.winUnits;theft+=loss;tickets+=award;stolenTickets+=x.ray?.stolen||0;
    tony+=!!x.tony;tucker+=!!x.tucker;ray+=!!x.ray;
    let extra=0;if(state.wheel){extra=park.bonus(state,state.wheel.id,rng);wheel+=extra;p.balanceUnits+=extra;state.wheel=null;state.spins=0;}
    batch+=x.winUnits+extra-loss+award*park.PRICE*100;
    if((i+1)%100000===0){batches.push(batch/(100000*stake));batch=0;}
    if(p.balanceUnits<stake)throw Error('Audit bankroll exhausted');
  }
  const wagered=spins*stake,ticketUnits=tickets*park.PRICE*100,total=paid+wheel-theft+ticketUnits;
  const mean=batches.reduce((a,b)=>a+b,0)/batches.length;
  const se=batches.length>1?Math.sqrt(batches.reduce((a,b)=>a+(b-mean)**2,0)/(batches.length-1)/batches.length):null;
  return {version:4,spins,bet,seed,pays:[...engine.circusProfile.PAYS],target:[.885,.915],
    components:{baseAndFeatureCoins:paid/100,wheelCoins:wheel/100,tigerStolen:theft/100,ticketsAwarded:tickets,ticketValue:park.PRICE,ticketCoins:ticketUnits/100,rayStolenTickets:stolenTickets},
    coinReturn:(paid+wheel-theft)/wagered,totalReturn:total/wagered,
    netOfRayReturn:(total-stolenTickets*park.PRICE*100)/wagered,
    sample95Interval:se?[mean-1.96*se,mean+1.96*se]:null,
    villains:{tony,tucker,ray},endingTickets:state.tickets,
    inRange:total/wagered>=.885&&total/wagered<=.915,
    scope:'Total = base/feature coins + tenth-spin wheel - Tiger theft + issued tickets at 25 coins. Ray losses and net ticket return reported separately. No grants/refills or ticket redemption.'};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  if(process.argv.includes('--circus-v4')){
    const arg=(name,fallback)=>process.argv.find(a=>a.startsWith(name+'='))?.split('=')[1]??fallback;
    const spins=Number(arg('--spins','5000000')),bets=arg('--bets','1,10,100,1000').split(',').map(Number),seed=Number(arg('--seed','472831'));
    const results=[];for(const bet of bets){const result=auditCircusV4({spins,bet,seed});results.push(result);console.error(JSON.stringify({bet,spins,totalReturn:result.totalReturn,netOfRayReturn:result.netOfRayReturn,inRange:result.inRange}));}
    const sourceHashes=Object.fromEntries(['cloud/circus-profile.cjs','cloud/park.cjs','cloud/engine.cjs','scripts/economy-audit.mjs'].map(file=>[file,createHash('sha256').update(readFileSync(new URL('../'+file,import.meta.url))).digest('hex')]));
    console.log(JSON.stringify({date:new Date().toISOString(),command:process.argv.slice(2),sourceHashes,results,passed:results.every(r=>r.inRange&&r.totalReturn<=1)},null,2));
  }else console.log(JSON.stringify(auditEconomy(),null,2));
}
