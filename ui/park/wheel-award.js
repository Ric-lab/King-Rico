import {record} from './motion.js';
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
export function holdMultiplier(source,multiplier){
 const bounds=source.getBoundingClientRect(),node=document.createElement('b');
 node.className='park-flying-multiplier';node.textContent='×'+multiplier;node.setAttribute('aria-hidden','true');
 const scale=Math.max(.3,bounds.height/64);
 node.style.transform=`translate(${bounds.x+bounds.width/2-70}px,${bounds.y+bounds.height/2-45}px) scale(${scale})`;
 document.body.append(node);source.style.visibility='hidden';
 return {bounds,node};
}
export async function applyMultiplier(fc,w,source){
 const base=w.baseUnits/100,total=w.result.winUnits/100,target=fc._parkPrizeTarget;
 const origin=source?.bounds||source;
 record(fc,'multiplier:start',{multiplier:w.result.multiplier,base,total,originX:origin?.x+origin?.width/2,originY:origin?.y+origin?.height/2});
 const end=target?.getBoundingClientRect();let node=source?.node,animation,timer;source=source?.bounds||source;
 try{
  if(source?.width&&end?.width){
   if(!node){node=document.createElement('b');node.className='park-flying-multiplier';node.textContent='×'+w.result.multiplier;node.setAttribute('aria-hidden','true');document.body.append(node);}
   const sx=source.x+source.width/2,sy=source.y+source.height/2,tx=end.x+end.width/2,ty=end.y+end.height/2;
   const startScale=Math.max(.3,source.height/64),endScale=Math.max(.25,Math.min(.6,end.height/80));
   // A brief lift, a smooth arc, then a precise arrival on the prize.
   const frames=Array.from({length:31},(_,i)=>{const t=i/30,u=Math.max(0,(t-.1)/.9),v=u*u*(3-2*u),q=1-v,arc=reduced()?0:Math.sin(v*Math.PI),x=q*sx+v*tx+arc*32,y=q*sy+v*ty-arc*60,scale=startScale+(endScale-startScale)*v+arc*.16+(t<.1&&!reduced()?Math.sin(t/.1*Math.PI)*.08:0);return {transform:`translate(${x-70}px,${y-45}px) rotate(${-arc*8}deg) scale(${scale})`,opacity:1,offset:t};});
   const duration=reduced()?650:1550;animation=node.animate(frames,{duration,easing:'linear',fill:'both'});
   await Promise.race([animation.finished.catch(()=>{}),new Promise(r=>timer=setTimeout(r,duration+300))]);
  }
 }catch{/* The authoritative prize is already saved. */}
 finally{clearTimeout(timer);animation?.cancel();node?.remove();}
 record(fc,'multiplier:landed',{multiplier:w.result.multiplier});
 if(!reduced())try{target?.animate([{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(1.18)',filter:'brightness(1.65)',offset:.3},{transform:'scale(1)',filter:'brightness(1)'}],{duration:470,easing:'ease-out'});}catch{}
 // Count from the prize already on the machine, rather than restarting at zero.
 await new Promise(resolve=>{
  if(reduced()||base===total){fc.setState({displayWin:total,barWin:total},resolve);return;}
  const start=performance.now();let ended=false,last=0;
  const finish=()=>{if(ended)return;ended=true;clearTimeout(safety);fc.setState({displayWin:total,barWin:total},resolve);};
  const safety=setTimeout(finish,1450);
  const tick=now=>{if(ended)return;const t=Math.min(1,(now-start)/950);if(now-last>30){last=now;fc.setState({displayWin:Math.round((base+(total-base)*(1-(1-t)**2))*100)/100});}if(t<1)requestAnimationFrame(tick);else finish();};requestAnimationFrame(tick);
 });
 record(fc,'prize:multiplied',{amount:total});
 if(!reduced())await new Promise(r=>setTimeout(r,300));
}
export function flyMultipliedPrize(fc,w,flight,player){
 const total=w.result.winUnits/100;let ended=false,timer;
 const finish=()=>{if(ended)return;ended=true;clearTimeout(timer);fc._cfRun=false;fc._cf?.draw([]);fc._parkPrizeOrigin=false;fc._parkCollecting=false;fc._parkWheelVisible=false;fc.setState({balPending:0});record(fc,'bonus-coins:done',{amount:total});flight?.done();fc._cloudDeferred=player();fc.applyCloudPlayer();};
 fc._parkPrizeOrigin=true;record(fc,'bonus-coins:start',{amount:total,originY:196});
 timer=setTimeout(finish,6500);
 try{fc._parkOriginalFly(total,finish);}catch{finish();}
}
