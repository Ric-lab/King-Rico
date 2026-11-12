// A committed debit, presented in three beats. This module never mutates the wallet.
const HEAD='/assets/tony/head.webp';
function adBottom(){const b=document.querySelector('.park-banner,[data-ad-banner]');if(b)return Math.max(0,b.getBoundingClientRect().bottom);if(!window.__fcAdBanner)return 0;const s=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top'))||0;return s+60;}
export function installTony(fc){
 const image=new Image();image.src=HEAD;image.decode?.().catch(()=>{});
 const payout=fc.payout.bind(fc),busy=fc.cloudBusy.bind(fc),spin=fc.doSpin.bind(fc);
 fc.cloudBusy=(...args)=>!!fc._tonyPlaying||busy(...args);
 fc.doSpin=(...args)=>{if(!fc._tonyPlaying)return spin(...args);};
 const render=fc.renderVals.bind(fc);
 fc.renderVals=(...args)=>{const values=render(...args);if(fc._tonyHitValue!=null){values.winText='−'+fc.money(fc._tonyHitValue/100);values.winAnim='none';}return values;};
 fc.payout=(res,...args)=>{
  const receipt=fc._cloudSpin,event=receipt?.outcome?.tony;
  if(!event)return payout(res,...args);
  if(fc._tonyPlaying)return;
  fc._tonyPlaying=true;fc._celebHold=true;
  fc.setState({spinning:false,auto:false,winCells:[],winLines:[],barWin:0,balPending:0,winDim:false,hint:'TONY TIGER!'});
  fc.kingSet('surprise');fc.lightsRest();try{fc.sfxVillain?.('tony');}catch{}
  const root=document.createElement('div');root.className='park-tony-scene';root.setAttribute('role','status');root.setAttribute('aria-label','Tony Tiger roubando moedas');
  root.innerHTML='<svg class="park-tony-lines" aria-hidden="true"></svg><div class="park-tony-veil" aria-hidden="true"></div><div class="park-tony-strikes" aria-hidden="true"></div><span class="park-tony-announcement" aria-live="polite"></span>';
  document.body.append(root);
  const wallet=document.querySelector('.kr-hud-balance'),stage=document.querySelector('.park-circus-scene'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prize=document.querySelector('.park-prize-value'),veil=root.querySelector('.park-tony-veil');
  const timers=[],animations=[];let modal,finished=false,hit=0;
  const later=(fn,ms)=>timers.push(setTimeout(()=>{if(!finished)fn();},ms));
  // Boundaries share one timer: contact, sound, shake, red flash and number decrease.
  function sound(n){try{fc.sfxClaw?.(n);fc.hap('winMid');}catch{}}
  function lines(){
   const boxes=event&&res.cells.map(i=>document.querySelector('[data-sym="'+i+'"]')?.getBoundingClientRect()).filter(Boolean);
   if(boxes?.length!==3)return;
   const points=boxes.map(r=>[r.x+r.width/2,r.y+r.height/2]),svg=root.querySelector('svg');
   svg.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);
   svg.innerHTML=`<polyline points="${points.map(p=>p.join(',')).join(' ')}"/>`+boxes.map((r,i)=>`<ellipse cx="${points[i][0]}" cy="${points[i][1]}" rx="${r.width*.45}" ry="${r.height*.43}"/>`).join('');
  }
  requestAnimationFrame(lines);
  const start=Math.round(receipt.balanceDebited*100),total=event.stolenUnits;
  function impact(n){
   hit=n+1;root.dataset.hit=String(hit);
   const spent=event.hits.slice(0,hit).reduce((a,b)=>a+b,0);
   fc._tonyHitValue=event.hits[n];prize?.classList.add('is-tony-loss');
   fc.setState({balance:(start-spent)/100,hint:'Tony roubou '+fc.money(spent/100)+' moedas'});
   root.querySelector('.park-tony-announcement').textContent='Tony roubou '+fc.money(event.hits[n]/100)+' moedas';
   // Tela toda, menos a faixa do anúncio no topo (quando há anúncio carregado).
   veil.style.top=adBottom()+'px';veil.style.opacity='1';later(()=>{veil.style.opacity='0';},1250);
   wallet?.classList.add('is-tony-hit');sound(n);
   const marks=document.createElement('div');marks.className='park-tony-claws';marks.dataset.strike=String(n);
   marks.innerHTML='<svg viewBox="0 0 320 180" preserveAspectRatio="none"><g fill="#101018"><path d="M8 49 Q111 7 310 10 Q237 16 168 32 L154 29 143 36 Q62 39 8 49Z"/><path d="M0 105 Q116 55 320 62 Q244 68 182 84 L165 80 151 88 Q58 94 0 105Z"/><path d="M18 164 Q123 111 303 121 Q222 125 175 144 L158 140 149 146 Q68 150 18 164Z"/></g></svg>';root.querySelector('.park-tony-strikes').append(marks);
   try{
    animations.push(marks.animate([{opacity:0,clipPath:'inset(0 100% 0 0)'},{opacity:1,clipPath:'inset(0)',offset:.2},{opacity:1,offset:.62},{opacity:0}],{duration:1150,fill:'forwards',easing:'ease-out'}));
    if(!reduced&&stage)animations.push(stage.animate([{translate:'0 0'},{translate:'-5px 3px'},{translate:'5px -2px'},{translate:'-3px 1px'},{translate:'0 0'}],{duration:330,easing:'ease-out'}));
    if(prize)animations.push(prize.animate([{scale:'.94'},{scale:'1.08',offset:.3},{scale:'1'}],{duration:380,easing:'ease-out'}));
   }catch{/* Financial result and next beat do not depend on animation APIs. */}
  }
  function clearPrize(){fc._tonyHitValue=null;prize?.classList.remove('is-tony-loss');}
  function clean(){timers.forEach(clearTimeout);animations.forEach(a=>{try{a.cancel();}catch{}});clearPrize();wallet?.classList.remove('is-tony-hit');root.remove();window.removeEventListener('pagehide',hide);}
  function release(){
   if(finished)return;finished=true;try{fc.sfxClick?.();fc.sfxCoinsLose?.(2);}catch{}clean();modal?.close();
   // The current confirmed snapshot may include a concurrent-device update.
   fc._tonyPlaying=false;fc._celebHold=false;fc.syncCeleb();
   fc.setState({balance:window.KingRicoCloud.player.balance,hint:'Vamos de novo?',winCells:[],winLines:[]});fc.kingSet('idle');
  }
  function result(){
   wallet?.classList.remove('is-tony-hit');veil.hidden=true;clearPrize();fc.setState({barWin:0});
   modal=window.KingRicoPark.modal(`<img class="park-tony-portrait" src="${HEAD}" alt="Tony Tiger"><h2>Tony roubou</h2><strong class="park-tony-total">${fc.money(total/100)}</strong><p>moedas</p><button class="park-action park-action-blue">CONTINUAR</button>`,'Tony roubou moedas');
   modal.classList.add('park-tony-result');modal.querySelector('button').onclick=release;
  }
  function hide(){if(finished)return;finished=true;clean();modal?.close();}
  window.addEventListener('pagehide',hide,{once:true});
  later(()=>impact(0),700);later(()=>impact(1),2250);later(()=>impact(2),3800);later(result,5400);
 }
}
