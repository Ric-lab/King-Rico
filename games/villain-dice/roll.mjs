import * as CANNON from 'cannon-es';
export const DIE_HALF=1.2,START_Z=3.2;
// Simulate the gesture once through genuine rest. Playback preserves the same
// rigid-body motion; no torque, face change or pose correction after stopping.
export function planDiceRoll({dx=0,dy=-150,duration=240,width=390,height=844}={}){
 const world=new CANNON.World({gravity:new CANNON.Vec3(0,-22,0),allowSleep:true});
 world.defaultContactMaterial.friction=.48;world.defaultContactMaterial.restitution=.3;
 const dieMaterial=new CANNON.Material('die'),wallMaterial=new CANNON.Material('wall');world.addContactMaterial(new CANNON.ContactMaterial(dieMaterial,wallMaterial,{friction:.025,restitution:.3}));
 const floor=new CANNON.Body({mass:0,shape:new CANNON.Plane()});floor.quaternion.setFromEuler(-Math.PI/2,0,0);world.addBody(floor);
 for(const [x,z,w,d]of [[-4.35,.6,.22,9],[4.35,.6,.22,9],[0,-3.55,8.9,.22],[0,4.85,8.9,.22]]){
  const wall=new CANNON.Body({mass:0,material:wallMaterial,shape:new CANNON.Box(new CANNON.Vec3(w/2,2,d/2))});wall.position.set(x,1,z);world.addBody(wall);
 }
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),seconds=Math.max(.1,duration/1000),vx=clamp(dx/seconds/width*3,-7,7),vz=clamp(dy/seconds/height*3,-9,4),force=Math.min(7,Math.hypot(vx,vz));
 const body=new CANNON.Body({mass:1,material:dieMaterial,allowSleep:false,shape:new CANNON.Box(new CANNON.Vec3(DIE_HALF,DIE_HALF,DIE_HALF)),linearDamping:.3,angularDamping:.3,sleepSpeedLimit:.025,sleepTimeLimit:.6});
 body.position.set(0,DIE_HALF+.14,START_Z);body.velocity.set(vx,4+force*.4,vz);body.angularVelocity.set(-8-force,vx*1.6+3,2+vx);world.addBody(body);
 const frames=[],impacts=[];let lastImpact=-1;
 body.addEventListener('collide',e=>{const t=frames.length/120;if(t-lastImpact>.13&&Math.abs(e.contact.getImpactVelocityAlongNormal())>1.8){lastImpact=t;impacts.push(t);}});
 let t=0,stable=0;for(let i=0;i<1200;i++){
  world.step(1/120);t=(i+1)/120;
  frames.push({p:[body.position.x,body.position.y,body.position.z],q:[body.quaternion.x,body.quaternion.y,body.quaternion.z,body.quaternion.w]});
  const u=body.quaternion.conjugate().vmult(new CANNON.Vec3(0,1,0));
  stable=t>1.5&&Math.max(Math.abs(u.x),Math.abs(u.y),Math.abs(u.z))>.8&&body.velocity.lengthSquared()<.0025&&body.angularVelocity.lengthSquared()<.0025?stable+1:0;
  if(stable>=30)break;
 }
 // Keep the naturally stopped pose still briefly, before announcing its face.
 const last=frames.at(-1);for(let i=0;i<36;i++)frames.push(last);
 const localUp=body.quaternion.conjugate().vmult(new CANNON.Vec3(0,1,0));
 const axes=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
 const axis=axes.reduce((a,b)=>localUp.dot(new CANNON.Vec3(...a))>localUp.dot(new CANNON.Vec3(...b))?a:b);
 return {frames,impacts,axis,vx,vz,duration:Math.min(4.2,frames.length/120),flatness:localUp.dot(new CANNON.Vec3(...axis)),restSpeed:Math.max(body.velocity.length(),body.angularVelocity.length())};
}
