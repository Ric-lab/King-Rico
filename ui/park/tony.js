// A committed debit, presented in three beats. This module never mutates the wallet.
const HEAD='/assets/tony/head.webp';
export function installTony(fc){
 const image=new Image();image.src=HEAD;image.decode?.().catch(()=>{});
 const payout=fc.payout.bind(fc),busy=fc.cloudBusy.bind(fc),spin=fc.doSpin.bind(fc);
 fc.cloudBusy=(...args)=>!!fc._tonyPlaying||busy(...args);
 fc.doSpin=(...args)=>{if(!fc._tonyPlaying)return spin(...args);};
 fc.payout=(res,...args)=>{
  const receipt=fc._cloudSpin,event=receipt?.outcome?.tony;
  if(!event)return payout(res,...args);
  if(fc._tonyPlaying)return;
  fc._tonyPlaying=true;fc._celebHold=true;
  fc.setState({spinning:false,auto:false,winCells:[],winLines:[],barWin:0,balPending:0,winDim:false,hint:'TONY TIGER!'});
  fc.kingSet('surprise');fc.lightsRest();
  const root=document.createElement('div');root.className='park-tony-scene';root.setAttribute('role','status');root.setAttribute('aria-label','Tony Tiger roubando moedas');
  root.innerHTML='<svg class="park-tony-lines" aria-hidden="true"></svg><div class="park-tony-strikes" aria-hidden="true"></div><div class="park-tony-loss" aria-live="polite"><small>TONY TIGER</small><b></b></div>';
  document.body.append(root);
  const wallet=document.querySelector('.kr-hud-balance'),stage=document.querySelector('.park-circus-scene'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timers=[],animations=[];let modal,finished=false,hit=0;
  const later=(fn,ms)=>timers.push(setTimeout(()=>{if(!finished)fn();},ms));
  // Boundaries share one timer: contact, sound, shake, red flash and number decrease.
  function sound(n){try{const now=0;fc.burst(230+n*35,1.1,.055,.18,now);fc.pluck([196,164.81,130.81][n],.14,.75,now);fc.hap('winMid');}catch{}}
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
   fc.setState({balance:(start-spent)/100,hint:'Tony roubou '+fc.money(spent/100)+' moedas'});
   root.querySelector('.park-tony-loss b').textContent='−'+fc.money(event.hits[n]/100);
   wallet?.classList.add('is-tony-hit');sound(n);
   const marks=document.createElement('div');marks.className='park-tony-claws';marks.dataset.strike=String(n);
   marks.innerHTML='<svg viewBox="0 0 300 160" preserveAspectRatio="none"><g fill="#ba2035"><path d="M5 35 Q100 8 294 5 L279 13 Q110 25 5 35Z"/><path d="M0 84 Q115 54 300 52 L285 62 Q114 72 0 84Z"/><path d="M15 137 Q119 108 288 106 L274 116 Q122 126 15 137Z"/></g><g fill="#fff2dc"><path d="M16 33 Q110 14 284 9 Q110 23 16 33Z"/><path d="M10 81 Q120 59 290 57 Q120 70 10 81Z"/><path d="M25 134 Q120 113 278 111 Q120 124 25 134Z"/></g></svg>';root.querySelector('.park-tony-strikes').append(marks);
   try{
    animations.push(marks.animate([{opacity:0,clipPath:'inset(0 100% 0 0)'},{opacity:1,clipPath:'inset(0)',offset:.2},{opacity:1,offset:.62},{opacity:0}],{duration:1150,fill:'forwards',easing:'ease-out'}));
    if(!reduced&&stage)animations.push(stage.animate([{translate:'0 0'},{translate:'-5px 3px'},{translate:'5px -2px'},{translate:'-3px 1px'},{translate:'0 0'}],{duration:330,easing:'ease-out'}));
    animations.push(root.querySelector('.park-tony-loss').animate([{opacity:0,transform:'translate(-50%,10px)'},{opacity:1,transform:'translate(-50%,0)',offset:.18},{opacity:1,offset:.8},{opacity:0}],{duration:1250}));
   }catch{/* Financial result and next beat do not depend on animation APIs. */}
  }
  function clean(){timers.forEach(clearTimeout);animations.forEach(a=>{try{a.cancel();}catch{}});wallet?.classList.remove('is-tony-hit');root.remove();window.removeEventListener('pagehide',hide);}
  function release(){
   if(finished)return;finished=true;clean();modal?.close();
   // The current confirmed snapshot may include a concurrent-device update.
   fc._tonyPlaying=false;fc._celebHold=false;fc.syncCeleb();
   fc.setState({balance:window.KingRicoCloud.player.balance,hint:'Vamos de novo?',winCells:[],winLines:[]});fc.kingSet('idle');
  }
  function result(){
   wallet?.classList.remove('is-tony-hit');root.querySelector('.park-tony-loss').hidden=true;
   modal=window.KingRicoPark.modal(`<img class="park-tony-portrait" src="${HEAD}" alt="Tony Tiger"><h2>Tony roubou</h2><strong class="park-tony-total">${fc.money(total/100)}</strong><p>moedas</p><button class="park-action park-action-blue">CONTINUAR</button>`,'Tony roubou moedas');
   modal.classList.add('park-tony-result');modal.querySelector('button').onclick=release;
  }
  function hide(){if(finished)return;finished=true;clean();modal?.close();}
  window.addEventListener('pagehide',hide,{once:true});
  later(()=>impact(0),700);later(()=>impact(1),2250);later(()=>impact(2),3800);later(result,5400);
 }
}
