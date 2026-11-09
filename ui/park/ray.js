// Choreography of one saved preview receipt; no debit or lottery in presentation.
const BODY='/assets/ray/body-v1.webp',HEAD='/assets/ray/head-v1.webp';
export function installRay(fc){
 for(const src of [BODY,HEAD]){const i=new Image();i.src=src;i.decode?.().catch(()=>{});}
 const payout=fc.payout.bind(fc),busy=fc.cloudBusy.bind(fc);
 fc.cloudBusy=(...args)=>!!fc._rayPlaying||busy(...args);
 fc.payout=(res,...args)=>{
  const event=fc._cloudSpin?.outcome?.ray;if(!event)return payout(res,...args);
  if(fc._rayPlaying)return;fc._rayPlaying=true;fc._celebHold=true;
  fc.setState({spinning:false,auto:false,winCells:[],winLines:[],barWin:0,balPending:0,winDim:false,hint:'RAY RACCOON!'});
  fc.kingSet('surprise');fc.lightsRest();
  const pocket=document.querySelector('.park-pocket'),count=pocket?.querySelector('[data-tickets]');
  const originalVisibility=pocket?.style.visibility||'';
  const p=pocket?.getBoundingClientRect()||{x:10,y:innerHeight*.3,width:80,height:50};
  const size=Math.min(112,p.width*.95,Math.max(48,(p.x+p.width*.5-4)*2)),height=size*1.04,x=p.width*.5-size*.5,y=p.height*.32-height*.72;
  const scene=document.createElement('div');scene.className='park-ray-scene';scene.dataset.phase='line';
  scene.innerHTML='<svg class="park-tony-lines" aria-hidden="true"></svg><div class="park-ray-carrier"><div class="park-ray-hideout"><div class="park-ray-actor"><img src="'+BODY+'" alt="Ray Raccoon"></div></div></div>';
  document.body.append(scene);
  const carrier=scene.querySelector('.park-ray-carrier'),hideout=scene.querySelector('.park-ray-hideout'),actor=scene.querySelector('.park-ray-actor');
  carrier.style.cssText=`left:${p.x}px;top:${p.y}px;width:${p.width}px;height:${p.height}px;`;
  hideout.style.cssText=`left:${x}px;top:${y}px;width:${size}px;height:${-y+p.height*.25}px;`;
  actor.style.cssText=`width:${size}px;height:${height}px;translate:0 ${height}px;`;
  let ended=false,modal,copy;const timers=[],animations=[];
  const later=(fn,t)=>timers.push(setTimeout(()=>{if(!ended)fn();},t));
  function animate(el,keys,opts){try{const a=el.animate(keys,opts);animations.push(a);return a;}catch{return null;}}
  function visibleTickets(n){fc._parkVisibleTickets=n;if(count)count.textContent=n.toLocaleString('pt-BR');pocket?.setAttribute('aria-label',`Parque: ${n} ingressos`);}
  visibleTickets(event.before);
  // Carry the actual counter artwork and its old count, preserving its rendered scale.
  if(pocket){copy=pocket.cloneNode(true);copy.classList.add('park-ray-carried-pocket');copy.removeAttribute('href');copy.removeAttribute('aria-label');copy.setAttribute('aria-hidden','true');
   const w=pocket.offsetWidth||p.width,h=pocket.offsetHeight||p.height;
   copy.style.cssText=`position:absolute!important;left:0!important;right:auto!important;top:0!important;bottom:auto!important;width:${w}px!important;height:${h}px!important;transform:scale(${p.width/w},${p.height/h})!important;transform-origin:0 0!important;visibility:visible!important;opacity:1!important;pointer-events:none!important;z-index:2!important;`;
   carrier.append(copy);pocket.style.visibility='hidden';}
  requestAnimationFrame(()=>{const boxes=res.cells.map(i=>document.querySelector('[data-sym="'+i+'"]')?.getBoundingClientRect()).filter(Boolean);if(boxes.length!==3)return;
   const svg=scene.querySelector('svg');svg.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);
   svg.innerHTML=`<polyline points="${boxes.map(b=>`${b.x+b.width/2},${b.y+b.height/2}`).join(' ')}"/>`+boxes.map(b=>`<ellipse cx="${b.x+b.width/2}" cy="${b.y+b.height/2}" rx="${b.width*.45}" ry="${b.height*.43}"/>`).join('');});
  function peek(){scene.dataset.phase='peeking';actor.style.translate='0 0';animate(actor,[{translate:`0 ${height*.8}px`},{translate:'0 0'}],{duration:750,easing:'cubic-bezier(.2,.8,.2,1)'});}
  function grab(){scene.dataset.phase='grabbing';
   try{fc.pluck(392,.11,.6);fc.hap('basketIn');}catch{}
   animate(actor,[{rotate:'0deg'},{rotate:'-3deg',offset:.4},{rotate:'0deg'}],{duration:300,easing:'ease-out'});
  }
  function flee(){scene.dataset.phase='leaving';try{fc.sfxWhoosh();}catch{}
   const end=`${-p.x-Math.max(p.width,size)-35}px -8px`;carrier.style.translate=end;
   animate(carrier,[{translate:'0 0'},{translate:end}],{duration:1400,easing:'ease-in'});
  }
  function empty(){scene.dataset.phase='empty';carrier.style.visibility='hidden';}
  function result(){scene.dataset.phase='result';modal=window.KingRicoPark.modal(`<img class="park-tony-portrait" src="${HEAD}" alt="Ray Raccoon"><h2>${event.stolen?'Ray levou':'Sem ingressos!'}</h2><strong class="park-tony-total">${event.stolen}</strong><p>${event.stolen?'ingresso':'Nenhum ingresso perdido'}</p><button class="park-action park-action-blue">CONTINUAR</button>`,'Ray e os ingressos');modal.classList.add('park-tony-result');modal.querySelector('button').onclick=back;}
  function clean(){timers.forEach(clearTimeout);animations.forEach(a=>{try{a.cancel();}catch{}});if(pocket)pocket.style.visibility=originalVisibility;scene.remove();window.removeEventListener('pagehide',hide);}
  function done(){if(ended)return;ended=true;clean();fc._rayPlaying=false;fc._celebHold=false;fc.syncCeleb();fc.kingSet('idle');fc.setState({balance:window.KingRicoCloud.player.balance,hint:'Vamos de novo?'});}
  function back(){if(scene.dataset.phase==='returning')return;scene.dataset.phase='returning';modal?.close();visibleTickets(window.KingRicoPark.state.tickets);
   if(pocket){pocket.style.visibility=originalVisibility;animate(pocket,[{opacity:0,translate:'0 -8px'},{opacity:1,translate:'0 0'}],{duration:450,easing:'ease-out'});}later(done,500);
  }
  function hide(){if(ended)return;ended=true;modal?.close();clean();}
  window.addEventListener('pagehide',hide,{once:true});
  later(peek,650);later(grab,1750);later(flee,2300);later(empty,3900);later(result,4550);
 }
}
