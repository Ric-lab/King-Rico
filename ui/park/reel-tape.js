/* Nine independent drums. Every tape repeats the paytable sequence without patches. */
(function(root){
 const PITCH=128,HEIGHT=146,WINDOW_HEIGHT=132,SYMBOL_HEIGHT=116; // The slot pitch includes the recessed gap.
 const mod=(n,d)=>(n%d+d)%d;
 function stopFor({from,target,order,near}){
  const start=order.indexOf(from),end=order.indexOf(target);
  if(start<0||end<0)throw Error('Symbol missing from the reel sequence');
  const offset=mod(end-start,order.length);
  const turns=Math.max(1,Math.round((near/PITCH-offset)/order.length));
  return (turns*order.length+offset)*PITCH;
 }
 function plan({cell,from,target,stop,order}){
  const start=order.indexOf(from[cell]),items=[];
  if(start<0)throw Error('Initial symbol missing from the reel sequence');
  for(let index=-Math.round(stop/PITCH)-2;index<=2;index++){
   const symbol=order[mod(start-index,order.length)];
   items.push(Object.freeze({index,symbol,ticket:symbol===10}));
  }
  const last=items.find(item=>item.index===-Math.round(stop/PITCH));
  if(last.symbol!==target[cell])throw Error('Reel stop does not match the committed symbol');
  return Object.freeze(items);
 }
 // The printed tape bends over a small front cylinder; logical stops stay unchanged.
 const GLYPH_WIDTH=97.17278,RADIUS=95.04,BANDS=24;
 function projectBand(top,bottom){
  const limit=Math.PI*RADIUS/2,a=Math.max(-limit,top),b=Math.min(limit,bottom);
  if(b<=a)return null;
  return {top:RADIUS*Math.sin(a/RADIUS),bottom:RADIUS*Math.sin(b/RADIUS),
   width:.96+.04*Math.cos((a+b)/(2*RADIUS)),from:(a-top)/(bottom-top),to:(b-top)/(bottom-top)};
 }
 let ready,atlas,ticket;const textures=new Map();
 function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Reel image unavailable'));im.src=src;});}
 function assets(){
  if(!ready)ready=Promise.all([loadImage('/assets/symbols-v7.webp'),loadImage('/assets/machine/ticket-symbol-v1.webp')]).then(images=>{
   [atlas,ticket]=images;for(let symbol=0;symbol<12;symbol++)texture(symbol);return true;
  });
  return ready;
 }
 function texture(symbol){
  if(textures.has(symbol))return textures.get(symbol);
  const c=document.createElement('canvas');c.width=Math.round(GLYPH_WIDTH*2);c.height=SYMBOL_HEIGHT*2;
  const ctx=c.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
  if(symbol===10){const scale=Math.min(c.width/ticket.naturalWidth,c.height/ticket.naturalHeight),w=ticket.naturalWidth*scale,h=ticket.naturalHeight*scale;ctx.drawImage(ticket,(c.width-w)/2,(c.height-h)/2,w,h);}
  else ctx.drawImage(atlas,symbol*atlas.naturalWidth/12,0,atlas.naturalWidth/12,atlas.naturalHeight,0,0,c.width,c.height);
  textures.set(symbol,c);return c;
 }
 function surface(width,height,className){
  const canvas=document.createElement('canvas'),ratio=Math.min(2,root.devicePixelRatio||1);
  canvas.className=className;canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);canvas.setAttribute('aria-hidden','true');
  let ctx;try{ctx=canvas.getContext('2d');}catch{return null;}if(!ctx)return null;
  ctx.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  return {canvas,ctx,width,height};
 }
 function glyph(s,symbol,arcCenter){
  if(symbol<0||Math.abs(arcCenter)>Math.PI*RADIUS/2+SYMBOL_HEIGHT/2)return;
  const image=textures.get(symbol);if(!image)return;
  for(let band=0;band<BANDS;band++){
   const top=-SYMBOL_HEIGHT/2+band*SYMBOL_HEIGHT/BANDS,bottom=top+SYMBOL_HEIGHT/BANDS,p=projectBand(arcCenter+top,arcCenter+bottom);
   if(!p)continue;
   const width=GLYPH_WIDTH*p.width,sy=(band+p.from)*image.height/BANDS,sh=(p.to-p.from)*image.height/BANDS;
   s.ctx.drawImage(image,0,sy,image.width,sh,(s.width-width)/2,s.height/2+p.top,width,p.bottom-p.top+.28);
  }
 }
 function installIdle(container){
  if(!container||container.dataset.cylinderIdle)return;
  container.dataset.cylinderIdle='1';
  const faces=[...container.querySelectorAll('[data-sym]')],surfaces=new Map(),failed=new WeakSet();let available=false;
  function paint(node){
   if(!available)return;
   const symbol=node.dataset.parkTicket==='true'?10:Math.round(parseFloat(node.style.backgroundPositionX)*11/100);
   if(!Number.isInteger(symbol)||symbol<0||symbol>11)return;
   let s=surfaces.get(node);if(s?.symbol===symbol&&node.contains(s.canvas))return;
   if(s&&!node.contains(s.canvas))node.append(s.canvas);
   if(!s){s=surface(GLYPH_WIDTH,SYMBOL_HEIGHT,'park-cylinder-idle');if(!s)return;surfaces.set(node,s);node.append(s.canvas);}
   s.ctx.clearRect(0,0,s.width,s.height);glyph(s,symbol,0);s.symbol=symbol;s.canvas.dataset.symbol=symbol;node.dataset.cylinderReady='1';
  }
  const safePaint=node=>{if(failed.has(node))return;try{paint(node);}catch{failed.add(node);delete node.dataset.cylinderReady;surfaces.get(node)?.canvas.remove();surfaces.delete(node);}};
  const observer=new MutationObserver(changes=>{for(const {target}of changes)safePaint(target);});
  for(const node of faces)observer.observe(node,{attributes:true,childList:true,attributeFilter:['style','data-park-ticket']});
  assets().then(()=>{available=true;faces.forEach(safePaint);}).catch(()=>{}); // Original sprites remain the fallback.
  root.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
 }
 function create(container,cell,options){
  const host=document.createElement('div'),film=document.createElement('div');
  host.className='park-physical-reel';host.dataset.cell=cell;
  host.style.left=(29.5+(cell%3)*134)+'px';host.style.top=(226.5+Math.floor(cell/3)*HEIGHT)+'px';
  film.className='park-physical-film';host.append(film);container.append(host);
  const curved=surface(126,WINDOW_HEIGHT,'park-cylinder-motion');let available=false;
  if(curved){curved.canvas.hidden=true;host.append(curved.canvas);assets().then(()=>{if(!disposed)available=true;}).catch(()=>{});}
  const window=container.querySelector('[data-sym="'+cell+'"]')?.parentElement;
  let items,disposed=false;
  return {
   configure(stop){
    if(items)return;
    items=plan({...options,cell,stop});
    for(const item of items){
     const art=document.createElement('div');art.className='park-tape-symbol';art.dataset.tapeIndex=item.index;art.dataset.symbol=item.symbol;
     art.style.top=(item.index*HEIGHT+(WINDOW_HEIGHT-SYMBOL_HEIGHT)/2)+'px';
     if(item.symbol<0)art.style.visibility='hidden';
     else if(item.ticket)art.classList.add('is-ticket');
     else art.style.backgroundPositionX=(item.symbol/11*100)+'%';
     film.append(art);
    }
    if(window)window.dataset.physicalMoving='true';
   },
   draw(position,velocity=0){
    if(disposed||!items)return;
    host.dataset.phase=position.toFixed(3);
    if(available&&curved){try{
     curved.canvas.hidden=false;film.hidden=true;curved.ctx.clearRect(0,0,curved.width,curved.height);
     for(const item of items)glyph(curved,item.symbol,(item.index+position/PITCH)*HEIGHT);
     curved.canvas.style.filter=velocity>.6?'blur('+Math.min(.55,velocity*.12).toFixed(2)+'px)':'none';return;
    }catch{available=false;curved.canvas.hidden=true;film.hidden=false;host.dataset.cylinderFallback='1';}}
    film.style.transform='translate3d(0,'+(position*HEIGHT/PITCH).toFixed(3)+'px,0)';
    film.style.filter=velocity>.45?'blur('+Math.min(1.5,velocity*.65).toFixed(2)+'px)':'none';
    for(const art of film.children){const center=Number(art.dataset.tapeIndex)*HEIGHT+position*HEIGHT/PITCH+WINDOW_HEIGHT/2;if(center < -90||center>WINDOW_HEIGHT+90)continue;
     const bend=Math.max(-1,Math.min(1,(WINDOW_HEIGHT/2-center)/WINDOW_HEIGHT));art.style.transform='perspective(520px) rotateX('+(bend*22).toFixed(3)+'deg) scaleY('+(1-Math.abs(bend)*.08).toFixed(4)+')';}
   },
   dispose(){if(disposed)return;disposed=true;host.remove();if(window)delete window.dataset.physicalMoving;}
  };
 }
 root.KingRicoReelTape={PITCH,HEIGHT,RADIUS,projectBand,stopFor,plan,create,installIdle};
})(typeof window!=='undefined'?window:globalThis);
