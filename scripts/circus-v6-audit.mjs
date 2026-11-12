import engine from '../cloud/engine.cjs';
import park from '../cloud/park.cjs';
import {seeded} from './economy-audit.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export function auditV6({spins=5000000,bet=10,seed=472831,strategy='fixed',armor=false}={}){
 const rng=seeded(seed),p={balanceUnits:1e14,peaches:0,peachBank:{count:0,units:0}},s=park.fresh();
 let wagered=0,paid=0,wheel=0,theft=0,defenses=0,awards=0,hits=0,features=0;const villains={tony:0,tucker:0,ray:0};
 for(let i=0;i<spins;i++){
  const b=strategy==='tenth-high'?(s.spins===9?1000:1):strategy==='armor-farm'?(s.cedros?1000:1):strategy==='alternating'?(i%2?1000:1):bet,stake=engine.units(b);
  if(armor)s.cedros=5;
  const x=park.spin(p,s,b,'audit',rng,6),loss=x.tony?.stolenUnits||0;
  p.balanceUnits+=x.winUnits-stake-loss;p.peaches=x.peaches;p.peachBank=x.peachBank;
  wagered+=stake;paid+=x.winUnits;theft+=loss;defenses+=x.defense?.used||0;awards+=x.cedarAward||0;hits+=x.winUnits>0;features+=!!x.feature;
  for(const k of Object.keys(villains))villains[k]+=!!x[k];
  if(s.wheel){const extra=park.bonus(s,s.wheel.id,rng);wheel+=extra;p.balanceUnits+=extra;s.wheel=null;s.spins=0;s.cycleWagerUnits=0;}
 }
 const r=(paid+wheel-theft)/wagered;
 return {version:6,spins,bet,strategy,armor,seed,pays:engine.circusProfile.PAYS_V6,weights:engine.circusProfile.WEIGHTS_V6,cedarProbability:engine.circusProfile.CEDAR_P,components:{wagered:wagered/100,paid:paid/100,wheel:wheel/100,theft:theft/100},return:r,defenses,awards,villains,prizeRate:hits/spins,features,inRange:r>=.885&&r<=.915};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const n=Number(process.argv.find(x=>x.startsWith('--spins='))?.split('=')[1]||5000000);const results=[1,10,100,1000].map(bet=>{const r=auditV6({spins:n,bet});console.error(bet,r.return);return r;});const sourceHashes=Object.fromEntries(['cloud/engine.cjs','cloud/park.cjs','cloud/circus-profile.cjs','cloud/circus-control-v6.cjs','cloud/truncated-normal.cjs','scripts/circus-v6-audit.mjs'].map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')]));console.log(JSON.stringify({sourceHashes,results,passed:results.every(x=>x.inRange)},null,2));}
