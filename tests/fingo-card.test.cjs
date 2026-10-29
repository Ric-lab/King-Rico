const test=require('node:test'),assert=require('node:assert/strict'),e=require('../cloud/engine.cjs');
const {dropDraws}=require('./helpers/fingo.cjs');
const {newCard,expandCard,CARD_LINES,winningLine,chooseSlot}=e.fingoCard;
test('saved card seeds generate 25 distinct, readable numbers and match the rules inverse in all columns',()=>{
 for(let shift=0;shift<15;shift++){
  const seeds=Array.from({length:5},(_,c)=>c*15+shift+1),card=expandCard(seeds);
  assert.equal(card.length,25);assert.equal(new Set(card).size,25);
  for(let c=0;c<5;c++)for(let n=c*15+1;n<=c*15+15;n++){
   const row=((n-seeds[c]+30)*[1,8,4,13,2][c])%15,index=row*5+c;
   assert.equal(card.indexOf(n),row<5?index:-1);
  }
 }
});
test('all twelve quinas pay only after the fifth cell, with a fixed 2x prize',()=>{
 const targets=newCard(()=>0),card=expandCard(targets);
 for(const line of CARD_LINES){
  assert.equal(winningLine(line.slice(0,4)),null);
  const i=line[4],c=i%5,slots=[6,21,36,51,64];slots[c]=card[i];
  const prior={targets,marks:line.slice(0,4),used:4,slots,cardVersion:1};
  const before=structuredClone(prior),x=e.fingo(10,prior,'drop','r',c,()=>0);
  assert.deepEqual(prior,before);assert.equal(x.mark,i);assert.equal(x.ended,true);assert.equal(x.winUnits,2000);
 }
});
test('two golden choices have different strategic value and five unrelated marks are not a quina',()=>{
 const targets=newCard(()=>0),card=expandCard(targets),prior={targets,marks:[0,1,2,3],used:4,slots:[card[5],21,36,51,card[4]],cardVersion:1};
 const isolated=e.fingo(10,prior,'drop','r',0,()=>0),complete=e.fingo(10,prior,'drop','r',4,()=>0);
 assert.equal(isolated.mark,5);assert.equal(isolated.winUnits,0);assert.equal(isolated.ended,false);
 assert.equal(complete.winUnits,2000);assert.equal(chooseSlot(prior),4);
 assert.equal(winningLine([0,1,7,13,24]),null);
});
test('card rolls offer useful numbers and physical landings always mark the number actually reached',()=>{
 let seed=9731;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 for(let n=0;n<300;n++){
  const r=e.fingo(10,null,'roll','r',0,rng),card=expandCard(r.targets,r.cardVersion);
  assert.equal(r.cardVersion,2);assert.ok(r.slots.some(v=>card.includes(v)));
  const x=e.fingo(10,r,'drop','r',chooseSlot(r),rng),i=card.indexOf(r.slots[x.bin]);
  assert.equal(x.used,1);assert.equal(x.mark,i>=0&&!r.marks.includes(i)?i:-1);
  assert.deepEqual(x.marks,x.mark<0?r.marks:[...r.marks,x.mark]);
 }
});
test('an incomplete card closes at 30 without awarding a prize',()=>{
 const prior={targets:newCard(()=>0),marks:[0,1,7],used:29,slots:[6,21,36,51,61],cardVersion:1};
 const x=e.fingo(10,prior,'drop','r',4,()=>.99);
 assert.equal(x.used,30);assert.equal(x.ended,true);assert.equal(x.winUnits,0);
});

test('fixed 2x pays every completion from 5 to 30, while paid v2 cards retain their bands',()=>{
 const targets=newCard(()=>0);
 for(let used=5;used<=30;used++)for(const payoutVersion of [2,3]){
  const prior={targets,marks:[0,1,2,3],used:used-1,slots:[6,21,36,51,61],cardVersion:1,payoutVersion};
  const x=e.fingo(2.5,prior,'drop','r',4,()=>0);
  assert.equal(x.payoutVersion,payoutVersion);assert.equal(x.winUnits,Math.round(250*(payoutVersion===3?2:e.fingoMultiplier(used,2))));
 }
 const r=e.fingo(2.5,null,'roll','r',0,()=>0);assert.equal(r.payoutVersion,3);assert.equal(r.winUnits,0);
});

test('preview card v2 has a real free King Rico center, and a center line wins on four paid marks',()=>{
 const seeds=newCard(()=>0),card=expandCard(seeds,2);assert.equal(card[12],0);
 const first=e.fingoCard.cardRound(1000,null,'roll','preview',0,()=>0,()=>2,2);
 assert.equal(first.cardVersion,2);assert.deepEqual(first.marks,[12]);assert.ok(!first.slots.includes(0));
 for(const line of CARD_LINES.filter(l=>l.includes(12))){
  const i=line.find(i=>i!==12),column=i%5,slots=[6,21,36,51,64];slots[column]=card[i];
  const prior={targets:seeds,marks:line.filter(j=>j!==i),used:3,slots,cardVersion:2,payoutVersion:3};
  const win=e.fingoCard.cardRound(1000,prior,'drop','preview',column,()=>0,()=>2);
  assert.equal(win.used,4);assert.equal(win.winUnits,2000);assert.equal(win.mark,i);assert.ok(win.marks.includes(12));
 }
});


test('preview marks the gold actually reached even when another gold was selected',()=>{
 const targets=newCard(()=>0),card=expandCard(targets,2);
 const prior={targets,marks:[12],used:0,slots:[card[0],card[1],36,51,64],cardVersion:2,payoutVersion:3};
 const before=structuredClone(prior),draws=dropDraws(0,1);
 const hit=e.fingoCard.cardRound(1000,prior,'drop','preview',0,()=>draws.shift(),()=>2);
 assert.equal(hit.bin,1);assert.equal(hit.mark,1);assert.deepEqual(hit.marks,[12,1]);
 assert.equal(hit.used,1);assert.equal(hit.winUnits,0);assert.deepEqual(prior,before);
 const aimed=e.fingoCard.cardRound(1000,prior,'drop','preview',0,()=>0,()=>2);
 assert.equal(aimed.bin,0);assert.equal(aimed.mark,0);
 const closing={...prior,marks:[0,2,3,4,12],used:4,slots:[card[5],card[1],36,51,64]},winDraws=dropDraws(0,1);
 const win=e.fingoCard.cardRound(1000,closing,'drop','preview',0,()=>winDraws.shift(),()=>2);
 assert.equal(win.bin,1);assert.equal(win.mark,1);assert.equal(win.ended,true);assert.equal(win.winUnits,2000);

 const miss=e.fingoCard.cardRound(1000,prior,'drop','preview',0,()=>dropDraws(0,2)[0],()=>2);
 assert.equal(miss.mark,-1);assert.deepEqual(miss.marks,[12]);
 const legacy=e.fingoCard.cardRound(1000,{...prior,cardVersion:1,marks:[]},'drop','legacy',0,(()=>{const d=[0,.99,0];return()=>d.shift();})(),()=>2);
 assert.equal(legacy.bin,0);assert.equal(legacy.mark,0);
});
