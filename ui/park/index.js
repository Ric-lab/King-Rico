import layout from '../../games/fingo/layout.cjs';
import {installMotion,confetti} from './motion.js';
import {enterWheel} from './wheel-transition.js';
import {applyMultiplier,flyMultipliedPrize} from './wheel-award.js';
const Cloud=window.KingRicoCloud,id=()=>crypto.randomUUID();
const empty=()=>({version:1,revision:0,tickets:0,spins:0,wheel:null,passes:{},price:25,meterSpins:10});
let state=Cloud.park||empty();
function sync(){state={...(Cloud.park||empty()),passes:{...(Cloud.park?.passes||{})}};for(const [game,pass]of Object.entries(state.passes))if(pass.started&&!Cloud.player?.[game+'Round'])delete state.passes[game];window.dispatchEvent(new CustomEvent('park-update',{detail:{player:Cloud.player,park:state}}));}
Cloud.watch(sync);
async function call(data){let r;if(data.action==='entry')r=await Cloud.parkEntry(data.game,data.method);else if(data.action==='wheel')r=await Cloud.parkBonus(data.wheelId);else if(data.action==='wheel-close'){try{r=await Cloud.parkBonusClose(data.wheelId);}catch(e){if(e.code==='king-rico/recovered'&&!Cloud.park.wheel)r={player:Cloud.player,park:Cloud.park};else throw e;}}else throw Error('Ação indisponível.');sync();return r;}
const nativeSpin=Cloud.spin;
Cloud.spin=async(...args)=>{const before=state.spins,actual=!!window.__fc?._cloudRequest;const r=await nativeSpin(...args);sync();if(args[0]==='circus'){r.ticket=r.outcome.ticketAward===3;window.__fc?._parkChargeConfirmed?.(before,r,actual);}return r;};
const game=document.querySelector('meta[name="king-rico-game"]')?.content;
Cloud.parkMode=['clown','penalty','flying','fingo'].includes(game);
for(const [name,betIndex]of [['clown',0],['penalty',1],['flying',1],['fingo',1]]){const native=Cloud[name];Cloud[name]=async(...args)=>{let round=Cloud.player?.[name+'Round'];if(!round&&!state.passes[name]){if(!await entry(name))throw Object.assign(Error('Escolha uma entrada.'),{code:'king-rico/round-conflict'});round=Cloud.player?.[name+'Round'];}args[betIndex]=round?round.betUnits/100:25;const r=await native(...args);sync();return r;};}
function toast(text){let e=document.querySelector('.park-toast');if(!e){e=document.createElement('div');e.className='park-toast';e.setAttribute('role','status');document.body.append(e);}e.textContent=text;e.hidden=false;clearTimeout(e._timer);e._timer=setTimeout(()=>e.hidden=true,4000);}
export const format=n=>Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
const names={clown:'Fortune Clown',penalty:'Fortune Pênalti',flying:'Flying Clown',fingo:'Fingo rápido'};
const images={clown:'clown',penalty:'penalty',flying:'flying'};
const ticket='<span class="park-ticket" aria-hidden="true"><span>★</span></span>';
function modal(html,label){const el=document.createElement('div');el.className='park-modal';el.innerHTML=`<section class="park-panel" role="dialog" aria-modal="true" aria-label="${label}">${html}</section>`;const prev=document.activeElement;document.body.append(el);el.addEventListener('keydown',ev=>{if(ev.key==='Tab'){const all=[...el.querySelectorAll('button:not(:disabled),a[href]')];const a=all[0],z=all.at(-1);if(ev.shiftKey&&document.activeElement===a){ev.preventDefault();z.focus();}else if(!ev.shiftKey&&document.activeElement===z){ev.preventDefault();a.focus();}}});el.close=()=>{el.remove();prev?.focus();};el.querySelector('button:not(:disabled)')?.focus();return el;}
let entryPromise;
function entry(game){if(entryPromise)return entryPromise;
 entryPromise=new Promise(resolve=>{
 const pic=game==='fingo'?'<img src="/assets/brand/cover-fingo-plinko.webp" alt="">':`<img src="/assets/brand/covers/${images[game]}.webp" alt="">`;
 const el=modal(`<a class="park-close" href="/home#parque" aria-label="Voltar ao parque">×</a><div class="park-entry-art">${pic}</div><p class="park-eyebrow">UMA PARTIDA NO PARQUE</p><h2>${names[game]}</h2><p>Escolha como jogar</p><button class="park-action" data-ticket ${state.tickets<1?'disabled':''}>${ticket}<span>USAR 1 INGRESSO<small>Você tem ${state.tickets}</small></span></button><button class="park-action park-action-blue" data-coins ${Cloud.player.balance<state.price?'disabled':''}><img src="/assets/symbols/sym-coin.webp" alt=""><span>JOGAR POR ${state.price} MOEDAS</span></button><p class="park-footnote">A entrada já inclui a partida inteira.</p>`,names[game]);
 const choose=async method=>{el.querySelectorAll('button').forEach(b=>b.disabled=true);try{await call({action:'entry',game,method,requestId:id()});el.close();resolve(method);}catch(e){el.close();Cloud.error(e);resolve(null);}};
 el.querySelector('[data-ticket]').onclick=()=>choose('ticket');el.querySelector('[data-coins]').onclick=()=>choose('coins');
 }).finally(()=>entryPromise=null);return entryPromise;
}
window.KingRicoPark={Cloud,layout,get state(){return state;},set state(v){state=v;},call,entry,toast,format,ticket,modal};

