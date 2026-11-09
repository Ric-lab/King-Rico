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
  const pocket=document.querySelector('.park-pocket'),count=document.querySelector('[data-tickets]'),prize=document.querySelector('.park-prize-value');
  const p=pocket?.getBoundingClientRect()||{x:10,y:innerHeight*.3,width:80,height:50},v=prize?.getBoundingClientRect()||{x:innerWidth*.3,y:innerHeight*.32,width:150,height:35};
  const size=Math.min(135,innerWidth*.34),height=size*1.04,startX=v.x+v.width*.5-size*.5,startY=v.y-height*.8;
  const targetX=p.x+p.width-size*.12,targetY=p.y+p.height*.5-height*.6;
  const scene=document.createElement('div');scene.className='park-ray-scene';scene.dataset.phase='line';
  scene.innerHTML='<svg class="park-tony-lines" aria-hidden="true"></svg><div class="park-ray-hideout"><div class="park-ray-actor"><img src="'+BODY+'" alt="Ray Raccoon"></div></div><img class="park-ray-loot" src="/ui/park/ticket.svg" alt=""><span class="park-ray-loss" role="status"></span>';
  document.body.append(scene);
  const hideout=scene.querySelector('.park-ray-hideout'),actor=scene.querySelector('.park-ray-actor'),loot=scene.querySelector('.park-ray-loot'),loss=scene.querySelector('.park-ray-loss');
  hideout.style.cssText=`left:${startX}px;top:${startY}px;width:${size}px;height:${height*.8}px;`;
  actor.style.cssText=`width:${size}px;height:${height}px;translate:0 ${height}px;`;
  loss.style.cssText=`left:${p.x+p.width*.5}px;top:${p.y+p.height+5}px;`;
  loot.style.cssText=`left:${p.x+p.width*.5-18}px;top:${p.y+p.height*.5-13}px;`;
  let ended=false,modal;const timers=[],animations=[];
  const later=(fn,t)=>timers.push(setTimeout(()=>{if(!ended)fn();},t));
  function animate(el,keys,opts){try{const a=el.animate(keys,opts);animations.push(a);return a;}catch{return null;}}
  function visibleTickets(n){fc._parkVisibleTickets=n;if(count)count.textContent=n.toLocaleString('pt-BR');pocket?.setAttribute('aria-label',`Parque: ${n} ingressos`);}
  visibleTickets(event.before);
  requestAnimationFrame(()=>{const boxes=res.cells.map(i=>document.querySelector('[data-sym="'+i+'"]')?.getBoundingClientRect()).filter(Boolean);if(boxes.length!==3)return;
   const svg=scene.querySelector('svg');svg.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);
   svg.innerHTML=`<polyline points="${boxes.map(b=>`${b.x+b.width/2},${b.y+b.height/2}`).join(' ')}"/>`+boxes.map(b=>`<ellipse cx="${b.x+b.width/2}" cy="${b.y+b.height/2}" rx="${b.width*.45}" ry="${b.height*.43}"/>`).join('');});
  function peek(){scene.dataset.phase='peeking';actor.style.translate='0 0';animate(actor,[{translate:`0 ${height*.8}px`},{translate:'0 0'}],{duration:750,easing:'cubic-bezier(.2,.8,.2,1)'});}
  function approach(){scene.dataset.phase='approaching';scene.append(actor);hideout.remove();actor.style.cssText+=`position:absolute;left:${targetX}px;top:${targetY}px;translate:0 0;`;
   animate(actor,[{translate:`${startX-targetX}px ${startY-targetY}px`},{translate:'0 0'}],{duration:900,easing:'ease-in-out'});}
  function grab(){scene.dataset.phase='grabbing';visibleTickets(event.remaining);loss.textContent=event.stolen?'−1 ingresso':'0 ingressos';loss.style.opacity='1';
   try{fc.pluck(392,.11,.6);fc.hap('basketIn');}catch{}
   animate(actor,[{rotate:'0deg'},{rotate:'-5deg',offset:.4},{rotate:'0deg'}],{duration:380,easing:'ease-out'});
   if(event.stolen){loot.style.opacity='1';animate(loot,[{translate:'0 0',scale:'1',rotate:'0deg'},{translate:`${targetX+size*.63-(p.x+p.width*.5-18)}px ${targetY+height*.43-(p.y+p.height*.5-13)}px`,scale:'.5',rotate:'-24deg'}],{duration:600,easing:'ease-in-out',fill:'forwards'});}
   later(()=>{loot.style.opacity='0';loss.style.opacity='0';},650);
  }
  function flee(){scene.dataset.phase='leaving';try{fc.sfxWhoosh();}catch{}
   animate(actor,[{translate:'0 0'},{translate:`${-targetX-size-35}px 0`}],{duration:1400,easing:'ease-in',fill:'forwards'});
  }
  function result(){scene.dataset.phase='result';actor.style.visibility='hidden';modal=window.KingRicoPark.modal(`<img class="park-tony-portrait" src="${HEAD}" alt="Ray Raccoon"><h2>${event.stolen?'Ray levou':'Sem ingressos!'}</h2><strong class="park-tony-total">${event.stolen}</strong><p>${event.stolen?'ingresso':'Nenhum ingresso perdido'}</p><button class="park-action park-action-blue">CONTINUAR</button>`,'Ray e os ingressos');modal.classList.add('park-tony-result');modal.querySelector('button').onclick=done;}
  function clean(){timers.forEach(clearTimeout);animations.forEach(a=>{try{a.cancel();}catch{}});scene.remove();window.removeEventListener('pagehide',hide);}
  function done(){if(ended)return;ended=true;modal?.close();clean();visibleTickets(window.KingRicoPark.state.tickets);fc._rayPlaying=false;fc._celebHold=false;fc.syncCeleb();fc.kingSet('idle');fc.setState({balance:window.KingRicoCloud.player.balance,hint:'Vamos de novo?'});}
  function hide(){if(ended)return;ended=true;modal?.close();clean();}
  window.addEventListener('pagehide',hide,{once:true});
  later(peek,650);later(approach,1650);later(grab,2700);later(flee,3450);later(result,5100);
 }
}
