// The solid cap follows the pointer as one rigid part. Native handlers own the wager.
export function installSpinTactility(fc){
 const button=document.querySelector('[data-spin-btn]');
 if(!button)return;
 fc._spinTouchDown=()=>{fc._parkPreparePulseColor?.();button.dataset.tactileHeld='1';};
 fc._spinTouchUp=()=>{delete button.dataset.tactileHeld;};
 window.addEventListener('pagehide',()=>{delete button.dataset.tactileHeld;},{once:true});
}
