import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {planDiceRoll,DIE_HALF,diceTableBounds,TABLE_ELEVATION,TABLE_FORESHORTENING} from './roll.mjs';
import {paintDieMark} from './marks.js';
import {createWoodTable} from './table.js';
// Gesture controls launch velocity and real rigid-body bounces. The receipt owns
// the final face. A constant cube symmetry is chosen BEFORE playback; it never
// changes the visible face or pose after the physical roll has stopped.
export function createDiceScene(host,{value,faceIndex=value,faces=[0,1,2,3,4,5],kind='tony',portrait,onLand,onImpact,onThrow,onError}){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x332b24,1);host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-4.5,4.5,4.5,-4.5,.1,60);camera.position.set(0,18*Math.sin(TABLE_ELEVATION),18*Math.cos(TABLE_ELEVATION));camera.lookAt(0,0,0);
 scene.add(new THREE.HemisphereLight(0xffffff,0x6c5682,1.4));
 const key=new THREE.DirectionalLight(0xffffff,1.8);key.position.set(-3,8,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-15;key.shadow.camera.right=15;key.shadow.camera.top=16;key.shadow.camera.bottom=-16;key.shadow.radius=3;key.shadow.bias=-.0002;key.shadow.normalBias=.025;scene.add(key);
 const fill=new THREE.DirectionalLight(0xb9dfff,.75);fill.position.set(5,3,-3);scene.add(fill);
 const tone={tony:0xd7772b,ray:0x286e42,tucker:0x226d9b}[kind];
 const felt=new THREE.Mesh(new THREE.BoxGeometry(1,.1,1),new THREE.MeshPhysicalMaterial({color:tone,roughness:.96,sheen:.75,sheenColor:new THREE.Color(tone).multiplyScalar(1.15),sheenRoughness:.9}));felt.position.y=-.1;felt.receiveShadow=true;scene.add(felt);
 const woodTable=createWoodTable(scene);
 const grain=new THREE.TextureLoader().load('/assets/materials/felt-fibers-v2.webp',tex=>{tex.wrapS=tex.wrapT=THREE.RepeatWrapping;const b=diceTableBounds(host.clientWidth,host.clientHeight);tex.repeat.set((b.halfX-.11)*.36,(b.halfZ-.11)*.36);tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());tex.colorSpace=THREE.SRGBColorSpace;felt.material.map=tex;felt.material.bumpMap=tex;felt.material.bumpScale=.12;felt.material.needsUpdate=true;if(!disposed)draw();});
 let logoTexture;const logoMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:.3,depthWrite:false});
 const logo=new THREE.Mesh(new THREE.PlaneGeometry(5.5,5.5),logoMaterial);logo.rotation.x=-Math.PI/2;logo.position.set(0,.012,-.25);scene.add(logo);
 if(portrait)logoTexture=new THREE.TextureLoader().load(portrait,tex=>{tex.colorSpace=THREE.SRGBColorSpace;logoMaterial.map=tex;logoMaterial.needsUpdate=true;if(!disposed)draw();});
 const textures=[],materials=[];
 for(const slot of [1,3,4,5,0,2]){
  const n=faces[slot];
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');
  c.fillStyle='#c91e2e';c.fillRect(0,0,512,512);
  const dots=[[],[[0,0]],[[-1,-1],[1,1]],[[-1,-1],[0,0],[1,1]],[[-1,-1],[1,-1],[-1,1],[1,1]],[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]]];
  if(n===0){c.strokeStyle='#fff7e8';c.lineWidth=22;c.beginPath();c.ellipse(256,256,65,85,0,0,Math.PI*2);c.stroke();}
  for(const [x,y]of dots[n])paintDieMark(c,kind,256+x*111,256+y*111,39);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;textures.push(tex);
  materials.push(new THREE.MeshPhysicalMaterial({map:tex,roughness:.26,metalness:0,clearcoat:.5,clearcoatRoughness:.2}));
 }
 const mesh=new THREE.Mesh(new RoundedBoxGeometry(DIE_HALF*2,DIE_HALF*2,DIE_HALF*2,6,.23),materials);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
 const position=new THREE.Vector3(0,DIE_HALF+.22,0),rotation=new THREE.Quaternion(),correction=new THREE.Quaternion(),displayRotation=new THREE.Quaternion();
 const faceNormals=[new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,0),new THREE.Vector3(0,0,-1),new THREE.Vector3(-1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,-1,0)];
 let disposed=false,launched=false,landed=false,raf,start=0,plan,impactIndex=0,readyZ=0;
 function resize(){if(disposed)return;const r=host.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);
  const bounds=diceTableBounds(r.width,r.height);felt.scale.set((bounds.halfX-.11)*2,1,(bounds.halfZ-.11)*2);woodTable.resize(bounds);grain.repeat.set((bounds.halfX-.11)*.36,(bounds.halfZ-.11)*.36);
  camera.top=4.5*r.height/Math.max(1,r.width);camera.bottom=-camera.top;camera.updateProjectionMatrix();if(!launched){readyZ=diceTableBounds(r.width,r.height).startZ;position.set(0,DIE_HALF+.22,readyZ);}if(!launched||landed)draw();}
 function draw(){mesh.position.copy(position);mesh.quaternion.copy(displayRotation);renderer.render(scene,camera);}
 function frame(now){if(disposed)return;
  const elapsed=Math.max(0,(now-start)/1000),u=Math.min(1,elapsed/plan.duration),at=u*(plan.frames.length-1),i=Math.floor(at),a=plan.frames[i],b=plan.frames[Math.min(i+1,plan.frames.length-1)],f=at-i;
  position.fromArray(a.p).lerp(new THREE.Vector3().fromArray(b.p),f);rotation.fromArray(a.q).slerp(new THREE.Quaternion().fromArray(b.q),f);
  // This blend happens only during the initial airborne launch, never at landing.
  const launchBlend=THREE.MathUtils.smoothstep(elapsed,0,.14);
  displayRotation.copy(rotation).slerp(rotation.clone().multiply(correction),launchBlend);
  const simulatedTime=u*plan.frames.length/120;
  while(impactIndex<plan.impacts.length&&plan.impacts[impactIndex]<=simulatedTime){impactIndex++;onImpact?.();}
  if(u===1&&!landed){landed=true;let top=0,dot=-2;for(let k=0;k<6;k++){const d=faceNormals[k].clone().applyQuaternion(displayRotation).y;if(d>dot){dot=d;top=k;}}
   host.dataset.face=String(faces[top]);host.dataset.faceIndex=String(top);host.dataset.restFlatness=String(dot);onLand?.();
  }
  draw();if(!landed)raf=requestAnimationFrame(frame);
 }
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
 const lost=e=>{e.preventDefault();onError?.();};renderer.domElement.addEventListener('webglcontextlost',lost);
 resize();host.dataset.renderer='three';host.dataset.mark=kind;host.dataset.faceLabels=JSON.stringify(faces);host.dataset.table='wood';host.dataset.readyPosition=JSON.stringify(new THREE.Vector3().copy(position).project(camera).toArray());
 return {
  dragDie({dx=0,dy=0}={}){if(disposed||launched)return;
   const r=host.getBoundingClientRect(),bounds=diceTableBounds(r.width,r.height);
   position.x=THREE.MathUtils.clamp(dx/r.width*9,-bounds.halfX+DIE_HALF+.25,bounds.halfX-DIE_HALF-.25);
   position.z=THREE.MathUtils.clamp(readyZ+dy/r.height*camera.top*2/TABLE_FORESHORTENING,-bounds.halfZ+DIE_HALF+.25,bounds.halfZ-DIE_HALF-.25);
   position.y=DIE_HALF+.22+Math.min(.28,Math.hypot(dx,dy)/400);
   displayRotation.setFromEuler(new THREE.Euler(THREE.MathUtils.clamp(dy*.0015,-.3,.3),dx*.001,THREE.MathUtils.clamp(-dx*.001,-.18,.18)));
   draw();
  },
  throwDie({dx=0,dy=-150,duration=240}={}){if(disposed||launched)return false;launched=true;
   const r=host.getBoundingClientRect();plan=planDiceRoll({dx,dy,duration,width:r.width,height:r.height,start:{x:position.x,y:position.y,z:position.z,q:displayRotation.toArray()}});
   correction.setFromUnitVectors(faceNormals[faceIndex],new THREE.Vector3(...plan.axis));
   start=performance.now();raf=requestAnimationFrame(frame);host.dataset.launch=JSON.stringify({vx:plan.vx,vz:plan.vz});onThrow?.();return true;
  },
  dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);resizeObserver.disconnect();renderer.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(n=>n.geometry?.dispose());woodTable.dispose();materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());felt.material.dispose();grain.dispose();logoMaterial.dispose();logoTexture?.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
 };
}
