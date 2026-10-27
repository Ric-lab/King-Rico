// Short sessions of the production engines, without gifts or refill credits.
// An action is a player decision, not an estimate of real seconds or enjoyment.
import current from '../cloud/engine.cjs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
import {seeded} from './economy-audit.mjs';
const ROUND='session-audit';
export const profiles=[
 {id:'circus',game:'circus'},
 {id:'wheel',game:'wheel',selected:1},
 {id:'wheel-fortune',game:'wheel',selected:0},
 {id:'neck-3',game:'neck',stop:3},{id:'neck-7',game:'neck',stop:7},
 {id:'flying-3',game:'flying',stop:3},
 {id:'penalty-2',game:'penalty',stop:2,quality:1000},
 {id:'penalty-2-quality-800',game:'penalty',stop:2,quality:800},
 {id:'clown-mouth',game:'clown',selected:0},{id:'clown-ear',game:'clown',selected:4},
 {id:'fingo-gold',game:'fingo',aim:'gold'},{id:'fingo-neutral',game:'fingo',aim:'neutral'},
 {id:'33-28',game:'33',stop:28},{id:'33-25',game:'33',stop:25}
];
export function playRound(e,p,bet,rng,carry={}){
 let x,actions=0;
 if(p.game==='circus'){
  x=e.slot(bet,carry.peaches||0,rng,carry.bank||null);carry.peaches=x.peaches;carry.bank=x.peachBank;actions=1;
 }else if(p.game==='wheel'){x=e.wheel(bet,p.selected,rng);actions=1;
 }else if(p.game==='clown'){
  let prior=null;for(let n=0;n<e.CLOWN_BALLS;n++){x=e.clown(bet,prior,ROUND,p.selected,undefined,rng);prior=x;actions++;}
 }else if(p.game==='fingo'){
  let prior=null;
  do{
   const rolled=e.fingo(bet,prior,'roll',ROUND,undefined,rng);
   const selected=p.aim==='gold'?(rolled.cardVersion===1?e.fingoCard.chooseSlot(rolled):rolled.slots.findIndex((v,c)=>!rolled.marks[c]&&v===rolled.targets[c])):Math.floor(rng()*5);
   x=e.fingo(bet,rolled,'drop',ROUND,selected,rng);prior={...x,slots:null};actions+=2;
  }while(!x.ended);
 }else if(p.game==='33'){
  x=e.twentyOne(bet,null,'start',ROUND,rng,33);actions++;
  while(x.round.phase==='player'){x=e.twentyOne(bet,x.round,x.round.playerHard<p.stop?'hit':'stand',ROUND,rng);actions++;}
  while(x.round.phase==='dealer')x=e.twentyOne(bet,x.round,'dealer',ROUND,rng);
 }else if(p.game==='neck'){
  x=e.neck(bet,null,'start',ROUND,rng);actions++;
  while(!x.ended){x=e.neck(bet,x,x.floor>=p.stop?'collect':'climb',ROUND,rng);actions++;}
 }else if(p.game==='flying'){
  x=e.flying(bet,null,'pop',ROUND,0,rng);actions++;
  while(!x.ended){x=e.flying(bet,x,x.step>=p.stop?'collect':'pop',ROUND,x.step,rng);actions++;}
 }else if(p.game==='penalty'){
  x=e.penalty(bet,null,'shoot',ROUND,p.quality,rng);actions++;
  while(!x.ended){x=e.penalty(bet,x,x.step>=p.stop?'collect':'shoot',ROUND,p.quality,rng);actions++;}
 }else throw Error('Unknown session profile');
 return{paid:x.winUnits,actions};
}
const quantile=(sorted,p)=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];
export function auditSession(e,profile,{count=1000,rounds=20,stake=10,startingBalance=1000,seed=197803,actionBudget=Infinity}={}){
 const endings=[],dryRuns=[],played=[],actionsUsed=[];
 let wins=0,pushes=0,partial=0,zero=0,total=0,paid=0,ruined=0,above=0;
 const units=e.units(stake),start=e.units(startingBalance);
 for(let i=0;i<count;i++){
  const rng=seeded((seed+Math.imul(i+1,2654435761))>>>0),carry={};
  let balance=start,n=0,actions=0,dry=0,longest=0;
  while(n<rounds&&actions<actionBudget&&balance>=units){
   const x=playRound(e,profile,stake,rng,carry);balance+=x.paid-units;n++;total++;paid+=x.paid;actions+=x.actions;
   wins+=x.paid>units;pushes+=x.paid===units;partial+=x.paid>0&&x.paid<units;zero+=x.paid===0;
   if(x.paid)dry=0;else longest=Math.max(longest,++dry);
  }
  endings.push(balance/100);dryRuns.push(longest);played.push(n);actionsUsed.push(actions);
  ruined+=balance<units;above+=balance>start;
 }
 for(const a of [endings,dryRuns,played,actionsUsed])a.sort((a,b)=>a-b);
 return{profile:profile.id,game:profile.game,count,seed,startingBalance,stake,
  roundLimit:rounds,actionBudget:Number.isFinite(actionBudget)?actionBudget:null,
  completedRounds:total,rtp:paid/(total*units),profitRate:wins/total,pushRate:pushes/total,
  partialReturnRate:partial/total,zeroReturnRate:zero/total,endingBalance:{p10:quantile(endings,.1),median:quantile(endings,.5),p90:quantile(endings,.9)},
  endsAboveStart:above/count,unableToBetAgain:ruined/count,
  medianRounds:quantile(played,.5),medianActions:quantile(actionsUsed,.5),p90LongestWithoutReturn:quantile(dryRuns,.9)};
}
export function auditSessions(e=current,options={}){
 const cases=[];
 for(const stake of [10,50])for(const p of profiles){
  cases.push(auditSession(e,p,{...options,stake}));
  cases.push(auditSession(e,p,{...options,stake,rounds:100,actionBudget:100}));
 }
 return{rulesVersion:e.RULES_VERSION,note:'Seeded simulations, not measured player retention. No gifts, ads, history-based odds or refills. Golden-pipe aiming and stopping policies are explicit. The last round may cross the action budget.',cases};
}
export function historicalEngine(ref){
 if(!/^[a-f0-9]{7,40}$/.test(ref))throw Error('Use a commit SHA');
 const source=execFileSync('git',['show',ref+':cloud/engine.cjs'],{encoding:'utf8'});
 const sandbox={module:{exports:{}},require:createRequire(new URL('../cloud/engine.cjs',import.meta.url)),structuredClone};
 vm.runInNewContext(source,sandbox,{filename:'historical-engine.cjs'});return sandbox.module.exports;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const ref=process.argv[process.argv.indexOf('--compare-ref')+1];
 console.log(JSON.stringify(process.argv.includes('--compare-ref')?{before:auditSessions(historicalEngine(ref)),after:auditSessions()}:auditSessions(),null,2));
}
