const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const context={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../ui/park/reel-tape.js'),'utf8'),context);const {plan,PITCH}=context.window.KingRicoReelTape;
test('a reel tape lands three arbitrary committed symbols without changing identities between rows',()=>{
 const from=[0,1,2,3,4,5,6,7,8],target=[7,9,10,1,2,3,8,0,6],stop=128*14;
 for(let column=0;column<3;column++){
  const tape=plan({column,from,target,stop,seed:17}),anchor=-stop/PITCH;
  assert.deepEqual(Array.from(tape.filter(x=>x.index>=0&&x.index<3),x=>x.symbol),[from[column],from[column+3],from[column+6]]);
  const final=tape.filter(x=>x.index>=anchor&&x.index<anchor+3);
  assert.deepEqual(Array.from(final,x=>x.symbol),[target[column],target[column+3],target[column+6]]);
  assert.deepEqual(Array.from(final,x=>x.index*PITCH+stop),[0,128,256]);
  for(const symbol of tape){assert.ok(Object.isFrozen(symbol));const first=symbol.symbol;
   for(const phase of [0,128,1024,stop]){const screen=symbol.index*PITCH+phase;assert.equal(symbol.symbol,first);assert.equal((screen-phase)/PITCH,symbol.index);}
   if(symbol.symbol===10)assert.equal(symbol.ticket,true);
  }
 }
});
test('special-round tape preserves held positions and empty outcomes',()=>{
 const from=[2,-1,-1,2,-1,-1,2,-1,-1],target=[2,-1,2,2,-1,-1,2,2,-1],stop=128*6;
 for(let column=0;column<3;column++){
  const tape=plan({column,from,target,stop}),anchor=-6;
  assert.deepEqual(Array.from(tape.filter(x=>x.index>=anchor&&x.index<anchor+3),x=>x.symbol),[target[column],target[column+3],target[column+6]]);
 }
});

test('moving tape includes all three villains without altering the saved starting or landing symbols',()=>{
 const from=[0,1,2,3,4,5,6,7,8],target=[8,7,6,5,4,3,2,1,0];
 for(let seed=0;seed<30;seed++)for(let column=0;column<3;column++){
  const tape=plan({column,from,target,stop:128*28,seed});
  const transient=tape.filter(x=>x.index<-2&&x.index>-25);
  for(const villain of[12,13,14])assert.ok(transient.some(x=>x.symbol===villain));
  assert.deepEqual(Array.from(tape.filter(x=>x.index>=-28&&x.index<-25),x=>x.symbol),[target[column],target[column+3],target[column+6]]);
 }
});
