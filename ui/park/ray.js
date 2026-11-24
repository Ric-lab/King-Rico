import {releaseVillainHold} from './villain-loss.js';
import {playVillainDie} from './villain-dice.js';
// Choreography of one saved receipt; no debit or lottery in presentation.
const BODY='/assets/ray/body-v1.webp',HEAD='/assets/ray/head-v1.webp';
export function installRay(fc){
 for(const src of [BODY,HEAD]){const i=new Image();i.src=src;i.decode?.().catch(()=>{});}
 const payout=fc.payout.bind(fc),busy=fc.cloudBusy.bind(fc);
 fc.cloudBusy=(...args)=>!!fc._rayPlaying||busy(...args);
 fc.payout=(res,...args)=>{
  const event=fc._cloudSpin?.outcome?.ray;if(!event)return payout(res,...args);
  if(fc._rayPlaying)return;fc._rayPlaying=true;fc._celebHold=true;
  fc.setState({spinning:false,auto:false,winCells:[],winLines:[],barWin:0,balPending:0,winDim:false,hint:'RAY RACCOON!'});
  fc.kingSet('surprise');fc.lightsRest();try{fc.sfxVillain?.('ray');}catch{}
  // Sem cena nem pilha de escudos (dono, 22/11): só a linha da trinca e o modal; o contador sob a tecla se atualiza sozinho.
  const scene=document.createElement('div');scene.className='park-ray-scene';scene.dataset.phase='line';
  scene.innerHTML='<svg class="park-tony-lines" aria-hidden="true"></svg>';document.body.append(scene);
  let ended=false,modal;const timers=[];
  const dieAbort=new AbortController();
  const later=(fn,t)=>timers.push(setTimeout(()=>{if(!ended)fn();},t));
  requestAnimationFrame(()=>{const boxes=res.cells.map(i=>document.querySelector('[data-sym="'+i+'"]')?.getBoundingClientRect()).filter(Boolean);if(boxes.length!==3)return;
   const svg=scene.querySelector('svg');svg.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);
   svg.innerHTML=`<polyline points="${boxes.map(b=>`${b.x+b.width/2},${b.y+b.height/2}`).join(' ')}"/>`+boxes.map(b=>`<ellipse cx="${b.x+b.width/2}" cy="${b.y+b.height/2}" rx="${b.width*.45}" ry="${b.height*.43}"/>`).join('');});
  function result(){scene.dataset.phase='result';modal=window.KingRicoPark.modal(`<img class="park-tony-portrait" src="${HEAD}" alt="Ray Raccoon"><strong class="park-tony-total">−${event.stolen}</strong><button class="park-action park-action-blue">CONTINUAR</button>`,'Ray e os escudos');modal.classList.add('park-tony-result');modal.querySelector('button').onclick=back;}
  function clean(){dieAbort.abort();releaseVillainHold(fc);timers.forEach(clearTimeout);scene.remove();window.removeEventListener('pagehide',hide);}
  function done(){if(ended)return;ended=true;clean();fc._rayPlaying=false;fc._celebHold=false;fc.syncCeleb();fc.kingSet('idle');fc.setState({balance:window.KingRicoCloud.player.balance,hint:'Vamos de novo?'});}
  function back(){if(scene.dataset.phase==='returning')return;scene.dataset.phase='returning';modal?.close();fc._parkVisibleTickets=window.KingRicoPark.state.cedros??0;try{fc._parkRefresh?.();}catch{}later(done,200);
  }
  function hide(){if(ended)return;ended=true;modal?.close();clean();}
  window.addEventListener('pagehide',hide,{once:true});
  // Sem animação de roubo (dono, 22/11): o Ray aparece na slot, a linha marca a trinca e já abre o modal.
  playVillainDie(fc,event,'ray',dieAbort.signal).then(()=>{if(ended)return;releaseVillainHold(fc);later(result,250);});
 }
}
