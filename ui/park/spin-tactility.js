// Rigid-cap seating is presentation only; native handlers own the wager and auto.
export function installSpinTactility(fc){
 const button=document.querySelector('[data-spin-btn]');
 if(!button)return;
 button.querySelector('.park-spin-hold-line')?.setAttribute('pathLength','100');
 fc._spinHoldMs=650;button.style.setProperty('--park-hold-duration',fc._spinHoldMs+'ms');
 let releaseTimer,pressedAt=0;
 const release=()=>{clearTimeout(releaseTimer);delete button.dataset.tactileHeld;};
 fc._spinTouchDown=()=>{clearTimeout(releaseTimer);pressedAt=performance.now();clearTimeout(fc._parkRimTouchClear);fc._parkPreparePulseColor?.();button.dataset.tactileHeld='1';fc._parkRimTouch=true;fc._parkFlashRim?.();};
 fc._spinTouchUp=()=>{clearTimeout(fc._parkRimTouchClear);fc._parkRimTouch=false;const minimum=matchMedia('(prefers-reduced-motion: reduce)').matches?80:140;const remaining=Math.max(0,minimum-(performance.now()-pressedAt));if(remaining)releaseTimer=setTimeout(release,remaining);else release();};
 window.addEventListener('pagehide',release,{once:true});
}
