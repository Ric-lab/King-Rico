const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const context={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../ui/park/reel-tape.js'),'utf8'),context);const {plan,stopFor,PITCH,HEIGHT}=context.window.KingRicoReelTape;
const order=[11,9,8,7,6,5,0,3,4,2,1,10];
test('all nine tapes keep the paytable order and land every possible committed symbol without patches',()=>{
 for(let cell=0;cell<9;cell++)for(const first of order)for(const last of order){
  const from=Array(9).fill(first),target=Array(9).fill(last);
  const stop=stopFor({from:first,target:last,order,near:1800+cell*170});
  assert.ok(stop>=order.length*PITCH);assert.equal(stop%PITCH,0);
  const tape=plan({cell,from,target,stop,order});
  assert.equal(tape.find(x=>x.index===0).symbol,first);
  assert.equal(tape.find(x=>x.index===-stop/PITCH).symbol,last);
  const passing=Array.from(tape).reverse();
  for(let i=0;i<passing.length;i++){
   assert.ok(Object.isFrozen(passing[i]));
   if(i)assert.equal(order[(order.indexOf(passing[i-1].symbol)+1)%order.length],passing[i].symbol);
   if(passing[i].symbol===10)assert.equal(passing[i].ticket,true);
  }
 }
});
test('special tapes use the same sequence and a fixed empty position while held houses stay out of the animation',()=>{
 const sequence=[...order,-1],from=[2,-1,-1,2,-1,-1,2,-1,-1],target=[2,-1,2,2,-1,-1,2,2,-1];
 for(const cell of [1,2,4,5,7,8]){
  const stop=stopFor({from:from[cell],target:target[cell],order:sequence,near:1800});
  const tape=plan({cell,from,target,stop,order:sequence});
  assert.equal(tape.find(x=>x.index===-stop/PITCH).symbol,target[cell]);
 }
 assert.throws(()=>stopFor({from:12,target:1,order,near:2000}),/missing/);
});

test('cylinder projection compresses the print toward the lips and keeps neighboring bands joined',()=>{
 const {projectBand,RADIUS}=context.window.KingRicoReelTape;
 const center=projectBand(-8,8),lip=projectBand(90,106);
 assert.ok(lip.bottom-lip.top<center.bottom-center.top);
 assert.ok(lip.width<center.width);
 const left=projectBand(-40,-30),right=projectBand(30,40);
 assert.ok(Math.abs(left.top+right.bottom)<1e-8);
 for(let y=-100;y<100;y+=5)assert.ok(Math.abs(projectBand(y,y+5).bottom-projectBand(y+5,y+10).top)<1e-8);
 assert.equal(projectBand(Math.PI*RADIUS/2+1,Math.PI*RADIUS/2+5),null);
 assert.equal(projectBand(-Math.PI*RADIUS/2-5,-Math.PI*RADIUS/2-1),null);
});
