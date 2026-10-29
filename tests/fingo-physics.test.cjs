const test=require('node:test'),assert=require('node:assert/strict'),M=require('matter-js');
const paths=require('../games/fingo/paths.json'),bins=require('../games/fingo/bins.json');
const {createWorld,createBall,ENTRY_CENTERS,BW,H}=require('../games/fingo/world.cjs');
const card=require('../cloud/fingo-card.cjs');
function decode(path){const data=Buffer.from(path.frames,'base64'),frames=[];for(let i=0;i<data.length;i+=6)frames.push({x:data.readInt16LE(i)/10,y:data.readInt16LE(i+2)/10,angle:data.readInt16LE(i+4)/100});return frames;}
test('every physical replay starts in its entry, moves continuously and ends in its recorded bucket',()=>{
 for(let c=0;c<5;c++){
  assert.equal(paths[c].length,64);assert.deepEqual(paths[c].map(p=>p.bin),bins[c]);
  for(const path of paths[c]){
   const frames=decode(path);assert.ok(Math.abs(frames[0].x-ENTRY_CENTERS[c])<.051);assert.equal(frames[0].y,-20);
   assert.ok(frames.length>60&&frames.length<720);
   const end=frames.at(-1);assert.equal(Math.floor(end.x/BW),path.bin);assert.ok(end.y>=H-25-.051);
   for(let i=1;i<frames.length;i++)assert.ok(Math.hypot(frames[i].x-frames[i-1].x,frames[i].y-frames[i-1].y)<30,'No teleport between physical frames');
   for(const [frame,peg]of path.hits){assert.ok(frame>=0&&frame<frames.length);assert.ok(peg>=0&&peg<53);}
  }
 }
});
test('stored falls reproduce unsteered Matter.js simulation, including collisions',()=>{
 for(let c=0;c<5;c++)for(const index of [0,17,42,63]){
  const path=paths[c][index],frames=decode(path);M.Common._nextId=0;
  const {engine}=createWorld(M),ball=createBall(M,c,path.vx);M.Composite.add(engine.world,ball);
  for(const frame of frames){assert.ok(Math.abs(ball.position.x-frame.x)<.051);assert.ok(Math.abs(ball.position.y-frame.y)<.051);M.Engine.update(engine,1000/60);}
  M.Engine.clear(engine);
 }
});
test('four adjacent golden buckets increase real coverage instead of being vetoed by a hit-rate draw',()=>{
 const targets=[1,16,31,46,61],full=card.expandCard(targets,2);
 const result=slots=>Array.from({length:64},(_,i)=>card.cardRound(1000,{targets,marks:[12],used:0,slots,payoutVersion:3,cardVersion:2},'drop','test',0,()=>(i+.5)/64,()=>2));
 const four=result([full[0],full[1],full[2],full[3],75]),one=result([full[0],30,45,58,75]);
 assert.equal(four.filter(x=>x.mark>=0).length,64);
 assert.equal(one.filter(x=>x.mark>=0).length,bins[0].filter(b=>b===0).length);
 const all=result(full.slice(0,5));assert.ok(all.every(x=>x.mark>=0));
});
