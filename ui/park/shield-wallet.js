// One saved inventory, five visible positions. No separate local balance.
export function paintShields(wallet,count){
 if(!wallet)return;
 const n=Math.max(0,Number(count)||0),text=wallet.querySelector('[data-tickets]');
 if(text)text.textContent=n+'/5';
 wallet.querySelectorAll('[data-shield-slot]').forEach((slot,i)=>slot.classList.toggle('is-filled',i<n));
 if(wallet.getAttribute('aria-hidden')!=='true')wallet.setAttribute('aria-label',`${n} de 5 escudos de defesa`);
}
export function shieldTarget(index){
 return document.querySelector('.park-key-count-shield img')||document.querySelector('.park-key-count-shield')||document.querySelector(`.kr-hud-row .park-shield-wallet [data-shield-slot="${Math.max(0,Math.min(4,index))}"] img`);
}
