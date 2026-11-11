// Tique ORIGINAL da Wheel (o mesmo som que era gerado por código), agora gravado em arquivos:
// assets/sfx/wheel-tick-0..4.wav = velocidades 0, .25, .5, .75, 1 (renderizados de fc.tone 620+420v triangle + 170+90v sine).
// Audio is decorative: never owns the lottery, animation or collection timing.
const ticks=[];let loading=null;
function loadTicks(ac){if(loading||!ac)return;loading=Promise.all([0,1,2,3,4].map(i=>fetch('/assets/sfx/wheel-tick-'+i+'.wav').then(r=>r.arrayBuffer()).then(b=>new Promise((ok,no)=>ac.decodeAudioData(b,ok,no))).then(b=>{ticks[i]=b;}))).catch(()=>{loading=null;});}
function playTick(fc,speed){const ac=fc.ac(),out=fc.out();if(!ac||!out)return false;loadTicks(ac);const b=ticks[Math.round(speed*4)];if(!b)return false;
 const s=ac.createBufferSource();s.buffer=b;s.connect(out);s.start();return true;}
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
    if(!playTick(fc,speed)){fc.tone(620+speed*420,.026,'triangle',.075);fc.tone(170+speed*90,.018,'sine',.055);}
   }
   lastTime=now;
  }catch{/* Missing audio/DOM support must never interrupt the bonus. */}
  frame=requestAnimationFrame(tick);
 }
 function start(){
  if(active)return;
  try{loadTicks(fc.ac());previous=angle();travel=previous;lastTime=performance.now();lastTick=-Infinity;}
  catch{return;}
  active=true;window.addEventListener('pagehide',stop,{once:true});frame=requestAnimationFrame(tick);
 }
 return {start,stop};
}
