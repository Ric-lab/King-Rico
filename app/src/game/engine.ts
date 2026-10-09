// Fortune Circus: regras e matemática do jogo, sem DOM, sem React, sem animação.
// Porte 1:1 da lógica de `Fortune Circus.dc.html` (pick, lineSymbol, evaluate, cesta de Happeach, Rodada Especial).
// O mesmo código deve rodar no cliente (simulação/animação) e no servidor (sorteio que mexe em saldo).
// Antes de mudar qualquer constante, rode `npm test`: a simulação falha se o RTP sair de 96–99%.

export type Rng = () => number; // [0, 1)

export const SYMBOLS = [
  { id: 'curtain', pay: 5, w: 24 },
  { id: 'drum', pay: 6, w: 19 },
  { id: 'tent', pay: 8, w: 14 },
  { id: 'candy', pay: 10, w: 10 },
  { id: 'clover', pay: 14, w: 7 },
  { id: 'scepter', pay: 18, w: 5 },
  { id: 'coin', pay: 24, w: 4 },
  { id: 'crown', pay: 32, w: 3 },
  { id: 'gem', pay: 50, w: 2 },
  { id: 'wild', pay: 80, w: 4 },
] as const;

export const WILD = 9;
export const PEACH = 11;
export const EMPTY = -1; // casa vazia na Rodada Especial

export const LINE_K = 1.9;
export const FEAT_P_SYM = 0.15;
export const FEAT_P_WILD = 0.04;
export const FEAT_MIN = 10;
export const PEACH_P = 0.008;
export const PEACH_GOAL = 5;
export const PEACH_PAY = 20;
export const FEAT_SPINS = 5;
export const FULL_MULT = 10;

export const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 4, 8], [2, 4, 6]] as const;
export const BETS = [1, 2.5, 5, 10, 25, 50, 100, 250, 500, 1000] as const;
/** Ordem em que os rolos param (A3 → C1). A Rodada Especial sorteia nessa ordem. */
export const STOP_ORDER = [6, 3, 0, 7, 4, 1, 8, 5, 2] as const;

export type Grid = number[]; // 9 casas, índice = linha * 3 + coluna

export interface SpinResult {
  win: number;
  /** Casas que fazem parte de linhas premiadas. */
  cells: number[];
  /** Índices em LINES das linhas premiadas. */
  lines: number[];
  /** Tela cheia do mesmo símbolo (paga ×10). */
  full: boolean;
  /** Casas onde caiu Happeach. */
  peach: number[];
}

export const round2 = (v: number) => Math.round(v * 100) / 100;

const SYM_TOTAL = SYMBOLS.reduce((a, s) => a + s.w, 0);

export function pick(rng: Rng): number {
  if (rng() < PEACH_P) return PEACH;
  let r = rng() * SYM_TOTAL;
  for (let i = 0; i < SYMBOLS.length; i++) {
    r -= SYMBOLS[i].w;
    if (r <= 0) return i;
  }
  return 0;
}

export function spinGrid(rng: Rng): Grid {
  return Array.from({ length: 9 }, () => pick(rng));
}

export function lineSymbol(g: Grid, line: readonly number[]): number {
  const v = line.map(i => g[i]);
  if (v.some(s => s === undefined || s < 0)) return -1;
  if (v.every(s => s === PEACH)) return PEACH;
  if (v.some(s => s === PEACH)) return -1;
  const base = v.find(s => s !== WILD);
  if (base === undefined) return WILD;
  return v.every(s => s === base || s === WILD) ? base : -1;
}

/** Multiplicador de uma linha (sobre a aposta), sem o ×10 de tela cheia. */
export function lineMult(sym: number): number {
  return sym === PEACH ? PEACH_PAY : (SYMBOLS[sym].pay / 5) * LINE_K;
}

export function evaluate(g: Grid, bet: number): SpinResult {
  let win = 0;
  const cells = new Set<number>();
  const lines: number[] = [];
  LINES.forEach((line, li) => {
    const s = lineSymbol(g, line);
    if (s >= 0) {
      win += bet * lineMult(s);
      lines.push(li);
      line.forEach(i => cells.add(i));
    }
  });
  const base = g.find(v => v !== WILD);
  const peach = g.map((v, i) => (v === PEACH ? i : -1)).filter(i => i >= 0);
  const full = g.every(v => v >= 0 && v !== PEACH) && (base === undefined || g.every(v => v === base || v === WILD));
  if (full && win > 0) win *= FULL_MULT;
  return { win: round2(win), cells: [...cells].sort((a, b) => a - b), lines, full: full && win > 0, peach };
}

/** Cesta de Happeach: soma os que caíram; ao chegar em 5 abre a Rodada Especial e o excedente fica para a próxima. */
export function addPeaches(basket: number, got: number): { basket: number; feature: boolean; carry: number } {
  const tot = basket + got;
  const feature = tot >= PEACH_GOAL;
  return { basket: Math.min(PEACH_GOAL, tot), feature, carry: Math.max(0, tot - PEACH_GOAL) };
}

/** Símbolo da Rodada Especial: sorteado entre os símbolos comuns (sem curinga), pelo mesmo peso do rolo. */
export function pickFeatureSymbol(rng: Rng): number {
  const pool = SYMBOLS.slice(0, WILD);
  const total = pool.reduce((a, s) => a + s.w, 0);
  let r = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= pool[i].w;
    if (r <= 0) return i;
  }
  return 0;
}

export interface FeatureRound {
  /** Resultado de cada casa aberta neste giro (EMPTY = não travou). */
  stops: { cell: number; value: number }[];
  grid: Grid;
}

export interface FeatureResult {
  sym: number;
  rounds: FeatureRound[];
  grid: Grid;
  result: SpinResult;
}

/**
 * Rodada Especial completa: até FEAT_SPINS giros; em cada um, as casas abertas travam com o símbolo
 * sorteado (15%) ou curinga (4%). Termina antes se as 9 travarem. Paga no mínimo FEAT_MIN × aposta.
 */
export function playFeature(rng: Rng, bet: number): FeatureResult {
  const sym = pickFeatureSymbol(rng);
  const grid: Grid = Array(9).fill(EMPTY);
  const rounds: FeatureRound[] = [];
  let left = FEAT_SPINS;
  while (left > 0 && grid.some(v => v === EMPTY)) {
    left--;
    const open = STOP_ORDER.filter(i => grid[i] === EMPTY);
    const stops = open.map(cell => {
      const r = rng();
      return { cell, value: r < FEAT_P_SYM ? sym : r < FEAT_P_SYM + FEAT_P_WILD ? WILD : EMPTY };
    });
    stops.forEach(s => { if (s.value !== EMPTY) grid[s.cell] = s.value; });
    rounds.push({ stops, grid: grid.slice() });
  }
  const result = evaluate(grid, bet);
  if (result.win < bet * FEAT_MIN) result.win = round2(bet * FEAT_MIN);
  return { sym, rounds, grid, result };
}

/** Gerador determinístico (mulberry32) para testes, replays e auditoria do servidor. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
