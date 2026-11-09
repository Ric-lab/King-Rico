/* Three continuous physical tapes. Identity belongs to a tape index, never a row. */
(function(root){
 const PITCH=128,HEIGHT=382;
 function plan({column,from,target,stop,seed=0,ticket=false,wasTicket=false}){
  const anchor=-Math.round(stop/PITCH),items=[];
  for(let index=anchor-4;index<=5;index++){
   let symbol=((Math.imul(index+4096,1103515245)+Math.imul(column+1,12345)+(seed|0))>>>0)%12,isTicket;
   if(index>=0&&index<3){symbol=from[column+index*3];isTicket=symbol===10;}
   if(index>=anchor&&index<anchor+3){symbol=target[column+(index-anchor)*3];isTicket=symbol===10;}
   isTicket=symbol===10;
   items.push(Object.freeze({index,symbol,ticket:isTicket}));
  }
  return Object.freeze(items);
 }
 function create(container,column,cells,options){
  const host=document.createElement('div'),film=document.createElement('div');
  host.className='park-physical-reel';host.dataset.column=column;host.style.left=[34.333,164.333,294.333][column]+'px';
  film.className='park-physical-film';host.append(film);container.append(host);
  const windows=cells.map(i=>container.querySelector('[data-sym="'+i+'"]')?.parentElement).filter(Boolean);
  let items,disposed=false;
  return {
   configure(stop){
    if(items)return;
    items=plan({...options,column,stop});
    for(const item of items){
     const art=document.createElement('div');art.className='park-tape-symbol';art.dataset.tapeIndex=item.index;art.dataset.symbol=item.symbol;art.dataset.ticket=item.ticket;
     art.style.top=(item.index*PITCH+2)+'px';
     if(item.symbol<0)art.style.visibility='hidden';
     else if(item.symbol===14)art.classList.add('is-ray');
     else if(item.symbol===13)art.classList.add('is-tucker');
     else if(item.symbol===12)art.classList.add('is-tony');
     else if(item.ticket)art.classList.add('is-ticket');
     else art.style.backgroundPositionX=(item.symbol/11*100)+'%';
     film.append(art);
    }
    windows.forEach(n=>n.dataset.physicalMoving='true');
   },
   draw(position,velocity=0){
    if(disposed||!items)return;
    host.dataset.phase=position.toFixed(3);film.style.transform='translate3d(0,'+position.toFixed(3)+'px,0)';
    film.style.filter=velocity>.45?'blur('+Math.min(1.5,velocity*.8).toFixed(2)+'px)':'none';
    for(const art of film.children){const center=Number(art.dataset.tapeIndex)*PITCH+position+64;if(center < -90||center>HEIGHT+90)continue;
     const bend=Math.max(-1,Math.min(1,(192-center)/128));art.style.transform='perspective(520px) rotateX('+(bend*15).toFixed(3)+'deg) scaleY('+(1-Math.abs(bend)*.04).toFixed(4)+')';}
   },
   dispose(){if(disposed)return;disposed=true;host.remove();windows.forEach(n=>delete n.dataset.physicalMoving);}
  };
 }
 root.KingRicoReelTape={PITCH,HEIGHT,plan,create};
})(typeof window!=='undefined'?window:globalThis);
