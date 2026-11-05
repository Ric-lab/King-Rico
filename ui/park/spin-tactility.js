// The solid cap follows the pointer as one rigid part. Native handlers own the wager.
export function installSpinTactility(fc){
 const button=document.querySelector('[data-spin-btn]');
 if(!button)return;
 fc._spinTouchDown=()=>{clearTimeout(fc._parkRimTouchClear);fc._parkPreparePulseColor?.();button.dataset.tactileHeld='1';fc._parkRimTouch=true;fc._parkFlashRim?.();};
 fc._spinTouchUp=()=>{clearTimeout(fc._parkRimTouchClear);fc._parkRimTouch=false;delete button.dataset.tactileHeld;};
 window.addEventListener('pagehide',()=>{delete button.dataset.tactileHeld;},{once:true});
}
