'use strict';
const engine=require('./engine.cjs');
const PRICE=25,METER_SPINS=10,TICKET=10;
const ATTRACTIONS=['clown','penalty','flying','fingo'];
const POCKETS=[10,1,2,1,3,2,1,5,2,1,3,2,1];
const fresh=()=>({version:1,revision:0,lastOperationId:null,tickets:0,spins:0,wheel:null,passes:{}});
const publicState=s=>({...structuredClone(s||fresh()),price:PRICE,meterSpins:METER_SPINS});
const fail=(code,message)=>{throw Object.assign(new Error(message),{code:'king-rico/'+code});};
function spin(p,s,bet,id,rng){
 if(s.wheel)fail('round-conflict','Conclua a roleta bônus antes de girar novamente.');
 const random=rng||(()=>crypto.getRandomValues(new Uint32Array(1))[0]/2**32),filling=s.spins===9;
 let x=engine.slot(bet,p.peaches,random,p.peachBank);
 if(filling){let attempts=0;while((x.res.win<=0||x.feature)&&attempts++<128)x=engine.slot(bet,p.peaches,random,p.peachBank);
  if(x.res.win<=0||x.feature){const grid=[1,1,1,0,3,6,7,8,5],res=engine.evaluate(grid,bet),bank={count:p.peaches,units:p.peachBank?.count===p.peaches?p.peachBank.units:p.peaches*engine.units(bet)};x={grid,res,feature:null,peaches:p.peaches,peachBank:bank,winUnits:engine.units(res.win)};}}
 const award=!filling&&!x.res.peach.length&&!x.feature&&random()<.14?3:0;
 if(award){x.grid.splice(0,3,TICKET,TICKET,TICKET);x.res=engine.evaluate(x.grid.map(n=>n===TICKET?-1:n),bet);x.res.cells=[...new Set([...x.res.cells,0,1,2])];x.winUnits=engine.units(x.res.win);s.tickets+=3;}
 s.spins++;if(filling)s.wheel={id,roundId:id,prizeVersion:3,baseUnits:engine.units(x.res.win),pockets:[...POCKETS],result:null};
 return {...x,parkVersion:1,ticketAward:award};
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
module.exports={PRICE,METER_SPINS,TICKET,ATTRACTIONS,POCKETS,fresh,publicState,spin,entry,payment,settle,bonus};
