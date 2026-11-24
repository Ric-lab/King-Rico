const test=require('node:test'),assert=require('node:assert/strict'),e=require('../cloud/engine.cjs');
function fromGrid(grid,tail=.5){const sy=e.slotSymbols(6),total=sy.reduce((n,s)=>n+s.w,0),draws=grid.flatMap(s=>s===11?[0]:s===5?[.1]:[.99,(sy.slice(0,s).reduce((n,x)=>n+x.w,0)+sy[s].w/2)/total]);return()=>draws.shift()??tail;}
const losing=[11,0,2,6,7,8,10,2,6];
test('fifth-wheel spins always pay a matching cash line at every allowed stake, preserving wheels and bank',()=>{
 for(const bet of e.BETS)for(const have of[3,4]){
  const grid=have===3?[11,0,2,6,11,8,10,2,6]:losing;
  assert.equal(e.evaluate(grid,bet,6).win,0);
  const x=e.slot(bet,have,fromGrid(grid),{count:have,units:have*e.units(bet)},6,()=>0);
  assert.ok(x.res.win>=bet*.4);assert.equal(x.winUnits,e.units(x.res.win));
  assert.deepEqual(x.res,e.evaluate(x.grid,bet,6));
  assert.deepEqual(x.res.peach,grid.flatMap((s,i)=>s===11?[i]:[]));
  assert.equal(x.wheelUnits,5*e.units(bet));assert.equal(x.peaches,0);assert.equal(x.feature,null);
 }
 const x=e.slot(10,4,fromGrid([11,0,2,6,11,8,10,2,6]),{count:4,units:4000},6,()=>0);
 assert.equal(x.peaches,1);assert.deepEqual(x.peachBank,{count:1,units:1000});
});
test('bar completion pays in the opening grid, independently of the five Good Luck rounds',()=>{
 for(const bet of e.BETS){
  const x=e.slot(bet,0,fromGrid(losing),null,6,()=>e.units(bet)*10);
  assert.ok(x.res.win>0);assert.ok(x.feature);assert.deepEqual(x.res,e.evaluate(x.grid,bet,6));
  assert.equal(x.winUnits,e.units(x.res.win)+e.units(x.feature.res.win));
 }
});
test('minimum cash fallback can avoid every possible position of one or two wheel symbols',()=>{
 for(let a=0;a<9;a++)for(let b=a;b<9;b++){
  const grid=Array(9).fill(5);grid[a]=11;grid[b]=11;
  const x=e.slot(10,a===b?4:3,fromGrid(grid),null,6,()=>0);
  assert.ok(x.res.win>0);assert.deepEqual(x.res.peach,grid.flatMap((s,i)=>s===11?[i]:[]));
 }
});
test('ordinary losing spins and an existing bonus-opening prize are unchanged',()=>{
 const x=e.slot(10,0,fromGrid(losing),null,6,()=>0);
 assert.deepEqual(x.grid,losing);assert.equal(x.res.win,0);assert.equal(x.feature,null);
 const winning=[11,0,2,10,10,10,6,7,8],y=e.slot(10,4,fromGrid(winning),null,6,()=>0);
 assert.deepEqual(y.grid,winning);assert.deepEqual(y.res,e.evaluate(winning,10,6));
});
test('preview trigger prizes survive retries and reload without a second debit or credit',async()=>{
 const {createPreview}=await import('../prototypes/circus-preview/model.mjs');const {randomUUID}=require('node:crypto');
 for(const kind of['wheel','bar']){
  const initial=createPreview();await initial.run({action:'state'});const saved=initial.exportState();
  const p=saved.records.find(([key])=>key==='players/preview')[1];
  p.peaches=kind==='wheel'?4:0;p.peachBank={count:p.peaches,units:p.peaches*1000};
  if(kind==='bar'){saved.park.spins=9;saved.park.cycleWagerUnits=9000;saved.barSpins=25;}
  const draws=fromGrid(losing,kind==='bar'?.99:.5);let first=true;
  let model=createPreview(saved,()=>first?(first=false,.99):draws());
  const req={action:'spin',game:'circus',bet:10,slotVersion:6,requestId:randomUUID()},r=await model.run(req);
  assert.ok(r.outcome.res.win>0);assert.ok(kind==='wheel'?r.park.wheel:r.outcome.feature);
  assert.equal((await model.run(req)).player.balance,r.player.balance);
  model=createPreview(JSON.parse(JSON.stringify(model.exportState())),()=>{throw Error('Replay must not draw again');});
  const replay=await model.run(req);assert.equal(replay.replayed,true);assert.equal(replay.player.balance,r.player.balance);assert.deepEqual(replay.park,r.park);
 }
});
