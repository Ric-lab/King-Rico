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
const RULES_VERSION = '2026-10-13-spark-v2';
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
function wheel(bet, selected, rng = random) {
  const others = Array.from({ length: 12 }, (_,i) => i).filter(i => i !== selected);
  const target = rng() < WHEEL_HIT_P ? selected : others[Math.floor(rng() * others.length)];
  return { target, winUnits: target === selected ? units(bet * WHEEL_PAY) : 0 };
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
  NECK_PEACH_PROBABILITY, neckPrize, neck, units, coins, pick, evaluate, feature, slot, wheel, dayKey, bonusFor };
