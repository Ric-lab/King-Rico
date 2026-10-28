// A saved 5x5 card. Marks are cell indices, so every new mark has a compact proof.
const CARD_LINES=[];
for(let r=0;r<5;r++)CARD_LINES.push(Array.from({length:5},(_,c)=>r*5+c));
for(let c=0;c<5;c++)CARD_LINES.push(Array.from({length:5},(_,r)=>r*5+c));
CARD_LINES.push([0,6,12,18,24],[4,8,12,16,20]);
const CARD_GOLD=.55,CARD_HIT=.27;
const cardIndex=(card,n)=>card.indexOf(n);
const useful=(card,marks,n)=>{const i=cardIndex(card,n);return i>=0&&!marks.includes(i);};
const winningLine=marks=>CARD_LINES.find(line=>line.every(i=>marks.includes(i)))||null;
const STEPS=[1,2,4,7,8];
function newCard(rng){return Array.from({length:5},(_,c)=>c*15+1+Math.floor(rng()*15));}
function expandCard(targets,version=1){return Array.from({length:25},(_,i)=>{if(version===2&&i===12)return 0;const c=i%5;return c*15+1+(targets[c]-c*15-1+STEPS[c]*Math.floor(i/5))%15;});}
function cardRound(betUnits,previous,move,roundId,selected,rng,multiplier,requestedVersion=1){
 const cardVersion=previous?.cardVersion??requestedVersion;
 const targets=previous?.targets||newCard(rng),card=expandCard(targets,cardVersion),marks=[...(previous?.marks||(cardVersion===2?[12]:[]))];
 const payoutVersion=previous?.payoutVersion??3;
 let used=previous?.used||0,slots,bin=-1,mark=-1;
 if(move==='roll'){
  slots=Array.from({length:5},(_,c)=>{
   const missing=card.filter((n,i)=>i%5===c&&!marks.includes(i));
   const other=Array.from({length:15},(_,i)=>c*15+i+1).filter(n=>!useful(card,marks,n));
   const pool=missing.length&&rng()<CARD_GOLD?missing:other;
   return pool[Math.floor(rng()*pool.length)];
  });
  if(!slots.some(n=>useful(card,marks,n))){
   const missing=card.map((n,i)=>({n,i})).filter(x=>!marks.includes(x.i));
   const chosen=missing[Math.floor(rng()*missing.length)];slots[chosen.i%5]=chosen.n;
  }
  // A sampled miss must have somewhere to land without awarding a mark.
  if(slots.every(n=>useful(card,marks,n))){const c=Math.floor(rng()*5);slots[c]=Array.from({length:15},(_,i)=>c*15+i+1).find(n=>!useful(card,marks,n));}
 }else{
  slots=previous.slots;
  const gold=slots.flatMap((n,c)=>useful(card,marks,n)?[c]:[]),onGold=gold.includes(selected);
  const hit=rng()<CARD_HIT*(onGold?1:.85),pool=hit?gold:[0,1,2,3,4].filter(c=>!gold.includes(c));
  const near=pool.slice().sort((a,b)=>Math.abs(a-selected)-Math.abs(b-selected));
  bin=hit&&onGold?selected:near[rng()<.7?0:Math.min(1,near.length-1)];
  // Free-center cards favor the chosen gold, but a different gold also counts.
  // Keep the same hit draw and preserve saved v1 cards' landing behavior.
  if(cardVersion===2&&hit&&onGold&&gold.length>1&&rng()>=.7){
   const others=gold.filter(c=>c!==selected);bin=others[Math.floor(rng()*others.length)];
  }
  const i=cardIndex(card,slots[bin]);
  if(i>=0&&!marks.includes(i)){mark=i;marks.push(i);}
  used++;
 }
 const won=!!winningLine(marks),ended=won||used===30;
 return {move,roundId,betUnits,targets,marks,used,slots,bin,mark,ended,
  winUnits:won?Math.round(betUnits*(payoutVersion===3?2:multiplier(used))):0,payoutVersion,cardVersion};
}
// Reference policy: prefer a draw that advances the most developed open line.
function chooseSlot(round){
 const {marks,slots}=round,targets=expandCard(round.targets,round.cardVersion||1);
 let best=-Infinity,selected=0;
 for(let c=0;c<5;c++){
  const i=targets.indexOf(slots[c]);if(i<0||marks.includes(i))continue;
  const score=CARD_LINES.filter(l=>l.includes(i)).reduce((v,l)=>v+4**l.filter(j=>marks.includes(j)).length,0);
  if(score>best){best=score;selected=c;}
 }
 return selected;
}
module.exports={CARD_LINES,CARD_HIT,CARD_GOLD,newCard,expandCard,winningLine,useful,cardRound,chooseSlot};
