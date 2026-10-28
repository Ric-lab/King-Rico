'use strict';
// Shared browser/Node engine. Spark stores these client-generated results; it does not verify the lottery.
const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
const SYMBOLS = [
  { id: 'curtain', pay: 10, w: 3 }, { id: 'drum', pay: 1.2, w: 30 },
  { id: 'tent', pay: 2.5, w: 20 }, { id: 'candy', pay: 7.5, w: 8 },
  { id: 'clover', pay: 5, w: 12 }, { id: 'scepter', pay: 12.5, w: 5 },
  { id: 'coin', pay: 15, w: 4 }, { id: 'crown', pay: 17.5, w: 3 },
  { id: 'gem', pay: 20, w: 2 }, { id: 'wild', pay: 33.3, w: 2.4 }
];
const TARGET_RTP = .98;
const BETS = [1, 2.5, 5, 10, 25, 50, 100, 250, 500, 1000];
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,4,8],[2,4,6]];
const WILD = 9, PEACH = 11, PEACH_P = .008174081789857218, PEACH_GOAL = 5;
const FEAT_P_SYM = .14, FEAT_P_WILD = .04, FEAT_MIN = 10, FEAT_SPINS = 5;
const WHEEL_HIT_P = .095, WHEEL_PAY = 10;
const units = value => Math.round(value * 100);
const coins = value => value / 100;
const RULES_VERSION = '2026-10-28-fingo-free-v11';
const {twentyOne} = require('./twenty-one.cjs');
const {thirtyThree} = require('./thirty-three.cjs');
const {claw} = require('./claw.cjs');
const {race} = require('./race.cjs');
const {climb,GUARANTEED_FACTOR,PEACH_PROBABILITY}=require('./ladder.cjs');
const FLYING_BASE=.935419176, FLYING_PEACH_MIN=2, FLYING_PEACH_MAX=7;
const FLYING_MULTIPLIERS = [1.2,1.5,2,2.5,3,4,5,8,12,20];
function flying(bet,previous,move,roundId,selected,rng=random) {
  const before=previous?.step || 0,betUnits=previous?.betUnits || units(bet);
  if(!previous || previous.ladderVersion===2) {
    const x=climb({multipliers:FLYING_MULTIPLIERS,base:FLYING_BASE,peachMin:FLYING_PEACH_MIN,
      peachMax:FLYING_PEACH_MAX,prize:(b,f)=>Math.round(units(b)*FLYING_MULTIPLIERS[f-1])},bet,
      previous?{...previous,floor:before}:null,move,rng);
    const {floor,...result}=x;
    return {move,roundId,betUnits,ladderVersion:2,...result,step:floor,selected,
      popped:move==='pop'?[...(previous?.popped||[]),selected]:[...previous.popped]};
  }
  // Already-paid rounds from older clients retain their original terms.
  const ok=move==='collect' || rng()<(before?FLYING_MULTIPLIERS[before-1]:TARGET_RTP)/FLYING_MULTIPLIERS[before];
  const step=before+(move==='pop' && ok?1:0),popped=move==='pop'?[...(previous?.popped || []),selected]:[...previous.popped];
  const ended=move==='collect' || !ok || step===10;
  return {move,roundId,betUnits,step,popped,selected,ok,ended,winUnits:ended && ok?Math.round(betUnits*FLYING_MULTIPLIERS[step-1]):0};
}
const twentyOneRound = (bet,previous,move,roundId,rng=random,target=21) =>
  (move==='start' ? target===33 : previous?.target===33)
    ? thirtyThree(bet,previous,move,roundId,rng) : twentyOne(bet,previous,move,roundId,rng);
