import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {COMPETITORS} from './competitors.js';
import {LENGTH,RADIUS,RAMP,FUNNEL,RUNOUT,PINS,DRUMS,halfWidth,center,at,ballY,phase} from './course.mjs';
import {plan,distance,lanes,settledAt} from './script.mjs';
const {circusPair}=require('../../cloud/race.cjs');
export const CIRCUS_READY=true;
const COUNTDOWN=2.6,clamp=T.MathUtils.clamp,V=(p,dy=0)=>new T.Vector3(p.x,p.y+dy,p.z);
const BULB_OFF=new T.Color(0x4a2238),BULB_ON=new T.Color(0xffd77a);
function texture(w,h,draw,repeat){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;if(repeat){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(...repeat);}return t;}
const loadImage=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src;});
export async function createRaceScene(canvas,{onTick,onFinish,onLabel}){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(56,1,.1,140);
 scene.fog=new T.Fog(0x2a0b3a,18,60);
 const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();scene.environment=env.texture;scene.environmentIntensity=.55;
 scene.add(new T.HemisphereLight(0xffe2c0,0x2a0b3a,1.15));
 const key=new T.DirectionalLight(0xfff0d8,2.6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,far:40});key.shadow.normalBias=.03;scene.add(key,key.target);
 const rim=new T.DirectionalLight(0xff9a6a,1.2);rim.position.set(6,5,-20);scene.add(rim);
 const mesh=(g,m,cast=true)=>{const o=new T.Mesh(g,m);o.castShadow=cast;o.receiveShadow=true;scene.add(o);return o;};
 // Palette: red velvet floor, gold rails, red/cream curbs, plum night.
 const floorMap=texture(128,256,(g,w,h)=>{g.fillStyle='#7a1030';g.fillRect(0,0,w,h);g.fillStyle='#8a1638';for(let y=0;y<h;y+=32)for(let x=(y/32%2)*16;x<w;x+=32){g.beginPath();g.moveTo(x+16,y);g.lineTo(x+32,y+16);g.lineTo(x+16,y+32);g.lineTo(x,y+16);g.fill();}g.fillStyle='#f3c66d';for(const x of[.2,.4,.6,.8])g.fillRect(x*w-1.5,8,3,h/2-16);});
 const curbMap=texture(64,8,(g,w,h)=>{g.fillStyle='#fff1d2';g.fillRect(0,0,w,h);g.fillStyle='#c4213f';g.fillRect(0,0,w/2,h);});
 const floor=new T.MeshStandardMaterial({map:floorMap,roughness:.6,envMapIntensity:.15,side:T.DoubleSide}),curb=new T.MeshStandardMaterial({map:curbMap,roughness:.45,envMapIntensity:.3,side:T.DoubleSide}),gold=new T.MeshStandardMaterial({color:0xf3c66d,metalness:.75,roughness:.28,emissive:0x3a2200}),skirt=new T.MeshStandardMaterial({color:0x2c0d3a,roughness:.8,side:T.DoubleSide}),red=new T.MeshStandardMaterial({color:0xb81f42,roughness:.35});
 const span=[-4,LENGTH+RUNOUT],N=Math.round((span[1]-span[0])*5),ds=Array.from({length:N+1},(_,i)=>span[0]+i*(span[1]-span[0])/N);
 function strip(fn,material,vRepeat,cast=false){const pos=[],uv=[],idx=[],cols=fn(0).length;ds.forEach((d,i)=>{fn(d).forEach((p,j)=>{pos.push(p.x,p.y,p.z);uv.push(j/(cols-1),d/vRepeat);});if(i<N)for(let j=0;j<cols-1;j++){const a=i*cols+j;idx.push(a,a+1,a+cols,a+1,a+cols+1,a+cols);}});const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return mesh(g,material,cast);}
 strip(d=>{const h=halfWidth(d);return [-1,-.5,0,.5,1].map(s=>at(d,s*h));},floor,4);
 for(const side of[-1,1]){
  const e=d=>halfWidth(d)*side;
  strip(d=>[at(d,e(d)),{...at(d,e(d)),y:center(d).y+.32},{...at(d,e(d)+side*.22),y:center(d).y+.32},{...at(d,e(d)+side*.22),y:center(d).y-.9}],curb,2);
  strip(d=>[{...at(d,e(d)+side*.22),y:center(d).y-.9},{...at(d,e(d)+side*.22),y:center(d).y-1.6}],skirt,4);
  const rail=new T.CatmullRomCurve3(ds.filter((_,i)=>i%3===0).map(d=>V(at(d,e(d)+side*.11),.62+(center(d).y-center(d).y))));
  mesh(new T.TubeGeometry(rail,N,.055,8,false),gold);
 }
 const postGeo=new T.CylinderGeometry(.03,.03,.3,6),postCount=Math.ceil((span[1]-span[0])/1.5)*2,posts=new T.InstancedMesh(postGeo,gold,postCount),bulbs=new T.InstancedMesh(new T.SphereGeometry(.065,10,8),new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}),postCount),bulbD=[],m4=new T.Matrix4();let k=0;
 for(let d=span[0];d<span[1];d+=1.5)for(const side of[-1,1]){const p=at(d,(halfWidth(d)+.11)*side),y=center(d).y;posts.setMatrixAt(k,m4.makeTranslation(p.x,y+.47,p.z));bulbs.setMatrixAt(k,m4.makeTranslation(p.x,y+.7,p.z));bulbs.setColorAt(k,BULB_OFF);bulbD.push(d);k++;}
 posts.count=bulbs.count=k;scene.add(posts,bulbs);let lit=-1;
 function setLit(d){const n=bulbD.filter(b=>b<=d).length;if(n===lit)return;lit=n;bulbD.forEach((b,i)=>bulbs.setColorAt(i,b<=d?BULB_ON:BULB_OFF));bulbs.instanceColor.needsUpdate=true;}
 // Obstacles: gold pin forest, striped circus drums, ramp lip.
 const pinGeo=new T.CylinderGeometry(.07,.07,.55,10),capGeo=new T.SphereGeometry(.11,12,8);
 for(const o of PINS){const p=at(o.d,o.lane),y=center(o.d).y;mesh(pinGeo,gold).position.set(p.x,y+.27,p.z);mesh(capGeo,red).position.set(p.x,y+.6,p.z);}
 const drumMap=texture(256,64,(g,w,h)=>{g.fillStyle='#b81f42';g.fillRect(0,0,w,h);g.strokeStyle='#fff1d2';g.lineWidth=6;g.beginPath();for(let x=0;x<=w;x+=32){g.lineTo(x,14);g.lineTo(x+16,50);}g.stroke();},[2,1]);
 const drumSide=new T.MeshStandardMaterial({map:drumMap,roughness:.4}),drumTop=new T.MeshStandardMaterial({color:0xfff1d2,roughness:.5});
 for(const o of DRUMS){const p=at(o.d,o.lane),y=center(o.d).y;mesh(new T.CylinderGeometry(o.r,o.r,.6,32),[drumSide,drumTop,drumTop]).position.set(p.x,y+.3,p.z);for(const h of[.02,.6]){const r=mesh(new T.TorusGeometry(o.r+.01,.035,8,36),gold);r.rotation.x=Math.PI/2;r.position.set(p.x,y+h,p.z);}}
 {const a=at(RAMP,-halfWidth(RAMP)),b=at(RAMP,halfWidth(RAMP)),lip=mesh(new T.CylinderGeometry(.06,.06,1,10),gold);lip.scale.y=Math.hypot(b.x-a.x,b.z-a.z);lip.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(b.x-a.x,0,b.z-a.z).normalize());lip.position.set((a.x+b.x)/2,center(RAMP).y+.03,(a.z+b.z)/2);}
 const checker=texture(256,32,(g,w,h)=>{for(let x=0;x<16;x++)for(let y=0;y<2;y++){g.fillStyle=(x+y)%2?'#fff1d2':'#2c0d3a';g.fillRect(x*16,y*16,16,16);}});
 {const w=halfWidth(LENGTH)*2,f=mesh(new T.PlaneGeometry(w,.5),new T.MeshStandardMaterial({map:checker,roughness:.6}),false);const c=center(LENGTH);f.rotation.set(-Math.PI/2,-Math.atan2(c.nz,c.nx),0,'YXZ');f.position.set(c.x,c.y+.012,c.z);}
 await document.fonts.load('24px "Rammetto One"');
 function arch(d,text){const c=center(d),w=halfWidth(d)+.4,angle=-Math.atan2(c.nz,c.nx);
  for(const s of[-1,1]){const p=at(d,s*w);mesh(new T.CylinderGeometry(.09,.11,2.2,12),gold).position.set(p.x,c.y+1.1,p.z);}
  const cv=document.createElement('canvas');cv.width=512;cv.height=96;const g=cv.getContext('2d');g.fillStyle='#b81f42';g.fillRect(0,0,512,96);g.strokeStyle='#f3c66d';g.lineWidth=8;g.strokeRect(4,4,504,88);g.font='52px "Rammetto One"';g.fillStyle='#fff1d2';g.textAlign='center';g.textBaseline='middle';g.fillText(text,256,52);const t=new T.CanvasTexture(cv);t.colorSpace=T.SRGBColorSpace;
  const b=mesh(new T.PlaneGeometry(w*2,w*2*96/512),new T.MeshBasicMaterial({map:t,side:T.DoubleSide}),false);b.position.set(c.x,c.y+2.05,c.z);b.rotation.y=angle;}
 arch(0,'LARGADA');arch(LENGTH,'CHEGADA');
 const gate=mesh(new T.CylinderGeometry(.05,.05,4.1,12),gold);gate.rotation.z=Math.PI/2;{const c=center(.5);gate.rotation.y=-Math.atan2(c.nz,c.nx);}
 // Distant warm lights in the dark: the big top at night.
 {const n=260,p=new Float32Array(n*3);for(let i=0;i<n;i++){const d=Math.random()*(LENGTH+30)-10,c=center(d),s=Math.random()<.5?-1:1;p.set([c.x+s*(6+Math.random()*22),c.y-6+Math.random()*16,c.z+(Math.random()-.5)*6],i*3);}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));scene.add(new T.Points(g,new T.PointsMaterial({color:0xffcf7a,size:.16,fog:false,transparent:true,opacity:.75})));}
 const arts=await Promise.all(COMPETITORS.map(c=>loadImage(c.art))),balls=[],halos=[];
 for(let i=0;i<5;i++){
  const map=texture(512,256,(g,w,h)=>{g.fillStyle=COMPETITORS[i].css;g.fillRect(0,0,w,h);for(const cx of[128,384]){g.fillStyle='#fff6e2';g.beginPath();g.arc(cx,h/2,62,0,7);g.fill();g.strokeStyle='#f3c66d';g.lineWidth=8;g.stroke();const a=arts[i];if(a){const s=Math.min(98/a.width,98/a.height);g.drawImage(a,cx-a.width*s/2,h/2-a.height*s/2,a.width*s,a.height*s);}}});
  const b=mesh(new T.SphereGeometry(RADIUS,32,22),new T.MeshPhysicalMaterial({map,roughness:.25,clearcoat:1,clearcoatRoughness:.1,envMapIntensity:.6}));balls.push(b);
  const h=mesh(new T.TorusGeometry(.4,.035,8,40),new T.MeshBasicMaterial({color:0xffd36a,toneMapped:false}),false);h.rotation.x=Math.PI/2;halos.push(h);
 }
 const FIRST=new T.Color(0xffd36a),SECOND=new T.Color(0xfff6e4);
 const CONF=160,cp=new Float32Array(CONF*3),cv=new Float32Array(CONF*3),cc=new Float32Array(CONF*3),pal=[0xf3c66d,0xc4213f,0x9b46ee,0xfff1d2,0x69d6f2].map(c=>new T.Color(c)),cg=new T.BufferGeometry();cg.setAttribute('position',new T.BufferAttribute(cp,3));cg.setAttribute('color',new T.BufferAttribute(cc,3));
 const confetti=new T.Points(cg,new T.PointsMaterial({size:.1,vertexColors:true,toneMapped:false}));confetti.visible=false;confetti.frustumCulled=false;scene.add(confetti);let confLife=0;
 function burst(){const c=center(LENGTH);for(let i=0;i<CONF;i++){cp.set([c.x+(Math.random()-.5)*2.4,c.y+2,c.z],i*3);cv.set([(Math.random()-.5)*3,1+Math.random()*3,(Math.random()-.5)*2],i*3);pal[i%5].toArray(cc,i*3);}cg.attributes.color.needsUpdate=true;confLife=2.4;confetti.visible=!reduced;}
 let lat=null,selected=0,selected2=-1,race=null,active=false,paused=false,elapsed=0,previous=performance.now(),raf,finished=false,lastTick=-1,slow=0,lowQuality=false,photo=0,burstDone=false,ranking=[0,1,2,3,4],shown=[],seed=0;
 const look=new T.Vector3(),camPos=new T.Vector3(),camLook=new T.Vector3(),axis=new T.Vector3(),q=new T.Quaternion();let camReady=false;
 function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}const observer=new ResizeObserver(resize);observer.observe(canvas);resize();const clearClock=()=>{previous=performance.now();};document.addEventListener('visibilitychange',clearClock);
 const distances=t=>race?[0,1,2,3,4].map(i=>distance(race,i,t)):[0,0,0,0,0];
 function reset(i=selected,i2=-1){selected=i;selected2=i2;race=null;active=false;elapsed=0;finished=false;camReady=false;photo=0;burstDone=false;onLabel?.('Escolha sua bolinha e torça');}
 function play(outcome,from=0){selected=outcome.selected;selected2=outcome.selected2??-1;seed=outcome.seed;camReady=false;photo=0;finished=false;lastTick=-1;previous=performance.now();
  // Rounds from older versions are already settled: show the result straight away.
  if((outcome.version??1)!==4){race=null;active=false;finished=true;setTimeout(()=>onFinish?.(),0);return;}
  race=plan(seed,circusPair(seed));elapsed=from;active=true;burstDone=from>COUNTDOWN+race.times[race.order[0]];}
 function frame(now){raf=requestAnimationFrame(frame);const dt=clamp((now-previous)/1000,0,.1);previous=now;if(paused||document.hidden)return;
  slow=dt>.06?slow+1:Math.max(0,slow-1);if(slow>6&&!lowQuality){lowQuality=true;renderer.setPixelRatio(Math.min(devicePixelRatio,.9));renderer.shadowMap.enabled=false;resize();}
  if(active&&!finished)elapsed+=elapsed<COUNTDOWN?dt:dt*(1-.7*photo);
  const t=Math.max(0,elapsed-COUNTDOWN),d=distances(t),l=active?(lat=lanes(race,t,d,lat)):(lat=null,[-1.46,-.73,0,.73,1.46]),order=[0,1,2,3,4].sort((a,b)=>d[b]-d[a]);ranking=order;
  balls.forEach((b,i)=>{const p=at(d[i],l[i]),c=center(d[i]);b.position.set(p.x,ballY(d[i]),p.z);axis.set(c.nx,0,c.nz);b.quaternion.copy(q.setFromAxisAngle(axis,-d[i]/RADIUS)).multiply(q.setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2+Math.atan2(c.nz,c.nx)));
   const h=halos[i];h.visible=i===selected||i===selected2;h.material.color.copy(i===selected2?SECOND:FIRST);h.position.set(p.x,center(d[i]).y+.03,p.z);});
  {const c=center(.5);gate.position.set(c.x,c.y+.25+(active?T.MathUtils.smoothstep(elapsed,1.6,2.5)*1.5:0),c.z);}
  const s=[...d].sort((a,b)=>b-a),pair=selected2>=0,close=s[0]-s[1]<1||pair&&s[1]-s[2]<1;
  const want=active&&!finished&&!reduced&&s[0]>LENGTH-6&&s[pair?2:1]<LENGTH+.2&&close;
  photo+=((want?1:0)-photo)*Math.min(1,dt*(want?6:2));if(photo<.002)photo=0;
  setLit(active?Math.min(s[0],LENGTH+1):-1);
  // Low chase camera behind the chosen marble, nudged toward the leader.
  const own=d[selected],focusD=clamp(own*.8+s[0]*.2,0,LENGTH+3),fc=center(focusD),back=camera.aspect<.85?5.4:4.6,bc=at(Math.max(-4,focusD-back),l[selected]*.55);
  camPos.set(bc.x,center(Math.max(-4,focusD-back)).y+2.5,bc.z);const ahead=at(focusD+2.2,l[selected]*.5);camLook.set(ahead.x,center(focusD+2.2).y+.35,ahead.z);
  if(!active){const st=at(-5.5,0);camPos.set(st.x+1.2,center(-5.5).y+2.7,st.z);camLook.set(center(2).x,center(2).y+.2,center(2).z);}
  if(photo){const f=center(LENGTH),side=at(LENGTH-2.6,camera.aspect<.85?-3.2:-2.8),sy=center(LENGTH-2.6).y;camPos.lerp(new T.Vector3(side.x,sy+1.9,side.z),photo);camLook.lerp(new T.Vector3(f.x,f.y+.35,f.z),photo);}
  const a=camReady?1-Math.exp(-dt*(photo?5:4.5)):1;camera.position.lerp(camPos,a);look.lerp(camLook,a);camera.lookAt(look);camReady=true;
  key.position.set(fc.x-3,fc.y+11,fc.z+5);key.target.position.set(fc.x,fc.y,fc.z);key.target.updateMatrixWorld();
  if(active&&!burstDone&&s[0]>=LENGTH){burstDone=true;burst();}
  if(confLife>0){confLife-=dt;for(let i=0;i<CONF;i++){cv[i*3+1]-=5*dt;for(let j=0;j<3;j++)cp[i*3+j]+=cv[i*3+j]*dt;}cg.attributes.position.needsUpdate=true;if(confLife<=0)confetti.visible=false;}
  renderer.render(scene,camera);
  const labels=balls.map((b,i)=>{const p=b.position.clone().add(new T.Vector3(0,.62,0)).project(camera);return {i,x:(p.x+1)/2,y:(1-p.y)/2,place:order.indexOf(i)+1,visible:p.z<1&&Math.abs(p.x)<1.15&&Math.abs(p.y)<1.15};});shown=labels;
  const pos=d.map(x=>clamp(x/LENGTH,0,1));
  if(active&&Math.floor(elapsed*5)!==lastTick){lastTick=Math.floor(elapsed*5);onTick?.({elapsed,time:t,preparing:false,lead:order[0],order,positions:pos,labels,photo:photo>.5,phase:phase(s[0]),countdown:elapsed<COUNTDOWN?Math.ceil(COUNTDOWN-elapsed):0});}
  else if(!active)onTick?.({elapsed:0,time:0,lead:null,order,positions:pos,labels,countdown:0});
  if(active&&!finished&&t>settledAt(race)){finished=true;onFinish?.();}
 }
 reset();raf=requestAnimationFrame(frame);
 return {play,reset,select(i,i2=-1){if(!active){selected=i;selected2=i2;}},setPaused(v){paused=v;previous=performance.now();},arrival:i=>race?race.times[i]:Infinity,version:()=>4,
  status:()=>({active,paused,preparing:false,elapsed,seed,version:4,selected,selected2,finished,photo,labels:shown,order:[...ranking],positions:distances(Math.max(0,elapsed-COUNTDOWN)).map(x=>clamp(x/LENGTH,0,1))}),
  destroy(){cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',clearClock);scene.traverse(o=>{o.geometry?.dispose();for(const m of o.material?[].concat(o.material):[]){m.map?.dispose();m.dispose();}});env.dispose();renderer.dispose();}};
}
