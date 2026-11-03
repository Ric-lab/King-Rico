// Cabinet art can change height; the gauges and controls follow its actual bounds.
export function installCabinetLayout(stage,rails){
 if(stage.dataset.cabinetLayout)return;
 const frame=stage.querySelector('.park-reel-frame');if(!frame)return;
 let raf;
 const measure=()=>{
  const s=stage.getBoundingClientRect(),f=frame.getBoundingClientRect(),scale=s.width/stage.clientWidth;
  if(!scale||!f.height)return;
  const top=(f.top-s.top)/scale,height=f.height/scale,bottom=top+height;
  const drop=parseFloat(getComputedStyle(stage).getPropertyValue('--park-machine-drop'))||0;
  const values={'--park-cabinet-top':top,'--park-cabinet-height':height,
   '--park-controls-shift':Math.max(0,bottom+8-(544+drop))};
  for(const [name,value]of Object.entries(values))stage.style.setProperty(name,value.toFixed(3)+'px');
  rails.style.setProperty('--park-track-height',Math.max(1,height-34-12).toFixed(3)+'px');
  stage.dataset.cabinetLayout='aligned';
 };
 const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(measure);};
 const observer=new ResizeObserver(schedule);observer.observe(frame);observer.observe(stage);
 window.addEventListener('resize',schedule);measure();
 window.addEventListener('pagehide',()=>{observer.disconnect();cancelAnimationFrame(raf);window.removeEventListener('resize',schedule);},{once:true});
}
