// Scratch is presentation only. The saved daily bonus owns the amount and credit.
export function dailyGift(player, dayKey) {
 const key=String(dayKey),today=`${key.slice(0,4)}-${key.slice(4,6)}-${key.slice(6)}`;
 if(!player?.bonus||player.bonus.day===today)return null;
 const gap=player.bonus.day?(Date.parse(today)-Date.parse(player.bonus.day))/86400000:99;
 const index=gap===1?player.bonus.streak%7:0;
 return {today,day:index+1,amount:[50,100,150,200,250,500,1000][index]};
}

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
  const overlay=document.createElement('div');overlay.className='park-daily';
  overlay.innerHTML=`<section class="park-daily-panel" role="dialog" aria-modal="true" aria-label="Presente do dia" aria-labelledby="daily-title">
   <img class="park-daily-king" src="/assets/symbols/sym-wild-s.webp" alt="">
   <p class="park-daily-eyebrow">DIA ${gift.day} DE 7</p><h2 id="daily-title">Presente do dia</h2>
   <p class="park-daily-instruction">Raspe e descubra!</p>
   <div class="park-daily-card"><div class="park-daily-prize" aria-hidden="true"><img src="/assets/symbols/sym-coin.webp" alt=""><strong>+${gift.amount.toLocaleString('pt-BR')}</strong><span>moedas</span></div><canvas width="600" height="320" aria-label="Raspe aqui para revelar seu presente"></canvas></div>
   <p class="park-daily-status" role="status" aria-live="polite"></p>
   <button type="button" class="park-daily-button">REVELAR</button>
  </section>`;
  const previous=document.activeElement,overflow=document.body.style.overflow;
  const background=[...document.body.children].filter(e=>!e.matches('script,style'));
  const inert=background.map(e=>[e,e.inert]);inert.forEach(([e])=>e.inert=true);
  document.body.append(overlay);document.body.style.overflow='hidden';
  const button=overlay.querySelector('button'),canvas=overlay.querySelector('canvas'),prize=overlay.querySelector('.park-daily-prize'),status=overlay.querySelector('[role=status]');
  let revealed=false,busy=false,finished=false,last=null,unwatch=()=>{};
  function close(){
   if(finished)return;finished=true;unwatch();document.removeEventListener('keydown',trap);
   const rect=prize.getBoundingClientRect();overlay.remove();Cloud.dailyRewardActive=false;
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
  document.addEventListener('keydown',trap);button.focus({preventScroll:true});
  function reveal(){
   if(revealed)return;revealed=true;last=null;canvas.hidden=true;prize.removeAttribute('aria-hidden');
   overlay.classList.add('is-revealed');overlay.querySelector('.park-daily-instruction').textContent='Seu presente está aqui!';
   status.textContent=`Você ganhou ${gift.amount.toLocaleString('pt-BR')} moedas`;button.textContent='PEGAR MOEDAS';
  }
  // A large reveal button offers the same result to keyboard users and anyone
  // who finds scratching difficult; no amount is drawn or decided by the canvas.
  button.onclick=async()=>{
   if(!revealed){reveal();return;}if(busy)return;busy=true;button.disabled=true;button.textContent='CONFIRMANDO…';status.textContent='';
   try{await Cloud.bonus();close();}catch(error){
    status.textContent='Não foi possível confirmar. Toque para tentar de novo.';
    button.disabled=false;button.textContent='PEGAR MOEDAS';Cloud.error(error);
   }finally{busy=false;}
  };
  try{
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)throw Error('Canvas indisponível');
   const gradient=ctx.createLinearGradient(0,0,600,320);gradient.addColorStop(0,'#fff1b1');gradient.addColorStop(.5,'#dfad45');gradient.addColorStop(1,'#ffdd80');
   ctx.fillStyle=gradient;ctx.fillRect(0,0,600,320);
   ctx.strokeStyle='#fff5c7';ctx.lineWidth=2;
   for(let x=-320;x<600;x+=34){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+320,320);ctx.stroke();}
   ctx.fillStyle='#70461c';ctx.textAlign='center';ctx.font='bold 42px Baloo, sans-serif';ctx.fillText('RASPE AQUI',300,172);
   const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.x)*600/r.width,y:(e.clientY-r.y)*320/r.height};};
   function scratch(e){
    if(revealed||!last)return;const p=point(e);ctx.globalCompositeOperation='destination-out';ctx.lineWidth=68;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;
    const data=ctx.getImageData(0,0,600,320).data;let clear=0,total=0;
    for(let i=3;i<data.length;i+=64){total++;if(data[i]<128)clear++;}
    if(clear/total>=.36)reveal();
   }
   canvas.onpointerdown=e=>{e.preventDefault();last=point(e);canvas.setPointerCapture(e.pointerId);scratch(e);};
   canvas.onpointermove=scratch;canvas.onpointerup=canvas.onpointercancel=()=>{last=null;};
  }catch{reveal();}
  // Another tab may collect while this card is open. Never offer a second credit.
  unwatch=Cloud.watch(p=>{if(!busy&&p.bonus.day===gift.today)close();});
  if(finished)unwatch();
 });
}
