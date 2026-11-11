import economy from '../../cloud/prize-tier.cjs';
// Presentation of a committed result. No RNG, wallet mutations or extra reward.
import {BOARDING_FRAMES,boardingAsset,boardingPose,celebrationPose,createBoardingActor} from './king-boarding.js';
const PLANE='/assets/circus/bonus-plane.webp',PILOT='/assets/king-rico/fw6/master.webp';
export function flightValue(amount,bet,progress){
 const p=Math.max(0,Math.min(1,progress)),multiple=Math.max(1,amount/bet);
 return {multiple:p===1?multiple:Math.pow(multiple,p),amount:p===1?amount:Math.min(amount,bet*Math.pow(multiple,p))};
}
export function flightAltitude(multiple,progress){return Math.max(0,Math.min(1,Math.log2(Math.max(5,multiple)/5)/Math.log2(20)))*Math.max(0,Math.min(1,progress));}
// One quadratic curve drives both the airplane heading and its visible trail.
export function flightCurve(width,height,startX,startY,progress){
 const p=Math.max(0,Math.min(1,progress)),ox=width*.04,oy=height*.84,ex=width*.76,ey=Math.max(210,height*.25),join=.6;
 const cx=(startX-(1-join)**2*ox-join**2*ex)/(2*(1-join)*join),cy=(startY-(1-join)**2*oy-join**2*ey)/(2*(1-join)*join);
 const t=join+(1-join)*(1-(1-p)**2),u=1-t,x=u*u*ox+2*u*t*cx+t*t*ex,y=u*u*oy+2*u*t*cy+t*t*ey;
 const angle=Math.atan2(u*(cy-oy)+t*(ey-cy),u*(cx-ox)+t*(ex-cx))*180/Math.PI;
 return {x,y,angle,path:`M ${ox} ${oy} Q ${ox+t*(cx-ox)} ${oy+t*(cy-oy)},${x} ${y}`,baseline:oy};
}
export function installBigWinFlight(fc){
 const nativePrize=fc.showPrize.bind(fc),nativeDismiss=fc.dismissWin.bind(fc),nativeSpin=fc.spin.bind(fc);
 for(const src of [PLANE,'/assets/circus/flight-scenery-atlas.webp','/assets/circus/flight-cloud-bank.webp',...BOARDING_FRAMES.map(boardingAsset)]){const image=new Image();image.src=src;image.decode?.().catch(()=>{});}
 fc.spin=()=>{if(!fc._parkBigWinFlight)nativeSpin();};
 fc.dismissWin=()=>{if(!fc._parkBigWinFlight)nativeDismiss();};
 fc.showPrize=(amount,title,then,chains,stake=fc.bet())=>{
  if(fc._parkBigWinFlight)return;
  const prizeTier=economy.tier(amount,stake);
  if(prizeTier.id==='regular')return nativePrize(amount,title,then,chains);
  const source=document.querySelector('.park-mascot [data-f="master"]');
  if(!source?.getBoundingClientRect().width)return nativePrize(amount,title,then,chains);
  const body=source.closest('[data-k=body]'),sourceRect=source.getBoundingClientRect(),previous=document.activeElement;
  const scene=document.createElement('div');scene.className='park-bigwin-flight';scene.dataset.phase='approach';
  scene.setAttribute('role','region');scene.setAttribute('aria-label','Voo do grande prêmio');
  scene.innerHTML=`<div class="park-bigwin-sky"><div class="park-flight-highsky"></div><div class="park-flight-space"><div class="park-flight-stars"></div></div><div class="park-flight-clouds"><i></i><i></i><i></i><i></i><i></i></div><div class="park-flight-clouds-near"><i></i><i></i></div></div><svg class="park-flight-trail" aria-hidden="true"><path class="park-flight-trail-area"></path><path class="park-flight-trail-line"></path></svg><div class="park-bigwin-plane"><div class="park-bigwin-propeller" aria-hidden="true"><i class="park-propeller-disc"></i><img class="park-propeller-rotor park-propeller-ghost" src="${PLANE}" alt=""><img class="park-propeller-rotor" src="${PLANE}" alt=""></div><img src="${PLANE}" alt="Avião do King Rico"><div class="park-bigwin-pilot" role="img" aria-label="King Rico pilotando" hidden></div><img class="park-bigwin-front" src="${PLANE}" alt=""></div><div class="park-bigwin-jumper" role="img" aria-label="King Rico pulando para o avião"></div><div class="park-bigwin-score" role="status"><span>${prizeTier.label}</span><b data-flight-amount></b></div>`;
  const inert=[...document.body.children].filter(e=>!e.matches('script,style')).map(e=>[e,e.inert]);inert.forEach(([e])=>e.inert=true);document.body.append(scene);
  const plane=scene.querySelector('.park-bigwin-plane'),pilot=scene.querySelector('.park-bigwin-pilot'),jumper=scene.querySelector('.park-bigwin-jumper'),score=scene.querySelector('.park-bigwin-score');
  const amountNode=scene.querySelector('[data-flight-amount]'),trail=scene.querySelector('.park-flight-trail-line'),trailArea=scene.querySelector('.park-flight-trail-area');
  const departure=[...body.querySelectorAll('[data-f]')].sort((a,b)=>Number(getComputedStyle(b).opacity)-Number(getComputedStyle(a).opacity))[0]?.src||PILOT;
  const jumpActor=createBoardingActor(jumper,departure),pilotActor=createBoardingActor(pilot);
  jumper.style.cssText=`width:${sourceRect.width}px;height:${sourceRect.height}px;transform:translate(${sourceRect.x}px,${sourceRect.y}px)`;
  const width=innerWidth,height=innerHeight,size=Math.min(260,width*.62,height*.33),catchX=sourceRect.x+sourceRect.width/2,catchY=Math.min(height*.53,sourceRect.bottom+65),endX=width*.76,endY=Math.max(210,height*.25);
  const maximum=amount/stake,climbDuration=6800+flightAltitude(maximum,1)*3000,resultAt=2600+climbDuration,returnAt=resultAt+2100,endAt=returnAt+800;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,speed=reduced ? .65 : 1;
  let frame,elapsed=0,last=performance.now(),ended=false,rank=-1,jumpStart;
  fc._parkBigWinFlight=true;fc._afterWin=then;fc._afterWinChains=!!chains;
  clearInterval(fc.counter);fc.setState({showWin:true,winTitle:title,winBigText:null,displayWin:0,winSub:'',coins:false,shake:'none'});
  plane.style.width=size+'px';plane.style.height=size+'px';
  const mascot=source.closest('.park-mascot'),originalMascotVisibility=mascot.style.visibility;
  const originalVisibility=body.style.visibility;body.style.visibility='hidden';
  scene.style.setProperty('--flight-amount-size',Math.min(96,width*.88/(('+'+fc.money(amount)).length*.55))+'px');
  function restore(){mascot.style.visibility=originalMascotVisibility;body.style.visibility=originalVisibility;inert.forEach(([e,v])=>e.inert=v);scene.remove();fc._parkBigWinFlight=false;if(previous?.isConnected)previous.focus({preventScroll:true});}
  function finish(){
   if(ended)return;ended=true;clearTimeout(safety);cancelAnimationFrame(frame);
   engine?.stop();engine=null;try{fc.sfxBank?.();}catch{}
   window.removeEventListener('pagehide',hide);
   restore();fc.setState({displayWin:amount});fc._parkPrizeOrigin=true;
   nativeDismiss();fc._parkPrizeOrigin=false;
  }
  // Independent of animation support, RAF throttling and image decoding.
  let engine=null;const safety=setTimeout(finish,20000);
  const lerp=(a,b,p)=>a+(b-a)*p,smooth=p=>p*p*(3-2*p),clamp=p=>Math.max(0,Math.min(1,p));
  const place=(x,y,angle,scale)=>{plane.style.transform=`translate(${x-size*.515}px,${y-size*.42}px) rotate(${angle}deg) scale(${scale})`;};
  function tick(now){
   if(ended)return;
   const dt=Math.min(100,now-last);last=now;if(!document.hidden)elapsed+=dt/speed;
   const t=elapsed;let x,y,angle=-12,scale=1;
   if(t<1500){const p=smooth(t/1500);x=lerp(-size*.6,catchX,p);y=lerp(height*.89,catchY,p);
    const pose=celebrationPose(t),scale=lerp(1,1.12,smooth(clamp(t/450))),w=sourceRect.width*scale,h=sourceRect.height*scale;
    jumpStart={x:sourceRect.x-(w-sourceRect.width)/2,y:sourceRect.bottom-h-pose.lift*h,width:w,height:h};
    jumpActor.pose(pose.frame,pose.sx,pose.sy,dt/1000);scene.dataset.phase=t>=1250?'anticipating':'approach';
    jumper.style.cssText=`width:${w}px;height:${h}px;transform:translate(${jumpStart.x}px,${jumpStart.y}px)`;
   }
   else if(t<2600){x=catchX;y=catchY;angle=-8;
    const p=clamp((t-1500)/1100),pw=size*.43,ph=pw,a=-8*Math.PI/180,dx=catchX+Math.cos(a)*size*.01-Math.sin(a)*size*(-.075)-pw/2,dy=catchY+Math.sin(a)*size*.01+Math.cos(a)*size*(-.075)-ph/2;
    scene.dataset.phase='boarding';jumper.hidden=false;
    const pose=boardingPose(p);jumpActor.pose(pose.frame,pose.sx,pose.sy,dt/1000);
    const from=jumpStart||sourceRect;
    jumper.style.cssText=`width:${lerp(from.width,pw,p)}px;height:${lerp(from.height,ph,p)}px;transform:translate(${lerp(from.x,dx,p)}px,${lerp(from.y,dy,p)-Math.sin(p*Math.PI)*(reduced?20:72)}px) rotate(${-8*p+Math.sin(p*Math.PI)*-14}deg)`;
   }else{
    if(pilot.hidden){try{fc.hap('winMid');fc.sfxTakeoff?.();engine=fc.sfxEngine?.()||null;}catch{}}
    mascot.style.visibility='hidden';jumper.hidden=true;pilot.hidden=false;scene.classList.add('is-climbing');score.classList.add('is-visible');
    const settle=clamp((t-2600)/300),compression=Math.sin(settle*Math.PI);
    pilotActor.pose('pilotSide',1+.02*compression-.008*Math.sin(t*.0022),1-.03*compression+.012*Math.sin(t*.0022),dt/1000);
    const p=clamp((t-2600)/climbDuration),altitude=flightAltitude(maximum,p),pose=flightCurve(width,height,catchX,catchY,p);
    scale=lerp(1,.42,smooth(p));x=pose.x;y=pose.y;angle=lerp(-8,pose.angle,smooth(clamp((t-2600)/650)));
    scene.style.setProperty('--flight-value-pulse',String(reduced?1:1+Math.sin(p*Math.PI*16)*.018));
    if(!reduced){trail.setAttribute('d',pose.path);trailArea.setAttribute('d',`${pose.path} L ${x} ${pose.baseline} Z`);}
    scene.style.setProperty('--flight-high',String(clamp(altitude*2)));
    scene.style.setProperty('--flight-space',String(smooth(clamp((altitude-.45)/.4))));
    scene.style.setProperty('--flight-cloud-y',(p*height*2.2)+'px');scene.style.setProperty('--flight-star-y',(p*height*.45)+'px');
    scene.style.setProperty('--flight-near-y',(p*height*3.2)+'px');
    scene.dataset.altitude=altitude>.72?'space':altitude>.3?'stratosphere':'sky';
    scene.dataset.phase=p<1?'climbing':'result';
    const value=flightValue(amount,stake,p);amountNode.textContent='+'+fc.money(Math.round(value.amount*100)/100);
    engine?.set(p);const n=Math.floor(p*12);if(n!==rank){rank=n;try{fc.sfxRoll(n);}catch{}}
    if(t>returnAt){scene.dataset.phase='returning';const p=smooth(clamp((t-returnAt)/800));x=lerp(endX,width+size,p);y=lerp(endY,-size*.5,p);scene.style.opacity=String(1-p);}
    if(t>=endAt){finish();return;}
   }
   place(x,y,angle,scale);frame=requestAnimationFrame(tick);
  }
  scene.querySelector('.park-bigwin-plane>img').onerror=finish;
  function hide(){if(!ended){ended=true;clearTimeout(safety);cancelAnimationFrame(frame);engine?.stop();restore();}}
  window.addEventListener('pagehide',hide,{once:true});
  frame=requestAnimationFrame(tick);
 };
}
