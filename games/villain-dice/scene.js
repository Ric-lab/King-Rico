import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as CANNON from 'cannon-es';
// Gesture controls launch velocity and real rigid-body bounces. The receipt owns
// the final face: late settling reveals that face, never draws another outcome.
export function createDiceScene(host,{value,kind='tony',portrait,onLand,onImpact,onThrow,onError}){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-4.5,4.5,4.5,-4.5,.1,60);camera.position.set(0,9,7);camera.lookAt(0,.2,0);
 scene.add(new THREE.HemisphereLight(0xffffff,0x6c5682,1.4));
 const key=new THREE.DirectionalLight(0xffffff,1.8);key.position.set(-3,8,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=6;key.shadow.camera.bottom=-6;key.shadow.normalBias=.025;scene.add(key);
 const fill=new THREE.DirectionalLight(0xb9dfff,.75);fill.position.set(5,3,-3);scene.add(fill);
 const world=new CANNON.World({gravity:new CANNON.Vec3(0,-22,0),allowSleep:true});
 world.defaultContactMaterial.friction=.4;world.defaultContactMaterial.restitution=.38;
 const floor=new CANNON.Body({mass:0,shape:new CANNON.Plane()});floor.quaternion.setFromEuler(-Math.PI/2,0,0);world.addBody(floor);
 const tone={tony:0xd7772b,ray:0x286e42,tucker:0x226d9b}[kind];
 const felt=new THREE.Mesh(new THREE.BoxGeometry(50,.1,50),new THREE.MeshStandardMaterial({color:tone,roughness:1}));felt.position.y=-.1;felt.receiveShadow=true;scene.add(felt);
 let logoTexture;const logoMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:.3,depthWrite:false});
 const logo=new THREE.Mesh(new THREE.PlaneGeometry(5.5,5.5),logoMaterial);logo.rotation.x=-Math.PI/2;logo.position.set(0,.012,-.25);scene.add(logo);
 if(portrait)logoTexture=new THREE.TextureLoader().load(portrait,tex=>{tex.colorSpace=THREE.SRGBColorSpace;logoMaterial.map=tex;logoMaterial.needsUpdate=true;if(!disposed)draw();});
 for(const [x,z,w,d]of [[-4.35,0,.22,7.3],[4.35,0,.22,7.3],[0,-3.55,8.9,.22],[0,3.55,8.9,.22]]){
  const wall=new CANNON.Body({mass:0,shape:new CANNON.Box(new CANNON.Vec3(w/2,1,d/2))});wall.position.set(x,.7,z);world.addBody(wall);
 }
 const textures=[],materials=[];
 for(const n of [1,3,4,5,0,2]){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');
  c.fillStyle='#c91e2e';c.fillRect(0,0,512,512);
  const dots=[[],[[0,0]],[[-1,-1],[1,1]],[[-1,-1],[0,0],[1,1]],[[-1,-1],[1,-1],[-1,1],[1,1]],[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]]];
  if(n===0){c.strokeStyle='#fff7e8';c.lineWidth=22;c.beginPath();c.ellipse(256,256,65,85,0,0,Math.PI*2);c.stroke();}
  for(const [x,y]of dots[n]){const cx=256+x*111,cy=256+y*111,g=c.createRadialGradient(cx-8,cy-10,3,cx,cy,40);g.addColorStop(0,'#fffdf4');g.addColorStop(1,'#ddd6cb');c.fillStyle=g;c.beginPath();c.arc(cx,cy,39,0,Math.PI*2);c.fill();}
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;textures.push(tex);
  materials.push(new THREE.MeshPhysicalMaterial({map:tex,roughness:.26,metalness:0,clearcoat:.5,clearcoatRoughness:.2}));
 }
 const mesh=new THREE.Mesh(new RoundedBoxGeometry(2.05,2.05,2.05,6,.2),materials);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
 const half=1.025,body=new CANNON.Body({mass:1,shape:new CANNON.Box(new CANNON.Vec3(half,half,half)),linearDamping:.24,angularDamping:.18});body.position.set(0,1.05,1.7);world.addBody(body);
 const targets=[[-Math.PI/2,0,0],[0,0,Math.PI/2],[Math.PI/2,0,0],[0,0,-Math.PI/2],[0,0,0],[Math.PI,0,0]];
 const target=new THREE.Quaternion().setFromEuler(new THREE.Euler(...targets[value]));
 const q=new THREE.Quaternion(),up=new THREE.Vector3(),axes=[new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)];
 let disposed=false,launched=false,landed=false,raf,last=performance.now(),start=0,lastImpact=0;
 body.addEventListener('collide',e=>{const t=performance.now();if(launched&&!landed&&t-lastImpact>130&&Math.abs(e.contact.getImpactVelocityAlongNormal())>1.8){lastImpact=t;onImpact?.();}});
 function resize(){if(disposed)return;const r=host.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.top=4.5*r.height/Math.max(1,r.width);camera.bottom=-camera.top;camera.updateProjectionMatrix();if(!launched||landed)draw();}
 function draw(){mesh.position.copy(body.position);mesh.quaternion.copy(body.quaternion);renderer.render(scene,camera);}
 function frame(now){if(disposed)return;const dt=Math.min(.05,(now-last)/1000);last=now;
  if(launched&&!landed){
   const age=(now-start)/1000;
   if(age<2.25)world.step(1/120,dt,6);
   else{
    body.type=CANNON.Body.KINEMATIC;body.velocity.setZero();body.angularVelocity.setZero();
    body.position.x=THREE.MathUtils.lerp(body.position.x,THREE.MathUtils.clamp(body.position.x,-2.9,2.9),1-Math.exp(-dt*8));body.position.z=THREE.MathUtils.lerp(body.position.z,THREE.MathUtils.clamp(body.position.z,-2.15,2.15),1-Math.exp(-dt*8));
    q.copy(body.quaternion).slerp(target,1-Math.exp(-dt*8));body.quaternion.copy(q);
    const support=half*axes.reduce((sum,a)=>sum+Math.abs(up.copy(a).applyQuaternion(q).y),0);
    body.position.y=THREE.MathUtils.lerp(body.position.y,support+.015,1-Math.exp(-dt*12));
    if(age>3.35){body.quaternion.copy(target);body.position.y=half+.015;landed=true;const face=materials[[4,0,5,1,2,3][value]];face.emissive.set(0x4b0009);face.emissiveIntensity=.1;host.dataset.face=String(value);onLand?.();}
   }
  }
  draw();if(!landed)raf=requestAnimationFrame(frame);
 }
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
 const lost=e=>{e.preventDefault();onError?.();};renderer.domElement.addEventListener('webglcontextlost',lost);
 resize();host.dataset.renderer='three';
 return {
  throwDie({dx=0,dy=-150,duration=240}={}){if(disposed||launched)return false;launched=true;start=last=performance.now();
   const r=host.getBoundingClientRect(),seconds=Math.max(.1,duration/1000),vx=THREE.MathUtils.clamp(dx/seconds/Math.max(1,r.width)*3,-7,7),vz=THREE.MathUtils.clamp(dy/seconds/Math.max(1,r.height)*3,-9,4),force=Math.min(7,Math.hypot(vx,vz));
   body.position.set(0,1.3,1.7);body.velocity.set(vx,4+force*.4,vz);body.angularVelocity.set(-8-force,vx*1.6+3,2+vx);body.wakeUp();raf=requestAnimationFrame(frame);
   host.dataset.launch=JSON.stringify({vx,vz});onThrow?.();return true;
  },
  dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);resizeObserver.disconnect();renderer.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(n=>n.geometry?.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());felt.material.dispose();logoMaterial.dispose();logoTexture?.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
 };
}
