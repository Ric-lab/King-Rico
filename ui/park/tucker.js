// Stages a committed receipt. No mutation, RNG or live-wallet transaction here.
const BODY='/assets/tucker/body-grip-v2.webp',HEAD='/assets/tucker/head.webp';
export function installTucker(fc){
 for(const src of [BODY,HEAD]){const img=new Image();img.src=src;img.decode?.().catch(()=>{});}
 const payout=fc.payout.bind(fc),busy=fc.cloudBusy.bind(fc);
 fc.cloudBusy=(...args)=>!!fc._tuckerPlaying||busy(...args);
 fc.payout=(res,...args)=>{
  const event=fc._cloudSpin?.outcome?.tucker;if(!event)return payout(res,...args);
  if(fc._tuckerPlaying)return;
  fc._tuckerPlaying=true;fc._celebHold=true;
  fc.setState({spinning:false,auto:false,winCells:[],winLines:[],barWin:0,balPending:0,winDim:false,hint:'TUCKER TOUCAN!'});
  fc.kingSet('surprise');fc.lightsRest();
  const basket=document.querySelector('.park-basket'),rect=basket?.getBoundingClientRect(),previousVisibility=basket?.style.visibility||'';
  const scene=document.createElement('div');scene.className='park-tucker-scene';scene.dataset.phase='line';
  scene.innerHTML='<svg class="park-tony-lines" aria-hidden="true"></svg><div class="park-tucker-carrier"><div class="park-tucker-bird" role="img" aria-label="Tucker Toucan"><img class="tucker-wing tucker-wing-left" src="'+BODY+'" alt=""><img class="tucker-body" src="'+BODY+'" alt=""><img class="tucker-wing tucker-wing-right" src="'+BODY+'" alt=""></div></div>';
  document.body.append(scene);
  const carrier=scene.querySelector('.park-tucker-carrier'),bird=scene.querySelector('.park-tucker-bird');
  const r=rect?.width?rect:{x:innerWidth-90,y:innerHeight*.3,width:80,height:80};
  carrier.style.cssText=`left:${r.x}px;top:${r.y}px;width:${r.width}px;height:${r.height}px;`;
  const size=Math.min(120,Math.max(98,r.width*1.35)),height=size*1200/1300;
  // Both curled feet grip the crown of the same handle; do not shift the bird to fit a wing.
  bird.style.cssText=`width:${size}px;height:${height}px;left:${r.width*.5-size*.49}px;top:${r.height*.12-height*.945}px;`;

  let clone,modal,ended=false;const timers=[],animations=[];
  const later=(fn,ms)=>timers.push(setTimeout(()=>{if(!ended)fn();},ms));
  const animate=(el,keys,opts)=>{try{const a=el.animate(keys,opts);animations.push(a);return a;}catch{return null;}};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function line(){const boxes=res.cells.map(i=>document.querySelector('[data-sym="'+i+'"]')?.getBoundingClientRect()).filter(Boolean);if(boxes.length!==3)return;
   const svg=scene.querySelector('svg');svg.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);
   svg.innerHTML=`<polyline points="${boxes.map(b=>`${b.x+b.width/2},${b.y+b.height/2}`).join(' ')}"/>`+boxes.map(b=>`<ellipse cx="${b.x+b.width/2}" cy="${b.y+b.height/2}" rx="${b.width*.45}" ry="${b.height*.43}"/>`).join('');}
  requestAnimationFrame(line);
  function perch(){scene.dataset.phase='perched';bird.style.opacity='1';animate(bird,[{translate:'0 -14px'},{translate:'0 3px',offset:.7},{translate:'0 0'}],{duration:500,easing:'ease-out'});try{fc.pluck(880,.09,.4);fc.hap('basketIn');}catch{}}
  function take(){
   scene.dataset.phase='flying';
   if(basket){clone=basket.cloneNode(true);clone.className='park-tucker-carried-basket';clone.removeAttribute('title');clone.style.cssText=`position:absolute;left:0;top:0;right:auto;width:96px;height:96px;transform:scale(${r.width/96},${r.height/96});transform-origin:0 0;pointer-events:none;`;carrier.prepend(clone);basket.style.visibility='hidden';}
   try{fc.sfxWhoosh();}catch{}
   const dx=innerWidth-r.x+r.width+size,dy=-Math.min(170,innerHeight*.2);
   animate(carrier,[{translate:'0 0',rotate:'0deg'},{translate:`${dx*.12}px -18px`,rotate:'-3deg',offset:.2},{translate:`${dx*.55}px ${dy*.52}px`,rotate:'-7deg',offset:.65},{translate:`${dx}px ${dy}px`,rotate:'-5deg'}],{duration:2100,easing:'cubic-bezier(.32,0,.72,1)',fill:'forwards'});
  }
  function result(){
   scene.dataset.phase='result';carrier.style.visibility='hidden';
   modal=window.KingRicoPark.modal(`<img class="park-tony-portrait" src="${HEAD}" alt="Tucker Toucan"><h2>${event.stolen?'Tucker levou':'Cesta vazia!'}</h2><strong class="park-tony-total">${event.stolen}</strong><p>${event.stolen?'Happeach':'Nenhum Happeach perdido'}</p><button class="park-action park-action-blue">CONTINUAR</button>`,'Tucker levou Happeach');
   modal.classList.add('park-tony-result');modal.querySelector('button').onclick=back;
  }
  function settle(){fc.setState({peaches:window.KingRicoCloud.player.peaches,peachShownBase:null,peachShownAdd:0,balance:window.KingRicoCloud.player.balance,hint:'Vamos de novo?'});}
  function clean(){timers.forEach(clearTimeout);animations.forEach(a=>{try{a.cancel();}catch{}});if(basket)basket.style.visibility=previousVisibility;scene.remove();window.removeEventListener('pagehide',hide);}
  function done(){if(ended)return;ended=true;clean();fc._tuckerPlaying=false;fc._celebHold=false;fc.syncCeleb();fc.kingSet('idle');}
  function back(){if(scene.dataset.phase==='returning')return;modal?.close();scene.dataset.phase='returning';clone?.remove();settle();
   if(basket){basket.style.visibility=previousVisibility;animate(basket,[{opacity:0,translate:'0 -15px'},{opacity:1,translate:'0 0'}],{duration:reduced?200:650,easing:'ease-out'});}
   later(done,700);
  }
  function hide(){if(ended)return;ended=true;modal?.close();clean();}
  window.addEventListener('pagehide',hide,{once:true});
  later(perch,700);later(take,1900);later(()=>{scene.dataset.phase='empty';carrier.style.visibility='hidden';},4100);later(result,4800);
 }
}
