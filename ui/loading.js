/* Presentation only: dismiss on actual interface/account readiness, never on a fake percentage. */
(() => {
  const screen=document.getElementById('kr-boot-screen');
  if(!screen)return;
  const retry=screen.querySelector('.kr-boot-retry');
  const game=document.querySelector('meta[name="king-rico-game"]')?.content;
  const hooks={bridge:'__bridge',circus:'__fc',wheel:'__fw',neck:'__fn',fingo:'__fg',penalty:'__pen',clown:'__clown',flying:'__flying',bounce:'__bounce',twentyOne:'KingRico21',claw:'KingRicoClaw',race:'KingRicoRace'};
  let dismissed=false,paint=0;
  const shown=selector=>{
    const element=document.querySelector(selector);
    return element && !element.hidden && getComputedStyle(element).display!=='none';
  };
  function dismiss() {
    if(dismissed)return;
    dismissed=true;clearInterval(poll);clearTimeout(slow);observer.disconnect();
    screen.setAttribute('data-leaving','');
    setTimeout(()=>screen.remove(),200);
  }
  function check() {
    if(dismissed)return;
    // Login and recovery keep their existing controls, identity and error behavior.
    if(shown('[data-cloud-login]') || shown('[data-cloud-retry]')) {dismiss();return;}
    const cloud=window.KingRicoCloud;
    if(!cloud || cloud.enabled && !cloud.player)return;
    const mounted=game==='home'
      ? document.querySelector('[data-screen-label="Home"]')
      : hooks[game] ? window[hooks[game]] : document.querySelector('[data-screen-label],#game');
    if(mounted && !paint)paint=requestAnimationFrame(()=>requestAnimationFrame(dismiss));
  }
  retry.addEventListener('click',()=>location.reload());
  // A missing image cannot keep the game blocked.
  screen.querySelector('img').addEventListener('error',event=>event.currentTarget.hidden=true);
  const observer=new MutationObserver(check);
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','style']});
  const poll=setInterval(check,100);
  const slow=setTimeout(()=>{
    if(dismissed)return;
    screen.querySelector('[data-boot-message]').textContent='Está demorando mais que o esperado.';
    retry.hidden=false;
  },15000);
  check();
})();
