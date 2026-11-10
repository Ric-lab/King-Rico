// The original Wheel.tick timbre, driven by the bonus rotor's actual angle.
// Audio is decorative: never owns the lottery, animation or collection timing.
export function createWheelSound(fc,rotor,segments){
 const step=360/segments;let frame=0,previous,travel=0,lastTime=0,lastTick=-Infinity,active=false;
 const angle=()=>{const m=new DOMMatrix(getComputedStyle(rotor).transform);return Math.atan2(m.b,m.a)*180/Math.PI;};
 function stop(){active=false;cancelAnimationFrame(frame);window.removeEventListener('pagehide',stop);}
 function tick(now){
  if(!active||!rotor.isConnected){stop();return;}
  try{
   const current=angle(),delta=((current-previous+540)%360)-180,old=Math.floor((travel+step/2)/step);
   travel+=delta;previous=current;
   const changed=Math.floor((travel+step/2)/step)!==old,dt=Math.max(1,now-lastTime);
   if(changed&&!document.hidden&&now-lastTick>=35&&fc.state.sound&&(fc.state.sfxLvl??2)>0){
    lastTick=now;const speed=Math.min(1,Math.abs(delta)*1000/dt/900);
    // Same short wooden click used by Fortune Wheel, through Circus's volume bus.
    fc.tone(620+speed*420,.026,'triangle',.075);
    fc.tone(170+speed*90,.018,'sine',.055);
   }
   lastTime=now;
  }catch{/* Missing audio/DOM support must never interrupt the bonus. */}
  frame=requestAnimationFrame(tick);
 }
 function start(){
  if(active)return;
  try{fc.ac();previous=angle();travel=previous;lastTime=performance.now();lastTick=-Infinity;}
  catch{return;}
  active=true;window.addEventListener('pagehide',stop,{once:true});frame=requestAnimationFrame(tick);
 }
 return {start,stop};
}
