import * as T from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
const {clamp,lerp,smoothstep}=T.MathUtils;
const MULTIPLIERS=[1.2,1.5,2,1.5,3,1.2,2,1.2,1.5];
const smooth=n=>smoothstep(n,0,1);

export async function createClawScene(canvas,{onAim,onFinish,onPhase}){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-2,2,1.7,-1.7,.1,50);
 camera.position.set(0,8,6);camera.lookAt(0,.9,0);
 const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();
 const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=1;
 room.dispose();pmrem.dispose();
 scene.add(new T.HemisphereLight(0xffeed0,0x361453,2));
 const key=new T.DirectionalLight(0xffe8bf,3);key.position.set(-3,6,5);scene.add(key);
 const mat=(color,metalness=0,roughness=.4)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const gold=mat(0xffc85a,.8,.22),steel=mat(0xe5e5ee,.92,.2),dark=mat(0x392448,.35,.42),velvet=mat(0x20102c,0,1);
 const machine=new T.Group();scene.add(machine);
 function box(w,h,d,x,y,z,m,r=.04,parent=machine){const o=new T.Mesh(new RoundedBoxGeometry(w,h,d,3,r),m);o.position.set(x,y,z);parent.add(o);return o;}
 function cylinder(r,h,x,y,z,m,parent=machine){const o=new T.Mesh(new T.CylinderGeometry(r,r,h,20),m);o.position.set(x,y,z);parent.add(o);return o;}
 // Only the interior is live 3D. The illustrated cabinet keeps the King's circus silhouette.
 box(3.8,.12,3.05,0,-.08,0,velvet);
 box(3.8,.045,.045,0,-.01,1.51,gold,.012);
 const loader=new T.TextureLoader();
 const [plushTexture,royalTexture]=await Promise.all([
  loader.loadAsync('./assets/claw/happeach-plush.webp'),loader.loadAsync('./assets/claw/happeach-royal.webp')
 ]);
 for(const texture of[plushTexture,royalTexture]){texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);}
 const plushMaterial=new T.SpriteMaterial({map:plushTexture,toneMapped:false,alphaTest:.03});
 const shadowMaterial=new T.MeshBasicMaterial({color:0x100819,transparent:true,opacity:.38,depthWrite:false});
 const toys=[],positions=[],labels=[],shadows=[];
 const labelRoot=document.createElement('div');labelRoot.className='claw-prize-labels';canvas.parentElement.append(labelRoot);
 for(let i=0;i<9;i++){
  const g=new T.Group(),plush=new T.Sprite(plushMaterial.clone());plush.scale.set(.81,.81,1);g.add(plush);
  g.position.set((i%3*320+180-500)/1000*3.1,.46,(Math.floor(i/3)*280+220-500)/1000*2.1*1.48);
  machine.add(g);toys.push(g);positions.push(g.position.clone());
  const shadow=new T.Mesh(new T.CircleGeometry(.33,24),shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.set(g.position.x,.005,g.position.z);shadow.scale.y=.76;machine.add(shadow);shadows.push(shadow);
  const label=document.createElement('span');label.className='claw-prize-tag';labelRoot.append(label);labels.push(label);
 }
 const bridge=new T.Group();machine.add(bridge);
 box(3.5,.07,.07,0,2.58,0,steel,.02,bridge);
 const carriage=new T.Group();bridge.add(carriage);box(.36,.18,.32,0,2.55,0,gold,.05,carriage);box(.2,.07,.37,0,2.44,0,dark,.02,carriage);
 const claw=new T.Group();machine.add(claw);
 cylinder(.16,.23,0,0,0,steel,claw);cylinder(.2,.08,0,.14,0,gold,claw);
 // Two dark glass eyes give the mechanism a face, without replacing the mascot.
 for(const x of[-.066,.066]){const eye=new T.Mesh(new T.SphereGeometry(.026,12,8),dark);eye.position.set(x,.025,.153);claw.add(eye);}
 const cable=new T.Mesh(new T.CylinderGeometry(.017,.017,1,10),dark);machine.add(cable);
 const fingers=[];
 for(let i=0;i<3;i++){
  const pivot=new T.Group();pivot.rotation.y=i*Math.PI*2/3;claw.add(pivot);
  const arm=new T.Group();arm.position.set(0,-.055,.12);pivot.add(arm);
  const curve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(0,-.16,.18),new T.Vector3(0,-.39,.21),new T.Vector3(0,-.52,.045)]);
  arm.add(new T.Mesh(new T.TubeGeometry(curve,18,.044,8,false),steel));
  const tip=new T.Mesh(new T.SphereGeometry(.06,12,8),gold);tip.position.set(0,-.52,.045);arm.add(tip);fingers.push(arm);
 }
 const reticle=new T.Group();machine.add(reticle);
 const ringMaterial=new T.MeshBasicMaterial({color:0xffe2a0,transparent:true,opacity:.95,depthWrite:false,depthTest:false});
 const ring=new T.Mesh(new T.RingGeometry(.22,.238,48),ringMaterial);ring.rotation.x=-Math.PI/2;ring.renderOrder=10;reticle.add(ring);
 for(let i=0;i<4;i++){const tick=new T.Mesh(new T.PlaneGeometry(.11,.018),ringMaterial);tick.position.set(Math.cos(i*Math.PI/2)*.29,0,Math.sin(i*Math.PI/2)*.29);tick.rotation.x=-Math.PI/2;tick.rotation.z=i*Math.PI/2;tick.renderOrder=10;reticle.add(tick);}
 const guideMaterial=new T.LineDashedMaterial({color:0xffe3a0,transparent:true,opacity:.12,dashSize:.055,gapSize:.065,depthTest:false});
 const guide=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,2,0)]),guideMaterial);guide.computeLineDistances();machine.add(guide);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let seed=0,paused=false,busy=false,drag=null,time=0,prev=performance.now(),raf,started=0,outcome,carried,finished=false,phase='',aim={x:0,z:0},actual={x:0,z:0},base={x:0,z:0},swing={x:0,z:0};
 const keys=new Set(),limit=()=>{aim.x=clamp(aim.x,-1.43,1.43);aim.z=clamp(aim.z,-.94,.94);};
 const toWorldZ=z=>z*1.48;
 function pick(){
  const aimX=clamp(Math.round(actual.x/3.1*1000+500),0,1000),aimZ=clamp(Math.round(actual.z/2.1*1000+500),0,1000);
  let selected=0,dist=Infinity;
  for(let i=0;i<9;i++){const d=Math.max(Math.abs(aimX-(i%3*320+180)),Math.abs(aimZ-(Math.floor(i/3)*280+220)));if(d<dist){dist=d;selected=i;}}
  return {aimX,aimZ,selected,seed,quality:Math.max(0,1000-Math.floor(dist*1000/160)),multiplier:MULTIPLIERS[(selected+seed)%9]};
 }
 function setPhase(next){if(next!==phase){phase=next;onPhase?.(next,outcome);}}
 function reset(next=Math.floor(Math.random()*9)){
  seed=next;aim={x:0,z:.94};actual={...aim};base={...aim};busy=false;outcome=null;carried=null;drag=null;keys.clear();reticle.visible=guide.visible=true;setPhase('aim');
  toys.forEach((g,i)=>{g.position.copy(positions[i]);g.scale.setScalar(1);g.visible=true;g.children[0].material.rotation=(i%3-1)*.035;const rare=MULTIPLIERS[(i+seed)%9]===3;g.children[0].material.map=rare?royalTexture:plushTexture;labels[i].textContent='×'+String(MULTIPLIERS[(i+seed)%9]).replace('.',',');labels[i].classList.toggle('rare',rare);});
 }
 function play(x){busy=true;outcome=x;started=time;finished=false;reticle.visible=guide.visible=false;actual={x:(x.aimX-500)/1000*3.1,z:(x.aimZ-500)/1000*2.1};aim={...actual};base={...actual};carried=x.quality>=300?toys[x.selected]:null;}
 function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);const width=3.9,height=width*r.height/r.width;camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();}
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 const visibility=()=>{prev=performance.now();keys.clear();drag=null;};document.addEventListener('visibilitychange',visibility);
 const down=e=>{if(paused||busy)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};
 const move=e=>{if(!drag||drag.id!==e.pointerId||paused||busy)return;const r=canvas.getBoundingClientRect();aim.x+=(e.clientX-drag.x)/r.width*4.8;aim.z+=(e.clientY-drag.y)/r.height*4.6;drag.x=e.clientX;drag.y=e.clientY;limit();};
 const up=e=>{if(drag?.id===e.pointerId)drag=null;};
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);for(const type of['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,up);
 const keydown=e=>{if(e.key.startsWith('Arrow')&&!paused&&!busy){e.preventDefault();keys.add(e.key);}},keyup=e=>keys.delete(e.key);window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);
 const v=new T.Vector3();
 function frame(now){
  raf=requestAnimationFrame(frame);const dt=Math.max(0,Math.min((now-prev)/1000,.25));prev=now;if(paused||document.hidden)return;time+=dt;
  if(!busy){
   aim.x+=(keys.has('ArrowRight')-keys.has('ArrowLeft'))*dt*1.2;aim.z+=(keys.has('ArrowDown')-keys.has('ArrowUp'))*dt*.9;limit();const ox=actual.x,oz=actual.z;
   base.x=lerp(base.x,aim.x,1-Math.exp(-dt*12));base.z=lerp(base.z,aim.z,1-Math.exp(-dt*12));
   // The visible floor reticle and financial pick share this exact position.
   // This deliberate pendulum is the timing challenge, not a random grip failure.
   actual.x=clamp(base.x+Math.sin(time*2.1)*.19,-1.43,1.43);
   actual.z=clamp(base.z+Math.sin(time*1.6+.8)*.055,-.94,.94);
   swing.x=lerp(swing.x,(actual.x-ox)/Math.max(dt,.001)*-.12,1-Math.exp(-dt*5));swing.z=lerp(swing.z,(actual.z-oz)/Math.max(dt,.001)*.1,1-Math.exp(-dt*5));onAim?.(pick());
  }
  let x=actual.x,z=toWorldZ(actual.z),idleY=2.75+z*1.18,y=idleY,closed=0;
  if(busy){
   const e=(time-started)*(reduced?2.5:1);
   if(e<.26){setPhase('start');y=idleY+Math.sin(e/.26*Math.PI)*.07;}
   else if(e<1.06){setPhase('lower');y=lerp(idleY,1.01,smooth((e-.26)/.8));}
   else if(e<1.55){setPhase('close');y=1.01;closed=smooth((e-1.06)/.49);}
   else if(e<2.48){setPhase('lift');y=lerp(1.01,idleY,smooth((e-1.55)/.93));closed=1;}
   else if(e<3.18){setPhase('travel');closed=1;x=lerp(actual.x,0,smooth((e-2.48)/.7));z=lerp(toWorldZ(actual.z),1.43,smooth((e-2.48)/.7));y=2.75+z*1.18;}
   else{setPhase(e<3.58?'release':'delivery');x=0;z=1.43;y=2.75+z*1.18;closed=1-smooth((e-3.18)/.25);}
   if(carried){
    if(e<1.5)carried.scale.set(1+.13*closed,1-.15*closed,1);
    else if(outcome.quality>=700){
     carried.position.set(x,y-.55,z);carried.scale.set(1,1,1);carried.children[0].material.rotation=Math.sin(e*7)*.065;
     if(e>3.3){const f=e-3.3;carried.position.y=Math.max(-.5,y-.55-f*f*22);carried.scale.setScalar(Math.max(.3,1-f*.7));if(f>.5)carried.visible=false;}
    }else if(e<2.02){carried.position.y=y-.55;carried.children[0].material.rotation=Math.sin(e*21)*.22;}
    else{const f=e-2.02;carried.position.y=Math.max(positions[outcome.selected].y,.88-f*f*6);carried.children[0].material.rotation=Math.sin(e*16)*Math.max(0,.2-f*.4);carried.scale.setScalar(1);}
   }
   if(e>4.2&&!finished){finished=true;setPhase('done');onFinish?.(outcome);}
  }
  claw.position.set(x,y,z);claw.rotation.z=busy?Math.sin(time*9)*.018:clamp(swing.x,-.17,.17);claw.rotation.x=busy?0:clamp(swing.z,-.1,.1);claw.rotation.y=reduced?0:Math.sin(time*.7)*.18;
  fingers.forEach(f=>f.rotation.x=lerp(-.3,.46,closed));bridge.position.set(0,z*1.18+.7,z);carriage.position.x=x;const length=3.28+z*1.18-y;cable.position.set(x,y+length/2+.14,z);cable.scale.y=Math.max(.01,length);
  reticle.position.set(actual.x,.04,toWorldZ(actual.z));guide.position.set(actual.x,.04,toWorldZ(actual.z));guide.scale.y=idleY/2;reticle.scale.setScalar(reduced?1:1+Math.sin(time*4)*.035);
  const q=pick();
  toys.forEach((g,i)=>{
   if(g!==carried||!busy){g.position.y=positions[i].y;const breathe=reduced?0:Math.sin(time*1.7+i*1.8)*.012;g.scale.set(1-breathe*.4,1+breathe,1);}
   const selected=!busy&&q.selected===i&&q.quality>0;
   shadows[i].material=shadowMaterial;shadows[i].visible=g.visible;
   labels[i].hidden=busy;v.copy(positions[i]);v.y=.02;v.z+=.2;v.project(camera);
   labels[i].style.transform=`translate(${(v.x*.5+.5)*canvas.clientWidth}px,${(-v.y*.5+.5)*canvas.clientHeight}px) translate(-50%,0)`;
   labels[i].classList.toggle('selected',selected);
  });
  renderer.render(scene,camera);
 }
 reset();raf=requestAnimationFrame(frame);
 return {pick,reset,play,setPaused(v){paused=v;keys.clear();drag=null;},freeze(){aim={...actual};return pick();},aimAt(x,z){aim={x:(x-500)/1000*3.1,z:(z-500)/1000*2.1};limit();},get busy(){return busy;},destroy(){
  cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);
  canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);for(const type of['pointerup','pointercancel','lostpointercapture'])canvas.removeEventListener(type,up);
  const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());plushTexture.dispose();royalTexture.dispose();environment.dispose();renderer.dispose();labelRoot.remove();
 }};
}
