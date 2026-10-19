'use strict';
// Shared browser/Node engine. Spark stores these client-generated results; it does not verify the lottery.
const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
const SYMBOLS = [
  { id: 'curtain', pay: 10, w: 3 }, { id: 'drum', pay: 1, w: 30 },
  { id: 'tent', pay: 2.5, w: 20 }, { id: 'candy', pay: 7.5, w: 8 },
  { id: 'clover', pay: 5, w: 12 }, { id: 'scepter', pay: 12.5, w: 5 },
  { id: 'coin', pay: 15, w: 4 }, { id: 'crown', pay: 17.5, w: 3 },
  { id: 'gem', pay: 20, w: 2 }, { id: 'wild', pay: 33.3, w: 2.85 }
];
const BETS = [1, 2.5, 5, 10, 25, 50, 100, 250, 500, 1000];
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,4,8],[2,4,6]];
const WILD = 9, PEACH = 11, PEACH_P = .008, PEACH_GOAL = 5;
const FEAT_P_SYM = .14, FEAT_P_WILD = .04, FEAT_MIN = 10, FEAT_SPINS = 5;
const WHEEL_HIT_P = .095, WHEEL_PAY = 10;
const units = value => Math.round(value * 100);
const coins = value => value / 100;
const RULES_VERSION = '2026-10-19-spark-v3';
const FINGO_BALLS = 21, FINGO_HIT = .2161, FINGO_GOLD = .28;
const FINGO_MULTIPLIERS = [25,25,8,4,2,1,.4];
const PENALTY_MULTIPLIERS = [1.2,1.8,3,5,10], PENALTY_BASE = .95;
function penalty(bet, previous, move, roundId, quality = 0, rng = random) {
  const before = previous?.step || 0, betUnits = previous?.betUnits || units(bet);
  const chance = (before ? PENALTY_MULTIPLIERS[before-1] : PENALTY_BASE) / PENALTY_MULTIPLIERS[before];
  const goal = move === 'collect' || quality > 0 && rng() < chance * quality / 1000;
  const step = before + (move === 'shoot' && goal ? 1 : 0);
  const ended = move === 'collect' || !goal || step === 5;
  const winUnits = ended && goal ? Math.round(betUnits * PENALTY_MULTIPLIERS[step-1]) : 0;
  return {move,roundId,betUnits,step,quality,goal,ended,winUnits};
}
function fingo(bet, previous, move, roundId, selected, rng = random) {
  const targets = previous?.targets || Array.from({length:5},(_,c)=>c*15+1+Math.floor(rng()*15));
  const marks = [...(previous?.marks || Array(5).fill(false))];
  let used = previous?.used || 0, slots, bin = -1;
  if(move==='roll') {
    slots=targets.map((target,c)=>{
      if(!marks[c] && rng()<FINGO_GOLD) return target;
      const value=c*15+1+Math.floor(rng()*14);
      return value>=target ? value+1 : value;
    });
    const missing=marks.flatMap((marked,c)=>marked?[]:[c]);
    if(!missing.some(c=>slots[c]===targets[c])) {
      const c=missing[Math.floor(rng()*missing.length)];slots[c]=targets[c];
    }
  } else {
    slots=previous.slots;
    const gold=slots.flatMap((n,c)=>!marks[c] && n===targets[c]?[c]:[]),onGold=gold.includes(selected);
    const hit=gold.length>0 && rng()<FINGO_HIT*(onGold?1:.6);
    const pool=hit?gold:[0,1,2,3,4].filter(c=>!gold.includes(c));
    const near=pool.slice().sort((a,b)=>Math.abs(a-selected)-Math.abs(b-selected));
    bin=hit && onGold ? selected : near[rng()<.7?0:Math.min(near.length-1,1)] ?? selected;
    if(slots[bin]===targets[bin]) marks[bin]=true;
    used++;
  }
  const complete=marks.every(Boolean),ended=complete || used===FINGO_BALLS;
  return {move,roundId,betUnits:units(bet),targets,marks,used,slots,bin,ended,
    winUnits:complete ? Math.round(units(bet)*FINGO_MULTIPLIERS[Math.floor((used-1)/3)]) : 0};
}
const NECK_MULTIPLIERS = [1.1,1.2,1.3,1.4,1.5,1.55,1.7,1.8,2,2.2,2.5,2.8,3,3.33,3.5,4,4.5,5,5.5,5.8,7,8,9,10,12,14,15.5,18,20,25,30,40,50];
const NECK_BASE = .88, NECK_GUARANTEED_FACTOR = .85, NECK_PEACH_PROBABILITY = 1/8;
// Preserve the design's one-decimal prizes, without rounding the shared wallet.
const neckPrize = (bet, floor) => Math.round(bet * NECK_MULTIPLIERS[floor-1] * 10) * 10;
function neck(bet, previous, move, roundId, rng = random) {
  const peachAt = previous ? previous.peachAt : rng()<NECK_PEACH_PROBABILITY ? 6+Math.floor(rng()*15) : 0;
  const floor = previous?.floor || 0, savedUnits = previous?.savedUnits || 0;
  if(move==='collect') return {move,roundId,betUnits:units(bet),peachAt,floor,savedUnits,ok:true,ended:true,winUnits:neckPrize(bet,floor)};
  const next = floor+1;
  const chance = (next===1 ? NECK_BASE/NECK_MULTIPLIERS[0] : NECK_MULTIPLIERS[next-2]/NECK_MULTIPLIERS[next-1]) * (savedUnits>0 ? NECK_GUARANTEED_FACTOR : 1);
  const ok = rng()<chance, saved = ok && next===peachAt ? neckPrize(bet,next) : savedUnits;
  const ended = !ok || next===NECK_MULTIPLIERS.length;
  return {move,roundId,betUnits:units(bet),peachAt,floor:ok?next:floor,savedUnits:saved,ok,ended,
    winUnits:ended ? ok ? neckPrize(bet,next) : saved : 0};
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
function slot(bet, peaches = 0, rng = random) {
  const grid = Array.from({ length: 9 }, () => pick(rng));
  let pc = 0;
  for (let i = 0; i < 9; i++) if (grid[i] === PEACH && ++pc > 2) {
    do { grid[i] = pick(rng); } while (grid[i] === PEACH);
  }
  const res = evaluate(grid, bet), total = peaches + res.peach.length;
  const bonus = total >= PEACH_GOAL ? feature(bet, rng) : null;
  return { grid, res, feature: bonus, peaches: bonus ? total - PEACH_GOAL : total,
    winUnits: units(res.win) + (bonus ? units(bonus.res.win) : 0) };
}
// Match the current 13-pocket Claude Design wheel, including same-color prizes.
const WHEEL_EXACT_P=.04, WHEEL_COLOR_P=.143, WHEEL_FORTUNE_P=.95/25;
const wheelPrize=(bet,selected,target)=>units(bet*(target===selected ? selected===0 ? 25 : 10 : selected!==0 && target!==0 && selected%2===target%2 ? 5 : 0));
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
  const m=CLOWN_MULTIPLIERS[selected] || 0,rtp=stats.betUnits ? stats.winUnits/stats.betUnits : 0;
  const hot=stats.betUnits>=2000 && rtp>.95,adjust=hot ? Math.max(.45,1-(rtp-.95)*3) : 1;
  const hit=selected>=0 && (!results.some(v=>v>0) && !hot || rng()<Math.min(1,.95/m*adjust)) ? selected : -1;
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
module.exports = { SYMBOLS, BETS, LINES, WILD, PEACH, PEACH_P, PEACH_GOAL, FEAT_P_SYM, FEAT_P_WILD,
  FEAT_MIN, FEAT_SPINS, WHEEL_HIT_P, WHEEL_PAY, RULES_VERSION, NECK_MULTIPLIERS, NECK_BASE, NECK_GUARANTEED_FACTOR,
  NECK_PEACH_PROBABILITY, neckPrize, neck, FINGO_BALLS, FINGO_HIT, FINGO_GOLD, FINGO_MULTIPLIERS, fingo,
  PENALTY_MULTIPLIERS, PENALTY_BASE, penalty, CLOWN_BALLS, CLOWN_MULTIPLIERS, clown, bounce, WHEEL_EXACT_P, WHEEL_COLOR_P, WHEEL_FORTUNE_P, wheelPrize, units, coins, pick, evaluate, feature, slot, wheel, dayKey, bonusFor };
