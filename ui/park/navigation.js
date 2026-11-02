// Page navigation only. Game transactions and saved rounds remain with Cloud.
export function installParkNavigation(fc,stage,pocket){
 if(!stage||!pocket||fc._parkNavigationInstalled)return;
 fc._parkNavigationInstalled=true;
 let start=null,opening=false;
 const blocked=()=>!!(fc.cloudBusy()||fc.state.menu||fc.state.pays||fc.state.showWin||fc._parkMeterBusy||fc._parkWheelVisible||fc._parkFillCelebrating);
 const open=()=>{if(opening||blocked())return;opening=true;location.assign('/park');};
 pocket.addEventListener('click',event=>{event.preventDefault();open();});
 stage.addEventListener('pointerdown',event=>{
  if(!event.isPrimary){start=null;return;}
  if(event.button!==0||blocked()||event.target.closest('a,button,[role="button"],input,select,textarea,.kr-hud-row'))return;
  start={id:event.pointerId,x:event.clientX,y:event.clientY};
  // Touch already captures its target. Transferring capture across DC layers
  // emits a loss event and can interrupt the very gesture being started.
  if(event.pointerType==='mouse')try{stage.setPointerCapture(event.pointerId);}catch{}
 });
 stage.addEventListener('pointermove',event=>{
  if(!start||event.pointerId!==start.id)return;
  const dx=event.clientX-start.x,dy=event.clientY-start.y;
  if(dy< -24||(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)))start=null;
 });
 stage.addEventListener('pointerup',event=>{
  if(!start||event.pointerId!==start.id)return;
  const gesture=start;start=null;
  const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
  if(dy>=72&&dy>Math.abs(dx)*1.3)open();
 });
 const cancel=()=>{start=null;};
 stage.addEventListener('pointercancel',cancel);
 window.addEventListener('blur',cancel);
 // A child's capture loss must not cancel an independent stage gesture.
 stage.addEventListener('lostpointercapture',event=>{if(event.pointerType==='mouse'&&event.target===stage&&event.pointerId===start?.id)cancel();});
 stage.addEventListener('click',event=>{if(opening){event.preventDefault();event.stopImmediatePropagation();}},true);
}
