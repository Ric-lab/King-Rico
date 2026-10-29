/* Presentation only: dismiss on actual interface/account readiness, never on a fake percentage. */
(() => {
  const screen=document.getElementById('kr-boot-screen');
  if(!screen)return;
  const retry=screen.querySelector('.kr-boot-retry');
  const game=document.querySelector('meta[name="king-rico-game"]')?.content;
  const hooks={bridge:'__bridge',circus:'__fc',wheel:'__fw',neck:'__fn',fingo:'__fg',penalty:'__pen',clown:'__clown',flying:'__flying',bounce:'__bounce',twentyOne:'KingRico21',claw:'KingRicoClaw',race:'KingRicoRace'};
  let dismissed=false,paint=0,artReady=false,artFailed=false;
  const blockGame=event=>{if(!dismissed&&!screen.hidden&&!screen.contains(event.target)&&!event.target.closest?.('[data-cloud-login],[data-cloud-loading],[data-cloud-notice]')){event.preventDefault();event.stopImmediatePropagation();}};
  const blockedEvents=['pointerdown','pointerup','click','keydown'];
  blockedEvents.forEach(type=>window.addEventListener(type,blockGame,{capture:true,passive:false}));
  const message=screen.querySelector('[data-boot-message]');
  const art=JSON.parse(document.getElementById('kr-essential-art')?.textContent||'[]');
  const loadImage=src=>new Promise((resolve,reject)=>{
    const img=new Image(),deadline=setTimeout(()=>reject(new Error('Image timeout')),15000);
    img.onload=async()=>{try{await img.decode();clearTimeout(deadline);resolve();}catch(e){clearTimeout(deadline);reject(e);}};
    img.onerror=()=>{clearTimeout(deadline);reject(new Error('Image missing'));};img.src=src;
  });
  Promise.all([...art.map(loadImage),document.fonts.load('800 19px "Baloo 2"')]).then(()=>{artReady=true;check();}).catch(()=>{
    artFailed=true;message.textContent='Não foi possível carregar as imagens do jogo.';retry.hidden=false;if(!screen.hidden)retry.focus();check();
  });
  const shown=selector=>{
    const element=document.querySelector(selector);
    return element && !element.hidden && getComputedStyle(element).display!=='none';
  };
  function dismiss() {
    if(dismissed)return;
    dismissed=true;clearInterval(poll);clearTimeout(slow);observer.disconnect();
    blockedEvents.forEach(type=>window.removeEventListener(type,blockGame,true));
    screen.setAttribute('data-leaving','');
    setTimeout(()=>screen.remove(),200);
  }
  function check() {
    if(dismissed)return;
    // Login and recovery keep their existing controls, identity and error behavior.
    if(shown('[data-cloud-login]') || shown('[data-cloud-retry]')) {if(!screen.hidden)screen.hidden=true;return;}
    if(screen.hidden)screen.hidden=false;
    const cloud=window.KingRicoCloud;
    if(!cloud || cloud.enabled && !cloud.player)return;
    if(!artReady||artFailed)return;
    const mounted=game==='home'
      ? document.querySelector('[data-screen-label="Home"]')
      : hooks[game] ? window[hooks[game]] : document.querySelector('[data-screen-label],#game');
    if(game==='fingo' && mounted && !mounted.state?.artReady && !mounted.state?.artError)return;
    if(game==='penalty'&&(!window.Pen3D?.kMat||window.Pen3D?.state!=='ready'))return;
    if(game==='clown'&&!window.ClownBall?.texs)return;
    if(game==='circus'&&!mounted?.state?.ready)return;
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
    if(!artFailed)message.textContent='Está demorando mais que o esperado.';
    retry.hidden=false;
    if(!screen.hidden)retry.focus();
  },15000);
  check();
})();
