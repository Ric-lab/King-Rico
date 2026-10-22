// Mathematical expectations use the live payout evaluator, including bonus minimums.
import engine from '../cloud/engine.cjs';
export function slotMath(game=engine,peachProbability=game.PEACH_P){
 const weights=game.SYMBOLS.reduce((n,s)=>n+s.w,0),p=game.SYMBOLS.map(s=>s.w/weights),wild=p[game.WILD];
 const line=p.reduce((n,x,i)=>n+(i===game.WILD?wild**3:(x+wild)**3-wild**3)*game.SYMBOLS[i].pay,0);
 const full=45*p.reduce((n,x,i)=>n+(i===game.WILD?wild**9:(x+wild)**9-wild**9)*game.SYMBOLS[i].pay,0);
 const q=peachProbability,none=(1-q)**9;let cleanLines=none*game.LINES.length,peaches=0;
 const add=(mask,prob)=>{peaches+=mask.length*prob;cleanLines+=game.LINES.filter(l=>!mask.some(i=>l.includes(i))).length*prob;};
 for(let a=0;a<9;a++)add([a],q*(1-q)**8);
 for(let b=1;b<9;b++)for(let a=0;a<b;a++)add([a,b],q*q*(1-q)**(b-1));
 const filled=1-(1-game.FEAT_P_SYM-game.FEAT_P_WILD)**game.FEAT_SPINS;
 const ps=filled*game.FEAT_P_SYM/(game.FEAT_P_SYM+game.FEAT_P_WILD),pw=filled*game.FEAT_P_WILD/(game.FEAT_P_SYM+game.FEAT_P_WILD),pe=1-filled;
 const totalNormal=game.SYMBOLS.slice(0,game.WILD).reduce((n,s)=>n+s.w,0),grid=Array(9);let bonus=0;
 for(let symbol=0;symbol<game.WILD;symbol++){
  let conditional=0;
  const walk=(i,prob)=>{if(i===9){conditional+=prob*Math.max(game.FEAT_MIN,game.evaluate(grid,10).win/10);return;}
   for(const [value,chance]of[[symbol,ps],[game.WILD,pw],[-1,pe]]){grid[i]=value;walk(i+1,prob*chance);}};
  walk(0,1);bonus+=conditional*game.SYMBOLS[symbol].w/totalNormal;
 }
 const base=cleanLines*line+none*full,feature=peaches/game.PEACH_GOAL*bonus;
 return {rtp:base+feature,baseRtp:base,featureRtp:feature,featureMean:bonus,featureEvery:game.PEACH_GOAL/peaches};
}
export function slotTargetPeachProbability(target=.98,game=engine){
 // Bonus expectation is independent of the Happeach arrival rate; memoize it for the solve.
 const original=slotMath(game,game.PEACH_P),bonus=original.featureMean;
 let lo=.0001,hi=.03;
 // Reuse the exact feature mean while solving the mask/line expression.
 const expected=q=>{
  const total=game.SYMBOLS.reduce((n,s)=>n+s.w,0),p=game.SYMBOLS.map(s=>s.w/total),w=p[game.WILD];
  const line=p.reduce((n,x,i)=>n+(i===game.WILD?w**3:(x+w)**3-w**3)*game.SYMBOLS[i].pay,0);
  const full=45*p.reduce((n,x,i)=>n+(i===game.WILD?w**9:(x+w)**9-w**9)*game.SYMBOLS[i].pay,0);
  let clean=5*(1-q)**9,count=0;
  for(let a=0;a<9;a++){const mask=[a],prob=q*(1-q)**8;count+=prob;clean+=game.LINES.filter(l=>!mask.some(i=>l.includes(i))).length*prob;}
  for(let b=1;b<9;b++)for(let a=0;a<b;a++){const mask=[a,b],prob=q*q*(1-q)**(b-1);count+=2*prob;clean+=game.LINES.filter(l=>!mask.some(i=>l.includes(i))).length*prob;}
  return clean*line+(1-q)**9*full+count/game.PEACH_GOAL*bonus;
 };
 for(let n=0;n<50;n++){const mid=(lo+hi)/2;if(expected(mid)<target)lo=mid;else hi=mid;}
 return (lo+hi)/2;
}