function boot(){

 if(document.querySelector('meta[name="king-rico-game"]')?.content==='circus')bootCircus();
 const game=document.querySelector('meta[name="king-rico-game"]')?.content;
 if(['clown','penalty','flying','fingo'].includes(game))Cloud.ready.then(async()=>{
  // The loading screen captures clicks while art is decoding. Show the entry
  // only after that screen leaves, so the first choice always reaches its button.
  if(document.getElementById('kr-boot-screen'))await new Promise(resolve=>{
   const observer=new MutationObserver(()=>{if(!document.getElementById('kr-boot-screen')){observer.disconnect();resolve();}});
   observer.observe(document.body,{childList:true});
  });
  if(!state.passes[game]&&!Cloud.player[game+'Round'])entry(game);
 });
 document.addEventListener('click',e=>{const a=e.target.closest('.kr-hud-home');if(a){e.preventDefault();e.stopImmediatePropagation();location.href='/home#parque';}},true);
 if(['clown','penalty','flying','fingo'].includes(game)){
  const note=document.createElement('a');note.className='park-attraction-tag';note.href='/home#parque';note.textContent='‹ PARQUE · ENTRADA INCLUÍDA';document.body.append(note);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
let displayState,wheelOpen=false;
function bootCircus(){
 const timer=setInterval(()=>{
 const fc=window.__fc;if(!fc||!Cloud.player||!state)return;
 if(!fc._parkHook){
  fc._parkHook=true;fc.setState({homeOpen:false});
  const stage=fc.lightsRef.current.parentElement;
  const backdrop=[...document.querySelectorAll('div')].find(e=>e.style.backgroundImage.includes('stage-bleed-v5-lossless.webp'));
  if(backdrop){backdrop.classList.add('park-circus-backdrop');const scene=backdrop.parentElement;scene.classList.add('park-circus-scene');[...scene.children].find(e=>e.style.filter.includes('blur(34px)'))?.classList.add('park-circus-ambient');fc.lightsBleedRef?.current?.classList.add('park-circus-bleed-lights');}
  fc._parkPrizeTarget=[...stage.querySelectorAll('span')].find(n=>n.parentElement.style.top==='180px'&&n.parentElement.style.left==='165.333px')?.parentElement;fc._parkPrizeTarget?.setAttribute('data-park-prize','');
  const rails=document.createElement('div');rails.className='park-circus-rails';rails.innerHTML=`<div class="park-meter park-meter-left" role="progressbar" aria-label="Progresso da roleta" aria-valuemin="0" aria-valuemax="10"><div class="park-meter-track"><div class="park-meter-fill"><i class="park-liquid-cap"></i><svg class="park-liquid-surface" viewBox="0 0 10 9" preserveAspectRatio="none" aria-hidden="true"><path d="M0 4Q2 1 5 4T10 4V9H0Z"/><path class="park-surface-glint" d="M1 4Q3 2 5 4T9 4"/></svg><i class="park-liquid-bubble"></i><i class="park-liquid-bubble"></i></div><i class="park-liquid-stream"></i><i class="park-liquid-drop"></i><i class="park-liquid-drop"></i><i class="park-liquid-drop"></i></div></div><div class="park-meter park-meter-right" aria-hidden="true"><div class="park-meter-track"><div class="park-meter-fill"><i class="park-liquid-cap"></i><svg class="park-liquid-surface" viewBox="0 0 10 9" preserveAspectRatio="none" aria-hidden="true"><path d="M0 4Q2 1 5 4T10 4V9H0Z"/><path class="park-surface-glint" d="M1 4Q3 2 5 4T9 4"/></svg><i class="park-liquid-bubble"></i><i class="park-liquid-bubble"></i></div><i class="park-liquid-stream"></i><i class="park-liquid-drop"></i><i class="park-liquid-drop"></i><i class="park-liquid-drop"></i></div></div><div class="park-meter-dimmer" aria-hidden="true"></div><a class="park-pocket" href="/home#parque" aria-label="Ingressos do parque"><img class="park-ticket-wallet-art" src="/ui/park/ticket-wallet.svg" alt=""><span class="park-ticket-wallet-label">INGRESSOS</span><b data-tickets>0</b></a>`;stage.append(rails);
  const miniGradient=Array.from({length:13},(_,i)=>(i===0?'#2fa83a':i%2?'#e0321f':'#fbefd8')+' '+i*360/13+'deg '+(i+1)*360/13+'deg').join(',');
  rails.querySelectorAll('.park-meter').forEach(tube=>{const goal=document.createElement('span');goal.className='park-meter-goal';goal.setAttribute('role','img');goal.setAttribute('aria-label','Barra cheia libera a roleta multiplicadora');goal.innerHTML=`<i class="park-goal-disk" style="background:conic-gradient(from -13.846deg,${miniGradient})"></i><i class="park-goal-rim"></i><b>×</b><i class="park-goal-pointer"></i>`;tube.append(goal);});
  const originalVals=fc.renderVals.bind(fc);
  fc.renderVals=(...args)=>{const vals=originalVals(...args);if(fc._parkWheelVisible)vals.winAnim='none';rails.style.setProperty('--park-light-y',vals.frameOff);rails.style.setProperty('--park-light-transition',vals.frameOffT);rails.style.setProperty('--park-basket-top',(84-(fc.state.hudD||0))+'px');return vals;};
  fc.renderVals();
  installMotion(fc,rails,{refresh:renderRails,showWheel});
  const original=fc.spin;fc.spin=()=>{if(state.wheel&&!fc.cloudBusy()&&!fc.state.showWin){showWheel();return;}original();};
  // Native save keeps sound, vibration and stake preferences in the shared account.
 }
 if(state.wheel?.prizeVersion===3&&fc.state.showWin&&!wheelOpen){
  fc._parkDismissAt ||= performance.now()+1500;
  if(performance.now()>=fc._parkDismissAt){fc._spinAfterFly=false;fc.dismissWin();fc._parkDismissAt=0;}
 }
 if(!fc.state.spinning&&!fc.state.queued){displayState=state;if(!fc._parkMeterBusy)fc._parkMeterLevel=state.spins;renderRails();}
 if(fc.cloudBusy()||fc.state.showWin||fc.state.homeOpen)return;

 if(state.wheel){fc.setState({auto:false});showWheel();}
 },160);
 window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
}
function renderRails(){const el=document.querySelector('.park-circus-rails');if(!el||!displayState)return;
 const fc=window.__fc;if(!fc?._parkMeterBusy){const level=fc?._parkMeterLevel??displayState.spins;el.style.setProperty('--park-fill',Math.min(100,level/displayState.meterSpins*100)+'%');el.querySelectorAll('.park-meter').forEach(t=>t.classList.toggle('is-empty',level===0));}
 el.querySelector('[role=progressbar]').setAttribute('aria-valuenow',displayState.spins);
 el.querySelector('[role=progressbar]').setAttribute('aria-valuetext',`${displayState.spins} de ${displayState.meterSpins} giros`);
 const tickets=fc?._parkVisibleTickets??displayState.tickets;const count=format(tickets);el.querySelector('[data-tickets]').textContent=count;
 el.style.setProperty('--park-ticket-font',count.length>7?'17px':count.length>5?'21px':'27px');
 el.querySelector('.park-pocket').setAttribute('aria-label',`Parque: ${tickets} ingressos`);
 el.classList.toggle('is-ready',!!displayState.wheel);
}
function showWheel(){
 if(wheelOpen||!state.wheel)return;if(window.__fc?._parkMeterBusy||window.__fc?._parkFillCelebrating){window.__fc._parkWheelWaiting=true;return;}wheelOpen=true;const wheelId=state.wheel.id;
 const fc=window.__fc;if(fc){fc._parkWheelVisible=true;fc.setState({balance:Cloud.player.balance,balPending:(state.wheel.result?.winUnits||state.wheel.baseUnits)/100,auto:false});}
 const values=state.wheel.pockets||[1,2,3,5,10],n=values.length,seg=360/n;
 const colors=values.map((_,i)=>i===0?'#2fa83a':i%2?'#e0321f':'#fbefd8');
 const gradient=colors.map((c,i)=>`${c} ${i*seg}deg ${(i+1)*seg}deg`).join(',');
 const el=modal(`<div class="park-wheel-heading"><img src="/ui/park/wheel-marquee.svg" alt=""><h2>Roleta bônus</h2></div><div class="park-wheel-wrap"><div class="park-wheel-machine"><div class="park-wheel-rays"></div><div class="park-wheel-rim"></div>${Array.from({length:24},(_,i)=>`<i class="park-wheel-bulb" style="--bulb-angle:${i*15}deg;--bulb-delay:${-i*.08}s"></i>`).join('')}<div class="park-wheel" style="background:conic-gradient(from ${-seg/2}deg,${gradient})">${values.map((v,i)=>`<span style="--a:${i*seg}deg;--half:${seg/2}deg;--pocket-ink:${i===0||i%2?'#fff3c4':'#6c2922'}"><b>×${v}</b></span>`).join('')}</div><div class="park-wheel-hub"><span>MULTIPLIQUE</span><strong aria-live="polite">×?</strong></div><div class="park-wheel-hub-ring"></div><div class="park-wheel-pointer"></div></div></div><button class="park-action" data-wheel-spin>GIRAR ROLETA</button>`, 'Roleta multiplicadora');
 el.classList.add('park-wheel-modal');el.querySelector('.park-panel').classList.add('park-wheel-panel');
 const entrance=enterWheel(el);
 const btn=el.querySelector('[data-wheel-spin]'),rotor=el.querySelector('.park-wheel');let busy=false;
 async function finish(w){
  el.querySelector('.park-wheel-machine').classList.add('is-spinning');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduced){const anim=rotor.animate([{transform:'rotate(0deg)'},{transform:`rotate(${2160-w.result.index*seg}deg)`}],{duration:4200,easing:'cubic-bezier(.12,.75,.15,1)',fill:'forwards'});await Promise.race([anim.finished.catch(()=>{}),new Promise(r=>setTimeout(r,4600))]);}
  else rotor.style.transform=`rotate(${-w.result.index*seg}deg)`;
  el.querySelector('.park-wheel-machine').classList.remove('is-spinning');
  const winner=rotor.children[w.result.index];winner?.classList.add('is-winning');
  const highlight=document.createElement('i');highlight.className='park-wheel-winner';highlight.style.background=`conic-gradient(from ${(w.result.index-.5)*seg}deg,#fff2a0aa 0deg,#ffc54a88 ${seg}deg,transparent ${seg}deg)`;rotor.append(highlight);
  el.querySelector('.park-wheel-machine').classList.add('is-won');confetti(el.querySelector('.park-wheel-wrap'),[{x:145,y:130}],{count:20,spread:130});
  el.querySelector('.park-wheel-hub strong').textContent='×'+w.result.multiplier;
  btn.textContent='APLICAR ×'+w.result.multiplier;btn.disabled=false;
  btn.onclick=async()=>{if(busy)return;busy=true;btn.disabled=true;try{
   const fc=window.__fc,flight=fc?._parkPrizeFlight;
   if(fc){fc._parkCollecting=true;clearInterval(fc.counter);fc.setState({balance:Cloud.player.balance,balPending:w.result.winUnits/100,showWin:false,barWin:w.baseUnits/100,displayWin:w.baseUnits/100,auto:false});}
   await call({action:'wheel-close',wheelId,requestId:id()});
   const source=el.querySelector('.park-wheel-hub strong').getBoundingClientRect();el.close();
   if(fc){fc._parkPrizeFlight=null;fc._spinAfterFly=false;
    await applyMultiplier(fc,w,source);
    flyMultipliedPrize(fc,w,flight,()=>Cloud.player);
   }
   wheelOpen=false;
  }catch(e){Cloud.error(e);if(window.__fc)window.__fc._parkCollecting=false;btn.disabled=false;busy=false;}};
 }
 btn.onclick=async()=>{if(busy)return;busy=true;btn.disabled=true;btn.textContent='GIRANDO…';try{const r=await call({action:'wheel',wheelId,requestId:id()});busy=false;await finish(r.wheel);}catch(e){Cloud.error(e);btn.disabled=false;btn.textContent='TENTAR NOVAMENTE';busy=false;}};
 btn.disabled=true;
 entrance.finally(()=>{if(state.wheel?.result)finish(state.wheel);else btn.disabled=false;});
}
