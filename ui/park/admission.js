// Admission is chosen before input reaches a game. Never save/replay a gesture.
export function installAdmission({Cloud,authorized,requestEntry}) {
 let ready=false,prompt;
 const refresh=()=>{document.documentElement.dataset.parkAdmission=ready&&authorized()?'ready':'pending';};
 const loadingFinished=()=>new Promise(resolve=>{
  if(!document.getElementById('kr-boot-screen'))return resolve();
  const observer=new MutationObserver(()=>{
   if(!document.getElementById('kr-boot-screen')){observer.disconnect();resolve();}
  });
  observer.observe(document.body,{childList:true,subtree:true});
 });
 const request=()=>{
  if(prompt)return prompt;
  prompt=(async()=>{
   await Cloud.ready;
   if(!Cloud.player)return;
   await loadingFinished();
   if(!authorized())await requestEntry();
  })().finally(()=>{prompt=null;refresh();});
  return prompt;
 };
 const block=event=>{
  if(ready&&authorized())return;
  // Login, menus, Home and the admission dialog remain usable while locked.
  if(event.target.closest?.('#kr-boot-screen,.park-modal,[role="dialog"],[data-park-result],.kr-hud-home,.kr-menu-button'))return;
  if(event.type==='keydown'&&!['Enter',' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(['pointerdown','click','keydown'].includes(event.type))void request();
 };
 for(const type of ['pointerdown','pointermove','pointerup','click','keydown'])window.addEventListener(type,block,{capture:true,passive:false});
 Cloud.watch(refresh);refresh();
 Cloud.ready.then(()=>{ready=true;refresh();return request();});
 return {request};
}