// New cards close more often; the first 50x band is attainable in five balls.
const FINGO_BALLS=30,FINGO_HIT=.15370947831009096,FINGO_GOLD=.28;
const FINGO_MULTIPLIERS=[50,15,8,5,3.5,2.5,2,1.5,1.2,1];
const FINGO_BANDS=[5,7,9,12,15,18,21,24,27,30];
const FINGO_LEGACY_HIT=.11783,FINGO_LEGACY_MULTIPLIERS=[50,25,12.5,10,9,7,5,3,2,1];
function fingoMultiplier(used,version=2){return version===2?FINGO_MULTIPLIERS[FINGO_BANDS.findIndex(end=>used<=end)]:FINGO_LEGACY_MULTIPLIERS[Math.floor((used-1)/3)];}
const PENALTY_MULTIPLIERS = [1.5,3,5,7,10,15,20,25,50,100], PENALTY_LEGACY_MULTIPLIERS = [1.2,1.8,3,5,10], PENALTY_BASE = TARGET_RTP;
function penalty(bet, previous, move, roundId, quality = 0, rng = random) {
  const modern = !previous || previous.ladderVersion === 2;
  const multipliers = modern ? PENALTY_MULTIPLIERS : PENALTY_LEGACY_MULTIPLIERS;
  const before = previous?.step || 0, betUnits = previous?.betUnits || units(bet);
  const chance = (before ? multipliers[before-1] : PENALTY_BASE) / multipliers[before];
  const goal = move === 'collect' || quality > 0 && rng() < chance * quality / 1000;
  const step = before + (move === 'shoot' && goal ? 1 : 0);
  const ended = move === 'collect' || !goal || step === multipliers.length;
  const winUnits = ended && goal ? Math.round(betUnits * multipliers[step-1]) : 0;
  return {move,roundId,betUnits,step,quality,goal,ended,winUnits,...(modern?{ladderVersion:2}:{})};
}
const fingoCard=require('./fingo-card.cjs');
function fingo(bet,previous,move,roundId,selected,rng=random){
 return !previous||previous.cardVersion>=1
  ? fingoCard.cardRound(units(bet),previous,move,roundId,selected,rng,n=>fingoMultiplier(n,2),2)
  : fingoLegacy(bet,previous,move,roundId,selected,rng);
}
function fingoLegacy(bet, previous, move, roundId, selected, rng = random) {
  const modern=!previous||previous.payoutVersion===2,hitChance=modern?FINGO_HIT:FINGO_LEGACY_HIT;
  const targets = previous?.targets || Array.from({length:5},(_,c)=>c*15+1+Math.floor(rng()*15));
  const marks = [...(previous?.marks || Array(5).fill(false))];
  let used = previous?.used || 0, slots, bin = -1;
  if(move==='roll') {
    slots=targets.map((target,c)=>{
      if(!marks[c] && rng()<FINGO_GOLD) return target;
      const value=c*15+1+Math.floor(rng()*14);
      return value>=target ? value+1 : value;
    });
    // Keep one losing pipe: five golden pipes would turn a sampled miss into a hit.
    if(slots.every((n,c)=>n===targets[c])) slots[4]=60+1+(targets[4]-60)%15;
    const missing=marks.flatMap((marked,c)=>marked?[]:[c]);
    if(!missing.some(c=>slots[c]===targets[c])) {
      const c=missing[Math.floor(rng()*missing.length)];slots[c]=targets[c];
    }
  } else {
    slots=previous.slots;
    const gold=slots.flatMap((n,c)=>!marks[c] && n===targets[c]?[c]:[]),onGold=gold.includes(selected);
    const hit=gold.length>0 && rng()<hitChance*(onGold?1:modern?.85:.6);
    const pool=hit?gold:[0,1,2,3,4].filter(c=>!gold.includes(c));
    const near=pool.slice().sort((a,b)=>Math.abs(a-selected)-Math.abs(b-selected));
    bin=hit && onGold ? selected : near[rng()<.7?0:Math.min(near.length-1,1)] ?? selected;
    if(slots[bin]===targets[bin]) marks[bin]=true;
    used++;
  }
  const complete=marks.every(Boolean),ended=complete || used===FINGO_BALLS;
  return {move,roundId,betUnits:units(bet),targets,marks,used,slots,bin,ended,
    winUnits:complete ? Math.round(units(bet)*fingoMultiplier(used,modern?2:1)) : 0,...(modern?{payoutVersion:2}:{})};
}
const NECK_MULTIPLIERS = [1.1,1.2,1.3,1.4,1.5,1.55,1.7,1.8,2,2.2,2.5,2.8,3,3.33,3.5,4,4.5,5,5.5,5.8,7,8,9,10,12,14,15.5,18,20,25,30,40,50];
const NECK_BASE = .9320338677939342, NECK_GUARANTEED_FACTOR = GUARANTEED_FACTOR, NECK_PEACH_PROBABILITY = PEACH_PROBABILITY;
// Preserve the design's one-decimal prizes, without rounding the shared wallet.
const neckPrize = (bet, floor) => Math.round(bet * NECK_MULTIPLIERS[floor-1] * 10) * 10;
function neck(bet, previous, move, roundId, rng = random) {
  return {move,roundId,betUnits:units(bet),...climb({multipliers:NECK_MULTIPLIERS,base:NECK_BASE,
    peachMin:6,peachMax:20,prize:neckPrize},bet,previous,move,rng)};
}
function weighted(pool, rng) {
  let r = rng() * pool.reduce((a, s) => a + s.w, 0);
  for (let i = 0; i < pool.length; i++) { r -= pool[i].w; if (r <= 0) return i; }
  return 0;
}
function pick(rng = random) { return rng() < PEACH_P ? PEACH : weighted(SYMBOLS, rng); }
function lineSymbol(grid, line) {
  const v = line.map(i => grid[i]);
  if (v.some(s => s === undefined || s < 0 || s === PEACH)) return -1;
  const base = v.find(s => s !== WILD);
  if (base === undefined) return WILD;
  return v.every(s => s === base || s === WILD) ? base : -1;
}
function evaluate(grid, bet) {
  let win = 0; const cells = new Set(), lines = [];
  LINES.forEach((line, li) => {
    const s = lineSymbol(grid, line);
    if (s >= 0) { win += bet * SYMBOLS[s].pay; lines.push(li); line.forEach(i => cells.add(i)); }
  });
  const base = grid.find(v => v !== WILD);
  const full = grid.every(v => v >= 0 && v !== PEACH) &&
    (base === undefined || grid.every(v => v === base || v === WILD));
  if (full && win > 0) win *= 10;
  return { win: coins(units(win)), cells: [...cells].sort((a,b) => a-b), lines,
    full: full && win > 0, peach: grid.flatMap((v,i) => v === PEACH ? [i] : []) };
}
function feature(bet, rng = random) {
  const sym = weighted(SYMBOLS.slice(0, WILD), rng), grid = Array(9).fill(-1), rounds = [];
  for (let round = 0; round < FEAT_SPINS && grid.some(v => v < 0); round++) {
    const result = [];
    for (const i of [6,3,0,7,4,1,8,5,2]) if (grid[i] < 0) {
      const r = rng(), v = r < FEAT_P_SYM ? sym : r < FEAT_P_SYM + FEAT_P_WILD ? WILD : -1;
      grid[i] = v; result.push({ i, v });
    }
    // Firestore cannot store an array directly inside another array.
    rounds.push({ result });
  }
  const res = evaluate(grid, bet); res.win = Math.max(res.win, coins(units(bet * FEAT_MIN)));
  return { sym, rounds, grid, res };
}
function slot(bet, peaches = 0, rng = random, bank = null) {
  const grid = Array.from({ length: 9 }, () => pick(rng));
  let pc = 0;
  for (let i = 0; i < 9; i++) if (grid[i] === PEACH && ++pc > 2) {
    do { grid[i] = pick(rng); } while (grid[i] === PEACH);
  }
  const res = evaluate(grid, bet), total = peaches + res.peach.length;
  const stake = units(bet), saved = bank?.count===peaches ? bank.units : peaches*stake;
  const featureBet = (saved+(PEACH_GOAL-peaches)*stake)/PEACH_GOAL/100;
  const bonus = total >= PEACH_GOAL ? {...feature(featureBet, rng),bet:featureBet} : null;
  const remaining = bonus ? total-PEACH_GOAL : total;
  const peachBank = {count:remaining,units:bonus ? remaining*stake : saved+res.peach.length*stake};
  return { grid, res, feature: bonus, peaches: remaining, peachBank,
    winUnits: units(res.win) + (bonus ? units(bonus.res.win) : 0) };
}
// Match the current 13-pocket Claude Design wheel, including same-color prizes.
const WHEEL_EXACT_P=.025, WHEEL_COLOR_P=.365, WHEEL_FORTUNE_P=TARGET_RTP/25, WHEEL_COLOR_PAY=2;
const wheelPrize=(bet,selected,target)=>units(bet*(target===selected ? selected===0 ? 25 : 10 : selected!==0 && target!==0 && selected%2===target%2 ? WHEEL_COLOR_PAY : 0));
function wheel(bet,selected,rng=random) {
  const all=Array.from({length:13},(_,i)=>i),r=rng();
  const pool=selected===0 ? r<WHEEL_FORTUNE_P ? [0] : all.slice(1)
    : r<WHEEL_EXACT_P ? [selected] : r<WHEEL_EXACT_P+WHEEL_COLOR_P
      ? all.filter(n=>n!==0 && n!==selected && n%2===selected%2) : all.filter(n=>n===0 || n%2!==selected%2);
  const target=pool[Math.floor(rng()*pool.length)];return {target,winUnits:wheelPrize(bet,selected,target)};
}
const CLOWN_BALLS=10,CLOWN_MULTIPLIERS=[1.5,2.5,5,5,10,10];
function clown(bet,previous,roundId,selected,stats={betUnits:0,winUnits:0},rng=random) {
  const used=(previous?.used || 0)+1,betUnits=previous?.betUnits || units(bet),results=previous?.results || [];
  const m=CLOWN_MULTIPLIERS[selected] || 0,perBall=Math.round(betUnits*m/CLOWN_BALLS);
  // The same chosen target has the same chance regardless of past wins or balance.
  const chance=perBall ? TARGET_RTP*betUnits/(CLOWN_BALLS*perBall) : 0;
  const hit=selected>=0 && rng()<chance ? selected : -1;
  const multiplier=hit<0 ? 0 : m,sumUnits=(previous?.sumUnits || 0)+Math.round(betUnits*multiplier/CLOWN_BALLS),ended=used===CLOWN_BALLS;
  return {roundId,betUnits,used,selected,hit,results:[...results,multiplier],sumUnits,ended,winUnits:ended?sumUnits:0};
}
// Skill determines landing; each checkpoint/gold prize is committed once.
function bounce(bet,previous,move,roundId,gold=false) {
  const betUnits=previous?.betUnits || units(bet),n=(previous?.n || 0)+(move==='land'?1:0);
  const prize=step=>Math.round(betUnits*(100+5*step)/100),guardUnits=move==='land' && n%10===0 ? prize(n) : previous?.guardUnits || 0;
  const ended=move==='fall' || move==='collect' || n===10000;
  const winUnits=move==='land' && gold ? betUnits*3 : ended ? move==='fall' ? guardUnits : prize(n) : 0;
  return {roundId,betUnits,move,n,guardUnits,gold,ended,winUnits};
}
// Glass Bridge: the complete path is drawn once, before the first choice.
const BRIDGE_MULTIPLIERS=[1.9,3.8,7.5,15,30,60];
function bridge(bet,previous,move,roundId,selected=-1,rng=random) {
  const betUnits=previous?.betUnits||units(bet),safeSides=previous?.safeSides||Array.from({length:6},()=>rng()<.5?0:1);
  const before=previous?.step||0,ok=move!=='jump'||selected===safeSides[before];
  const step=before+(move==='jump'&&ok?1:0),choices=move==='jump'?[...previous.choices,selected]:previous?.choices||[];
  const ended=move==='collect'||!ok||step===6;
  return {roundId,betUnits,move,selected,safeSides,choices,step,ok,ended,
    winUnits:ended&&ok?Math.round(betUnits*BRIDGE_MULTIPLIERS[step-1]):0};
}
function dayKey(ms) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date(ms));
  const get = key => parts.find(p => p.type === key).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
