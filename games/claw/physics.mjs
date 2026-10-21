import * as C from 'cannon-es';
import layoutModule from './layout.cjs';
const {createLayout}=layoutModule;
export const BIN={floor:1.26,left:-1.58,right:1.58,back:-1.02,front:1.02};
export const CHUTE={x:-1.04,z:.48,width:1.14,depth:1.14,tray:.32};
export function createPrizeWorld(seed=0){
 const world=new C.World({gravity:new C.Vec3(0,-9.82,0),allowSleep:true});
 world.solver.iterations=12;world.solver.tolerance=1e-7;
 world.broadphase=new C.SAPBroadphase(world);
 const fabric=new C.Material('fabric'),metal=new C.Material('cabinet');
 world.addContactMaterial(new C.ContactMaterial(fabric,fabric,{friction:.65,restitution:.04,contactEquationStiffness:2e5,contactEquationRelaxation:5}));
 world.addContactMaterial(new C.ContactMaterial(fabric,metal,{friction:.5,restitution:.03,contactEquationStiffness:3e5}));
 function box(x,y,z,w,h,d){const body=new C.Body({mass:0,material:metal,shape:new C.Box(new C.Vec3(w/2,h/2,d/2)),position:new C.Vec3(x,y,z)});world.addBody(body);return body;}
 // The opening is a real hole in the bin floor, not an image of a hole.
 box(.57,1.2,0,2.02,.12,2.04);
 box(-1.02,1.2,-.55,1.08,.12,.94);
 box(-1.64,2.8,0,.12,3.2,2.15);box(1.64,2.8,0,.12,3.2,2.15);
 box(0,2.8,-1.08,3.4,3.2,.12);box(0,2.8,1.08,3.4,3.2,.12);
 // Transparent raised fence around the prize chute keeps resting toys out.
 box(-.43,1.48,.48,.08,.5,1.16);box(-1.04,1.48,-.1,1.2,.5,.08);
 // A continuous well leads to the lower delivery tray.
 box(-.43,.72,.55,.06,1.1,1.2);box(-1.61,.72,.55,.06,1.1,1.2);box(-1.04,.72,-.1,1.2,1.1,.06);
 box(-1.04,.24,.76,1.2,.16,1.65);box(-1.04,.49,1.58,1.2,.35,.07);
 const toys=[],poses=createLayout(seed);
 for(let i=0;i<9;i++){
  const p=poses[i],radius=.29*p.size;
  // Body and lower lobes approximate the round mascot; the arms/leaf are soft detail.
  const body=new C.Body({mass:.22,material:fabric,linearDamping:.35,angularDamping:.68,sleepSpeedLimit:.045,sleepTimeLimit:.7});
  body.addShape(new C.Sphere(radius),new C.Vec3(0,.015,0));
  body.addShape(new C.Sphere(radius*.62),new C.Vec3(-radius*.55,-radius*.48,0));
  body.addShape(new C.Sphere(radius*.62),new C.Vec3(radius*.55,-radius*.48,0));
  let x=p.x,z=p.z;
  if(x<-.35&&z>-.15){x+=.8;z-=.35;}
  body.position.set(x,1.85+(i%3)*.52,z);
  body.quaternion.setFromEuler((i%3-1)*.38,(i%3-1)*.5+p.angle,(i%2?1:-1)*.18);
  world.addBody(body);toys.push({body,size:p.size,index:i});
 }
 for(let i=0;i<300;i++)world.step(1/60);
 const hook=new C.Body({type:C.Body.KINEMATIC,mass:0,collisionFilterGroup:0});world.addBody(hook);

 let constraint=null,held=null,accumulator=0;
 function anchor(x,y,z,dt=1/60){hook.velocity.set((x-hook.position.x)/Math.max(dt,.001),(y-hook.position.y)/Math.max(dt,.001),(z-hook.position.z)/Math.max(dt,.001));}
 function attach(index,x,y,z){
  if(constraint)return;
  const body=toys[index].body;held=index;hook.position.set(x,y,z);hook.velocity.setZero();body.wakeUp();
  const local=body.pointToLocalFrame(new C.Vec3(x,y,z));
  constraint=new C.PointToPointConstraint(body,local,hook,new C.Vec3(),45);constraint.collideConnected=false;world.addConstraint(constraint);
 }
 function release(){if(constraint)world.removeConstraint(constraint);constraint=null;held=null;hook.velocity.setZero();}
 return {world,toys,hook,held:()=>held,attach,release,anchor,
  targets:()=>toys.map(({body,size})=>({x:body.position.x,y:body.position.y,z:body.position.z,size})),
  step(dt){accumulator+=Math.min(dt,.25);let steps=0;while(accumulator>=1/90&&steps++<24){world.step(1/90);accumulator-=1/90;}},

  delivered(i){const p=toys[i].body.position;return p.y<.86&&p.x>-1.7&&p.x<-.38&&p.z>-.13&&p.z<1.8;},
  destroy(){release();for(const b of [...world.bodies])world.removeBody(b);}
 };
}
