import * as T from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {loadToyModels,toyInfo} from './toys.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {createPrizeWorld,BIN,CHUTE} from './physics.mjs';
const {encodeAim,decodeAim}=require('./layout.cjs');
const {MULTIPLIERS}=require('../../cloud/claw.cjs');
const {clamp,lerp,smoothstep}=T.MathUtils,smooth=n=>smoothstep(n,0,1);

export async function createClawScene(canvas,{onAim,onFinish,onPhase,onGrab}){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.1,60);
 const environmentGenerator=new T.PMREMGenerator(renderer),room=new RoomEnvironment();
 const environment=environmentGenerator.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.55;room.dispose();environmentGenerator.dispose();
 scene.add(new T.HemisphereLight(0xfff0d7,0x29203d,.7));
 const key=new T.SpotLight(0xffe5bb,32,25,.6,.75,1.2);key.position.set(-3,8,6);key.target.position.set(0,2.5,0);key.castShadow=true;key.shadow.mapSize.set(512,512);key.shadow.bias=-.0003;key.shadow.normalBias=.025;scene.add(key,key.target);
 const fill=new T.DirectionalLight(0xa5c8ff,1);fill.position.set(4,4,-2);scene.add(fill);
 const cabinet=new T.Group();scene.add(cabinet);
 const materials=[];
 const mat=(color,metalness=0,roughness=.4)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness});materials.push(m);return m;};
 const red=mat(0x971f33,.3,.3),purple=mat(0x321348,.15,.55),gold=mat(0xe8ae43,.78,.25),steel=mat(0xb8bdc7,.85,.25),rubber=mat(0x1b1622,0,.85),lining=mat(0x542444,0,.95),cream=mat(0xf6d99f,.1,.55);
 function box(w,h,d,x,y,z,m,r=.04,parent=cabinet){const o=new T.Mesh(new RoundedBoxGeometry(w,h,d,3,r),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function cyl(r,h,x,y,z,m,parent=cabinet,r2=r){const o=new T.Mesh(new T.CylinderGeometry(r,r2,h,24),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function sphere(r,x,y,z,m,parent=cabinet){const o=new T.Mesh(new T.SphereGeometry(r,20,14),m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;}
 function rod(a,b,r,m,parent=cabinet){const start=new T.Vector3(...a),end=new T.Vector3(...b),o=new T.Mesh(new T.CylinderGeometry(r,r,start.distanceTo(end),12),m);o.position.copy(start).add(end).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());o.castShadow=true;parent.add(o);return o;}
 function decal(text,w,h,size=52){const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d');g.clearRect(0,0,1024,256);g.textAlign='center';g.textBaseline='middle';g.font=`${size}px "Rammetto One",sans-serif`;g.lineWidth=5;g.strokeStyle='#722712';g.fillStyle='#ffdfa1';g.strokeText(text,512,130);g.fillText(text,512,130);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const m=new T.MeshBasicMaterial({map:texture,transparent:true,toneMapped:false,depthWrite:false});materials.push(m);return new T.Mesh(new T.PlaneGeometry(w,h),m);}
 await document.fonts.load('24px "Rammetto One"');
 // The shell is built around a functioning bin, chute and front delivery opening.
 box(3.62,.23,2.65,0,.17,.1,gold,.09);box(3.45,.12,2.5,0,.26,.08,purple);
 box(2,.87,2.35,.6,.77,.03,red,.1);box(.23,.87,2.35,-1.68,.77,.03,red);
 box(1.2,.04,1.65,-1.04,.3,.76,lining,.04);
 for(const z of[-1.17,1.17])box(3.53,.12,.08,0,1.24,z,gold,.025);for(const x of[-1.72,1.72])box(.08,.12,2.43,x,1.24,0,gold,.025);
 // Leave the top of the chute open; the surrounding floor is split into two parts.
 box(2.02,.12,2.04,.57,1.2,0,lining);
 box(1.08,.12,.94,-1.02,1.2,-.55,lining);
 box(.1,.87,.12,-.43,.78,1.2,gold,.025);box(.1,.87,.12,-1.64,.78,1.2,gold,.025);box(1.3,.1,.12,-1.04,1.13,1.2,gold,.025);
 const slotLabel=decal('PRÊMIO',.75,.2,63);slotLabel.position.set(-1.04,1.12,1.276);cabinet.add(slotLabel);
 for(const x of[-1.73,1.73])for(const z of[-1.14,1.14]){box(.16,3.27,.16,x,2.95,z,red,.045);box(.035,3.22,.035,x+(x<0?.08:-.08),2.95,z+(z<0?.08:-.08),gold,.012);}
 box(3.56,.52,2.5,0,4.89,0,red,.15);box(3.65,.1,2.6,0,5.18,0,gold,.04);box(3.6,.11,2.55,0,4.58,0,gold,.04);
 const title=decal('CLAW MACHINE',2.86,.44,66);title.position.set(0,4.91,1.27);cabinet.add(title);
 const sub=decal('HAPPEACH',1.2,.17,46);sub.position.set(0,5.25,1.05);cabinet.add(sub);
 const crown=new T.Group();crown.position.set(0,5.25,.1);cabinet.add(crown);
 cyl(.26,.1,0,0,0,gold,crown);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const peak=new T.Mesh(new T.ConeGeometry(.095,.28,4),gold);peak.position.set(Math.sin(a)*.2,.15,Math.cos(a)*.2);crown.add(peak);sphere(.04,Math.sin(a)*.2,.31,Math.cos(a)*.2,cream,crown);}
 const bulbs=[];
 for(let i=0;i<9;i++){const m=mat(0xffe4a2,.05,.2);m.emissive=new T.Color(0xffb235);m.emissiveIntensity=.3;const b=sphere(.045,-1.46+i*.365,4.64,1.3,m);bulbs.push(b);}
 for(const x of[-1.78,1.78])for(let i=0;i<5;i++){const m=mat(0xffe6ac,.05,.25);m.emissive=new T.Color(0xffbd53);m.emissiveIntensity=.2;bulbs.push(sphere(.043,x,1.55+i*.64,1.22,m));}
 // Real glass panels with edges, door hinges, latch and screw heads.
 const glass=new T.MeshPhysicalMaterial({color:0xc6d9ec,roughness:.12,metalness:0,transparent:true,opacity:.07,depthWrite:false,side:T.DoubleSide});materials.push(glass);
 const pane=(w,h,x,y,z,ry=0)=>{const p=new T.Mesh(new T.PlaneGeometry(w,h),glass);p.position.set(x,y,z);p.rotation.y=ry;cabinet.add(p);return p;};
 pane(3.27,3.17,0,2.96,1.15);pane(2.16,3.17,1.72,2.96,0,Math.PI/2);pane(2.16,3.17,-1.72,2.96,0,Math.PI/2);
 box(3.29,3.17,.065,0,2.96,-1.17,purple,.015);
 for(const y of[1.52,4.34]){box(.12,.23,.06,-1.61,y,1.19,steel,.015);for(const dy of[-.07,.07])sphere(.022,-1.61,y+dy,1.235,rubber);}
 box(.075,.32,.065,1.6,2.47,1.2,steel,.018);cyl(.035,.035,1.6,2.47,1.26,rubber).rotation.x=Math.PI/2;
 // The receiving well is visible through the same enclosure as the toys.
 pane(1.14,.45,-1.04,1.5,-.1);pane(1.14,.45,-.44,1.5,.48,Math.PI/2);
 for(const a of[[[-1.59,1.75,-.1],[-.44,1.75,-.1]],[[-.44,1.75,-.1],[-.44,1.75,1.04]]])rod(a[0],a[1],.022,steel);
 box(.06,.83,1.2,-.43,.75,.55,lining);box(1.2,.83,.06,-1.04,.75,-.1,lining);
 // Two fixed Z rails and the moving crosshead form one gantry, at one physical height.
 for(const x of[-1.48,1.48]){box(.075,.08,2.08,x,4.4,0,steel,.014);for(const z of[-.9,.9])box(.19,.18,.2,x,4.45,z,rubber,.02);}
 const bridge=new T.Group();bridge.position.y=4.33;cabinet.add(bridge);
 for(const z of[-.09,.09])box(3.08,.06,.055,0,0,z,steel,.012,bridge);
 const carriage=new T.Group();bridge.add(carriage);box(.35,.18,.36,0,-.025,0,gold,.035,carriage);
 for(const x of[-.14,.14])for(const z of[-.13,.13]){const w=cyl(.06,.045,x,.035,z,rubber,carriage);w.rotation.z=Math.PI/2;}
 const claw=new T.Group();cabinet.add(claw);
 cyl(.145,.22,0,0,0,steel,claw);cyl(.19,.065,0,.13,0,gold,claw);cyl(.12,.055,0,-.14,0,gold,claw);
 for(let i=0;i<6;i++){const a=i*Math.PI/3;sphere(.021,Math.sin(a)*.148,.06,Math.cos(a)*.148,rubber,claw);}
 const cable=new T.Mesh(new T.CylinderGeometry(.014,.014,1,10),rubber);cabinet.add(cable);
 const fingers=[];
 for(let i=0;i<3;i++){
  const pivot=new T.Group();pivot.rotation.y=i*Math.PI*2/3;claw.add(pivot);const arm=new T.Group();arm.position.set(0,-.06,.115);pivot.add(arm);
  const curve=new T.CatmullRomCurve3([new T.Vector3(),new T.Vector3(0,-.27,.24),new T.Vector3(0,-.62,.26),new T.Vector3(0,-.75,.025)]);
  const finger=new T.Mesh(new T.TubeGeometry(curve,22,.034,8,false),steel);finger.castShadow=true;arm.add(finger);sphere(.045,0,-.75,.025,rubber,arm);fingers.push(arm);
 }
 // Controls belong to the machine. The physical green button is also tappable.
 box(2.15,.14,.49,.53,1.32,1.12,purple,.045);
 const stick=new T.Group();stick.position.set(.06,1.44,1.24);cabinet.add(stick);cyl(.15,.055,0,0,0,rubber,stick);cyl(.035,.25,0,.14,0,steel,stick);sphere(.13,0,.29,0,red,stick);
 cyl(.25,.06,.95,1.43,1.23,gold);const pressMaterial=mat(0x14a34d,.2,.28),button=sphere(.2,.95,1.45,1.23,pressMaterial);button.scale.y=.45;
 const label=decal('PEGAR',.54,.15,57);label.position.set(.95,1.47,1.44);cabinet.add(label);
 // Contact shadows ground the cabinet, and the toys cast shadows into the bin.
 const ground=new T.Mesh(new T.PlaneGeometry(12,12),new T.ShadowMaterial({color:0x17051f,opacity:.32}));ground.rotation.x=-Math.PI/2;ground.position.y=.025;ground.receiveShadow=true;scene.add(ground);
 for(const x of[-1.47,1.47])for(const z of[-.95,.95])cyl(.14,.16,x,.08,z,rubber);
 const models=await loadToyModels(),toys=[];
 for(let i=0;i<9;i++){const root=new T.Group();for(const model of models)root.add(model.clone(true));cabinet.add(root);toys.push(root);}
 // Constant neon color marks the real descent axis, without revealing hit quality.
 const neon=new T.MeshBasicMaterial({color:0x65ff29,toneMapped:false,depthTest:false,depthWrite:false});
 const dark=new T.MeshBasicMaterial({color:0x103c16,depthTest:false,depthWrite:false});
 const reticle=new T.Group();reticle.renderOrder=8;cabinet.add(reticle);
 for(const [inner,outer,material]of[[.125,.18,dark],[.139,.164,neon]]){const ring=new T.Mesh(new T.RingGeometry(inner,outer,48),material);ring.rotation.x=-Math.PI/2;ring.renderOrder=material===neon?9:8;reticle.add(ring);}
 for(const axis of[0,1]){const tick=new T.Mesh(new T.PlaneGeometry(.07,.018),neon);tick.rotation.x=-Math.PI/2;tick.rotation.z=axis*Math.PI/2;tick.renderOrder=10;reticle.add(tick);}
 const guide=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,1,0)]),new T.LineDashedMaterial({color:0x65ff29,toneMapped:false,transparent:true,opacity:.5,dashSize:.055,gapSize:.04,depthTest:false,depthWrite:false}));guide.computeLineDistances();guide.renderOrder=7;cabinet.add(guide);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let physics,seed=0,paused=false,busy=false,time=0,started=0,previous=performance.now(),raf,drag=null,base={x:CHUTE.x,z:CHUTE.z},actual={...base},aim={...base},outcome=null,phase='',finished=false,attached=false,released=false,delivery=false,deliveryAt=0;
 const keys=new Set(),vector=new T.Vector3(),raycaster=new T.Raycaster(),pointer=new T.Vector2();
 function setPhase(p){if(phase!==p){phase=p;onPhase?.(p,outcome);}}
 function reset(next=Math.floor(Math.random()*9)){
  seed=next;physics?.destroy();physics=createPrizeWorld(seed);busy=false;outcome=null;attached=released=delivery=finished=false;aim={x:CHUTE.x,z:CHUTE.z};base={...aim};actual={...aim};clearInput();reticle.visible=guide.visible=true;
  for(let i=0;i<9;i++){toys[i].visible=true;toys[i].scale.setScalar(physics.toys[i].size);toys[i].children.forEach((model,type)=>model.visible=type===(i+seed)%models.length);}
  setPhase('aim');syncToys();
 }
 function syncToys(){physics.toys.forEach(({body},i)=>{toys[i].position.copy(body.position);toys[i].quaternion.copy(body.quaternion);});}
 function pick(){const hit=encodeAim(physics.targets(),actual.x,actual.z);return {...hit,seed,worldX:actual.x,worldZ:actual.z,toy:toyInfo(seed,hit.selected).id,multiplier:MULTIPLIERS[(hit.selected+seed)%9]};}
 function play(x,at){outcome=x;capturedY=physics.toys[x.selected].body.position.y+.53;actual=at?{x:at.worldX,z:at.worldZ}:decodeAim(physics.targets(),x.selected,x.aimX,x.aimZ);base={...actual};aim={...actual};busy=true;started=time;reticle.visible=guide.visible=false;attached=released=delivery=finished=false;}
 function pose(e,contactY){
  let x=actual.x,z=actual.z,y=3.91,closed=0;
  if(e<.22){setPhase('start');}
  else if(e<1.22){setPhase('lower');y=lerp(3.91,contactY,smooth((e-.22)/1));}
  else if(e<1.72){setPhase('close');y=contactY;closed=smooth((e-1.22)/.5);}
  else if(e<2.82){setPhase('lift');y=lerp(contactY,3.91,smooth((e-1.72)/1.1));closed=1;}
  else if(e<3.77){setPhase('travel');closed=1;const f=smooth((e-2.82)/.95);x=lerp(actual.x,CHUTE.x,f);z=lerp(actual.z,CHUTE.z,f);}
  else{setPhase(delivery?'delivery':'release');x=CHUTE.x;z=CHUTE.z;closed=1-smooth((e-3.77)/.3);}
  return {x,y,z,closed};
 }
 // Keep the view close to the glass; user zoom/orbit survives resize and rounds.
 const view={yaw:0,elevation:.39,zoom:1,mode:'aim'},pointers=new Map();let gesture=null;
 function updateCamera(){const d=Math.max(5.9,3.6/(2*Math.tan(T.MathUtils.degToRad(16))*camera.aspect))/view.zoom;
  camera.position.set(Math.sin(view.yaw)*Math.cos(view.elevation)*d,2.72+Math.sin(view.elevation)*d,Math.cos(view.yaw)*Math.cos(view.elevation)*d);camera.lookAt(0,2.72,0);camera.updateProjectionMatrix();}
 function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;updateCamera();}
 function clearInput(){previous=performance.now();keys.clear();drag=null;pointers.clear();gesture=null;}
 function adjustView(yaw=0,elevation=0,zoom=1){view.yaw=clamp(view.yaw+yaw,-.65,.65);view.elevation=clamp(view.elevation+elevation,.22,.75);view.zoom=clamp(view.zoom*zoom,.82,1.55);updateCamera();}
 function cameraGesture(){const [a,b]=[...pointers.values()];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.hypot(a.x-b.x,a.y-b.y)};}
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();document.addEventListener('visibilitychange',clearInput);
 const down=e=>{if(paused||busy||e.button>2)return;e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);
  if(pointers.size===2){drag=null;gesture=cameraGesture();return;}
  if(pointers.size===1)drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false,rotate:view.mode==='view'||e.button===2||e.shiftKey};
 };
 const move=e=>{if(paused||busy||!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size>=2){const next=cameraGesture();if(gesture)adjustView(-(next.x-gesture.x)*.006,(next.y-gesture.y)*.004,next.distance/Math.max(1,gesture.distance));gesture=next;return;}
  if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y,r=canvas.getBoundingClientRect();
  if(drag.rotate)adjustView(-dx*.007,dy*.005);
  else{const x=dx/r.width*4.8/view.zoom,z=dy/r.height*4.6/view.zoom,c=Math.cos(view.yaw),s=Math.sin(view.yaw);aim.x=clamp(aim.x+x*c+z*s,-1.4,1.4);aim.z=clamp(aim.z-x*s+z*c,-.9,.9);}
  drag.moved||=Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5;drag.x=e.clientX;drag.y=e.clientY;
 };
 const up=e=>{pointers.delete(e.pointerId);if(gesture){gesture=null;drag=null;return;}if(drag?.id!==e.pointerId)return;const tap=e.type==='pointerup'&&!drag.moved&&!drag.rotate;drag=null;if(tap){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);if(raycaster.intersectObject(button).length)onGrab?.();}};
 const wheel=e=>{e.preventDefault();if(!paused&&!busy)adjustView(0,0,Math.exp(-e.deltaY*.001));},contextmenu=e=>e.preventDefault();
 canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('contextmenu',contextmenu);
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);for(const type of['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,up);
 const keydown=e=>{if(e.key.startsWith('Arrow')&&!paused&&!busy){e.preventDefault();keys.add(e.key);}},keyup=e=>keys.delete(e.key);window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);
 let capturedY=0,slowFrames=0,renderScale=1;
 function frame(now){
  raf=requestAnimationFrame(frame);const elapsed=(now-previous)/1000,dt=clamp(elapsed,0,.25);previous=now;if(paused||document.hidden)return;time+=dt;
  slowFrames=elapsed>.07?slowFrames+1:Math.max(0,slowFrames-1);if(slowFrames>=4&&renderScale===1){renderScale=.75;renderer.setPixelRatio(Math.min(devicePixelRatio,.75));resize();}
  if(!busy){const kx=(keys.has('ArrowRight')-keys.has('ArrowLeft'))*dt*1.2/view.zoom,kz=(keys.has('ArrowDown')-keys.has('ArrowUp'))*dt*.9/view.zoom,c=Math.cos(view.yaw),s=Math.sin(view.yaw);aim.x=clamp(aim.x+kx*c+kz*s,-1.4,1.4);aim.z=clamp(aim.z-kx*s+kz*c,-.9,.9);base.x=lerp(base.x,aim.x,1-Math.exp(-dt*10));base.z=lerp(base.z,aim.z,1-Math.exp(-dt*10));actual.x=clamp(base.x+Math.sin(time*2.1)*.12,-1.43,1.43);actual.z=clamp(base.z+Math.sin(time*1.6+.8)*.04,-.94,.94);onAim?.(pick());}
  let p={x:actual.x,y:3.91,z:actual.z,closed:0},e=0;
  if(busy){e=(time-started)*(reduced?1.6:1);if(e<.2)capturedY=physics.toys[outcome.selected].body.position.y+.53;p=pose(e,capturedY);}
  bridge.position.z=busy?p.z:base.z;carriage.position.x=busy?p.x:base.x;
  claw.position.set(p.x,p.y,p.z);claw.rotation.set(busy?0:(actual.z-base.z)*1.7,busy?0:Math.sin(time*.6)*.1,busy?0:-(actual.x-base.x)*1.7);
  fingers.forEach(f=>f.rotation.x=lerp(-.25,.35,p.closed));claw.updateWorldMatrix(true,true);
  const a=new T.Vector3(busy?p.x:base.x,4.2,busy?p.z:base.z),b=new T.Vector3(p.x,p.y+.17,p.z);cable.position.copy(a).add(b).multiplyScalar(.5);cable.scale.y=a.distanceTo(b);cable.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),a.sub(b).normalize());

  if(busy){
   if(e>=1.62&&!attached){attached=true;if(outcome.quality>=300){claw.localToWorld(vector.set(0,-.33,0));physics.attach(outcome.selected,vector.x,vector.y,vector.z);}}
   if(attached&&!released){claw.localToWorld(vector.set(0,-.33,0));physics.anchor(vector.x,vector.y,vector.z,dt);}
   if(!released&&((outcome.quality<700&&e>2.12)||e>3.92)){physics.release();released=true;}
  }
  physics.step(dt);syncToys();
  if(busy&&released&&outcome.quality>=700&&physics.delivered(outcome.selected)&&!delivery){delivery=true;deliveryAt=time;setPhase('delivery');}
  if(busy&&e>4.25&&((delivery&&time-deliveryAt>.65)||(outcome.quality<700&&e>4.5)||e>6.6)&&!finished){finished=true;setPhase('done');onFinish?.(outcome);}
  reticle.position.set(actual.x,BIN.floor+.025,actual.z);guide.position.set(actual.x,BIN.floor+.03,actual.z);guide.scale.y=3.9-BIN.floor;
  bulbs.forEach((b,i)=>b.material.emissiveIntensity=busy&&!reduced?.4+Math.pow(Math.max(0,Math.sin(time*8-i*.55)),5)*1.2:.22);
  stick.rotation.z=lerp(stick.rotation.z,drag?clamp((aim.x-base.x)*-.8,-.2,.2):0,1-Math.exp(-dt*10));stick.rotation.x=lerp(stick.rotation.x,drag?clamp((aim.z-base.z)*.8,-.2,.2):0,1-Math.exp(-dt*10));button.position.y=busy?1.43:1.45;pressMaterial.emissive.setHex(busy?0x06451b:0x000000);
  renderer.render(scene,camera);
 }
 reset();raf=requestAnimationFrame(frame);
 return {pick,reset,play,view:()=>({...view}),setViewMode(mode){view.mode=mode==='view'?'view':'aim';clearInput();},zoom(factor){if(!paused&&!busy)adjustView(0,0,factor);},recenter(){if(!paused&&!busy){Object.assign(view,{yaw:0,elevation:.39,zoom:1});clearInput();updateCamera();}},buttonPoint(){const p=button.getWorldPosition(new T.Vector3()).project(camera),r=canvas.getBoundingClientRect();return {x:r.left+(p.x+1)/2*r.width,y:r.top+(1-p.y)/2*r.height};},targets:()=>physics.targets(),status:()=>({phase,renderScale,delivered:delivery,held:physics.held(),bodies:physics.targets(),aim:{...aim},toys:toys.map((_,i)=>toyInfo(seed,i).id)}),setPaused(v){paused=v;clearInput();},freeze(){return pick();},aimAt(x,z){aim={x:(x-500)/1000*3.1,z:(z-500)/1000*2.1};},inspect(angle=.26,focus){if(Number.isInteger(focus)){const t=toys[focus].position;camera.position.set(t.x+Math.sin(angle)*2,t.y+.6,t.z+Math.cos(angle)*2);camera.lookAt(t);}else{const d=10.8;camera.position.set(Math.sin(angle)*d,6.7,Math.cos(angle)*d);camera.lookAt(0,2.7,0);}},get busy(){return busy;},destroy(){
  cancelAnimationFrame(raf);physics.destroy();observer.disconnect();document.removeEventListener('visibilitychange',clearInput);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('contextmenu',contextmenu);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);for(const t of['pointerup','pointercancel','lostpointercapture'])canvas.removeEventListener(t,up);
  const geometries=new Set(),mats=new Set(materials),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);});geometries.forEach(g=>g.dispose());mats.forEach(m=>{for(const value of Object.values(m))if(value?.isTexture)textures.add(value);m.dispose();});textures.forEach(t=>t.dispose());glass.dispose();environment.dispose();renderer.dispose();
 }};
}
