// One viewport reference for HUDs, independent of each game's board height.
(() => {
  let frame;
  const set=(el,key,value)=>{if(el.style.getPropertyValue(key)!==value)el.style.setProperty(key,value);};
  function update(){
    frame=0;
    const width=document.documentElement.clientWidth,height=window.KingRicoViewport?.height??innerHeight;
    const scale=Math.max(.25,Math.min(width/453,height/802));
    const banner=document.getElementById('kr-ad-banner')?.getBoundingClientRect().bottom||0;
    for(const row of document.querySelectorAll('.kr-hud-row')){
      const parent=row.parentElement,r=parent.getBoundingClientRect();if(!r.width)continue;
      for(let ancestor=parent;ancestor&&ancestor!==document.body;ancestor=ancestor.parentElement)
        layoutObserver.observe(ancestor,{attributes:true,attributeFilter:['style']});
      const parentScale=r.width/parent.offsetWidth;
      set(row,'--kr-hud-ratio',String(scale/parentScale));
      set(row,'--kr-hud-px-scale',String(scale));
      const scroll=row.closest('[data-home-scroll]');
      set(row,'--kr-hud-offset',(banner-r.top-(scroll?.scrollTop||0)*parentScale)/parentScale+'px');
    }
    const wheel=document.querySelector('[data-screen-label="Fortune Wheel"]');
    if(wheel){
      const s=wheel.getBoundingClientRect().width/453,compact=s<44/46;
      wheel.classList.toggle('fw-compact',compact);
      const tiny=compact&&height<650;wheel.classList.toggle('fw-tiny',tiny);
      if(compact){
        const panelY=Math.min(508*s,height-(tiny?240:274)),top=tiny?52:64,diameter=Math.min(386*1.12*s,panelY-top-12),machineScale=diameter/(386*s);
        set(wheel,'--fw-ui-inverse',String(1/s));
        set(wheel,'--fw-panel-width',Math.min(width-20,Math.max(417*s,300))+'px');
        set(wheel,'--fw-panel-top',panelY/s+'px');
        set(wheel,'--fw-bet-top',Math.min(height-66,Math.max(736*s,panelY+(tiny?174:208)))/s+'px');
        set(wheel,'--fw-bet-width',Math.min(width-24,410)+'px');
        set(wheel,'--fw-machine-scale',String(machineScale));
        set(wheel,'--fw-machine-top',(top+23*machineScale*s)/s+'px');
      }
    }
    for(const el of document.querySelectorAll('.kr-stepper,[data-kr-hit]')){
      const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;
      const ratio=r.width/el.offsetWidth;
      if(!ratio)continue;
      // The transparent extension is bounded by the nearest adjacent control.
      const target=44/ratio,extraX=Math.max(0,(target-el.offsetWidth)/2),extraY=Math.max(0,(target-el.offsetHeight)/2);
      set(el,'--kr-hit-x',extraX+'px');set(el,'--kr-hit-y',extraY+'px');
    }
  }
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(()=>requestAnimationFrame(update));};
  const layoutObserver=new MutationObserver(schedule);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  new ResizeObserver(schedule).observe(document.documentElement);
  addEventListener('resize',schedule);addEventListener('pageshow',schedule);
  document.addEventListener('keydown',event=>{
    const button=event.target.closest('[role="button"]');
    if(!button||button.tagName==='BUTTON'||button.getAttribute('aria-disabled')==='true')return;
    if(event.key==='Enter'||event.key===' '){event.preventDefault();if(!event.repeat)button.click();}
  });
  schedule();
})();
