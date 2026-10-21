'use strict';
const {quality}=require('../../cloud/claw.cjs');
// The cabinet is a heap, not a visible 3×3 board. Each exposed toy has its own pose.
const POSES=[
 [-1.04,-.63,.51,.97,-.36],[-.13,-.8,.56,.9,.22],[.84,-.51,.48,1.04,-.18],
 [-.69,-.14,.61,1.06,.38],[.2,.07,.67,1.12,-.24],[1.1,.3,.5,.97,-.48],
 [-1.06,.54,.4,1.03,.5],[-.12,.72,.45,.99,-.32],[.7,.66,.48,1.08,.29]
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function createLayout(seed){
 return POSES.map(([x,z,y,size,angle],i)=>({
  x:x+Math.sin(seed*1.73+i*2.37)*.055,z:z+Math.sin(seed*.91+i*1.87)*.045,
  y,size,angle:angle+Math.sin(seed+i)*.07
 }));
}
// Keep the existing ledger/rules coordinate format. Encode the actual distance
// from the visible toy into that toy's canonical local frame; no aim snapping.
function encodeAim(layout,x,z){
 let selected=0,distance=Infinity;
 for(let i=0;i<layout.length;i++){
  const d=Math.max(Math.abs(x-layout[i].x)/3.1,Math.abs(z-layout[i].z)/2.1);
  if(d<distance){selected=i;distance=d;}
 }
 const p=layout[selected];
 const aimX=clamp(Math.round(selected%3*320+180+(x-p.x)/3.1*1000),0,1000);
 const aimZ=clamp(Math.round(Math.floor(selected/3)*280+220+(z-p.z)/2.1*1000),0,1000);
 return {selected,aimX,aimZ,quality:quality(selected,aimX,aimZ)};
}
function decodeAim(layout,selected,aimX,aimZ){
 const p=layout[selected];
 return {x:p.x+(aimX-(selected%3*320+180))/1000*3.1,z:p.z+(aimZ-(Math.floor(selected/3)*280+220))/1000*2.1};
}
module.exports={createLayout,encodeAim,decodeAim};