function bonusFor(last, streak, now) {
  const today = dayKey(now), previous = last || '';
  if (today === previous) return { day: today, streak, amount: 0 };
  const gap = previous ? (Date.parse(today) - Date.parse(previous)) / 86400000 : Infinity;
  const index = gap === 1 ? (streak || 0) % 7 : 0;
  return { day: today, streak: index + 1, amount: [50,100,150,200,250,500,1000][index] };
}
module.exports = { fingoLegacy, fingoCard, bridge, BRIDGE_MULTIPLIERS, TARGET_RTP, WHEEL_COLOR_PAY, SYMBOLS, BETS, LINES, WILD, PEACH, PEACH_P, PEACH_GOAL, FEAT_P_SYM, FEAT_P_WILD,
  FEAT_MIN, FEAT_SPINS, WHEEL_HIT_P, WHEEL_PAY, RULES_VERSION, NECK_MULTIPLIERS, NECK_BASE, NECK_GUARANTEED_FACTOR,
  NECK_PEACH_PROBABILITY, neckPrize, neck, FINGO_BALLS, FINGO_HIT, FINGO_GOLD, FINGO_MULTIPLIERS, FINGO_BANDS, FINGO_LEGACY_HIT, FINGO_LEGACY_MULTIPLIERS, fingoMultiplier, fingo,
  FLYING_BASE, FLYING_PEACH_MIN, FLYING_PEACH_MAX, FLYING_MULTIPLIERS, flying, claw, race, twentyOne:twentyOneRound, PENALTY_MULTIPLIERS, PENALTY_LEGACY_MULTIPLIERS, PENALTY_BASE, penalty, CLOWN_BALLS, CLOWN_MULTIPLIERS, clown, bounce, WHEEL_EXACT_P, WHEEL_COLOR_P, WHEEL_FORTUNE_P, wheelPrize, units, coins, pick, evaluate, feature, slot, wheel, dayKey, bonusFor };
