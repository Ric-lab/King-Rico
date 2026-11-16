import {colorAt,record} from './motion.js';
// All five outcomes and the debit are already in one immutable paid receipt.
// Raio do Good Luck (Claude): a tempestade escurece a tela, o raio sai das nuvens com a cor do líquido que acabou de
// sair da barra, pisca como raio de verdade e explode no botão com clarão branco → cor. Só visual; o tempo do impacto não muda.
// Sprites 9:16 com fundo preto (#000): o fundo some com mix-blend-mode:screen / 'lighter',
// gerando um halo largo na cor do líquido e núcleo branco mais fino perfeitamente alinhado.
const BOLT_SRCS=['/assets/machine/goodluck-bolt-1.webp','/assets/machine/goodluck-bolt-2.webp','/assets/machine/goodluck-bolt-3.webp'];
const BOLTS=BOLT_SRCS.map(src=>{const i=new Image();i.decoding='async';i.src=src;return i;});
const TINTED=new Map();
const boltLayers=(idx,color)=>{
 const img=BOLTS[idx];if(!img?.complete||!img.naturalWidth)return null;
 const key=idx+'|'+color;if(TINTED.has(key))return TINTED.get(key);
 const w=img.naturalWidth,h=img.naturalHeight;
 const outer=document.createElement('canvas'),og=outer.getContext('2d');outer.width=w;outer.height=h;
 const core=document.createElement('canvas'),cg=core.getContext('2d');core.width=w;core.height=h;
 try{
  og.drawImage(img,0,0,w,h);
  const src=og.getImageData(0,0,w,h),sd=src.data;
  og.fillStyle=color;og.fillRect(0,0,1,1);
  const cp=og.getImageData(0,0,1,1).data,cr=cp[0],cgv=cp[1],cb=cp[2];
  const oimg=og.createImageData(w,h),od=oimg.data;
  const cimg=cg.createImageData(w,h),cd=cimg.data;
  for(let i=0;i<sd.length;i+=4){
   const l=sd[i]/255;if(l<=.01){od[i+3]=cd[i+3]=255;continue;}
   const g=Math.pow(l,.65);
   od[i]=Math.min(255,cr*g*1.12);od[i+1]=Math.min(255,cgv*g*1.12);od[i+2]=Math.min(255,cb*g*1.12);od[i+3]=255;
   const k=l<=.78?0:Math.pow((l-.78)/.22,.9);
   const v=Math.round(255*k);
   cd[i]=cd[i+1]=cd[i+2]=v;cd[i+3]=255;
  }
  og.putImageData(oimg,0,0);cg.putImageData(cimg,0,0);
 }catch{
  og.drawImage(img,0,0,w,h);og.globalCompositeOperation='multiply';og.fillStyle=color;og.fillRect(0,0,w,h);og.globalCompositeOperation='source-over';
  cg.drawImage(img,0,0,w,h);
 }
 const pair={outer,core};TINTED.set(key,pair);return pair;
};
function strike(box,color,flight,reduced,nodes,animations){
 const W=innerWidth,H=innerHeight,cx=box.x+box.width/2,cy=box.y+box.height/2,T=flight+520;
 const add=el=>{document.body.append(el);nodes.push(el);return el;},A=(el,k,o)=>{try{const a=el.animate(k,o);animations.push(a);return a;}catch{}};
 const storm=add(document.createElement('div'));storm.className='park-gl-storm';storm.style.setProperty('--gl-x',cx+'px');storm.style.setProperty('--gl-c',color);
 if(!reduced)for(let i=0;i<8;i++){const c=document.createElement('i'),s=150+Math.random()*170;c.className='park-gl-cloud';c.style.cssText=`left:${i/7*W-s/2+(Math.random()-.5)*40}px;top:${-s*.5+Math.random()*40}px;width:${s}px;height:${s*.6}px`;storm.append(c);
  A(c,[{transform:'translateY(-70%) scale(.8)',opacity:0},{transform:'translateY(0) scale(1)',opacity:1}],{duration:340,delay:i*22,easing:'cubic-bezier(.2,.8,.3,1)',fill:'both'});}
 A(storm,[{opacity:0},{opacity:1,offset:reduced?.05:.45},{opacity:1,offset:(flight+120)/T},{opacity:0}],{duration:T,easing:'ease-out',fill:'both'});
 const cv=add(document.createElement('canvas')),dpr=Math.min(2,devicePixelRatio||1);cv.className='park-gl-bolt';cv.width=W*dpr;cv.height=H*dpr;cv.style.opacity=1;
 const x=cv.getContext('2d');x.scale(dpr,dpr);
 const dh=(cy-box.height*.04)/.945,dw=Math.min(W*.96,Math.max(240,dh*9/16*.84));
 const s0=reduced?0:flight-210,env=t=>reduced?(t<flight+60?1:Math.max(0,1-(t-flight-60)/200)):t<s0-150?0:t<s0-120?.4:t<s0-90?0:t<s0?(t-s0+90)/90:t<s0+60?1-.6*(t-s0)/60:t<s0+110?.4+.6*(t-s0-60)/50:t<flight+70?1:Math.max(0,1-(t-flight-70)/260);
 const t0=performance.now();let raf=0,last=0,idx=Math.floor(Math.random()*BOLTS.length);
 const frame=now=>{const t=now-t0,a=env(t);x.clearRect(0,0,W,H);
  if(a>0){if(now-last>48){last=now;idx=(idx+1)%BOLTS.length;}
   const layers=boltLayers(idx,color);
   x.globalCompositeOperation='lighter';
   if(layers){
    x.globalAlpha=.95*a;x.drawImage(layers.outer,cx-dw/2,0,dw,dh);
    x.globalAlpha=.92*a;x.drawImage(layers.core,cx-dw/2,0,dw,dh);
   }
   if(t>flight-30){const r=46+Math.random()*10,gd=x.createRadialGradient(cx,cy,0,cx,cy,r);gd.addColorStop(0,'#ffffff');gd.addColorStop(.35,color);gd.addColorStop(1,'rgba(0,0,0,0)');x.globalAlpha=a;x.fillStyle=gd;x.fillRect(cx-r,cy-r,r*2,r*2);}
   x.globalAlpha=1;x.globalCompositeOperation='source-over';}
  if(t<T)raf=requestAnimationFrame(frame);};
 raf=requestAnimationFrame(frame);animations.push({cancel:()=>cancelAnimationFrame(raf)});
 const flash=add(document.createElement('div')),tint=add(document.createElement('div'));flash.className=tint.className='park-gl-flash';flash.style.background='#fff';tint.style.background=`radial-gradient(circle at ${cx}px ${cy}px,${color} 0,${color}cc 30%,${color}00 85%)`;
 A(flash,[{opacity:0},{opacity:reduced?.35:.85,offset:.08},{opacity:0}],{duration:reduced?160:240,delay:flight-10,fill:'both'});
 A(tint,[{opacity:0},{opacity:.55,offset:.15},{opacity:0}],{duration:reduced?300:620,delay:flight,easing:'ease-out',fill:'both'});
 const ring=add(document.createElement('i'));ring.className='park-gl-ring';ring.style.cssText=`left:${cx}px;top:${cy}px;--gl-c:${color}`;
 A(ring,[{transform:'scale(.2)',opacity:1},{transform:'scale(3.4)',opacity:0}],{duration:520,delay:flight,easing:'cubic-bezier(.1,.7,.3,1)',fill:'both'});
 if(!reduced){for(let i=0;i<14;i++){const sp=add(document.createElement('i')),a=Math.random()*Math.PI*2,r=70+Math.random()*110;sp.className='park-gl-spark';sp.style.cssText=`left:${cx}px;top:${cy}px;--gl-c:${color}`;
   A(sp,[{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${Math.cos(a)*r}px,${Math.sin(a)*r*.7}px) scale(.2)`,opacity:0}],{duration:420+Math.random()*220,delay:flight,easing:'cubic-bezier(.15,.8,.3,1)',fill:'both'});}
  setTimeout(()=>{storm.classList.add('is-lit');setTimeout(()=>storm.classList.remove('is-lit'),110);},flight);
  const stage=document.querySelector('.park-circus-stage');if(stage)A(stage,[{translate:'0 0'},{translate:'-3px 2px'},{translate:'3px -2px'},{translate:'-2px 1px'},{translate:'0 0'}],{duration:260,delay:flight});}
}
export function installGoodLuckEnergy(fc,rails,{refresh}){
 let animations=[],nodes=[];
 const clean=()=>{animations.forEach(a=>{try{a.cancel();}catch{}});animations=[];nodes.forEach(n=>n.remove());nodes=[];};
 fc._parkBeginGoodLuck=(receipt,bet)=>{
  fc.danceClear();fc.reelsHalt();fc.stopWhirr();
  fc._goodLuckOpeningWin=receipt.outcome.res.win;fc._goodLuckWasAuto=fc.state.auto;fc._parkFeatureFill=10;
  fc._goodLuckEnergyLog=[];
  fc.setState({spinning:false,queued:false,spinCells:[],stopped:[],grid:receipt.outcome.grid.slice(),balance:receipt.balanceDebited??receipt.balanceBefore-bet,balPending:0,peaches:receipt.outcome.peaches,peachShownBase:null,peachShownAdd:0,winCells:[],winLines:[],winDim:false});
  record(fc,'goodluck:entry',{openingWin:fc._goodLuckOpeningWin});refresh();
  fc.startPeachFeature(bet);
 };
 fc.peachPress=go=>{
  clean();const left=fc.state.featLeft??5,from=left*2,to=Math.max(0,(left-1)*2),color=colorAt(from/10);
  fc.setState({featLeft:Math.max(0,left-1),featReady:false,pressed:null});fc._parkFeatureFill=to;
  const index=6-left;fc._goodLuckEnergyLog.push({index,from,to,color,at:performance.now()});record(fc,'goodluck:charge',{index,from,to,color});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduced?280:650;
  for(const tube of rails.querySelectorAll('.park-meter')){
   tube.style.setProperty('--park-pour-color',colorAt(to/10));
   const fill=tube.querySelector('.park-meter-fill'),h=tube.querySelector('.park-meter-track').clientHeight;
   try{const a=fill.animate([{height:h*from/10+'px'},{height:h*to/10+'px'}],{duration,easing:'ease-in-out',fill:'both'});animations.push(a);a.finished.then(()=>a.cancel()).catch(()=>{});}catch{}
  }
  refresh();
  const button=document.querySelector('[data-spin-btn]'),box=button?.getBoundingClientRect();
  const flight=reduced?300:640;let landed=false;
  const hit=()=>{if(landed)return;landed=true;
   record(fc,'goodluck:impact',{index});
   fc.setState({pressed:'spin'});fc._spinTouchDown?.();
   try{fc.click(true);fc.hap('impact');}catch{}
   fc.later(()=>{fc.click(false);fc._spinTouchUp?.();fc.setState({pressed:null});go();},220);
  };
  if(box)try{strike(box,color,flight,reduced,nodes,animations);}catch{}
  fc.later(hit,flight);

 };
 const end=fc.endFeature.bind(fc);fc.endFeature=(...args)=>{clean();fc._parkFeatureFill=0;fc._parkAfterGoodLuck=true;fc._parkMeterLevel=0;fc._parkShown=0;fc.setState({auto:!!fc._goodLuckWasAuto});const result=end(...args);refresh();return result;};
 window.addEventListener('pagehide',clean,{once:true});
}
