const test=require('node:test'),assert=require('node:assert/strict');
const engine=require('../cloud/engine.cjs'),park=require('../cloud/park.cjs');

test('Version 2 adds exactly three columns, preserving the five legacy line IDs',()=>{
 assert.deepEqual(engine.ALL_LINES.slice(0,5),engine.LINES);
 assert.deepEqual(engine.ALL_LINES.slice(5),[[0,3,6],[1,4,7],[2,5,8]]);
 for(let column=0;column<3;column++){
  const grid=[0,2,3,4,5,6,7,8,0];
  for(const cell of engine.ALL_LINES[5+column])grid[cell]=1;
  assert.equal(engine.evaluate(grid,10).win,0,'Legacy results retain five-line terms');
  const result=engine.evaluate(grid,10,2);
  assert.equal(result.win,12);assert.deepEqual(result.lines,[5+column]);
  assert.deepEqual(result.cells,engine.ALL_LINES[5+column]);
 }
});

test('Eight-line theoretical maximum follows the existing 33.3x wild and full-screen x10',()=>{
 // No multiplier or bet limit changes: only the number of valid combinations.
 for(const bet of engine.BETS){
  assert.equal(engine.evaluate(Array(9).fill(engine.WILD),bet).win,engine.coins(engine.units(bet*1665)));
  assert.equal(engine.evaluate(Array(9).fill(engine.WILD),bet,2).win,engine.coins(engine.units(bet*2664)));
 }
});

test('One or two loose tickets preserve coin wins and Happeach without awarding entries',()=>{
 for(const [draw,count]of [[.1,1],[.4,2],[.9,0]]){
  const grid=[1,1,1,2,3,4,5,6,engine.PEACH],res=engine.evaluate(grid,10,2);
  const result={grid:grid.slice(),res,winUnits:engine.units(res.win)};
  let first=true;const cells=park.scatterTickets(result,()=>{if(first){first=false;return draw;}return 0;});
  assert.equal(cells.length,count);
  assert.deepEqual(result.grid.slice(0,3),[1,1,1]);assert.equal(result.grid[8],engine.PEACH);
  assert.equal(engine.evaluate(result.grid.map(v=>v===10?-1:v),10,2).win,res.win);
  assert.equal(result.winUnits,1200);
 }
});

test('Ticket trincas in all eight combinations credit exactly three entries',()=>{
 for(let line=0;line<8;line++){
  const p={balanceUnits:100000,peaches:0,peachBank:{count:0,units:0},settings:{}},s=park.fresh();
  const draws=[...Array.from({length:9},()=>[.99,.4]).flat(),0,(line+.5)/8];
  const result=park.spin(p,s,10,'ticket',()=>draws.shift()??.99,2);
  assert.equal(result.slotVersion,2);assert.equal(result.ticketAward,3);assert.equal(s.tickets,3);
  assert.deepEqual(result.grid.flatMap((v,i)=>v===10?[i]:[]),engine.ALL_LINES[line]);
  assert.equal(result.winUnits,engine.units(engine.evaluate(result.grid.map(v=>v===10?-1:v),10,2).win));
 }
});
