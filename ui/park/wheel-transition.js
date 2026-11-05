// The real cabinet stays mounted: lifting never touches reels, stake or wallet state.
const calm=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
async function settle(animations,deadline){
 let timer;try{await Promise.race([Promise.allSettled(animations.map(a=>a.finished)),new Promise(r=>timer=setTimeout(r,deadline))]);}finally{clearTimeout(timer);}
}
export function createWheelScene(stage,html){
 const el=document.createElement('section');el.className='park-wheel-scene';el.setAttribute('role','region');el.setAttribute('aria-label','Roleta multiplicadora');el.innerHTML=`<div class="park-panel park-wheel-panel">${html}</div>`;
 const rig=document.createElement('div');rig.className='park-hoist-rig';rig.setAttribute('aria-hidden','true');rig.innerHTML='<i></i><i></i><b></b>';
 const items=[...stage.children].filter(n=>!n.classList.contains('kr-hud-row'));
 const inert=items.map(n=>n.inert);items.forEach(n=>{n.classList.add('park-hoisted-item');n.inert=true;});
 stage.classList.add('park-hoist-deck');stage.append(rig,el);
 const state={stage,rig,items,inert,animations:[],observer:null,closed:false};el._hoist=state;
 const cleanup=()=>{if(state.cleaned)return;state.cleaned=true;state.animations.forEach(a=>a.cancel());state.observer?.disconnect();delete stage.dataset.hoist;stage.classList.remove('park-hoist-deck');items.forEach((n,i)=>{n.classList.remove('park-hoisted-item');n.inert=inert[i];});rig.remove();el.remove();window.removeEventListener('pagehide',cleanup);};
 window.addEventListener('pagehide',cleanup,{once:true});
 el.close=async()=>{if(state.closed)return;state.closed=true;try{await leaveWheel(el);}finally{cleanup();}};
 return el;
}
export async function enterWheel(el){
 const s=el._hoist,{stage,rig,items}=s,wrap=el.querySelector('.park-wheel-wrap'),wheel=el.querySelector('.park-wheel-machine');
 const fit=()=>wheel.style.setProperty('--park-wheel-scale',String(wrap.clientWidth/386));fit();s.observer=new ResizeObserver(fit);s.observer.observe(wrap);
 stage.dataset.hoist='rigging';
 try{
  if(!calm()){
   const arrival=rig.animate([{translate:'0 -310px'},{translate:'0 0'}],{duration:2000,easing:'cubic-bezier(.4,0,.4,1)',fill:'both'});
   s.animations.push(arrival);await settle([arrival],2300);arrival.cancel();
   await new Promise(resolve=>setTimeout(resolve,500));
   if(s.cleaned)return;
   stage.dataset.hoist='lifting';
   const motion=[{translate:'0 0'},{translate:'0 8px',offset:.12},{translate:'0 -920px'}];
   for(const n of [...items,rig])s.animations.push(n.animate(motion,{duration:3600,easing:'cubic-bezier(.45,.12,.35,1)',fill:'both'}));
   s.animations.push(el.animate([{opacity:0,transform:'translateY(65px) scale(.9)'},{opacity:1,transform:'translateY(0) scale(1)'}],{delay:3050,duration:800,easing:'cubic-bezier(.2,.8,.25,1)',fill:'both'}));
   await settle(s.animations,4300);
  }
 }catch{/* The confirmed bonus still opens when animation is unavailable. */}
 finally{if(s.cleaned)return;stage.dataset.hoist='wheel';s.animations.forEach(a=>a.cancel());s.animations=[];el.querySelector('button')?.focus({preventScroll:true});}
}
async function leaveWheel(el){
 const s=el._hoist;s.stage.dataset.hoist='returning';
 try{
  // Returning the cabinet explains where the prize goes, including reduced motion.
  const reduced=calm(),duration=reduced?1100:2400;
  const frames=reduced?[{translate:'0 -920px'},{translate:'0 0'}]:[{translate:'0 -920px'},{translate:'0 5px',offset:.87},{translate:'0 0'}];
  for(const n of [...s.items,s.rig])s.animations.push(n.animate(frames,{duration,easing:reduced?'linear':'cubic-bezier(.45,.08,.35,1)',fill:'both'}));
  s.animations.push(el.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(50px)'}],{duration:280,fill:'both',easing:'ease-in'}));
  await settle(s.animations,duration+400);
 }catch{/* Cleanup always restores the cabinet before the prize flies. */}
}
