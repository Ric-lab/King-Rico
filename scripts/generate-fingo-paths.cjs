// No target bucket, winning number or steering force enters this simulation.
const M=require('matter-js'),fs=require('node:fs');
const {createWorld,createBall,BW,H}=require('../games/fingo/world.cjs');
const paths=[],bins=[];
for(let column=0;column<5;column++){
 const group=[];
 for(let sample=0;group.length<64&&sample<512;sample++){
  const vx=((sample*73%257)/256-.5)*8;
  M.Common._nextId=0;
  const {engine,pegs}=createWorld(M),ball=createBall(M,column,vx),frames=[],hits=[];
  M.Composite.add(engine.world,ball);
  M.Events.on(engine,'collisionStart',e=>{for(const p of e.pairs){const other=p.bodyA===ball?p.bodyB:p.bodyB===ball?p.bodyA:null;if(other?.label==='peg')hits.push([frames.length/3,pegs.indexOf(other)]);}});
  let landed=-1;
  for(let tick=0;tick<720;tick++){
   frames.push(Math.round(ball.position.x*10),Math.round(ball.position.y*10),Math.round(ball.angle*100));
   if(ball.position.y>H-25){landed=Math.max(0,Math.min(4,Math.floor(ball.position.x/BW)));break;}
   M.Engine.update(engine,1000/60);
  }
  M.Engine.clear(engine);
  if(landed>=0){const data=Buffer.alloc(frames.length*2);frames.forEach((v,i)=>data.writeInt16LE(v,i*2));group.push({bin:landed,vx,frames:data.toString('base64'),hits});}
 }
 if(group.length!==64)throw Error('Not enough completed physical falls');
 // Ordering does not change any bucket's probability; zero RNG stays a simple
 // reference for the existing deterministic integration fixtures.
 const self=group.findIndex(p=>p.bin===column);[group[0],group[self]]=[group[self],group[0]];
 paths.push(group);bins.push(group.map(p=>p.bin));
 console.log(column,Array.from({length:5},(_,b)=>group.filter(p=>p.bin===b).length));
}
fs.writeFileSync('games/fingo/paths.json',JSON.stringify(paths)+'\n');
fs.writeFileSync('games/fingo/bins.json',JSON.stringify(bins)+'\n');
