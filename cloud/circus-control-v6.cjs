'use strict';
const engine=require('./engine.cjs');
const {resourceDie}=require('./villain-dice.cjs');
const freshEconomy=()=>({version:1,rounds:0,wageredUnits:0,paidUnits:0,tigerUnits:0});
const returned=e=>e.paidUnits-e.tigerUnits;
function control(p,s,bet){
 const stake=engine.units(bet),e=s.economyV6||freshEconomy();
 const charged=s.cloverFreeBetUnits?0:stake;
 const budget=Math.max(0,returned(e)-Math.ceil((e.wageredUnits+charged)*.9));
 const maxTiger=Math.min(stake*5,Math.max(0,p.balanceUnits-charged),budget);
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
 // Trevo defende Tony e Tucker (nunca o Ray: ele existe para roubar trevos).
 const protect=before>0&&(kind==='tony'||kind==='tucker'&&p.peaches>0);
 const x={grid,res:{win:0,cells,lines:[engine.ALL_LINES.findIndex(l=>l.every((v,i)=>v===cells[i]))],full:false,peach:[]},feature:null,peaches:p.peaches,peachBank:bank,slotVersion:6,parkVersion:1,ticketAward:0,cedarAward:0,winUnits:0};
 if(protect){
  s.cedros=before-1;
  const cell=cells[1],cash=[10,2,0,6,8,7],pair=cash[Math.min(2,Math.floor(rng()*3))];
  const crossing=engine.ALL_LINES.find(l=>l.includes(cell)&&l.every(i=>i===cell||!cells.includes(i)));
  const spare=cash.filter(v=>v!==pair);let next=0;
  const beforeGrid=Array.from({length:9},(_,i)=>cells.includes(i)?symbol:crossing.includes(i)?pair:spare[next++]);
  const replacement=cash[Math.min(cash.length-1,Math.floor(rng()*cash.length))];
  x.grid=beforeGrid.slice();x.grid[cell]=replacement;x.res=engine.evaluate(x.grid,bet,6);x.winUnits=engine.units(x.res.win);
  x.defense={against:kind,beforeGrid,cell,replacement,line:engine.ALL_LINES.findIndex(l=>l.every((v,i)=>v===cells[i]))};
 }
 if(kind==='tony'){
  const ceiling=Math.min(5,Math.floor(c.maxTiger/c.stake));
  const dice=protect?null:resourceDie(ceiling,rng),value=dice?.value||0,amount=value*c.stake;
  x.tony=protect?{version:3,minUnits:c.stake,maxUnits:0,stolenUnits:0,hits:[0,0,0]}:
   {version:5,...(dice?{dice}:{}),stolenUnits:amount,hits:[Math.floor(amount/3),Math.floor(amount/3),amount-2*Math.floor(amount/3)]};
 }else if(kind==='tucker'){
  const count=p.peaches,dice=protect?null:resourceDie(count,rng),stolen=dice?.value||0,remaining=count-stolen;
  x.peaches=remaining;x.peachBank={count:remaining,units:count?bank.units-Math.round(bank.units*stolen/count):0};
  x.tucker=protect?{version:3,stolen:0}:{version:5,...(dice?{dice}:{}),stolen};
 }else{
  // Saved 0–5 die; resource loss is capped at the actual stock.
  const dice=resourceDie(before,rng),stolen=dice?.value||0;s.cedros=before-stolen;
  x.ray={version:5,...(dice?{dice}:{}),before,stolen,remaining:before-stolen};
 }
 return x;
}
function recordSpin(s,x,bet){const e=s.economyV6||freshEconomy();s.economyV6={...e,rounds:e.rounds+1,wageredUnits:e.wageredUnits+(x.freeSpin?0:engine.units(bet)),paidUnits:e.paidUnits+x.winUnits,tigerUnits:e.tigerUnits+(x.tony?.stolenUnits||0)};}
function recordBonus(s,extra){if(s.economyV6)s.economyV6={...s.economyV6,paidUnits:s.economyV6.paidUnits+extra};}
module.exports={freshEconomy,returned,control,candidate,recordSpin,recordBonus};
