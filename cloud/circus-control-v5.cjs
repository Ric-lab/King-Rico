'use strict';
const engine=require('./engine.cjs');
const {boundedNormalInt}=require('./truncated-normal.cjs');
const TARGET=90,TICKET_UNITS=2500;
const freshEconomy=()=>({version:1,rounds:0,wageredUnits:0,paidUnits:0,tigerUnits:0,ticketsAwarded:0,ticketsStolen:0});
const returned=e=>e.paidUnits-e.tigerUnits+(e.ticketsAwarded-e.ticketsStolen)*TICKET_UNITS;
function control(p,s,bet){
 const stake=engine.units(bet),e=s.economy||freshEconomy(),after=Math.max(0,p.balanceUnits-stake);
 const budget=Math.max(0,returned(e)-Math.ceil((e.wageredUnits+stake)*9/10));
 const pressure=Math.min(1,budget/(stake*25)),wealth=Math.min(1,after/(stake*100));
 const probability=budget>0?.50+.35*pressure*(.6+.4*wealth):0;
 const maxTiger=Math.min(stake*25,after,budget);
 const tickets=s.tickets,minRay=tickets?Math.max(1,Math.round(tickets*.05)):0;
 const maxRay=Math.min(tickets,Math.max(minRay,Math.round(tickets*.5)),Math.floor(budget/TICKET_UNITS));
 return {stake,budget,probability,minTiger:stake,maxTiger,minRay,maxRay};
}
function candidate(p,s,bet,rng){
 const c=control(p,s,bet),draw=rng();if(!c.probability||draw>=c.probability)return null;
 const tigerWeight=.05+.45*Math.min(1,c.budget/(c.stake*25)),resourceWeight=(1-tigerWeight)/2;
 const pool=[['tony',tigerWeight,c.maxTiger>=c.minTiger],['tucker',resourceWeight,true],['ray',resourceWeight,c.maxRay>=c.minRay]].filter(x=>x[2]);
 let at=draw/c.probability*pool.reduce((sum,x)=>sum+x[1],0),kind=pool.at(-1)[0];
 for(const [name,weight]of pool){at-=weight;if(at<0){kind=name;break;}}
 const line=Math.min(7,Math.floor(rng()*8)),cells=[...engine.ALL_LINES[line]],symbol={tony:12,tucker:13,ray:14}[kind];
 const grid=[0,1,2,3,4,9,6,7,8];cells.forEach(i=>grid[i]=symbol);
 const bank=p.peachBank||{count:p.peaches,units:p.peaches*c.stake};
 const x={grid,res:{win:0,cells,lines:[line],full:false,peach:[]},feature:null,peaches:p.peaches,peachBank:bank,slotVersion:5,parkVersion:1,ticketAward:0,winUnits:0};
 if(kind==='tony'){
  const amount=boundedNormalInt(c.minTiger,c.maxTiger,rng);
  x.tony={version:2,minUnits:c.minTiger,maxUnits:c.maxTiger,stolenUnits:amount,hits:[Math.floor(amount/3),Math.floor(amount/3),amount-2*Math.floor(amount/3)]};
 }else if(kind==='tucker'){
  const before=p.peaches,min=before?1:0,max=Math.min(4,before),stolen=boundedNormalInt(min,max,rng),remaining=before-stolen;
  x.peaches=remaining;x.peachBank={count:remaining,units:before?bank.units-Math.round(bank.units*stolen/before):0};
  x.tucker={version:2,before,stolen,remaining};
 }else{
  const before=s.tickets,stolen=boundedNormalInt(c.minRay,c.maxRay,rng),remaining=before-stolen;
  s.tickets=remaining;x.ray={version:2,before,stolen,remaining};
 }
 s.spins++;return x;
}
function recordSpin(s,x,bet){
 const e=s.economy||freshEconomy();
 s.economy={...e,rounds:e.rounds+1,wageredUnits:e.wageredUnits+engine.units(bet),paidUnits:e.paidUnits+x.winUnits,
  tigerUnits:e.tigerUnits+(x.tony?.stolenUnits||0),ticketsAwarded:e.ticketsAwarded+x.ticketAward,ticketsStolen:e.ticketsStolen+(x.ray?.stolen||0)};
}
function recordBonus(s,extra){if(s.economy)s.economy={...s.economy,paidUnits:s.economy.paidUnits+extra};}
module.exports={TARGET,TICKET_UNITS,freshEconomy,returned,control,candidate,recordSpin,recordBonus};
