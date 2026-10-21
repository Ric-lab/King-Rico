import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {COMPETITORS} from './competitors.js';
import {LENGTH,RADIUS,point,ballPoint,viewPose} from './course.mjs';
const {finishTime,progress}=require('../../cloud/race.cjs');
const COUNTDOWN=2.6;
const clamp=T.MathUtils.clamp;
export async function createRaceScene(canvas,{onTick,onFinish,onLabel}){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(40,1,.1,160);
 scene.fog=new T.FogExp2(0x361344,.016);
 const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();scene.environment=env.texture;scene.environmentIntensity=.65;
 scene.add(new T.HemisphereLight(0xffe9ca,0x382354,2.3));
 const key=new T.DirectionalLight(0xffe5be,3.4);key.position.set(-4,15,5);key.castShadow=true;key.shadow.mapSize.set(512,512);key.shadow.camera.left=-9;key.shadow.camera.right=9;key.shadow.camera.top=9;key.shadow.camera.bottom=-9;key.shadow.normalBias=.025;scene.add(key,key.target);
 const fill=new T.DirectionalLight(0xa6cfff,1.5);fill.position.set(5,6,-8);scene.add(fill);
 const gold=new T.MeshStandardMaterial({color:0xf3c66d,metalness:.65,roughness:.3}),red=new T.MeshStandardMaterial({color:0x951a3d,roughness:.4}),cream=new T.MeshStandardMaterial({color:0xe9cda5,roughness:.62}),plum=new T.MeshStandardMaterial({color:0x401a50,roughness:.7});
 function mesh(geometry,material,parent=scene){const o=new T.Mesh(geometry,material);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 // One continuous ribbon: the marbles remain in contact through banked curves.
 function ribbon(left,right,offset,material){const pos=[],uv=[],idx=[],n=720;for(let i=0;i<=n;i++){const d=-3+i*(LENGTH+8)/n;for(const lane of[left,right]){const p=point(d,lane);pos.push(p.x,p.y+offset,p.z);uv.push(lane<0?0:1,d/3);}}for(let i=0;i<n;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();material.side=T.DoubleSide;return mesh(g,material);}
 ribbon(-1.95,1.95,-.01,gold);ribbon(-1.76,1.76,0,cream);ribbon(-2.06,2.06,-.20,red);
 const wallPosts=new T.InstancedMesh(new T.CylinderGeometry(.045,.045,.35,6),red,300),matrix=new T.Matrix4();wallPosts.castShadow=wallPosts.receiveShadow=true;scene.add(wallPosts);let postIndex=0;
 for(const lane of[-2.0,2.0]){
  const points=Array.from({length:250},(_,i)=>point(-3+i*(LENGTH+8)/249,lane).add(new T.Vector3(0,.15,0)));
  mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),600,.10,8,false),gold);
  // Deep sides make the circuit read as a built wooden toy, not a floating line.
  for(let i=0;i<150;i++){const d=-3+i*(LENGTH+8)/149,p=point(d,lane);p.y-=.035;wallPosts.setMatrixAt(postIndex++,matrix.makeTranslation(p.x,p.y,p.z));}
 }
 for(let d=2;d<LENGTH;d+=8){for(const lane of[-1.66,1.66]){const p=point(d,lane),post=mesh(new T.CylinderGeometry(.10,.19,2.8,8),red);post.position.copy(p);post.position.y-=1.55;const collar=mesh(new T.TorusGeometry(.17,.03,6,14),gold);collar.rotation.x=Math.PI/2;collar.position.copy(p);collar.position.y-=.28;}}
 function sign(text,w,h){const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d');g.fillStyle='#6d173b';g.fillRect(0,0,1024,256);g.strokeStyle='#ffe39a';g.lineWidth=15;g.strokeRect(8,8,1008,240);g.font='72px "Rammetto One"';g.fillStyle='#ffe8ae';g.textAlign='center';g.textBaseline='middle';g.fillText(text,512,135);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:t,side:T.DoubleSide}));}
 await document.fonts.load('24px "Rammetto One"');
 for(const [d,name]of[[0,'LARGADA'],[LENGTH,'CHEGADA']]){
  const p=point(d);for(const side of[-1,1]){const post=mesh(new T.CylinderGeometry(.12,.15,2.2,12),red);post.position.copy(point(d,side*2.15)).add(new T.Vector3(0,1,0));const cap=mesh(new T.SphereGeometry(.18,14,10),gold);cap.position.copy(post.position);cap.position.y+=1.15;}
  const board=sign(name,4.1,.65);board.position.copy(p).add(new T.Vector3(0,2,0));
 }
 const checkerCanvas=document.createElement('canvas');checkerCanvas.width=512;checkerCanvas.height=128;const cg=checkerCanvas.getContext('2d');for(let y=0;y<2;y++)for(let x=0;x<8;x++){cg.fillStyle=(x+y)%2?'#fff3d5':'#402039';cg.fillRect(x*64,y*64,64,64);}const checker=new T.CanvasTexture(checkerCanvas);checker.colorSpace=T.SRGBColorSpace;
 const finish=mesh(new T.PlaneGeometry(3.85,.7),new T.MeshStandardMaterial({map:checker,roughness:.7}));finish.rotation.x=-Math.PI/2;finish.position.copy(point(LENGTH)).add(new T.Vector3(0,.012,0));
 // Starting gate physically lifts before the first forward movement.
 const gate=mesh(new T.CylinderGeometry(.055,.055,3.95,12),gold);gate.rotation.z=Math.PI/2;gate.position.copy(point(.45)).add(new T.Vector3(0,.27,0));
 // A light circus surround stays subordinate to the moving marbles.
 const bulbGeo=new T.SphereGeometry(.075,8,6),bulbMat=new T.MeshBasicMaterial({color:0xffd790});
 for(let d=0;d<=LENGTH;d+=2){for(const lane of[-2.19,2.19]){const b=mesh(bulbGeo,bulbMat);b.position.copy(point(d,lane));b.position.y+=.35;}}
 for(let d=7;d<LENGTH;d+=12){const p=point(d,-4.0);const pedestal=mesh(new T.CylinderGeometry(.75,.9,.25,20),gold);pedestal.position.copy(p);pedestal.position.y-=1;const cone=mesh(new T.ConeGeometry(.8,1.4,12),red);cone.position.copy(p);cone.position.y-=.2;}
 const balls=[],halos=[];
 for(let i=0;i<5;i++){
  const root=new T.Group();scene.add(root);balls.push(root);
  const material=new T.MeshPhysicalMaterial({color:COMPETITORS[i].color,roughness:.17,metalness:.03,clearcoat:.8,clearcoatRoughness:.12});mesh(new T.SphereGeometry(RADIUS,36,24),material,root);
  const pearl=new T.MeshStandardMaterial({color:0xfff1c7,roughness:.27,metalness:.12});
  for(let band=0;band<2;band++){const points=[];for(let j=0;j<=90;j++){const t=j/90*Math.PI*2,phi=t*1.4+band*Math.PI,r=RADIUS+.002;points.push(new T.Vector3(r*Math.sin(t)*Math.cos(phi),r*Math.cos(t),r*Math.sin(t)*Math.sin(phi)));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),100,.012,6,false),pearl,root);}
  const h=mesh(new T.TorusGeometry(.39,.035,8,40),new T.MeshBasicMaterial({color:0xffe3a0,toneMapped:false,transparent:true,opacity:.9}));h.rotation.x=Math.PI/2;halos.push(h);
 }
 let selected=0,seed=0,version=2,active=false,paused=false,elapsed=0,previous=performance.now(),raf,finished=false,lastTick=-1,slow=0,lowQuality=false;
 const focus=new T.Vector3(),cameraTarget=new T.Vector3(),cameraPosition=new T.Vector3();let cameraReady=false;let ranking=[0,1,2,3,4],shownLabels=[];const look=new T.Vector3();
 function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}const observer=new ResizeObserver(resize);observer.observe(canvas);resize();const clearClock=()=>{previous=performance.now();};document.addEventListener('visibilitychange',clearClock);
 function reset(index=selected){selected=index;version=2;active=false;elapsed=0;finished=false;cameraReady=false;onLabel?.('Escolha sua bolinha e torça');}
 function play(outcome,from=0){seed=outcome.seed;version=outcome.version??1;selected=outcome.selected;elapsed=from;active=true;finished=false;lastTick=-1;cameraReady=false;previous=performance.now();}
 function frame(now){raf=requestAnimationFrame(frame);const dt=clamp((now-previous)/1000,0,1);previous=now;if(paused||document.hidden)return;
  slow=dt>.065?slow+1:Math.max(0,slow-1);if(slow>5&&!lowQuality){lowQuality=true;renderer.setPixelRatio(Math.min(devicePixelRatio,.85));resize();}
  if(active&&!finished)elapsed+=dt;
  const t=Math.max(0,elapsed-COUNTDOWN),count=version===2?5:4,ids=Array.from({length:count},(_,i)=>i),positions=ids.map(i=>active?progress(seed,i,t,version):0),order=ids.slice().sort((a,b)=>positions[b]-positions[a]||(positions[a]===1?finishTime(seed,a,version)-finishTime(seed,b,version):a-b)),lead=order[0];
  ranking=order;
  balls.forEach((ball,i)=>{ball.visible=i<count;if(i>=count){halos[i].visible=false;return;}const d=positions[i]*LENGTH,p=ballPoint(positions[i],i,count,active);ball.position.copy(p);ball.rotation.set(-d/RADIUS,Math.sin(d*.12)*.5,i*.7);halos[i].visible=i===selected;halos[i].position.copy(p);halos[i].position.y+=.07-RADIUS;});
  gate.position.y=point(.45).y+.27+(active?T.MathUtils.smoothstep(elapsed,1.5,2.5)*1.6:0);
  const pose=viewPose(positions,selected,camera.aspect,reduced,active);focus.copy(pose.focus);cameraTarget.copy(pose.target);cameraPosition.copy(pose.position);
  const a=cameraReady?1-Math.exp(-dt*3):1;camera.position.lerp(cameraPosition,a);look.lerp(cameraTarget,a);camera.lookAt(look);cameraReady=true;
  key.position.copy(focus).add(new T.Vector3(-4,12,6));key.target.position.copy(focus);key.target.updateMatrixWorld();
  renderer.render(scene,camera);
  const labels=balls.map((b,i)=>{const p=b.position.clone().add(new T.Vector3(0,.65,0)).project(camera);return {i,x:(p.x+1)/2,y:(1-p.y)/2,place:order.indexOf(i)+1,visible:i<count&&p.z<1&&Math.abs(p.x)<1.2&&Math.abs(p.y)<1.2};});
  shownLabels=labels;
  if(active&&Math.floor(elapsed*5)!==lastTick){lastTick=Math.floor(elapsed*5);onTick?.({elapsed,time:t,lead,order,positions,labels,phase:Math.max(...positions)<.33?'Curvas do circo':Math.max(...positions)<.72?'Sobe e desce':'Reta final',countdown:elapsed<COUNTDOWN?Math.ceil(COUNTDOWN-elapsed):0});}
  else if(!active)onTick?.({elapsed:0,time:0,lead:null,order,positions,labels,countdown:0});
  if(active&&!finished&&t>Math.max(...ids.map(i=>finishTime(seed,i,version)))+.5){finished=true;onFinish?.();}
 }
 reset();raf=requestAnimationFrame(frame);
 return {play,reset,select(i){if(!active)selected=i;},setPaused(v){paused=v;previous=performance.now();},status:()=>({active,paused,elapsed,seed,version,selected,finished,labels:shownLabels,order:[...ranking],positions:Array.from({length:version===2?5:4},(_,i)=>active?progress(seed,i,Math.max(0,elapsed-COUNTDOWN),version):0)}),destroy(){cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',clearClock);const gs=new Set(),ms=new Set(),ts=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of o.material?Array.isArray(o.material)?o.material:[o.material]:[])ms.add(m);});gs.forEach(g=>g.dispose());ms.forEach(m=>{for(const v of Object.values(m))if(v?.isTexture)ts.add(v);m.dispose();});ts.forEach(t=>t.dispose());env.dispose();renderer.dispose();}};
}
