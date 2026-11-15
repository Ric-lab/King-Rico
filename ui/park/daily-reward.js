// Scratch is presentation only. The saved daily bonus owns the amount and credit.
export function dailyGift(player, dayKey) {
 const key=String(dayKey),today=`${key.slice(0,4)}-${key.slice(4,6)}-${key.slice(6)}`;
 if(!player?.bonus||player.bonus.day===today)return null;
 const gap=player.bonus.day?(Date.parse(today)-Date.parse(player.bonus.day))/86400000:99;
 const index=gap===1?player.bonus.streak%7:0;
 return {today,day:index+1,amount:[50,100,150,200,250,500,1000][index]};
}

// Cosmetic layout only: all three matching amounts represent one daily credit.
export function scratchGrid(random=Math.random) {
 const cells=[true,true,true,false,false,false,false,false,false];
 for(let i=cells.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}
 return cells;
}

// Sons e háptico da raspadinha (mesmo bus/volume do Circus): destravam no 1º toque e funcionam desde a 1ª casa.
let fbAc=null,fbNoise=null;
function fbAudio(){
 try{
  if(!fbAc){const C=window.AudioContext||window.webkitAudioContext;if(C)fbAc=new C();}
  if(fbAc&&!fbNoise){const len=Math.floor(fbAc.sampleRate*1.5),b=fbAc.createBuffer(1,len,fbAc.sampleRate),ch=b.getChannelData(0);let l=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;l=(l+.03*w)/1.03;ch[i]=l*3;}fbNoise=b;}
  return fbAc;
 }catch{return null;}
}
function fbBurst(freq,q,vol,dur,when){
 const ac=fbAudio();if(!ac||ac.state!=='running')return;
 const t=ac.currentTime+(when||0),src=ac.createBufferSource();src.buffer=fbNoise;src.playbackRate.value=.8+Math.random()*.4;
 const bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=freq;bp.Q.value=q;
 const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 src.connect(bp);bp.connect(g);g.connect(ac.destination);src.start(t);src.stop(t+dur+.05);
}
function playSilentBuffer(ac){
 try{const b=ac.createBuffer(1,1,22050),s=ac.createBufferSource();s.buffer=b;s.connect(ac.destination);s.start(0);}catch{}
}
function warmAudio(gesture){
 try{
  const fc=window.__fc;
  if(fc){
   if(!fc.state?.sound)return;
   const ac=fc.ac?.();if(!ac)return;
   fc.out?.();fc.noise?.(ac);
   if(ac.state==='suspended')ac.resume?.().catch(()=>{});
   if(gesture)playSilentBuffer(ac);
   return;
  }
  const ac=fbAudio();if(!ac)return;
  if(ac.state==='suspended')ac.resume?.().catch(()=>{});
  if(gesture)playSilentBuffer(ac);
 }catch{}
}
function withAudio(fn,fb){
 try{
  const fc=window.__fc;
  if(fc){
   if(!fc.state?.sound)return;
   const ac=fc.ac?.();if(!ac)return;
   fc.out?.();fc.noise?.(ac);
   if(ac.state==='running'){fn(fc);return;}
   ac.resume?.().then(()=>{if(fc.state?.sound&&ac.state==='running')fn(fc);}).catch(()=>{});
   return;
  }
  const ac=fbAudio();if(!ac)return;
  if(ac.state==='running'){fb?.();return;}
  ac.resume?.().then(()=>{if(ac.state==='running')fb?.();}).catch(()=>{});
 }catch{}
}
let scratchT=0,hapT=0,scratchQueued=false;
function getIosHap(overlay){
 const fc=window.__fc;
 let el=overlay?.querySelector('.park-daily-hap');
 if(!el&&overlay&&!navigator.vibrate){
  el=document.createElement('label');el.className='park-daily-hap';
  el.innerHTML='<input type="checkbox" switch tabindex="-1" aria-hidden="true">';
  overlay.append(el);
 }
 return el||fc?._iosHap||document.getElementById('fc-ios-hap');
}
function playScratchHaptic(force,overlay){
 const n=performance.now();if(!force&&n-hapT<55)return true;
 try{
  const fc=window.__fc;
  if(fc&&(!fc.state?.vibrate||!(fc.state?.vibLvl>0)))return true;
  const nativeHap=!!window.Capacitor?.PluginHeaders?.some?.(h=>h.name==='FcHaptics');
  if(nativeHap&&fc?.buzz){hapT=n;fc.buzz([22]);return true;}
  if(typeof navigator.vibrate==='function'){
   const ok=navigator.vibrate(fc?.vib?fc.vib([22]):[22]);
   if(ok!==false)hapT=n;
   return ok!==false;
  }
  const ios=getIosHap(overlay);
  if(ios){hapT=n;ios.click();}
  return true;
 }catch{return false;}
}
function playScratchSound(isActive,force){
 const n=performance.now();if(!force&&n-scratchT<55)return;
 const fire=fc=>{fc.burst(1100+Math.random()*700,.9,.38,.09);fc.burst(3200+Math.random()*900,1.4,.16,.06,.02);};
 const fireFb=()=>{fbBurst(1100+Math.random()*700,.9,.38,.09);fbBurst(3200+Math.random()*900,1.4,.16,.06,.02);};
 try{
  const fc=window.__fc;
  if(fc){
   if(!fc.state?.sound)return;
   const ac=fc.ac?.();if(!ac)return;
   fc.out?.();fc.noise?.(ac);
   if(ac.state==='running'){scratchT=n;scratchQueued=false;fire(fc);return;}
   if(!scratchQueued||force){
    scratchQueued=true;
    ac.resume?.().then(()=>{
     if(!scratchQueued)return;
     scratchQueued=false;
     if(isActive()&&fc.state?.sound&&ac.state==='running'){scratchT=performance.now();fire(fc);}
    }).catch(()=>{/* Keep the cue for the next trusted end/click in this gesture. */});
   }
   return;
  }
  const ac=fbAudio();if(!ac)return;
  if(ac.state==='running'){scratchT=n;scratchQueued=false;fireFb();return;}
  if(!scratchQueued||force){
   scratchQueued=true;
   ac.resume?.().then(()=>{
    if(!scratchQueued)return;
    scratchQueued=false;
    if(isActive()&&ac.state==='running'){scratchT=performance.now();fireFb();}
   }).catch(()=>{/* Keep the cue for the next trusted end/click in this gesture. */});
  }
 }catch{}
}
const sfx={
 scratch:(isActive=()=>true,force=false,overlay=null)=>{const haptic=playScratchHaptic(force,overlay);playScratchSound(isActive,force);return haptic;},
 cell:win=>withAudio(fc=>win?(fc.bell(1175,.28,.07),fc.bell(1568,.22,.045,.05)):fc.pluck(392,.05,.14)),
 three:()=>withAudio(fc=>fc.sfxWin(false)),
 prize:()=>withAudio(fc=>[784,988,1319].forEach((f,i)=>fc.bell(f,.5,.08,i*.06))),
 button:()=>withAudio(fc=>fc.sfxClick()),
 coins:()=>withAudio(fc=>{for(let i=0;i<14;i++)fc.bell(1760+i*70,.12,.035,.45+i*.055);})
};

