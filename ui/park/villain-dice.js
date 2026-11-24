// The saved face is presented once. Swipe controls only launch physics.
const names={tony:'Tony Tiger',tucker:'Tucker Toucan',ray:'Ray Raccoon'};
const portraits={tony:'/assets/tony/head.webp',tucker:'/assets/tucker/head.webp',ray:'/assets/ray/head-v1.webp'};
const colors={tony:'#d7772b',ray:'#286e42',tucker:'#226d9b'},sceneUrl='/ui/park/villain-dice-three.js?v=inventory-v2';
export function playVillainDie(fc,event,kind,signal){
 const value=event?.dice?.value;
 if(!Number.isInteger(value)||value<0||value>5||signal?.aborted)return Promise.resolve(false);
 return new Promise(resolve=>{
  const root=document.createElement('div');root.className='park-villain-dice';root.dataset.kind=kind;root.dataset.phase='entering';root.style.setProperty('--villain-felt',colors[kind]);
  root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Dado do '+names[kind]);
  root.innerHTML=`<div class="park-dice-table"><div class="park-dice-tray" aria-label="Arraste para lançar o dado"><span class="park-dice-fallback" hidden></span></div><div class="park-dice-controls"><strong class="park-dice-caption">Preparando o dado…</strong><button class="park-action park-dice-throw" disabled>JOGAR DADO</button></div></div><strong class="park-dice-screen-value" aria-hidden="true">${value}</strong>`;
  document.body.append(root);
  const table=root.querySelector('.park-dice-table'),host=root.querySelector('.park-dice-tray'),button=root.querySelector('button'),caption=root.querySelector('.park-dice-caption'),fallback=root.querySelector('.park-dice-fallback'),number=root.querySelector('.park-dice-screen-value');
  let done=false,scene,down,launched=false,revealed=false,entered=false,mode='loading',importTimer;const timers=[],animations=[],previous=document.activeElement;
  const later=(fn,ms)=>timers.push(setTimeout(()=>{if(!done)fn();},ms));
  const animate=(el,frames,options)=>{try{const a=el.animate(frames,options);animations.push(a);return a;}catch{return null;}};
  const finish=ok=>{if(done)return;done=true;timers.forEach(clearTimeout);clearTimeout(importTimer);animations.forEach(a=>a.cancel());scene?.dispose();root.remove();signal?.removeEventListener('abort',abort);previous?.focus?.();resolve(ok);};
  const abort=()=>finish(false);signal?.addEventListener('abort',abort,{once:true});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,entryDuration=reduced?180:650;
  const cell=fc._cloudSpin?.outcome?.res?.cells?.[1],r=document.querySelector('[data-sym="'+cell+'"]')?.getBoundingClientRect();
  const zoom=document.createElement('img');zoom.className='park-villain-zoom';zoom.src=portraits[kind];zoom.alt='';root.append(zoom);
  const start=r||{x:innerWidth/2-60,y:innerHeight/2-60,width:120,height:120};
  zoom.style.cssText=`left:${start.x}px;top:${start.y}px;width:${start.width}px;height:${start.height}px;`;
  const dx=innerWidth/2-start.x-start.width/2,dy=innerHeight/2-start.y-start.height/2,cover=Math.max(innerWidth/start.width,innerHeight/start.height)*3;
  animate(zoom,[{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx}px,${dy}px) scale(${cover})`}],{duration:entryDuration,easing:'cubic-bezier(.4,0,.65,1)',fill:'forwards'});
  animate(table,[{opacity:0},{opacity:1}],{delay:entryDuration*.6,duration:entryDuration*.4,fill:'forwards'});
  later(()=>{entered=true;zoom.remove();table.style.opacity='1';if(mode!=='loading')ready();else root.dataset.phase='loading';},entryDuration);
  function land(){
   if(done||revealed)return;revealed=true;root.dataset.phase='result';root.dataset.value=String(value);button.hidden=true;caption.textContent='Tirou '+value;
   number.style.opacity='1';root.setAttribute('aria-label',`Dado do ${names[kind]}: ${value}`);
   animate(number,[{transform:'translate(-50%,-50%) scale(.2)',opacity:0},{transform:'translate(-50%,-50%) scale(1)',opacity:1}],{duration:350,easing:'ease-out',fill:'forwards'});
   try{fc.pluck?.(value===0?1046.5:392,.2,.5);fc.buzz?.([35]);}catch{}
   later(()=>{root.dataset.phase='returning';animate(number,[{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:'translate(-50%,-50%) scale(22)',opacity:1}],{duration:550,easing:'ease-in',fill:'forwards'});animate(table,[{opacity:1},{opacity:0}],{delay:300,duration:250,fill:'forwards'});later(()=>finish(true),550);},1150);
  }
  function fallbackReady(){if(done||mode==='fallback')return;scene?.dispose();scene=null;mode='fallback';root.dataset.renderer='fallback';fallback.hidden=false;fallback.textContent=launched?String(value):'?';if(launched){land();return;}ready();button.textContent='REVELAR RESULTADO';}
  function ready(){if(done||!entered)return;clearTimeout(importTimer);root.dataset.phase='ready';button.disabled=false;caption.textContent='Deslize para jogar';button.focus();}
  function launch(gesture){if(done||launched||!entered||mode==='loading')return;launched=true;root.dataset.phase='rolling';button.hidden=true;caption.textContent='';try{fc.sfxClick?.();fc.buzz?.([16]);if(scene){scene.throwDie(gesture);later(()=>{if(!revealed)fallbackReady();},6000);}else{fallback.textContent=String(value);land();}}catch{fallbackReady();}}
  button.onclick=()=>launch({dy:-150,duration:240});
  host.onpointerdown=e=>{if(mode==='loading'||!entered||launched||e.isPrimary===false)return;down={x:e.clientX,y:e.clientY,t:performance.now(),id:e.pointerId,samples:[{x:e.clientX,y:e.clientY,t:performance.now()}]};try{fc.buzz?.([6]);host.setPointerCapture(e.pointerId);}catch{}};
  host.onpointermove=e=>{if(!down||e.pointerId!==down.id||launched)return;
   const now=performance.now();down.samples.push({x:e.clientX,y:e.clientY,t:now});down.samples=down.samples.filter(p=>now-p.t<110);
   scene?.dragDie?.({dx:e.clientX-down.x,dy:e.clientY-down.y});
  };
  host.onpointerup=e=>{if(!down||e.pointerId!==down.id)return;const d=down;down=null;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.hypot(dx,dy)>=12){
    const now=performance.now(),sample=d.samples.find(p=>now-p.t>=35)||{x:d.x,y:d.y,t:d.t};
    launch({dx:e.clientX-sample.x,dy:e.clientY-sample.y,duration:Math.max(40,now-sample.t)});
   }else scene?.dragDie?.({dx:0,dy:0});};host.onpointercancel=()=>{down=null;scene?.dragDie?.({dx:0,dy:0});};
  root.onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();button.focus();}};
  importTimer=setTimeout(fallbackReady,8000);
  import(sceneUrl).then(({createDiceScene})=>{if(done||mode==='fallback')return;try{scene=createDiceScene(host,{value,faceIndex:event.dice.index??value,faces:event.dice.faces??[0,1,2,3,4,5],kind,portrait:portraits[kind],onLand:land,onImpact:()=>{try{fc.pluck?.(170,.055,.18);fc.buzz?.([8]);}catch{}},onError:fallbackReady});mode='three';root.dataset.renderer='three';ready();}catch{fallbackReady();}}).catch(fallbackReady);
 });
}
