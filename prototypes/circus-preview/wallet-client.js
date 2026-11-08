const watchers=new Set();let pending=Promise.resolve(),state,readyResolve;
const Cloud=window.KingRicoCloud={enabled:true,slotVersion:3,uid:'park-preview',player:null,ready:new Promise(r=>readyResolve=r),
 watch(fn){watchers.add(fn);if(this.player)fn(this.player);return()=>watchers.delete(fn);},
 track(){},dayKey(){return Number(new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date()).replaceAll('-',''));},
 error(error){toast(error?.message||'Não foi possível confirmar. Tente novamente.');}};
function accept(r){Cloud.player=r.player;state=r.park;window.KingRicoPark.state=state;watchers.forEach(fn=>fn(r.player));window.dispatchEvent(new CustomEvent('park-update',{detail:r}));return r;}
const pendingKey='kingRico.parkPreview.pending';
async function raw(data){
 if(data.action!=='state')sessionStorage.setItem(pendingKey,JSON.stringify(data));
 const r=await fetch('/api/play',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await r.json();
 if(data.action!=='state')sessionStorage.removeItem(pendingKey);
 if(!r.ok)throw Error(result.error);
 // Persisted credit is independent of presentation. Hold its visual update until collection.
 if(data.action==='wheel'){Cloud.player=result.player;state=result.park;return result;}
 return accept(result);
}
async function request(data){
 const saved=JSON.parse(sessionStorage.getItem(pendingKey)||'null');
 if(saved&&saved.requestId!==data.requestId){await raw(saved);if(data.action!=='state')throw Error('Sua jogada anterior foi recuperada. Tente novamente.');}
 return raw(data);
}
function call(data){const op=pending.then(()=>request(data));pending=op.catch(()=>{});return op;}
const id=()=>crypto.randomUUID();
Cloud.spin=async(game,bet,selected)=>{const before=state?.spins||0,fc=window.__fc,actual=!!fc?._cloudRequest;const response=await call({action:'spin',requestId:id(),game,bet,...(selected===undefined?{}:{selected})});if(game==='circus')fc?._parkChargeConfirmed?.(before,response,actual);return response;};
Cloud.settings=settings=>call({action:'settings',requestId:id(),settings});
Cloud.recharge=source=>call({action:'recharge',requestId:id(),...(source==='home'?{source:'home'}:{})});
Cloud.bonus=()=>call({action:'bonus',requestId:id()});
Cloud.clown=(bet,roundId,used,selected)=>play({action:'clown',game:'clown',bet:25,roundId,used,selected,requestId:used===0?roundId:id()});
Cloud.penalty=(move,bet,roundId,step,quality=0)=>play({action:'penalty',game:'penalty',bet:25,move,roundId,step,quality,requestId:step===0&&move==='shoot'?roundId:id()});
Cloud.fingo=(move,bet,roundId,used,selected)=>play({action:'fingo',game:'fingo',bet:25,move,roundId,used,...(move==='drop'?{selected}:{}),requestId:id()});
Cloud.flying=(move,bet,roundId,step,selected=-1)=>play({action:'flying',game:'flying',bet:25,move,roundId,step,selected,requestId:step===0&&move==='pop'?roundId:id()});
async function play(data){if(!state.passes[data.game]&&!Cloud.player[data.game+'Round']){if(!await entry(data.game))throw Object.assign(Error('Escolha a entrada antes de jogar.'),{code:'king-rico/entry-required'});}return call(data);}

Cloud.bounce=(move,bet,roundId,n,gold=false)=>play({action:'bounce',game:'bounce',move,bet:25,roundId,n,gold,requestId:move==='start'?roundId:id()});
