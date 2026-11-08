// Presentation of a committed result. No RNG, wallet mutations or extra reward.
import {BOARDING_FRAMES,boardingAsset,boardingPose,createBoardingActor} from './king-boarding.js';
const PLANE='/assets/circus/bonus-plane.webp',PILOT='/assets/king-rico/fw6/master.webp';
export function flightValue(amount,bet,progress){
 const p=Math.max(0,Math.min(1,progress)),multiple=Math.max(1,amount/bet);
 return {multiple:p===1?multiple:Math.pow(multiple,p),amount:p===1?amount:Math.min(amount,bet*Math.pow(multiple,p))};
}
export function installBigWinFlight(fc){
 const nativePrize=fc.showPrize.bind(fc),nativeDismiss=fc.dismissWin.bind(fc),nativeSpin=fc.spin.bind(fc);
 for(const src of [PLANE,...BOARDING_FRAMES.map(boardingAsset)]){const image=new Image();image.src=src;image.decode?.().catch(()=>{});}
 fc.spin=()=>{if(!fc._parkBigWinFlight)nativeSpin();};
 fc.dismissWin=()=>{if(!fc._parkBigWinFlight)nativeDismiss();};
 fc.showPrize=(amount,title,then,chains)=>{
  if(fc._parkBigWinFlight)return;
  if(amount<fc.bet()*5)return nativePrize(amount,title,then,chains);
  const source=document.querySelector('.park-mascot [data-f="master"]');
  if(!source?.getBoundingClientRect().width)return nativePrize(amount,title,then,chains);
  const body=source.closest('[data-k=body]'),sourceRect=source.getBoundingClientRect(),previous=document.activeElement;
  const scene=document.createElement('div');scene.className='park-bigwin-flight';scene.dataset.phase='approach';
  scene.setAttribute('role','region');scene.setAttribute('aria-label','Voo do grande prêmio');
  scene.innerHTML=`<div class="park-bigwin-sky"><i></i><i></i><i></i></div><div class="park-bigwin-plane"><img src="${PLANE}" alt="Avião do King Rico"><div class="park-bigwin-pilot" role="img" aria-label="King Rico pilotando" hidden></div><img class="park-bigwin-front" src="${PLANE}" alt=""></div><div class="park-bigwin-jumper" role="img" aria-label="King Rico pulando para o avião"></div><div class="park-bigwin-score" role="status"><span>GRANDE PRÊMIO</span><strong data-flight-multiple>×1</strong><b data-flight-amount></b></div>`;
  const inert=[...document.body.children].filter(e=>!e.matches('script,style')).map(e=>[e,e.inert]);inert.forEach(([e])=>e.inert=true);document.body.append(scene);
  const plane=scene.querySelector('.park-bigwin-plane'),pilot=scene.querySelector('.park-bigwin-pilot'),jumper=scene.querySelector('.park-bigwin-jumper'),score=scene.querySelector('.park-bigwin-score');
  const amountNode=scene.querySelector('[data-flight-amount]'),multipleNode=scene.querySelector('[data-flight-multiple]');
  const departure=[...body.querySelectorAll('[data-f]')].sort((a,b)=>Number(getComputedStyle(b).opacity)-Number(getComputedStyle(a).opacity))[0]?.src||PILOT;
  const jumpActor=createBoardingActor(jumper,departure),pilotActor=createBoardingActor(pilot);
  jumper.style.cssText=`width:${sourceRect.width}px;height:${sourceRect.height}px;transform:translate(${sourceRect.x}px,${sourceRect.y}px)`;
  const width=innerWidth,height=innerHeight,size=Math.min(300,width*.78,height*.36),catchX=sourceRect.x+sourceRect.width/2,catchY=Math.min(height*.53,sourceRect.bottom+65),endX=width*.65,endY=Math.max(185,height*.24);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,speed=reduced ? .65 : 1;
  let frame,elapsed=0,last=performance.now(),ended=false,rank=-1;
  fc._parkBigWinFlight=true;fc._afterWin=then;fc._afterWinChains=!!chains;
  clearInterval(fc.counter);fc.setState({showWin:true,winTitle:title,winBigText:null,displayWin:0,winSub:'',coins:false,shake:'none'});
  plane.style.width=size+'px';plane.style.height=size+'px';
  const originalVisibility=body.style.visibility;body.style.visibility='hidden';
  function restore(){body.style.visibility=originalVisibility;inert.forEach(([e,v])=>e.inert=v);scene.remove();fc._parkBigWinFlight=false;if(previous?.isConnected)previous.focus({preventScroll:true});}
  function finish(){
   if(ended)return;ended=true;clearTimeout(safety);cancelAnimationFrame(frame);
   window.removeEventListener('pagehide',hide);
   restore();fc.setState({displayWin:amount});fc._parkPrizeOrigin=true;
   nativeDismiss();fc._parkPrizeOrigin=false;
  }
  // Independent of animation support, RAF throttling and image decoding.
  const safety=setTimeout(finish,15000);
  const lerp=(a,b,p)=>a+(b-a)*p,smooth=p=>p*p*(3-2*p),clamp=p=>Math.max(0,Math.min(1,p));
  const place=(x,y,angle)=>{plane.style.transform=`translate(${x-size*.515}px,${y-size*.42}px) rotate(${angle}deg)`;};
  function tick(now){
   if(ended)return;
   const dt=Math.min(100,now-last);last=now;if(!document.hidden)elapsed+=dt/speed;
   const t=elapsed;let x,y,angle=-12;
   if(t<1500){const p=smooth(t/1500);x=lerp(-size*.6,catchX,p);y=lerp(height*.89,catchY,p);if(t>=1200){scene.dataset.phase='anticipating';const pose=boardingPose(-1);jumpActor.pose(pose.frame,pose.sx,pose.sy,dt/1000);}}
   else if(t<2600){x=catchX;y=catchY;angle=-8;
    const p=clamp((t-1500)/1100),pw=size*.31,ph=pw,a=-8*Math.PI/180,dx=catchX+Math.cos(a)*size*.01-Math.sin(a)*size*(-.045)-pw/2,dy=catchY+Math.sin(a)*size*.01+Math.cos(a)*size*(-.045)-ph/2;
    scene.dataset.phase='boarding';jumper.hidden=false;
    const pose=boardingPose(p);jumpActor.pose(pose.frame,pose.sx,pose.sy,dt/1000);
    jumper.style.cssText=`width:${lerp(sourceRect.width,pw,p)}px;height:${lerp(sourceRect.height,ph,p)}px;transform:translate(${lerp(sourceRect.x,dx,p)}px,${lerp(sourceRect.y,dy,p)-Math.sin(p*Math.PI)*(reduced?20:72)}px) rotate(${-8*p+Math.sin(p*Math.PI)*-14}deg)`;
   }else{
    if(pilot.hidden)try{fc.hap('winMid');}catch{}
    jumper.hidden=true;pilot.hidden=false;scene.classList.add('is-climbing');score.classList.add('is-visible');
    const settle=clamp((t-2600)/300),compression=Math.sin(settle*Math.PI);
    pilotActor.pose('pilotSide',1+.02*compression-.008*Math.sin(t*.0022),1-.03*compression+.012*Math.sin(t*.0022),dt/1000);
    const p=clamp((t-2600)/4200),e=smooth(p);x=lerp(catchX,endX,e);y=lerp(catchY,endY,e);angle=lerp(-8,-16,e);
    scene.dataset.phase=p<1?'climbing':'result';
    const value=flightValue(amount,fc.bet(),p);multipleNode.textContent='×'+value.multiple.toLocaleString('pt-BR',{maximumFractionDigits:2});amountNode.textContent='+'+fc.money(Math.round(value.amount*100)/100);
    const n=Math.floor(p*12);if(n!==rank){rank=n;try{fc.sfxRoll(n);}catch{}}
    if(t>8700){scene.dataset.phase='returning';const p=smooth(clamp((t-8700)/800));x=lerp(endX,width+size,p);y=lerp(endY,-size*.5,p);scene.style.opacity=String(1-p);}
    if(t>=9500){finish();return;}
   }
   place(x,y,angle);frame=requestAnimationFrame(tick);
  }
  scene.querySelector('.park-bigwin-plane>img').onerror=finish;
  function hide(){if(!ended){ended=true;clearTimeout(safety);cancelAnimationFrame(frame);restore();}}
  window.addEventListener('pagehide',hide,{once:true});
  frame=requestAnimationFrame(tick);
 };
}
