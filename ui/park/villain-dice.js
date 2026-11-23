// Receipt owns the face/loss. Swipe controls the 3D launch, never another debit.
const names={tony:'Tony Tiger',tucker:'Tucker Toucan',ray:'Ray Raccoon'};
const portraits={tony:'/assets/tony/head.webp',tucker:'/assets/tucker/head.webp',ray:'/assets/ray/head-v1.webp'};
const sceneUrl='/ui/park/villain-dice-three.js';
export function playVillainDie(fc,event,kind,signal){
 const value=event?.dice?.value;
 if(!Number.isInteger(value)||value<0||value>5||signal?.aborted)return Promise.resolve(false);
 return new Promise(resolve=>{
  const root=document.createElement('div');root.className='park-villain-dice';root.dataset.kind=kind;root.dataset.phase='loading';
  root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Dado do '+names[kind]);
  const resource=kind==='tony'?'MOEDAS':kind==='ray'?'ESCUDOS':'ROLETAS';
  root.innerHTML=`<section class="park-dice-panel"><header class="park-dice-heading"><img src="${portraits[kind]}" alt=""><div><small>ROUBO DE ${resource}</small><h2>${names[kind]}</h2></div></header><div class="park-dice-tray" aria-label="Arraste para lançar o dado"><span class="park-dice-fallback" hidden></span></div><strong class="park-dice-caption">Preparando o dado…</strong><span class="park-dice-detail">${kind==='tony'?'O dado multiplica sua aposta':'O dado mostra quantos pode levar'}</span><button class="park-action park-action-blue park-dice-throw" disabled>JOGAR DADO</button></section>`;
  document.body.append(root);
  const host=root.querySelector('.park-dice-tray'),button=root.querySelector('button'),caption=root.querySelector('.park-dice-caption'),detail=root.querySelector('.park-dice-detail'),fallback=root.querySelector('.park-dice-fallback');
  let done=false,scene,down,launched=false,revealed=false,mode='loading',importTimer;const timers=[];const previous=document.activeElement;
  const finish=ok=>{if(done)return;done=true;timers.forEach(clearTimeout);clearTimeout(importTimer);scene?.dispose();root.remove();signal?.removeEventListener('abort',abort);previous?.focus?.();resolve(ok);};
  const abort=()=>finish(false);signal?.addEventListener('abort',abort,{once:true});
  function land(){
   if(done||revealed)return;revealed=true;root.dataset.phase='result';root.dataset.value=String(value);button.hidden=true;
   caption.textContent=kind==='tony'?`${value}× a aposta`:`${value} no dado`;
   const loss=kind==='tony'?event.stolenUnits/100:event.stolen;
   detail.textContent=loss?`VAI LEVAR ${kind==='tony'?fc.money(loss):loss} ${kind==='tony'?'MOEDAS':kind==='ray'?'ESCUDOS':'ROLETAS'}`:'NÃO LEVOU NADA';
   if(kind!=='tony'&&loss<value&&loss>0)caption.textContent=`Você tinha ${loss} ${kind==='ray'?'escudos':'roletas'}`;
   root.setAttribute('aria-label',`Dado do ${names[kind]}: ${value}. ${detail.textContent}`);
   try{fc.pluck?.(value===0?1046.5:392,.2,.5);fc.buzz?.([35]);}catch{}
   timers.push(setTimeout(()=>finish(true),2100));
  }
  function fallbackReady(){
   if(done||mode==='fallback')return;scene?.dispose();scene=null;mode='fallback';root.dataset.renderer='fallback';
   fallback.hidden=false;fallback.textContent=launched?String(value):'?';
   if(launched){land();return;}ready();button.textContent='REVELAR RESULTADO';
  }
  function ready(){if(done)return;clearTimeout(importTimer);root.dataset.phase='ready';button.disabled=false;caption.textContent='Deslize para jogar';button.focus();}
  function launch(gesture){
   if(done||launched||mode==='loading')return;launched=true;root.dataset.phase='rolling';button.disabled=true;caption.textContent='';detail.textContent='';
   try{fc.sfxClick?.();fc.buzz?.([25]);if(scene){scene.throwDie(gesture);timers.push(setTimeout(()=>{if(!revealed)fallbackReady();},6000));}else{fallback.textContent=String(value);land();}}catch{fallbackReady();}
  }
  button.onclick=()=>launch({dy:-150,duration:240});
  host.onpointerdown=e=>{if(mode==='loading'||launched||e.isPrimary===false)return;down={x:e.clientX,y:e.clientY,t:performance.now(),id:e.pointerId};try{host.setPointerCapture(e.pointerId);}catch{}};
  host.onpointerup=e=>{if(!down||e.pointerId!==down.id)return;const d=down;down=null;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.hypot(dx,dy)>=18)launch({dx,dy,duration:performance.now()-d.t});};
  host.onpointercancel=()=>{down=null;};
  root.onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();button.focus();}};
  importTimer=setTimeout(fallbackReady,8000);
  import(sceneUrl).then(({createDiceScene})=>{
   if(done||mode==='fallback')return;
   try{scene=createDiceScene(host,{value,onLand:land,onImpact:()=>{try{fc.pluck?.(170,.055,.18);fc.buzz?.([12]);}catch{}},onError:fallbackReady});mode='three';root.dataset.renderer='three';ready();}catch{fallbackReady();}
  }).catch(fallbackReady);
 });
}
