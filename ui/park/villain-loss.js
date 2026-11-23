export function beginVillainHold(fc,shields,wheels){if(fc)fc._parkVillainHold={shields:shields??0,wheels:wheels??0};}
export function confirmVillainHold(fc,outcome){if(!fc)return;if(outcome.defense||!(outcome.tony||outcome.tucker||outcome.ray))delete fc._parkVillainHold;else if(fc._parkVillainHold){if(outcome.ray)fc._parkVillainHold.shields=outcome.ray.before;if(outcome.tucker)fc._parkVillainHold.wheels=outcome.peaches+outcome.tucker.stolen;}}
// Animate the saved resource loss only. No game request, draw or debit here.
const art={ray:'/assets/symbols/shield-defense-rainbow-gold-v1.webp',tucker:'/assets/wheel/wheel-symbol-v1.webp'};
export function releaseVillainHold(fc){delete fc._parkVillainHold;fc._parkVisibleTickets=window.KingRicoPark.state.cedros??0;fc._parkRefresh?.();}
export function showResourceLoss(fc,event,kind,signal){
 const count=event.stolen;if(!count||signal?.aborted){releaseVillainHold(fc);return Promise.resolve();}
 const target=document.querySelector(kind==='ray'?'.park-key-count-shield':'.park-key-count-wheel'),r=target?.getBoundingClientRect();
 const hold=fc._parkVillainHold??={shields:kind==='ray'?event.before:window.KingRicoPark.state.cedros??0,wheels:(window.KingRicoCloud.player.peaches??0)+(kind==='tucker'?count:0)};
 const key=kind==='ray'?'shields':'wheels',before=hold[key],root=document.createElement('div');root.className='park-villain-loss';root.dataset.kind=kind;
 root.innerHTML=`<strong class="park-villain-loss-label">−${count} ${kind==='ray'?'ESCUDOS':'ROLETAS'}</strong>`;document.body.append(root);
 const cell=fc._cloudSpin?.outcome?.res?.cells?.[1],recipient=document.querySelector('[data-sym="'+cell+'"]')?.getBoundingClientRect();
 const tx=recipient?recipient.x+recipient.width/2:innerWidth*.5,ty=recipient?recipient.y+recipient.height/2:innerHeight*.4;
 const label=root.querySelector('strong'),x=r?r.x+r.width/2:innerWidth/2,y=r?r.y:innerHeight*.8;
 label.style.left=Math.max(10,Math.min(innerWidth-240,x-115))+'px';label.style.top=Math.max(70,y-62)+'px';target?.classList.add('is-being-robbed');
 return new Promise(resolve=>{let done=false;const timers=[],animations=[];
  const finish=()=>{if(done)return;done=true;timers.forEach(clearTimeout);animations.forEach(a=>a.cancel());target?.classList.remove('is-being-robbed');root.remove();signal?.removeEventListener('abort',finish);releaseVillainHold(fc);resolve();};
  signal?.addEventListener('abort',finish,{once:true});
  for(let i=0;i<count;i++)timers.push(setTimeout(()=>{
   if(done)return;const img=document.createElement('img');img.src=art[kind];img.alt='';img.className='park-villain-stolen';img.style.left=(x-23)+'px';img.style.top=(y-12)+'px';root.append(img);
   try{animations.push(img.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${tx-x}px,${ty-y}px) scale(.55)`,opacity:0}],{duration:850,easing:'ease-in',fill:'forwards'}));}catch{}
   hold[key]=Math.max(0,before-i-1);fc._parkRefresh?.();try{fc.pluck?.(330-i*35,.12,.35);fc.buzz?.([24]);}catch{}
  },i*280));
  timers.push(setTimeout(finish,(count-1)*280+1050));
 });
}
