// Adapted from KingRico.dc.html's cheer: drawn poses, 110ms opaque dissolve,
// feet anchored at 97%, and the same exponential transform smoothing (22/s).
export const BOARDING_FRAMES=['master','crouch2','cheerRise','cheer','cheerFall','land','pilotSide'];
export const boardingAsset=frame=>frame==='pilotSide'?'/assets/circus/king-pilot-side.webp':`/assets/king-rico/fw6/${frame}.webp`;
export function boardingPose(progress){
 const p=Math.max(-1,Math.min(1,progress));
 if(p<0)return {frame:'crouch2',sx:1.015,sy:.98};
 if(p<.2)return {frame:'cheerRise',sx:.96+.04*p/.2,sy:1.04-.04*p/.2};
 if(p<.56)return {frame:'cheer',sx:1,sy:1};
 if(p<.84)return {frame:'cheerFall',sx:1,sy:1};
 const compression=Math.sin((p-.84)/.16*Math.PI);
 return {frame:'pilotSide',sx:1+.02*compression,sy:1-.03*compression};
}
export function createBoardingActor(host,departure){
 const body=document.createElement('div');body.className='park-king-actor';host.append(body);
 const frames={};let current=null,sx=1,sy=1;
 for(const frame of [...BOARDING_FRAMES,...(departure?['departure']:[])]){
  const image=new Image();image.src=frame==='departure'?departure:boardingAsset(frame);image.alt='';image.dataset.boardingFrame=frame;
  image.style.opacity='0';body.append(image);frames[frame]=image;image.decode?.().catch(()=>{});
 }
 function pose(frame,x=1,y=1,dt=.016){
  if(frame!==current){
   const next=frames[frame]||frames.master,old=frames[current];
   for(const image of Object.values(frames))if(image!==next&&image!==old){image.style.transition='none';image.style.opacity='0';image.style.zIndex='0';}
   next.style.transition='none';next.style.opacity='1';next.style.zIndex='1';
   if(old){old.style.zIndex='2';old.style.transition='opacity 110ms ease-out';void old.offsetWidth;old.style.opacity='0';}
   current=frame;host.dataset.pose=frame;
  }
  const smoothing=1-Math.exp(-Math.min(.05,dt)*22);sx+=(x-sx)*smoothing;sy+=(y-sy)*smoothing;
  body.style.transform=`scale(${sx},${sy})`;
 }
 pose(departure?'departure':'master');return {pose};
}
