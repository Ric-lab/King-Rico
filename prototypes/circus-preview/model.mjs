import {randomUUID} from 'node:crypto';
import {Timestamp} from 'firebase/firestore';
import {createGameStore,publicPlayer} from '../../cloud/store.mjs';
import engine from '../../cloud/engine.cjs';
import parkRules from '../../cloud/park.cjs';
import paths from '../../games/fingo/paths.json' with {type:'json'};

export const PRICE=25, METER_SPINS=10;
export const WHEEL_POCKETS=[10,1,2,1,3,2,1,5,2,1,3,2,1];
export const ATTRACTIONS=['clown','penalty','flying','fingo'];
const fail=message=>{throw new Error(message);};
const fresh=()=>({tickets:3,spins:0,bankUnits:0,wheel:null,passes:{},fingo:null});
export function createPreview(saved={},rng=Math.random,clock=Date.now){
 const records=new Map(saved.records||[]),park=saved.park||fresh();
 const ref='players/preview';
 const deps={reference:p=>p.join('/'),stamp:()=>Timestamp.fromMillis(clock()),now:clock,rng,read:async p=>snap(p),
  transact:async fn=>{const writes=new Map();const result=await fn({get:async p=>snap(p),set:(p,v)=>writes.set(p,v)});for(const [p,v]of writes)records.set(p,v);return result;}};
 function snap(path){const value=structuredClone(records.get(path));if(value&&path===ref)for(const k of ['createdAt','updatedAt','lastSpinAt','firstSpinAt'])if(value[k])value[k]=new Timestamp(value[k].seconds,value[k].nanoseconds);return {exists:()=>records.has(path),data:()=>value};}
 const call=createGameStore(null,'preview',deps);
 function player(){return publicPlayer(records.get(ref));}
 function state(){return {...structuredClone(park),price:PRICE,meterSpins:METER_SPINS};}
 function envelope(extra={}){return {...extra,player:player(),park:state()};}
 function exportState(){return {records:[...records],park};}
 const once=new Map(saved.once||[]);
 async function run(data){
  if(!records.has(ref)){await call({action:'bootstrap',requestId:randomUUID()});const p=records.get(ref);p.balanceUnits=500000;p.settings={...p.settings,clownBetIdx:4,penaltyBetIdx:4,flyingBetIdx:4,fingoBetIdx:4};}
  const current=records.get(ref);current.settings.fingoBetIdx=4;
  // A paid round from the first prototype becomes one prepaid original-style round.
  if(['state','fingo'].includes(data.action)&&park.fingo&&!park.fingo.done&&!current.fingoRound&&park.passes.fingo?.started){park.passes.fingo.prepaid=true;park.fingo=null;}
  if(data.action==='state')return envelope();
  if(!/^[\da-f-]{36}$/i.test(data.requestId||''))fail('Pedido inválido.');
  const fingerprint=JSON.stringify({...data,requestId:undefined});
  if(once.has(data.requestId)){const old=once.get(data.requestId);if(old.fingerprint!==fingerprint)fail('Pedido já utilizado.');return envelope({...old.result,replayed:true});}
  const p=records.get(ref);let result;
  if(data.action==='entry'){
   if(!ATTRACTIONS.includes(data.game))fail('Atração indisponível.');
   if(park.passes[data.game])return envelope();
   if(data.method==='ticket'){if(park.tickets<1)fail('Você não tem ingressos.');}
   else if(data.method!=='coins'||p.balanceUnits<PRICE*100)fail('Moedas insuficientes.');
   // Authorization only. The first actual play consumes the ticket/coins atomically.
   park.passes[data.game]={method:data.method,started:false};result={};
  }else if(data.action==='spin'&&data.game==='circus'){
   if(!engine.BETS.includes(data.bet))fail('Aposta inválida.');
   if(park.wheel)fail('Gire a roleta que está pronta antes de continuar.');
   const cost=engine.units(data.bet),before=p.balanceUnits;if(before<cost)fail('Moedas insuficientes.');
   const filling=park.spins+1>=METER_SPINS;
   let outcome=engine.slot(data.bet,p.peaches,rng,p.peachBank);
   if(filling){
    let attempts=0;
    while((outcome.res.win<=0||outcome.feature)&&attempts++<128)outcome=engine.slot(data.bet,p.peaches,rng,p.peachBank);
    if(outcome.res.win<=0||outcome.feature){
     const grid=[1,1,1,0,3,6,7,8,5],res=engine.evaluate(grid,data.bet);
     outcome={grid,res,feature:null,peaches:p.peaches,peachBank:p.peachBank||{count:p.peaches,units:0},winUnits:engine.units(res.win)};
    }
   }
   let ticket=false;
   if(!filling&&!outcome.res.peach.length&&!outcome.feature&&rng()<.14){
    ticket=true;parkRules.placeTickets(outcome,data.bet,rng);park.tickets+=3;
   }
   p.balanceUnits=before-cost+outcome.winUnits;p.peaches=outcome.peaches;p.peachBank=outcome.peachBank;
   p.settings.slotBetIdx=engine.BETS.indexOf(data.bet);p.revision++;
   park.spins++;park.bankUnits=0;
   if(filling){park.bankUnits=engine.units(outcome.res.win);park.wheel={id:randomUUID(),roundId:data.requestId,prizeVersion:3,baseUnits:park.bankUnits,pockets:[...WHEEL_POCKETS],result:null};}
   result={game:'circus',bet:data.bet,balanceBefore:before/100,balanceDebited:(before-cost)/100,
    baseBalance:(before-cost+engine.units(outcome.res.win))/100,outcome,ticket};
  }else if(data.action==='wheel'){
   if(!park.wheel||data.wheelId!==park.wheel.id)fail('Essa roleta já foi encerrada.');
   if(!park.wheel.result){const multipliers=[1,2,3,5,10],weights=[.34,.34,.20,.10,.02];let v=rng(),i=0;while(i<4&&v>=weights[i])v-=weights[i++];
    const multiplier=multipliers[i],pockets=park.wheel.pockets;
    const matches=pockets?.flatMap((m,j)=>m===multiplier?[j]:[])||[i];
    const index=matches[Math.min(matches.length-1,Math.floor(rng()*matches.length))];
    const winUnits=park.wheel.baseUnits*multiplier,extraUnits=park.wheel.prizeVersion===3?winUnits-park.wheel.baseUnits:winUnits;
    park.wheel.result={index,multiplier,winUnits,extraUnits};
    p.balanceUnits+=extraUnits;p.revision++;}
   result={wheel:structuredClone(park.wheel)};
  }else if(data.action==='wheel-close'){
   if(!park.wheel?.result||park.wheel.id!==data.wheelId)fail('Conclua a roleta primeiro.');
   park.wheel=null;park.spins=0;park.bankUnits=0;result={};
  }else if(data.action==='fingo-play'){
   const pass=park.passes.fingo;
   if(!pass)fail('Escolha como entrar na atração.');
   if(park.fingo?.done)fail('Essa partida já terminou.');
   const col=data.selected;if(!Number.isInteger(col)||col<0||col>4)fail('Escolha uma entrada.');
   if(!park.fingo){charge('fingo');park.fingo={id:randomUUID(),used:0,marks:[],targets:[7,19,34,52,68],slots:[7,19,34,52,68],done:false};}
   const round=park.fingo;
   if(data.used!==round.used)fail('Sua jogada já foi atualizada.');
   const trace=paths[col][Math.floor(rng()*paths[col].length)],bin=trace.bin,number=round.slots[bin];
   if(round.targets.includes(number)&&!round.marks.includes(number))round.marks.push(number);
   round.used++;round.done=round.marks.length===5||round.used===10;
   const winUnits=round.marks.length===5?PRICE*200:0;
   if(round.done){p.balanceUnits+=winUnits;p.revision++;delete park.passes.fingo;}
   else{
    const needed=round.targets.filter(n=>!round.marks.includes(n));round.slots=Array.from({length:5},()=>1+Math.floor(rng()*75));
    const offset=Math.floor(rng()*5);needed.forEach((n,i)=>round.slots[(offset+i)%5]=n);
   }
   result={outcome:{...structuredClone(round),bin,number,winUnits,trace}};
  }else if(data.action==='fingo-close'){
   if(!park.fingo?.done)fail('A partida ainda está em andamento.');park.fingo=null;result={};
  }else if(['clown','penalty','flying','fingo'].includes(data.action)){
   const game=data.action,round=p[game+'Round'],first=!round;
   const pass=park.passes[game];if(first&&!pass)fail('Escolha como entrar na atração.');
   if(data.bet!==PRICE)fail('Esta atração usa a entrada fixa do parque.');
   const before=p.balanceUnits,oldPark=structuredClone(park),oldRecords=structuredClone([...records]);
   try{
    if(first&&pass.prepaid){p.balanceUnits+=PRICE*100;delete pass.prepaid;}
    else if(first&&pass.method==='ticket'){if(park.tickets<1)fail('Você não tem ingressos.');park.tickets--;p.balanceUnits+=PRICE*100;}
    result=await call(data);
    if(first){park.passes[game].started=true;park.passes[game].roundId=data.roundId;result.balanceBefore=before/100;}
    if(game==='fingo'&&data.move==='drop'&&result.outcome.used>=10&&!result.outcome.ended){result.outcome.ended=true;records.get(ref).fingoRound=null;}
    if(result.outcome.ended)delete park.passes[game];
   }catch(e){Object.assign(park,oldPark);records.clear();for(const [k,v]of oldRecords)records.set(k,v);throw e;}
  }else if(data.action==='settings'){
   const settings={...data.settings};for(const k of ['clownBetIdx','penaltyBetIdx','flyingBetIdx','fingoBetIdx'])if(k in settings)settings[k]=4;
   result=await call({...data,settings});
  }else if(['recharge','bonus'].includes(data.action))result=await call(data);
  else fail('Ação indisponível nesta prévia.');
  const out=envelope(result);once.set(data.requestId,{fingerprint,result:structuredClone(result)});return out;
 }
 function charge(game){const pass=park.passes[game],p=records.get(ref);if(pass.started)return;
  if(pass.method==='ticket'){if(park.tickets<1)fail('Você não tem ingressos.');park.tickets--;}
  else {if(p.balanceUnits<PRICE*100)fail('Moedas insuficientes.');p.balanceUnits-=PRICE*100;}
  pass.started=true;p.revision++;
 }
 async function atomic(data){
  const backup=structuredClone(exportState());
  try{return await run(data);}catch(e){
   records.clear();for(const [k,v]of backup.records)records.set(k,v);
   for(const k of Object.keys(park))delete park[k];Object.assign(park,backup.park);throw e;
  }
 }
 return {run:atomic,state,exportState:()=>({...exportState(),once:[...once]})};
}
