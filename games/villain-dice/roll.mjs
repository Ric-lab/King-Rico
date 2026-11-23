import * as CANNON from 'cannon-es';
export const DIE_HALF=.95;
// Shared by camera, table bounds and pointer-to-felt projection.
export const TABLE_ELEVATION=Math.PI/4,TABLE_FORESHORTENING=Math.sin(TABLE_ELEVATION);
export function diceTableBounds(width=390,height=844){
 const halfHeight=4.5*height/Math.max(1,width);
 // Leave room for the visible side of the cube above the far edge of the felt.
 const halfZ=Math.max(DIE_HALF*2.4,(halfHeight-DIE_HALF*1.9)/TABLE_FORESHORTENING);
 const gripZ=(halfHeight*.64+(DIE_HALF+.22)*Math.cos(TABLE_ELEVATION))/TABLE_FORESHORTENING;
 return {halfX:4.05,halfZ,startZ:Math.min(halfZ-DIE_HALF*1.5,gripZ)};
}
export const START_Z=diceTableBounds().startZ;
// Simulate the gesture once through genuine rest. Playback preserves the same
// rigid-body motion; no torque, face change or pose correction after stopping.
export function planDiceRoll({dx=0,dy=-150,duration=240,width=390,height=844,start}={}){
 const world=new CANNON.World({gravity:new CANNON.Vec3(0,-18,0),allowSleep:true});
 world.defaultContactMaterial.friction=.12;world.defaultContactMaterial.restitution=.46;
 const dieMaterial=new CANNON.Material('die'),wallMaterial=new CANNON.Material('wall');world.addContactMaterial(new CANNON.ContactMaterial(dieMaterial,wallMaterial,{friction:.025,restitution:.3}));
 const floor=new CANNON.Body({mass:0,shape:new CANNON.Plane()});floor.quaternion.setFromEuler(-Math.PI/2,0,0);world.addBody(floor);
 const bounds=diceTableBounds(width,height);
 for(const [x,z,w,d]of [[-bounds.halfX,0,.22,bounds.halfZ*2],[bounds.halfX,0,.22,bounds.halfZ*2],[0,-bounds.halfZ,9,.22],[0,bounds.halfZ,9,.22]]){
  const wall=new CANNON.Body({mass:0,material:wallMaterial,shape:new CANNON.Box(new CANNON.Vec3(w/2,12,d/2))});wall.position.set(x,10,z);world.addBody(wall);
 }
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),seconds=Math.max(.1,duration/1000),vx=clamp(dx/seconds/width*6,-11,11),vz=clamp(dy/seconds/height*11,-18,12),force=Math.min(7,Math.hypot(vx,vz));
 const body=new CANNON.Body({mass:1,material:dieMaterial,allowSleep:false,shape:new CANNON.Box(new CANNON.Vec3(DIE_HALF,DIE_HALF,DIE_HALF)),linearDamping:.055,angularDamping:.05,sleepSpeedLimit:.025,sleepTimeLimit:.6});
 body.position.set(clamp(start?.x||0,-bounds.halfX+DIE_HALF+.2,bounds.halfX-DIE_HALF-.2),start?.y??DIE_HALF+.22,clamp(start?.z??bounds.startZ,-bounds.halfZ+DIE_HALF+.2,bounds.halfZ-DIE_HALF-.2));
 if(start?.q)body.quaternion.set(...start.q);
 body.velocity.set(vx,4.5+force*.22,vz);
 // Forward rolling: omega × the floor contact must oppose translation.
 // The previous negative-vz sign added backspin, braking the die on contact.
 body.angularVelocity.set(vz/DIE_HALF*1.45,vx*.65+2,-vx/DIE_HALF*1.45);world.addBody(body);
 const frames=[],impacts=[];let lastImpact=-1;
 body.addEventListener('collide',e=>{const t=frames.length/120;if(t-lastImpact>.13&&Math.abs(e.contact.getImpactVelocityAlongNormal())>1.8){lastImpact=t;impacts.push(t);}});
 let t=0,stable=0;for(let i=0;i<1200;i++){
  // Free launch first, then a gradual felt drag rather than an abrupt brake.
  const drag=clamp((i/120-2.5)/2.2,0,1);
  body.linearDamping=.055+drag*.5;body.angularDamping=.05+drag*.5;
  world.defaultContactMaterial.friction=.12+drag*.3;
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
 return {frames,impacts,axis,vx,vz,duration:Math.min(4.8,frames.length/120),flatness:localUp.dot(new CANNON.Vec3(...axis)),restSpeed:Math.max(body.velocity.length(),body.angularVelocity.length())};
}
