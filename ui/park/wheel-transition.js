// Keep the two reservoir wheels visually connected to the single bonus wheel.
export async function enterWheel(el){
 const machine=el.querySelector('.park-wheel-machine'),wrap=el.querySelector('.park-wheel-wrap'),panel=el.querySelector('.park-panel');
 const fit=()=>machine.style.setProperty('--park-wheel-scale',String(wrap.clientWidth/386));fit();
 const observer=new ResizeObserver(fit);observer.observe(wrap);
 const close=el.close;el.close=()=>{observer.disconnect();close();};
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const animations=[],copies=[];let safety;
 el.classList.add('is-entering');
 try{
  const bounds=machine.getBoundingClientRect(),tx=bounds.x+bounds.width/2,ty=bounds.y+bounds.height/2;
  const goals=[...document.querySelectorAll('.park-circus-rails .park-meter-goal')];
  for(const [i,goal]of goals.entries()){
   const r=goal.getBoundingClientRect(),copy=goal.cloneNode(true),sx=r.x+r.width/2,sy=r.y+r.height/2,scale=r.width/34;
   copy.className='park-meter-goal park-wheel-traveller';copy.setAttribute('aria-hidden','true');document.body.append(copy);copies.push(copy);
   const at=(x,y,s)=>`translate(${x-17}px,${y-17}px) scale(${s})`;
   animations.push(copy.animate([
    {transform:at(sx,sy,scale),opacity:1},
    {transform:at(sx+(i?-20:20),sy-12,scale*2.3),opacity:1,offset:.27},
    {transform:at(tx+(i?38:-38),ty,3.3),opacity:1,offset:.7},
    {transform:at(tx,ty,5.2),opacity:0}
   ],{duration:1400,easing:'cubic-bezier(.3,.05,.2,1)',fill:'both'}));
  }
  const scale=Number(machine.style.getPropertyValue('--park-wheel-scale'));
  const tr=s=>`translate(-50%,-50%) scale(${scale*s})`;
  animations.push(machine.animate([{transform:tr(.18),opacity:0},{transform:tr(.28),opacity:0,offset:.46},{transform:tr(1.04),opacity:1,offset:.86},{transform:tr(1),opacity:1}],{duration:1750,easing:'cubic-bezier(.2,.75,.2,1)',fill:'both'}));
  for(const node of panel.children)if(node!==wrap)animations.push(node.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{delay:1250,duration:500,fill:'both',easing:'ease-out'}));
  animations.push(el.animate([{backgroundColor:'rgba(16,3,25,0)',backdropFilter:'blur(0px)'},{backgroundColor:'rgba(16,3,25,.78)',backdropFilter:'blur(4px)'}],{duration:950,fill:'both'}));
  await Promise.race([Promise.allSettled(animations.map(a=>a.finished)),new Promise(r=>safety=setTimeout(r,2150))]);
 }catch{/* A missing animation API must not hide a paid wheel. */}
 finally{clearTimeout(safety);animations.forEach(a=>a.cancel());copies.forEach(c=>c.remove());el.classList.remove('is-entering');}
}
