import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as CANNON from 'cannon-es';
// Gesture controls launch velocity and real rigid-body bounces. The receipt owns
// the final face: late settling reveals that face, never draws another outcome.
export function createDiceScene(host,{value,onLand,onImpact,onThrow,onError}){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-5.2,5.2,5.2,-5.2,.1,60);camera.position.set(0,8.3,10);camera.lookAt(0,.2,0);
 scene.add(new THREE.HemisphereLight(0xffffff,0x6c5682,1.8));
 const key=new THREE.DirectionalLight(0xffffff,2.1);key.position.set(-3,8,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=6;key.shadow.camera.bottom=-6;key.shadow.normalBias=.025;scene.add(key);
 const fill=new THREE.DirectionalLight(0xb9dfff,.9);fill.position.set(5,3,-3);scene.add(fill);
 const world=new CANNON.World({gravity:new CANNON.Vec3(0,-22,0),allowSleep:true});
 world.defaultContactMaterial.friction=.4;world.defaultContactMaterial.restitution=.38;
 const floor=new CANNON.Body({mass:0,shape:new CANNON.Plane()});floor.quaternion.setFromEuler(-Math.PI/2,0,0);world.addBody(floor);
 const felt=new THREE.Mesh(new THREE.BoxGeometry(8.8,.15,7.2),new THREE.MeshStandardMaterial({color:0x6d36a5,roughness:.96}));felt.position.y=-.1;felt.receiveShadow=true;scene.add(felt);
 const gold=new THREE.MeshStandardMaterial({color:0xe5b652,metalness:.6,roughness:.3});
 for(const [x,z,w,d]of [[-4.35,0,.22,7.3],[4.35,0,.22,7.3],[0,-3.55,8.9,.22],[0,3.55,8.9,.22]]){
  const rail=new THREE.Mesh(new RoundedBoxGeometry(w,.55,d,3,.08),gold);rail.position.set(x,.2,z);rail.castShadow=true;rail.receiveShadow=true;scene.add(rail);
  const wall=new CANNON.Body({mass:0,shape:new CANNON.Box(new CANNON.Vec3(w/2,1,d/2))});wall.position.set(x,.7,z);world.addBody(wall);
 }
 const textures=[],materials=[];
 for(const n of [1,3,4,5,0,2]){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');
  c.fillStyle='#fff1d2';c.fillRect(0,0,512,512);c.strokeStyle='#d6a647';c.lineWidth=14;c.beginPath();c.roundRect(20,20,472,472,55);c.stroke();
  c.fillStyle='#682c9c';c.font='800 330px "Baloo 2",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),256,280);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;textures.push(tex);
  materials.push(new THREE.MeshStandardMaterial({map:tex,roughness:.34,metalness:.04}));
 }
 const mesh=new THREE.Mesh(new RoundedBoxGeometry(1.65,1.65,1.65,5,.17),materials);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
 const half=.825,body=new CANNON.Body({mass:1,shape:new CANNON.Box(new CANNON.Vec3(half,half,half)),linearDamping:.24,angularDamping:.18});body.position.set(0,.85,2.1);world.addBody(body);
 const targets=[[-Math.PI/2,0,0],[0,0,Math.PI/2],[Math.PI/2,0,0],[0,0,-Math.PI/2],[0,0,0],[Math.PI,0,0]];
 const target=new THREE.Quaternion().setFromEuler(new THREE.Euler(...targets[value]));
 const q=new THREE.Quaternion(),up=new THREE.Vector3(),axes=[new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)];
 let disposed=false,launched=false,landed=false,raf,last=performance.now(),start=0,lastImpact=0;
 body.addEventListener('collide',e=>{const t=performance.now();if(launched&&!landed&&t-lastImpact>130&&Math.abs(e.contact.getImpactVelocityAlongNormal())>1.8){lastImpact=t;onImpact?.();}});
 function resize(){if(disposed)return;const r=host.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.top=5.2*r.height/Math.max(1,r.width);camera.bottom=-camera.top;camera.updateProjectionMatrix();if(!launched||landed)draw();}
 function draw(){mesh.position.copy(body.position);mesh.quaternion.copy(body.quaternion);renderer.render(scene,camera);}
 function frame(now){if(disposed)return;const dt=Math.min(.05,(now-last)/1000);last=now;
  if(launched&&!landed){
   const age=(now-start)/1000;
   if(age<2.25)world.step(1/120,dt,6);
   else{
    body.type=CANNON.Body.KINEMATIC;body.velocity.setZero();body.angularVelocity.setZero();
    q.copy(body.quaternion).slerp(target,1-Math.exp(-dt*8));body.quaternion.copy(q);
    const support=half*axes.reduce((sum,a)=>sum+Math.abs(up.copy(a).applyQuaternion(q).y),0);
    body.position.y=THREE.MathUtils.lerp(body.position.y,support+.015,1-Math.exp(-dt*12));
    if(age>3.35){body.quaternion.copy(target);body.position.y=half+.015;landed=true;host.dataset.face=String(value);onLand?.();}
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
   body.position.set(0,1.15,2.1);body.velocity.set(vx,4+force*.4,vz);body.angularVelocity.set(-8-force,vx*1.6+3,2+vx);body.wakeUp();raf=requestAnimationFrame(frame);
   host.dataset.launch=JSON.stringify({vx,vz});onThrow?.();return true;
  },
  dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);resizeObserver.disconnect();renderer.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(n=>n.geometry?.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());gold.dispose();felt.material.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
 };
}
