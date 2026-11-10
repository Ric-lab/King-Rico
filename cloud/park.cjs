'use strict';
const engine=require('./engine.cjs');
const PRICE=25,METER_SPINS=10,TICKET=10;
const ATTRACTIONS=['clown','penalty','flying','fingo','bounce'];
const POCKETS=[10,1,2,1,3,2,1,5,2,1,3,2,1];
const fresh=()=>({version:1,revision:0,lastOperationId:null,tickets:0,spins:0,wheel:null,passes:{}});
const publicState=s=>({...structuredClone(s||fresh()),price:PRICE,meterSpins:METER_SPINS});
const fail=(code,message)=>{throw Object.assign(new Error(message),{code:'king-rico/'+code});};
// A ticket trinca uses the versioned five/eight combinations. Re-evaluate the displayed
// grid so coin prizes and highlighted cells always agree with the ticket row.
function placeTickets(x,bet,rng,version=1){
 const lines=version>=2?engine.ALL_LINES:engine.LINES;
 const cells=lines[Math.min(lines.length-1,Math.floor(rng()*lines.length))].slice();
 for(const i of cells)x.grid[i]=TICKET;
 x.res=engine.evaluate(x.grid.map(n=>n===TICKET?-1:n),bet,version);
 x.res.cells=[...new Set([...x.res.cells,...cells])];x.winUnits=engine.units(x.res.win);
 return cells;
}
// Non-winning ticket appearances never replace a paying symbol or Happeach.
// Up to two are shown, so only an actual straight/diagonal trinca earns tickets.
function scatterTickets(x,rng){
 const draw=rng();if(draw>=.5)return [];
 const count=draw<.3?1:2,blocked=new Set([...x.res.cells,...x.res.peach]),available=x.grid.flatMap((_,i)=>blocked.has(i)?[]:[i]),cells=[];
 for(let n=0;n<count&&available.length;n++){const at=Math.min(available.length-1,Math.floor(rng()*available.length));const [cell]=available.splice(at,1);x.grid[cell]=TICKET;cells.push(cell);}
 return cells;
}
// V4: 1% total villain chance, split equally. Fixed rates, never based on past wins.
const TONY=12,TONY_CHANCE=.01/3;
function theftUnits(balanceUnits,betUnits){return Math.max(0,Math.min(betUnits,Math.floor(Math.max(0,balanceUnits-betUnits)/20)));}
function tonySpin(p,s,bet,id,rng){
 const amount=theftUnits(p.balanceUnits,engine.units(bet));
 const line=Math.min(7,Math.floor(rng()*8)),cells=[...engine.ALL_LINES[line]];
 // A non-paying background: no wilds, tickets, Happeach or accidental coin lines.
 const grid=[0,1,2,3,4,5,6,7,8];cells.forEach(i=>grid[i]=TONY);
 const bank=p.peachBank||{count:p.peaches,units:p.peaches*engine.units(bet)};
 s.spins++;
 return {grid,res:{win:0,cells,lines:[line],full:false,peach:[]},feature:null,
  peaches:p.peaches,peachBank:bank,slotVersion:4,parkVersion:1,ticketAward:0,winUnits:0,
  tony:{version:1,stolenUnits:amount,hits:[Math.floor(amount/3),Math.floor(amount/3),amount-2*Math.floor(amount/3)]}};
}
// Resource villains share Tony's exclusive line layout; their receipts own the loss.
function resourceSpin(p,s,bet,kind,rng){
 const symbol=kind==='tucker'?13:14,line=Math.min(7,Math.floor(rng()*8)),cells=[...engine.ALL_LINES[line]];
 const grid=[0,1,2,3,4,5,6,7,8];cells.forEach(i=>grid[i]=symbol);
 const before=kind==='tucker'?p.peaches:s.tickets,stolen=Math.min(1,before),remaining=before-stolen;
 const bank=p.peachBank||{count:p.peaches,units:p.peaches*engine.units(bet)};
 const peachBank=kind==='tucker'?{count:remaining,units:before?bank.units-Math.round(bank.units/before):0}:bank;
 if(kind==='ray')s.tickets=remaining;
 s.spins++;
 return {grid,res:{win:0,cells,lines:[line],full:false,peach:[]},feature:null,
  peaches:kind==='tucker'?remaining:p.peaches,peachBank,slotVersion:4,parkVersion:1,ticketAward:0,winUnits:0,
  [kind]:{version:1,before,stolen,remaining}};
}
function spin(p,s,bet,id,rng,version=1){
 if(s.wheel)fail('round-conflict','Conclua a roleta bônus antes de girar novamente.');
 const random=rng||(()=>crypto.getRandomValues(new Uint32Array(1))[0]/2**32),filling=s.spins===9;
 if(version>=4&&!filling){
  const draw=random();
  if(draw<TONY_CHANCE&&theftUnits(p.balanceUnits,engine.units(bet))>=3)return tonySpin(p,s,bet,id,random);
  if(draw>=TONY_CHANCE&&draw<2*TONY_CHANCE)return resourceSpin(p,s,bet,'tucker',random);
  if(draw>=2*TONY_CHANCE&&draw<3*TONY_CHANCE)return resourceSpin(p,s,bet,'ray',random);
 }
 let x=engine.slot(bet,p.peaches,random,p.peachBank,version);
 if(filling){let attempts=0;while((x.res.win<=0||x.feature)&&attempts++<128)x=engine.slot(bet,p.peaches,random,p.peachBank,version);
  if(x.res.win<=0||x.feature){const grid=[1,1,1,0,3,6,7,8,5],res=engine.evaluate(grid,bet,version),bank={count:p.peaches,units:p.peachBank?.count===p.peaches?p.peachBank.units:p.peaches*engine.units(bet)};x={grid,res,feature:null,peaches:p.peaches,peachBank:bank,winUnits:engine.units(res.win)};}}
 const award=!filling&&!x.res.peach.length&&!x.feature&&random()<.14?3:0;
 if(award){placeTickets(x,bet,random,version);s.tickets+=3;}else if(version>=2)scatterTickets(x,random);
 s.spins++;if(filling)s.wheel={id,roundId:id,prizeVersion:3,baseUnits:engine.units(x.res.win),pockets:[...POCKETS],result:null};
 return {...x,...(version>=2?{slotVersion:version}:{}),parkVersion:1,ticketAward:award};
}
function entry(p,s,game,method){
 if(!ATTRACTIONS.includes(game)||!['ticket','coins'].includes(method))fail('invalid-argument','Entrada inválida.');
 if(p[game+'Round'])fail('round-conflict','Conclua a partida que já está aberta.');
 if(method==='ticket'?s.tickets<1:p.balanceUnits<PRICE*100)fail('failed-precondition',method==='ticket'?'Ingressos insuficientes.':'Saldo insuficiente.');
 s.passes[game]={method,started:false};p.settings[game+'BetIdx']=4;
 return {game,method};
}
function payment(p,s,data){
 if(!ATTRACTIONS.includes(data.action))return null;
 const game=data.action,round=p[game+'Round'],pass=s.passes[game];
 const active=!!(round&&pass?.started&&pass.roundId===round.id);
 if(!data.park&&!active)return null;
 if(!pass||(!round&&pass.started)||(round&&!active))fail('round-conflict','Escolha uma entrada para esta partida.');
 if(data.bet!==PRICE)fail('invalid-argument','A entrada do parque é de 25 moedas.');
 const first=!round;
 if(first&&pass.method==='ticket'&&s.tickets<1)fail('failed-precondition','Ingressos insuficientes.');
 return {first,method:pass.method,debit:first&&pass.method==='coins'?PRICE*100:0};
}
function settle(s,data,x,payment){
 if(!payment)return;
 x.parkVersion=1;
 if(payment.first){if(payment.method==='ticket')s.tickets--;s.passes[data.action]={method:payment.method,started:true,roundId:data.roundId};}
 if(x.ended)delete s.passes[data.action];
}
function bonus(s,wheelId,rng){
 const w=s.wheel;if(!w||w.id!==wheelId)fail('round-conflict','Essa roleta já foi encerrada.');
 if(!w.result){const random=rng||(()=>crypto.getRandomValues(new Uint32Array(1))[0]/2**32);let v=random(),i=0;const weights=[.34,.34,.20,.10,.02],multipliers=[1,2,3,5,10];while(i<4&&v>=weights[i])v-=weights[i++];const multiplier=multipliers[i],matches=w.pockets.flatMap((m,j)=>m===multiplier?[j]:[]),index=matches[Math.min(matches.length-1,Math.floor(random()*matches.length))],winUnits=w.baseUnits*multiplier;w.result={index,multiplier,winUnits,extraUnits:winUnits-w.baseUnits};return w.result.extraUnits;}
 return 0;
}
module.exports={TONY,TONY_CHANCE,theftUnits,tonySpin,resourceSpin,PRICE,METER_SPINS,TICKET,ATTRACTIONS,POCKETS,fresh,publicState,placeTickets,scatterTickets,spin,entry,payment,settle,bonus};
