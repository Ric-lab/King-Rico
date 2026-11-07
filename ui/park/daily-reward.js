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
   <p class="park-daily-instruction">Raspe e encontre 3 iguais!</p>
   <div class="park-daily-reveal-space"><div class="park-daily-grid">${scratchGrid().map((win,i)=>`<div class="park-daily-cell" data-prize="${win}"><div class="park-daily-result" aria-hidden="true">${win?`<img src="/assets/symbols/sym-coin.webp" alt=""><strong>${gift.amount.toLocaleString('pt-BR')}</strong>`:'<span class="park-daily-x">×</span>'}</div><canvas width="180" height="180" aria-label="Raspe a casa ${i+1}"></canvas></div>`).join('')}</div><div class="park-daily-summary" hidden><img src="/assets/symbols/sym-coin.webp" alt=""><strong>+${gift.amount.toLocaleString('pt-BR')}</strong><span>moedas</span></div></div>
   <p class="park-daily-status" role="status" aria-live="polite"></p>
   <button type="button" class="park-daily-button">REVELAR</button>
  </section>`;
  const previous=document.activeElement,overflow=document.body.style.overflow;
  const background=[...document.body.children].filter(e=>!e.matches('script,style'));
  const inert=background.map(e=>[e,e.inert]);inert.forEach(([e])=>e.inert=true);
  document.body.append(overlay);document.body.style.overflow='hidden';
  const button=overlay.querySelector('button'),grid=overlay.querySelector('.park-daily-grid'),status=overlay.querySelector('[role=status]');
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
  document.addEventListener('keydown',trap);button.focus({preventScroll:true});
  async function reveal(){
   if(revealed)return;revealed=true;last=null;cells.forEach(revealCell);
   overlay.classList.add('is-revealed');button.disabled=true;button.textContent='…';
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   const space=overlay.querySelector('.park-daily-reveal-space'),summary=overlay.querySelector('.park-daily-summary'),r=grid.getBoundingClientRect();space.style.height=r.height+'px';
   await new Promise(resolve=>setTimeout(resolve,reduced?150:650));if(finished)return;
   try{
    const animations=cells.map((cell,i)=>{const c=cell.getBoundingClientRect();return cell.animate([{transform:'none',opacity:1},{transform:`translate(${r.x+r.width/2-c.x-c.width/2}px,${r.y+r.height/2-c.y-c.height/2}px) scale(.25)`,opacity:0}],{duration:reduced?120:480,delay:reduced?0:i*24,easing:'cubic-bezier(.4,0,.6,1)',fill:'forwards'}).finished;});
    await Promise.race([Promise.allSettled(animations),new Promise(resolve=>setTimeout(resolve,900))]);
   }catch{/* A missing animation still reveals the saved gift. */}
   if(finished)return;grid.hidden=true;summary.hidden=false;overlay.dataset.phase='prize';
   overlay.querySelector('.park-daily-instruction').textContent='Seu presente está aqui!';
   try{summary.animate([{transform:'translateY(18px) scale(.75)',opacity:0},{transform:'translateY(-4px) scale(1.04)',opacity:1,offset:.7},{transform:'none',opacity:1}],{duration:reduced?160:600,easing:'cubic-bezier(.2,.7,.25,1)'});}catch{}
   status.textContent=`Você ganhou ${gift.amount.toLocaleString('pt-BR')} moedas`;button.textContent='PEGAR MOEDAS';button.disabled=false;
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
  function revealCell(cell){
   cell.classList.add('is-revealed');cell.querySelector('canvas').hidden=true;
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
   function scratch(e){
    if(revealed||!last)return;const point={x:e.clientX,y:e.clientY};
    for(const {cell,canvas,ctx}of surfaces){
     if(cell.classList.contains('is-revealed'))continue;
     const r=canvas.getBoundingClientRect(),radius=r.width*.16;
     if(Math.max(last.x,point.x)<r.left-radius||Math.min(last.x,point.x)>r.right+radius||Math.max(last.y,point.y)<r.top-radius||Math.min(last.y,point.y)>r.bottom+radius)continue;
     const local=p=>({x:(p.x-r.x)*180/r.width,y:(p.y-r.y)*180/r.height}),from=local(last),to=local(point);
     ctx.globalCompositeOperation='destination-out';ctx.lineWidth=56;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke();
     const data=ctx.getImageData(0,0,180,180).data;let clear=0,total=0;
     for(let i=3;i<data.length;i+=64){total++;if(data[i]<128)clear++;}
     if(clear/total>=.36)revealCell(cell);
    }
    last=point;
    const found=cells.filter(c=>c.dataset.prize==='true'&&c.classList.contains('is-revealed')).length;
    if(found===3)reveal();else status.textContent=found?`${found} de 3 prêmios encontrados`:'Continue raspando';
   }
   grid.onpointerdown=e=>{e.preventDefault();last={x:e.clientX,y:e.clientY};grid.setPointerCapture(e.pointerId);scratch(e);};
   grid.onpointermove=scratch;grid.onpointerup=grid.onpointercancel=()=>{last=null;};
  }catch{reveal();}
  // Another tab may collect while this card is open. Never offer a second credit.
  unwatch=Cloud.watch(p=>{if(!busy&&p.bonus.day===gift.today)close();});
  if(finished)unwatch();
 });
}
