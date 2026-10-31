const STOPS=[[0,[142,36,255]],[.13,[104,48,255]],[.27,[23,79,255]],[.40,[0,207,255]],[.54,[0,242,123]],[.70,[228,255,0]],[.86,[255,148,0]],[1,[255,21,94]]];
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
export function record(fc,type,details={}){const log=fc._parkMotionLog ||= [];log.push({type,at:performance.now(),...details});if(log.length>80)log.shift();}
function colorAt(v){const i=Math.max(1,STOPS.findIndex(([p])=>p>=v)),a=STOPS[i-1],b=STOPS[i],t=Math.max(0,Math.min(1,(v-a[0])/(b[0]-a[0])));return `rgb(${a[1].map((c,j)=>Math.round(c+(b[1][j]-c)*t)).join(',')})`;}
export function installMotion(fc,rails,{refresh,showWheel}){
 fc._parkMeterLevel=window.KingRicoPark.state.spins;fc._parkVisibleTickets=window.KingRicoPark.state.tickets;
 const syncColor=level=>{rails.querySelectorAll('.park-meter').forEach(t=>{t.style.setProperty('--park-pour-color',colorAt(Math.max(.05,level/10)));t.classList.toggle('is-empty',level===0);});};syncColor(fc._parkMeterLevel);
 const nativePulse=fc.lightsPulse.bind(fc);let pulseNo=0,lastPulse=0,queuedCharge;
 fc.lightsPulse=(delay=0)=>{fc._parkPulse={at:performance.now(),delay,seq:++pulseNo};nativePulse(delay);schedule();};
 const nativeBusy=fc.isCeleb.bind(fc);fc.isCeleb=(...args)=>!!(fc._parkTicketsPlaying||fc._parkWheelVisible)||nativeBusy(...args);
 const nativeSpin=fc.doSpin.bind(fc);fc.doSpin=(...args)=>{if(fc._parkTicketsPlaying){fc._parkAutoAfterTickets=!!fc.state.auto;return;}return nativeSpin(...args);};
 const nativePayout=fc.payout.bind(fc);fc.payout=(res,...args)=>{nativePayout(res,...args);if(fc._parkTicketAward&&res.win<=0)flyTickets(fc,refresh);};
 fc._parkChargeConfirmed=(before,response,actual)=>{
  if(!actual){fc._parkMeterLevel=response.park.spins;fc._parkVisibleTickets=response.park.tickets;syncColor(response.park.spins);refresh();return;}
  if(response.ticket){fc._parkTicketAward={before:response.park.tickets-3,after:response.park.tickets,cells:response.outcome.grid.flatMap((v,i)=>v===10?[i]:[])};fc._parkVisibleTickets=response.park.tickets-3;}
  queuedCharge={before,target:response.park.spins};fc._parkMeterBusy=true;
  const pending=queuedCharge;pending.fallback=setTimeout(()=>{if(queuedCharge===pending){fc._parkPulse={at:performance.now(),delay:0,seq:++pulseNo};schedule();}},450);
  schedule();
 };
 function schedule(){
  const cue=fc._parkPulse;
  if(!queuedCharge||!cue||cue.seq<=lastPulse)return;
  const charge=queuedCharge;queuedCharge=null;clearTimeout(charge.fallback);lastPulse=cue.seq;
  const tubes=[...rails.querySelectorAll('.park-meter')],animations=[],timers=[];let done=false,finished=0;
  const finish=()=>{if(done)return;done=true;timers.forEach(clearTimeout);animations.forEach(a=>a.cancel());tubes.forEach(t=>t.classList.remove('is-pouring'));fc._parkMeterBusy=false;fc._parkMeterLevel=charge.target;rails.style.setProperty('--park-fill',charge.target*10+'%');refresh();record(fc,'charge:done',{level:charge.target});if(charge.target===10)celebrateFull();};
  for(const [side,tube]of tubes.entries()){
   const fill=tube.querySelector('.park-meter-fill'),stream=tube.querySelector('.park-liquid-stream'),drops=[...tube.querySelectorAll('.park-liquid-drop')];
   const h=334,from=h*charge.before/10,to=h*charge.target/10,x=side===0?17:436,y=254+h-from;
   // The exact origin, distance and propagation speed used by Circus.lightsPulse.
   const arrival=cue.at+Number(cue.delay||0)+Math.hypot(x-223.5,y-722)/2.2;
   const delay=Math.max(0,arrival-performance.now()),pourLead=Math.min(150,delay),startDelay=Math.max(0,delay-pourLead);
   record(fc,'charge:scheduled',{side,arrival,level:charge.target,pulse:cue.at,pulseDelay:cue.delay,surfaceY:y});
   const color=colorAt(Math.min(1,charge.target/10));tube.style.setProperty('--park-pour-color',color);
   tube.classList.remove('is-empty');
   stream.style.height=Math.max(4,h-from)+'px';drops.forEach(d=>d.style.top=(h-from-2)+'px');
   if(!reduced())try{
    // A short impact, sustained incoming volume, then a damped surface.
    // The old rainbow stays fixed in the glass; only the new top layer is stirred.
    const a=fill.animate([{height:from+'px'},{height:(from+2)+'px',offset:.08},{height:Math.min(h,to+2.5)+'px',offset:.68},{height:Math.max(from,to-1.5)+'px',offset:.83},{height:to+'px'}],{delay,duration:1050,easing:'linear',fill:'both'});animations.push(a);
    a.finished.then(()=>{if(++finished===2)finish();}).catch(()=>{});
    const streamDuration=pourLead+850,impactOffset=Math.max(.025,pourLead/streamDuration);
    animations.push(stream.animate([{clipPath:'inset(0 0 100% 0 round 3px)',opacity:0},{clipPath:'inset(0 0 0% 0 round 3px)',opacity:1,offset:impactOffset},{clipPath:'inset(0 0 0% 0 round 3px)',opacity:.95,offset:.72},{clipPath:'inset(100% 0 0 0 round 3px)',opacity:0}],{delay:startDelay,duration:streamDuration,fill:'both'}));
    const cap=fill.querySelector('.park-liquid-cap');if(cap)animations.push(cap.animate([{height:'0px',opacity:0},{height:'14px',opacity:.85,offset:.22},{height:'20px',opacity:.7,offset:.62},{height:'8px',opacity:0}],{delay,duration:1050,fill:'both'}));
    const surface=fill.querySelector('.park-liquid-surface');if(surface)animations.push(surface.animate([{transform:'translateY(0) scaleY(.6)'},{transform:'translateY(-1px) scaleY(1.6)',offset:.15},{transform:'translateY(.5px) scaleY(.7)',offset:.35},{transform:'translateY(-.5px) scaleY(1.2)',offset:.6},{transform:'translateY(0) scaleY(1)'}],{delay,duration:1050,fill:'both'}));
    drops.forEach((d,i)=>animations.push(d.animate([{transform:'translate(0,0) scale(.3)',opacity:0},{opacity:1,offset:.12},{transform:`translate(${(i-1)*3}px,${-12-i*3}px) scale(1)`,opacity:1,offset:.45},{transform:`translate(${(i-1)*4}px,4px) scale(.2)`,opacity:0}],{delay:delay+i*25,duration:390,fill:'both',easing:'ease-out'})));
   }catch{/* A failed decorative animation still reaches the timed final state. */}
   timers.push(setTimeout(()=>{if(done)return;tube.classList.add('is-pouring');fc._parkMeterLevel=charge.target;record(fc,'charge:arrived',{side,level:charge.target});if(reduced()){rails.style.setProperty('--park-fill',charge.target*10+'%');if(++finished===2)finish();}},delay));
  }
  // Final state never depends on Web Animations, image loading or a visible tab.
  timers.push(setTimeout(finish,Math.max(0,cue.at+Number(cue.delay||0)+450-performance.now())+1500));
  rails.style.setProperty('--park-fill',charge.target*10+'%');
 }
 function celebrateFull(){
  if(fc._parkFillCelebrating)return;fc._parkFillCelebrating=true;rails.classList.add('is-overflowing');record(fc,'reservoir:full');
  confetti(rails,[{x:17,y:231},{x:436,y:231}],{count:32,spread:135});
  const end=()=>{rails.classList.remove('is-overflowing');fc._parkFillCelebrating=false;record(fc,'reservoir:celebrated');if(fc._parkWheelWaiting){fc._parkWheelWaiting=false;showWheel();}};
  setTimeout(end,reduced()?120:1250);
 }
 fc._parkAfterCoinFlight=done=>{
  record(fc,'coins:done');
  if(fc._parkTicketAward){record(fc,'tickets:waiting-for-balance');waitCounter(fc).then(()=>{record(fc,'coins:counter-settled');flyTickets(fc,refresh,done);});}else done();
 };
 const originalFly=fc.coinFly.bind(fc);fc._parkOriginalFly=originalFly;
 fc.coinFly=(amount,done)=>{
  const state=window.KingRicoPark.state;
  if(state.wheel?.prizeVersion===3&&!fc._parkCollecting){fc._parkPrizeFlight={amount,done};fc.setState({auto:false});showWheel();return;}
  record(fc,'coins:start',{amount});originalFly(amount,()=>fc._parkAfterCoinFlight(done));
 };
}
// Decorative only: bounded nodes and independent cleanup, never part of crediting.
export function confetti(root,origins,{count=24,spread=100}={}){
 if(reduced()||!root)return;
 const layer=document.createElement('div');layer.className='park-confetti';layer.setAttribute('aria-hidden','true');root.append(layer);
 const colors=['#ffe79a','#ffca3a','#ff4c7c','#4de4e9','#ac79ff'];
 try{for(let i=0;i<count;i++){
  const o=origins[i%origins.length],p=document.createElement('i'),t=(i*.61803398875)%1,dx=origins.length>1?(i%origins.length===0?1:-1)*(25+t*spread):(t-.5)*spread*2,dy=-45-((i*37)%90),drift=(i%2?1:-1)*(20+i%20);
  p.style.background=colors[i%colors.length];p.style.width=(i%4===0?7:4)+'px';p.style.height=(i%4===0?7:9)+'px';p.style.borderRadius=i%4===0?'50%':'1px';layer.append(p);
  p.animate([{transform:`translate(${o.x}px,${o.y}px) rotate(0deg)`,opacity:0},{opacity:1,offset:.08},{transform:`translate(${o.x+dx}px,${o.y+dy}px) rotate(${i*43}deg)`,opacity:1,offset:.38},{transform:`translate(${o.x+dx+drift}px,${o.y+100+i%55}px) rotate(${i*43+280}deg)`,opacity:0}],{duration:1450+i%5*100,delay:i%7*25,easing:'cubic-bezier(.18,.6,.42,1)',fill:'both'});
 }}catch{}setTimeout(()=>layer.remove(),2200);
}
function waitCounter(fc){
 return new Promise(resolve=>{
  let ended=false;const finish=()=>{if(ended)return;ended=true;clearTimeout(safety);resolve();};
  const safety=setTimeout(finish,1100);
  const tick=()=>{if(ended)return;const el=document.querySelector('.kr-hud-row [data-kr-wallet-value]');
   const n=el?Number(el.textContent.replaceAll('.','').replace(',','.').replace(/[^0-9.-]/g,'')):NaN;
   if(!el||Math.abs(n-fc.shownBalance())<.005){setTimeout(finish,100);return;}requestAnimationFrame(tick);
  };requestAnimationFrame(tick);
 });
}
function flyTickets(fc,refresh,done=()=>{}){
 const award=fc._parkTicketAward;
 if(!award||fc._parkTicketsPlaying){done();return;}
 fc._parkTicketsPlaying=true;fc.setState({});record(fc,'tickets:start');
 const target=document.querySelector('.park-pocket [data-tickets]'),end=target?.getBoundingClientRect(),nodes=[],anims=[],arrived=new Set();let ended=false;
 const land=i=>{if(ended||arrived.has(i))return;arrived.add(i);fc._parkVisibleTickets=award.before+arrived.size;refresh();record(fc,'tickets:arrived',{index:i,count:fc._parkVisibleTickets});target?.animate?.([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'scale(1)'}],{duration:230,easing:'ease-out'});};
 const finish=()=>{if(ended)return;ended=true;clearTimeout(safety);anims.forEach(a=>a.cancel());nodes.forEach(n=>n.remove());fc._parkVisibleTickets=award.after;fc._parkTicketAward=null;fc._parkTicketsPlaying=false;refresh();fc.setState({});record(fc,'tickets:done',{count:award.after});done();const resume=fc._parkAutoAfterTickets;fc._parkAutoAfterTickets=false;if(resume&&fc.state.auto)fc.doSpin();};
 const safety=setTimeout(finish,1650);
 if(reduced()||!end?.width){finish();return;}
 try{
  const tx=end.x+end.width/2,ty=end.y+end.height/2;
  const flights=award.cells.slice(0,3).map((cell,i)=>{
   const source=fc.lightsRef.current.parentElement.querySelector(`[data-sym="${cell}"]`)?.getBoundingClientRect();
   const sx=source?source.x+source.width/2:innerWidth/2,sy=source?source.y+source.height/2:innerHeight*.5;
   const node=document.createElement('img');node.src='/ui/park/ticket.svg';node.alt='';node.className='park-flying-ticket';document.body.append(node);nodes.push(node);
   const frames=Array.from({length:9},(_,k)=>{const t=k/8,q=1-t,cx=(sx+tx)/2-45,cy=Math.min(sy,ty)-100,x=q*q*sx+2*q*t*cx+t*t*tx,y=q*q*sy+2*q*t*cy+t*t*ty;return {transform:`translate(${x-29}px,${y-29}px) rotate(${-12+45*t}deg) scale(${1-.55*t})`,opacity:t===1?0:t===0?.3:1,offset:t};});
   const a=node.animate(frames,{duration:820,delay:i*125,easing:'cubic-bezier(.25,.1,.35,1)',fill:'both'});anims.push(a);
   return a.finished.then(()=>land(i)).catch(()=>{});
  });
  Promise.allSettled(flights).then(finish);
 }catch{finish();}
}
