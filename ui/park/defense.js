// The receipt consumes one clover and owns the replacement/prize. This is presentation only.
export function installDefense(fc,rails){
 const payout=fc.payout.bind(fc),busy=fc.cloudBusy.bind(fc);
 fc.cloudBusy=(...args)=>!!fc._cedarDefending||busy(...args);
 fc.payout=(res,...args)=>{
  const o=fc._cloudSpin?.outcome,event=o?.defense;if(!event)return payout(res,...args);
  if(fc._cedarDefending)return;fc._cedarDefending=true;fc._celebHold=true;
  const wasAuto=fc.state.auto,before=event.beforeGrid||fc.state.grid,cell=event.cell??res.cells[1]??4;
  fc._parkVisibleTickets=(window.KingRicoPark.state.cedros??0)+1;
  fc.setState({spinning:false,auto:false,grid:before.slice(),winCells:[],winLines:[],barWin:0,balPending:0,winDim:false,hint:'Trevo da sorte te protegeu!'});
  const scene=document.createElement('div');scene.className='park-defense-scene is-replacement';scene.dataset.phase='warning';
  scene.innerHTML='<svg class="park-defense-line" aria-hidden="true"></svg><img class="park-defense-flying" src="/assets/symbols/sym-clover.png" alt=""><i class="park-defense-impact"></i><strong class="park-defense-caption">Trevo da sorte te protegeu!</strong>';
  document.body.append(scene);
  const svg=scene.querySelector('svg'),fly=scene.querySelector('img'),cells=before.flatMap((v,i)=>v===({tony:12,tucker:13,ray:14}[event.against])?[i]:[]);
  const box=i=>document.querySelector('[data-sym="'+i+'"]')?.getBoundingClientRect(),boxes=cells.map(box).filter(Boolean),target=box(cell),source=rails.querySelector('.park-pocket .park-ticket-wallet-art')?.getBoundingClientRect();
  svg.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);
  if(boxes.length)svg.innerHTML=`<polyline points="${boxes.map(r=>`${r.x+r.width/2},${r.y+r.height/2}`).join(' ')}"/>`+boxes.map(r=>`<ellipse cx="${r.x+r.width/2}" cy="${r.y+r.height/2}" rx="${r.width*.44}" ry="${r.height*.43}"/>`).join('');
  try{fc.pluck(196,.13,.35);fc.buzz?.([45]);}catch{}
  let ended=false,hit=false;const timers=[],animations=[];const later=(fn,ms)=>timers.push(setTimeout(fn,ms));
  const impact=()=>{if(hit||ended)return;hit=true;scene.dataset.phase='impact';svg.style.opacity='0';if(target){const spark=scene.querySelector('.park-defense-impact');spark.style.left=(target.x+target.width/2)+'px';spark.style.top=(target.y+target.height/2)+'px';} fc._parkVisibleTickets=window.KingRicoPark.state.cedros??0;rails.querySelector('[data-tickets]').textContent=fc._parkVisibleTickets+'/5';
   fc.setState({grid:o.grid.slice(),winCells:res.cells,winLines:res.lines,winDim:res.win>0});
   try{fc.bell(1046.5,.4,.09);fc.buzz?.([65]);animations.push(fly.animate([{opacity:1,scale:1},{opacity:0,scale:1.35}],{duration:420,fill:'forwards'}));const sym=document.querySelector('[data-sym="'+cell+'"]');if(sym)animations.push(sym.animate([{filter:'brightness(2)',transform:'scale(.65)'},{filter:'brightness(1.2)',transform:'scale(1.08)',offset:.65},{filter:'brightness(1)',transform:'scale(1)'}],{duration:460,easing:'ease-out'}));}catch{}
  };
  const finish=()=>{if(ended)return;impact();ended=true;timers.forEach(clearTimeout);animations.forEach(a=>a.cancel());scene.remove();fc._cedarDefending=false;fc._celebHold=false;fc.syncCeleb();fc.setState({auto:wasAuto,grid:o.grid.slice()});payout(res,...args);};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(source&&target)try{
   const sx=source.x+source.width/2-32,sy=source.y+source.height/2-32,tx=target.x+target.width/2-32,ty=target.y+target.height/2-32,frames=[];
   // Continuous arc with a gentle turn, rather than a spinning sticker.
   for(let i=0;i<=40;i++){
    const t=i/40,x=(1-t)*(1-t)*sx+2*(1-t)*t*(sx+tx)/2+t*t*tx,y=(1-t)*(1-t)*sy+2*(1-t)*t*(Math.min(sy,ty)-65)+t*t*ty;
    frames.push({transform:`translate(${x}px,${y}px) scale(${.6+.55*Math.sin(t*Math.PI/2)}) rotate(${-12+24*t}deg)`,opacity:Math.min(1,t*10),offset:t});
   }
   animations.push(fly.animate(frames,{delay:500,duration:reduced?300:1100,easing:'cubic-bezier(.3,0,.3,1)',fill:'both'}));
  }catch{}
  later(impact,reduced?800:1600);later(finish,reduced?1250:2150);window.addEventListener('pagehide',finish,{once:true});
 };
}
