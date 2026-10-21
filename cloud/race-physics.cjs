'use strict';
// Fixed-step rigid-body simulation. No winner, finish time or target speed is
// supplied to the world. Colours are assigned after the physical starting grid.
const C=require('cannon-es');
const LENGTH=96,RADIUS=.32,STEP=1/120,LAYOUTS=32,SEEDS=LAYOUTS*5;
const {surface}=require('./race-track.cjs');
let terrain;
function track(){
 if(terrain)return terrain;
 const vertices=[],indices=[],lanes=[-2,-1,0,1,2];
 for(let j=0;j<=480;j++){const d=-3+j*(LENGTH+12)/480;for(const lane of lanes){const p=surface(d,lane);vertices.push(p.x,p.y,p.z);}}
 for(let j=0;j<480;j++)for(let k=0;k<4;k++){const a=j*5+k;indices.push(a,a+1,a+5,a+1,a+6,a+5);}
 for(const lane of[-2,2])for(let j=0;j<480;j++){
  const d=-3+j*(LENGTH+12)/480,p=surface(d,lane),q=surface(d+(LENGTH+12)/480,lane),n=vertices.length/3;
  vertices.push(p.x,p.y,p.z,q.x,q.y,q.z,p.x,p.y+1.6,p.z,q.x,q.y+1.6,q.z);
  if(lane<0)indices.push(n,n+1,n+2,n+1,n+3,n+2);else indices.push(n,n+2,n+1,n+1,n+2,n+3);
 }
 terrain={vertices,indices};return terrain;
}
function simulate(layout,{gravity=9.81}={}){
 const world=new C.World({gravity:new C.Vec3(0,-gravity,0)});world.solver.iterations=12;world.solver.tolerance=1e-8;
 const floor=new C.Material('track'),marble=new C.Material('marble');
 world.addContactMaterial(new C.ContactMaterial(floor,marble,{friction:.20,restitution:.12,contactEquationStiffness:1e8,contactEquationRelaxation:4}));
 world.addContactMaterial(new C.ContactMaterial(marble,marble,{friction:.08,restitution:.72,contactEquationStiffness:1e8}));
 const geometry=track();
 // Separate collision chunks let SAP reject distant track sections before
 // sphere/triangle narrowphase. Each chunk owns only its local triangles.
 for(let start=0;start<geometry.indices.length;start+=288){const ids=geometry.indices.slice(start,start+288),map=new Map(),vs=[],ix=[];for(const id of ids){if(!map.has(id)){map.set(id,map.size);vs.push(...geometry.vertices.slice(id*3,id*3+3));}ix.push(map.get(id));}const ground=new C.Body({mass:0,material:floor});ground.addShape(new C.Trimesh(vs,ix));world.addBody(ground);}
 world.broadphase=new C.SAPBroadphase(world);world.broadphase.axisIndex=2;
 let random=(layout+1)*1234567;const rng=()=>{random^=random<<13;random^=random>>>17;random^=random<<5;return (random>>>0)/4294967296;};
 const bodies=Array.from({length:5},(_,i)=>{const lane=(i-2)*.73+(rng()-.5)*.035,d=-(rng()*.15),p=surface(d,lane),b=new C.Body({mass:1,material:marble,shape:new C.Sphere(RADIUS),linearDamping:.006,angularDamping:.008});b.position.set(p.x,p.y+RADIUS+.003,p.z);world.addBody(b);return b;});
 const frames=[],times=Array(5).fill(null);let contacts=0;
 const snapshot=()=>bodies.map(b=>[b.position.x,b.position.y,b.position.z,b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w,b.velocity.length()]);
 frames.push(snapshot());
 for(let step=1;step<=120*40;step++){
  const before=bodies.map(b=>-b.position.z);world.step(STEP);
  for(const c of world.contacts)if(c.bi.mass&&c.bj.mass)contacts++;
  bodies.forEach((b,i)=>{if(times[i]===null&&-b.position.z>=LENGTH){const previous=before[i],current=-b.position.z;times[i]=(step-1+(LENGTH-previous)/(current-previous))*STEP;}if(times[i]!==null){b.velocity.setZero();b.angularVelocity.setZero();b.type=C.Body.STATIC;b.collisionFilterMask=0;b.updateMassProperties();}});
  if(step%2===0)frames.push(snapshot());
  if(times.every(t=>t!==null))break;
 }
 if(times.some(t=>t===null))throw Error(`Unfinished gravity layout ${layout}: ${times}; z=${bodies.map(b=>b.position.z)}`);
 const order=[0,1,2,3,4].sort((a,b)=>times[a]-times[b]||a-b);
 return {frames,times,order,contacts,duration:Math.max(...times)};
}
const cache=new Map();
function recording(seed){const layout=Math.floor(seed/5);if(!cache.has(layout))cache.set(layout,simulate(layout));return cache.get(layout);}
function state(seed,time){const r=recording(seed),f=Math.max(0,Math.min(r.frames.length-1,time*60)),a=Math.floor(f),b=Math.min(a+1,r.frames.length-1),mix=f-a,shift=seed%5;
 return Array.from({length:5},(_,i)=>{const slot=(i-shift+5)%5,p=r.frames[a][slot],q=r.frames[b][slot];return p.map((x,k)=>x+(q[k]-x)*mix);});}
function finish(seed,index){return recording(seed).times[(index-seed%5+5)%5];}
function winner(seed){return (recording(seed).order[0]+seed%5)%5;}
module.exports={LENGTH,RADIUS,LAYOUTS,SEEDS,STEP,surface,simulate,recording,state,finish,winner};
