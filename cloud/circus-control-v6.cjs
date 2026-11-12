'use strict';
const engine=require('./engine.cjs');
const {boundedNormalInt}=require('./truncated-normal.cjs');
const freshEconomy=()=>({version:1,rounds:0,wageredUnits:0,paidUnits:0,tigerUnits:0});
const returned=e=>e.paidUnits-e.tigerUnits;
function control(p,s,bet){
 const stake=engine.units(bet),e=s.economyV6||freshEconomy();
 const budget=Math.max(0,returned(e)-Math.ceil((e.wageredUnits+stake)*.9));
 const maxTiger=Math.min(stake*25,Math.max(0,p.balanceUnits-stake),budget);
 return {stake,budget,maxTiger};
}
function candidate(p,s,bet,rng){
 const c=control(p,s,bet),draw=rng();
 // Resource attacks remain visible without a balance. Tony needs actual excess;
 // the rate rises with excess return, never with a fabricated presentation outcome.
 const tigerChance=c.maxTiger>=c.stake?.05+.45*Math.min(1,c.budget/(c.stake*25)):0;
 const kind=draw<tigerChance?'tony':draw<tigerChance+.025?'tucker':draw<tigerChance+.05?'ray':null;
 if(!kind)return null;
 const cells=[...engine.ALL_LINES[Math.min(7,Math.floor(rng()*8))]],symbol={tony:12,tucker:13,ray:14}[kind];
 const grid=[10,2,0,6,8,7,10,0,2];cells.forEach(i=>grid[i]=symbol);
 const bank=p.peachBank||{count:p.peaches,units:p.peaches*c.stake},before=s.cedros||0;
 const protect=before>0&&(kind!=='tucker'||p.peaches>0);
 const x={grid,res:{win:0,cells,lines:[engine.ALL_LINES.findIndex(l=>l.every((v,i)=>v===cells[i]))],full:false,peach:[]},feature:null,peaches:p.peaches,peachBank:bank,slotVersion:6,parkVersion:1,ticketAward:0,cedarAward:0,winUnits:0};
 if(protect){s.cedros=before-1;x.defense={against:kind};}
 if(kind==='tony'){
  const amount=protect?0:boundedNormalInt(c.stake,c.maxTiger,rng);
  x.tony={version:3,minUnits:c.stake,maxUnits:protect?0:c.maxTiger,stolenUnits:amount,hits:[Math.floor(amount/3),Math.floor(amount/3),amount-2*Math.floor(amount/3)]};
 }else if(kind==='tucker'){
  const count=p.peaches,stolen=protect?0:boundedNormalInt(count?1:0,Math.min(4,count),rng),remaining=count-stolen;
  x.peaches=remaining;x.peachBank={count:remaining,units:count?bank.units-Math.round(bank.units*stolen/count):0};
  x.tucker={version:3,stolen};
 }else{
  // Every non-empty stock blocks Ray by consuming one cedar. No double loss.
  x.ray={version:3,stolen:0};
 }
 s.spins++;return x;
}
function recordSpin(s,x,bet){const e=s.economyV6||freshEconomy();s.economyV6={...e,rounds:e.rounds+1,wageredUnits:e.wageredUnits+engine.units(bet),paidUnits:e.paidUnits+x.winUnits,tigerUnits:e.tigerUnits+(x.tony?.stolenUnits||0)};}
function recordBonus(s,extra){if(s.economyV6)s.economyV6={...s.economyV6,paidUnits:s.economyV6.paidUnits+extra};}
module.exports={freshEconomy,returned,control,candidate,recordSpin,recordBonus};
