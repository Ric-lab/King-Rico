import engine from '../cloud/engine.cjs';
import {pathToFileURL} from 'node:url';
export function auditFingoCard(count=20000){
 const results=[];
 for(const policy of ['lines','physical','gold','random']){
  let seed=90431,wins=0,paid=0,used=0;
  const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  for(let i=0;i<count;i++){
   let r=null;
   do{
    r=engine.fingo(10,r,'roll','audit',0,rng);
    const card=engine.fingoCard.expandCard(r.targets,r.cardVersion);
    let selected=policy==='lines'?engine.fingoCard.chooseSlot(r):policy==='gold'?r.slots.findIndex(n=>engine.fingoCard.useful(card,r.marks,n)):policy==='random'?Math.floor(rng()*5):0;
    if(policy==='physical'){
     const value=number=>{const i=card.indexOf(number);return i<0||r.marks.includes(i)?0:engine.fingoCard.CARD_LINES.filter(l=>l.includes(i)).reduce((sum,l)=>sum+4**l.filter(j=>r.marks.includes(j)).length,0);};
     const values=r.slots.map(value);
     const scores=r.slots.map((n,c)=>engine.fingoCard.useful(card,r.marks,n)?engine.fingoCard.PHYSICAL_BINS[c].reduce((sum,b)=>sum+values[b],0):-1);
     selected=scores.indexOf(Math.max(...scores));
    }
    r=engine.fingo(10,r,'drop','audit',selected,rng);
   }while(!r.ended);
   wins+=r.winUnits>0;paid+=r.winUnits;used+=r.used;
  }
  results.push({policy,count,seed:90431,rtp:paid/(1000*count),prizeRate:wins/count,meanPlays:used/count});
 }
 return {rulesVersion:engine.RULES_VERSION,note:'Seeded simulation, not proof of optimal play or theoretical RTP. Fixed odds; a quina pays 2x at any play. Gifts and refills excluded.',results};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(auditFingoCard(),null,2));