export async function openDailyReward(Cloud) {
 await Cloud.ready;
 if(!Cloud.player||Cloud.dailyRewardActive)return;
 // Wait for the account and illustrated loading screen; never flash cached rewards.
 if(document.getElementById('kr-boot-screen'))await new Promise(resolve=>{
  const observer=new MutationObserver(()=>{if(!document.getElementById('kr-boot-screen')){observer.disconnect();resolve();}});
  observer.observe(document.body,{childList:true});
 });
 const gift=dailyGift(Cloud.player,Cloud.dayKey());if(!gift)return;
 Cloud.dailyRewardActive=true;
 return new Promise(resolve=>{
  const fcPre=window.__fc;
  if(fcPre?.state?.sound){try{const a=fcPre.ac?.();if(a){fcPre.out?.();fcPre.noise?.(a);}}catch{}}
  else fbAudio();
  const acReady=(fcPre?._ac||fbAc)?.state==='running';
  // Sem véu: o 1º toque já raspa (o áudio destrava pelos listeners de captura do overlay). Pedido do dono.
  const needsTap=false;void acReady;
  const overlay=document.createElement('div');overlay.className='park-daily';overlay.dataset.phase='scratch';
  overlay.innerHTML=`<section class="park-daily-panel" tabindex="-1" role="dialog" aria-modal="true" aria-label="Presente do dia" aria-labelledby="daily-title">
   <p class="park-daily-eyebrow">Dia ${gift.day} de 7</p>
   <img class="park-daily-king" src="/assets/symbols/sym-wild-s.webp" alt="">
   <h2 id="daily-title">Presente do dia</h2>
   <p class="park-daily-instruction">Raspe e ganhe!</p>
   <div class="park-daily-reveal-space"><div class="park-daily-grid">${scratchGrid().map((win,i)=>`<div class="park-daily-cell" data-prize="${win}"><div class="park-daily-result" aria-hidden="true">${win?`<img src="/assets/symbols/sym-coin.webp" alt=""><strong>${gift.amount.toLocaleString('pt-BR')}</strong>`:'<span class="park-daily-x">×</span>'}</div><canvas width="180" height="180" aria-label="Raspe a casa ${i+1}"></canvas></div>`).join('')}</div>${needsTap?'<button type="button" class="park-daily-unlock" aria-label="Toque para liberar a raspadinha"></button>':''}<div class="park-daily-summary" hidden><img src="/assets/symbols/sym-coin.webp" alt=""><strong>+${gift.amount.toLocaleString('pt-BR')}</strong><span>moedas</span></div></div>
   <p class="park-daily-status" role="status" aria-live="polite">0 de 3 prêmios encontrados</p>
   <button type="button" class="park-daily-button">REVELAR</button>
  </section>`;
  const previous=document.activeElement,overflow=document.body.style.overflow;
  const background=[...document.body.children].filter(e=>!e.matches('script,style,#fc-ios-hap'));
  const inert=background.map(e=>[e,e.inert]);inert.forEach(([e])=>e.inert=true);
  document.body.append(overlay);document.body.style.overflow='hidden';
  const panel=overlay.querySelector('.park-daily-panel'),button=overlay.querySelector('.park-daily-button'),unlockVeil=overlay.querySelector('.park-daily-unlock'),grid=overlay.querySelector('.park-daily-grid'),status=overlay.querySelector('[role=status]'),instruction=overlay.querySelector('.park-daily-instruction');
  let missedScratch=null,missedHaptic=false;
  const unlock=e=>{
   warmAudio(true);
   if(!e||!['touchend','click','pointerup'].includes(e.type))return;
   // Vibration can be blocked independently of audio on the first mobile gesture.
   if(missedHaptic)missedHaptic=playScratchHaptic(true,overlay)===false;
   if(missedScratch!==null){
    if(scratchT===missedScratch)playScratchSound(()=>!finished&&!revealed,true);
    // A resume attempt may still be blocked. Keep the cue for touchend/click.
    if(scratchT!==missedScratch)missedScratch=null;
   }
  };
  overlay.addEventListener('pointerup',unlock,{capture:true,passive:true});
  overlay.addEventListener('pointerdown',unlock,{capture:true,passive:true});
  overlay.addEventListener('touchstart',unlock,{capture:true,passive:true});
  overlay.addEventListener('touchend',unlock,{capture:true,passive:true});
  overlay.addEventListener('click',unlock,{capture:true,passive:true});
  if(unlockVeil){
   let endT=0;
   const finishUnlock=()=>{
    clearTimeout(endT);
    if(!unlockVeil.isConnected||unlockVeil.dataset.done)return;
    unlockVeil.dataset.done='1';unlockVeil.style.pointerEvents='none';
    warmAudio(true);hapT=0;scratchT=0;
    unlockVeil.classList.add('is-clear');
    setTimeout(()=>unlockVeil.remove(),160);
   };
   unlockVeil.onpointerdown=()=>{unlockVeil.classList.add('is-pressing');warmAudio(true);};
   unlockVeil.onpointerup=unlockVeil.onpointercancel=()=>{unlockVeil.classList.remove('is-pressing');};
   unlockVeil.onclick=finishUnlock;
   unlockVeil.ontouchend=()=>{clearTimeout(endT);endT=setTimeout(()=>{const ac=(window.__fc?._ac||fbAc);if(navigator.userActivation?.hasBeenActive||ac?.state==='running')finishUnlock();},35);};
  }
  let revealed=false,busy=false,finished=false,last=null,unwatch=()=>{};
  const cells=[...overlay.querySelectorAll('.park-daily-cell')];
  function close(){
   if(finished)return;finished=true;unwatch();document.removeEventListener('keydown',trap);
   const rect=overlay.querySelector('.park-daily-summary').getBoundingClientRect();overlay.remove();Cloud.dailyRewardActive=false;
   document.body.style.overflow=overflow;inert.forEach(([e,v])=>e.inert=v);
   // Release every wallet presentation from its hold. Credit has already been saved;
   // the shared flight starts the count on first contact and has its own fallback.
   for(const el of document.querySelectorAll('[data-kr-wallet-value],[data-home-balance]')){
    try{window.KingRicoWallet?.set(el,Cloud.player.balance,{source:{getBoundingClientRect:()=>rect}});}
    catch{el.textContent=Cloud.player.balance.toLocaleString('pt-BR',{maximumFractionDigits:2});}
   }
   if(previous?.isConnected)previous.focus({preventScroll:true});resolve();
  }
  function trap(e){if(e.key==='Tab'){e.preventDefault();button.focus();}if(e.key==='Escape')e.preventDefault();}
  document.addEventListener('keydown',trap);panel.focus({preventScroll:true});
  async function reveal(){
   if(revealed)return;revealed=true;last=null;unlockVeil?.remove();cells.forEach(c=>revealCell(c,true));sfx.three();
   overlay.classList.add('is-revealed');button.disabled=true;button.textContent='…';status.textContent='3 prêmios iguais!';
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   const space=overlay.querySelector('.park-daily-reveal-space'),summary=overlay.querySelector('.park-daily-summary'),r=grid.getBoundingClientRect();space.style.height=r.height+'px';
   await new Promise(resolve=>setTimeout(resolve,reduced?150:650));if(finished)return;
   try{
    const animations=cells.map((cell,i)=>{const c=cell.getBoundingClientRect();return cell.animate([{transform:'none',opacity:1},{transform:`translate(${r.x+r.width/2-c.x-c.width/2}px,${r.y+r.height/2-c.y-c.height/2}px) scale(.25)`,opacity:0}],{duration:reduced?120:480,delay:reduced?0:i*24,easing:'cubic-bezier(.4,0,.6,1)',fill:'forwards'}).finished;});
    await Promise.race([Promise.allSettled(animations),new Promise(resolve=>setTimeout(resolve,900))]);
   }catch{/* A missing animation still reveals the saved gift. */}
   if(finished)return;grid.hidden=true;summary.hidden=false;instruction.hidden=true;overlay.dataset.phase='prize';sfx.prize();
   try{summary.animate([{transform:'translateY(18px) scale(.75)',opacity:0},{transform:'translateY(-4px) scale(1.04)',opacity:1,offset:.7},{transform:'none',opacity:1}],{duration:reduced?160:600,easing:'cubic-bezier(.2,.7,.25,1)'});}catch{}
   delete status.dataset.error;status.textContent=`Você ganhou ${gift.amount.toLocaleString('pt-BR')} moedas`;button.classList.add('is-primary');button.textContent='PEGAR MOEDAS';button.disabled=false;
  }
  // A discreet reveal button offers the same result to keyboard users and anyone
  // who finds scratching difficult; no amount is drawn or decided by the canvas.
  button.onclick=async()=>{
   sfx.button();if(!revealed){reveal();return;}if(busy)return;busy=true;button.disabled=true;button.textContent='CONFIRMANDO…';delete status.dataset.error;status.textContent='';
   try{await Cloud.bonus();sfx.coins();close();}catch(error){
    status.dataset.error='true';status.textContent='Não foi possível confirmar. Toque para tentar de novo.';
    button.disabled=false;button.textContent='PEGAR MOEDAS';Cloud.error(error);
   }finally{busy=false;}
  };
  function revealCell(cell,quiet){
   if(!quiet&&!cell.classList.contains('is-revealed'))sfx.cell(cell.dataset.prize==='true');cell.classList.add('is-revealed');cell.querySelector('canvas').hidden=true;
   const result=cell.querySelector('.park-daily-result');result.removeAttribute('aria-hidden');
   result.setAttribute('aria-label',cell.dataset.prize==='true'?`${gift.amount.toLocaleString('pt-BR')} moedas`:'X, sem prêmio nesta casa');
  }
  try{
   const surfaces=cells.map(cell=>{
    const canvas=cell.querySelector('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)throw Error('Canvas indisponível');
    const gradient=ctx.createLinearGradient(0,0,180,180);gradient.addColorStop(0,'#fff1b1');gradient.addColorStop(.5,'#dfad45');gradient.addColorStop(1,'#ffdd80');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,180,180);ctx.strokeStyle='#fff5c7';ctx.lineWidth=1;
    for(let x=-180;x<180;x+=25){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+180,180);ctx.stroke();}
    ctx.fillStyle='#906123';ctx.textAlign='center';ctx.font='58px sans-serif';ctx.fillText('★',90,112);
    return {cell,canvas,ctx};
   });
   function scratchPoint(pt,fromDown){
    if(revealed||!last)return;const point={x:pt.clientX,y:pt.clientY};let hit=false;
    for(const {cell,canvas,ctx}of surfaces){
     if(cell.classList.contains('is-revealed'))continue;
     const r=canvas.getBoundingClientRect(),radius=r.width*.1;
     if(Math.max(last.x,point.x)<r.left-radius||Math.min(last.x,point.x)>r.right+radius||Math.max(last.y,point.y)<r.top-radius||Math.min(last.y,point.y)>r.bottom+radius)continue;
     if(!hit){hit=true;const a=(window.__fc?._ac||fbAc);if(!a||a.state!=='running')missedScratch=scratchT;missedHaptic=sfx.scratch(()=>!finished&&!revealed,fromDown,overlay)===false||missedHaptic;}
     const local=p=>({x:(p.x-r.x)*180/r.width,y:(p.y-r.y)*180/r.height}),from=local(last),to=local(point);
     ctx.globalCompositeOperation='destination-out';ctx.lineWidth=34;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke();
     touched.add(cell);
    }
    last=point;
    if(!coverageFrame)coverageFrame=requestAnimationFrame(checkCoverage);
   }
   const touched=new Set();let coverageFrame=0;
   function checkCoverage(){
    cancelAnimationFrame(coverageFrame);coverageFrame=0;
    if(revealed||finished){touched.clear();return;}
    // Draw every input sample; read each touched canvas only once per frame.
    for(const {cell,ctx}of surfaces)if(touched.has(cell)&&!cell.classList.contains('is-revealed')){
     const data=ctx.getImageData(0,0,180,180).data;let clear=0,total=0;
     for(let i=3;i<data.length;i+=64){total++;if(data[i]<128)clear++;}
     if(clear/total>=.60)revealCell(cell);
    }
    touched.clear();
    const found=cells.filter(c=>c.dataset.prize==='true'&&c.classList.contains('is-revealed')).length;
    if(found===3)reveal();else status.textContent=`${found} de 3 prêmios encontrados`;
   }
   function scratch(e){
    const pts=e.getCoalescedEvents?.();
    if(pts&&pts.length){for(const pt of pts){if(revealed)break;scratchPoint(pt,false);}}
    else scratchPoint(e,false);
   }
   // touch-action:none already blocks scrolling. Do not cancel the trusted tap/click.
   grid.onpointerdown=e=>{warmAudio(true);last={x:e.clientX,y:e.clientY};try{grid.setPointerCapture(e.pointerId);}catch{}scratchPoint(e,true);};
   grid.onpointermove=scratch;grid.onpointerup=grid.onpointercancel=()=>{checkCoverage();last=null;};
  }catch{reveal();}
  // Another tab may collect while this card is open. Never offer a second credit.
  unwatch=Cloud.watch(p=>{if(!busy&&p.bonus.day===gift.today)close();});
  if(finished)unwatch();
 });
}
