/* Presentation only: account transactions never depend on animation callbacks. */
(() => {
  const states=new WeakMap(),format=n=>n.toLocaleString('pt-BR',{maximumFractionDigits:2});
  const number=v=>typeof v==='number'?v:Number(String(v).replaceAll('.','').replace(',','.'));
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const resolve=el=>el?.matches('[data-kr-wallet-value]')?el:el?.querySelector('[data-kr-wallet-value]')||el;
  function coins(el,{onFirst=()=>{},source}={}) {
    let ended=false,arrived=false;const nodes=[],animations=[];
    const first=()=>{if(!arrived){arrived=true;onFirst();}};
    const cleanup=()=>{ended=true;clearTimeout(safety);animations.forEach(a=>a.cancel());nodes.forEach(n=>n.remove());};
    const finish=()=>{if(ended)return;first();cleanup();};
    // Independent of WAAPI promises, asset loading, RAF and network availability.
    const safety=setTimeout(finish,1600);
    try {
      const wallet=el.closest('.kr-hud-balance,[aria-label^="Seu saldo"]')||el;
      wallet.closest('[data-home-scroll]')?.scrollTo({top:0,behavior:'instant'});
      const r=wallet.getBoundingClientRect(),from=source?.getBoundingClientRect?.();
      if(reduced()||!r.width||!el.animate){finish();return cleanup;}
      const sx=from?from.x+from.width/2:innerWidth/2,sy=from?from.y+from.height/2:innerHeight*.55;
      const tx=r.x+r.width*.55,ty=r.y+r.height/2;
      const transform=(x,y,s,rot)=>`translate(${x-22}px,${y-22}px) rotate(${rot}deg) scale(${s})`;
      for(let i=0;i<10;i++){
        const img=document.createElement('img');img.src='assets/symbols/sym-coin.webp';img.alt='';img.className='kr-wallet-coin';
        img.style.cssText='position:fixed;left:0;top:0;width:44px;height:44px;object-fit:contain;pointer-events:none;z-index:2147483644;';
        document.body.appendChild(img);nodes.push(img);
        const a=img.animate([{transform:transform(sx,sy,.8,0),opacity:0},
          {transform:transform(sx+(i%5-2)*18,sy-45-i%3*12,1.1,i%2?30:-30),opacity:1,offset:.23},
          {transform:transform(tx,ty,.4,180+i*19),opacity:1}],
          {duration:720,delay:i*34,easing:'cubic-bezier(.45,0,.7,1)',fill:'both'});
        animations.push(a);
        a.finished.then(()=>{if(ended)return;img.remove();first();if(i===9)cleanup();}).catch(finish);
      }
    } catch {finish();}
    return cleanup;
  }
  function set(element,value,{hold=false,external=false,source}={}) {
    const el=resolve(element),target=number(value);if(!el||!Number.isFinite(target))return;
    let s=states.get(el);
    if(!s){s={shown:target,target,hold,created:performance.now(),uid:window.KingRicoCloud?.uid};states.set(el,s);el.textContent=format(target);return;}
    if(target===s.target&&hold===s.hold)return;
    s.target=target;s.hold=hold;
    if(target>s.shown&&external)s.skip=true;
    if(hold&&target>s.shown)return;
    cancelAnimationFrame(s.frame);s.cancel?.();s.cancel=null;clearTimeout(s.safety);
    const generation=s.generation=(s.generation||0)+1;
    const write=n=>{s.shown=n;el.textContent=format(n);};
    const uid=window.KingRicoCloud?.uid;
    // Opening/restoring an account is a snapshot, not a new prize.
    if(uid!==s.uid||performance.now()-s.created<400||!el.getBoundingClientRect().width){s.uid=uid;s.skip=false;write(target);return;}
    const up=target>s.shown,skip=s.skip;s.skip=false;
    const start=()=>{
      if(s.generation!==generation||s.started===generation)return;s.started=generation;
      const from=s.shown,t0=performance.now(),duration=reduced()?0:up?950:360;
      const decimals=target%1!==0||from%1!==0;
      const tick=now=>{
        if(s.generation!==generation||!el.isConnected)return;
        const t=duration?Math.min(1,(now-t0)/duration):1,e=1-Math.pow(1-t,3);
        write(t===1?target:Math.round((from+(target-from)*e)*(decimals?100:1))/(decimals?100:1));
        if(t<1)s.frame=requestAnimationFrame(tick);else clearTimeout(s.safety);
      };
      s.frame=requestAnimationFrame(tick);
    };
    // Final value is guaranteed even if a visual effect cannot run to completion.
    s.safety=setTimeout(()=>{if(s.generation===generation){cancelAnimationFrame(s.frame);write(target);}},3000);
    if(up&&!skip)s.cancel=coins(el,{source,onFirst:start});else start();
  }
  function dispose(element){const el=resolve(element),s=states.get(el);if(!s)return;cancelAnimationFrame(s.frame);clearTimeout(s.safety);s.cancel?.();states.delete(el);}
  function fly(element,options){const el=resolve(element),s=states.get(el);if(s)s.skip=true;return coins(el,options);}
  window.KingRicoWallet={set,fly,dispose};
})();
